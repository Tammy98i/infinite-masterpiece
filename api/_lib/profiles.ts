import { supabaseEnv, type SessionUser } from './session.js';
import { supabaseRest, supabaseServiceEnv } from './supabaseAdmin.js';
import type { ProfileListRow } from './adminDesk.js';

const PROFILE_SELECT =
  'id,email,full_name,role,subscription_plan,is_founder,staff_desk,staff_status,created_at';

export async function listProfiles(accessToken: string): Promise<ProfileListRow[]> {
  const service = await listProfilesWithServiceRole();
  if (service.length) return service;

  const { url, anonKey } = supabaseEnv();
  const res = await fetch(`${url}/rest/v1/profiles?select=${PROFILE_SELECT}&order=created_at.desc`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[profiles] list failed', res.status, detail.slice(0, 200));
    return [];
  }
  const rows = (await res.json()) as ProfileListRow[];
  return Array.isArray(rows) ? rows : [];
}

export async function listProfilesWithServiceRole(): Promise<ProfileListRow[]> {
  const { url, serviceKey } = supabaseServiceEnv();
  if (!url || !serviceKey) return [];
  const res = await supabaseRest<ProfileListRow[]>(
    `profiles?select=${PROFILE_SELECT}&order=created_at.desc`
  );
  if (!res.ok) {
    console.error('[profiles] service list failed', res.status, res.error);
    return [];
  }
  return Array.isArray(res.data) ? res.data : [];
}

function dbRole(role: string | undefined) {
  if (role === 'admin') return 'admin';
  if (role === 'instructor' || role === 'lecturer') return 'lecturer';
  if (role === 'student' || role === 'user') return 'user';
  return undefined;
}

function dbPlan(plan: string | undefined) {
  if (!plan) return undefined;
  if (['none', 'free_trial', 'monthly', 'annual', 'premium_88'].includes(plan)) return plan;
  return undefined;
}

