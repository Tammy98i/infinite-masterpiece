import { getSupabase, isSupabaseAuthEnabled } from '../lib/supabase';
import { apiRequest, type AuthUserPayload } from './auth';

export { isSupabaseAuthEnabled };

export async function supabaseLogin(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase לא מוגדר');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    throw new Error(error?.message || 'אימייל או סיסמה שגויים');
  }

  return apiRequest<{ token: string; user: AuthUserPayload }>('/api/auth/supabase', {
    method: 'POST',
    body: JSON.stringify({ accessToken: data.session.access_token }),
  });
}

export async function supabaseRegister(fullName: string, email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase לא מוגדר');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  if (error) throw new Error(error.message);
  if (!data.session?.access_token) {
    throw new Error('נרשמת בהצלחה — בדקו את האימייל לאישור החשבון, ואז התחברו');
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
