/** Safe in-app redirect after login (blocks open redirects). */
export function safeNextPath(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) return null;
  return trimmed;
}

export const AUTH_NEXT_KEY = 'mc_auth_next';

export function storeAuthNext(path: string) {
  const next = safeNextPath(path);
  if (next) sessionStorage.setItem(AUTH_NEXT_KEY, next);
}

export function takeAuthNext() {
  const next = safeNextPath(sessionStorage.getItem(AUTH_NEXT_KEY));
  sessionStorage.removeItem(AUTH_NEXT_KEY);
  return next;
}
