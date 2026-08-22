import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';

export const ALLOWED_EVENTS = [
  'video_view_started',
  'video_25_percent',
  'video_50_percent',
  'video_75_percent',
  'video_completed',
  'video_paused',
  'video_resumed',
  'course_play_started',
  'course_resume_started',
  'course_chapter_completed',
  'course_view',
  'library_view',
  'paywall_opened',
  'upgrade_clicked',
  'trial_started',
  'subscription_started',
  'subscription_cancelled',
  'checkout_started',
  'checkout_completed',
  'checkout_failed',
  'lecturer_application_started',
  'lecturer_application_submitted',
  'lecturer_approved',
  'lecturer_rejected',
  'lecture_uploaded',
  'lecture_submitted_for_review',
  'lecture_published',
  'admin_opened_dashboard',
  'admin_changed_user_role',
  'admin_granted_access',
  'admin_blocked_user',
  'admin_published_video',
  'premium_88_page_view',
  'premium_88_cta_clicked',
  'premium_88_application_submitted',
  'premium_88_approved',
  'track_selection_viewed',
  'brave_track_clicked',
  'hesitant_track_clicked',
  'hesitant_8_payment_started',
  'hesitant_8_payment_completed',
  'hesitant_80_payment_due',
  'hesitant_80_payment_completed',
  'hesitant_800_payment_due',
  'hesitant_800_payment_completed',
  'hesitant_8000_payment_due',
  'hesitant_8000_payment_completed',
  'hesitant_payment_failed',
  'brave_payment_completed',
  'raffle_ticket_granted',
  'raffle_created',
  'raffle_winner_selected',
  'vod_access_unlocked',
  'vod_access_paused',
  'webinar_page_view',
  'webinar_registration_started',
  'webinar_registration_completed',
  'webinar_add_to_calendar_clicked',
  'webinar_whatsapp_group_clicked',
  'webinar_form_view',
  'webinar_step_a_started',
  'webinar_step_a_completed',
  'webinar_step_b_started',
  'webinar_step_b_completed',
  'webinar_fit_section_viewed',
  'webinar_fit_cta_clicked',
  'webinar_cta_clicked',
  'webinar_registration_abandoned',
  'webinar_thank_you_step_completed',
  'webinar_exit_intent_shown',
  'webinar_exit_intent_submitted',
] as const;

export type AnalyticsEventName = (typeof ALLOWED_EVENTS)[number];

const ALLOWED = new Set<string>(ALLOWED_EVENTS);

export function isAllowedEvent(event: string): event is AnalyticsEventName {
  return ALLOWED.has(event);
}

export function trackEvent(
  event: string,
  options?: { userId?: string | null; properties?: Record<string, string> }
) {
  if (!isAllowedEvent(event)) return;
  try {
    const props = JSON.stringify(options?.properties || {});
    if (props.length > 2000) return;
    getDb()
      .prepare(`INSERT INTO analytics_events (id, event, user_id, properties, created_at) VALUES (?, ?, ?, ?, ?)`)
      .run(randomUUID(), event, options?.userId || null, props, new Date().toISOString());
  } catch {
    /* analytics must never break the product */
  }
}

export function countEvent(event: string) {
  return (getDb().prepare(`SELECT COUNT(*) as c FROM analytics_events WHERE event = ?`).get(event) as { c: number })
    .c;
}

export function getAnalyticsSummary() {
  const db = getDb();
  const totals = (
    db.prepare(`SELECT event, COUNT(*) as c FROM analytics_events GROUP BY event ORDER BY c DESC`).all() as Array<{
      event: string;
      c: number;
    }>
  ).map((row) => ({ event: row.event, count: row.c }));

  const recent = (
    db
      .prepare(
        `SELECT id, event, user_id, properties, created_at FROM analytics_events ORDER BY created_at DESC LIMIT 80`
      )
      .all() as Array<{
      id: string;
      event: string;
      user_id: string | null;
      properties: string;
      created_at: string;
    }>
  ).map((row) => {
    let properties: Record<string, string> = {};
    try {
      properties = JSON.parse(row.properties || '{}');
    } catch {
      properties = {};
    }
    return {
      id: row.id,
      event: row.event,
      userId: row.user_id,
      properties,
      createdAt: row.created_at,
    };
  });

  return {
    totals,
    funnel: {
      paywallOpened: countEvent('paywall_opened'),
      upgradeClicked: countEvent('upgrade_clicked'),
      trialStarted: countEvent('trial_started'),
      subscriptionStarted: countEvent('subscription_started'),
      subscriptionCancelled: countEvent('subscription_cancelled'),
    },
    video: {
      started: countEvent('video_view_started'),
      p25: countEvent('video_25_percent'),
      p50: countEvent('video_50_percent'),
      p75: countEvent('video_75_percent'),
      completed: countEvent('video_completed'),
    },
    lecturers: {
      started: countEvent('lecturer_application_started'),
      submitted: countEvent('lecturer_application_submitted'),
      approved: countEvent('lecturer_approved'),
      rejected: countEvent('lecturer_rejected'),
      uploaded: countEvent('lecture_uploaded'),
      pending: countEvent('lecture_submitted_for_review'),
      published: countEvent('lecture_published'),
    },
    recent,
  };
}
