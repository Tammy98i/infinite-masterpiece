import { getDb } from '../db/connection.js';
import { listPremium88Applications } from './premium88Service.js';
import { listApplications } from './lecturerService.js';
import { listWebinarRegistrations } from './webinarService.js';

export function listCrmLeads() {
  const trackLeads = (
    getDb()
      .prepare(
        `SELECT id, track_type, full_name, phone, email, field, status, created_at
         FROM track_leads ORDER BY created_at DESC LIMIT 150`
      )
      .all() as Array<Record<string, unknown>>
  ).map((row) => ({
    id: String(row.id),
    source: 'track' as const,
    sourceLabel: row.track_type === 'brave' ? 'מסלול אמיצים' : 'מסלול הססנים',
    name: String(row.full_name),
    phone: String(row.phone || ''),
    email: String(row.email || ''),
    interest: String(row.field || ''),
    status: String(row.status || ''),
    createdAt: String(row.created_at || ''),
  }));

  const premium88 = listPremium88Applications().map((row) => ({
    id: row.id,
    source: 'premium88' as const,
    sourceLabel: 'נבחרת 88',
    name: row.fullName,
    phone: row.phone,
    email: row.email,
    interest: row.field,
    status: row.status,
    createdAt: row.createdAt,
  }));

  const lecturers = listApplications().map((row) => ({
    id: row.id,
    source: 'lecturer' as const,
    sourceLabel: 'בקשת מרצה',
    name: row.fullName,
    phone: row.phone,
    email: row.email,
    interest: row.field || row.proposedLecture,
    status: row.status,
    createdAt: row.createdAt,
  }));

  const webinar = listWebinarRegistrations(150).map((row) => ({
    id: row.id,
    source: 'webinar' as const,
    sourceLabel: 'וובינר',
    name: row.fullName,
    phone: row.phone,
    email: row.email,
    interest: [row.interest, row.blocker].filter(Boolean).join(' · '),
    status: row.status,
    createdAt: row.createdAt,
  }));

  return [...trackLeads, ...premium88, ...lecturers, ...webinar].sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt))
  );
}
