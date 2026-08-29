import assert from 'node:assert/strict';
import test from 'node:test';
import { hebrewAuthError } from './hebrewAuthError.ts';

test('maps a browser network failure to Hebrew', () => {
  assert.equal(
    hebrewAuthError('Failed to fetch'),
    'לא הצלחנו להתחבר לשירות ההתחברות. בדקו את הרשת ונסו שוב.'
  );
});

test('maps invalid login credentials to Hebrew', () => {
  assert.equal(hebrewAuthError('Invalid login credentials'), 'אימייל או סיסמה שגויים');
});

test('keeps an already-Hebrew message', () => {
  assert.equal(hebrewAuthError('אימייל או סיסמה שגויים'), 'אימייל או סיסמה שגויים');
});
