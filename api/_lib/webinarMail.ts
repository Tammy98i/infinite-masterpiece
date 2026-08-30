import { Resend } from 'resend';
import { DEFAULT_WEBINAR_CONFIG } from './staticData.js';

export function webinarEmailFrom() {
  return process.env.EMAIL_FROM?.trim() || 'Infinite Masterpiece <noreply@infinite-masterpiece.co.il>';
}

export function isWebinarEmailEnabled() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function appBase() {
  return (process.env.APP_URL || process.env.VITE_APP_URL || 'https://infinite-masterpiece-weld.vercel.app')
    .trim()
    .replace(/\/$/, '');
}

function thankYouUrl(registrationId: string) {
  return `${appBase()}/webinar/thank-you?id=${encodeURIComponent(registrationId)}`;
}

type MailInput = {
  fullName: string;
  email: string;
  registrationId: string;
  joinUrl?: string;
  config?: {
    title?: string;
    date?: string;
    time?: string;
    durationMinutes?: number;
    location?: string;
    whatsappGroupUrl?: string;
    zoomLink?: string;
  };
};

function cfg(input: MailInput) {
  return {
    title: input.config?.title || DEFAULT_WEBINAR_CONFIG.title,
    date: input.config?.date || DEFAULT_WEBINAR_CONFIG.date,
    time: input.config?.time || DEFAULT_WEBINAR_CONFIG.time,
    durationMinutes: input.config?.durationMinutes || DEFAULT_WEBINAR_CONFIG.durationMinutes,
    location: input.config?.location || DEFAULT_WEBINAR_CONFIG.location,
    whatsappGroupUrl: input.config?.whatsappGroupUrl || DEFAULT_WEBINAR_CONFIG.whatsappGroupUrl,
    zoomLink: input.joinUrl || input.config?.zoomLink || DEFAULT_WEBINAR_CONFIG.zoomLink || '',
  };
}

async function sendViaResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { sent: false as const, error: 'חסר RESEND_API_KEY' };
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: webinarEmailFrom(),
    to: [to],
    subject,
    html,
  });
  if (error) return { sent: false as const, error: error.message || 'שליחת המייל נכשלה' };
  return { sent: true as const, id: data?.id };
}

export async function sendConfirmationEmail(input: MailInput) {
  if (!isWebinarEmailEnabled()) return { sent: false, reason: 'disabled' };
  const c = cfg(input);
  const name = escapeHtml(input.fullName || '');
  const join = c.zoomLink
    ? `<p><a href="${escapeHtml(c.zoomLink)}">כניסה ל־Zoom</a></p>`
    : '<p>קישור Zoom יישלח לפני הערב.</p>';
  const whatsapp = c.whatsappGroupUrl
    ? `<li><a href="${escapeHtml(c.whatsappGroupUrl)}">קבוצת עדכונים שקטה בוואטסאפ</a></li>`
    : '<li>קבוצת וואטסאפ — הקישור יישלח לפני הערב</li>';
  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7;color:#111;max-width:560px">
      <h1 style="color:#C8A24C;font-size:22px">נרשמת לוובינר. Infinite Masterpiece</h1>
      <p>שלום ${name},</p>
      <p>ההרשמה התקבלה. ${escapeHtml(c.date)}, ${escapeHtml(c.time)}. ${escapeHtml(String(c.durationMinutes))} דקות. ${escapeHtml(c.location)}.</p>
      <ol>
        <li>הוספה ליומן — ${escapeHtml(c.date)}, ${escapeHtml(c.time)}</li>
        ${whatsapp}
        <li>בחרו אדם אחד להצעה שלכם.</li>
      </ol>
      ${join}
      <p><a href="${escapeHtml(thankYouUrl(input.registrationId))}">דף הצעדים שלכם</a></p>
    </div>`;
  const result = await sendViaResend(input.email, `אישור הרשמה. ${c.title}`, html);
  return { sent: result.sent, reason: result.sent ? 'resend' : result.error };
}

export async function sendReminderEmail(input: MailInput, kind: '24h' | '1h' | '15m') {
  if (!isWebinarEmailEnabled()) return { sent: false, reason: 'disabled' };
  const c = cfg(input);
  const subject =
    kind === '24h' ? `מחר: ${c.title}` : kind === '1h' ? `עוד שעה: ${c.title}` : `מתחילים בעוד רבע שעה: ${c.title}`;
  const lead =
    kind === '24h'
      ? `תזכורת: הוובינר מחר. ${escapeHtml(c.date)}, ${escapeHtml(c.time)}.`
      : kind === '1h'
        ? `עוד שעה מתחילים. ${escapeHtml(c.time)}.`
        : `עוד כ־15 דקות מתחילים. היכנסו עכשיו.`;
  const joinHref = c.zoomLink || thankYouUrl(input.registrationId);
  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7;color:#111;max-width:560px">
      <p>שלום ${escapeHtml(input.fullName || '')},</p>
      <p>${lead}</p>
      <p><a href="${escapeHtml(joinHref)}">${c.zoomLink ? 'כניסה ל־Zoom' : 'דף הצעדים'}</a></p>
    </div>`;
  const result = await sendViaResend(input.email, subject, html);
  return { sent: result.sent, reason: result.sent ? 'resend' : result.error };
}

export async function sendAttendanceFollowUp(input: MailInput, segment: 'full' | 'partial' | 'no_show') {
  if (!isWebinarEmailEnabled()) return { sent: false, reason: 'disabled' };
  const c = cfg(input);
  const copy =
    segment === 'full'
      ? 'תודה שהייתם איתנו בלייב. הצעד הבא: בחירת מסלול והמשך עבודה.'
      : segment === 'partial'
        ? 'ראינו שנכנסתם לחלק מהערב. הנה קישור לחזור לחומר ולדף הצעדים.'
        : 'החמצתם את הערב החי. שלחנו לכם את דף הצעדים כדי להשלים בקלות.';
  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7;color:#111;max-width:560px">
      <p>שלום ${escapeHtml(input.fullName || '')},</p>
      <p>${copy}</p>
      <p><a href="${escapeHtml(thankYouUrl(input.registrationId))}">המשך מכאן</a></p>
      <p>${escapeHtml(c.title)}</p>
    </div>`;
  const result = await sendViaResend(input.email, `אחרי הוובינר. ${c.title}`, html);
  return { sent: result.sent, reason: result.sent ? 'resend' : result.error };
}
