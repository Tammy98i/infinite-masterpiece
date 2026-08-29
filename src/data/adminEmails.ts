/** Emails that get the admin role on Google / Supabase login. Add addresses here. */
export const BUILT_IN_ADMIN_EMAILS = ['tam98iiy@gmail.com'];

const STORAGE_KEY = 'mc_admin_emails';

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isLikelyEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseAdminEmails(value: string | string[] | null | undefined): string[] {
  const parts = Array.isArray(value) ? value : String(value || '').split(/[,;\n]+/);
  return [...new Set(parts.map(normalizeAdminEmail).filter(isLikelyEmail))];
}

export function mergeAdminEmails(...groups: Array<string[] | string | undefined>) {
  return [...new Set(groups.flatMap((group) => parseAdminEmails(group)))];
}

export function storedExtraAdminEmails(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    return parseAdminEmails(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return [];
  }
}

export function persistExtraAdminEmails(emails: string[]) {
  if (typeof localStorage === 'undefined') return;
  const extras = parseAdminEmails(emails).filter((email) => !BUILT_IN_ADMIN_EMAILS.includes(email));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(extras));
}

let runtimeExtras: string[] = [];

export function setRuntimeAdminEmails(emails: string[]) {
  runtimeExtras = parseAdminEmails(emails);
}

export function configuredAdminEmails(envList = ''): string[] {
  return mergeAdminEmails(BUILT_IN_ADMIN_EMAILS, envList, storedExtraAdminEmails(), runtimeExtras);
}
