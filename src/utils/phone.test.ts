import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPhoneDisplay, isIsraeliMobile, toE164IL } from './phone.ts';

test('toE164IL accepts local 05 numbers', () => {
  assert.equal(toE164IL('0501234567'), '+972501234567');
  assert.equal(toE164IL('050-123-4567'), '+972501234567');
});

test('toE164IL accepts 972 without plus', () => {
  assert.equal(toE164IL('972501234567'), '+972501234567');
});

test('toE164IL accepts E.164 +972', () => {
  assert.equal(toE164IL('+972501234567'), '+972501234567');
  assert.equal(toE164IL('+972 50 123 4567'), '+972501234567');
});

test('toE164IL rejects landlines and short numbers', () => {
  assert.equal(toE164IL('031234567'), null);
  assert.equal(toE164IL('050123'), null);
  assert.equal(toE164IL('+12025550123'), null);
});

test('isIsraeliMobile and display stay in E.164', () => {
  assert.equal(isIsraeliMobile('05-0123-4567'), true);
  assert.equal(formatPhoneDisplay('0501234567'), '+972501234567');
});
