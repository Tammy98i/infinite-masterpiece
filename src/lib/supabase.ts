import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { apiUrl } from './apiBase';
import { SUPABASE_ANON_KEY, SUPABASE_PROJECT_URL } from './supabasePublic';

const buildUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || SUPABASE_PROJECT_URL;
const buildAnon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || SUPABASE_ANON_KEY;

let runtimeUrl = '';
let runtimeAnon = '';
let configPromise: Promise<boolean> | null = null;
let client: SupabaseClient | null = null;

function url() {
  return buildUrl || runtimeUrl;
}

function anon() {
  return buildAnon || runtimeAnon;
}

export function isSupabaseAuthEnabled() {
  return Boolean(url() && anon());
}

export function oauthRedirectTo() {
  return `${window.location.origin}/auth/callback`;
}

export async function loadSupabaseConfig() {
  if (isSupabaseAuthEnabled()) return true;
  if (!configPromise) {
    configPromise = (async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/providers'));
        const data = (await res.json().catch(() => ({}))) as {
          supabaseUrl?: string;
          anonKey?: string;
        };
        const nextUrl = String(data.supabaseUrl || '').trim();
        const nextAnon = String(data.anonKey || '').trim();
        if (nextUrl && nextAnon) {
          runtimeUrl = nextUrl;
          runtimeAnon = nextAnon;
          client = null;
          return true;
        }
      } catch {
        /* Vercel without functions, or local API down */
      }
      return isSupabaseAuthEnabled();
    })();
  }
  return configPromise;
}

export function getSupabase() {
  if (!isSupabaseAuthEnabled()) return null;
  if (!client) {
    client = createClient(url(), anon(), {
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
