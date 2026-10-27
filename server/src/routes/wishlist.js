import { Router } from 'express';
import Wishlist from '../models/Wishlist.js';
import Item from '../models/Item.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';

const r = Router();
r.use(requireAuth);

r.get('/', asyncH(async (req, res) => {
  const rows = await Wishlist.find({ user: req.user.id }).sort({ createdAt: -1 }).populate('item');
  // Items deleted by their seller silently drop off the list.
  res.json({ wishlist: rows.filter(w => w.item).map(w => ({ id: w._id, priceWhenSaved: w.priceWhenSaved, item: w.item })) });
}));

r.post('/:itemId', asyncH(async (req, res) => {
  const item = await Item.findById(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'NOT_FOUND', message: 'This item is no longer listed.' });
  if (String(item.seller) === req.user.id) return res.status(400).json({ error: 'OWN_ITEM', message: 'You can not save your own item.' });
  await Wishlist.updateOne({ user: req.user.id, item: item._id }, { $setOnInsert: { priceWhenSaved: item.price } }, { upsert: true });
  res.status(201).json({ ok: true });
}));

r.delete('/:itemId', asyncH(async (req, res) => {
  await Wishlist.deleteOne({ user: req.user.id, item: req.params.itemId });
  res.json({ ok: true });
}));
export default r;
