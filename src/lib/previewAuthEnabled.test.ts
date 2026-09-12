import assert from 'node:assert/strict';
import { test } from 'node:test';
import { previewAuthEnabledFromEnv } from './previewAuthEnabled.ts';

test('preview auth on in Vite dev even if NODE_ENV is production', () => {
  assert.equal(previewAuthEnabledFromEnv({ NODE_ENV: 'production' }, { viteDev: true }), true);
});

test('preview auth off in production without a flag', () => {
  assert.equal(previewAuthEnabledFromEnv({ NODE_ENV: 'production' }, { viteDev: false }), false);
});

test('ALLOW_PREVIEW_LOGIN forces on in production', () => {
  assert.equal(
    previewAuthEnabledFromEnv({ NODE_ENV: 'production', ALLOW_PREVIEW_LOGIN: 'true' }, { viteDev: false }),
    true
  );
});

test('ALLOW_PREVIEW_LOGIN=false forces off in development', () => {
  assert.equal(
    previewAuthEnabledFromEnv({ NODE_ENV: 'development', ALLOW_PREVIEW_LOGIN: '0' }, { viteDev: false }),
    false
  );
});
