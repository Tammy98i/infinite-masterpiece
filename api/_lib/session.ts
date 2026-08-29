import { SUPABASE_ANON_KEY, SUPABASE_PROJECT_URL } from '../../src/lib/supabasePublic';
import { BUILT_IN_ADMIN_EMAILS, mergeAdminEmails } from '../../src/data/adminEmails';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  subscriptionPlan: 'free_trial' | 'monthly' | 'annual' | 'premium_88' | 'none';
  interests: string[];
  avatar: string;
  isFounder?: boolean;
  staffDesk?: string;
  staffStatus?: 'active' | 'suspended' | 'limited' | '';
};

type ProfileRow = {
  role?: string | null;
  subscription_plan?: string | null;
  is_founder?: boolean | null;
  staff_desk?: string | null;
  staff_status?: string | null;
  full_name?: string | null;
};

function adminEmails() {
  return mergeAdminEmails(
    BUILT_IN_ADMIN_EMAILS,
    process.env.ADMIN_EMAILS,
    process.env.VITE_ADMIN_EMAILS
  );
}

export function supabaseEnv() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || SUPABASE_PROJECT_URL)
    .trim()
    .replace(/\/$/, '');
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY).trim();
  return { url, anonKey };
}

export function mapUser(input: {
  id: string;
  email?: string | null;
  fullName?: string;
  avatar?: string | null;
  profile?: ProfileRow | null;
}): SessionUser {
  const email = String(input.email || '')
    .trim()
    .toLowerCase();
  const name =
    input.fullName?.trim() ||
    input.profile?.full_name?.trim() ||
    email.split('@')[0] ||
    'משתמש/ת';
  const plan = input.profile?.subscription_plan;
  const subscriptionPlan =
    plan === 'free_trial' || plan === 'monthly' || plan === 'annual' || plan === 'premium_88'
      ? plan
      : 'none';
  let role: SessionUser['role'] = 'student';
  if (adminEmails().includes(email) || input.profile?.role === 'admin') role = 'admin';
  else if (input.profile?.role === 'lecturer') role = 'instructor';
  const desk = String(input.profile?.staff_desk || '');
  const status = String(input.profile?.staff_status || 'active');

  return {
    id: input.id,
    email,
    name,
    role,
    subscriptionPlan,
    interests: [],
    avatar:
      input.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isFounder: Boolean(input.profile?.is_founder),
    staffDesk: ['content', 'support', 'sales', 'legal', 'finance', 'community'].includes(desk) ? desk : '',
    staffStatus: (['active', 'suspended', 'limited'].includes(status) ? status : 'active') as SessionUser['staffStatus'],
  };
}

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: string; name?: string; avatar_url?: string };
};

export async function fetchSupabaseUser(accessToken: string) {
  const { url, anonKey } = supabaseEnv();
  if (!url || !anonKey) {
    throw Object.assign(new Error('התחברות חיצונית אינה מוגדרת בשרת'), { status: 503 });
  }
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
  });
  if (!res.ok) {
    throw Object.assign(new Error('טוקן ההתחברות לא תקין. נסו להתחבר מחדש'), { status: 401 });
  }
  return (await res.json()) as AuthUser;
}

export async function fetchProfile(accessToken: string, userId: string): Promise<ProfileRow | null> {
  const { url, anonKey } = supabaseEnv();
  const res = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role,subscription_plan,is_founder,staff_desk,staff_status,full_name`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as ProfileRow[];
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export async function sessionFromAccessToken(accessToken: string, fullName = '') {
  const remote = await fetchSupabaseUser(accessToken);
  const profile = await fetchProfile(accessToken, remote.id);
  const user = mapUser({
    id: remote.id,
    email: remote.email,
    fullName: fullName || remote.user_metadata?.full_name || remote.user_metadata?.name || '',
    avatar: remote.user_metadata?.avatar_url || null,
    profile,
  });
  if (user.staffStatus === 'suspended') {
    throw Object.assign(new Error('הגישה הושהתה. פנו לאדמין'), { status: 403 });
  }
  return { token: accessToken, user };
}

export function bearer(req: { headers: Record<string, string | string[] | undefined> }) {
  const header = req.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
}
