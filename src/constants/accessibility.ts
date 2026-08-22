import { SITE_NAME } from './brand';

function pick(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

/** Override via VITE_A11Y_* in .env when real coordinator details are approved. */
export const A11Y_COORDINATOR_NAME = pick(import.meta.env.VITE_A11Y_COORDINATOR_NAME, `צוות ${SITE_NAME}`);
export const A11Y_CONTACT_EMAIL = pick(import.meta.env.VITE_A11Y_CONTACT_EMAIL, 'negishot@infinite-masterpiece.co.il');
export const A11Y_CONTACT_PHONE = pick(import.meta.env.VITE_A11Y_CONTACT_PHONE, '');
export const A11Y_CONTACT_PHONE_DISPLAY = pick(import.meta.env.VITE_A11Y_CONTACT_PHONE_DISPLAY, '');
export const A11Y_LAST_AUDIT_DATE = pick(import.meta.env.VITE_A11Y_LAST_AUDIT_DATE, '22 באוגוסט 2026');
export const A11Y_STATEMENT_UPDATED = pick(import.meta.env.VITE_A11Y_STATEMENT_UPDATED, '22 באוגוסט 2026');

export function a11yPhoneHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits ? `tel:+${digits.startsWith('972') ? digits : `972${digits.replace(/^0/, '')}`}` : '';
}
