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
let googleProviderEnabled = Boolean(buildUrl && buildAnon);
let emailProviderEnabled = Boolean(buildUrl && buildAnon);
let phoneProviderEnabled = false;

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

export function isEmailProviderEnabled() {
  return emailProviderEnabled;
}

export function isPhoneProviderEnabled() {
  return phoneProviderEnabled;
}

export async function refreshAuthProviderFlags() {
  if (!isSupabaseAuthEnabled()) {
    googleProviderEnabled = false;
    emailProviderEnabled = false;
    phoneProviderEnabled = false;
    return;
  }
  try {
    const res = await fetch(`${url()}/auth/v1/settings`, {
      headers: {
        apikey: anon(),
        Authorization: `Bearer ${anon()}`,
      },
    });
    const data = (await res.json().catch(() => ({}))) as {
      external?: { google?: boolean; email?: boolean; phone?: boolean };
    };
    googleProviderEnabled = data.external?.google !== false;
    emailProviderEnabled = data.external?.email !== false;
    phoneProviderEnabled = Boolean(data.external?.phone);
  } catch {
    // Google is on in this project; keep the button if settings fail to load.
    googleProviderEnabled = isSupabaseAuthEnabled();
    emailProviderEnabled = isSupabaseAuthEnabled();
    phoneProviderEnabled = false;
  }
}

/** @deprecated use refreshAuthProviderFlags */
export async function refreshGoogleProviderFlag() {
  await refreshAuthProviderFlags();
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
      await refreshAuthProviderFlags();
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
        // Off on purpose: with this on, the SDK also tries to exchange the
        // PKCE `?code=` in the background as soon as the client is created,
        // racing the explicit exchange in supabaseCompleteOAuthFromUrl
        // (src/api/supabaseAuth.ts). A PKCE code is single-use, so whichever
        // side loses that race gets stuck (getSession() awaiting a consumed
        // exchange that never resolves for it) — the /auth/callback page
        // that never leaves "משלימים התחברות...". Only our own explicit
        // exchangeCodeForSession call may consume the code now.
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });
  }
  return client;
}
