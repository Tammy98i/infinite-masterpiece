import type { DbPlan } from './authService.js';

export function canUserChangePlan(current: DbPlan, requested: DbPlan) {
  if (requested === 'none') return true;
  return requested === 'free_trial' && current === 'none';
}

export function trialEndDate(now = new Date(), days = 14) {
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + days);
  return end.toISOString();
}
