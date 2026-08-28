import { Resend } from 'resend';
import { getWebinarConfig } from './webinarService.js';
import { getDb } from '../db/connection.js';
import { appUrl } from '../config/env.js';
import type { WebinarConfig } from '../../src/constants/webinar.ts';

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function thankYouUrl(registrationId: string) {
  return `${appUrl()}/webinar/thank-you?id=${encodeURIComponent(registrationId)}`;
}

function enterUrl(config: WebinarConfig) {
  const zoom = config.zoomLink.trim();
  if (zoom) return { href: zoom, label: 'כניסה לערב החי' };
  const whatsapp = config.whatsappGroupUrl.trim();
  if (whatsapp) return { href: whatsapp, label: 'הקישור בוואטסאפ' };
  return { href: '', label: '' };
}

function nextStepsHtml(config: WebinarConfig, registrationId: string) {
  const zoom = config.zoomLink.trim();
  const whatsapp = config.whatsappGroupUrl.trim();
  const thankYou = thankYouUrl(registrationId);
  return `
      <p style="margin:16px 0 8px"><strong>שלושה צעדים לפני הערב:</strong></p>
      <ol>
        <li>הוספה ליומן — ${escapeHtml(config.date)}, ${escapeHtml(config.time)}</li>
        <li>${
          whatsapp
            ? `<a href="${escapeHtml(whatsapp)}">קבוצת עדכונים שקטה בוואטסאפ</a>`
            : 'קבוצת וואטסאפ — הקישור יישלח לפני הערב'
        }</li>
        <li>בחרו אדם אחד להצעה שלכם. שם, וואטסאפ, ומשפט אחד.</li>
      </ol>
      ${
        zoom
          ? `<p><a href="${escapeHtml(zoom)}">קישור Zoom</a></p>`
          : '<p>קישור Zoom יישלח לפני הערב.</p>'
      }
      <p><a href="${escapeHtml(thankYou)}">דף הצעדים שלכם</a></p>
  `;
}

function buildConfirmationHtml(input: ConfirmationInput) {
  const config = getWebinarConfig();
  const name = escapeHtml(input.fullName);
  return `
    <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7;color:#111;max-width:560px">
      <h1 style="color:#C8A24C;font-size:22px">נרשמת לוובינר. Infinite Masterpiece</h1>
      <p>שלום ${name},</p>
      <p>ההרשמה התקבלה. ${escapeHtml(config.date)}, ${escapeHtml(config.time)}. ${escapeHtml(String(config.durationMinutes))} דקות. ${escapeHtml(config.location)}.</p>
      ${nextStepsHtml(config, input.registrationId)}
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
  const subject = `אישור הרשמה. ${config.title}`;
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
  const url = thankYouUrl(input.registrationId);
  const subject = `ההרשמה ממתינה לכם. ${config.title}`;
  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7;color:#111;max-width:560px">
      <p>שלום${input.fullName ? ` ${escapeHtml(input.fullName)}` : ''},</p>
      <p>הפרטים שלכם נשמרו לוובינר Infinite Masterpiece. דף הצעדים שלכם: יומן, וואטסאפ, ואדם אחד.</p>
      <p><a href="${escapeHtml(url)}">דף הצעדים שלכם</a></p>
      <p>${escapeHtml(config.date)}, ${escapeHtml(config.time)}, ${escapeHtml(config.location)}</p>
    </div>
  `;
  const result = await sendViaResend(input.email, subject, html);
  return { sent: result.sent, reason: result.sent ? 'resend' : result.error };
}

export async function sendWebinarReminderEmail(input: ConfirmationInput, kind: '24h' | '1h') {
  if (!isWebinarEmailEnabled()) return { sent: false, reason: 'disabled' };
  const config = getWebinarConfig();
  const subject = kind === '24h' ? `מחר: ${config.title}` : `עוד שעה: ${config.title}`;
  const enter = enterUrl(config);
  const thankYou = thankYouUrl(input.registrationId);
  const lead =
    kind === '24h'
      ? `תזכורת: הוובינר של Infinite Masterpiece מחר. ${escapeHtml(config.date)}, ${escapeHtml(config.time)}.`
      : `עוד שעה מתחילים. ${escapeHtml(config.date)}, ${escapeHtml(config.time)}.`;
  const enterBlock =
    kind === '1h' && enter.href
      ? `<p style="margin:20px 0"><a href="${escapeHtml(enter.href)}" style="display:inline-block;background:#C8A24C;color:#111;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">${escapeHtml(enter.label)}</a></p>`
      : '';
  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7;color:#111;max-width:560px">
      <p>שלום ${escapeHtml(input.fullName)},</p>
      <p>${lead}</p>
      ${enterBlock}
      ${kind === '24h' ? nextStepsHtml(config, input.registrationId) : `<p><a href="${escapeHtml(thankYou)}">דף הצעדים שלכם</a></p>`}
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
    'בדיקת מייל. Infinite Masterpiece',
    `
      <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7;color:#111;max-width:560px">
        <p>זה מייל בדיקה ממשפך הוובינר.</p>
        <p>אם קיבלת אותו, Resend מחובר.</p>
        <p><strong>שולח:</strong> ${escapeHtml(webinarEmailFrom())}</p>
        <p><strong>וובינר:</strong> ${escapeHtml(config.title)}, ${escapeHtml(config.date)}, ${escapeHtml(config.time)}</p>
      </div>
    `,
  );

  if (!result.sent) {
    throw Object.assign(new Error(result.error || 'שליחת מייל הבדיקה נכשלה'), { status: 502 });
  }

  return { sent: true, id: result.id, from: webinarEmailFrom() };
}
