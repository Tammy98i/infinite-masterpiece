import { getDb } from '../db/connection.js';

export function getSetting(key: string) {
  const row = getDb().prepare(`SELECT value FROM site_settings WHERE key = ?`).get(key) as
    | { value: string }
    | undefined;
  return row?.value || '';
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      `INSERT INTO site_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(key, value);
  return getSetting(key);
}
