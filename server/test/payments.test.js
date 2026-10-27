process.env.JWT_SECRET = 'test-secret';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { verifySignature } from '../src/services/razorpay.js';
import app from '../src/app.js';

const sign = (o, p, s) => crypto.createHmac('sha256', s).update(`${o}|${p}`).digest('hex');
test('genuine Razorpay signature passes', () => assert.ok(verifySignature('order_1', 'pay_1', sign('order_1', 'pay_1', 'sec'), 'sec')));
test('tampered or missing signatures fail', () => {
  assert.ok(!verifySignature('order_1', 'pay_2', sign('order_1', 'pay_1', 'sec'), 'sec'));
  assert.ok(!verifySignature('order_1', 'pay_1', 'abc', 'sec'));
  assert.ok(!verifySignature('order_1', 'pay_1', sign('order_1', 'pay_1', 'sec'), ''));
});

let server, base;
const auth = { authorization: `Bearer ${jwt.sign({ id: 'u1', role: 'user' }, 'test-secret')}` };
test.before(() => { server = app.listen(0); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());
const call = (p, method = 'GET', body, h = {}) => fetch(base + p, { method, headers: { 'content-type': 'application/json', ...h }, body: body && JSON.stringify(body) });

test('checkout and order routes need login', async () => {
  for (const [m, p] of [['POST', '/api/checkout/abc'], ['POST', '/api/checkout/verify/payment'], ['GET', '/api/orders'], ['POST', '/api/orders/abc/confirm'], ['POST', '/api/orders/abc/cancel']])
    assert.equal((await call(p, m)).status, 401, `${m} ${p}`);
});
test('payment verification rejects incomplete data', async () => {
  assert.equal((await call('/api/checkout/verify/payment', 'POST', { razorpayOrderId: 'x' }, auth)).status, 400);
});
