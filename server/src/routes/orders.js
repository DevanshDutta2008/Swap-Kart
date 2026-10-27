import { Router } from 'express';
import Order from '../models/Order.js';
import Item from '../models/Item.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';
import { confirmHandover, canMove } from '../services/orders.js';
import { releasePatch } from '../services/reservation.js';
import { notify } from '../services/notify.js';

const r = Router();
r.use(requireAuth);
const actorOf = (o, id) => (String(o.buyer) === id ? 'buyer' : String(o.seller) === id ? 'seller' : null);

r.get('/', asyncH(async (req, res) => {
  const role = req.query.role;
  const f = role === 'buyer' ? { buyer: req.user.id } : role === 'seller' ? { seller: req.user.id }
    : { $or: [{ buyer: req.user.id }, { seller: req.user.id }] };
  const orders = await Order.find(f).sort({ createdAt: -1 }).populate('item', 'title images').populate('buyer', 'name').populate('seller', 'name');
  res.json({ orders });
}));

r.get('/:id', asyncH(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('item', 'title images').populate('buyer', 'name hostel').populate('seller', 'name hostel');
  if (!order || !actorOf({ buyer: order.buyer._id, seller: order.seller._id }, req.user.id))
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found.' }); // do not reveal other people's orders
  res.json({ order });
}));

r.post('/:id/confirm', asyncH(async (req, res) => {
  const order = await Order.findById(req.params.id);
  const actor = order && actorOf(order, req.user.id);
  if (!actor) return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found.' });
  const out = confirmHandover(order, actor);
  if (!out.ok) return res.status(409).json({ error: out.reason, message: 'Only paid orders can be confirmed.' });
  const updated = await Order.findOneAndUpdate({ _id: order._id, status: 'paid' },
    { [`confirmed.${actor}`]: true, status: out.status }, { new: true });
  const other = actor === 'buyer' ? order.seller : order.buyer;
  await notify(other, 'order', out.status === 'completed' ? 'Handover confirmed by both sides. Order complete.' : `The ${actor} confirmed the handover. Your turn to confirm.`, order.item);
  res.json({ order: updated });
}));

// Buyer backs out before paying: the item goes back on sale.
r.post('/:id/cancel', asyncH(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || String(order.buyer) !== req.user.id) return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found.' });
  if (!canMove(order.status, 'cancelled')) return res.status(409).json({ error: 'CANNOT_CANCEL', message: 'Only unpaid orders can be cancelled.' });
  order.status = 'cancelled'; await order.save();
  await Item.updateOne({ _id: order.item, status: 'reserved', reservedBy: req.user.id }, releasePatch());
  res.json({ order });
}));
export default r;
