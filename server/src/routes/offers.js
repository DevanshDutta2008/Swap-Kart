import { Router } from 'express';
import { z } from 'zod';
import Offer from '../models/Offer.js';
import Item from '../models/Item.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, asyncH } from '../middleware/error.js';
import { applyAction, validateAmount, newExpiry, OPEN } from '../services/offers.js';
import { notify } from '../services/notify.js';

const r = Router();
r.use(requireAuth);

const MSG = {
  INVALID_AMOUNT: 'Enter a valid amount.', ABOVE_LIST_PRICE: 'An offer can not be higher than the listed price.',
  TOO_LOW: 'That offer is too low. Offer at least 40% of the listed price.', OFFER_CLOSED: 'This offer is already closed.',
  OFFER_EXPIRED: 'This offer has expired.', NOT_YOUR_TURN: 'It is not your turn to respond to this offer.',
};
const bad = (res, reason, code = 400) => res.status(reason === 'NOT_YOUR_TURN' || reason.startsWith('OFFER_') ? 409 : code).json({ error: reason, message: MSG[reason] });

const createSchema = z.object({ itemId: z.string().length(24), amount: z.coerce.number().int() });
const actionSchema = z.object({ action: z.enum(['accept', 'reject', 'counter', 'withdraw']) });
const bodySchema = z.object({ amount: z.coerce.number().int().optional() });

r.post('/', validate(createSchema), asyncH(async (req, res) => {
  const { itemId, amount } = req.body;
  const item = await Item.findById(itemId);
  if (!item) return res.status(404).json({ error: 'NOT_FOUND', message: 'This item is no longer listed.' });
  if (String(item.seller) === req.user.id) return res.status(400).json({ error: 'OWN_ITEM', message: 'You can not make an offer on your own item.' });
  if (item.status === 'sold') return res.status(409).json({ error: 'SOLD', message: 'This item has already been sold.' });
  const err = validateAmount(amount, item.price);
  if (err) return bad(res, err);
  if (await Offer.exists({ item: item._id, buyer: req.user.id, status: { $in: OPEN }, expiresAt: { $gt: new Date() } }))
    return res.status(409).json({ error: 'OFFER_EXISTS', message: 'You already have an open offer on this item.' });
  const offer = await Offer.create({
    item: item._id, buyer: req.user.id, seller: item.seller, amount, expiresAt: newExpiry(),
    history: [{ by: 'buyer', action: 'offer', amount }],
  });
  await notify(item.seller, 'offer', `New offer of ₹${amount} on "${item.title}".`, item._id);
  res.status(201).json({ offer });
}));

r.get('/', asyncH(async (req, res) => {
  const role = req.query.role;
  const f = role === 'buyer' ? { buyer: req.user.id } : role === 'seller' ? { seller: req.user.id }
    : { $or: [{ buyer: req.user.id }, { seller: req.user.id }] };
  const offers = await Offer.find(f).sort({ updatedAt: -1 }).populate('item', 'title price status images')
    .populate('buyer', 'name').populate('seller', 'name');
  res.json({ offers });
}));

r.post('/:id/:action', validate(actionSchema, 'params'), validate(bodySchema), asyncH(async (req, res) => {
  const { id, action } = req.params;
  const offer = await Offer.findById(id);
  if (!offer) return res.status(404).json({ error: 'NOT_FOUND', message: 'Offer not found.' });
  const actor = String(offer.buyer) === req.user.id ? 'buyer' : String(offer.seller) === req.user.id ? 'seller' : null;
  if (!actor) return res.status(403).json({ error: 'FORBIDDEN', message: 'This offer is not yours.' });
  const item = await Item.findById(offer.item);
  if (!item || item.status === 'sold') return bad(res, 'OFFER_CLOSED');

  const out = applyAction(offer, actor, action, { amount: req.body.amount, listPrice: item.price });
  if (!out.ok) return bad(res, out.reason);

  const amount = out.amount ?? offer.amount;
  // Only update if nobody else changed the offer in the meantime.
  const updated = await Offer.findOneAndUpdate({ _id: offer._id, status: offer.status },
    { status: out.status, amount, $push: { history: { by: actor, action, amount } } }, { new: true });
  if (!updated) return res.status(409).json({ error: 'CONFLICT', message: 'This offer just changed. Refresh and try again.' });

  const other = actor === 'buyer' ? offer.seller : offer.buyer;
  const text = {
    accept: `Offer accepted at ₹${amount} on "${item.title}". ${actor === 'seller' ? 'Reserve the item and pay to confirm.' : ''}`.trim(),
    reject: `Offer on "${item.title}" was declined.`,
    counter: `Counter-offer of ₹${amount} on "${item.title}".`,
    withdraw: `Offer on "${item.title}" was withdrawn.`,
  }[action];
  await notify(other, 'offer', text, item._id);
  res.json({ offer: updated });
}));
export default r;
