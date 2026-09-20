type ProductionEnv = Record<string, string | undefined>;

function configured(env: ProductionEnv, name: string) {
  return Boolean(env[name]?.trim());
}

export function productionEnvironmentErrors(env: ProductionEnv = process.env) {
  if (env.NODE_ENV !== 'production') return [];

  const errors: string[] = [];
  const appUrl = env.APP_URL?.trim() || '';
  try {
    const parsed = new URL(appUrl);
    if (parsed.protocol !== 'https:') errors.push('APP_URL must use HTTPS');
    if (/localhost|your-domain/i.test(parsed.hostname)) errors.push('APP_URL must use the published hostname');
  } catch {
    errors.push('APP_URL must be a valid HTTPS URL');
  }

  for (const name of [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'EMAIL_FROM',
  ]) {
    if (!configured(env, name)) errors.push(`${name} is required in production`);
  }

  if (configured(env, 'EMAIL_FROM') && !/^[^<>]+<[^\s@]+@[^\s@]+\.[^\s@]+>$/.test(env.EMAIL_FROM!.trim())) {
    errors.push('EMAIL_FROM must include a verified sender name and email');
  }

  return [...new Set(errors)];
}

export function validateProductionEnvironment(env: ProductionEnv = process.env) {
  const errors = productionEnvironmentErrors(env);
  if (errors.length) {
    throw new Error(`Production configuration is incomplete:\n- ${errors.join('\n- ')}`);
  }
}
