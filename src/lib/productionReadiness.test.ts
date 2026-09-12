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
  assert.ok(result.warnings.includes('A11Y_CONTACT_PHONE'));
  assert.ok(result.warnings.includes('A11Y_COORDINATOR_NAME'));
});

test('production warns when Stripe is on without library prices', () => {
  const result = productionReadiness({
    NODE_ENV: 'production',
    APP_URL: 'https://infinite-masterpiece.co.il',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon',
    STRIPE_SECRET_KEY: 'sk_test_x',
    A11Y_COORDINATOR_NAME: 'רכז/ת נגישות',
  });
  assert.equal(result.ready, true);
  assert.ok(result.warnings.includes('LIBRARY_MONTHLY_ILS'));
  assert.ok(result.warnings.includes('A11Y_COORDINATOR_NAME'));
});
