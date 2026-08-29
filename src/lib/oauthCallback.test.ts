import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldExchangeAuthCode } from './oauthCallback.ts';

test('does not exchange a PKCE code when the session already exists', () => {
  assert.equal(shouldExchangeAuthCode(true, 'abc'), false);
});

test('exchanges a PKCE code when the callback has no session yet', () => {
  assert.equal(shouldExchangeAuthCode(false, 'abc'), true);
});

test('does not exchange when the callback has no code', () => {
  assert.equal(shouldExchangeAuthCode(false, null), false);
});
