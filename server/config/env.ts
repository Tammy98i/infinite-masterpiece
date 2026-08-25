export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function appUrl() {
  return String(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/$/, '');
}

/**
 * Browser origins allowed to call this API.
 * Production: APP_URL plus optional CORS_ORIGINS (comma-separated), e.g. Vercel preview URLs.
 * Development: allow all unless CORS_ORIGINS is set.
 */
export function corsOrigins(): string[] | true {
  const listed = String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  if (!isProduction()) {
    return listed.length ? listed : true;
  }

  const origins = new Set<string>(listed);
  const app = appUrl();
  if (app) origins.add(app);
  return origins.size ? [...origins] : true;
}

function originHost(origin: string): string | null {
  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}

/** True when the browser Origin header may call this API. */
export function isCorsOriginAllowed(origin: string | undefined): boolean {
  const allowed = corsOrigins();
  if (allowed === true) return true;
  if (!origin) return true;
  if (allowed.includes(origin)) return true;
  const host = originHost(origin);
  if (!host) return false;
  return allowed.some((entry) => {
    const pattern = entry.replace(/^https?:\/\//, '');
    if (!pattern.startsWith('*.')) return false;
    const suffix = pattern.slice(1);
    return host === pattern.slice(2) || host.endsWith(suffix);
  });
}

/** Public origin that serves `/uploads` (API host). Empty = same origin as this process. */
export function publicUploadOrigin(): string {
  return String(process.env.PUBLIC_UPLOAD_ORIGIN || '').replace(/\/$/, '');
}

/** Prefix `/uploads/...` for split hosting. Leave https URLs and `/captions` unchanged. */
export function publicMediaUrl(path: string): string {
  if (!path) return path;
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  if (!path.startsWith('/uploads')) return path;
  const origin = publicUploadOrigin();
  return origin ? `${origin}${path}` : path;
}

/**
 * When the SPA is on Vercel, set SERVE_SPA=false on the API host so Express
 * does not try to serve `dist/`. Docker monolith leaves this unset (serves SPA).
 */
export function serveSpa(): boolean {
  const flag = String(process.env.SERVE_SPA || '').toLowerCase();
  if (flag === '0' || flag === 'false' || flag === 'no') return false;
  if (flag === '1' || flag === 'true' || flag === 'yes') return true;
  return isProduction();
}
