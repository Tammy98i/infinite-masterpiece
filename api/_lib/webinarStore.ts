import { randomUUID } from 'node:crypto';
import { jsonBody } from './body.js';
import { isIsraeliMobile, isValidEmail, normalizeEmail } from './phone.js';
import { DEFAULT_WEBINAR_CONFIG } from './staticData.js';
import { hasSupabaseService, supabaseRest } from './supabaseAdmin.js';
import { sendConfirmationEmail } from './webinarMail.js';
import { zoomConfigured, zoomRegisterParticipant } from './zoom.js';

export const DEFAULT_WEBINAR_ID = 'default';

export type RegistrationRow = {
  id: string;
  webinar_id: string;
  full_name: string;
  email: string;
  normalized_email: string;
  phone: string;
  status: string;
  zoom_registrant_id?: string;
  zoom_join_url?: string;
  already_registered?: boolean;
  marketing_opt_in?: boolean;
  ab_variant?: string;
  created_at?: string;
  registered_at?: string;
};

export type RegisterInput = {
  fullName?: string;
  phone?: string;
  email?: string;
  marketingOptIn?: boolean;
  abVariant?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  landingPage?: string;
  referrer?: string;
  website?: string; // honeypot
};

const rateBucket = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 8, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const row = rateBucket.get(key);
  if (!row || row.resetAt < now) {
    rateBucket.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (row.count >= limit) return false;
  row.count += 1;
  return true;
}

export function httpError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

export function assertFunnelReady() {
  if (!hasSupabaseService()) {
    throw httpError('שרת ההרשמה לא מוגדר. חסר SUPABASE_SERVICE_ROLE_KEY.', 503);
  }
}

export async function getPublicConfig(abVariantInput?: string) {
  const config = { ...DEFAULT_WEBINAR_CONFIG };
  const webinar = await supabaseRest<Array<{ config?: Record<string, unknown>; join_url?: string; title?: string }>>(
    `webinars?id=eq.${encodeURIComponent(DEFAULT_WEBINAR_ID)}&select=title,join_url,config`
  );
  if (webinar.ok && Array.isArray(webinar.data) && webinar.data[0]) {
    const row = webinar.data[0];
    Object.assign(config, row.config || {});
    if (row.title) config.title = row.title;
    if (row.join_url) config.zoomLink = row.join_url;
  }

  const counts = await supabaseRest<Array<{ status: string }>>(
    `webinar_registrations?webinar_id=eq.${encodeURIComponent(DEFAULT_WEBINAR_ID)}&select=status`
  );
  const rows = counts.ok && Array.isArray(counts.data) ? counts.data : [];
  const completeCount = rows.filter((r) => ['registered', 'confirmed', 'complete', 'waitlist'].includes(r.status)).length;
  const registrationCount = rows.length;
  const abVariant = config.abTestEnabled ? (abVariantInput === 'b' ? 'b' : abVariantInput === 'a' ? 'a' : Math.random() < 0.5 ? 'a' : 'b') : 'a';
  const activeHeadline =
    abVariant === 'b' && config.heroHeadlineVariantB ? config.heroHeadlineVariantB : config.heroHeadline;
  const spotsRemaining = config.maxSpots > 0 ? Math.max(0, config.maxSpots - completeCount) : null;
  const isWaitlist = config.maxSpots > 0 && completeCount >= config.maxSpots;

  return {
    config,
    registrationCount,
    completeCount,
    spotsRemaining,
    isWaitlist,
    abVariant,
    activeHeadline,
    supabase: hasSupabaseService(),
    zoom: zoomConfigured(),
    email: Boolean(process.env.RESEND_API_KEY?.trim()),
  };
}

async function findByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const res = await supabaseRest<RegistrationRow[]>(
    `webinar_registrations?webinar_id=eq.${encodeURIComponent(DEFAULT_WEBINAR_ID)}&normalized_email=eq.${encodeURIComponent(normalized)}&select=*&limit=1`
  );
  if (!res.ok) throw httpError(res.error || 'שגיאת מסד נתונים', 503);
  return Array.isArray(res.data) ? res.data[0] : undefined;
}

