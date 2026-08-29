import {
  getSupabase,
  isGoogleProviderEnabled,
  isPhoneProviderEnabled,
  isSupabaseAuthEnabled,
  oauthRedirectTo,
  loadSupabaseConfig,
  refreshAuthProviderFlags,
} from '../lib/supabase';
import { configuredAdminEmails } from '../data/adminEmails';
import { payloadFromSupabase, phoneProfileIdentity, type ProfileRow } from '../lib/supabaseUser';
import { hebrewAuthError } from '../lib/hebrewAuthError';
import { markExpectedPasswordRecovery, markPasswordRecovery, clearPasswordRecovery } from '../lib/passwordRecovery';
import { shouldExchangeAuthCode } from '../lib/oauthCallback';
import { toE164IL } from '../utils/phone';
import { apiRequest, type AuthUserPayload } from './auth';

export { isSupabaseAuthEnabled, hebrewAuthError };

export class EmailConfirmationRequiredError extends Error {
  constructor() {
    super('נרשמת בהצלחה. בדקו את האימייל לאישור החשבון, ואז התחברו עם האימייל והסיסמה.');
    this.name = 'EmailConfirmationRequiredError';
  }
}

function requireE164(phone: string) {
  const e164 = toE164IL(phone);
  if (!e164) {
    throw new Error('נא להזין מספר בפורמט בינלאומי, למשל +972501234567');
  }
  return e164;
}

async function profileForUser(userId: string): Promise<ProfileRow | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .select('role, subscription_plan, is_founder, staff_desk, staff_status, full_name')
    .eq('id', userId)
    .maybeSingle();
  return (data as ProfileRow | null) || null;
}

export async function sessionFromSupabaseUser(accessToken: string, fullName = '') {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error(hebrewAuthError(error?.message || 'טוקן ההתחברות לא תקין. נסו להתחבר מחדש'));
  }

  const user = data.user;
  const profile = await profileForUser(user.id);
  return {
    token: accessToken,
    user: payloadFromSupabase({
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName:
        fullName ||
        String(user.user_metadata?.full_name || user.user_metadata?.name || ''),
      avatar: typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null,
      profile,
      extraAdminEmails: configuredAdminEmails().join(','),
    }),
  };
}

export async function restoreSupabaseBrowserSession() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) return null;
  try {
    return await sessionFromSupabaseUser(data.session.access_token);
  } catch {
    return null;
  }
}

async function syncAccessToken(accessToken: string, fullName = '') {
  const fromSupabase = await sessionFromSupabaseUser(accessToken, fullName);
  // Express / Vercel may mirror the user into a local DB. That row must never
  // replace the Supabase identity (email, role, id) shown across the site.
  void apiRequest<{ token: string; user: AuthUserPayload }>('/api/auth/supabase', {
    method: 'POST',
    body: JSON.stringify({ accessToken, fullName }),
  }).catch(() => undefined);
  return fromSupabase;
}

export async function supabaseLogin(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session?.access_token) {
      throw new Error(hebrewAuthError(error?.message || 'אימייל או סיסמה שגויים'));
    }
    return await syncAccessToken(data.session.access_token);
  } catch (err) {
    if (err instanceof Error && /[\u0590-\u05FF]/.test(err.message)) throw err;
    throw new Error(hebrewAuthError(err instanceof Error ? err.message : 'אימייל או סיסמה שגויים'));
  }
}

export async function supabaseRegister(fullName: string, email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: oauthRedirectTo(),
      },
    });
    if (error) throw new Error(hebrewAuthError(error.message));
    if (!data.session?.access_token) {
      throw new EmailConfirmationRequiredError();
    }
    return await syncAccessToken(data.session.access_token, fullName);
  } catch (err) {
    if (err instanceof EmailConfirmationRequiredError) throw err;
    if (err instanceof Error && /[\u0590-\u05FF]/.test(err.message)) throw err;
    throw new Error(hebrewAuthError(err instanceof Error ? err.message : 'ההרשמה נכשלה'));
  }
}

async function persistOwnPhoneProfile(userId: string, phone: string, fullName: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const identity = phoneProfileIdentity(phone, fullName);
  await supabase.auth.updateUser({ data: { full_name: identity.fullName } }).catch(() => undefined);
  await supabase
    .from('profiles')
    .update({ full_name: identity.fullName })
    .eq('id', userId);
  // Email is blocked when the current value is already set; filling a blank
  // email is allowed after the SQL trigger in supabase/profiles.sql is applied.
  await supabase.from('profiles').update({ email: identity.email }).eq('id', userId);
}

