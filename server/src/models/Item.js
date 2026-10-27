import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  category: { type: String, required: true, enum: ['books', 'electronics', 'furniture', 'clothing', 'cycles', 'other'], index: true },
  condition: { type: String, required: true, enum: ['new', 'like-new', 'good', 'fair'] },
  price: { type: Number, required: true, min: 1 },
  images: { type: [String], default: [] },
  status: { type: String, enum: ['available', 'reserved', 'sold'], default: 'available', index: true },
  reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reservedUntil: { type: Date, default: null },
}, { timestamps: true });
export default mongoose.model('Item', schema);
