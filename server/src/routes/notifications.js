import { Router } from 'express';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';

const r = Router();
r.use(requireAuth);

r.get('/', asyncH(async (req, res) => {
  const [notifications, unread] = await Promise.all([
    Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ user: req.user.id, read: false }),
  ]);
  res.json({ notifications, unread });
}));
r.patch('/read-all', asyncH(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json({ ok: true });
}));
r.patch('/:id/read', asyncH(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user.id }, { read: true });
  res.json({ ok: true });
}));
export default r;
