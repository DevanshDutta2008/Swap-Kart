import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'countered', 'accepted', 'rejected', 'withdrawn'], default: 'pending' },
  expiresAt: { type: Date, required: true },
  history: [{ by: String, action: String, amount: Number, at: { type: Date, default: Date.now } }],
}, { timestamps: true });
export default mongoose.model('Offer', schema);
