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
    const n = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
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
  if (!day || !month || !year || !Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return jerusalemWallToUtc(year, month, day, hours, minutes);
}
