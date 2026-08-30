import { createHmac } from 'node:crypto';
import { supabaseRest } from './supabaseAdmin.js';

const DEFAULT_WEBINAR_ID = 'default';

type ZoomTokenCache = { accessToken: string; expiresAt: number };

let tokenCache: ZoomTokenCache | null = null;
let cachedStoreEventId: string | null = null;

/** 'webinar' when ZOOM_WEBINAR_ID is set, otherwise 'meeting' (temporary mode). */
export function zoomEventKind(): 'webinar' | 'meeting' {
  const explicit = String(process.env.ZOOM_EVENT_TYPE || '').trim().toLowerCase();
  if (explicit === 'meeting') return 'meeting';
  if (explicit === 'webinar') return 'webinar';
  return process.env.ZOOM_WEBINAR_ID?.trim() ? 'webinar' : 'meeting';
}

function zoomEventIdFromEnv() {
  if (zoomEventKind() === 'webinar') return process.env.ZOOM_WEBINAR_ID?.trim() || '';
  return process.env.ZOOM_MEETING_ID?.trim() || '';
}

export function zoomAuthConfigured() {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID?.trim() &&
      process.env.ZOOM_CLIENT_ID?.trim() &&
      process.env.ZOOM_CLIENT_SECRET?.trim()
  );
}

export function zoomConfigured() {
  return Boolean(zoomAuthConfigured() && (zoomEventIdFromEnv() || cachedStoreEventId));
}

export async function resolveZoomEventId(forceRefresh = false) {
  const fromEnv = zoomEventIdFromEnv();
  if (fromEnv) return fromEnv;
  if (!forceRefresh && cachedStoreEventId) return cachedStoreEventId;

  const res = await supabaseRest<Array<{ zoom_webinar_id?: string }>>(
    `webinars?id=eq.${encodeURIComponent(DEFAULT_WEBINAR_ID)}&select=zoom_webinar_id&limit=1`
  );
  const id = res.ok && Array.isArray(res.data) ? String(res.data[0]?.zoom_webinar_id || '').trim() : '';
  cachedStoreEventId = id || null;
  return id;
}

export async function zoomReady() {
  if (!zoomAuthConfigured()) return false;
  const eventId = await resolveZoomEventId();
  return Boolean(eventId);
}

async function zoomAccessToken() {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) return tokenCache.accessToken;

  const accountId = process.env.ZOOM_ACCOUNT_ID!.trim();
  const clientId = process.env.ZOOM_CLIENT_ID!.trim();
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!.trim();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}` },
    }
  );
  const data = (await res.json()) as { access_token?: string; expires_in?: number; reason?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw Object.assign(new Error(data.reason || data.error || 'אימות Zoom נכשל'), { status: 502 });
  }
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + (Number(data.expires_in) || 3600) * 1000,
  };
  return data.access_token;
}

export type ZoomRegistrantResult = {
  registrantId: string;
  joinUrl: string;
  alreadyRegistered?: boolean;
};

function registrantsPath(eventId: string) {
  const base = zoomEventKind() === 'webinar' ? 'webinars' : 'meetings';
  return `https://api.zoom.us/v2/${base}/${encodeURIComponent(eventId)}/registrants`;
}

