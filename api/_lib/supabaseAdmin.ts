import { SUPABASE_PROJECT_URL } from './publicConfig.js';

export function supabaseServiceEnv() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || SUPABASE_PROJECT_URL)
    .trim()
    .replace(/\/$/, '');
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  return { url, serviceKey, anonKey };
}

export function hasSupabaseService() {
  const { url, serviceKey } = supabaseServiceEnv();
  return Boolean(url && serviceKey);
}

export async function supabaseRest<T = unknown>(
  path: string,
  init?: RequestInit & { prefer?: string }
): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  const { url, serviceKey } = supabaseServiceEnv();
  if (!url || !serviceKey) {
    return { ok: false, status: 503, data: null as T, error: 'חסר SUPABASE_SERVICE_ROLE_KEY בשרת' };
  }
  const headers: Record<string, string> = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (init?.prefer) headers.Prefer = init.prefer;
  const res = await fetch(`${url}/rest/v1/${path.replace(/^\//, '')}`, { ...init, headers });
  const text = await res.text();
  let data: T = null as T;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = text as unknown as T;
    }
  }
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && data && 'message' in data
        ? String((data as { message?: string }).message || 'שגיאת Supabase')
        : `שגיאת Supabase (${res.status})`;
    return { ok: false, status: res.status, data, error: message };
  }
  return { ok: true, status: res.status, data };
}
