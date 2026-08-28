import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

let client: SupabaseClient | null = null;

export function isSupabaseAuthEnabled() {
  return Boolean(url && anonKey);
}

export function oauthRedirectTo() {
  return `${window.location.origin}/auth/callback`;
}

export function getSupabase() {
  if (!isSupabaseAuthEnabled()) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }
  return client;
}