export async function registerWebinar(input: RegisterInput, clientKey = 'anon') {
  assertFunnelReady();
  if (String(input.website || '').trim()) {
    // Honeypot filled — pretend success
    return {
      id: randomUUID(),
      fullName: String(input.fullName || '').trim() || 'אורח/ת',
      email: normalizeEmail(input.email || ''),
      status: 'registered',
      step: 'a' as const,
      alreadyRegistered: false,
      createdAt: new Date().toISOString(),
      config: DEFAULT_WEBINAR_CONFIG,
    };
  }
  if (!rateLimit(`reg:${clientKey}`)) {
    throw httpError('יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.', 429);
  }

  const fullName = String(input.fullName || '').trim();
  const phone = String(input.phone || '').trim();
  const email = normalizeEmail(input.email || '');
  if (!fullName || !phone || !email) throw httpError('נא למלא שם, טלפון ואימייל');
  if (!isValidEmail(email)) throw httpError('כתובת אימייל לא תקינה');
  if (!isIsraeliMobile(phone)) throw httpError('נא להזין מספר נייד ישראלי');

  const publicPayload = await getPublicConfig(input.abVariant);
  const isWaitlist = Boolean(publicPayload.isWaitlist);
  const status = isWaitlist ? 'waitlist' : 'registered';
  const now = new Date().toISOString();

  const existing = await findByEmail(email);
  if (existing && ['registered', 'confirmed', 'complete', 'waitlist'].includes(existing.status)) {
    await supabaseRest(`webinar_registrations?id=eq.${encodeURIComponent(existing.id)}`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: JSON.stringify({ full_name: fullName, phone, updated_at: now }),
    });
    return {
      id: existing.id,
      fullName,
      email,
      status: existing.status,
      step: 'a' as const,
      isWaitlist: existing.status === 'waitlist',
      alreadyRegistered: true,
      createdAt: existing.created_at || now,
      config: publicPayload.config,
      zoomJoinUrl: existing.zoom_join_url || '',
    };
  }

  let zoomRegistrantId = '';
  let zoomJoinUrl = '';
  if (!isWaitlist && zoomConfigured()) {
    try {
      const zoom = await zoomRegisterParticipant({ email, fullName, phone });
      if (zoom) {
        zoomRegistrantId = zoom.registrantId;
        zoomJoinUrl = zoom.joinUrl;
      }
    } catch (err) {
      console.error('[webinar] zoom sync failed', err);
      // Continue — Supabase remains source of truth; Zoom can be retried
    }
  }

  const id = existing?.id || randomUUID();
  const row = {
    id,
    webinar_id: DEFAULT_WEBINAR_ID,
    full_name: fullName,
    email,
    normalized_email: email,
    phone,
    status,
    marketing_opt_in: Boolean(input.marketingOptIn),
    ab_variant: publicPayload.abVariant,
    zoom_registrant_id: zoomRegistrantId,
    zoom_join_url: zoomJoinUrl,
    utm_source: String(input.utmSource || '').trim(),
    utm_medium: String(input.utmMedium || '').trim(),
    utm_campaign: String(input.utmCampaign || '').trim(),
    utm_term: String(input.utmTerm || '').trim(),
    utm_content: String(input.utmContent || '').trim(),
    gclid: String(input.gclid || '').trim(),
    fbclid: String(input.fbclid || '').trim(),
    landing_page: String(input.landingPage || '').trim().slice(0, 500),
    referrer: String(input.referrer || '').trim().slice(0, 500),
    registered_at: now,
    confirmed_at: status === 'registered' ? now : null,
    updated_at: now,
  };

  const write = existing
    ? await supabaseRest(`webinar_registrations?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        prefer: 'return=representation',
        body: JSON.stringify(row),
      })
    : await supabaseRest('webinar_registrations', {
        method: 'POST',
        prefer: 'return=representation',
        body: JSON.stringify(row),
      });

  if (!write.ok) throw httpError(write.error || 'שמירת ההרשמה נכשלה', 503);

  if (status === 'registered') {
    const mail = await sendConfirmationEmail({
      fullName,
      email,
      registrationId: id,
      joinUrl: zoomJoinUrl,
      config: publicPayload.config,
    });
    if (mail.sent) {
      await supabaseRest(`webinar_registrations?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ confirmation_email_sent_at: now, updated_at: now }),
      });
    } else {
      await supabaseRest('webinar_events', {
        method: 'POST',
        body: JSON.stringify({
          event_type: 'EMAIL_CONFIRMATION_FAILED',
          registration_id: id,
          webinar_id: DEFAULT_WEBINAR_ID,
          payload: { email, reason: mail.reason || 'unknown' },
        }),
      });
    }
    await supabaseRest('webinar_events', {
      method: 'POST',
      body: JSON.stringify({
        event_type: 'USER_REGISTERED',
        registration_id: id,
        webinar_id: DEFAULT_WEBINAR_ID,
        payload: { email, status, zoom: Boolean(zoomRegistrantId) },
      }),
    });
  }

  return {
    id,
    fullName,
    email,
    status,
    step: 'a' as const,
    isWaitlist,
    alreadyRegistered: false,
    createdAt: now,
    config: publicPayload.config,
    zoomJoinUrl,
  };
}

export async function lookupRegistration(emailInput: string) {
  assertFunnelReady();
  const email = normalizeEmail(emailInput);
  if (!email) throw httpError('נא להזין אימייל');
  if (!isValidEmail(email)) throw httpError('כתובת אימייל לא תקינה');
  const row = await findByEmail(email);
  if (!row || row.status === 'lead') throw httpError('לא מצאנו הרשמה למייל הזה', 404);
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    status: row.status,
    isWaitlist: row.status === 'waitlist',
  };
}

export async function resumeRegistration(id: string) {
  assertFunnelReady();
  const res = await supabaseRest<RegistrationRow[]>(
    `webinar_registrations?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );
  if (!res.ok) throw httpError(res.error || 'שגיאת מסד נתונים', 503);
  const row = Array.isArray(res.data) ? res.data[0] : undefined;
  if (!row) throw httpError('הרשמה לא נמצאה', 404);
  const done = ['registered', 'confirmed', 'complete', 'waitlist', 'partial'].includes(row.status);
  return {
    id: row.id,
    status: row.status,
    step: done ? ('done' as const) : ('a' as const),
    email: row.email,
    fullName: row.full_name,
    personPicked: false,
  };
}

export async function setPersonPicked(registrationId: string, picked: boolean) {
  assertFunnelReady();
  const now = new Date().toISOString();
  const res = await supabaseRest(`webinar_registrations?id=eq.${encodeURIComponent(registrationId)}`, {
    method: 'PATCH',
    prefer: 'return=representation',
    body: JSON.stringify({ person_picked_at: picked ? now : null, updated_at: now }),
  });
  if (!res.ok) throw httpError(res.error || 'עדכון נכשל', 503);
  return { id: registrationId, personPicked: picked };
}

export function parseClientKey(req: { headers: Record<string, string | string[] | undefined> }) {
  const xf = req.headers['x-forwarded-for'];
  const ip = Array.isArray(xf) ? xf[0] : (xf || '').split(',')[0].trim();
  return ip || 'unknown';
}

export function readJson(req: { body?: unknown }) {
  return jsonBody(req);
}
