import { COURSES, INSTRUCTORS, CATEGORIES } from '../../src/data/initialData.js';
import { FOUNDERS } from '../../src/marketing/data/founders.js';
import { BUILT_IN_ADMIN_EMAILS, mergeAdminEmails } from './publicConfig.js';
import { DEFAULT_WEBINAR_CONFIG } from '../../src/constants/webinar.js';
import type { SessionUser } from './session.js';

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

export function fallbackProfile(user: SessionUser): ProfileListRow {
  return {
    id: user.id,
    email: user.email,
    full_name: user.name,
    role: user.role === 'admin' ? 'admin' : user.role === 'instructor' ? 'lecturer' : 'user',
    subscription_plan: user.subscriptionPlan,
    is_founder: Boolean(user.isFounder),
    staff_desk: user.staffDesk || '',
    staff_status: user.staffStatus || 'active',
    created_at: new Date().toISOString(),
  };
}

export function catalogPayload() {
  return {
    courses: COURSES,
    instructors: INSTRUCTORS,
    categories: CATEGORIES,
    weeklyPopularIds: COURSES.filter((course) => course.isPopular).slice(0, 8).map((course) => course.id),
  };
}

export function readinessPayload() {
  const stripeEnabled = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const s3Enabled = Boolean(process.env.S3_BUCKET?.trim() || process.env.S3_BUCKET_NAME?.trim());
  return {
    stripeEnabled,
    billingMode: stripeEnabled ? 'stripe' : 'pilot_manual',
    s3Enabled,
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

export function adminEmailsPayload() {
  const emails = mergeAdminEmails(BUILT_IN_ADMIN_EMAILS, process.env.ADMIN_EMAILS, process.env.VITE_ADMIN_EMAILS);
  return { emails, builtIn: [...BUILT_IN_ADMIN_EMAILS], extra: [] as string[] };
}

export function emptyTracks() {
  return {
    braveLeads: 0,
    hesitantLeads: 0,
    braveUsers: 0,
    hesitantUsers: 0,
    paid8: 0,
    paid80: 0,
    paid800: 0,
    paid8000: 0,
    dueNow: 0,
    failedPayments: 0,
    raffleTicketsGranted: 0,
    followUp: 0,
    billingMode: (process.env.STRIPE_SECRET_KEY?.trim() ? 'stripe' : 'pilot_manual') as 'stripe' | 'pilot_manual',
    revenueByPhase: [] as Array<{ installment: number; amountBeforeVat: number; paidCount: number; revenue: number }>,
    leads: [] as unknown[],
  };
}

export function emptyWebinar() {
  const hasWhatsapp = Boolean(DEFAULT_WEBINAR_CONFIG.whatsappGroupUrl.trim());
  const hasZoom = Boolean(DEFAULT_WEBINAR_CONFIG.zoomLink.trim());
  const emailEnabled = Boolean(process.env.RESEND_API_KEY?.trim());
  const items = [
    {
      id: 'date',
      ok: false,
      required: true,
      label: 'תאריך ושעה בעתיד',
      hint: `התאריך השמור ${DEFAULT_WEBINAR_CONFIG.date} — עדכנו באדמין בשרת המלא.`,
    },
    {
      id: 'whatsapp',
      ok: hasWhatsapp,
      required: true,
      label: 'קבוצת וואטסאפ שקטה',
      hint: hasWhatsapp ? 'מוגדר' : 'בלי קישור, דף התודה לא יכול לפתוח קבוצה.',
    },
    {
      id: 'zoom',
      ok: hasZoom,
      required: false,
      label: 'קישור Zoom',
      hint: hasZoom ? 'מוגדר' : 'אפשר להשאיר ריק — יישלח לנרשמים לפני הערב.',
    },
    {
      id: 'email',
      ok: emailEnabled,
      required: true,
      label: 'שליחת מייל',
      hint: emailEnabled ? 'Resend פעיל' : 'חסר RESEND_API_KEY בשרת.',
    },
  ];
  return {
    config: DEFAULT_WEBINAR_CONFIG,
    registrations: [],
    totalRegistrations: 0,
    funnel: {
      pageViews: 0,
      formViews: 0,
      stepAStarted: 0,
      stepACompleted: 0,
      stepBStarted: 0,
      stepBCompleted: 0,
      completed: 0,
      calendarClicks: 0,
      whatsappClicks: 0,
      fitSectionViews: 0,
      ctaClicks: 0,
      partialLeads: 0,
      emailLeads: 0,
      completeLeads: 0,
      waitlistLeads: 0,
      personPicked: 0,
    },
    readiness: {
      ready: items.filter((item) => item.required).every((item) => item.ok),
      emailEnabled,
      items,
    },
  };
}

export const WRITE_UNAVAILABLE =
  'שמירה מלאה של תוכן, תשלומים ווובינר רצה על השרת המלא. כאן אפשר לצפות בנתונים ולעדכן תפקיד או מנוי של משתמשים.';
