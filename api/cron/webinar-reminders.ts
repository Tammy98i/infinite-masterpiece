import { supabaseRest } from '../_lib/supabaseAdmin.js';
import { sendReminderEmail } from '../_lib/webinarMail.js';
import { DEFAULT_WEBINAR_ID } from '../_lib/webinarStore.js';
import { DEFAULT_WEBINAR_CONFIG } from '../_lib/staticData.js';
import { parseIsraeliDateTime } from '../_lib/webinarTime.js';

type VercelReq = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

function authorized(req: VercelReq) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true; // allow when unset in preview; set in production
  const auth = req.headers.authorization;
  const value = Array.isArray(auth) ? auth[0] : auth || '';
  return value === `Bearer ${secret}`;
}

type Reg = {
  id: string;
  full_name: string;
  email: string;
  zoom_join_url?: string;
  reminder_24h_sent_at?: string | null;
  reminder_1h_sent_at?: string | null;
  reminder_15m_sent_at?: string | null;
};

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!authorized(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const webinar = await supabaseRest<Array<{ config?: Record<string, unknown>; join_url?: string }>>(
    `webinars?id=eq.${encodeURIComponent(DEFAULT_WEBINAR_ID)}&select=config,join_url`
  );
  const config = {
    ...DEFAULT_WEBINAR_CONFIG,
    ...((webinar.ok && Array.isArray(webinar.data) && webinar.data[0]?.config) || {}),
  } as typeof DEFAULT_WEBINAR_CONFIG;
  if (webinar.ok && Array.isArray(webinar.data) && webinar.data[0]?.join_url) {
    config.zoomLink = String(webinar.data[0].join_url);
  }

  const start = parseIsraeliDateTime(config.date, config.time);
  if (!start) {
    res.status(200).json({ ok: true, skipped: 'no-start-time' });
    return;
  }

  const hoursToStart = (start.getTime() - Date.now()) / (60 * 60 * 1000);
  const regs = await supabaseRest<Reg[]>(
    `webinar_registrations?webinar_id=eq.${encodeURIComponent(DEFAULT_WEBINAR_ID)}&status=in.(registered,confirmed,complete)&select=id,full_name,email,zoom_join_url,reminder_24h_sent_at,reminder_1h_sent_at,reminder_15m_sent_at&limit=500`
  );
  const rows = regs.ok && Array.isArray(regs.data) ? regs.data : [];
  let sent24 = 0;
  let sent1 = 0;
  let sent15 = 0;

  for (const row of rows) {
    const mailInput = {
      fullName: row.full_name,
      email: row.email,
      registrationId: row.id,
      joinUrl: row.zoom_join_url || config.zoomLink,
      config,
    };
    if (!row.reminder_24h_sent_at && hoursToStart <= 24.5 && hoursToStart >= 23) {
      const mail = await sendReminderEmail(mailInput, '24h');
      if (mail.sent) {
        sent24 += 1;
        await supabaseRest(`webinar_registrations?id=eq.${encodeURIComponent(row.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ reminder_24h_sent_at: new Date().toISOString() }),
        });
      }
    }
    if (!row.reminder_1h_sent_at && hoursToStart <= 1.5 && hoursToStart >= 0.5) {
      const mail = await sendReminderEmail(mailInput, '1h');
      if (mail.sent) {
        sent1 += 1;
        await supabaseRest(`webinar_registrations?id=eq.${encodeURIComponent(row.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ reminder_1h_sent_at: new Date().toISOString() }),
        });
      }
    }
    if (!row.reminder_15m_sent_at && hoursToStart <= 0.35 && hoursToStart >= 0.05) {
      const mail = await sendReminderEmail(mailInput, '15m');
      if (mail.sent) {
        sent15 += 1;
        await supabaseRest(`webinar_registrations?id=eq.${encodeURIComponent(row.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ reminder_15m_sent_at: new Date().toISOString() }),
        });
      }
    }
  }

  res.status(200).json({ ok: true, hoursToStart, sent24, sent1, sent15, scanned: rows.length });
}
