export function digitsOnlyPhone(phone: string) {
  return phone.replace(/[^\d]/g, '');
}

/** Israeli mobile: 05xxxxxxxx or 9725xxxxxxxx */
export function isIsraeliMobile(phone: string) {
  const digits = digitsOnlyPhone(phone);
  return /^05\d{8}$/.test(digits) || /^9725\d{8}$/.test(digits);
}

/** E.164 for Israeli mobiles, e.g. +972501234567 */
export function toE164IL(phone: string) {
  const digits = digitsOnlyPhone(phone);
  if (/^05\d{8}$/.test(digits)) return `+972${digits.slice(1)}`;
  if (/^9725\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

export function formatPhoneDisplay(phone: string) {
  const e164 = toE164IL(phone);
  if (!e164) return phone.trim();
  const local = `0${e164.slice(4)}`;
  return local.replace(/^(05\d)(\d{3})(\d{4})$/, '$1-$2-$3');
}

export function phonePlaceholderEmail(phone: string) {
  const digits = digitsOnlyPhone(toE164IL(phone) || phone);
  return `${digits}@phone.infinitemasterpiece.local`;
}
