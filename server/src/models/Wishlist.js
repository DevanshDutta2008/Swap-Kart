import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  priceWhenSaved: { type: Number, required: true },
}, { timestamps: true });
schema.index({ user: 1, item: 1 }, { unique: true }); // saving twice is impossible
export default mongoose.model('Wishlist', schema);
