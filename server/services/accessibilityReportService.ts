import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';

export type AccessibilityReportStatus = 'open' | 'in_progress' | 'resolved';

export function createAccessibilityReport(input: {
  fullName: string;
  email: string;
  phone?: string;
  pageUrl?: string;
  message: string;
}) {
  const fullName = String(input.fullName || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const phone = String(input.phone || '').trim();
  const pageUrl = String(input.pageUrl || '').trim().slice(0, 500);
  const message = String(input.message || '').trim();

  if (!fullName || !email.includes('@') || message.length < 10) {
    throw Object.assign(new Error('נא למלא שם, דוא"ל תקין ותיאור מפורט (10 תווים לפחות)'), { status: 400 });
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO accessibility_reports (
        id, full_name, email, phone, page_url, message, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
    )
    .run(id, fullName, email, phone, pageUrl, message, createdAt, createdAt);

  return { id, createdAt };
}

export function listAccessibilityReports(limit = 100) {
  const rows = getDb()
    .prepare(
      `SELECT id, full_name, email, phone, page_url, message, status, admin_notes, created_at, updated_at, resolved_at
       FROM accessibility_reports
       ORDER BY datetime(created_at) DESC
       LIMIT ?`,
    )
    .all(limit) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    fullName: String(row.full_name),
    email: String(row.email),
    phone: String(row.phone || ''),
    pageUrl: String(row.page_url || ''),
    message: String(row.message),
    status: String(row.status) as AccessibilityReportStatus,
    adminNotes: String(row.admin_notes || ''),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
  }));
}

export function updateAccessibilityReportStatus(
  id: string,
  status: AccessibilityReportStatus,
  adminNotes?: string,
) {
  const now = new Date().toISOString();
  const resolvedAt = status === 'resolved' ? now : null;
  const result = getDb()
    .prepare(
      `UPDATE accessibility_reports
       SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = ?, resolved_at = COALESCE(?, resolved_at)
       WHERE id = ?`,
    )
    .run(status, adminNotes?.trim() || null, now, resolvedAt, id);

  if (result.changes === 0) {
    throw Object.assign(new Error('פנייה לא נמצאה'), { status: 404 });
  }

  return { id, status, updatedAt: now };
}

export function countOpenAccessibilityReports(): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) as c FROM accessibility_reports WHERE status IN ('open', 'in_progress')`)
    .get() as { c: number };
  return Number(row.c || 0);
}
