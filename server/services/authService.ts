import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { getDb } from '../db/connection.js';
import { resolveLecturerReferralId } from './lecturerService.js';

const SESSION_DAYS = 30;

export type DbRole = 'admin' | 'lecturer' | 'user';
export type DbPlan = 'none' | 'free_trial' | 'monthly' | 'annual' | 'premium_88';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'instructor' | 'student';
  subscriptionPlan: DbPlan;
  trialEndsAt?: string;
  interests: string[];
  avatar: string;
  blocked?: boolean;
  isFounder?: boolean;
  entryTrack?: string;
  currentPaymentPhase?: number;
  staffDesk?: '' | 'content' | 'support' | 'sales' | 'legal' | 'finance' | 'community';
  staffStatus?: 'active' | 'suspended' | 'limited';
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, 64);
  const actual = Buffer.from(hash, 'hex');
  if (test.length !== actual.length) return false;
  return timingSafeEqual(test, actual);
}

function toClientRole(role: string): AuthUser['role'] {
  if (role === 'admin') return 'admin';
  if (role === 'lecturer') return 'instructor';
  return 'student';
}

function rowToUser(row: Record<string, unknown>): AuthUser {
  let interests: string[] = [];
  try {
    interests = JSON.parse(String(row.interests || '[]'));
  } catch {
    interests = [];
  }
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.full_name),
    role: toClientRole(String(row.role)),
    subscriptionPlan: (row.subscription_plan as DbPlan) || 'none',
    trialEndsAt: row.trial_ends_at ? String(row.trial_ends_at) : undefined,
    interests,
    avatar:
      String(row.avatar || '') ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    blocked: Boolean(row.blocked),
    isFounder: Boolean(row.is_founder),
    entryTrack: String(row.entry_track || 'none'),
    currentPaymentPhase: Number(row.current_payment_phase || 0),
    staffDesk: ([
      'content',
      'support',
      'sales',
      'legal',
      'finance',
      'community',
    ].includes(String(row.staff_desk || ''))
      ? String(row.staff_desk)
      : '') as AuthUser['staffDesk'],
    staffStatus: (['active', 'suspended', 'limited'].includes(String(row.staff_status || 'active'))
      ? String(row.staff_status || 'active')
      : 'active') as AuthUser['staffStatus'],
  };
}

function createSession(userId: string) {
  const db = getDb();
  const token = randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  db.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).run(
    token,
    userId,
    expires.toISOString()
  );
  return token;
}

export function registerUser(fullName: string, email: string, password: string, referredByLecturerId?: string) {
  const name = fullName.trim();
  const normalized = email.trim().toLowerCase();
  if (!name) throw Object.assign(new Error('נא להזין שם'), { status: 400 });
  if (!normalized || !normalized.includes('@')) {
    throw Object.assign(new Error('נא להזין אימייל תקין'), { status: 400 });
  }
  if (password.length < 8) {
    throw Object.assign(new Error('הסיסמה חייבת להיות לפחות 8 תווים'), { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(normalized);
  if (existing) {
    throw Object.assign(new Error('כבר קיים חשבון עם האימייל הזה'), { status: 409 });
  }

  let referralId = resolveLecturerReferralId(referredByLecturerId);
  if (!referralId) {
    const fromLead = db
      .prepare(
        `SELECT referred_by_lecturer_id FROM track_leads
         WHERE lower(email) = ? AND referred_by_lecturer_id != ''
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(normalized) as { referred_by_lecturer_id: string } | undefined;
    referralId = resolveLecturerReferralId(fromLead?.referred_by_lecturer_id);
  }

  const id = `user-${randomUUID()}`;
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, role, last_login_at, referred_by_lecturer_id)
     VALUES (?, ?, ?, ?, 'user', datetime('now'), ?)`
  ).run(id, normalized, hashPassword(password), name, referralId);

  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as Record<string, unknown>;
  return { token: createSession(id), user: rowToUser(row) };
}

/** Admin creates an account without logging the new user in. */
export function adminCreateUser(fullName: string, email: string, password: string) {
  const name = fullName.trim();
  const normalized = email.trim().toLowerCase();
  if (!name) throw Object.assign(new Error('נא להזין שם'), { status: 400 });
  if (!normalized || !normalized.includes('@')) {
    throw Object.assign(new Error('נא להזין אימייל תקין'), { status: 400 });
  }
  if (password.length < 8) {
    throw Object.assign(new Error('הסיסמה חייבת להיות לפחות 8 תווים'), { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(normalized);
  if (existing) {
    throw Object.assign(new Error('כבר קיים חשבון עם האימייל הזה'), { status: 409 });
  }

  const id = `user-${randomUUID()}`;
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, role, created_at)
     VALUES (?, ?, ?, ?, 'user', datetime('now'))`
  ).run(id, normalized, hashPassword(password), name);

  return id;
}

export function loginUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const db = getDb();
  const row = db.prepare(`SELECT * FROM users WHERE lower(email) = ?`).get(normalized) as
    | Record<string, unknown>
    | undefined;
  if (!row || !verifyPassword(password, String(row.password_hash))) {
    throw Object.assign(new Error('אימייל או סיסמה שגויים'), { status: 401 });
  }
  if (Number(row.blocked) === 1) {
    throw Object.assign(new Error('החשבון חסום'), { status: 403 });
  }
  if (String(row.staff_status || 'active') === 'suspended') {
    throw Object.assign(new Error('הגישה הושהתה. פנו לאדמין'), { status: 403 });
  }

  db.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).run(String(row.id));
  return { token: createSession(String(row.id)), user: rowToUser(row) };
}

export function clearUserSessions(userId: string) {
  getDb().prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}

export function userFromToken(token: string | undefined) {
  if (!token) return null;
  const db = getDb();
  const session = db.prepare(`SELECT * FROM sessions WHERE token = ?`).get(token) as
    | Record<string, unknown>
    | undefined;
  if (!session) return null;
  if (new Date(String(session.expires_at)).getTime() < Date.now()) {
    db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
    return null;
  }
  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(String(session.user_id)) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;
  if (Number(row.blocked) === 1 || String(row.staff_status || 'active') === 'suspended') {
    db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(String(row.id));
    return null;
  }
  return rowToUser(row);
}

export function logoutToken(token: string | undefined) {
  if (!token) return;
  getDb().prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

export function updateSubscription(userId: string, plan: DbPlan, trialEndsAt?: string) {
  const db = getDb();
  db.prepare(`UPDATE users SET subscription_plan = ?, trial_ends_at = ? WHERE id = ?`).run(
    plan,
    trialEndsAt ?? null,
    userId
  );
  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as Record<string, unknown>;
  return rowToUser(row);
}

export function updateInterests(userId: string, interests: string[]) {
  const db = getDb();
  db.prepare(`UPDATE users SET interests = ? WHERE id = ?`).run(JSON.stringify(interests), userId);
}
