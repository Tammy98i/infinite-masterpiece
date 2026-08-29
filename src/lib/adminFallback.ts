import { COURSES, INSTRUCTORS, CATEGORIES } from '../data/initialData';
import { FOUNDERS } from '../marketing/data/founders';

export type ProfileListRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
  subscription_plan?: string | null;
  is_founder?: boolean | null;
  staff_desk?: string | null;
  staff_status?: string | null;
  created_at?: string | null;
};

function isStockPhoto(url: string) {
  const value = url.toLowerCase();
  return !value || value.includes('unsplash.com') || value.includes('placeholder');
}

function planOf(row: ProfileListRow) {
  const plan = String(row.subscription_plan || 'none');
  return plan === 'free_trial' || plan === 'monthly' || plan === 'annual' || plan === 'premium_88' ? plan : 'none';
}

function roleOf(row: ProfileListRow) {
  if (row.role === 'admin') return 'admin' as const;
  if (row.role === 'lecturer') return 'instructor' as const;
  return 'student' as const;
}

export function overviewFrom(profiles: ProfileListRow[]) {
  const users = profiles.length;
  const paying = profiles.filter((row) => ['monthly', 'annual', 'premium_88'].includes(planOf(row))).length;
  const published = COURSES.length;
  const episodes = COURSES.reduce((sum, course) => sum + (course.episodes?.length || 0), 0);
  const lecturers = profiles.filter((row) => row.role === 'lecturer').length || INSTRUCTORS.length;
  return {
    users,
    free: profiles.filter((row) => planOf(row) === 'none').length,
    trial: profiles.filter((row) => planOf(row) === 'free_trial').length,
    paying,
    braveUsers: 0,
    hesitantUsers: 0,
    failedPayments: 0,
    dueInstallments: 0,
    premium88: profiles.filter((row) => planOf(row) === 'premium_88').length,
    lecturers,
    courses: published,
    published,
    drafts: 0,
    pending: 0,
    episodes,
    applicationsPending: 0,
    paywallHits: 0,
    upgrades: 0,
    conversionRate: users ? Math.round((paying / users) * 100) : 0,
    completionRate: 0,
    watchTimeHours: 0,
    viewsDay: 0,
    viewsWeek: 0,
    viewsMonth: 0,
    popularContent: COURSES[0] ? { id: COURSES[0].id, name: COURSES[0].title, views: 0 } : null,
    strongestCategory: CATEGORIES[0] ? { id: CATEGORIES[0].id, name: CATEGORIES[0].name, views: 0 } : null,
    leadingLecturer: INSTRUCTORS[0] ? { id: INSTRUCTORS[0].id, name: INSTRUCTORS[0].name, views: 0 } : null,
    convertingContent: null,
  };
}

export function emptyAnalytics() {
  return {
    totals: [] as Array<{ event: string; count: number }>,
    funnel: {
      paywallOpened: 0,
      upgradeClicked: 0,
      trialStarted: 0,
      subscriptionStarted: 0,
      subscriptionCancelled: 0,
    },
    video: { started: 0, p25: 0, p50: 0, p75: 0, completed: 0 },
    lecturers: {
      started: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      uploaded: 0,
      pending: 0,
      published: 0,
    },
    recent: [] as Array<{
      id: string;
      event: string;
      userId: string | null;
      properties: Record<string, string>;
      createdAt: string;
    }>,
  };
}

export function usersFromProfiles(profiles: ProfileListRow[]) {
  return profiles.map((row) => ({
    id: row.id,
    email: String(row.email || ''),
    name: String(row.full_name || row.email || 'משתמש/ת'),
    role: roleOf(row),
    subscriptionPlan: planOf(row),
    blocked: String(row.staff_status || 'active') === 'suspended',
    isFounder: Boolean(row.is_founder),
    createdAt: String(row.created_at || ''),
    staffDesk: String(row.staff_desk || ''),
    staffStatus: String(row.staff_status || 'active'),
  }));
}

export function readinessPayload() {
  return {
    stripeEnabled: false,
    billingMode: 'pilot_manual' as const,
    s3Enabled: false,
    raffleTermsApproved: false,
    courses: COURSES.map((course) => ({
      id: course.id,
      title: course.title,
      status: course.status || 'published',
      programWeek: Number(course.programWeek || 0),
    })),
    founders: FOUNDERS.map((founder) => ({
      id: founder.id,
      name: founder.name,
      hasRealPhoto: !isStockPhoto(founder.image),
      hasWebsite: false,
      hasInstagram: false,
    })),
  };
}
