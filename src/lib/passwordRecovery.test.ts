import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearPasswordRecovery,
  markExpectedPasswordRecovery,
  markPasswordRecovery,
  shouldOpenPasswordReset,
  takeExpectedPasswordRecovery,
  takePasswordRecovery,
} from './passwordRecovery.ts';

function withSessionStorage(fn: () => void) {
  const store: Record<string, string> = {};
  const previous = (globalThis as { sessionStorage?: Storage }).sessionStorage;
  (globalThis as { sessionStorage: Storage }).sessionStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
    key: () => null,
    length: 0,
  };
  try {
    fn();
  } finally {
    if (previous) (globalThis as { sessionStorage: Storage }).sessionStorage = previous;
    else delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
  }
}

test('takePasswordRecovery consumes the recovery flag once', () => {
  withSessionStorage(() => {
    markPasswordRecovery();
    assert.equal(takePasswordRecovery(), true);
    assert.equal(takePasswordRecovery(), false);
  });
});

test('shouldOpenPasswordReset honors the expected-recovery flag from forgot-password', () => {
  withSessionStorage(() => {
    markExpectedPasswordRecovery();
    assert.equal(shouldOpenPasswordReset(false), true);
    assert.equal(takeExpectedPasswordRecovery(), false);
  });
});

test('shouldOpenPasswordReset honors type=recovery on the callback URL', () => {
  withSessionStorage(() => {
    assert.equal(shouldOpenPasswordReset(true), true);
  });
});

test('clearPasswordRecovery drops both flags', () => {
  withSessionStorage(() => {
    markPasswordRecovery();
    markExpectedPasswordRecovery();
    clearPasswordRecovery();
    assert.equal(takePasswordRecovery(), false);
    assert.equal(takeExpectedPasswordRecovery(), false);
  });
});
