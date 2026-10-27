// These checks need no database: they cover validation, login-required and error shapes.
process.env.JWT_SECRET = 'test-secret';
import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';

let server, base;
test.before(async () => { server = app.listen(0); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());
const call = (path, opts = {}) => fetch(base + path, { headers: { 'content-type': 'application/json', ...opts.headers }, ...opts });

test('health works', async () => assert.equal((await call('/api/health')).status, 200));
test('unknown route gives clean 404', async () => {
  const r = await call('/api/nope'); assert.equal(r.status, 404);
  assert.equal((await r.json()).error, 'NOT_FOUND');
});
test('register rejects weak password and bad email with field details', async () => {
  const r = await call('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Dev', email: 'nope', password: '123' }) });
  assert.equal(r.status, 400);
  const fields = (await r.json()).fields.map(f => f.field).sort();
  assert.deepEqual(fields, ['email', 'password']);
});
test('creating an item without login is blocked', async () => {
  assert.equal((await call('/api/items', { method: 'POST', body: '{}' })).status, 401);
});
test('bad token is rejected', async () => {
  const r = await call('/api/auth/me', { headers: { authorization: 'Bearer garbage' } });
  assert.equal(r.status, 401);
});
test('logged-in user still gets validation errors on bad item', async () => {
  const token = jwt.sign({ id: 'u1', role: 'user' }, 'test-secret');
  const r = await call('/api/items', { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify({ title: 'x', price: -5, category: 'cars' }) });
  assert.equal(r.status, 400);
});
test('bad browse filter is rejected', async () => {
  assert.equal((await call('/api/items?limit=9999')).status, 400);
});
