import { getWebinarConfig } from './webinarService.js';
import { getDb } from '../db/connection.js';
import { appUrl } from '../config/env.js';

type ConfirmationInput = {
  fullName: string;
  email: string;
  registrationId: string;
};

function emailEnabled() {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
}

function fromAddress() {
  return process.env.EMAIL_FROM || 'Infinite Masterpiece <noreply@infinite-masterpiece.co.il>';
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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [to],
      subject,
      html,
    }),
  });
  return res.ok;
}

export async function sendWebinarConfirmationEmail(input: ConfirmationInput) {
  if (!emailEnabled()) {
    console.info('[webinar-email] skipped (no RESEND_API_KEY / SMTP_HOST)', input.email);
    return { sent: false, reason: 'disabled' };
  }

  const config = getWebinarConfig();
  const subject = `אישור הרשמה — ${config.title}`;
  const html = buildConfirmationHtml(input);
  const sent = await sendViaResend(input.email, subject, html);
  if (sent) {
    getDb()
      .prepare(`UPDATE webinar_registrations SET confirmation_email_sent_at = ? WHERE id = ?`)
      .run(new Date().toISOString(), input.registrationId);
  }
  return { sent, reason: sent ? 'resend' : 'failed' };
}

export async function sendWebinarPartialEmail(input: ConfirmationInput) {
  if (!emailEnabled()) return { sent: false, reason: 'disabled' };
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
  const sent = await sendViaResend(input.email, subject, html);
  return { sent, reason: sent ? 'resend' : 'failed' };
}

export async function sendWebinarReminderEmail(input: ConfirmationInput, kind: '24h' | '1h') {
  if (!emailEnabled()) return { sent: false, reason: 'disabled' };
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
  const sent = await sendViaResend(input.email, subject, html);
  return { sent, reason: sent ? 'resend' : 'failed' };
}
