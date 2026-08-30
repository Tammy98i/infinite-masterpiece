import { createHmac } from 'node:crypto';
import { supabaseRest } from '../../_lib/supabaseAdmin.js';
import { sendAttendanceFollowUp } from '../../_lib/webinarMail.js';
import { DEFAULT_WEBINAR_ID } from '../../_lib/webinarStore.js';
import { zoomCrcResponse } from '../../_lib/zoom.js';

type VercelReq = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

function rawBody(req: VercelReq) {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  return JSON.stringify(req.body || {});
}

function header(req: VercelReq, name: string) {
  const value = req.headers[name] || req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value || '';
}

function verifySignature(req: VercelReq, body: string) {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN?.trim();
  if (!secret) return false;
  const signature = header(req, 'x-zm-signature');
  const timestamp = header(req, 'x-zm-request-timestamp');
  if (!signature || !timestamp) return false;
  const hash = createHmac('sha256', secret).update(`v0:${timestamp}:${body}`).digest('hex');
  return signature === `v0=${hash}`;
}

function attendanceThresholds() {
  const full = Number(process.env.WEBINAR_FULL_ATTENDANCE_PCT || 70);
  const partial = Number(process.env.WEBINAR_PARTIAL_ATTENDANCE_PCT || 10);
  return {
    full: Number.isFinite(full) ? full : 70,
    partial: Number.isFinite(partial) ? partial : 10,
  };
}

function segmentOf(pct: number) {
  const t = attendanceThresholds();
  if (pct <= 0) return 'no_show';
  if (pct >= t.full) return 'full';
  if (pct >= t.partial) return 'partial';
  return 'no_show';
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const bodyText = rawBody(req);
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    res.status(400).json({ error: 'JSON לא תקין' });
    return;
  }

  // Zoom URL validation (CRC)
  if (payload.event === 'endpoint.url_validation') {
    const plainToken = String((payload.payload as { plainToken?: string } | undefined)?.plainToken || '');
    res.status(200).json(zoomCrcResponse(plainToken));
    return;
  }

  if (!verifySignature(req, bodyText)) {
    res.status(401).json({ error: 'חתימה לא תקינה' });
    return;
  }

  const eventId = String(payload.event_ts || payload.event || '') + ':' + String((payload.payload as { object?: { uuid?: string } })?.object?.uuid || randomFallback());
  const dedupe = await supabaseRest('webinar_webhook_dedupe', {
    method: 'POST',
    body: JSON.stringify({ event_id: eventId }),
  });
  if (!dedupe.ok && dedupe.status !== 409) {
    // continue even if dedupe table missing
  } else if (!dedupe.ok && String(dedupe.error || '').includes('duplicate')) {
    res.status(200).json({ ok: true, duplicate: true });
    return;
  }

  const eventName = String(payload.event || '');
  const object = (payload.payload as { object?: Record<string, unknown> } | undefined)?.object || {};
  const participant = (object.participant as Record<string, unknown> | undefined) || {};
  const email = String(participant.email || '').trim().toLowerCase();

  if (email && (eventName.includes('participant_joined') || eventName.includes('participant_left') || eventName.includes('participant_joined_waiting_room'))) {
    const joinTime = String(participant.join_time || object.start_time || new Date().toISOString());
    const leaveTime = String(participant.leave_time || '');
    const duration = Number(participant.duration || 0);
    const webinarDurationMin = Number(process.env.WEBINAR_DURATION_MINUTES || DEFAULT_WEBINAR_CONFIG_DURATION);
    const pct = webinarDurationMin > 0 ? Math.min(100, Math.round((duration / (webinarDurationMin * 60)) * 1000) / 10) : 0;
    const segment = segmentOf(pct);

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      attendance_duration_seconds: duration,
      attendance_percentage: pct,
      attendance_segment: segment,
    };
    if (eventName.includes('joined')) {
      patch.join_time = joinTime;
      patch.first_join_time = joinTime;
      patch.attended_at = joinTime;
      patch.status = 'attended';
    }
    if (leaveTime) {
      patch.leave_time = leaveTime;
      patch.last_leave_time = leaveTime;
    }

    await supabaseRest(
      `webinar_registrations?webinar_id=eq.${encodeURIComponent(DEFAULT_WEBINAR_ID)}&normalized_email=eq.${encodeURIComponent(email)}`,
      { method: 'PATCH', body: JSON.stringify(patch) }
    );

    await supabaseRest('webinar_events', {
      method: 'POST',
      body: JSON.stringify({
        event_type: eventName,
        webinar_id: DEFAULT_WEBINAR_ID,
        external_event_id: eventId,
        payload: { email, duration, pct, segment },
      }),
    });
  }

  if (eventName.includes('webinar.ended')) {
    // Trigger follow-ups for registrants without follow_up_sent_at
    const rows = await supabaseRest<
      Array<{ id: string; full_name: string; email: string; attendance_segment: string; follow_up_sent_at?: string | null }>
    >(
      `webinar_registrations?webinar_id=eq.${encodeURIComponent(DEFAULT_WEBINAR_ID)}&follow_up_sent_at=is.null&select=id,full_name,email,attendance_segment,follow_up_sent_at&limit=200`
    );
    if (rows.ok && Array.isArray(rows.data)) {
      for (const row of rows.data) {
        const segment =
          row.attendance_segment === 'full' || row.attendance_segment === 'partial' || row.attendance_segment === 'no_show'
            ? row.attendance_segment
            : 'no_show';
        const mail = await sendAttendanceFollowUp(
          { fullName: row.full_name, email: row.email, registrationId: row.id },
          segment
        );
        if (mail.sent) {
          await supabaseRest(`webinar_registrations?id=eq.${encodeURIComponent(row.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({
              follow_up_sent_at: new Date().toISOString(),
              attendance_segment: segment,
              status: segment === 'no_show' ? 'no_show' : 'attended',
            }),
          });
        }
      }
    }
  }

  res.status(200).json({ ok: true });
}

const DEFAULT_WEBINAR_CONFIG_DURATION = 150;

function randomFallback() {
  return String(Date.now());
}
