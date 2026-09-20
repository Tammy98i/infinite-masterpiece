import assert from 'node:assert/strict';
import test from 'node:test';
import { productionEnvironmentErrors } from './production.js';

const valid = {
  NODE_ENV: 'production',
  APP_URL: 'https://example.co.il',
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  RESEND_API_KEY: 're_key',
  EMAIL_FROM: 'Infinite Masterpiece <hello@example.co.il>',
};

test('development does not require production integrations', () => {
  assert.deepEqual(productionEnvironmentErrors({ NODE_ENV: 'development' }), []);
});

test('production requires HTTPS, Supabase and Resend', () => {
  const errors = productionEnvironmentErrors({ NODE_ENV: 'production', APP_URL: 'http://localhost:3000' });
  assert.ok(errors.some((error) => error.includes('HTTPS')));
  assert.ok(errors.some((error) => error.includes('SUPABASE_URL')));
  assert.ok(errors.some((error) => error.includes('RESEND_API_KEY')));
});

test('complete production environment passes validation', () => {
  assert.deepEqual(productionEnvironmentErrors(valid), []);
});
