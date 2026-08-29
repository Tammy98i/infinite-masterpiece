import assert from 'node:assert/strict';
import test from 'node:test';
import { isApiUnavailableMessage, roleFromProfile } from './supabaseUser.ts';

test('treats a dead local API as unavailable', () => {
  assert.equal(
    isApiUnavailableMessage('לא ניתן להתחבר לשרת. הריצו npm run server ואז נסו שוב.'),
    true
  );
});

test('treats the Vite proxy 502 as unavailable', () => {
  assert.equal(
    isApiUnavailableMessage('השרת לא זמין. הריצו npm run server ואז נסו שוב.'),
    true
  );
});

test('does not treat a wrong password as an API outage', () => {
  assert.equal(isApiUnavailableMessage('אימייל או סיסמה שגויים'), false);
});

test('built-in operations email is admin even if the profile row is still user', () => {
  assert.equal(roleFromProfile('user', 'infinite.masterpiece8@gmail.com'), 'admin');
  assert.equal(roleFromProfile(null, '  Infinite.Masterpiece8@gmail.com  '), 'admin');
});
