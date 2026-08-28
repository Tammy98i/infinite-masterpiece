import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';
import {
  DEFAULT_WEBINAR_CONFIG,
  type WebinarConfig,
  type WebinarPublicPayload,
} from '../../src/constants/webinar.ts';
import { getSetting, setSetting } from './settingsService.js';
import { parseIsraeliDateTime } from '../../src/utils/webinarTime.ts';
import { isIsraeliMobile } from '../../src/utils/phone.ts';
import { countEvent, trackEvent } from './analyticsService.js';
import { isOnboardingSender, isWebinarEmailEnabled, sendWebinarConfirmationEmail } from './webinarEmailService.js';
import { postWebinarWebhook } from './webinarWebhookService.js';

const CONFIG_KEY = 'webinar_config';

function parseConfig(raw: string): WebinarConfig {
  if (!raw) return { ...DEFAULT_WEBINAR_CONFIG };
  try {
    const parsed = JSON.parse(raw) as Partial<WebinarConfig>;
    return {
      ...DEFAULT_WEBINAR_CONFIG,
      ...parsed,
      socialProofQuotes: parsed.socialProofQuotes?.length
        ? parsed.socialProofQuotes
        : DEFAULT_WEBINAR_CONFIG.socialProofQuotes,
    };
  } catch {
    return { ...DEFAULT_WEBINAR_CONFIG };
  }
}

export function getWebinarConfig(): WebinarConfig {
  return parseConfig(getSetting(CONFIG_KEY));
}

export function saveWebinarConfig(input: Partial<WebinarConfig>) {
  const next = { ...getWebinarConfig(), ...input, enabled: input.enabled ?? getWebinarConfig().enabled };
  setSetting(CONFIG_KEY, JSON.stringify(next));
  return next;
}

export function seedWebinarConfigIfMissing() {
  const raw = getSetting(CONFIG_KEY);
  if (!raw) {
    setSetting(CONFIG_KEY, JSON.stringify(DEFAULT_WEBINAR_CONFIG));
    return;
  }

  const current = parseConfig(raw);
  const next = { ...current };
  let changed = false;

  if (current.location === 'אונליין (Zoom)') {
    next.location = DEFAULT_WEBINAR_CONFIG.location;
    changed = true;
  }
  if (current.heroHeadline === 'יש לך יצירה. עכשיו בונים לה מערכת הכנסה.' || current.heroHeadline.includes('עכשיו בונים לה מערכת')) {
    next.heroHeadline = DEFAULT_WEBINAR_CONFIG.heroHeadline;
    next.heroHeadlineVariantB = DEFAULT_WEBINAR_CONFIG.heroHeadlineVariantB;
    next.heroSubheadline = DEFAULT_WEBINAR_CONFIG.heroSubheadline;
    next.title = DEFAULT_WEBINAR_CONFIG.title;
    next.leaderPrimaryBio = DEFAULT_WEBINAR_CONFIG.leaderPrimaryBio;
    next.socialProofQuotes = DEFAULT_WEBINAR_CONFIG.socialProofQuotes;
    changed = true;
  }
  if (current.spotsLabel === 'מקומות מוגבלים' && current.maxSpots === 0) {
    next.spotsLabel = DEFAULT_WEBINAR_CONFIG.spotsLabel;
    changed = true;
  }
  if (current.socialProofQuotes.some((item) => item.author.includes('יוצר/ת') || item.author === 'מאמן/ת' || item.quote.includes('בלי לחכות לעוד קורס') || item.quote.includes('שינתה לי את הראש') || item.quote.includes('—'))) {
    next.socialProofQuotes = DEFAULT_WEBINAR_CONFIG.socialProofQuotes;
    changed = true;
  }
  if (current.leaderPrimaryTitle === 'Founder & Vision Lead') {
    next.leaderPrimaryTitle = DEFAULT_WEBINAR_CONFIG.leaderPrimaryTitle;
    next.leaderPrimaryBio = DEFAULT_WEBINAR_CONFIG.leaderPrimaryBio;
    next.leaderSecondaryTitle = DEFAULT_WEBINAR_CONFIG.leaderSecondaryTitle;
    next.leaderSecondaryBio = DEFAULT_WEBINAR_CONFIG.leaderSecondaryBio;
    changed = true;
  }
  if (!current.whatsappGroupUrl.trim()) {
    next.whatsappGroupUrl = DEFAULT_WEBINAR_CONFIG.whatsappGroupUrl;
    changed = true;
  }

  if (changed) setSetting(CONFIG_KEY, JSON.stringify(next));
}

