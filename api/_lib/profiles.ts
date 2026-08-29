import { supabaseEnv, type SessionUser } from './session';
import type { ProfileListRow } from './adminDesk';

export async function listProfiles(accessToken: string): Promise<ProfileListRow[]> {
  const { url, anonKey } = supabaseEnv();
  const res = await fetch(
    `${url}/rest/v1/profiles?select=id,email,full_name,role,subscription_plan,is_founder,staff_desk,staff_status,created_at&order=created_at.desc`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
      },
    }
  );
  if (!res.ok) return [];
  const rows = (await res.json()) as ProfileListRow[];
  return Array.isArray(rows) ? rows : [];
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

export async function updateProfile(
  accessToken: string,
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
  const { url, anonKey } = supabaseEnv();
  const body: Record<string, unknown> = {};
  const role = dbRole(patch.role);
  if (role) body.role = role;
  const plan = dbPlan(patch.subscriptionPlan);
  if (plan) body.subscription_plan = plan;
  if (typeof patch.isFounder === 'boolean') body.is_founder = patch.isFounder;
  if (typeof patch.staffDesk === 'string') body.staff_desk = patch.staffDesk;
  if (patch.blocked === true) body.staff_status = 'suspended';
  else if (typeof patch.staffStatus === 'string') body.staff_status = patch.staffStatus;
  else if (patch.blocked === false) body.staff_status = 'active';

  if (!Object.keys(body).length) {
    throw Object.assign(new Error('אין מה לעדכן'), { status: 400 });
  }

  const res = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
