/** Shared production-readiness flags (no secrets in the payload). */

function present(env: Record<string, string | undefined>, ...keys: string[]) {
  return keys.some((key) => Boolean(String(env[key] || '').trim()));
}

export function productionReadiness(env: Record<string, string | undefined> = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const production = nodeEnv === 'production';
  const missing: string[] = [];
  const warnings: string[] = [];

  const appUrl = String(env.APP_URL || '').trim();
  if (production) {
    if (!appUrl || /localhost|127\.0\.0\.1/i.test(appUrl)) missing.push('APP_URL');
    if (!present(env, 'SUPABASE_URL', 'VITE_SUPABASE_URL')) missing.push('SUPABASE_URL');
    if (!present(env, 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY')) missing.push('SUPABASE_ANON_KEY');
    if (!present(env, 'SUPABASE_SERVICE_ROLE_KEY')) warnings.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!present(env, 'RESEND_API_KEY')) warnings.push('RESEND_API_KEY');
    if (!present(env, 'S3_BUCKET')) warnings.push('S3_BUCKET');
    if (!present(env, 'STRIPE_SECRET_KEY')) warnings.push('STRIPE_SECRET_KEY');
    const a11yName = String(env.A11Y_COORDINATOR_NAME || env.VITE_A11Y_COORDINATOR_NAME || '').trim();
    if (!a11yName || /רכז\/ת|צוות Infinite/i.test(a11yName)) warnings.push('A11Y_COORDINATOR_NAME');
    if (!present(env, 'A11Y_CONTACT_PHONE', 'VITE_A11Y_CONTACT_PHONE')) warnings.push('A11Y_CONTACT_PHONE');
    const monthly = Number(env.LIBRARY_MONTHLY_ILS || env.VITE_LIBRARY_MONTHLY_ILS || 0);
    const annual = Number(env.LIBRARY_ANNUAL_ILS || env.VITE_LIBRARY_ANNUAL_ILS || 0);
    if (present(env, 'STRIPE_SECRET_KEY') && !(monthly > 0 && annual > 0)) {
      warnings.push('LIBRARY_MONTHLY_ILS');
    }
  }

  return {
    production,
    ready: !production || missing.length === 0,
    missing,
    warnings,
  };
}
