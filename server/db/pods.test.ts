import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  initializePodsSchema,
  createPod,
  updatePod,
  setCaptain,
  assignMember,
  setMemberStatus,
  transferMember,
  listAssignmentQueue,
  listPods,
  getMyPodsState,
  upsertTask,
  submitTask,
  reviewSubmission,
  askQuestion,
  answerQuestion,
  upsertSession,
  joinSession,
  isJourneyEligible,
} from './pods.ts';

function openDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL DEFAULT '',
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      subscription_plan TEXT NOT NULL DEFAULT 'none',
      entry_track TEXT NOT NULL DEFAULT 'none',
      current_payment_phase INTEGER NOT NULL DEFAULT 0,
      payment_plan_status TEXT NOT NULL DEFAULT 'none',
      avatar TEXT DEFAULT '',
      blocked INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE premium_88_applications (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted'
    );
    CREATE TABLE site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '');
  `);
  initializePodsSchema(db);
  return db;
}

function addUser(
  db: DatabaseSync,
  input: {
    id: string;
    email: string;
    name: string;
    track?: string;
    phase?: number;
    plan?: string;
    role?: string;
  }
) {
  db.prepare(
    `INSERT INTO users (id, email, full_name, role, subscription_plan, entry_track, current_payment_phase)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    input.id,
    input.email,
    input.name,
    input.role || 'user',
    input.plan || 'none',
    input.track || 'none',
    input.phase || 0
  );
}

