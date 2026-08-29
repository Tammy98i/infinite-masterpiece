import {
  getSupabase,
  isGoogleProviderEnabled,
  isPhoneProviderEnabled,
  isSupabaseAuthEnabled,
  oauthRedirectTo,
  loadSupabaseConfig,
  refreshAuthProviderFlags,
} from '../lib/supabase';
import { isApiUnavailableMessage, payloadFromSupabase, type ProfileRow } from '../lib/supabaseUser';
import { isIsraeliMobile, toE164IL } from '../utils/phone';
import { apiRequest, type AuthUserPayload } from './auth';

export { isSupabaseAuthEnabled };

export class EmailConfirmationRequiredError extends Error {
  constructor() {
    super('נרשמת בהצלחה. בדקו את האימייל לאישור החשבון, ואז התחברו עם האימייל והסיסמה.');
    this.name = 'EmailConfirmationRequiredError';
  }
}

function hebrewAuthError(message: string) {
  const text = message.toLowerCase();
  if (text.includes('invalid login credentials') || text.includes('invalid credentials')) {
    return 'אימייל או סיסמה שגויים';
  }
  if (text.includes('email not confirmed')) {
    return 'יש לאשר את החשבון דרך האימייל שנשלח אליכם';
  }
  if (text.includes('user already registered') || text.includes('already registered')) {
    return 'כבר קיים חשבון עם האימייל הזה';
  }
  if (text.includes('password should be at least') || text.includes('password is known to be weak')) {
    return 'הסיסמה חייבת להיות לפחות 8 תווים';
  }
  if (text.includes('unable to validate email') || text.includes('invalid format')) {
    return 'נא להזין אימייל תקין';
  }
  if (text.includes('signup requires a valid password')) {
    return 'נא להזין סיסמה';
  }
  if (text.includes('too many requests') || text.includes('rate limit')) {
    return 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות';
  }
  if (text.includes('provider is not enabled') || text.includes('unsupported provider')) {
    if (text.includes('phone')) return 'הרשמה בטלפון עדיין לא הופעלה ב-Supabase';
    return 'התחברות עם Google עדיין לא הופעלה ב-Supabase';
  }
  if (text.includes('otp') && (text.includes('expired') || text.includes('token has expired'))) {
    return 'הקוד פג תוקף. שלחו קוד חדש';
  }
  if (text.includes('invalid otp') || text.includes('token not found') || text.includes('otp_disabled')) {
    return 'הקוד שגוי. בדקו את ההודעה ונסו שוב';
  }
  if (text.includes('invalid phone') || text.includes('phone number')) {
    return 'נא להזין נייד ישראלי תקין (05XXXXXXXX)';
  }
  if (text.includes('signups not allowed') || text.includes('signup is disabled')) {
    return 'אין חשבון עם הטלפון הזה. הירשמו קודם';
  }
  if (text.includes('sms') && (text.includes('error') || text.includes('failed'))) {
    return 'שליחת ה-SMS נכשלה. בדקו את מספר הטלפון או נסו שוב בעוד רגע';
  }
  return message || 'הבקשה נכשלה';
}

function requireE164(phone: string) {
  if (!isIsraeliMobile(phone)) {
    throw new Error('נא להזין נייד ישראלי תקין (05XXXXXXXX)');
  }
  const e164 = toE164IL(phone);
  if (!e164) throw new Error('נא להזין נייד ישראלי תקין (05XXXXXXXX)');
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
      extraAdminEmails: '',
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
  try {
    return await apiRequest<{ token: string; user: AuthUserPayload }>('/api/auth/supabase', {
      method: 'POST',
      body: JSON.stringify({ accessToken, fullName }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (!isApiUnavailableMessage(message)) throw err;
    return sessionFromSupabaseUser(accessToken, fullName);
  }
}

export async function supabaseLogin(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    throw new Error(hebrewAuthError(error?.message || 'אימייל או סיסמה שגויים'));
  }

  return syncAccessToken(data.session.access_token);
}

export async function supabaseRegister(fullName: string, email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');

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

  return syncAccessToken(data.session.access_token, fullName);
}

export async function supabaseStartPhoneOtp(phone: string, options?: { fullName?: string; createUser?: boolean }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');
  await loadSupabaseConfig();
  await refreshAuthProviderFlags();
  if (!isPhoneProviderEnabled()) {
    throw new Error('הרשמה בטלפון עדיין לא הופעלה ב-Supabase');
  }

  const e164 = requireE164(phone);
  const { error } = await supabase.auth.signInWithOtp({
    phone: e164,
    options: {
      channel: 'sms',
      shouldCreateUser: options?.createUser !== false,
      data: options?.fullName ? { full_name: options.fullName } : undefined,
    },
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

  if (fullName.trim() && data.user) {
    await supabase.auth.updateUser({ data: { full_name: fullName.trim() } }).catch(() => undefined);
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

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw new Error(hebrewAuthError(error.message));
}

export async function supabaseCompleteOAuthFromUrl() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw new Error(hebrewAuthError(error.message));
  }

  const oauthError = params.get('error_description') || params.get('error');
  if (oauthError) throw new Error(hebrewAuthError(oauthError));

  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(hebrewAuthError(error.message));
  if (!data.session?.access_token) {
    throw new Error('ההתחברות לא הושלמה. נסו שוב.');
  }

  const fullName = String(
    data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || ''
  );
  return syncAccessToken(data.session.access_token, fullName);
}

export async function supabaseSignOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut().catch(() => undefined);
}
