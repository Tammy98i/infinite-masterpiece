import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSES } from '../../src/data/initialData.ts';
import { overviewFrom, usersFromProfiles } from './adminDesk.ts';

test('overview counts published catalog lectures', () => {
  const overview = overviewFrom([]);
  assert.equal(overview.courses, COURSES.length);
  assert.equal(overview.published, COURSES.length);
  assert.ok(overview.episodes > 0);
  assert.equal(overview.users, 0);
});

test('overview counts supabase profiles as users', () => {
  const overview = overviewFrom([
    {
      id: '1',
      email: 'infinite.masterpiece8@gmail.com',
      full_name: 'Infinite',
      role: 'admin',
      subscription_plan: 'none',
    },
    {
      id: '2',
      email: 'a@example.com',
      full_name: 'A',
      role: 'user',
      subscription_plan: 'monthly',
    },
  ]);
  assert.equal(overview.users, 2);
  assert.equal(overview.paying, 1);
  assert.equal(overview.free, 1);
});

test('usersFromProfiles maps lecturer to instructor', () => {
  const [user] = usersFromProfiles([
    { id: '1', email: 'lec@example.com', full_name: 'מרצה', role: 'lecturer', subscription_plan: 'none' },
  ]);
  assert.equal(user.role, 'instructor');
  assert.equal(user.name, 'מרצה');
});
