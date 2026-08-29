import assert from 'node:assert/strict';
import test from 'node:test';
import { jsonBody } from './body.ts';

test('jsonBody parses a string payload on Vercel', () => {
  assert.equal(jsonBody({ body: '{"email":"a@b.com","password":"x"}' }).email, 'a@b.com');
});

test('jsonBody keeps an object payload', () => {
  assert.equal(jsonBody({ body: { accessToken: 'tok' } }).accessToken, 'tok');
});

test('jsonBody parses a Buffer payload', () => {
  assert.equal(jsonBody({ body: Buffer.from('{"email":"a@b.com"}') }).email, 'a@b.com');
});
