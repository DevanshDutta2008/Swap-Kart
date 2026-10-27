import { Router } from 'express';
import Item from '../models/Item.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';
import { tryReserve, releasePatch } from '../services/reservation.js';

const r = Router();
r.use(requireAuth);
const STATUS = { OWN_ITEM: 400, SOLD: 409, HELD_BY_OTHER: 409 };
const MSG = {
  OWN_ITEM: 'You can not buy your own item.',
  SOLD: 'This item has already been sold.',
  HELD_BY_OTHER: 'Someone else is checking out with this item. Try again in a few minutes.',
};

r.post('/:itemId', asyncH(async (req, res) => {
  const item = await Item.findById(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'NOT_FOUND', message: 'This item is no longer listed.' });
  const now = new Date();
  const check = tryReserve(item, req.user.id, String(item.seller) === req.user.id, now);
  if (!check.ok) return res.status(STATUS[check.reason]).json({ error: check.reason, message: MSG[check.reason] });
  if (check.alreadyHeld) return res.json({ item });
  // The database does the final check, so two buyers clicking at once can not both win.
  const locked = await Item.findOneAndUpdate(
    { _id: item._id, $or: [{ status: 'available' }, { status: 'reserved', reservedUntil: { $lte: now } }] },
    check.patch, { new: true });
  if (!locked) return res.status(409).json({ error: 'HELD_BY_OTHER', message: MSG.HELD_BY_OTHER });
  res.status(201).json({ item: locked });
}));

r.delete('/:itemId', asyncH(async (req, res) => {
  await Item.updateOne({ _id: req.params.itemId, status: 'reserved', reservedBy: req.user.id }, releasePatch());
  res.json({ ok: true });
}));
export default r;
