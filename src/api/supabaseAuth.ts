import { getSupabase, isSupabaseAuthEnabled, oauthRedirectTo } from '../lib/supabase';
import { apiRequest, type AuthUserPayload } from './auth';

export { isSupabaseAuthEnabled };

export class EmailConfirmationRequiredError extends Error {
  constructor() {
    super('נרשמת בהצלחה. בדקו את האימייל לאישור החשבון, ואז התחברו.');
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
  if (text.includes('invalid format') || text.includes('unable to validate email')) {
    return 'נא להזין אימייל תקין';
  }
  if (text.includes('signup requires a valid password')) {
    return 'נא להזין סיסמה';
  }
  if (text.includes('too many requests') || text.includes('rate limit')) {
    return 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות';
  }
  if (text.includes('provider is not enabled') || text.includes('unsupported provider')) {
    return 'התחברות עם Google עדיין לא הופעלה ב-Supabase';
  }
  return message || 'הבקשה נכשלה';
}

async function syncAccessToken(accessToken: string, fullName = '') {
  return apiRequest<{ token: string; user: AuthUserPayload }>('/api/auth/supabase', {
    method: 'POST',
    body: JSON.stringify({ accessToken, fullName }),
  });
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
    },
  });
  if (error) throw new Error(hebrewAuthError(error.message));
  if (!data.session?.access_token) {
    throw new EmailConfirmationRequiredError();
  }

  return syncAccessToken(data.session.access_token, fullName);
}

export async function supabaseStartGoogleOAuth() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: oauthRedirectTo(),
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
    throw new Error('ההתחברות עם Google לא הושלמה. נסו שוב.');
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
