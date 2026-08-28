import type { WebinarConfig } from '../constants/webinar';

const JERUSALEM = 'Asia/Jerusalem';

function jerusalemWallToUtc(year: number, month: number, day: number, hours: number, minutes: number) {
  const desiredAsUtc = Date.UTC(year, month - 1, day, hours, minutes, 0);
  const wallAsUtc = (ms: number) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: JERUSALEM,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(ms));
    const n = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value);
    return Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'));
  };

  let instant = desiredAsUtc;
  for (let i = 0; i < 2; i += 1) {
    const offset = wallAsUtc(instant) - instant;
    instant = desiredAsUtc - offset;
  }
  return new Date(instant);
}

export function parseIsraeliDateTime(date: string, time: string) {
  const [day, month, year] = date.split('.').map((part) => Number(part.trim()));
  const [hours, minutes] = time.split(':').map((part) => Number(part.trim()));
  if (!day || !month || !year || Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return jerusalemWallToUtc(year, month, day, hours, minutes);
}

function formatGoogleUtc(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function calendarDetails(
  config: Pick<WebinarConfig, 'heroSubheadline' | 'zoomLink' | 'whatsappGroupUrl'>
) {
  const lines = [config.heroSubheadline];
  if (config.zoomLink?.trim()) lines.push(`Zoom: ${config.zoomLink.trim()}`);
  if (config.whatsappGroupUrl?.trim()) lines.push(`WhatsApp: ${config.whatsappGroupUrl.trim()}`);
  return lines.filter(Boolean).join('\n');
}

export function buildGoogleCalendarUrl(
  config: Pick<
    WebinarConfig,
    | 'title'
    | 'date'
    | 'time'
    | 'durationMinutes'
    | 'heroSubheadline'
    | 'calendarLocation'
    | 'location'
    | 'zoomLink'
    | 'whatsappGroupUrl'
  >
) {
  const start = parseIsraeliDateTime(config.date, config.time);
  if (!start) return '';
  const end = new Date(start.getTime() + config.durationMinutes * 60_000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: config.title,
    dates: `${formatGoogleUtc(start)}/${formatGoogleUtc(end)}`,
    details: calendarDetails(config),
    location: config.calendarLocation || config.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(
  config: Pick<
    WebinarConfig,
    | 'title'
    | 'date'
    | 'time'
    | 'durationMinutes'
    | 'heroSubheadline'
    | 'calendarLocation'
    | 'location'
    | 'zoomLink'
    | 'whatsappGroupUrl'
  >
) {
  const start = parseIsraeliDateTime(config.date, config.time);
  if (!start) return;
  const end = new Date(start.getTime() + config.durationMinutes * 60_000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const description = calendarDetails(config).replace(/\n/g, '\\n');
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Infinite Masterpiece//Webinar//HE',
    'BEGIN:VEVENT',
    `UID:webinar-${config.date}-${config.time}@infinite-masterpiece`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${config.title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${config.calendarLocation || config.location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'infinite-masterpiece-webinar.ics';
  link.click();
  URL.revokeObjectURL(url);
}

export function buildShareUrl() {
  const url = new URL(window.location.origin + '/webinar');
  url.searchParams.set('utm_source', 'share');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', 'webinar_invite');
  return url.toString();
}
