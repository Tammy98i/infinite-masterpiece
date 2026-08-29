import { getDb } from '../db/connection.js';
import { getSetting, setSetting } from './settingsService.js';
import { BUILT_IN_ADMIN_EMAILS, mergeAdminEmails, parseAdminEmails } from '../../src/data/adminEmails.ts';

export function extraAdminEmails() {
  try {
    return parseAdminEmails(JSON.parse(getSetting('admin_emails') || '[]'));
  } catch {
    return [];
  }
}

export function listAdminEmails() {
  const extra = extraAdminEmails();
  return {
    emails: mergeAdminEmails(
      BUILT_IN_ADMIN_EMAILS,
      extra,
      process.env.ADMIN_EMAILS,
      process.env.VITE_ADMIN_EMAILS
    ),
    builtIn: [...BUILT_IN_ADMIN_EMAILS],
    extra,
  };
}

export function saveExtraAdminEmails(emails: string[]) {
  const extra = parseAdminEmails(emails).filter((email) => !BUILT_IN_ADMIN_EMAILS.includes(email));
  setSetting('admin_emails', JSON.stringify(extra));
  const all = mergeAdminEmails(BUILT_IN_ADMIN_EMAILS, extra);
  const db = getDb();
  for (const email of all) {
    db.prepare(`UPDATE users SET role = 'admin' WHERE lower(email) = ?`).run(email);
  }
  return listAdminEmails();
}
