/** Public values for Vercel functions. Keep this file free of Vite `import.meta`. */
export const SUPABASE_PROJECT_URL = '';
export const SUPABASE_ANON_KEY = '';

export const BUILT_IN_ADMIN_EMAILS = ['tam98iiy@gmail.com', 'infinite.masterpiece8@gmail.com'];

export function parseAdminEmails(value: string | string[] | null | undefined): string[] {
  const parts = Array.isArray(value) ? value : String(value || '').split(/[,;\n]+/);
  return [
    ...new Set(
      parts
        .map((item) => item.trim().toLowerCase())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ),
  ];
}

export function mergeAdminEmails(...groups: Array<string[] | string | undefined>) {
  return [...new Set(groups.flatMap((group) => parseAdminEmails(group)))];
}

export function supabaseEnv() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || SUPABASE_PROJECT_URL)
    .trim()
    .replace(/\/$/, '');
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY).trim();
  return { url, anonKey };
}
