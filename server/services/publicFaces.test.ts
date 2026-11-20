import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { listTeamMembers } from '../db/teamMembers.ts';
import { listPublicFaces, savePublicAppearance } from './publicFaces.ts';

test('linking a webinar profile copies it to the library and the site', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE team_members (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, photo TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '', vision TEXT NOT NULL DEFAULT '', contribution TEXT NOT NULL DEFAULT '',
    responsibilities TEXT NOT NULL DEFAULT '[]', expertise TEXT NOT NULL DEFAULT '[]',
    impact_score INTEGER NOT NULL, hierarchy_level TEXT NOT NULL, orbit INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1, display_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE lecturers (
    id TEXT PRIMARY KEY, name TEXT, title TEXT, avatar_url TEXT, bio TEXT, credentials TEXT,
    user_id TEXT, is_founder INTEGER, founder_id TEXT, sort_order INTEGER
  );`);
  db.prepare(`INSERT INTO team_members (
    id, name, role, photo, bio, vision, contribution, responsibilities, expertise, impact_score, hierarchy_level, orbit, active, display_order
  ) VALUES ('team-dana', 'דנה שמש', 'מרצה', '/team/dana.jpg', 'ביוגרפיה', '', 'תרומה', '[]', '[]', 60, 'contributor', 2, 1, 3)`).run();

  const before = listPublicFaces(db).find((face) => face.name === 'דנה שמש');
  assert.equal(before?.webinar, true);
  assert.equal(before?.library, false);
  assert.equal(before?.site, false);

  savePublicAppearance(db, 'user-1', {
    faceId: 'team:team-dana',
    showWebinar: true,
    showSite: true,
    showLibrary: true,
  });

  const lecturer = db.prepare(`SELECT name, title, avatar_url, bio, user_id FROM lecturers WHERE user_id = 'user-1'`).get() as {
    name: string;
    title: string;
    avatar_url: string;
    bio: string;
  };
  assert.equal(lecturer.name, 'דנה שמש');
  assert.equal(lecturer.title, 'מרצה');
  assert.equal(lecturer.avatar_url, '/team/dana.jpg');
  assert.equal(lecturer.bio, 'ביוגרפיה');
  assert.equal(listTeamMembers(db, false, 'site').some((member) => member.name === 'דנה שמש'), true);
  assert.equal(listTeamMembers(db, false, 'webinar').some((member) => member.name === 'דנה שמש'), true);

  savePublicAppearance(db, 'user-1', {
    faceId: 'team:team-dana',
    showWebinar: false,
    showSite: true,
    showLibrary: false,
  });
  assert.equal(listTeamMembers(db, false, 'webinar').some((member) => member.name === 'דנה שמש'), false);
  assert.equal(listPublicFaces(db).find((face) => face.linkedUserId === 'user-1')?.library, false);
});
