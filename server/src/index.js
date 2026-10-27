import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

for (const k of ['MONGO_URI', 'JWT_SECRET']) if (!process.env[k]) { console.error(`Missing ${k} in .env`); process.exit(1); }
await mongoose.connect(process.env.MONGO_URI);
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`SwapKart API on :${port}`));
