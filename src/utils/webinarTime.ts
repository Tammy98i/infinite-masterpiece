import type { WebinarConfig } from '../constants/webinar';

export function parseIsraeliDateTime(date: string, time: string) {
  const [day, month, year] = date.split('.').map((part) => Number(part.trim()));
  const [hours, minutes] = time.split(':').map((part) => Number(part.trim()));
  if (!day || !month || !year || Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return new Date(year, month - 1, day, hours, minutes, 0);
}

export function buildGoogleCalendarUrl(config: Pick<WebinarConfig, 'title' | 'date' | 'time' | 'durationMinutes' | 'heroSubheadline' | 'calendarLocation' | 'location'>) {
  const start = parseIsraeliDateTime(config.date, config.time);
  if (!start) return '';
  const end = new Date(start.getTime() + config.durationMinutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: config.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: config.heroSubheadline,
    location: config.calendarLocation || config.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(config: Pick<WebinarConfig, 'title' | 'date' | 'time' | 'durationMinutes' | 'heroSubheadline' | 'calendarLocation' | 'location'>) {
  const start = parseIsraeliDateTime(config.date, config.time);
  if (!start) return;
  const end = new Date(start.getTime() + config.durationMinutes * 60_000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
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
    `DESCRIPTION:${config.heroSubheadline.replace(/\n/g, '\\n')}`,
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