async function patchProfileWithService(id: string, body: Record<string, unknown>) {
  const res = await supabaseRest<ProfileListRow[]>(`profiles?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    prefer: 'return=representation',
    body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) {
    throw Object.assign(new Error(res.error || 'לא ניתן לעדכן את המשתמש'), { status: res.status });
  }
  return Array.isArray(res.data) ? res.data[0] : null;
}

export async function updateProfile(
  _accessToken: string,
  id: string,
  patch: {
    role?: string;
    subscriptionPlan?: string;
    isFounder?: boolean;
    staffDesk?: string;
    staffStatus?: string;
    blocked?: boolean;
  }
) {
  const body: Record<string, unknown> = {};
  const role = dbRole(patch.role);
  if (role) body.role = role;
  const plan = dbPlan(patch.subscriptionPlan);
  if (plan) body.subscription_plan = plan;
  if (typeof patch.isFounder === 'boolean') body.is_founder = patch.isFounder;
  if (typeof patch.staffDesk === 'string') body.staff_desk = patch.staffDesk;
  if (patch.blocked === true) body.staff_status = 'suspended';
  else if (typeof patch.staffStatus === 'string') body.staff_status = patch.staffStatus;
  else if (patch.blocked === false && !patch.staffStatus) body.staff_status = 'active';

  if (!Object.keys(body).length) {
    throw Object.assign(new Error('אין מה לעדכן'), { status: 400 });
  }

  const { serviceKey } = supabaseServiceEnv();
  if (serviceKey) return patchProfileWithService(id, body);

  const { url, anonKey } = supabaseEnv();
  const res = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${_accessToken}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  const rows = (await res.json().catch(() => [])) as ProfileListRow[] | { message?: string };
  if (!res.ok) {
    const message =
      !Array.isArray(rows) && rows && typeof rows.message === 'string'
        ? rows.message
        : 'לא ניתן לעדכן את המשתמש';
    throw Object.assign(new Error(message), { status: res.status });
  }
  return Array.isArray(rows) ? rows[0] : null;
}

export function mergeCurrentUser(profiles: ProfileListRow[], user: SessionUser) {
  if (profiles.some((row) => row.id === user.id)) return profiles;
  return [
    {
      id: user.id,
      email: user.email,
      full_name: user.name,
      role: user.role === 'admin' ? 'admin' : user.role === 'instructor' ? 'lecturer' : 'user',
      subscription_plan: user.subscriptionPlan,
      is_founder: Boolean(user.isFounder),
      staff_desk: user.staffDesk || '',
      staff_status: user.staffStatus || 'active',
      created_at: new Date().toISOString(),
    },
    ...profiles,
  ];
}

async function waitForProfile(userId: string, maxAttempts = 8) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const res = await supabaseRest<ProfileListRow[]>(
      `profiles?id=eq.${encodeURIComponent(userId)}&select=${PROFILE_SELECT}&limit=1`
    );
    if (res.ok && Array.isArray(res.data) && res.data[0]) return res.data[0];
    await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
  }
  return null;
}

async function upsertProfileRow(input: {
  id: string;
  email: string;
  fullName: string;
  role?: string;
  isFounder?: boolean;
}) {
  const row = {
    id: input.id,
    email: input.email,
    full_name: input.fullName,
    role: dbRole(input.role) || 'user',
    is_founder: Boolean(input.isFounder),
    subscription_plan: 'none',
    staff_desk: '',
    staff_status: 'active',
    updated_at: new Date().toISOString(),
  };
  const res = await supabaseRest<ProfileListRow[]>('profiles', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: JSON.stringify(row),
  });
  if (res.ok && Array.isArray(res.data) && res.data[0]) return res.data[0];
  return patchProfileWithService(input.id, row);
}

export async function createAdminUser(input: {
  fullName: string;
  email: string;
  password: string;
  role?: string;
  isFounder?: boolean;
}) {
  const { url, serviceKey } = supabaseServiceEnv();
  if (!url || !serviceKey) {
    throw Object.assign(new Error('חסר SUPABASE_SERVICE_ROLE_KEY בשרת'), { status: 503 });
  }

  const name = input.fullName.trim();
  const normalized = input.email.trim().toLowerCase();
  if (!name) throw Object.assign(new Error('נא להזין שם'), { status: 400 });
  if (!normalized || !normalized.includes('@')) {
    throw Object.assign(new Error('נא להזין אימייל תקין'), { status: 400 });
  }
  if (input.password.length < 8) {
    throw Object.assign(new Error('הסיסמה חייבת להיות לפחות 8 תווים'), { status: 400 });
  }

  const existing = await supabaseRest<ProfileListRow[]>(
    `profiles?email=eq.${encodeURIComponent(normalized)}&select=${PROFILE_SELECT}&limit=1`
  );
  if (existing.ok && Array.isArray(existing.data) && existing.data[0]) {
    throw Object.assign(new Error('כבר קיים חשבון עם האימייל הזה'), { status: 409 });
  }

  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: normalized,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: name },
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    msg?: string;
    message?: string;
    error_code?: string;
  };
  if (!res.ok) {
    const raw = data.msg || data.message || '';
    const message =
      data.error_code === 'email_exists' || /already registered|already exists/i.test(raw)
        ? 'כבר קיים חשבון עם האימייל הזה'
        : raw || 'יצירת המשתמש נכשלה';
    throw Object.assign(new Error(message), { status: res.status >= 400 && res.status < 500 ? res.status : 502 });
  }
  if (!data.id) {
    throw Object.assign(new Error('יצירת המשתמש נכשלה'), { status: 502 });
  }

  let profile = await waitForProfile(data.id);
  if (!profile) {
    profile = await upsertProfileRow({
      id: data.id,
      email: normalized,
      fullName: name,
      role: input.role,
      isFounder: input.isFounder,
    });
  } else if (input.role || input.isFounder) {
    const patch: Record<string, unknown> = { full_name: name };
    const role = dbRole(input.role);
    if (role) patch.role = role;
    if (input.isFounder) patch.is_founder = true;
    profile = (await patchProfileWithService(data.id, patch)) || profile;
  }

  return profile || {
    id: data.id,
    email: normalized,
    full_name: name,
    role: dbRole(input.role) || 'user',
    subscription_plan: 'none',
    is_founder: Boolean(input.isFounder),
    staff_desk: '',
    staff_status: 'active',
    created_at: new Date().toISOString(),
  };
}
