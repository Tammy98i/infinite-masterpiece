import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';
import { createSession, userFromToken } from './authService.js';

type SupabaseUserPayload = {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: string; name?: string };
};

function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_ANON_KEY?.trim());
}

export function isSupabaseAuthConfigured() {
  return supabaseConfigured();
}

async function fetchSupabaseUser(accessToken: string): Promise<SupabaseUserPayload> {
  const base = process.env.SUPABASE_URL!.replace(/\/$/, '');
  const anon = process.env.SUPABASE_ANON_KEY!;
  const res = await fetch(`${base}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anon,
    },
  });
  if (!res.ok) {
    throw Object.assign(new Error('טוקן ההתחברות לא תקין. נסו להתחבר מחדש'), { status: 401 });
  }
  return (await res.json()) as SupabaseUserPayload;
}

function upsertLocalUserFromSupabase(input: {
  supabaseUserId: string;
  email: string;
  fullName: string;
}) {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  if (!email.includes('@')) {
    throw Object.assign(new Error('חסר אימייל בחשבון'), { status: 400 });
  }

  const bySupabase = db
    .prepare(`SELECT * FROM users WHERE supabase_user_id = ?`)
    .get(input.supabaseUserId) as Record<string, unknown> | undefined;
  if (bySupabase) {
    db.prepare(
      `UPDATE users SET email = ?, full_name = COALESCE(NULLIF(?, ''), full_name), last_login_at = datetime('now')
       WHERE id = ?`
    ).run(email, input.fullName, String(bySupabase.id));
    return String(bySupabase.id);
  }

  const byEmail = db.prepare(`SELECT * FROM users WHERE lower(email) = ?`).get(email) as
    | Record<string, unknown>
    | undefined;
  if (byEmail) {
    db.prepare(
      `UPDATE users SET supabase_user_id = ?, full_name = COALESCE(NULLIF(?, ''), full_name), last_login_at = datetime('now')
       WHERE id = ?`
    ).run(input.supabaseUserId, input.fullName, String(byEmail.id));
    return String(byEmail.id);
  }

  const id = `user-${randomUUID()}`;
  const name = input.fullName.trim() || email.split('@')[0] || 'משתמש/ת';
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, role, supabase_user_id, last_login_at)
     VALUES (?, ?, ?, ?, 'user', ?, datetime('now'))`
  ).run(id, email, `supabase:${input.supabaseUserId}`, name, input.supabaseUserId);

  return id;
}

export async function syncSupabaseSession(accessToken: string, fullNameHint = '') {
  if (!supabaseConfigured()) {
    throw Object.assign(new Error('התחברות חיצונית אינה מוגדרת בשרת'), { status: 503 });
  }
  const remote = await fetchSupabaseUser(accessToken);
  const email = String(remote.email || '')
    .trim()
    .toLowerCase();
  const fullName =
    fullNameHint.trim() ||
    String(remote.user_metadata?.full_name || remote.user_metadata?.name || '').trim();

  const userId = upsertLocalUserFromSupabase({
    supabaseUserId: remote.id,
    email,
    fullName,
  });

  const row = getDb().prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as Record<
    string,
    unknown
  >;
  if (Number(row.blocked) === 1) {
    throw Object.assign(new Error('החשבון חסום'), { status: 403 });
  }
  if (String(row.staff_status || 'active') === 'suspended') {
    throw Object.assign(new Error('הגישה הושהתה. פנו לאדמין'), { status: 403 });
  }

  const token = createSession(userId);
  const user = userFromToken(token);
  if (!user) throw Object.assign(new Error('כשל ביצירת סשן'), { status: 500 });
  return { token, user, supabaseUserId: remote.id };
}
