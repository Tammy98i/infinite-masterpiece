import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { apiUrl } from './apiBase';
import { SUPABASE_ANON_KEY, SUPABASE_PROJECT_URL } from './supabasePublic';
import { setRuntimeAdminEmails } from '../data/adminEmails';

const buildUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || SUPABASE_PROJECT_URL;
const buildAnon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || SUPABASE_ANON_KEY;

let runtimeUrl = '';
let runtimeAnon = '';
let configPromise: Promise<boolean> | null = null;
let client: SupabaseClient | null = null;
let googleProviderEnabled = false;

function url() {
  return buildUrl || runtimeUrl;
}

function anon() {
  return buildAnon || runtimeAnon;
}

export function isSupabaseAuthEnabled() {
  return Boolean(url() && anon());
}

export function isGoogleProviderEnabled() {
  return googleProviderEnabled;
}

export async function refreshGoogleProviderFlag() {
  if (!isSupabaseAuthEnabled()) {
    googleProviderEnabled = false;
    return;
  }
  try {
    const res = await fetch(`${url()}/auth/v1/settings`, {
      headers: {
        apikey: anon(),
        Authorization: `Bearer ${anon()}`,
      },
    });
    const data = (await res.json().catch(() => ({}))) as { external?: { google?: boolean } };
    googleProviderEnabled = Boolean(data.external?.google);
  } catch {
    googleProviderEnabled = false;
  }
}

export function oauthRedirectTo() {
  return `${window.location.origin}/auth/callback`;
}

export async function loadSupabaseConfig() {
  if (!configPromise) {
    configPromise = (async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/providers'));
        const data = (await res.json().catch(() => ({}))) as {
          supabaseUrl?: string;
          anonKey?: string;
          adminEmails?: string[];
        };
        if (Array.isArray(data.adminEmails)) setRuntimeAdminEmails(data.adminEmails);
        if (!isSupabaseAuthEnabled()) {
          const nextUrl = String(data.supabaseUrl || '').trim();
          const nextAnon = String(data.anonKey || '').trim();
          if (nextUrl && nextAnon) {
            runtimeUrl = nextUrl;
            runtimeAnon = nextAnon;
            client = null;
          }
        }
      } catch {
        /* Vercel without functions, or local API down */
      }
      await refreshGoogleProviderFlag();
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
