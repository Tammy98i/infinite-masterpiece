import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';
import { trackEvent } from './analyticsService.js';

export type Premium88Status =
  | 'submitted'
  | 'under_review'
  | 'call_needed'
  | 'approved'
  | 'rejected'
  | 'waitlist'
  | 'paid'
  | 'onboarded';

const ALLOWED: Premium88Status[] = [
  'submitted',
  'under_review',
  'call_needed',
  'approved',
  'rejected',
  'waitlist',
  'paid',
  'onboarded',
];

export function createPremium88Application(input: {
  fullName: string;
  phone: string;
  email: string;
  field: string;
  businessStage: string;
  goal: string;
  links?: string;
  notes?: string;
}) {
  const fullName = String(input.fullName || '').trim();
  const phone = String(input.phone || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const field = String(input.field || '').trim();
  const businessStage = String(input.businessStage || '').trim();
  const goal = String(input.goal || '').trim();
  if (!fullName || !phone || !email || !field || !businessStage || !goal) {
    throw Object.assign(new Error('נא למלא את כל השדות החובה'), { status: 400 });
  }

  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO premium_88_applications (
        id, full_name, phone, email, creative_field, business_stage, goal, links, open_notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)`
    )
    .run(
      id,
      fullName,
      phone,
      email,
      field,
      businessStage,
      goal,
      String(input.links || '').trim(),
      String(input.notes || '').trim(),
      new Date().toISOString()
    );

  trackEvent('premium_88_application_submitted', {
    properties: { applicationId: id, email },
  });

  return { id };
}

function mapRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    phone: String(row.phone),
    email: String(row.email),
    field: String(row.creative_field || ''),
    businessStage: String(row.business_stage || ''),
    goal: String(row.goal || ''),
    links: String(row.links || ''),
    notes: String(row.open_notes || ''),
    status: String(row.status || 'submitted') as Premium88Status,
    adminNotes: String(row.admin_notes || ''),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || row.created_at || ''),
  };
}

export function listPremium88Applications() {
  const rows = getDb()
    .prepare(`SELECT * FROM premium_88_applications ORDER BY created_at DESC LIMIT 200`)
    .all() as Array<Record<string, unknown>>;
  return rows.map(mapRow);
}

export function reviewPremium88Application(
  id: string,
  status: string,
  adminNotes?: string
) {
  if (!ALLOWED.includes(status as Premium88Status)) {
    throw Object.assign(new Error('סטטוס לא תקין'), { status: 400 });
  }
  const existing = getDb().prepare(`SELECT * FROM premium_88_applications WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) throw Object.assign(new Error('מועמדות לא נמצאה'), { status: 404 });

  getDb()
    .prepare(
      `UPDATE premium_88_applications
       SET status = ?, admin_notes = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(status, String(adminNotes ?? existing.admin_notes ?? ''), new Date().toISOString(), id);

  if (status === 'approved') {
    trackEvent('premium_88_approved', { properties: { applicationId: id } });
  }

  const row = getDb().prepare(`SELECT * FROM premium_88_applications WHERE id = ?`).get(id) as Record<
    string,
    unknown
  >;
  return mapRow(row);
}
