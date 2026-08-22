import { getDb } from '../db/connection.js';

export const FREE_LIST_LIMIT = 3;
export const PAID_LIST_LIMIT = 200;

export function listSaved(userId: string): string[] {
  return (
    getDb()
      .prepare(`SELECT course_id FROM user_list WHERE user_id = ? ORDER BY created_at DESC`)
      .all(userId) as Array<{ course_id: string }>
  ).map((row) => row.course_id);
}

export function saveList(userId: string, courseIds: string[], unlimited: boolean) {
  const db = getDb();
  const max = unlimited ? PAID_LIST_LIMIT : FREE_LIST_LIMIT;
  const ids = [...new Set(courseIds.map(String).filter(Boolean))].slice(0, max);
  db.exec('BEGIN');
  try {
    db.prepare(`DELETE FROM user_list WHERE user_id = ?`).run(userId);
    const insert = db.prepare(`INSERT INTO user_list (user_id, course_id, created_at) VALUES (?, ?, ?)`);
    const now = new Date().toISOString();
    ids.forEach((id) => insert.run(userId, id, now));
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return { courseIds: listSaved(userId) };
}
