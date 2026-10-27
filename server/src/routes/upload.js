import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';

const r = Router();
const uploadsDir = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Accepts base64 image data: { data: "data:image/png;base64,...", name: "jacket.png" }
r.post('/', requireAuth, asyncH(async (req, res) => {
  const { data, name } = req.body || {};
  if (!data || typeof data !== 'string') {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'No image data provided.' });
  }

  const match = data.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Invalid image format. Expected base64 image data.' });
  }

  let ext = match[1].toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  // sanitize extension
  if (!['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext)) {
    ext = 'jpg';
  }

  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'TOO_LARGE', message: 'Image must be under 10MB.' });
  }

  const filename = `item_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(filePath, buffer);

  res.status(201).json({ url: `/uploads/${filename}` });
}));

export default r;
