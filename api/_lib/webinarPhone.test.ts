import assert from 'node:assert/strict';
import test from 'node:test';
import { isIsraeliMobile, isValidEmail, normalizeEmail } from './phone.ts';
import { rateLimit } from './webinarStore.ts';

test('normalizeEmail lowercases and trims', () => {
  assert.equal(normalizeEmail('  A@B.com '), 'a@b.com');
});

test('isValidEmail rejects bad addresses', () => {
  assert.equal(isValidEmail('a@b.com'), true);
  assert.equal(isValidEmail('ab.com'), false);
});

test('isIsraeliMobile accepts 05 and 9725', () => {
  assert.equal(isIsraeliMobile('0501234567'), true);
  assert.equal(isIsraeliMobile('+972501234567'), true);
  assert.equal(isIsraeliMobile('021234567'), false);
});

test('rateLimit blocks after burst', () => {
  const key = `test-${Date.now()}`;
  for (let i = 0; i < 8; i += 1) assert.equal(rateLimit(key, 8, 60_000), true);
  assert.equal(rateLimit(key, 8, 60_000), false);
});
