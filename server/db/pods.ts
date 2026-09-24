import { randomUUID } from 'node:crypto';
import { randomBytes, scryptSync } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import {
  defaultPodCapacity,
  firstName,
  isPodKind,
  isPodStatus,
  isPodTaskStatus,
  nameInitial,
  type PodKind,
  type PodMemberStatus,
  type PodRole,
  type PodStatus,
  type PodTaskStatus,
} from '../../src/lib/pods.ts';
import { isProduction } from '../config/env.js';

const DEMO_PASSWORD = 'Masterpiece88';
const DEMO_SEED_KEY = 'pods_demo_seeded';

export type HttpError = Error & { status?: number };

function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function initializePodsSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('journey', 'micro_88')),
      status TEXT NOT NULL DEFAULT 'forming' CHECK(status IN ('forming', 'active', 'completed', 'closed')),
      captain_user_id TEXT,
      capacity INTEGER NOT NULL,
      current_week INTEGER NOT NULL DEFAULT 1 CHECK(current_week BETWEEN 1 AND 5),
      group_notice TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_pods_kind_status ON pods(kind, status);

    CREATE TABLE IF NOT EXISTS pod_members (
      id TEXT PRIMARY KEY,
      pod_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      pod_role TEXT NOT NULL CHECK(pod_role IN ('captain', 'member')),
      status TEXT NOT NULL DEFAULT 'invited' CHECK(status IN ('invited', 'active', 'paused', 'left')),
      joined_at TEXT DEFAULT (datetime('now')),
      left_at TEXT,
      FOREIGN KEY (pod_id) REFERENCES pods(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pod_members_seat
      ON pod_members(pod_id, user_id) WHERE status IN ('invited', 'active', 'paused');
    CREATE INDEX IF NOT EXISTS idx_pod_members_user ON pod_members(user_id, status);

    CREATE TABLE IF NOT EXISTS pod_tasks (
      id TEXT PRIMARY KEY,
      pod_id TEXT NOT NULL,
      week_index INTEGER NOT NULL CHECK(week_index BETWEEN 1 AND 5),
      title TEXT NOT NULL,
      brief TEXT NOT NULL DEFAULT '',
      opens_at TEXT,
      due_at TEXT,
      FOREIGN KEY (pod_id) REFERENCES pods(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pod_tasks_week ON pod_tasks(pod_id, week_index);

    CREATE TABLE IF NOT EXISTS pod_task_submissions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      link_urls TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'submitted', 'reviewed', 'stuck')),
      captain_note TEXT NOT NULL DEFAULT '',
      submitted_at TEXT,
      reviewed_at TEXT,
      FOREIGN KEY (task_id) REFERENCES pod_tasks(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pod_submissions_user ON pod_task_submissions(task_id, user_id);

    CREATE TABLE IF NOT EXISTS pod_questions (
      id TEXT PRIMARY KEY,
      pod_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      body TEXT NOT NULL,
      answer_body TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'answered')),
      created_at TEXT DEFAULT (datetime('now')),
      answered_at TEXT,
      FOREIGN KEY (pod_id) REFERENCES pods(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_pod_questions_pod ON pod_questions(pod_id, status, created_at);

    CREATE TABLE IF NOT EXISTS pod_sessions (
      id TEXT PRIMARY KEY,
      pod_id TEXT NOT NULL UNIQUE,
      starts_at TEXT,
      meeting_url TEXT NOT NULL DEFAULT '',
      recording_url TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (pod_id) REFERENCES pods(id) ON DELETE CASCADE
    );
  `);
}

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  subscription_plan: string;
  entry_track: string;
  current_payment_phase: number;
  avatar: string | null;
};

function userById(db: DatabaseSync, id: string) {
  return db.prepare(
    `SELECT id, email, full_name, role, subscription_plan, entry_track, current_payment_phase, avatar
     FROM users WHERE id = ?`
  ).get(id) as UserRow | undefined;
}

function userByEmail(db: DatabaseSync, email: string) {
  return db.prepare(
    `SELECT id, email, full_name, role, subscription_plan, entry_track, current_payment_phase, avatar
     FROM users WHERE email = ?`
  ).get(email) as UserRow | undefined;
}

export function isJourneyEligible(user: Pick<UserRow, 'entry_track' | 'current_payment_phase'>) {
  return (user.entry_track === 'brave' || user.entry_track === 'hesitant') && user.current_payment_phase >= 1;
}

export function isApproved88(db: DatabaseSync, email: string) {
  const row = db.prepare(
    `SELECT id FROM premium_88_applications
     WHERE lower(email) = lower(?) AND status IN ('approved', 'onboarded', 'paid')
     LIMIT 1`
  ).get(email) as { id: string } | undefined;
  return Boolean(row);
}

export function is88Eligible(db: DatabaseSync, user: Pick<UserRow, 'email' | 'subscription_plan' | 'role'>) {
  if (isApproved88(db, user.email)) return true;
  const staff = user.role === 'admin' || user.role === 'lecturer' || user.role === 'instructor';
  return user.subscription_plan === 'premium_88' && !staff;
}

function eligibleKinds(db: DatabaseSync, user: UserRow): PodKind[] {
  const kinds: PodKind[] = [];
  if (isJourneyEligible(user)) kinds.push('journey');
  if (is88Eligible(db, user)) kinds.push('micro_88');
  return kinds;
}

function activeMembership(db: DatabaseSync, userId: string, kind: PodKind) {
  return db.prepare(
    `SELECT m.id, m.pod_id, m.pod_role, m.status
     FROM pod_members m
     JOIN pods p ON p.id = m.pod_id
     WHERE m.user_id = ? AND p.kind = ? AND m.status IN ('invited', 'active', 'paused')
     LIMIT 1`
  ).get(userId, kind) as { id: string; pod_id: string; pod_role: PodRole; status: PodMemberStatus } | undefined;
}

function occupiedSeats(db: DatabaseSync, podId: string) {
  return (
    db.prepare(
      `SELECT COUNT(*) as c FROM pod_members WHERE pod_id = ? AND status IN ('invited', 'active', 'paused')`
    ).get(podId) as { c: number }
  ).c;
}

function requirePod(db: DatabaseSync, podId: string) {
  const pod = db.prepare(`SELECT * FROM pods WHERE id = ?`).get(podId) as
    | {
        id: string;
        name: string;
        kind: PodKind;
        status: PodStatus;
        captain_user_id: string | null;
        capacity: number;
        current_week: number;
        group_notice: string;
        created_at: string;
        updated_at: string;
      }
    | undefined;
  if (!pod) fail('הפוד לא נמצא', 404);
  return pod;
}

function membershipOf(db: DatabaseSync, podId: string, userId: string) {
  return db.prepare(
    `SELECT * FROM pod_members WHERE pod_id = ? AND user_id = ? AND status IN ('invited', 'active', 'paused')`
  ).get(podId, userId) as
    | { id: string; pod_id: string; user_id: string; pod_role: PodRole; status: PodMemberStatus }
    | undefined;
}

function nowIso() {
  return new Date().toISOString();
}

function parseLinks(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean).slice(0, 8);
  }
  if (typeof raw === 'string') {
    return raw
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  return [];
}

export function createPod(
  db: DatabaseSync,
  input: { name?: string; kind?: string; captainUserId?: string; capacity?: number; currentWeek?: number }
) {
  const name = String(input.name || '').trim();
  if (!name || name.length > 80) fail('נא לתת שם לפוד, עד 80 תווים');
  if (!isPodKind(String(input.kind || ''))) fail('סוג הפוד חייב להיות מסע או נבחרת 88');
  const kind = input.kind as PodKind;
  const capacity = Number(input.capacity || defaultPodCapacity(kind));
  if (!Number.isInteger(capacity) || capacity < 2 || capacity > 20) fail('קיבולת הפוד חייבת להיות בין 2 ל־20');
  const currentWeek = Number(input.currentWeek || 1);
  if (!Number.isInteger(currentWeek) || currentWeek < 1 || currentWeek > 5) fail('שבוע הפוד חייב להיות בין 1 ל־5');

  const id = randomUUID();
  db.prepare(
    `INSERT INTO pods (id, name, kind, status, captain_user_id, capacity, current_week, updated_at)
     VALUES (?, ?, ?, 'forming', NULL, ?, ?, datetime('now'))`
  ).run(id, name, kind, capacity, currentWeek);

  if (input.captainUserId) {
    setCaptain(db, id, input.captainUserId);
  }
  return requirePod(db, id);
}

export function updatePod(
  db: DatabaseSync,
  podId: string,
  input: { name?: string; status?: string; capacity?: number; currentWeek?: number; groupNotice?: string }
) {
  const pod = requirePod(db, podId);
  const name = input.name !== undefined ? String(input.name).trim() : pod.name;
  if (!name || name.length > 80) fail('נא לתת שם לפוד, עד 80 תווים');
  const status = input.status !== undefined ? String(input.status) : pod.status;
  if (!isPodStatus(status)) fail('סטטוס הפוד אינו תקין');
  if (status === 'active' && !pod.captain_user_id) fail('אי אפשר להפעיל פוד בלי קפטן');
  const capacity = input.capacity !== undefined ? Number(input.capacity) : pod.capacity;
  if (!Number.isInteger(capacity) || capacity < 2 || capacity > 20) fail('קיבולת הפוד חייבת להיות בין 2 ל־20');
  if (capacity < occupiedSeats(db, podId)) fail('הקיבולת קטנה ממספר החברים בפוד');
  const currentWeek = input.currentWeek !== undefined ? Number(input.currentWeek) : pod.current_week;
  if (!Number.isInteger(currentWeek) || currentWeek < 1 || currentWeek > 5) fail('שבוע הפוד חייב להיות בין 1 ל־5');
  const notice = input.groupNotice !== undefined ? String(input.groupNotice).trim().slice(0, 500) : pod.group_notice;
  db.prepare(
    `UPDATE pods SET name = ?, status = ?, capacity = ?, current_week = ?, group_notice = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(name, status, capacity, currentWeek, notice, podId);
  return requirePod(db, podId);
}

export function setCaptain(db: DatabaseSync, podId: string, captainUserId: string) {
  const pod = requirePod(db, podId);
  const captain = userById(db, captainUserId);
  if (!captain) fail('הקפטן לא נמצא', 404);
  if (captain.role === 'user' || captain.role === 'student') {
    /* captain can be a regular user */
  }
  const existing = membershipOf(db, podId, captainUserId);
  if (occupiedSeats(db, podId) >= pod.capacity && !existing) fail('הפוד מלא. פתחו פוד חדש');

  const previous = pod.captain_user_id
    ? membershipOf(db, podId, pod.captain_user_id)
    : undefined;
  if (previous && previous.user_id !== captainUserId) {
    db.prepare(`UPDATE pod_members SET pod_role = 'member' WHERE id = ?`).run(previous.id);
  }

  if (existing) {
    db.prepare(`UPDATE pod_members SET pod_role = 'captain', status = 'active', left_at = NULL WHERE id = ?`).run(
      existing.id
    );
  } else {
    db.prepare(
      `INSERT INTO pod_members (id, pod_id, user_id, pod_role, status, joined_at)
       VALUES (?, ?, ?, 'captain', 'active', datetime('now'))`
    ).run(randomUUID(), podId, captainUserId);
  }
  db.prepare(`UPDATE pods SET captain_user_id = ?, updated_at = datetime('now') WHERE id = ?`).run(
    captainUserId,
    podId
  );
  return requirePod(db, podId);
}

export function assignMember(db: DatabaseSync, podId: string, userId: string) {
  const pod = requirePod(db, podId);
  if (pod.status === 'closed') fail('אי אפשר לשייך לפוד סגור');
  const user = userById(db, userId);
  if (!user) fail('המשתמש לא נמצא', 404);
  const kinds = eligibleKinds(db, user);
  if (!kinds.includes(pod.kind)) {
    if (pod.kind === 'journey') fail('רק משלמי מסע נכנסים לפוד מסע. מנוי ספרייה לא נכנס לתור');
    fail('רק מאושרי נבחרת 88 נכנסים ל־Micro-Pod');
  }
  const other = activeMembership(db, userId, pod.kind);
  if (other && other.pod_id !== podId) fail('המשתתף כבר שייך לפוד פעיל מאותו סוג');
  const existing = membershipOf(db, podId, userId);
  if (existing) return { pod: requirePod(db, podId), memberId: existing.id, created: false };
  if (occupiedSeats(db, podId) >= pod.capacity) fail('הפוד מלא. פתחו פוד חדש');
  const memberId = randomUUID();
  db.prepare(
    `INSERT INTO pod_members (id, pod_id, user_id, pod_role, status, joined_at)
     VALUES (?, ?, ?, 'member', 'active', datetime('now'))`
  ).run(memberId, podId, userId);
  if (pod.status === 'forming' && pod.captain_user_id) {
    db.prepare(`UPDATE pods SET status = 'active', updated_at = datetime('now') WHERE id = ?`).run(podId);
  }
  return { pod: requirePod(db, podId), memberId, created: true };
}

export function setMemberStatus(db: DatabaseSync, podId: string, userId: string, status: PodMemberStatus) {
  const member = membershipOf(db, podId, userId);
  if (!member) fail('החבר לא נמצא בפוד', 404);
  if (member.pod_role === 'captain' && (status === 'left' || status === 'paused')) {
    fail('ממנו קפטן מחליף לפני שמסירים את הקפטן הנוכחי');
  }
  db.prepare(
    `UPDATE pod_members SET status = ?, left_at = CASE WHEN ? IN ('left') THEN datetime('now') ELSE NULL END
     WHERE id = ?`
  ).run(status, status, member.id);
  return membershipOf(db, podId, userId) || { ...member, status, left_at: status === 'left' ? nowIso() : null };
}

export function transferMember(db: DatabaseSync, userId: string, fromPodId: string, toPodId: string) {
  const from = requirePod(db, fromPodId);
  const to = requirePod(db, toPodId);
  if (from.kind !== to.kind) fail('אפשר להעביר רק לפוד מאותו סוג');
  const member = membershipOf(db, fromPodId, userId);
  if (!member) fail('החבר לא נמצא בפוד', 404);
  if (member.pod_role === 'captain') fail('ממנו קפטן מחליף לפני העברת הקפטן');
  setMemberStatus(db, fromPodId, userId, 'left');
  return assignMember(db, toPodId, userId);
}

export function listPods(db: DatabaseSync) {
  const rows = db.prepare(`SELECT * FROM pods ORDER BY created_at DESC`).all() as Array<{
    id: string;
    name: string;
    kind: PodKind;
    status: PodStatus;
    captain_user_id: string | null;
    capacity: number;
    current_week: number;
    group_notice: string;
    created_at: string;
    updated_at: string;
  }>;
  return rows.map((pod) => {
    const captain = pod.captain_user_id ? userById(db, pod.captain_user_id) : undefined;
    const occupied = occupiedSeats(db, pod.id);
    return {
      id: pod.id,
      name: pod.name,
      kind: pod.kind,
      status: pod.status,
      capacity: pod.capacity,
      occupied,
      currentWeek: pod.current_week,
      groupNotice: pod.group_notice,
      captain: captain
        ? { id: captain.id, name: captain.full_name, email: captain.email, avatar: captain.avatar || '' }
        : null,
      createdAt: pod.created_at,
    };
  });
}

export function listAssignmentQueue(db: DatabaseSync) {
  const users = db.prepare(
    `SELECT id, email, full_name, role, subscription_plan, entry_track, current_payment_phase, avatar
     FROM users WHERE blocked = 0`
  ).all() as UserRow[];

  const items: Array<{
    userId: string;
    name: string;
    email: string;
    kind: PodKind;
    source: 'brave' | 'hesitant' | 'premium_88';
    stamp: string | null;
  }> = [];

  for (const user of users) {
    if (isJourneyEligible(user) && !activeMembership(db, user.id, 'journey')) {
      items.push({
        userId: user.id,
        name: user.full_name,
        email: user.email,
        kind: 'journey',
        source: user.entry_track === 'brave' ? 'brave' : 'hesitant',
        stamp: null,
      });
    }
    if (is88Eligible(db, user) && !activeMembership(db, user.id, 'micro_88')) {
      items.push({
        userId: user.id,
        name: user.full_name,
        email: user.email,
        kind: 'micro_88',
        source: 'premium_88',
        stamp: null,
      });
    }
  }

  const libraryOnly = users
    .filter(
      (user) =>
        !isJourneyEligible(user) &&
        !is88Eligible(db, user) &&
        (user.subscription_plan === 'monthly' ||
          user.subscription_plan === 'annual' ||
          user.subscription_plan === 'free_trial')
    )
    .map((user) => ({
      userId: user.id,
      name: user.full_name,
      email: user.email,
      stamp: 'לא נכנס לתור',
    }));

  return { queue: items, libraryOnly };
}

function publicMembers(db: DatabaseSync, podId: string) {
  const rows = db.prepare(
    `SELECT u.full_name, m.status, m.pod_role
     FROM pod_members m JOIN users u ON u.id = m.user_id
     WHERE m.pod_id = ? AND m.status IN ('invited', 'active', 'paused')
     ORDER BY m.pod_role DESC, u.full_name`
  ).all(podId) as Array<{ full_name: string; status: PodMemberStatus; pod_role: PodRole }>;
  return rows
    .filter((row) => row.pod_role !== 'captain')
    .map((row) => ({
      firstName: firstName(row.full_name),
      initial: nameInitial(row.full_name),
      status: row.status,
    }));
}

function parseJsonArray(raw: string): string[] {
  try {
    const value = JSON.parse(raw || '[]');
    return Array.isArray(value) ? value.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function taskForWeek(db: DatabaseSync, podId: string, week: number) {
  return db.prepare(`SELECT * FROM pod_tasks WHERE pod_id = ? AND week_index = ?`).get(podId, week) as
    | {
        id: string;
        pod_id: string;
        week_index: number;
        title: string;
        brief: string;
        opens_at: string | null;
        due_at: string | null;
      }
    | undefined;
}

function submissionOf(db: DatabaseSync, taskId: string, userId: string) {
  return db.prepare(`SELECT * FROM pod_task_submissions WHERE task_id = ? AND user_id = ?`).get(taskId, userId) as
    | {
        id: string;
        task_id: string;
        user_id: string;
        body: string;
        link_urls: string;
        status: PodTaskStatus;
        captain_note: string;
        submitted_at: string | null;
        reviewed_at: string | null;
      }
    | undefined;
}

function sessionOf(db: DatabaseSync, podId: string) {
  return db.prepare(`SELECT * FROM pod_sessions WHERE pod_id = ?`).get(podId) as
    | {
        id: string;
        pod_id: string;
        starts_at: string | null;
        meeting_url: string;
        recording_url: string;
        notes: string;
      }
    | undefined;
}

function questionsFor(db: DatabaseSync, podId: string, userId: string | null, all: boolean) {
  const rows = (
    all
      ? db.prepare(
          `SELECT q.*, u.full_name FROM pod_questions q JOIN users u ON u.id = q.user_id
           WHERE q.pod_id = ? ORDER BY q.created_at DESC`
        ).all(podId)
      : db.prepare(
          `SELECT q.*, u.full_name FROM pod_questions q JOIN users u ON u.id = q.user_id
           WHERE q.pod_id = ? AND q.user_id = ? ORDER BY q.created_at DESC`
        ).all(podId, userId)
  ) as Array<{
    id: string;
    pod_id: string;
    user_id: string;
    body: string;
    answer_body: string;
    status: 'open' | 'answered';
    created_at: string;
    answered_at: string | null;
    full_name: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    answerBody: row.answer_body,
    status: row.status,
    createdAt: row.created_at,
    answeredAt: row.answered_at,
    firstName: firstName(row.full_name),
    mine: row.user_id === userId,
  }));
}

export function getMyPodsState(db: DatabaseSync, userId: string) {
  const user = userById(db, userId);
  if (!user) fail('המשתמש לא נמצא', 404);
  const kinds = eligibleKinds(db, user);
  const memberships = db.prepare(
    `SELECT m.*, p.kind FROM pod_members m JOIN pods p ON p.id = m.pod_id
     WHERE m.user_id = ? AND m.status IN ('invited', 'active', 'paused')
     ORDER BY p.kind`
  ).all(userId) as Array<{
    id: string;
    pod_id: string;
    user_id: string;
    pod_role: PodRole;
    status: PodMemberStatus;
    kind: PodKind;
  }>;

  const pods = memberships.map((membership) => buildPodHome(db, membership.pod_id, userId));
  const pendingKinds = kinds.filter((kind) => !memberships.some((item) => item.kind === kind));

  return {
    showNav: kinds.length > 0 || memberships.length > 0,
    eligible: kinds.length > 0 || memberships.length > 0,
    pendingAssignment: pendingKinds.length > 0,
    pendingKinds,
    ineligibleReason: kinds.length === 0 && memberships.length === 0 ? 'none' : null,
    pods,
  };
}

function buildPodHome(db: DatabaseSync, podId: string, userId: string) {
  const pod = requirePod(db, podId);
  const membership = membershipOf(db, podId, userId);
  if (!membership) fail('אין גישה לפוד הזה', 403);
  const captain = pod.captain_user_id ? userById(db, pod.captain_user_id) : undefined;
  const session = sessionOf(db, podId);
  const task = taskForWeek(db, podId, pod.current_week);
  const mySubmission = task ? submissionOf(db, task.id, userId) : undefined;
  const submittedCount = task
    ? (
        db.prepare(
          `SELECT COUNT(*) as c FROM pod_task_submissions
           WHERE task_id = ? AND status IN ('submitted', 'reviewed', 'stuck')`
        ).get(task.id) as { c: number }
      ).c
    : 0;
  const memberCount = (
    db.prepare(
      `SELECT COUNT(*) as c FROM pod_members WHERE pod_id = ? AND pod_role = 'member' AND status IN ('invited', 'active', 'paused')`
    ).get(podId) as { c: number }
  ).c;
  const canAct = membership.status === 'active' && (pod.status === 'active' || pod.status === 'forming');
  const isCaptain = membership.pod_role === 'captain';

  const captainView = isCaptain ? buildCaptainView(db, podId, task?.id) : null;

  return {
    id: pod.id,
    name: pod.name,
    kind: pod.kind,
    status: pod.status,
    currentWeek: pod.current_week,
    groupNotice: pod.group_notice,
    myRole: membership.pod_role,
    myStatus: membership.status,
    canSubmit: canAct,
    canJoinMeeting: Boolean(canAct && session?.meeting_url),
    isCaptain,
    captain: captain
      ? {
          id: captain.id,
          name: captain.full_name,
          firstName: firstName(captain.full_name),
          avatar: captain.avatar || '',
        }
      : null,
    members: publicMembers(db, podId),
    session: session
      ? {
          startsAt: session.starts_at,
          meetingUrl: canAct ? session.meeting_url : '',
          notes: session.notes,
        }
      : null,
    task: task
      ? {
          id: task.id,
          weekIndex: task.week_index,
          title: task.title,
          brief: task.brief,
          dueAt: task.due_at,
          submittedCount,
          memberCount,
          mySubmission: mySubmission
            ? {
                id: mySubmission.id,
                status: mySubmission.status,
                body: mySubmission.body,
                linkUrls: parseJsonArray(mySubmission.link_urls),
                captainNote: mySubmission.captain_note,
              }
            : { id: null, status: 'todo' as const, body: '', linkUrls: [], captainNote: '' },
        }
      : null,
    questions: questionsFor(db, podId, userId, isCaptain),
    captainView,
  };
}

function buildCaptainView(db: DatabaseSync, podId: string, taskId?: string) {
  const rows = db.prepare(
    `SELECT m.user_id, m.status, m.pod_role, u.full_name, u.email
     FROM pod_members m JOIN users u ON u.id = m.user_id
     WHERE m.pod_id = ? AND m.status IN ('invited', 'active', 'paused')
     ORDER BY m.pod_role DESC, u.full_name`
  ).all(podId) as Array<{
    user_id: string;
    status: PodMemberStatus;
    pod_role: PodRole;
    full_name: string;
    email: string;
  }>;

  return {
    members: rows.map((row) => {
      const submission = taskId ? submissionOf(db, taskId, row.user_id) : undefined;
      return {
        userId: row.user_id,
        name: row.full_name,
        firstName: firstName(row.full_name),
        email: row.email,
        memberStatus: row.status,
        role: row.pod_role,
        submissionStatus: (submission?.status || 'todo') as PodTaskStatus,
        submissionId: submission?.id || null,
        submissionBody: submission?.body || '',
        captainNote: submission?.captain_note || '',
      };
    }),
  };
}

export function getPodHome(db: DatabaseSync, userId: string, podId: string) {
  return buildPodHome(db, podId, userId);
}

export function upsertTask(
  db: DatabaseSync,
  actorId: string,
  podId: string,
  input: { weekIndex?: number; title?: string; brief?: string; dueAt?: string }
) {
  requireCaptain(db, podId, actorId);
  const pod = requirePod(db, podId);
  const weekIndex = Number(input.weekIndex || pod.current_week);
  if (!Number.isInteger(weekIndex) || weekIndex < 1 || weekIndex > 5) fail('שבוע המשימה חייב להיות בין 1 ל־5');
  const title = String(input.title || '').trim();
  if (!title || title.length > 160) fail('נא לתת כותרת למשימה');
  const brief = String(input.brief || '').trim().slice(0, 4000);
  const dueAt = input.dueAt ? String(input.dueAt) : null;
  const existing = taskForWeek(db, podId, weekIndex);
  if (existing) {
    db.prepare(`UPDATE pod_tasks SET title = ?, brief = ?, due_at = ? WHERE id = ?`).run(
      title,
      brief,
      dueAt,
      existing.id
    );
    db.prepare(`UPDATE pods SET current_week = ?, updated_at = datetime('now') WHERE id = ?`).run(weekIndex, podId);
    return taskForWeek(db, podId, weekIndex);
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO pod_tasks (id, pod_id, week_index, title, brief, opens_at, due_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), ?)`
  ).run(id, podId, weekIndex, title, brief, dueAt);
  db.prepare(`UPDATE pods SET current_week = ?, updated_at = datetime('now') WHERE id = ?`).run(weekIndex, podId);
  return taskForWeek(db, podId, weekIndex);
}

export function submitTask(
  db: DatabaseSync,
  userId: string,
  podId: string,
  taskId: string,
  input: { body?: string; linkUrls?: unknown }
) {
  const membership = membershipOf(db, podId, userId);
  if (!membership) fail('אין גישה לפוד הזה', 403);
  if (membership.status !== 'active') fail('חבר מושהה יכול לקרוא בלבד, בלי הגשה');
  const pod = requirePod(db, podId);
  if (pod.status === 'closed' || pod.status === 'completed') fail('הפוד סגור להגשות');
  const task = db.prepare(`SELECT * FROM pod_tasks WHERE id = ? AND pod_id = ?`).get(taskId, podId) as
    | { id: string }
    | undefined;
  if (!task) fail('המשימה לא נמצאה', 404);
  const body = String(input.body || '').trim();
  if (!body) fail('נא לכתוב את ההגשה');
  const links = parseLinks(input.linkUrls);
  const existing = submissionOf(db, taskId, userId);
  if (existing) {
    db.prepare(
      `UPDATE pod_task_submissions
       SET body = ?, link_urls = ?, status = 'submitted', submitted_at = datetime('now'), reviewed_at = NULL
       WHERE id = ?`
    ).run(body, JSON.stringify(links), existing.id);
    return submissionOf(db, taskId, userId);
  }
  db.prepare(
    `INSERT INTO pod_task_submissions (id, task_id, user_id, body, link_urls, status, submitted_at)
     VALUES (?, ?, ?, ?, ?, 'submitted', datetime('now'))`
  ).run(randomUUID(), taskId, userId, body, JSON.stringify(links));
  return submissionOf(db, taskId, userId);
}

export function reviewSubmission(
  db: DatabaseSync,
  actorId: string,
  submissionId: string,
  input: { status?: string; captainNote?: string }
) {
  const submission = db.prepare(
    `SELECT s.*, t.pod_id FROM pod_task_submissions s JOIN pod_tasks t ON t.id = s.task_id WHERE s.id = ?`
  ).get(submissionId) as
    | { id: string; pod_id: string; status: PodTaskStatus }
    | undefined;
  if (!submission) fail('ההגשה לא נמצאה', 404);
  requireCaptain(db, submission.pod_id, actorId);
  const status = String(input.status || '');
  if (status !== 'reviewed' && status !== 'stuck') fail('הקפטן מסמן נבדק או תקוע');
  if (!isPodTaskStatus(status)) fail('סטטוס ההגשה אינו תקין');
  const note = String(input.captainNote || '').trim().slice(0, 1000);
  db.prepare(
    `UPDATE pod_task_submissions SET status = ?, captain_note = ?, reviewed_at = datetime('now') WHERE id = ?`
  ).run(status, note, submissionId);
  return db.prepare(`SELECT * FROM pod_task_submissions WHERE id = ?`).get(submissionId);
}

export function askQuestion(db: DatabaseSync, userId: string, podId: string, bodyRaw: string) {
  const membership = membershipOf(db, podId, userId);
  if (!membership) fail('אין גישה לפוד הזה', 403);
  if (membership.status !== 'active') fail('חבר מושהה יכול לקרוא בלבד');
  const body = String(bodyRaw || '').trim();
  if (!body || body.length > 2000) fail('נא לכתוב שאלה קצרה לקפטן');
  const id = randomUUID();
  db.prepare(
    `INSERT INTO pod_questions (id, pod_id, user_id, body, status, created_at)
     VALUES (?, ?, ?, ?, 'open', datetime('now'))`
  ).run(id, podId, userId, body);
  return db.prepare(`SELECT * FROM pod_questions WHERE id = ?`).get(id);
}

export function answerQuestion(db: DatabaseSync, actorId: string, questionId: string, answerRaw: string) {
  const question = db.prepare(`SELECT * FROM pod_questions WHERE id = ?`).get(questionId) as
    | { id: string; pod_id: string }
    | undefined;
  if (!question) fail('השאלה לא נמצאה', 404);
  requireCaptain(db, question.pod_id, actorId);
  const answer = String(answerRaw || '').trim();
  if (!answer) fail('נא לכתוב תשובה');
  db.prepare(
    `UPDATE pod_questions SET answer_body = ?, status = 'answered', answered_at = datetime('now') WHERE id = ?`
  ).run(answer, questionId);
  return db.prepare(`SELECT * FROM pod_questions WHERE id = ?`).get(questionId);
}

export function upsertSession(
  db: DatabaseSync,
  actorId: string,
  podId: string,
  input: { startsAt?: string; meetingUrl?: string; notes?: string }
) {
  requireCaptain(db, podId, actorId);
  requirePod(db, podId);
  const startsAt = input.startsAt ? String(input.startsAt) : null;
  const meetingUrl = String(input.meetingUrl || '').trim();
  const notes = String(input.notes || '').trim().slice(0, 1000);
  const existing = sessionOf(db, podId);
  if (existing) {
    db.prepare(`UPDATE pod_sessions SET starts_at = ?, meeting_url = ?, notes = ? WHERE id = ?`).run(
      startsAt,
      meetingUrl,
      notes,
      existing.id
    );
    return sessionOf(db, podId);
  }
  db.prepare(
    `INSERT INTO pod_sessions (id, pod_id, starts_at, meeting_url, notes) VALUES (?, ?, ?, ?, ?)`
  ).run(randomUUID(), podId, startsAt, meetingUrl, notes);
  return sessionOf(db, podId);
}

export function setGroupNotice(db: DatabaseSync, actorId: string, podId: string, notice: string) {
  requireCaptain(db, podId, actorId);
  return updatePod(db, podId, { groupNotice: notice });
}

export function joinSession(db: DatabaseSync, userId: string, podId: string) {
  const home = buildPodHome(db, podId, userId);
  if (!home.canJoinMeeting || !home.session?.meetingUrl) fail('אין קישור פגישה פעיל');
  return { meetingUrl: home.session.meetingUrl };
}

function requireCaptain(db: DatabaseSync, podId: string, userId: string) {
  const user = userById(db, userId);
  if (user?.role === 'admin') return;
  const membership = membershipOf(db, podId, userId);
  if (!membership || membership.pod_role !== 'captain' || membership.status !== 'active') {
    fail('רק הקפטן של הפוד יכול לבצע את הפעולה', 403);
  }
}

function upsertDemoUser(
  db: DatabaseSync,
  input: {
    id: string;
    email: string;
    name: string;
    entryTrack?: string;
    phase?: number;
    plan?: string;
    paymentStatus?: string;
  }
) {
  const existing = userByEmail(db, input.email);
  if (existing) return existing.id;
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, role, subscription_plan, entry_track, current_payment_phase, payment_plan_status, blocked)
     VALUES (?, ?, ?, ?, 'user', ?, ?, ?, ?, 0)`
  ).run(
    input.id,
    input.email,
    hashPassword(DEMO_PASSWORD),
    input.name,
    input.plan || 'none',
    input.entryTrack || 'none',
    input.phase || 0,
    input.paymentStatus || 'none'
  );
  return input.id;
}

export function seedDemoPods(db: DatabaseSync) {
  if (isProduction()) return;
  if (db.prepare(`SELECT value FROM site_settings WHERE key = ?`).get(DEMO_SEED_KEY)) return;

  const gal =
    userByEmail(db, 'gal@infinitemasterpiece.local') ||
    userById(db, 'user-demo-gal');
  const captainId = gal?.id;
  if (!captainId) return;

  const noaId = upsertDemoUser(db, {
    id: 'user-demo-journey',
    email: 'journey@infinitemasterpiece.local',
    name: 'נועה כהן',
    entryTrack: 'brave',
    phase: 1,
    plan: 'annual',
    paymentStatus: 'brave_paid',
  });
  const michalId = upsertDemoUser(db, {
    id: 'user-demo-stuck',
    email: 'stuck@infinitemasterpiece.local',
    name: 'מיכל רז',
    entryTrack: 'brave',
    phase: 1,
    plan: 'annual',
    paymentStatus: 'brave_paid',
  });
  upsertDemoUser(db, {
    id: 'user-demo-hesitant',
    email: 'hesitant@infinitemasterpiece.local',
    name: 'יואב לוי',
    entryTrack: 'hesitant',
    phase: 1,
    plan: 'none',
    paymentStatus: 'active',
  });
  upsertDemoUser(db, {
    id: 'user-demo-library',
    email: 'library@infinitemasterpiece.local',
    name: 'דנה שמש',
    entryTrack: 'none',
    phase: 0,
    plan: 'monthly',
    paymentStatus: 'none',
  });
  const p88Id = upsertDemoUser(db, {
    id: 'user-demo-p88',
    email: 'p88@infinitemasterpiece.local',
    name: 'עידו ברק',
    entryTrack: 'none',
    phase: 0,
    plan: 'premium_88',
    paymentStatus: 'none',
  });

  const hasApp = db.prepare(`SELECT id FROM premium_88_applications WHERE email = ?`).get('p88@infinitemasterpiece.local');
  if (!hasApp) {
    db.prepare(
      `INSERT INTO premium_88_applications (id, full_name, phone, email, status)
       VALUES (?, 'עידו ברק', '0500000088', 'p88@infinitemasterpiece.local', 'approved')`
    ).run(randomUUID());
  }

  const pod = createPod(db, {
    name: 'פוד אלפא',
    kind: 'journey',
    captainUserId: captainId,
    capacity: 12,
    currentWeek: 2,
  });
  updatePod(db, pod.id, { status: 'active', currentWeek: 2, groupNotice: 'נפגשים ביום רביעי. הביאו את הטיוטה.' });
  assignMember(db, pod.id, noaId);
  assignMember(db, pod.id, michalId);
  upsertTask(db, captainId, pod.id, {
    weekIndex: 2,
    title: 'מפת הערך של השבוע',
    brief: 'כתבו בפסקה אחת איזה ערך אתם בונים השבוע, ולמי הוא מיועד.',
    dueAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const task = taskForWeek(db, pod.id, 2);
  if (task) {
    submitTask(db, noaId, pod.id, task.id, { body: 'אני בונה מסלול ליווי קצר ליוצרות בתחילת דרכן.', linkUrls: [] });
    const stuck = submitTask(db, michalId, pod.id, task.id, { body: 'עדיין מנסה לנסח את הקהל.', linkUrls: [] });
    if (stuck) {
      const row = stuck as { id: string };
      db.prepare(`UPDATE pod_task_submissions SET status = 'stuck', captain_note = 'נפרק יחד בפגישה.' WHERE id = ?`).run(
        row.id
      );
    }
  }
  upsertSession(db, captainId, pod.id, {
    startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    meetingUrl: 'https://meet.google.com/demo-pod-alpha',
    notes: 'פגישת שבוע 2',
  });
  askQuestion(db, noaId, pod.id, 'האם אפשר להגיש גם קישור למסמך עבודה?');
  void p88Id;

  db.prepare(`INSERT INTO site_settings (key, value) VALUES (?, '1')`).run(DEMO_SEED_KEY);
}

export function initializePods(db: DatabaseSync) {
  initializePodsSchema(db);
  seedDemoPods(db);
}