function countByStatus(status: string) {
  const row = getDb()
    .prepare(`SELECT COUNT(*) as c FROM webinar_registrations WHERE status = ?`)
    .get(status) as { c: number };
  return row.c;
}

export function countCompleteWebinarRegistrations() {
  const complete = countByStatus('complete');
  const legacy = countByStatus('new');
  return complete + legacy;
}

export function countWebinarRegistrations() {
  return (
    getDb().prepare(`SELECT COUNT(*) as c FROM webinar_registrations WHERE status IN ('partial','complete','waitlist','new')`).get() as {
      c: number;
    }
  ).c;
}

function resolveAbVariant(input?: string): 'a' | 'b' {
  if (input === 'a' || input === 'b') return input;
  return Math.random() < 0.5 ? 'a' : 'b';
}

export function getWebinarPublicPayload(abVariantInput?: string): WebinarPublicPayload {
  const config = getWebinarConfig();
  const completeCount = countCompleteWebinarRegistrations();
  const registrationCount = countWebinarRegistrations();
  const abVariant = config.abTestEnabled ? resolveAbVariant(abVariantInput) : 'a';
  const activeHeadline =
    abVariant === 'b' && config.heroHeadlineVariantB ? config.heroHeadlineVariantB : config.heroHeadline;
  const spotsRemaining =
    config.maxSpots > 0 ? Math.max(0, config.maxSpots - completeCount) : null;
  const isWaitlist = config.maxSpots > 0 && completeCount >= config.maxSpots;

  return {
    config,
    registrationCount,
    completeCount,
    spotsRemaining,
    isWaitlist,
    abVariant,
    activeHeadline,
  };
}

export interface WebinarRegistrationInput {
  step?: 'a' | 'b' | 'lead';
  registrationId?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  field?: string;
  interest?: string;
  blocker?: string;
  marketingOptIn?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  abVariant?: string;
}

function getRegistrationById(id: string) {
  return getDb()
    .prepare(`SELECT * FROM webinar_registrations WHERE id = ?`)
    .get(id) as Record<string, unknown> | undefined;
}

export type WebinarLaunchCheck = {
  id: 'date' | 'whatsapp' | 'zoom' | 'email';
  ok: boolean;
  required: boolean;
  label: string;
  hint: string;
};

export function getWebinarLaunchReadiness() {
  const config = getWebinarConfig();
  const start = parseIsraeliDateTime(config.date, config.time);
  const dateInFuture = Boolean(start && start.getTime() > Date.now());
  const hasWhatsapp = Boolean(config.whatsappGroupUrl.trim());
  const hasZoom = Boolean(config.zoomLink.trim());
  const emailEnabled = isWebinarEmailEnabled();
  const onboardingSender = isOnboardingSender();

  const items: WebinarLaunchCheck[] = [
    {
      id: 'date',
      ok: dateInFuture,
      required: true,
      label: 'תאריך ושעה בעתיד',
      hint: dateInFuture ? `${config.date} · ${config.time}` : `התאריך השמור ${config.date} כבר עבר — עדכנו באדמין.`,
    },
    {
      id: 'whatsapp',
      ok: hasWhatsapp,
      required: true,
      label: 'קבוצת וואטסאפ שקטה',
      hint: hasWhatsapp ? 'מוגדר' : 'בלי קישור, דף התודה לא יכול לפתוח קבוצה.',
    },
    {
      id: 'zoom',
      ok: hasZoom,
      required: false,
      label: 'קישור Zoom',
      hint: hasZoom ? 'מוגדר' : 'אפשר להשאיר ריק — יישלח לנרשמים לפני הערב.',
    },
    {
      id: 'email',
      ok: emailEnabled,
      required: true,
      label: 'שליחת מייל',
      hint: emailEnabled
        ? onboardingSender
          ? 'Resend פעיל עם onboarding@resend.dev — עד לאימות הדומיין, מייל יוצא רק לחשבון Resend שלכם.'
          : 'Resend פעיל'
        : 'חסר RESEND_API_KEY בשרת.',
    },
  ];

  return {
    ready: items.filter((item) => item.required).every((item) => item.ok),
    items,
    emailEnabled,
  };
}