export async function zoomRegisterParticipant(input: {
  email: string;
  fullName: string;
  phone?: string;
}): Promise<ZoomRegistrantResult | null> {
  if (!zoomAuthConfigured()) return null;
  const eventId = await resolveZoomEventId();
  if (!eventId) return null;
  const token = await zoomAccessToken();
  const [firstName, ...rest] = input.fullName.trim().split(/\s+/);
  const lastName = rest.join(' ') || '-';
  const res = await fetch(registrantsPath(eventId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      first_name: firstName.slice(0, 64),
      last_name: lastName.slice(0, 64),
      phone: input.phone || undefined,
      auto_approve: true,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    registrant_id?: string;
    join_url?: string;
    code?: number;
    message?: string;
  };

  // 429 / already registered — try list lookup
  if (res.status === 429 || (res.status === 400 && String(data.message || '').toLowerCase().includes('already'))) {
    const existing = await zoomFindRegistrant(input.email);
    if (existing) return { ...existing, alreadyRegistered: true };
  }

  if (!res.ok) {
    console.error('[zoom] register failed', res.status, data);
    throw Object.assign(new Error(data.message || 'רישום Zoom נכשל'), { status: 502 });
  }

  return {
    registrantId: String(data.registrant_id || ''),
    joinUrl: String(data.join_url || ''),
  };
}

async function zoomFindRegistrant(email: string): Promise<ZoomRegistrantResult | null> {
  if (!zoomAuthConfigured()) return null;
  const eventId = await resolveZoomEventId();
  if (!eventId) return null;
  const token = await zoomAccessToken();
  const res = await fetch(`${registrantsPath(eventId)}?status=approved&page_size=300`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { registrants?: Array<{ id?: string; email?: string; join_url?: string }> };
  const hit = (data.registrants || []).find((row) => String(row.email || '').toLowerCase() === email.toLowerCase());
  if (!hit) return null;
  return { registrantId: String(hit.id || ''), joinUrl: String(hit.join_url || '') };
}

export function verifyZoomWebhookAuth(headers: Record<string, string | string[] | undefined>, rawBody: string) {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN?.trim();
  if (!secret) return { ok: false as const, error: 'חסר ZOOM_WEBHOOK_SECRET_TOKEN' };

  const headerVal = headers['x-zm-signature'] || headers['X-Zm-Signature'];
  const signature = Array.isArray(headerVal) ? headerVal[0] : headerVal;
  const tsHeader = headers['x-zm-request-timestamp'] || headers['X-Zm-Request-Timestamp'];
  const timestamp = Array.isArray(tsHeader) ? tsHeader[0] : tsHeader;
  if (!signature || !timestamp) return { ok: false as const, error: 'חסרה חתימת Zoom' };

  const message = `v0:${timestamp}:${rawBody}`;
  const hash = createHmac('sha256', secret).update(message).digest('hex');
  const expected = `v0=${hash}`;
  if (signature !== expected) return { ok: false as const, error: 'חתימת Zoom לא תקינה' };
  return { ok: true as const };
}

export function zoomCrcResponse(plainToken: string) {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN?.trim() || '';
  const encryptedToken = createHmac('sha256', secret).update(plainToken).digest('hex');
  return { plainToken, encryptedToken };
}

export type ZoomHealth = {
  authConfigured: boolean;
  eventKind: 'webinar' | 'meeting';
  eventId: string;
  oauthOk: boolean;
  oauthError?: string;
  hostEmail?: string;
  upcomingMeetings?: Array<{ id: string; topic: string; registration: boolean }>;
};

export async function zoomHealthCheck(): Promise<ZoomHealth> {
  const eventKind = zoomEventKind();
  const eventId = await resolveZoomEventId();
  const health: ZoomHealth = {
    authConfigured: zoomAuthConfigured(),
    eventKind,
    eventId,
    oauthOk: false,
  };
  if (!zoomAuthConfigured()) {
    health.oauthError = 'חסרים פרטי OAuth';
    return health;
  }
  try {
    const token = await zoomAccessToken();
    health.oauthOk = true;
    const meRes = await fetch('https://api.zoom.us/v2/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = (await meRes.json().catch(() => ({}))) as { email?: string; message?: string };
    if (meRes.ok) health.hostEmail = me.email;
    else health.oauthError = me.message || `users/me ${meRes.status}`;

    const listRes = await fetch('https://api.zoom.us/v2/users/me/meetings?type=upcoming&page_size=30', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const list = (await listRes.json().catch(() => ({}))) as {
      meetings?: Array<{ id?: number; topic?: string; settings?: { approval_type?: number } }>;
      message?: string;
    };
    if (listRes.ok) {
      health.upcomingMeetings = (list.meetings || []).map((m) => ({
        id: String(m.id || ''),
        topic: String(m.topic || ''),
        registration: Number(m.settings?.approval_type) === 0,
      }));
    } else if (!health.oauthError) {
      health.oauthError = list.message || `meetings ${listRes.status}`;
    }
  } catch (err) {
    health.oauthError = err instanceof Error ? err.message : 'שגיאת Zoom';
  }
  return health;
}

export async function createZoomMeeting(input: {
  topic: string;
  startTime: Date;
  durationMinutes: number;
  timezone?: string;
}) {
  if (!zoomAuthConfigured()) {
    throw Object.assign(new Error('Zoom OAuth לא מוגדר'), { status: 503 });
  }
  const token = await zoomAccessToken();
  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: input.topic,
      type: 2,
      start_time: input.startTime.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      duration: input.durationMinutes,
      timezone: input.timezone || 'Asia/Jerusalem',
      settings: {
        approval_type: 0,
        registration_type: 1,
        registrants_email_notification: true,
        waiting_room: true,
        join_before_host: false,
      },
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    id?: number;
    join_url?: string;
    registration_url?: string;
    message?: string;
    code?: number;
  };
  if (!res.ok) {
    console.error('[zoom] create meeting failed', res.status, data);
    throw Object.assign(new Error(data.message || 'יצירת פגישת Zoom נכשלה'), { status: 502 });
  }
  return {
    meetingId: String(data.id || ''),
    joinUrl: String(data.join_url || ''),
    registrationUrl: String(data.registration_url || ''),
  };
}

export async function persistZoomEventId(meetingId: string, joinUrl = '') {
  cachedStoreEventId = meetingId;
  await supabaseRest(`webinars?id=eq.${encodeURIComponent(DEFAULT_WEBINAR_ID)}`, {
    method: 'PATCH',
    prefer: 'return=representation',
    body: JSON.stringify({
      zoom_webinar_id: meetingId,
      join_url: joinUrl,
      updated_at: new Date().toISOString(),
    }),
  });
}
