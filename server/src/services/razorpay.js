import crypto from 'node:crypto';
import Razorpay from 'razorpay';

export function getClient() {
  const { RAZORPAY_KEY_ID: id, RAZORPAY_KEY_SECRET: secret } = process.env;
  if (!id || !secret) return null;
  return new Razorpay({ key_id: id, key_secret: secret });
}

// Razorpay signs "orderId|paymentId" with our secret. We recompute it and compare.
export function verifySignature(orderId, paymentId, signature, secret = process.env.RAZORPAY_KEY_SECRET) {
  if (!secret || !orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
