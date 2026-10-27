// Adds two demo users and a few items. Safe to run twice. Usage: npm run seed
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Item from './src/models/Item.js';

await mongoose.connect(process.env.MONGO_URI);
const hash = await bcrypt.hash('demo12345', 10);
const [asha, ravi] = await Promise.all([
  ['Asha Rao', 'asha@demo.test', 'Block A'], ['Ravi Kumar', 'ravi@demo.test', 'Block C'],
].map(([name, email, hostel]) => User.findOneAndUpdate({ email }, { $setOnInsert: { name, email, hostel, passwordHash: hash } }, { upsert: true, new: true })));
const items = [
  [asha, 'Data Structures textbook (CLRS)', 'books', 'good', 650, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80'],
  [asha, 'Study table with drawer', 'furniture', 'fair', 1800, 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80'],
  [ravi, 'Hero Sprint cycle, 21 gear', 'cycles', 'good', 4500, 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80'],
  [ravi, 'Casio scientific calculator', 'electronics', 'like-new', 700, 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80'],
  [ravi, 'Winter jacket, size M', 'clothing', 'like-new', 900, 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80'],
];
for (const [seller, title, category, condition, price, image] of items)
  await Item.updateOne(
    { seller: seller._id, title },
    { $set: { category, condition, price, description: 'Demo listing in excellent campus condition.', images: [image] } },
    { upsert: true }
  );
console.log('Seeded. Log in with asha@demo.test or ravi@demo.test, password demo12345');
await mongoose.disconnect();
