import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import type { AuthUser } from '../services/authService.ts';
import {
  canEnterCommunity,
  createCommunityPost,
  createCommunityReply,
  getCommunityHome,
  initializeCommunitySchema,
  reportCommunityPost,
  setCommunityHidden,
  toggleCommunityHeart,
} from './community.ts';

function openDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      subscription_plan TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      blocked INTEGER NOT NULL DEFAULT 0,
      is_founder INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '');
  `);
  initializeCommunitySchema(db);
  return db;
}

function user(partial: Partial<AuthUser> & Pick<AuthUser, 'id' | 'role' | 'subscriptionPlan'>): AuthUser {
  return {
    email: `${partial.id}@test.local`,
    name: partial.name || 'נועה כהן',
    interests: [],
    avatar: '',
    ...partial,
  };
}

function add(db: DatabaseSync, row: { id: string; name: string; role: string; plan: string; founder?: number }) {
  db.prepare(
    `INSERT INTO users (id, email, full_name, role, subscription_plan, is_founder) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(row.id, `${row.id}@test.local`, row.name, row.role, row.plan, row.founder || 0);
}

test('only paying members enter, and channels follow the plan', () => {
  const db = openDb();
  add(db, { id: 'free', name: 'דנה לוי', role: 'user', plan: 'none' });
  add(db, { id: 'paid', name: 'נועה כהן', role: 'user', plan: 'monthly' });
  add(db, { id: 'p88', name: 'עידו ברק', role: 'user', plan: 'premium_88' });
  add(db, { id: 'teacher', name: 'מיכל רז', role: 'lecturer', plan: 'monthly' });
  const free = user({ id: 'free', role: 'student', subscriptionPlan: 'none', name: 'דנה לוי' });
  const trial = user({ id: 'trial', role: 'student', subscriptionPlan: 'free_trial', name: 'יואב לוי' });
  const paid = user({ id: 'paid', role: 'student', subscriptionPlan: 'monthly', name: 'נועה כהן' });
  const member88 = user({ id: 'p88', role: 'student', subscriptionPlan: 'premium_88', name: 'עידו ברק' });
  const lecturer = user({ id: 'teacher', role: 'instructor', subscriptionPlan: 'monthly', name: 'מיכל רז' });

  assert.equal(canEnterCommunity(free), false);
  assert.equal(canEnterCommunity(trial), false);
  assert.equal(getCommunityHome(db, free).access, 'locked');
  const home = getCommunityHome(db, paid);
  assert.deepEqual(home.channels.map((channel) => channel.id), ['board', 'talk', 'library']);
  assert.equal(home.channels.find((channel) => channel.id === 'board')?.canPost, false);
  assert.deepEqual(getCommunityHome(db, member88).channels.map((channel) => channel.id), ['board', 'talk', 'library', 'premium88']);
  assert.ok(getCommunityHome(db, lecturer).channels.some((channel) => channel.id === 'lecturers'));
});

test('members post, reply, and heart inside an open channel', () => {
  const db = openDb();
  add(db, { id: 'paid', name: 'נועה כהן', role: 'user', plan: 'monthly' });
  add(db, { id: 'admin', name: 'תמי אלון', role: 'admin', plan: 'none' });
  const paid = user({ id: 'paid', role: 'student', subscriptionPlan: 'monthly', name: 'נועה כהן' });
  const admin = user({ id: 'admin', role: 'admin', subscriptionPlan: 'premium_88', name: 'תמי אלון' });

  assert.throws(() => createCommunityPost(db, paid, { channel: 'board', body: 'הודעה' }), /אין הרשאה/);
  const id = createCommunityPost(db, paid, { channel: 'talk', body: 'שאלה קצרה על ההרצאה', lectureTitle: 'סטוריטלינג' });
  createCommunityReply(db, admin, id, 'שווה לעצור בדקה הרביעית');
  assert.equal(toggleCommunityHeart(db, paid, id), true);
  assert.equal(toggleCommunityHeart(db, paid, id), false);
  reportCommunityPost(db, paid, id);
  reportCommunityPost(db, paid, id);

  const home = getCommunityHome(db, paid, 'talk');
  assert.equal(home.posts.length, 1);
  assert.equal(home.posts[0].lectureTitle, 'סטוריטלינג');
  assert.equal(home.posts[0].replies.length, 1);
  assert.equal(home.posts[0].hearted, false);
  assert.equal(home.posts[0].reported, true);

  setCommunityHidden(db, admin, id, true);
  assert.equal(getCommunityHome(db, paid, 'talk').posts[0].hidden, true);
  assert.equal(getCommunityHome(db, user({ id: 'other', role: 'student', subscriptionPlan: 'annual', name: 'גל' }), 'talk').posts.length, 0);
});
