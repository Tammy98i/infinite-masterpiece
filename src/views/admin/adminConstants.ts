// STAFF_DESK_TABS/STAFF_DESK_LABEL moved to src/data/staffDesks.ts so the
// server can enforce them too (server/middleware/auth.ts's requireAdminTab)
// instead of this file only filtering the sidebar client-side.
export { STAFF_DESK_TABS, STAFF_DESK_LABEL } from '../../data/staffDesks';

export const fieldClass =
  'w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#C8A24C] focus:outline-none min-h-11';

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
