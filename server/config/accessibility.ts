const SITE_NAME = 'Infinite Masterpiece';

function pick(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

export const A11Y_COORDINATOR_NAME = pick(process.env.A11Y_COORDINATOR_NAME) || `צוות ${SITE_NAME}`;
export const A11Y_CONTACT_EMAIL = pick(process.env.A11Y_CONTACT_EMAIL, process.env.VITE_A11Y_CONTACT_EMAIL) || 'negishot@infinite-masterpiece.co.il';
export const A11Y_CONTACT_PHONE = pick(process.env.A11Y_CONTACT_PHONE, process.env.VITE_A11Y_CONTACT_PHONE);
export const A11Y_CONTACT_PHONE_DISPLAY = pick(
  process.env.A11Y_CONTACT_PHONE_DISPLAY,
  process.env.VITE_A11Y_CONTACT_PHONE_DISPLAY,
  A11Y_CONTACT_PHONE,
);
export const A11Y_LAST_AUDIT_DATE = pick(process.env.A11Y_LAST_AUDIT_DATE, process.env.VITE_A11Y_LAST_AUDIT_DATE) || '22 באוגוסט 2026';
export const A11Y_STATEMENT_UPDATED = pick(process.env.A11Y_STATEMENT_UPDATED, process.env.VITE_A11Y_STATEMENT_UPDATED) || '22 באוגוסט 2026';
/** Target response time for accessibility inquiries (business days). Legal cure window is up to 60 days. */
export const A11Y_RESPONSE_DAYS = Number(process.env.A11Y_RESPONSE_DAYS || '14') || 14;

export function a11yPhoneHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  return `tel:+${digits.startsWith('972') ? digits : `972${digits.replace(/^0/, '')}`}`;
}

export function getAccessibilityPublicConfig() {
  return {
    coordinatorName: A11Y_COORDINATOR_NAME,
    email: A11Y_CONTACT_EMAIL,
    phone: A11Y_CONTACT_PHONE,
    phoneDisplay: A11Y_CONTACT_PHONE_DISPLAY || A11Y_CONTACT_PHONE,
    phoneHref: a11yPhoneHref(A11Y_CONTACT_PHONE),
    lastAuditDate: A11Y_LAST_AUDIT_DATE,
    statementUpdated: A11Y_STATEMENT_UPDATED,
    responseDays: A11Y_RESPONSE_DAYS,
    standard: 'ת"י 5568 / WCAG 2.0 AA',
  };
}
