import { Resend } from 'resend';
import { getWebinarConfig } from './webinarService.js';
import { getDb } from '../db/connection.js';
import { appUrl } from '../config/env.js';

/** After the domain is verified in Resend. Override with EMAIL_FROM if needed. */
export const RESEND_DEFAULT_FROM = 'Infinite Masterpiece <noreply@infinite-masterpiece.co.il>';

type ConfirmationInput = {
  fullName: string;
  email: string;
  registrationId: string;
};

export function webinarEmailFrom() {
  return process.env.EMAIL_FROM?.trim() || RESEND_DEFAULT_FROM;
}

export function isWebinarEmailEnabled() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function isOnboardingSender() {
  return webinarEmailFrom().toLowerCase().includes('onboarding@resend.dev');
}

function buildConfirmationHtml(input: ConfirmationInput) {
  const config = getWebinarConfig();
  return `
    <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h1 style="color:#C8A24C">נרשמת לוובינר — Infinite Masterpiece</h1>
      <p>שלום ${input.fullName},</p>
      <p>ההרשמה התקבלה. שמר/י את הפרטים:</p>
      <ul>
        <li><strong>מתי:</strong> ${config.date} · ${config.time}</li>
        <li><strong>משך:</strong> ${config.durationMinutes} דקות</li>
        <li><strong>איפה:</strong> ${config.location}</li>
      </ul>
      ${config.zoomLink ? `<p><a href="${config.zoomLink}">קישור ל-Zoom</a></p>` : '<p>קישור ל-Zoom יישלח לפני הוובינר.</p>'}
      ${config.whatsappGroupUrl ? `<p><a href="${config.whatsappGroupUrl}">קבוצת עדכונים בוואטסאפ</a></p>` : ''}
      <p>נתראה בלייב,<br/>צוות Infinite Masterpiece</p>
    </div>
  `;
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

  if (error) {
    const message = error.message || 'שליחת המייל נכשלה';
    console.error('[webinar-email] resend failed', { to, message, name: error.name });
    return { sent: false as const, error: message };
  }

  return { sent: true as const, id: data?.id };
}

export async function sendWebinarConfirmationEmail(input: ConfirmationInput) {
  if (!isWebinarEmailEnabled()) {
    console.info('[webinar-email] skipped (no RESEND_API_KEY)', input.email);
    return { sent: false, reason: 'disabled' };
  }

  const config = getWebinarConfig();
  const subject = `אישור הרשמה — ${config.title}`;
  const html = buildConfirmationHtml(input);
  const result = await sendViaResend(input.email, subject, html);
  if (result.sent) {
    getDb()
      .prepare(`UPDATE webinar_registrations SET confirmation_email_sent_at = ? WHERE id = ?`)
      .run(new Date().toISOString(), input.registrationId);
  }
  return { sent: result.sent, reason: result.sent ? 'resend' : result.error };
}

export async function sendWebinarPartialEmail(input: ConfirmationInput) {
  if (!isWebinarEmailEnabled()) return { sent: false, reason: 'disabled' };
  const config = getWebinarConfig();
  const url = `${appUrl()}/webinar?resume=${encodeURIComponent(input.registrationId)}`;
  const subject = `עוד רגע לסיום ההרשמה — ${config.title}`;
  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <p>שלום${input.fullName ? ` ${input.fullName}` : ''},</p>
      <p>הפרטים שלכם נשמרו לוובינר Infinite Masterpiece. להשלמת ההרשמה:</p>
      <p><a href="${url}">סיום הרשמה לוובינר</a></p>
      <p>${config.date} · ${config.time} · ${config.location}</p>
    </div>
  `;
  const result = await sendViaResend(input.email, subject, html);
  return { sent: result.sent, reason: result.sent ? 'resend' : result.error };
}

export async function sendWebinarReminderEmail(input: ConfirmationInput, kind: '24h' | '1h') {
  if (!isWebinarEmailEnabled()) return { sent: false, reason: 'disabled' };
  const config = getWebinarConfig();
  const subject =
    kind === '24h'
      ? `מחר: ${config.title}`
      : `עוד שעה: ${config.title}`;
  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6">
      <p>שלום ${input.fullName},</p>
      <p>תזכורת: הוובינר של Infinite Masterpiece ${kind === '24h' ? 'מחר' : ' בעוד שעה'} — ${config.date} · ${config.time}.</p>
      ${config.zoomLink ? `<p><a href="${config.zoomLink}">קישור ל-Zoom</a></p>` : ''}
    </div>
  `;
  const result = await sendViaResend(input.email, subject, html);
  return { sent: result.sent, reason: result.sent ? 'resend' : result.error };
}

export async function sendWebinarTestEmail(to: string) {
  const email = to.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Object.assign(new Error('נא להזין כתובת מייל תקינה'), { status: 400 });
  }
  if (!isWebinarEmailEnabled()) {
    throw Object.assign(new Error('חסר RESEND_API_KEY בשרת'), { status: 400 });
  }

  const config = getWebinarConfig();
  const result = await sendViaResend(
    email,
    'בדיקת מייל — Infinite Masterpiece',
    `
      <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <p>זה מייל בדיקה ממשפך הוובינר.</p>
        <p>אם קיבלת אותו — Resend מחובר.</p>
        <p><strong>שולח:</strong> ${webinarEmailFrom()}</p>
        <p><strong>וובינר:</strong> ${config.title} · ${config.date} · ${config.time}</p>
      </div>
    `,
  );

  if (!result.sent) {
    throw Object.assign(new Error(result.error || 'שליחת מייל הבדיקה נכשלה'), { status: 502 });
  }

  return { sent: true, id: result.id, from: webinarEmailFrom() };
}
