import type { Tab } from './adminNav';

export const fieldClass =
  'w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 focus:border-[#b79043] focus:ring-1 focus:ring-[#b79043]/30 focus:outline-none min-h-11 disabled:cursor-not-allowed disabled:opacity-55';

export const STAFF_DESK_TABS: Record<string, Tab[]> = {
  content: ['overview', 'content', 'categories', 'lecturers', 'founders', 'team', 'access', 'notifications', 'audit', 'onboarding'],
  support: ['overview', 'users', 'access', 'leads', 'notifications', 'audit', 'team'],
  sales: ['overview', 'leads', 'webinar', 'tracks', 'payments', 'funnel', 'premium88', 'pods', 'analytics', 'notifications', 'team', 'access'],
  legal: ['overview', 'legal', 'settings', 'audit', 'notifications', 'team', 'access'],
  finance: ['overview', 'payments', 'tracks', 'analytics', 'notifications', 'audit', 'team', 'access'],
  community: ['overview', 'users', 'access', 'leads', 'premium88', 'pods', 'funnel', 'notifications', 'team'],
};

export const STAFF_DESK_LABEL: Record<string, string> = {
  content: 'תוכן',
  support: 'תמיכה',
  sales: 'מכירות / הצלחה',
  legal: 'משפטי',
  finance: 'כספים',
  community: 'קהילה',
};

export const ROLE_LABEL: Record<string, string> = {
  student: 'משתמש',
  instructor: 'מרצה',
  admin: 'אדמין',
};

export const PLAN_LABEL: Record<string, string> = {
  none: 'חינמי',
  free_trial: 'ניסיון',
  monthly: 'חודשי',
  annual: 'שנתי',
  premium_88: 'נבחרת 88',
};
