import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true },
  offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
  status: { type: String, enum: ['pending_payment', 'paid', 'completed', 'cancelled', 'refund_due'], default: 'pending_payment' },
  razorpayOrderId: { type: String, index: true },
  razorpayPaymentId: String,
  confirmed: { buyer: { type: Boolean, default: false }, seller: { type: Boolean, default: false } },
}, { timestamps: true });
export default mongoose.model('Order', schema);
