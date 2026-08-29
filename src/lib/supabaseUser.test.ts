import assert from 'node:assert/strict';
import test from 'node:test';
import { isApiUnavailableMessage, overlayApiUser, payloadFromSupabase, roleFromProfile } from './supabaseUser.ts';

test('overlayApiUser keeps the Supabase email and admin role', () => {
  const current = payloadFromSupabase({
    id: '0cdbca87-02d3-4ea3-bf6a-e0a202fb03ea',
    email: 'infinite.masterpiece8@gmail.com',
    profile: { role: 'admin', full_name: 'Infinite' },
  });
  const overlay = overlayApiUser(current, {
    ...current,
    id: 'user-sqlite-local',
    role: 'student',
    name: 'משתמש/ת',
  });
  assert.equal(overlay.id, '0cdbca87-02d3-4ea3-bf6a-e0a202fb03ea');
  assert.equal(overlay.email, 'infinite.masterpiece8@gmail.com');
  assert.equal(overlay.name, 'Infinite');
  assert.equal(overlay.role, 'admin');
});

test('overlayApiUser does not replace a different logged-in email', () => {
  const current = payloadFromSupabase({
    id: 'user-1',
    email: 'infinite.masterpiece8@gmail.com',
  });
  const overlay = overlayApiUser(current, {
    ...current,
    id: 'user-2',
    email: 'other@example.com',
    name: 'Someone else',
  });
  assert.equal(overlay.email, 'infinite.masterpiece8@gmail.com');
  assert.equal(overlay.id, 'user-1');
});

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

test('payloadFromSupabase keeps the email and display name on the session', () => {
  const payload = payloadFromSupabase({
    id: '0cdbca87-02d3-4ea3-bf6a-e0a202fb03ea',
    email: 'infinite.masterpiece8@gmail.com',
    profile: { role: 'admin', full_name: 'Infinite' },
  });
  assert.equal(payload.email, 'infinite.masterpiece8@gmail.com');
  assert.equal(payload.name, 'Infinite');
  assert.equal(payload.role, 'admin');
});
