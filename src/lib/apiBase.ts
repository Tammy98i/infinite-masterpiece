/**
 * Frontend → API origin.
 *
 * Local Vite: leave VITE_API_URL empty so `/api` goes through the same-origin proxy.
 * On Vercel, serverless functions under /api handle auth; other routes fall back
 * to static catalog data when the Node API is not hosted.
 */
const raw =
  typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env.VITE_API_URL === 'string'
    ? import.meta.env.VITE_API_URL.trim()
    : '';

export function apiOrigin(): string {
  return raw.replace(/\/$/, '');
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  const origin = apiOrigin();
  return origin ? `${origin}${p}` : p;
}
