import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';

export interface PaymentRow {
  id: string;
  userId: string;
  userName: string;
  email: string;
  plan: string;
  source: string;
  createdAt: string;
}

export function recordPayment(userId: string, plan: string, source: 'user' | 'admin' | 'stripe') {
  try {
    getDb()
      .prepare(`INSERT INTO payments (id, user_id, plan, source, created_at) VALUES (?, ?, ?, ?, ?)`)
      .run(randomUUID(), userId, plan, source, new Date().toISOString());
  } catch {
    /* ledger must not block subscription */
  }
}

export function listPayments(): PaymentRow[] {
  return (
    getDb()
      .prepare(
        `SELECT p.id, p.user_id, p.plan, p.source, p.created_at, u.full_name, u.email
         FROM payments p
         LEFT JOIN users u ON u.id = p.user_id
         ORDER BY p.created_at DESC
         LIMIT 200`
      )
      .all() as Array<Record<string, unknown>>
  ).map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    userName: String(row.full_name || ''),
    email: String(row.email || ''),
    plan: String(row.plan),
    source: String(row.source),
    createdAt: String(row.created_at),
  }));
}
