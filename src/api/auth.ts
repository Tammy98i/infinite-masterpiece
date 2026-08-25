import type { UserProfile } from '../types';
import type { PlanId } from '../data/plans';
import { getStoredReferralLecturerId } from '../utils/referral';
import { apiUrl } from '../lib/apiBase';

const TOKEN_KEY = 'mc_token';

export type AuthUserPayload = Pick<
  UserProfile,
  | 'id'
  | 'email'
  | 'name'
  | 'role'
  | 'subscriptionPlan'
  | 'trialEndsAt'
  | 'interests'
  | 'avatar'
  | 'entryTrack'
  | 'currentPaymentPhase'
  | 'isFounder'
  | 'staffDesk'
  | 'staffStatus'
>;

function token() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthToken() {
  return token();
}

export function setAuthToken(value: string | null) {
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;

  let res: Response;
  try {
    res = await fetch(apiUrl(path), { ...options, headers });
  } catch {
    throw new Error('לא ניתן להתחבר לשרת. הריצו npm run server ואז נסו שוב.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'הבקשה נכשלה');
  }
  return data as T;
}

export { request as apiRequest };

export const authApi = {
  register: (fullName: string, email: string, password: string) =>
    request<{ token: string; user: AuthUserPayload }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName,
        email,
        password,
        referredByLecturerId: getStoredReferralLecturerId(),
      }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUserPayload }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: AuthUserPayload }>('/api/auth/me'),

  logout: async () => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      /* token may already be invalid */
    }
    setAuthToken(null);
  },

  setPlan: (plan: PlanId | 'none', trialEndsAt?: string) =>
    request<{ user: AuthUserPayload }>('/api/auth/subscription', {
      method: 'PATCH',
      body: JSON.stringify({ plan, trialEndsAt }),
    }),

  setInterests: (interests: string[]) =>
    request('/api/auth/interests', {
      method: 'PATCH',
      body: JSON.stringify({ interests }),
    }),
};
