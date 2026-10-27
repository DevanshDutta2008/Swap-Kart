import { Router } from 'express';
import { z } from 'zod';
import Item from '../models/Item.js';
import Wishlist from '../models/Wishlist.js';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, asyncH } from '../middleware/error.js';
import { releasePatch } from '../services/reservation.js';

const r = Router();
const CATS = ['books', 'electronics', 'furniture', 'clothing', 'cycles', 'other'];
const CONDS = ['new', 'like-new', 'good', 'fair'];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(2000).optional(),
  category: z.enum(CATS), condition: z.enum(CONDS),
  price: z.coerce.number().int().min(1).max(500000),
  images: z.array(z.string().url()).max(5).optional(),
});
const updateSchema = createSchema.partial().refine(o => Object.keys(o).length > 0, 'Nothing to update');
const listSchema = z.object({
  q: z.string().trim().max(60).optional(), category: z.enum(CATS).optional(), condition: z.enum(CONDS).optional(),
  minPrice: z.coerce.number().min(0).optional(), maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(12),
});
const SORTS = { newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 } };

// Expired holds go back on sale whenever anyone browses.
const sweepHolds = () => Item.updateMany({ status: 'reserved', reservedUntil: { $lte: new Date() } }, releasePatch());

r.get('/', validate(listSchema, 'query'), asyncH(async (req, res) => {
  await sweepHolds();
  const { q, category, condition, minPrice, maxPrice, sort, page, limit } = req.query;
  const f = { status: { $ne: 'sold' } };
  if (q) f.$or = [{ title: new RegExp(esc(q), 'i') }, { description: new RegExp(esc(q), 'i') }];
  if (category) f.category = category;
  if (condition) f.condition = condition;
  if (minPrice != null || maxPrice != null) f.price = { ...(minPrice != null && { $gte: minPrice }), ...(maxPrice != null && { $lte: maxPrice }) };
  const [items, total] = await Promise.all([
    Item.find(f).sort(SORTS[sort]).skip((page - 1) * limit).limit(limit).populate('seller', 'name hostel'),
    Item.countDocuments(f),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

r.get('/:id', asyncH(async (req, res) => {
  await sweepHolds();
  const item = await Item.findById(req.params.id).populate('seller', 'name hostel');
  if (!item) return res.status(404).json({ error: 'NOT_FOUND', message: 'This item is no longer listed.' });
  res.json({ item });
}));

r.post('/', requireAuth, validate(createSchema), asyncH(async (req, res) => {
  const item = await Item.create({ ...req.body, seller: req.user.id });
  res.status(201).json({ item });
}));

r.patch('/:id', requireAuth, validate(updateSchema), asyncH(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'NOT_FOUND', message: 'Item not found.' });
  if (String(item.seller) !== req.user.id) return res.status(403).json({ error: 'FORBIDDEN', message: 'Only the seller can edit this item.' });
  if (item.status !== 'available') return res.status(409).json({ error: 'ITEM_LOCKED', message: 'You can not edit an item that is reserved or sold.' });
  const oldPrice = item.price;
  Object.assign(item, req.body);
  await item.save();
  if (item.price < oldPrice) { // tell everyone who saved it
    const saved = await Wishlist.find({ item: item._id });
    await Notification.insertMany(saved.map(w => ({
      user: w.user, type: 'price_drop', item: item._id,
      message: `"${item.title}" dropped from ₹${oldPrice} to ₹${item.price}.`,
    })));
  }
  res.json({ item });
}));

r.delete('/:id', requireAuth, asyncH(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'NOT_FOUND', message: 'Item not found.' });
  if (String(item.seller) !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Only the seller can remove this item.' });
  if (item.status !== 'available') return res.status(409).json({ error: 'ITEM_LOCKED', message: 'A reserved or sold item can not be removed.' });
  await item.deleteOne();
  await Wishlist.deleteMany({ item: item._id });
  res.json({ ok: true });
}));
export default r;
