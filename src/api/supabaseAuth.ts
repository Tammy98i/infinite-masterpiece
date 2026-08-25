import { getSupabase, isSupabaseAuthEnabled } from '../lib/supabase';
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
  return message || 'הבקשה נכשלה';
}

export async function supabaseLogin(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('התחברות חיצונית אינה מוגדרת');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    throw new Error(hebrewAuthError(error?.message || 'אימייל או סיסמה שגויים'));
  }

  return apiRequest<{ token: string; user: AuthUserPayload }>('/api/auth/supabase', {
    method: 'POST',
    body: JSON.stringify({ accessToken: data.session.access_token }),
  });
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

  return apiRequest<{ token: string; user: AuthUserPayload }>('/api/auth/supabase', {
    method: 'POST',
    body: JSON.stringify({ accessToken: data.session.access_token, fullName }),
  });
}

export async function supabaseSignOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut().catch(() => undefined);
}
