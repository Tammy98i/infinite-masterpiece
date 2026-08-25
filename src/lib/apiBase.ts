/**
 * Frontend → API origin.
 *
 * Local Vite: leave VITE_API_URL empty so `/api` and `/uploads` go through the
 * same-origin proxy (vite.config.ts). Do not proxy production traffic through
 * Vercel — 400MB video uploads will fail serverless limits.
 */
const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? '';

export function apiOrigin(): string {
  return raw.replace(/\/$/, '');
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  const origin = apiOrigin();
  return origin ? `${origin}${p}` : p;
}

/**
 * Resolve `/uploads/...` when the API is on another host.
 * `/captions/...` stays on the SPA origin (Vercel `public/`).
 */
export function mediaUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  if (!path.startsWith('/uploads')) return path;
  const origin = apiOrigin();
  return origin ? `${origin}${path}` : path;
}
