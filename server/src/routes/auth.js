import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { validate, asyncH } from '../middleware/error.js';

const r = Router();
const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Use at least 8 characters').max(100),
  hostel: z.string().trim().max(60).optional(),
});
const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, hostel: u.hostel, role: u.role });

r.post('/register', validate(registerSchema), asyncH(async (req, res) => {
  const { password, ...rest } = req.body;
  if (await User.exists({ email: rest.email }))
    return res.status(409).json({ error: 'EMAIL_TAKEN', message: 'An account with this email already exists.' });
  const user = await User.create({ ...rest, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: signToken(user), user: pub(user) });
}));

r.post('/login', validate(loginSchema), asyncH(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  const ok = user && await bcrypt.compare(req.body.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'BAD_CREDENTIALS', message: 'Email or password is wrong.' });
  res.json({ token: signToken(user), user: pub(user) });
}));

r.get('/me', requireAuth, asyncH(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Account no longer exists.' });
  res.json({ user: pub(user) });
}));
export default r;
