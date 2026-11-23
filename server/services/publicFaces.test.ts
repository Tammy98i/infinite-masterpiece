import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { listTeamMembers } from '../db/teamMembers.ts';
import { isLecturerHiddenFromLibrary, listPublicFaces, savePublicAppearance } from './publicFaces.ts';

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

test('a lecturer missing from the site and webinar is copied there in one save', () => {
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
  db.prepare(`INSERT INTO lecturers (id, name, title, avatar_url, bio, credentials, user_id, is_founder)
    VALUES ('inst-noa', 'נועה ברק', 'מרצה אורחת', '/team/noa.jpg', 'טקסט מהספרייה', '[]', '', 0)`).run();

  const face = listPublicFaces(db).find((item) => item.name === 'נועה ברק');
  assert.equal(face?.library, true);
  assert.equal(face?.webinar, false);
  assert.equal(face?.site, false);

  savePublicAppearance(db, 'user-2', {
    faceId: face!.id,
    showWebinar: true,
    showSite: true,
    showLibrary: true,
  });

  const member = db.prepare(`SELECT name, role, photo, bio, show_webinar, show_site FROM team_members WHERE user_id = 'user-2'`).get() as {
    name: string;
    role: string;
    photo: string;
    bio: string;
    show_webinar: number;
    show_site: number;
  };
  assert.equal(member.name, 'נועה ברק');
  assert.equal(member.role, 'מרצה אורחת');
  assert.equal(member.photo, '/team/noa.jpg');
  assert.equal(member.bio, 'טקסט מהספרייה');
  assert.equal(member.show_webinar, 1);
  assert.equal(member.show_site, 1);
  const before = db.prepare(`SELECT COUNT(*) AS c FROM team_members`).get() as { c: number };
  const lecturersBefore = db.prepare(`SELECT COUNT(*) AS c FROM lecturers`).get() as { c: number };
  savePublicAppearance(db, 'user-2', {
    faceId: 'lecturer:inst-noa',
    showWebinar: true,
    showSite: true,
    showLibrary: true,
  });
  const after = db.prepare(`SELECT COUNT(*) AS c FROM team_members`).get() as { c: number };
  const lecturersAfter = db.prepare(`SELECT COUNT(*) AS c FROM lecturers`).get() as { c: number };
  assert.equal(after.c, before.c);
  assert.equal(lecturersAfter.c, lecturersBefore.c);
});

test('library hide matches a geresh or capital letters without a linked account', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE team_members (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, photo TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '', vision TEXT NOT NULL DEFAULT '', contribution TEXT NOT NULL DEFAULT '',
    responsibilities TEXT NOT NULL DEFAULT '[]', expertise TEXT NOT NULL DEFAULT '[]',
    impact_score INTEGER NOT NULL, hierarchy_level TEXT NOT NULL, orbit INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1, display_order INTEGER NOT NULL DEFAULT 0,
    user_id TEXT NOT NULL DEFAULT '', show_library INTEGER
  );
  CREATE TABLE lecturers (
    id TEXT PRIMARY KEY, name TEXT, title TEXT, avatar_url TEXT, bio TEXT, credentials TEXT,
    user_id TEXT, is_founder INTEGER
  );`);
  db.prepare(`INSERT INTO team_members (
    id, name, role, photo, bio, impact_score, hierarchy_level, orbit, user_id, show_library
  ) VALUES ('team-dana', 'Dana׳', 'מרצה', '', '', 50, 'contributor', 2, '', 0)`).run();
  assert.equal(isLecturerHiddenFromLibrary(db, { user_id: '', name: 'DANA' }), true);
  assert.equal(isLecturerHiddenFromLibrary(db, { user_id: '', name: 'תמי׳' }), false);
});
