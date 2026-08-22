import { getDb } from '../db/connection.js';
import { getSetting } from './settingsService.js';
import { countOpenAccessibilityReports } from './accessibilityReportService.js';

export type AdminNotificationSeverity = 'high' | 'medium' | 'low';

export interface AdminNotification {
  id: string;
  severity: AdminNotificationSeverity;
  title: string;
  detail: string;
  tab: string;
  count: number;
  createdAt: string;
}

export function listAdminNotifications(): AdminNotification[] {
  const db = getDb();
  const count = (sql: string) => Number((db.prepare(sql).get() as { c: number }).c || 0);
  const now = new Date().toISOString();
  const items: AdminNotification[] = [];

  const due = count(
    `SELECT COUNT(*) as c FROM payment_installments
     WHERE status IN ('due', 'scheduled') AND due_at IS NOT NULL AND due_at <= datetime('now')`
  );
  if (due > 0) {
    items.push({
      id: 'due-installments',
      severity: 'high',
      title: 'פעימות לטיפול',
      detail: `${due} תשלומים מועדפים לחיוב או מעקב ידני`,
      tab: 'tracks',
      count: due,
      createdAt: now,
    });
  }

  const failed = count(`SELECT COUNT(*) as c FROM payment_installments WHERE status = 'failed'`);
  if (failed > 0) {
    items.push({
      id: 'failed-payments',
      severity: 'high',
      title: 'תשלומים שנכשלו',
      detail: `${failed} פעימות בסטטוס כשל`,
      tab: 'tracks',
      count: failed,
      createdAt: now,
    });
  }

  const lecturerPending = count(`SELECT COUNT(*) as c FROM lecturer_applications WHERE status = 'pending'`);
  if (lecturerPending > 0) {
    items.push({
      id: 'lecturer-pending',
      severity: 'medium',
      title: 'בקשות מרצים ממתינות',
      detail: `${lecturerPending} בקשות לאישור או דחייה`,
      tab: 'lecturers',
      count: lecturerPending,
      createdAt: now,
    });
  }

  const coursePending = count(`SELECT COUNT(*) as c FROM courses WHERE status = 'pending_review'`);
  if (coursePending > 0) {
    items.push({
      id: 'courses-pending',
      severity: 'medium',
      title: 'תכנים לאישור',
      detail: `${coursePending} הרצאות ממתינות לפרסום`,
      tab: 'content',
      count: coursePending,
      createdAt: now,
    });
  }

  const p88Pending = count(
    `SELECT COUNT(*) as c FROM premium_88_applications
     WHERE status IN ('submitted', 'new', 'under_review', 'call_needed')`
  );
  if (p88Pending > 0) {
    items.push({
      id: 'premium88-pending',
      severity: 'medium',
      title: 'מועמדויות נבחרת 88',
      detail: `${p88Pending} פניות ממתינות לטיפול`,
      tab: 'premium88',
      count: p88Pending,
      createdAt: now,
    });
  }

  const newLeads = count(`SELECT COUNT(*) as c FROM track_leads WHERE status = 'new'`);
  if (newLeads > 0) {
    items.push({
      id: 'track-leads-new',
      severity: 'medium',
      title: 'לידי מסלול חדשים',
      detail: `${newLeads} פניות אמיצים / הססנים ללא מעקב`,
      tab: 'leads',
      count: newLeads,
      createdAt: now,
    });
  }

  const openA11y = countOpenAccessibilityReports();
  if (openA11y > 0) {
    items.push({
      id: 'accessibility-reports-open',
      severity: 'high',
      title: 'פניות נגישות פתוחות',
      detail: `${openA11y} פניות ממתינות לטיפול (חובה משפטית)`,
      tab: 'legal',
      count: openA11y,
      createdAt: now,
    });
  }

  const unassignedTickets = count(
    `SELECT COALESCE(SUM(tickets_count), 0) as c FROM raffle_tickets WHERE raffle_id = '' OR raffle_id IS NULL`
  );
  if (unassignedTickets > 0) {
    items.push({
      id: 'raffle-unassigned',
      severity: 'low',
      title: 'כרטיסי הגרלה ללא שיוך',
      detail: `${unassignedTickets} כרטיסים ממתינים להגרלה פתוחה`,
      tab: 'raffles',
      count: unassignedTickets,
      createdAt: now,
    });
  }

  if (getSetting('raffle_terms_approved') !== '1') {
    const openRaffles = count(`SELECT COUNT(*) as c FROM raffles WHERE status = 'open'`);
    if (openRaffles > 0) {
      items.push({
        id: 'raffle-terms',
        severity: 'low',
        title: 'תקנון הגרלות לא מאושר',
        detail: 'יש הגרלות פתוחות, אבל אי אפשר להגריל זוכה לפני אישור משפטי',
        tab: 'legal',
        count: openRaffles,
        createdAt: now,
      });
    }
  }

  const severityRank: Record<AdminNotificationSeverity, number> = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || b.count - a.count);
}
