import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isLibraryPaidPricingReady, libraryPlanAmountBeforeVat } from '../constants/libraryPlans.ts';

test('library prices stay unpublished without env amounts', () => {
  delete process.env.LIBRARY_MONTHLY_ILS;
  delete process.env.LIBRARY_ANNUAL_ILS;
  delete process.env.VITE_LIBRARY_MONTHLY_ILS;
  delete process.env.VITE_LIBRARY_ANNUAL_ILS;
  assert.equal(libraryPlanAmountBeforeVat('monthly'), 0);
  assert.equal(isLibraryPaidPricingReady(), false);
});

test('library prices read monthly and annual ILS before VAT', () => {
  process.env.LIBRARY_MONTHLY_ILS = '79';
  process.env.LIBRARY_ANNUAL_ILS = '790';
  assert.equal(libraryPlanAmountBeforeVat('monthly'), 79);
  assert.equal(libraryPlanAmountBeforeVat('annual'), 790);
  assert.equal(isLibraryPaidPricingReady(), true);
  delete process.env.LIBRARY_MONTHLY_ILS;
  delete process.env.LIBRARY_ANNUAL_ILS;
});
