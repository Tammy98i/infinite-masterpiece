export function digitsOnlyPhone(phone: string) {
  return phone.replace(/[^\d]/g, '');
}

/** Israeli mobile: 05xxxxxxxx or 9725xxxxxxxx */
export function isIsraeliMobile(phone: string) {
  const digits = digitsOnlyPhone(phone);
  return /^05\d{8}$/.test(digits) || /^9725\d{8}$/.test(digits);
}
