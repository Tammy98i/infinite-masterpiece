/** Library subscription — separate from journey tracks (8888). */
import { amountWithVat } from '../data/entryTracks';

export const LIBRARY_TRIAL_DAYS = 7;

/** Default prices before VAT (ILS). Override on the server via env. */
export const DEFAULT_LIBRARY_MONTHLY_BEFORE_VAT = 88;
export const DEFAULT_LIBRARY_ANNUAL_BEFORE_VAT = 888;

export const LIBRARY_CHECKOUT_PENDING_KEY = 'mc_library_checkout_plan';

export type LibraryPaidPlan = 'monthly' | 'annual';

export function formatLibraryPrice(amountWithVatIls: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
  }).format(amountWithVatIls);
}

export function libraryPriceLabel(beforeVat: number) {
  return `${formatLibraryPrice(amountWithVat(beforeVat))} כולל מע״מ`;
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
    priceLabel: libraryPriceLabel(DEFAULT_LIBRARY_MONTHLY_BEFORE_VAT),
    cta: 'מנוי חודשי',
    interval: 'month' as const,
    defaultBeforeVat: DEFAULT_LIBRARY_MONTHLY_BEFORE_VAT,
  },
  annual: {
    id: 'annual' as const,
    title: 'מנוי שנתי',
    subtitle: 'גישה מלאה · חיסכון שנתי',
    priceLabel: libraryPriceLabel(DEFAULT_LIBRARY_ANNUAL_BEFORE_VAT),
    cta: 'מנוי שנתי',
    interval: 'year' as const,
    defaultBeforeVat: DEFAULT_LIBRARY_ANNUAL_BEFORE_VAT,
  },
} as const;