export async function supabaseStartPhoneOtp(phone: string, fullName = '') {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');
  await loadSupabaseConfig();
  await refreshAuthProviderFlags();
  if (!isPhoneProviderEnabled()) {
    throw new Error(
      'הרשמה בטלפון עדיין לא הופעלה. ב-Supabase: Authentication → Providers → Phone, והגדירו ספק SMS (Twilio).'
    );
  }

  const e164 = requireE164(phone);
  const { error } = await supabase.auth.signInWithOtp({
    phone: e164,
    options: fullName.trim() ? { data: { full_name: fullName.trim() } } : undefined,
  });
  if (error) throw new Error(hebrewAuthError(error.message));
  return e164;
}

export async function supabaseVerifyPhoneOtp(phone: string, code: string, fullName = '') {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');

  const e164 = requireE164(phone);
  const token = code.replace(/\D/g, '');
  if (token.length < 6) throw new Error('נא להזין את הקוד בן 6 הספרות מה-SMS');

  const { data, error } = await supabase.auth.verifyOtp({
    phone: e164,
    token,
    type: 'sms',
  });
  if (error || !data.session?.access_token) {
    throw new Error(hebrewAuthError(error?.message || 'הקוד שגוי. בדקו את ההודעה ונסו שוב'));
  }

  if (data.user) {
    await persistOwnPhoneProfile(data.user.id, e164, fullName).catch(() => undefined);
  }

  return syncAccessToken(data.session.access_token, fullName);
}

export async function supabaseStartGoogleOAuth(nextPath?: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');
  await loadSupabaseConfig();
  await refreshAuthProviderFlags();
  if (!isGoogleProviderEnabled()) {
    throw new Error('התחברות עם Google עדיין לא הופעלה ב-Supabase');
  }

  const redirectTo = nextPath
    ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
    : oauthRedirectTo();
  const oauthOptions = {
    redirectTo,
    scopes: 'email profile',
    queryParams: { access_type: 'offline' },
  };

  const { data: current } = await supabase.auth.getSession();
  if (current.session?.access_token) {
    const identities = current.session.user.identities || [];
    const alreadyGoogle = identities.some((item) => item.provider === 'google');
    if (!alreadyGoogle) {
      const linked = await supabase.auth.linkIdentity({
        provider: 'google',
        options: oauthOptions,
      });
      if (!linked.error) return;
    }
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: oauthOptions,
  });
  if (error) throw new Error(hebrewAuthError(error.message));
}

export async function supabaseCompleteOAuthFromUrl() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');

  // Subscribe before exchanging so a PKCE recovery link (often `?code=` without
  // `type=recovery`) still marks the reset flow even if getSession already exists.
  const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') markPasswordRecovery();
  });

  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const oauthError = params.get('error_description') || params.get('error');
    if (oauthError) throw new Error(hebrewAuthError(oauthError));

    let { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(hebrewAuthError(error.message));
    if (shouldExchangeAuthCode(Boolean(data.session?.access_token), code) && code) {
      const exchanged = await supabase.auth.exchangeCodeForSession(code);
      if (exchanged.error) throw new Error(hebrewAuthError(exchanged.error.message));
      data = exchanged.data;
    }

    if (!data.session?.access_token) {
      throw new Error('ההתחברות לא הושלמה. נסו שוב.');
    }

    const fullName = String(
      data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || ''
    );
    return await syncAccessToken(data.session.access_token, fullName);
  } finally {
    authSub.subscription.unsubscribe();
  }
}

export async function supabaseRequestPasswordReset(email: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) throw new Error('נא להזין אימייל תקין');
  markExpectedPasswordRecovery();
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      // Keep type=recovery on our redirect so PKCE `?code=` still opens /auth/reset.
      redirectTo: `${origin}/auth/callback?type=recovery`,
    });
    if (error) throw new Error(hebrewAuthError(error.message));
  } catch (err) {
    clearPasswordRecovery();
    if (err instanceof Error && /[\u0590-\u05FF]/.test(err.message)) throw err;
    throw new Error(hebrewAuthError(err instanceof Error ? err.message : 'שליחת קישור האיפוס נכשלה'));
  }
}

export async function supabaseUpdatePassword(password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');
  if (password.length < 8) throw new Error('הסיסמה חייבת להיות לפחות 8 תווים');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(hebrewAuthError(error.message));
}

export function isPasswordRecoveryRedirect() {
  if (typeof window === 'undefined') return false;
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return search.get('type') === 'recovery' || hash.get('type') === 'recovery';
}

export function subscribeSupabaseAuth(
  handler: (event: string, accessToken: string | null) => void
) {
  const supabase = getSupabase();
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    handler(event, session?.access_token || null);
  });
  return () => data.subscription.unsubscribe();
}

export async function supabaseSignOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}
