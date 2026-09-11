/** Library subscription — separate from journey tracks (8888). */
export const LIBRARY_TRIAL_DAYS = 7;

export type LibraryPaidPlan = 'monthly' | 'annual';

function envAmount(name: string) {
  const raw =
    (typeof process !== 'undefined' ? process.env[name] : undefined) ||
    (typeof import.meta !== 'undefined'
      ? String((import.meta as { env?: Record<string, string | undefined> }).env?.[name] || '')
      : '');
  const n = Number(String(raw || '').trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Before-VAT ILS. Empty env → checkout stays off (pilot / unpublished price). */
export function libraryPlanAmountBeforeVat(plan: LibraryPaidPlan) {
  if (plan === 'monthly') return envAmount('LIBRARY_MONTHLY_ILS') || envAmount('VITE_LIBRARY_MONTHLY_ILS');
  return envAmount('LIBRARY_ANNUAL_ILS') || envAmount('VITE_LIBRARY_ANNUAL_ILS');
}

export function isLibraryPaidPricingReady() {
  return libraryPlanAmountBeforeVat('monthly') > 0 && libraryPlanAmountBeforeVat('annual') > 0;
}

export const LIBRARY_PLANS = {
  trial: {
    id: 'free_trial' as const,
    title: 'ניסיון חינם',
    subtitle: `${LIBRARY_TRIAL_DAYS} ימים · גישה מלאה לספרייה`,
    priceLabel: 'חינם',
    cta: 'התחלת ניסיון',
  },
  monthly: {
    id: 'monthly' as const,
    title: 'מנוי חודשי',
    subtitle: 'גישה מלאה · ביטול בכל עת',
    priceLabel: 'מחיר יפורסם',
    cta: 'מנוי חודשי',
  },
  annual: {
    id: 'annual' as const,
    title: 'מנוי שנתי',
    subtitle: 'גישה מלאה · חיסכון שנתי',
    priceLabel: 'מחיר יפורסם',
    cta: 'מנוי שנתי',
  },
} as const;
