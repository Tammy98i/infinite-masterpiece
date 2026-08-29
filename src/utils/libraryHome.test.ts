import assert from 'node:assert/strict';
import test from 'node:test';
import { cardBadgeLabel } from './libraryHome.ts';

test('continue cards always show המשך', () => {
  assert.equal(cardBadgeLabel('open', 'continue'), 'המשך');
  assert.equal(cardBadgeLabel('locked', 'continue'), 'המשך');
  assert.equal(cardBadgeLabel('preview', 'continue'), 'המשך');
});

test('regular cards show טעימה or נעול, not an open badge', () => {
  assert.equal(cardBadgeLabel('preview', 'card'), 'טעימה');
  assert.equal(cardBadgeLabel('locked', 'card'), 'נעול');
  assert.equal(cardBadgeLabel('open', 'card'), '');
});
