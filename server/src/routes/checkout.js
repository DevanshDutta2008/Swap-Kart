import { Router } from 'express';
import { z } from 'zod';
import Item from '../models/Item.js';
import Offer from '../models/Offer.js';
import Order from '../models/Order.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, asyncH } from '../middleware/error.js';
import { isHoldActive } from '../services/reservation.js';
import { canMove } from '../services/orders.js';
import { OPEN } from '../services/offers.js';
import { getClient, verifySignature } from '../services/razorpay.js';
import { notify } from '../services/notify.js';

const r = Router();
r.use(requireAuth);

// Step 1: buyer (holding the item) asks for a payment order.
r.post('/:itemId', asyncH(async (req, res) => {
  const item = await Item.findById(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'NOT_FOUND', message: 'This item is no longer listed.' });
  if (!isHoldActive(item) || String(item.reservedBy) !== req.user.id)
    return res.status(409).json({ error: 'NO_HOLD', message: 'Your 10-minute hold has ended. Reserve the item again to continue.' });
  const client = getClient();
  if (!client) return res.status(503).json({ error: 'PAYMENTS_OFF', message: 'Payments are not set up yet.' });

  // If the seller accepted an offer, the agreed price is what gets charged.
  const deal = await Offer.findOne({ item: item._id, buyer: req.user.id, status: 'accepted' }).sort({ updatedAt: -1 });
  const amount = deal ? deal.amount : item.price;

  let order = await Order.findOne({ item: item._id, buyer: req.user.id, status: 'pending_payment' });
  if (order && order.amount === amount && order.razorpayOrderId) // pressing "Pay" twice reuses the same order
    return res.json({ orderId: order._id, razorpayOrderId: order.razorpayOrderId, amount, keyId: process.env.RAZORPAY_KEY_ID });

  let rp;
  try {
    rp = await client.orders.create({ amount: amount * 100, currency: 'INR', receipt: `sk_${item._id}`.slice(0, 40) });
  } catch (e) {
    console.error('Razorpay create failed', e?.error || e);
    return res.status(502).json({ error: 'PAYMENT_PROVIDER_FAILED', message: 'Could not reach the payment service. Please try again.' });
  }
  if (order) { order.amount = amount; order.razorpayOrderId = rp.id; order.offer = deal?._id ?? null; await order.save(); }
  else order = await Order.create({ item: item._id, buyer: req.user.id, seller: item.seller, amount, offer: deal?._id ?? null, razorpayOrderId: rp.id });
  res.status(201).json({ orderId: order._id, razorpayOrderId: rp.id, amount, keyId: process.env.RAZORPAY_KEY_ID });
}));

const verifySchema = z.object({ razorpayOrderId: z.string().min(5), razorpayPaymentId: z.string().min(5), razorpaySignature: z.string().min(10) });

// Step 2: after the Razorpay popup succeeds, confirm the payment is real.
r.post('/verify/payment', validate(verifySchema), asyncH(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const order = await Order.findOne({ razorpayOrderId, buyer: req.user.id });
  if (!order) return res.status(404).json({ error: 'NOT_FOUND', message: 'No order found for this payment.' });
  if (order.status === 'paid' || order.status === 'completed') return res.json({ order }); // safe to call twice
  if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature))
    return res.status(400).json({ error: 'BAD_SIGNATURE', message: 'We could not confirm this payment.' });

  const item = await Item.findOneAndUpdate(
    { _id: order.item, $or: [{ status: 'reserved', reservedBy: req.user.id }, { status: 'available' }] },
    { status: 'sold', reservedBy: null, reservedUntil: null }, { new: true });
  if (!item) { // someone else bought it while the payment was in flight
    if (canMove(order.status, 'cancelled')) { order.status = 'cancelled'; order.razorpayPaymentId = razorpayPaymentId; await order.save(); }
    return res.status(409).json({ error: 'ITEM_GONE', message: 'This item was sold to someone else. Your payment will be refunded.' });
  }
  const paid = await Order.findOneAndUpdate({ _id: order._id, status: 'pending_payment' },
    { status: 'paid', razorpayPaymentId }, { new: true });
  await Offer.updateMany({ item: item._id, status: { $in: OPEN } }, { status: 'rejected' });
  await notify(order.seller, 'order', `"${item.title}" was bought for ₹${order.amount}. Arrange the handover.`, item._id);
  await notify(order.buyer, 'order', `Payment received for "${item.title}". Meet the seller and confirm the handover.`, item._id);
  res.json({ order: paid || order });
}));
export default r;