test('admin assign, queue rules, member home, task, captain, questions', () => {
  const db = openDb();
  try {
    addUser(db, { id: 'gal', email: 'gal@test.local', name: 'גל אברמוביץ׳', role: 'lecturer', plan: 'premium_88' });
    addUser(db, { id: 'noa', email: 'noa@test.local', name: 'נועה כהן', track: 'brave', phase: 1, plan: 'annual' });
    addUser(db, { id: 'yoav', email: 'yoav@test.local', name: 'יואב לוי', track: 'hesitant', phase: 1 });
    addUser(db, { id: 'dana', email: 'dana@test.local', name: 'דנה שמש', plan: 'monthly' });
    addUser(db, { id: 'ido', email: 'ido@test.local', name: 'עידו ברק', plan: 'premium_88' });
    db.prepare(
      `INSERT INTO premium_88_applications (id, full_name, email, status) VALUES ('app-1', 'עידו ברק', 'ido@test.local', 'approved')`
    ).run();

    assert.equal(isJourneyEligible({ entry_track: 'brave', current_payment_phase: 1 }), true);
    assert.equal(isJourneyEligible({ entry_track: 'none', current_payment_phase: 0 }), false);

    const queue = listAssignmentQueue(db);
    assert.equal(queue.queue.some((item) => item.userId === 'noa' && item.kind === 'journey'), true);
    assert.equal(queue.queue.some((item) => item.userId === 'yoav' && item.source === 'hesitant'), true);
    assert.equal(queue.queue.some((item) => item.userId === 'ido' && item.kind === 'micro_88'), true);
    assert.equal(queue.queue.some((item) => item.userId === 'dana'), false);
    assert.equal(queue.libraryOnly.some((item) => item.userId === 'dana' && item.stamp === 'לא נכנס לתור'), true);

    const pod = createPod(db, { name: 'פוד אלפא', kind: 'journey', captainUserId: 'gal', capacity: 3, currentWeek: 1 });
    assert.equal(pod.captain_user_id, 'gal');
    updatePod(db, pod.id, { status: 'active', currentWeek: 2 });
    assignMember(db, pod.id, 'noa');
    assert.throws(() => assignMember(db, pod.id, 'dana'), /מנוי ספרייה/);

    const afterAssign = listAssignmentQueue(db);
    assert.equal(afterAssign.queue.some((item) => item.userId === 'noa'), false);
    assert.equal(afterAssign.queue.some((item) => item.userId === 'yoav'), true);

    const task = upsertTask(db, 'gal', pod.id, {
      weekIndex: 2,
      title: 'מפת הערך',
      brief: 'כתבו פסקה',
    });
    assert.ok(task?.id);
    const submitted = submitTask(db, 'noa', pod.id, task!.id, { body: 'הגשה של נועה', linkUrls: ['https://example.com'] });
    assert.equal((submitted as { status: string }).status, 'submitted');
    reviewSubmission(db, 'gal', (submitted as { id: string }).id, { status: 'reviewed', captainNote: 'מדויק' });

    askQuestion(db, 'noa', pod.id, 'אפשר קישור למסמך?');
    const home = getMyPodsState(db, 'noa');
    assert.equal(home.pods.length, 1);
    assert.equal(home.pods[0].name, 'פוד אלפא');
    assert.equal(home.pods[0].task?.mySubmission.status, 'reviewed');
    assert.equal(home.pods[0].task?.submittedCount, 1);
    assert.equal(home.pods[0].questions.length, 1);
    assert.equal(home.pods[0].isCaptain, false);

    const captainHome = getMyPodsState(db, 'gal');
    assert.equal(captainHome.pods[0].isCaptain, true);
    assert.equal(captainHome.pods[0].questions.length, 1);
    answerQuestion(db, 'gal', captainHome.pods[0].questions[0].id, 'כן, אפשר.');

    upsertSession(db, 'gal', pod.id, {
      startsAt: '2026-09-30T18:00:00.000Z',
      meetingUrl: 'https://meet.google.com/demo',
      notes: 'שבוע 2',
    });
    const join = joinSession(db, 'noa', pod.id);
    assert.equal(join.meetingUrl, 'https://meet.google.com/demo');

    setMemberStatus(db, pod.id, 'noa', 'paused');
    assert.throws(() => submitTask(db, 'noa', pod.id, task!.id, { body: 'שוב' }), /מושהה/);
    const paused = getMyPodsState(db, 'noa');
    assert.equal(paused.pods[0].canSubmit, false);
    assert.equal(paused.pods[0].canJoinMeeting, false);

    setMemberStatus(db, pod.id, 'noa', 'active');
    const second = createPod(db, { name: 'פוד בטא', kind: 'journey', captainUserId: 'gal', capacity: 6 });
    assert.throws(() => assignMember(db, second.id, 'noa'), /כבר שייך/);
    transferMember(db, 'noa', pod.id, second.id);
    const moved = getMyPodsState(db, 'noa');
    assert.equal(moved.pods[0].id, second.id);

    const micro = createPod(db, { name: 'מיקרו 88', kind: 'micro_88', captainUserId: 'gal' });
    assignMember(db, micro.id, 'ido');
    const both = getMyPodsState(db, 'ido');
    assert.equal(both.pods.some((item) => item.kind === 'micro_88'), true);

    assert.throws(() => createPod(db, { name: '', kind: 'journey' }), /שם/);
    assert.throws(() => setCaptain(db, pod.id, 'missing'), /לא נמצא/);
    const listed = listPods(db);
    assert.ok(listed.length >= 3);
    assert.equal(listed.find((item) => item.id === pod.id)?.captain?.id, 'gal');
  } finally {
    db.close();
  }
});

test('paused and library-only never see another pod', () => {
  const db = openDb();
  try {
    addUser(db, { id: 'cap', email: 'cap@test.local', name: 'קפטן' });
    addUser(db, { id: 'lib', email: 'lib@test.local', name: 'מנוי', plan: 'monthly' });
    const pod = createPod(db, { name: 'פוד', kind: 'journey', captainUserId: 'cap' });
    assert.throws(() => assignMember(db, pod.id, 'lib'), /ספרייה/);
    const libState = getMyPodsState(db, 'lib');
    assert.equal(libState.showNav, false);
    assert.equal(libState.pods.length, 0);
    assert.throws(() => getMyPodsState(db, 'ghost'), /לא נמצא/);
  } finally {
    db.close();
  }
});
