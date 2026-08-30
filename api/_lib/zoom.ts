import { createHmac } from 'node:crypto';

type ZoomTokenCache = { accessToken: string; expiresAt: number };

let tokenCache: ZoomTokenCache | null = null;

export function zoomConfigured() {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID?.trim() &&
      process.env.ZOOM_CLIENT_ID?.trim() &&
      process.env.ZOOM_CLIENT_SECRET?.trim() &&
      process.env.ZOOM_WEBINAR_ID?.trim()
  );
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

export async function zoomRegisterParticipant(input: {
  email: string;
  fullName: string;
  phone?: string;
}): Promise<ZoomRegistrantResult | null> {
  if (!zoomConfigured()) return null;
  const webinarId = process.env.ZOOM_WEBINAR_ID!.trim();
  const token = await zoomAccessToken();
  const [firstName, ...rest] = input.fullName.trim().split(/\s+/);
  const lastName = rest.join(' ') || '-';
  const res = await fetch(`https://api.zoom.us/v2/webinars/${encodeURIComponent(webinarId)}/registrants`, {
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
  if (!zoomConfigured()) return null;
  const webinarId = process.env.ZOOM_WEBINAR_ID!.trim();
  const token = await zoomAccessToken();
  const res = await fetch(
    `https://api.zoom.us/v2/webinars/${encodeURIComponent(webinarId)}/registrants?status=approved&page_size=30`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
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
