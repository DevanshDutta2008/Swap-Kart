process.env.JWT_SECRET = 'test-secret';
import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';

let server, base;
const token = jwt.sign({ id: 'u1', role: 'user' }, 'test-secret');
const auth = { authorization: `Bearer ${token}` };
test.before(() => { server = app.listen(0); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());
const call = (p, method = 'GET', body, headers = {}) =>
  fetch(base + p, { method, headers: { 'content-type': 'application/json', ...headers }, body: body && JSON.stringify(body) });

test('every new route needs login', async () => {
  for (const [m, p] of [['GET', '/api/wishlist'], ['POST', '/api/wishlist/abc'], ['GET', '/api/offers'],
    ['POST', '/api/offers'], ['POST', '/api/offers/abc/accept'], ['POST', '/api/reservations/abc'], ['GET', '/api/notifications']])
    assert.equal((await call(p, m)).status, 401, `${m} ${p}`);
});
test('offer needs a valid item id and numeric amount', async () => {
  assert.equal((await call('/api/offers', 'POST', { itemId: 'short', amount: 'abc' }, auth)).status, 400);
});
test('unknown offer action is rejected before touching the database', async () => {
  const r = await call('/api/offers/' + 'a'.repeat(24) + '/steal', 'POST', {}, auth);
  assert.equal(r.status, 400);
});
