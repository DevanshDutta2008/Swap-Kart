import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['price_drop', 'offer', 'order', 'reservation'], required: true },
  message: { type: String, required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  read: { type: Boolean, default: false },
}, { timestamps: true });
export default mongoose.model('Notification', schema);
