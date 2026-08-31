import { jsonBody } from '../_lib/body.js';
import { DEFAULT_WEBINAR_CONFIG } from '../_lib/staticData.js';
import { parseIsraeliDateTime } from '../_lib/webinarTime.js';
import {
  createZoomMeeting,
  persistZoomEventId,
  resolveZoomEventId,
  zoomHealthCheck,
} from '../_lib/zoom.js';

type VercelReq = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

function authorized(req: VercelReq) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.authorization;
  const value = Array.isArray(auth) ? auth[0] : auth || '';
  return value === `Bearer ${secret}`;
}

function readMeetingId(req: VercelReq) {
  const body = jsonBody(req);
  return String(body.meetingId || '').trim();
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!authorized(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const health = await zoomHealthCheck();
  let eventId = health.eventId;
  let joinUrl = '';
  let created = false;
  const manualId = readMeetingId(req);

  if (manualId) {
    eventId = manualId;
    await persistZoomEventId(manualId, joinUrl);
    res.status(200).json({
      ok: true,
      created: false,
      manual: true,
      eventId: manualId,
      health: await zoomHealthCheck(),
    });
    return;
  }

  if (!eventId && health.oauthOk) {
    const start = parseIsraeliDateTime(DEFAULT_WEBINAR_CONFIG.date, DEFAULT_WEBINAR_CONFIG.time);
    if (!start) {
      res.status(400).json({ error: 'תאריך וובינר לא תקין', health });
      return;
    }
    try {
      const meeting = await createZoomMeeting({
        topic: DEFAULT_WEBINAR_CONFIG.title,
        startTime: start,
        durationMinutes: DEFAULT_WEBINAR_CONFIG.durationMinutes || 150,
      });
      eventId = meeting.meetingId;
      joinUrl = meeting.joinUrl;
      created = true;
      await persistZoomEventId(eventId, joinUrl);
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'יצירת פגישה נכשלה',
        health,
      });
      return;
    }
  }

  const resolved = await resolveZoomEventId(true);
  res.status(200).json({
    ok: true,
    created,
    eventId: resolved || eventId,
    joinUrl,
    health: await zoomHealthCheck(),
  });
}