export function getWebinarResume(id: string) {
  const registrationId = String(id || '').trim();
  if (!registrationId) {
    throw Object.assign(new Error('חסר מזהה הרשמה'), { status: 400 });
  }
  const row = getRegistrationById(registrationId);
  if (!row) {
    throw Object.assign(new Error('הרשמה לא נמצאה'), { status: 404 });
  }
  const status = String(row.status || '');
  if (status === 'complete' || status === 'new') {
    return {
      id: registrationId,
      status,
      step: 'done' as const,
      email: String(row.email || ''),
      fullName: String(row.full_name || ''),
    };
  }
  return {
    id: registrationId,
    status,
    step: status === 'lead' ? ('a' as const) : ('b' as const),
    email: String(row.email || ''),
    fullName: String(row.full_name || ''),
  };
}

function validateEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Object.assign(new Error('כתובת אימייל לא תקינה'), { status: 400 });
  }
}

export function registerWebinarLead(input: WebinarRegistrationInput) {
  const config = getWebinarConfig();
  if (!config.enabled) {
    throw Object.assign(new Error('ההרשמה לוובינר סגורה כרגע'), { status: 403 });
  }

  const email = String(input.email || '').trim().toLowerCase();
  if (!email) {
    throw Object.assign(new Error('נא למלא אימייל'), { status: 400 });
  }
  validateEmail(email);

  const existing = getDb()
    .prepare(`SELECT id, full_name, status FROM webinar_registrations WHERE email = ? ORDER BY created_at DESC LIMIT 1`)
    .get(email) as { id: string; full_name: string; status: string } | undefined;

  if (existing) {
    return {
      id: existing.id,
      fullName: existing.full_name,
      email,
      status: existing.status,
      step: 'lead' as const,
      createdAt: new Date().toISOString(),
      config,
    };
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  const utm = {
    source: String(input.utmSource || '').trim(),
    medium: String(input.utmMedium || '').trim(),
    campaign: String(input.utmCampaign || '').trim(),
    term: String(input.utmTerm || '').trim(),
    content: String(input.utmContent || '').trim(),
  };
  getDb()
    .prepare(
      `INSERT INTO webinar_registrations (
        id, full_name, phone, email, field, interest, blocker, marketing_opt_in,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content, status, ab_variant, created_at, updated_at
      ) VALUES (?, '', '', ?, '', '', '', 0, ?, ?, ?, ?, ?, 'lead', '', ?, ?)`
    )
    .run(id, email, utm.source, utm.medium, utm.campaign, utm.term, utm.content, now, now);

  trackEvent('webinar_exit_intent_submitted', { properties: { registrationId: id, source: 'lead' } });

  return {
    id,
    fullName: '',
    email,
    status: 'lead',
    step: 'lead' as const,
    createdAt: now,
    config,
  };
}

export function registerWebinarStepA(input: WebinarRegistrationInput) {
  const config = getWebinarConfig();
  if (!config.enabled) {
    throw Object.assign(new Error('ההרשמה לוובינר סגורה כרגע'), { status: 403 });
  }

  const fullName = String(input.fullName || '').trim();
  const phone = String(input.phone || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  if (!fullName || !phone || !email) {
    throw Object.assign(new Error('נא למלא שם, טלפון ואימייל'), { status: 400 });
  }
  validateEmail(email);
  if (!isIsraeliMobile(phone)) {
    throw Object.assign(new Error('נא להזין מספר נייד ישראלי'), { status: 400 });
  }

  const completeCount = countCompleteWebinarRegistrations();
  const isWaitlist = config.maxSpots > 0 && completeCount >= config.maxSpots;
  const status = isWaitlist ? 'waitlist' : 'partial';
  const now = new Date().toISOString();
  const abVariant = resolveAbVariant(input.abVariant);

  const existing = getDb()
    .prepare(`SELECT id FROM webinar_registrations WHERE email = ? ORDER BY created_at DESC LIMIT 1`)
    .get(email) as { id: string } | undefined;

  if (existing) {
    getDb()
      .prepare(
        `UPDATE webinar_registrations SET full_name = ?, phone = ?, status = ?, updated_at = ?, ab_variant = COALESCE(NULLIF(ab_variant,''), ?)
         WHERE id = ?`
      )
      .run(fullName, phone, status, now, abVariant, existing.id);
    trackEvent('webinar_step_a_completed', { properties: { registrationId: existing.id, status } });
    return {
      id: existing.id,
      fullName,
      email,
      status,
      step: 'a' as const,
      isWaitlist,
      createdAt: now,
      config,
    };
  }

  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO webinar_registrations (
        id, full_name, phone, email, field, interest, blocker, marketing_opt_in,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content, status, ab_variant, created_at, updated_at
      ) VALUES (?, ?, ?, ?, '', '', '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      fullName,
      phone,
      email,
      input.marketingOptIn ? 1 : 0,
      String(input.utmSource || '').trim(),
      String(input.utmMedium || '').trim(),
      String(input.utmCampaign || '').trim(),
      String(input.utmTerm || '').trim(),
      String(input.utmContent || '').trim(),
      status,
      abVariant,
      now,
      now
    );

  trackEvent('webinar_step_a_completed', { properties: { registrationId: id, status } });

  return {
    id,
    fullName,
    email,
    status,
    step: 'a' as const,
    isWaitlist,
    createdAt: now,
    config,
  };
}

export function registerWebinarStepB(input: WebinarRegistrationInput) {
  const registrationId = String(input.registrationId || '').trim();
  if (!registrationId) {
    throw Object.assign(new Error('חסר מזהה הרשמה'), { status: 400 });
  }

  const row = getRegistrationById(registrationId);
  if (!row) {
    throw Object.assign(new Error('הרשמה לא נמצאה'), { status: 404 });
  }

  const field = String(input.field || '').trim();
  const interest = String(input.interest || '').trim();
  if (!field || !interest) {
    throw Object.assign(new Error('נא למלא תחום ומה מסקרן'), { status: 400 });
  }

  const config = getWebinarConfig();
  const now = new Date().toISOString();
  const currentStatus = String(row.status || 'partial');
  const nextStatus =
    currentStatus === 'waitlist' ? 'waitlist' : currentStatus === 'partial' ? 'complete' : currentStatus;

  getDb()
    .prepare(
      `UPDATE webinar_registrations SET field = ?, interest = ?, blocker = ?, status = ?, step_completed_at = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(field, interest, String(input.blocker || '').trim(), nextStatus, now, now, registrationId);

  if (nextStatus === 'complete') {
    trackEvent('webinar_registration_completed', {
      properties: {
        registrationId,
        interest,
        blocker: String(input.blocker || ''),
      },
    });
    trackEvent('webinar_step_b_completed', { properties: { registrationId } });

    const fullName = String(row.full_name);
    const email = String(row.email);
    void sendWebinarConfirmationEmail({
      fullName,
      email,
      registrationId,
    }).catch(() => undefined);
    void postWebinarWebhook({
      id: registrationId,
      fullName,
      phone: String(row.phone),
      email,
      field,
      interest,
      blocker: String(input.blocker || ''),
      status: nextStatus,
    }).catch(() => undefined);
  } else {
    trackEvent('webinar_step_b_completed', { properties: { registrationId, status: nextStatus } });
  }

  return {
    id: registrationId,
    fullName: String(row.full_name),
    email: String(row.email),
    status: nextStatus,
    step: 'b' as const,
    createdAt: now,
    config,
  };
}

export function createWebinarRegistration(input: WebinarRegistrationInput) {
  if (input.step === 'lead') return registerWebinarLead(input);
  const step = input.step === 'b' ? 'b' : 'a';
  if (step === 'b') return registerWebinarStepB(input);
  return registerWebinarStepA(input);
}

export function listWebinarRegistrations(limit = 200) {
  return (
    getDb()
      .prepare(
        `SELECT id, full_name, phone, email, field, interest, blocker, marketing_opt_in,
                utm_source, utm_medium, utm_campaign, status, ab_variant, created_at, updated_at, step_completed_at
         FROM webinar_registrations
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(limit) as Array<Record<string, unknown>>
  ).map((row) => ({
    id: String(row.id),
    fullName: String(row.full_name),
    phone: String(row.phone),
    email: String(row.email),
    field: String(row.field),
    interest: String(row.interest),
    blocker: String(row.blocker || ''),
    marketingOptIn: Number(row.marketing_opt_in) === 1,
    utmSource: String(row.utm_source || ''),
    utmMedium: String(row.utm_medium || ''),
    utmCampaign: String(row.utm_campaign || ''),
    status: String(row.status || 'partial'),
    abVariant: String(row.ab_variant || ''),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
    stepCompletedAt: String(row.step_completed_at || ''),
  }));
}

export function getWebinarFunnelStats() {
  return {
    pageViews: countEvent('webinar_page_view'),
    formViews: countEvent('webinar_form_view'),
    stepAStarted: countEvent('webinar_step_a_started'),
    stepACompleted: countEvent('webinar_step_a_completed'),
    stepBStarted: countEvent('webinar_step_b_started'),
    stepBCompleted: countEvent('webinar_step_b_completed'),
    completed: countEvent('webinar_registration_completed'),
    calendarClicks: countEvent('webinar_add_to_calendar_clicked'),
    whatsappClicks: countEvent('webinar_whatsapp_group_clicked'),
    fitSectionViews: countEvent('webinar_fit_section_viewed'),
    ctaClicks: countEvent('webinar_cta_clicked'),
    partialLeads: countByStatus('partial'),
    emailLeads: countByStatus('lead'),
    completeLeads: countCompleteWebinarRegistrations(),
    waitlistLeads: countByStatus('waitlist'),
  };
}

export function listPartialFollowupCandidates() {
  const rows = getDb()
    .prepare(
      `SELECT id, full_name, email, status, updated_at, created_at FROM webinar_registrations
       WHERE status IN ('partial','lead') AND (reminded_partial_at IS NULL OR reminded_partial_at = '')`
    )
    .all() as Array<{
    id: string;
    full_name: string;
    email: string;
    status: string;
    updated_at: string;
    created_at: string;
  }>;

  const cutoff = Date.now() - 45 * 60 * 1000;
  return rows
    .filter((row) => {
      const stamp = Date.parse(row.updated_at || row.created_at);
      return Number.isFinite(stamp) && stamp <= cutoff;
    })
    .map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      status: row.status,
    }));
}

