import type { Tab } from '../views/admin/adminNav';

/**
 * Shared source of truth for staff-desk access, used by both the admin UI
 * (to filter the sidebar) and the server (server/middleware/auth.ts) to
 * gate /api/admin/* routes. Keep tab ids in sync with adminNav.ts.
 *
 * Read-only: every write (POST/PUT/PATCH/DELETE) under /api/admin requires
 * role === 'admin' regardless of this map — see requireAdminTab. A desk
 * only ever grants scoped *viewing* access, never the ability to mutate
 * users, roles, payments, or content. Widening that is a deliberate,
 * separate decision, not something to infer from this map.
 */
export const STAFF_DESK_TABS: Record<string, Tab[]> = {
  content: ['overview', 'content', 'categories', 'lecturers', 'founders', 'team', 'access', 'notifications', 'audit', 'onboarding'],
  support: ['overview', 'users', 'access', 'leads', 'notifications', 'audit', 'team'],
  sales: ['overview', 'leads', 'webinar', 'tracks', 'payments', 'funnel', 'premium88', 'analytics', 'notifications', 'team', 'access'],
  legal: ['overview', 'legal', 'settings', 'audit', 'notifications', 'team', 'access'],
  finance: ['overview', 'payments', 'tracks', 'analytics', 'notifications', 'audit', 'team', 'access'],
  community: ['overview', 'users', 'access', 'leads', 'premium88', 'funnel', 'notifications', 'team'],
};

export const STAFF_DESK_LABEL: Record<string, string> = {
  content: 'תוכן',
  support: 'תמיכה',
  sales: 'מכירות / הצלחה',
  legal: 'משפטי',
  finance: 'כספים',
  community: 'קהילה',
};
