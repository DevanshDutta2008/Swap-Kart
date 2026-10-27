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
  [asha, 'Data Structures textbook (CLRS)', 'books', 'good', 650],
  [asha, 'Study table with drawer', 'furniture', 'fair', 1800],
  [ravi, 'Hero Sprint cycle, 21 gear', 'cycles', 'good', 4500],
  [ravi, 'Casio scientific calculator', 'electronics', 'like-new', 700],
  [ravi, 'Winter jacket, size M', 'clothing', 'like-new', 900],
];
for (const [seller, title, category, condition, price] of items)
  await Item.updateOne({ seller: seller._id, title }, { $setOnInsert: { category, condition, price, description: 'Demo listing.' } }, { upsert: true });
console.log('Seeded. Log in with asha@demo.test or ravi@demo.test, password demo12345');
await mongoose.disconnect();
