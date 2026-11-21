import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeUserProfile, profileFromStored, splitFullName } from './userProfile.ts';

test('profile splits a full name and keeps birthday, phone and city', () => {
  assert.deepEqual(splitFullName('תמי אליאן'), { firstName: 'תמי', lastName: 'אליאן' });
  const profile = normalizeUserProfile(
    {
      firstName: 'נועה',
      lastName: 'ברק',
      birthday: '1992-04-03',
      phone: '050-1234567',
      city: 'תל אביב',
    },
    { requireFirstName: true }
  );
  assert.equal(profile.fullName, 'נועה ברק');
  assert.equal(profile.birthday, '1992-04-03');
  assert.equal(profile.phone, '050-1234567');
  assert.equal(profile.city, 'תל אביב');
});

test('profile falls back to the stored full name and rejects a bad birthday', () => {
  const stored = profileFromStored({ full_name: 'גל ישראלי', birthday: '', phone: '', city: '' });
  assert.equal(stored.firstName, 'גל');
  assert.equal(stored.lastName, 'ישראלי');
  assert.throws(() => normalizeUserProfile({ firstName: 'גל', birthday: '1899-01-01' }), /יום הולדת/);
  assert.throws(() => normalizeUserProfile({ firstName: 'גל', birthday: '2026-02-31' }), /יום הולדת/);
  assert.throws(() => normalizeUserProfile({ birthday: '' }, { requireFirstName: true }), /שם פרטי/);
});
