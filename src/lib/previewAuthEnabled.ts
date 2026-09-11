/** Demo / preview staff login (`@infinitemasterpiece.local`). Off in production unless explicitly allowed. */

export function previewAuthEnabledFromEnv(
  env: Record<string, string | undefined>,
  runtime: { viteDev?: boolean; nodeEnv?: string } = {}
) {
  const explicit = String(env.ALLOW_PREVIEW_LOGIN || env.VITE_ALLOW_PREVIEW_LOGIN || '')
    .trim()
    .toLowerCase();
  if (explicit === '1' || explicit === 'true' || explicit === 'yes') return true;
  if (explicit === '0' || explicit === 'false' || explicit === 'no') return false;
  if (runtime.viteDev) return true;
  return (runtime.nodeEnv || env.NODE_ENV || '') !== 'production';
}

export function isPreviewAuthEnabled() {
  const meta = (import.meta as { env?: { DEV?: boolean } }).env;
  return previewAuthEnabledFromEnv(typeof process !== 'undefined' ? process.env : {}, {
    viteDev: Boolean(meta?.DEV),
    nodeEnv: typeof process !== 'undefined' ? process.env.NODE_ENV : undefined,
  });
}

export const PREVIEW_AUTH_DISABLED_MESSAGE = 'כניסת הדמו אינה זמינה בסביבה זו';
