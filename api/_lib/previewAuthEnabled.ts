export function isPreviewAuthEnabled() {
  const explicit = String(process.env.ALLOW_PREVIEW_LOGIN || process.env.VITE_ALLOW_PREVIEW_LOGIN || '')
    .trim()
    .toLowerCase();
  if (explicit === '1' || explicit === 'true' || explicit === 'yes') return true;
  if (explicit === '0' || explicit === 'false' || explicit === 'no') return false;
  return process.env.NODE_ENV !== 'production';
}

export const PREVIEW_AUTH_DISABLED_MESSAGE = 'כניסת הדמו אינה זמינה בסביבה זו';
