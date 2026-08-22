/** Library subscription — separate from journey tracks (8888). Prices TBD in Stripe week 2. */
export const LIBRARY_TRIAL_DAYS = 7;

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
