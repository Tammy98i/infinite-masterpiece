export function digitsOnlyPhone(phone: string) {
  return phone.replace(/[^\d]/g, '');
}

/** Israeli mobile: 05xxxxxxxx, 9725xxxxxxxx, or +9725xxxxxxxx */
export function isIsraeliMobile(phone: string) {
  return Boolean(toE164IL(phone));
}

/**
 * E.164 for Israeli mobiles, e.g. +972501234567.
 * Accepts 05XXXXXXXX, 9725XXXXXXXX, +9725XXXXXXXX, and spaced/dashed variants.
 */
export function toE164IL(phone: string) {
  const trimmed = phone.trim().replace(/[\s()-]/g, '');
  if (/^\+9725\d{8}$/.test(trimmed)) return trimmed;
  const digits = digitsOnlyPhone(trimmed);
  if (/^05\d{8}$/.test(digits)) return `+972${digits.slice(1)}`;
  if (/^9725\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

export function formatPhoneDisplay(phone: string) {
  const e164 = toE164IL(phone);
  if (!e164) return phone.trim();
  return e164;
}

export function phonePlaceholderEmail(phone: string) {
  const digits = digitsOnlyPhone(toE164IL(phone) || phone);
  return `${digits}@phone.infinitemasterpiece.local`;
}