export function listWebinarReminderCandidates(kind: '24h' | '1h') {
  const config = getWebinarConfig();
  const [day, month, year] = config.date.split('.').map((part) => Number(part.trim()));
  const [hours, minutes] = config.time.split(':').map((part) => Number(part.trim()));
  if (!day || !month || !year) return [];

  const webinarAt = new Date(year, month - 1, day, hours || 0, minutes || 0, 0);
  const now = Date.now();
  const diffMs = webinarAt.getTime() - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  const inWindow =
    kind === '24h' ? diffHours <= 24.5 && diffHours >= 23 : diffHours <= 1.5 && diffHours >= 0.5;
  if (!inWindow) return [];

  const column = kind === '24h' ? 'reminded_24h_at' : 'reminded_1h_at';
  return (
    getDb()
      .prepare(
        `SELECT id, full_name, email FROM webinar_registrations
         WHERE status IN ('complete','new','waitlist') AND (${column} IS NULL OR ${column} = '')`
      )
      .all() as Array<{ id: string; full_name: string; email: string }>
  ).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
  }));
}

export function markWebinarReminderSent(id: string, kind: '24h' | '1h' | 'partial') {
  const column =
    kind === '24h' ? 'reminded_24h_at' : kind === '1h' ? 'reminded_1h_at' : 'reminded_partial_at';
  getDb()
    .prepare(`UPDATE webinar_registrations SET ${column} = ? WHERE id = ?`)
    .run(new Date().toISOString(), id);
}
