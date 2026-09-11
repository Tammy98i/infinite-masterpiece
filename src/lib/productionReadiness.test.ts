import assert from 'node:assert/strict';
import { test } from 'node:test';
import { productionReadiness } from './productionReadiness.ts';

test('development is ready without production secrets', () => {
  const result = productionReadiness({ NODE_ENV: 'development' });
  assert.equal(result.ready, true);
  assert.deepEqual(result.missing, []);
});

test('production without APP_URL is not ready', () => {
  const result = productionReadiness({ NODE_ENV: 'production' });
  assert.equal(result.ready, false);
  assert.ok(result.missing.includes('APP_URL'));
  assert.ok(result.missing.includes('SUPABASE_URL'));
});

test('production with canonical URL and supabase keys is ready', () => {
  const result = productionReadiness({
    NODE_ENV: 'production',
    APP_URL: 'https://infinite-masterpiece.co.il',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon',
  });
  assert.equal(result.ready, true);
  assert.deepEqual(result.missing, []);
  assert.ok(result.warnings.includes('STRIPE_SECRET_KEY'));
});
