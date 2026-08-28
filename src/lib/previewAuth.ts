import type { AuthUserPayload } from '../api/auth';

export const PREVIEW_TOKEN_PREFIX = 'preview:';
export const PREVIEW_PASSWORD = 'Masterpiece88';
const PREVIEW_EXTRA_KEY = 'mc_preview_users';

const STAFF: AuthUserPayload[] = [
  {
    id: 'user-admin-local',
    email: 'admin@infinitemasterpiece.local',
    name: 'מנהלת המערכת',
    role: 'admin',
    subscriptionPlan: 'premium_88',
    interests: [],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isFounder: false,
    staffDesk: '',
    staffStatus: 'active',
  },
  {
    id: 'user-demo-gal',
    email: 'gal@infinitemasterpiece.local',
    name: 'גל אברמוביץ׳',
    role: 'instructor',
    subscriptionPlan: 'premium_88',
    interests: [],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isFounder: true,
    staffDesk: '',
    staffStatus: 'active',
  },
  {
    id: 'user-demo-tami',
    email: 'tami@infinitemasterpiece.local',
    name: 'תמי אליאן',
    role: 'instructor',
    subscriptionPlan: 'premium_88',
    interests: [],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isFounder: true,
    staffDesk: '',
    staffStatus: 'active',
  },
  {
    id: 'user-demo-lecturer',
    email: 'lecturer@infinitemasterpiece.local',
    name: 'ד"ר מיכל שוורץ',
    role: 'instructor',
    subscriptionPlan: 'monthly',
    interests: [],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isFounder: false,
    staffDesk: '',
    staffStatus: 'active',
  },
];

function extraUsers(): AuthUserPayload[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PREVIEW_EXTRA_KEY);
    return raw ? (JSON.parse(raw) as AuthUserPayload[]) : [];
  } catch {
    return [];
  }
}

function allUsers() {
  return [...STAFF, ...extraUsers()];
}

export function isPreviewToken(token: string | null | undefined) {
  return Boolean(token?.startsWith(PREVIEW_TOKEN_PREFIX));
}

export function previewSessionFromToken(token: string | null | undefined) {
  if (!isPreviewToken(token)) return null;
  const id = token!.slice(PREVIEW_TOKEN_PREFIX.length);
  const user = allUsers().find((item) => item.id === id);
  if (!user) return null;
  return { token: token!, user };
}

export function previewLogin(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const user = allUsers().find((item) => item.email === normalized);
  if (!user || password !== PREVIEW_PASSWORD) {
    throw new Error('אימייל או סיסמה שגויים');
  }
  return { token: `${PREVIEW_TOKEN_PREFIX}${user.id}`, user };
}

export function previewRegister(fullName: string, email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) throw new Error('נא להזין אימייל תקין');
  if (password.length < 8) throw new Error('הסיסמה חייבת להיות לפחות 8 תווים');
  if (allUsers().some((item) => item.email === normalized)) {
    throw new Error('כבר קיים חשבון עם האימייל הזה');
  }
  if (typeof localStorage === 'undefined') {
    throw new Error('הרשמה בפריוו זמינה רק בדפדפן');
  }
  const user: AuthUserPayload = {
    id: `preview-${crypto.randomUUID()}`,
    email: normalized,
    name: fullName.trim() || normalized.split('@')[0] || 'משתמש/ת',
    role: 'student',
    subscriptionPlan: 'none',
    interests: [],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isFounder: false,
    staffDesk: '',
    staffStatus: 'active',
  };
  localStorage.setItem(PREVIEW_EXTRA_KEY, JSON.stringify([...extraUsers(), user]));
  return { token: `${PREVIEW_TOKEN_PREFIX}${user.id}`, user };
}

export function isDemoEmail(email: string) {
  return email.trim().toLowerCase().endsWith('@infinitemasterpiece.local');
}
