import assert from 'node:assert/strict';
import test from 'node:test';
import { canUserChangePlan, trialEndDate } from './subscriptionPolicy.js';

test('users can start one trial or cancel access', () => {
  assert.equal(canUserChangePlan('none', 'free_trial'), true);
  assert.equal(canUserChangePlan('monthly', 'none'), true);
});

test('users cannot grant themselves a paid plan or repeat a trial', () => {
  assert.equal(canUserChangePlan('none', 'monthly'), false);
  assert.equal(canUserChangePlan('free_trial', 'free_trial'), false);
  assert.equal(canUserChangePlan('none', 'premium_88'), false);
});

test('trial expiration is calculated by the server', () => {
  assert.equal(trialEndDate(new Date('2026-01-01T00:00:00.000Z')), '2026-01-15T00:00:00.000Z');
});
