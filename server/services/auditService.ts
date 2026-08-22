import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';

export function writeAudit(input: {
  adminUserId: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}) {
  getDb()
    .prepare(
      `INSERT INTO audit_logs (id, admin_user_id, action_type, entity_type, entity_id, before_json, after_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      randomUUID(),
      input.adminUserId,
      input.actionType,
      input.entityType,
      input.entityId || '',
      JSON.stringify(input.before ?? null),
      JSON.stringify(input.after ?? null),
      new Date().toISOString()
    );
}

export function listAuditLogs(limit = 100) {
  const rows = getDb()
    .prepare(
      `SELECT a.id, a.admin_user_id, a.action_type, a.entity_type, a.entity_id, a.before_json, a.after_json, a.created_at,
              u.full_name as admin_name, u.email as admin_email
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.admin_user_id
       ORDER BY a.created_at DESC
       LIMIT ?`
    )
    .all(limit) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    adminUserId: String(row.admin_user_id || ''),
    adminName: String(row.admin_name || ''),
    adminEmail: String(row.admin_email || ''),
    actionType: String(row.action_type),
    entityType: String(row.entity_type),
    entityId: String(row.entity_id || ''),
    before: safeJson(row.before_json),
    after: safeJson(row.after_json),
    createdAt: String(row.created_at || ''),
  }));
}

function safeJson(raw: unknown) {
  try {
    return JSON.parse(String(raw || 'null'));
  } catch {
    return null;
  }
}
