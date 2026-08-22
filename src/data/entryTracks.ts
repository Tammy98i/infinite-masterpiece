export type EntryTrackId = 'brave' | 'hesitant';

/** מסלול האמיצים — תשלום מלא מראש */
export const BRAVE_PRICE_BEFORE_VAT = 8008;

/** מסלול ההססנים — סך ארבע הפעימות (8 + 80 + 800 + 8,000) */
export const HESITANT_TOTAL_BEFORE_VAT = 8888;

/** @deprecated השתמשו ב־BRAVE_PRICE_BEFORE_VAT או HESITANT_TOTAL_BEFORE_VAT */
export const PROGRAM_PRICE_BEFORE_VAT = BRAVE_PRICE_BEFORE_VAT;

export const HESITANT_INSTALLMENTS = [
  { number: 1, amountBeforeVat: 8, when: 'במעמד ההרשמה' },
  { number: 2, amountBeforeVat: 80, when: 'מוצאי שבת לפני תחילת השבוע השני' },
  { number: 3, amountBeforeVat: 800, when: 'מוצאי שבת לפני תחילת השבוע השלישי' },
  { number: 4, amountBeforeVat: 8000, when: 'מוצאי שבת לפני תחילת השבוע הרביעי' },
] as const;

export const RAFFLE_TICKETS: Record<EntryTrackId, number> = {
  brave: 2,
  hesitant: 1,
};

export const VAT_RATE = 0.17;

export function amountWithVat(beforeVat: number) {
  return Math.round(beforeVat * (1 + VAT_RATE) * 100) / 100;
}

export function toAgorot(ils: number) {
  return Math.round(ils * 100);
}

export const ENTRY_TRACK_FINE_PRINT =
  'הבהרה: מסלול ההססנים אינו הנחה ואינו מסלול חלקי. במסלול ההססנים ניתנת גישה מלאה למיזם ולספרייה. סך התשלום במסלול ההססנים הוא 8,888 ₪ לפני מע״מ, בפריסה של 4 פעימות: 8 ₪ במעמד ההרשמה, 80 ₪ במוצאי שבת לפני השבוע השני, 800 ₪ במוצאי שבת לפני השבוע השלישי, ו־8,000 ₪ במוצאי שבת לפני השבוע הרביעי. מסלול האמיצים הוא תשלום מלא של 8,008 ₪ לפני מע״מ. משתתפי מסלול האמיצים מקבלים 2 כרטיסי כניסה לכל הגרלה. משתתפי מסלול ההססנים מקבלים כרטיס כניסה אחד לכל הגרלה. תנאי ההגרלות, הזכאות והמימוש יופיעו בתקנון.';

/** מוצאי שבת משוער: שבת 20:00 שעון ישראל (17:00 UTC). */
export function nextMotzaeiShabbatIso(after = new Date()): string {
  const day = after.getUTCDay();
  let add = (6 - day + 7) % 7;
  if (add === 0 && after.getUTCHours() >= 17) add = 7;
  return new Date(
    Date.UTC(after.getUTCFullYear(), after.getUTCMonth(), after.getUTCDate() + add, 17, 0, 0)
  ).toISOString();
}
