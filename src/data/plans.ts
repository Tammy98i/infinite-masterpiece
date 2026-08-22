export type PlanId = 'free_trial' | 'monthly' | 'annual';

export function planLabel(plan: 'free_trial' | 'monthly' | 'annual' | 'premium_88' | 'none') {
  if (plan === 'annual') return 'מנוי שנתי';
  if (plan === 'monthly') return 'מנוי חודשי';
  if (plan === 'free_trial') return 'ניסיון';
  if (plan === 'premium_88') return 'נבחרת 88';
  return 'ללא מנוי';
}
