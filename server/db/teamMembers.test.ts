import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { initializeTeamMembers, listTeamMembers, saveTeamMember } from './teamMembers.ts';

test('team import, create, edit, hide and seed persistence', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE site_settings(key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE lecturers(id TEXT PRIMARY KEY, founder_id TEXT, is_founder INTEGER, sort_order INTEGER, name TEXT, title TEXT, avatar_url TEXT, bio TEXT, credentials TEXT);
      INSERT INTO lecturers VALUES('gal','gal',1,0,'Gal','Vision','','Bio','[]');`);
    initializeTeamMembers(db);
    const imported = listTeamMembers(db);
    assert.equal(imported.filter(m => m.hierarchy_level !== 'contributor').length, 2);
    assert.ok(imported.some(m => m.name === 'אליאור לוי' && m.photo === '/team/elior.jpg'));
    assert.equal(imported.find(m => m.name === 'גלב סמירנוב')?.photo, '/team/gleb.jpg');
    const sun = imported.find(m => m.hierarchy_level === 'founder')!;
    const created = saveTeamMember(db, { ...sun, name: 'Test contributor', hierarchy_level: 'contributor', impact_score: 30, orbit: 3, active: false });
    assert.equal(listTeamMembers(db).length, imported.length);
    assert.equal(listTeamMembers(db, true).length, imported.length + 1);
    saveTeamMember(db, { ...created, role: 'Updated', impact_score: 70, orbit: 2, display_order: 8, active: true, photo: '/uploads/test.png' }, created.id);
    assert.equal(listTeamMembers(db).find(m => m.id === created.id)?.impact_score, 70);
    assert.equal(listTeamMembers(db).find(m => m.id === created.id)?.photo, '/uploads/test.png');
    saveTeamMember(db, { ...sun, active: false }, sun.id);
    initializeTeamMembers(db);
    assert.equal(listTeamMembers(db).some(m => m.id === sun.id), false);
    assert.equal(listTeamMembers(db).find(m => m.id === created.id)?.role, 'Updated');
    saveTeamMember(db, { ...sun, active: true }, sun.id);
    assert.throws(() => saveTeamMember(db, { ...sun, name: 'Second sun' }), /שמש פעילה/);
    assert.throws(() => saveTeamMember(db, { ...created, impact_score: 101 }, created.id));
    assert.throws(() => saveTeamMember(db, created, 'missing'), /לא נמצא/);
  } finally { db.close(); }
});
