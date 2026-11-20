import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { apiUrl } from './apiBase';
import { OAUTH_SUPABASE_ANON_KEY, OAUTH_SUPABASE_URL } from './oauthProject';
import { SUPABASE_ANON_KEY, SUPABASE_PROJECT_URL } from './supabasePublic';
import { setRuntimeAdminEmails } from '../data/adminEmails';

// Explicitly empty values opt into local auth (e.g. the Compose preview).
// Keep the existing published defaults only when the variables are absent.
const buildUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? SUPABASE_PROJECT_URL;
const buildAnon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? SUPABASE_ANON_KEY;

let runtimeUrl = '';
let runtimeAnon = '';
let configPromise: Promise<boolean> | null = null;
let client: SupabaseClient | null = null;
let oauthClient: SupabaseClient | null = null;
let googleProviderEnabled = Boolean(buildUrl && buildAnon);
let appleProviderEnabled = false;
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

export function isAppleProviderEnabled() {
  return appleProviderEnabled;
}

export function isEmailProviderEnabled() {
  return emailProviderEnabled;
}

export function isPhoneProviderEnabled() {
  return phoneProviderEnabled;
}

export async function refreshAuthProviderFlags() {
  if (!isSupabaseAuthEnabled()) {
    // Email stays on the local server. Google and Apple still start OAuth.
    googleProviderEnabled = true;
    appleProviderEnabled = true;
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
      external?: { google?: boolean; apple?: boolean; email?: boolean; phone?: boolean };
    };
    googleProviderEnabled = data.external?.google !== false;
    appleProviderEnabled = data.external?.apple === true;
    emailProviderEnabled = data.external?.email !== false;
    phoneProviderEnabled = Boolean(data.external?.phone);
  } catch {
    // Google is on in this project; keep the button if settings fail to load.
    googleProviderEnabled = true;
    appleProviderEnabled = true;
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

function authOptions() {
  return {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce' as const,
    },
  };
}

export function getSupabase() {
  if (!isSupabaseAuthEnabled()) return null;
  if (!client) client = createClient(url(), anon(), authOptions());
  return client;
}

/** Google and Apple use the publishable project even when email login stays local. */
export function getOAuthSupabase() {
  if (isSupabaseAuthEnabled()) return getSupabase();
  if (!OAUTH_SUPABASE_URL || !OAUTH_SUPABASE_ANON_KEY) return null;
  if (!oauthClient) oauthClient = createClient(OAUTH_SUPABASE_URL, OAUTH_SUPABASE_ANON_KEY, authOptions());
  return oauthClient;
}
