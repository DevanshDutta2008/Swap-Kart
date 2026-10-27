import test from 'node:test';
import assert from 'node:assert/strict';
import { tryReserve, needsRelease, HOLD_MINUTES } from '../src/services/reservation.js';
import { applyAction, validateAmount } from '../src/services/offers.js';
import { canMove, confirmHandover } from '../src/services/orders.js';

const now = new Date('2026-10-27T10:00:00Z');
const item = (o = {}) => ({ status: 'available', ...o });

test('reserve locks item for the hold window', () => {
  const r = tryReserve(item(), 'b1', false, now);
  assert.ok(r.ok);
  assert.equal(r.patch.reservedUntil.getTime(), now.getTime() + HOLD_MINUTES * 60000);
});
test('second buyer blocked while hold active, allowed after expiry', () => {
  const held = item({ status: 'reserved', reservedBy: 'b1', reservedUntil: new Date(now.getTime() + 5000) });
  assert.equal(tryReserve(held, 'b2', false, now).reason, 'HELD_BY_OTHER');
  const later = new Date(now.getTime() + 10000);
  assert.ok(needsRelease(held, later));
  assert.ok(tryReserve(held, 'b2', false, later).ok);
});
test('cannot reserve own or sold item', () => {
  assert.equal(tryReserve(item(), 's', true, now).reason, 'OWN_ITEM');
  assert.equal(tryReserve(item({ status: 'sold' }), 'b', false, now).reason, 'SOLD');
});
test('offer: seller counters, buyer accepts', () => {
  const o = { status: 'pending', expiresAt: new Date(now.getTime() + 1000) };
  const c = applyAction(o, 'seller', 'counter', { amount: 900, listPrice: 1000, now });
  assert.deepEqual([c.ok, c.status], [true, 'countered']);
  const a = applyAction({ ...o, status: 'countered' }, 'buyer', 'accept', { now });
  assert.equal(a.status, 'accepted');
});
test('offer: wrong turn, expired, closed and bad amounts rejected', () => {
  assert.equal(applyAction({ status: 'pending' }, 'buyer', 'accept').reason, 'NOT_YOUR_TURN');
  assert.equal(applyAction({ status: 'pending', expiresAt: new Date(0) }, 'seller', 'accept', { now }).reason, 'OFFER_EXPIRED');
  assert.equal(applyAction({ status: 'accepted' }, 'seller', 'accept').reason, 'OFFER_CLOSED');
  assert.equal(validateAmount(1200, 1000), 'ABOVE_LIST_PRICE');
  assert.equal(validateAmount(100, 1000), 'TOO_LOW');
  assert.equal(validateAmount(NaN, 1000), 'INVALID_AMOUNT');
});
test('order lifecycle and two-sided handover', () => {
  assert.ok(canMove('pending_payment', 'paid'));
  assert.ok(!canMove('completed', 'paid'));
  let r = confirmHandover({ status: 'paid', confirmed: {} }, 'buyer');
  assert.equal(r.status, 'paid');
  r = confirmHandover({ status: 'paid', confirmed: r.confirmed }, 'seller');
  assert.equal(r.status, 'completed');
  assert.equal(confirmHandover({ status: 'pending_payment' }, 'buyer').reason, 'NOT_PAID');
});
