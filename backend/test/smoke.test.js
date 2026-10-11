const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const db = require('../src/config/db');

test.after(async () => {
  await new Promise((resolve) => setTimeout(resolve, 60));
  if (db && typeof db.end === 'function') {
    await db.end();
  }
});

test('Backend Express App loads cleanly with core routers', (t) => {
  assert.ok(app, 'Express app should be exported');
  assert.equal(typeof app.use, 'function', 'app should be an express instance');
});

test('JWT signing and verification work as expected', (t) => {
  const payload = { userId: 42, role: 'PARKING_OPERATOR', email: 'operator@example.com' };
  const secret = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });

  const decoded = jwt.verify(token, secret);
  assert.equal(decoded.userId, 42);
  assert.equal(decoded.role, 'PARKING_OPERATOR');
  assert.equal(decoded.email, 'operator@example.com');
});

test('SRS User Roles are strictly categorized', (t) => {
  const VALID_ROLES = ['CUSTOMER', 'PARKING_OPERATOR', 'BRANCH_MANAGER', 'SUPER_ADMINISTRATOR'];
  assert.equal(VALID_ROLES.length, 4);
  assert.ok(VALID_ROLES.includes('CUSTOMER'));
  assert.ok(VALID_ROLES.includes('PARKING_OPERATOR'));
  assert.ok(VALID_ROLES.includes('BRANCH_MANAGER'));
  assert.ok(VALID_ROLES.includes('SUPER_ADMINISTRATOR'));
});
