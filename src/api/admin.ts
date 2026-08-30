import type { AccessLevel, Category, Course, Instructor, PublishStatus, UserRole } from '../types';
import type { WebinarConfig } from '../constants/webinar';
import { apiRequest } from './auth';
import type { LecturerApplication } from './lecturer';

export interface AdminOverview {
  users: number;
  free: number;
  trial: number;
  paying: number;
  braveUsers: number;
  hesitantUsers: number;
  failedPayments: number;
  dueInstallments: number;
  premium88: number;
  lecturers: number;
  courses: number;
  published: number;
  drafts: number;
  pending: number;
  episodes: number;
  applicationsPending: number;
  paywallHits: number;
  upgrades: number;
  conversionRate: number;
  completionRate: number;
  watchTimeHours: number;
  viewsDay: number;
  viewsWeek: number;
  viewsMonth: number;
  popularContent: { id: string; name: string; views: number } | null;
  strongestCategory: { id: string; name: string; views: number } | null;
  leadingLecturer: { id: string; name: string; views: number } | null;
  convertingContent: { id: string; name: string; views: number } | null;
}

export interface AdminAnalytics {
  totals: Array<{ event: string; count: number }>;
  funnel: {
    paywallOpened: number;
    upgradeClicked: number;
    trialStarted: number;
    subscriptionStarted: number;
    subscriptionCancelled: number;
  };
  video: {
    started: number;
    p25: number;
    p50: number;
    p75: number;
    completed: number;
  };
  lecturers: {
    started: number;
    submitted: number;
    approved: number;
    rejected: number;
    uploaded: number;
    pending: number;
    published: number;
  };
  recent: Array<{
    id: string;
    event: string;
    userId: string | null;
    properties: Record<string, string>;
    createdAt: string;
  }>;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscriptionPlan: string;
  trialEndsAt?: string;
  blocked: boolean;
  isFounder: boolean;
  createdAt: string;
  lastLoginAt?: string;
  entryTrack?: string;
  currentPaymentPhase?: number;
  raffleTicketsCount?: number;
  staffDesk?: '' | 'content' | 'support' | 'sales' | 'legal' | 'finance' | 'community';
  staffStatus?: 'active' | 'suspended' | 'limited';
}

export interface AdminPaymentRow {
  id: string;
  userId: string;
  userName: string;
  email: string;
  plan: string;
  source: string;
  createdAt: string;
}

export interface CoursePayload {
  title: string;
  subtitle?: string;
  description?: string;
  categoryId?: string;
  instructorId?: string;
  coverImage?: string;
  backdropImage?: string;
  trailerUrl?: string;
  tags?: string[];
  level?: Course['level'];
  targetAudience?: string;
  status?: PublishStatus;
  accessLevel?: AccessLevel;
  resources?: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isShort?: boolean;
  programWeek?: number;
  episodes?: Array<{
    id?: string;
    title: string;
    description?: string;
    duration?: number;
    videoUrl?: string;
    accessLevel?: AccessLevel;
    captionTracks?: Array<{
      src: string;
      label: string;
      srclang: string;
      kind?: 'subtitles' | 'captions';
      default?: boolean;
    }>;
  }>;
}

export const adminApi = {
  overview: () => apiRequest<AdminOverview>('/api/admin/overview'),
  courses: () => apiRequest<{ courses: Course[] }>('/api/admin/courses'),
  createCourse: (payload: CoursePayload) =>
    apiRequest<{ course: Course }>('/api/admin/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCourse: (id: string, payload: CoursePayload) =>
    apiRequest<{ course: Course }>(`/api/admin/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  setCourseStatus: (id: string, status: PublishStatus) =>
    apiRequest<{ course: Course }>(`/api/admin/courses/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  users: () => apiRequest<{ users: AdminUserRow[] }>('/api/admin/users'),
  adminEmails: () =>
    apiRequest<{ emails: string[]; builtIn: string[]; extra: string[] }>('/api/admin/admin-emails'),
  saveAdminEmails: (emails: string[]) =>
    apiRequest<{ emails: string[]; builtIn: string[]; extra: string[] }>('/api/admin/admin-emails', {
      method: 'PUT',
      body: JSON.stringify({ emails }),
    }),
  createUser: (payload: {
    fullName: string;
    email: string;
    password: string;
    role?: string;
    isFounder?: boolean;
  }) =>
    apiRequest<{ user: AdminUserRow }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateUser: (
    id: string,
    patch: {
      role?: string;
      subscriptionPlan?: string;
      blocked?: boolean;
      isFounder?: boolean;
      trialEndsAt?: string | null;
      entryTrack?: string;
      currentPaymentPhase?: number;
      staffDesk?: string;
      staffStatus?: string;
    }
  ) =>
    apiRequest<{ user: AdminUserRow }>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  applications: () => apiRequest<{ applications: LecturerApplication[] }>('/api/admin/applications'),
  reviewApplication: (id: string, action: 'approved' | 'rejected' | 'more_info', adminNote?: string) =>
    apiRequest<{ application: LecturerApplication }>(`/api/admin/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, adminNote }),
    }),
  analytics: () => apiRequest<AdminAnalytics>('/api/admin/analytics'),
  founders: () => apiRequest<{ founders: Instructor[] }>('/api/admin/founders'),
  reorderFounders: (ids: string[]) =>
    apiRequest<{ founders: Instructor[] }>('/api/admin/founders/order', {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    }),
  updateFounder: (id: string, patch: { avatarUrl?: string; externalLinks?: Array<{ label: string; url: string }> }) =>
    apiRequest<{ founder: Instructor }>(`/api/admin/founders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  payments: () => apiRequest<{ payments: AdminPaymentRow[] }>('/api/admin/payments'),
  tracks: () => apiRequest<AdminTracksDashboard>('/api/admin/tracks'),
  setInstallmentStatus: (id: string, status: 'paid' | 'failed' | 'due') =>
    apiRequest<{ ok: true; status: string; alreadyPaid: boolean; userId: string | null }>(
      `/api/admin/tracks/installments/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    ),
  readiness: () => apiRequest<AdminReadiness>('/api/admin/readiness'),
  setProgramWeek: (id: string, programWeek: number) =>
    apiRequest<{ course: Course }>(`/api/admin/courses/${id}/program-week`, {
      method: 'PATCH',
      body: JSON.stringify({ programWeek }),
    }),
  setSetting: (
    key: 'raffle_terms_approved' | 'legal_terms' | 'legal_privacy' | 'legal_raffle',
    value: boolean | string
  ) =>
    apiRequest<{ key: string; value: boolean | string }>('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ key, value }),
    }),
  legal: () =>
    apiRequest<{ terms: string; privacy: string; raffle: string; raffleTermsApproved: boolean }>(
      '/api/admin/legal'
    ),
  accessibilityReports: () =>
    apiRequest<{
      reports: Array<{
        id: string;
        fullName: string;
        email: string;
        phone: string;
        pageUrl: string;
        message: string;
        status: 'open' | 'in_progress' | 'resolved';
        adminNotes: string;
        createdAt: string;
        updatedAt: string;
        resolvedAt: string | null;
      }>;
    }>('/api/admin/accessibility-reports'),
  updateAccessibilityReport: (
    id: string,
    payload: { status: 'open' | 'in_progress' | 'resolved'; adminNotes?: string },
  ) =>
    apiRequest<{ report: { id: string; status: string; updatedAt: string } }>(
      `/api/admin/accessibility-reports/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    ),
  leads: () => apiRequest<{ leads: AdminCrmLead[] }>('/api/admin/leads'),
  webinar: () =>
    apiRequest<AdminWebinarDashboard>('/api/admin/webinar'),
  saveWebinarConfig: (config: WebinarConfig) =>
    apiRequest<{ config: WebinarConfig }>('/api/admin/webinar', {
      method: 'PATCH',
      body: JSON.stringify({ config }),
    }),
  sendWebinarTestEmail: (to: string) =>
    apiRequest<{ sent: boolean; id?: string; from: string }>('/api/admin/webinar/test-email', {
      method: 'POST',
      body: JSON.stringify({ to }),
    }),
  notifications: () =>
    apiRequest<{
      notifications: AdminNotification[];
      counts: { total: number; high: number };
    }>('/api/admin/notifications'),
  teamMessages: () =>
    apiRequest<{
      messages: Array<{
        id: string;
        lecturerUserId: string;
        lecturerName: string;
        lecturerEmail: string;
        fromAdminName: string;
        subject: string;
        body: string;
        readAt: string | null;
        createdAt: string;
      }>;
    }>('/api/admin/team-messages'),
  sendTeamMessage: (payload: { lecturerUserId: string; subject: string; body: string }) =>
    apiRequest<{ message: { id: string } }>('/api/admin/team-messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  raffles: () => apiRequest<AdminRaffleDashboard>('/api/admin/raffles'),
  createRaffle: (payload: { title: string; description?: string; endsAt?: string }) =>
    apiRequest<{ raffle: AdminRaffle }>('/api/admin/raffles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  assignRaffleTickets: (id: string) =>
    apiRequest<{ updated: number }>(`/api/admin/raffles/${encodeURIComponent(id)}/assign-tickets`, {
      method: 'POST',
    }),
  drawRaffle: (id: string) =>
    apiRequest<{ raffle: AdminRaffle }>(`/api/admin/raffles/${encodeURIComponent(id)}/draw`, {
      method: 'POST',
    }),
  createFounder: (payload: { name: string; title: string; bio: string; avatarUrl: string }) =>
    apiRequest<{ founder: Instructor }>('/api/admin/founders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  categories: () => apiRequest<{ categories: Category[] }>('/api/admin/categories'),
  createCategory: (payload: {
    name: string;
    description?: string;
    icon?: string;
    coverImage?: string;
    accessLevel?: AccessLevel;
    sortOrder?: number;
  }) =>
    apiRequest<{ category: Category }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCategory: (
    id: string,
    patch: {
      name?: string;
      description?: string;
      icon?: string;
      coverImage?: string;
      accessLevel?: AccessLevel;
      sortOrder?: number;
    }
  ) =>
    apiRequest<{ category: Category }>(`/api/admin/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  reorderCategories: (ids: string[]) =>
    apiRequest<{ categories: Category[] }>('/api/admin/categories/order', {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    }),
  premium88: () => apiRequest<{ applications: AdminPremium88Application[] }>('/api/admin/premium-88'),
  reviewPremium88: (id: string, status: string, adminNotes?: string) =>
    apiRequest<{ application: AdminPremium88Application }>(`/api/admin/premium-88/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes }),
    }),
  auditLogs: () => apiRequest<{ logs: AdminAuditLog[] }>('/api/admin/audit-logs'),
};

export interface AdminPremium88Application {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  field: string;
  businessStage: string;
  goal: string;
  links: string;
  notes: string;
  status: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  adminName: string;
  adminEmail: string;
  actionType: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  createdAt: string;
}

export interface AdminCrmLead {
  id: string;
  source: 'track' | 'premium88' | 'lecturer' | 'webinar';
  sourceLabel: string;
  name: string;
  phone: string;
  email: string;
  interest: string;
  status: string;
  createdAt: string;
}

export interface AdminWebinarRegistration {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  field: string;
  interest: string;
  blocker: string;
  marketingOptIn: boolean;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  status: string;
  createdAt: string;
  personPickedAt?: string;
}

export interface AdminWebinarDashboard {
  config: WebinarConfig;
  registrations: AdminWebinarRegistration[];
  totalRegistrations: number;
  funnel: {
    pageViews: number;
    formViews: number;
    stepAStarted: number;
    stepACompleted: number;
    stepBStarted: number;
    stepBCompleted: number;
    completed: number;
    calendarClicks: number;
    whatsappClicks: number;
    fitSectionViews: number;
    ctaClicks: number;
    partialLeads: number;
    emailLeads: number;
    completeLeads: number;
    waitlistLeads: number;
    personPicked: number;
  };
  readiness: {
    ready: boolean;
    emailEnabled: boolean;
    items: Array<{
      id: string;
      ok: boolean;
      required: boolean;
      label: string;
      hint: string;
    }>;
  };
}

export interface AdminNotification {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  tab: string;
  count: number;
  createdAt: string;
}

export interface AdminRaffle {
  id: string;
  title: string;
  description: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  winnerUserId: string | null;
  winnerName?: string;
  ticketsCount?: number;
  participants?: number;
  createdAt: string;
}

export interface AdminRaffleDashboard {
  termsApproved: boolean;
  unassignedTickets: number;
  raffles: AdminRaffle[];
  tickets: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    trackType: string;
    ticketsCount: number;
    raffleId: string;
    grantedReason: string;
    createdAt: string;
  }>;
}

export interface AdminCourseWeekRow {
  id: string;
  title: string;
  status: PublishStatus;
  programWeek: number;
}

export interface AdminFounderReadiness {
  id: string;
  name: string;
  hasRealPhoto: boolean;
  hasWebsite: boolean;
  hasInstagram: boolean;
}

export interface AdminReadiness {
  stripeEnabled: boolean;
  billingMode: 'stripe' | 'pilot_manual';
  s3Enabled: boolean;
  raffleTermsApproved: boolean;
  courses: AdminCourseWeekRow[];
  founders: AdminFounderReadiness[];
}

export interface AdminTrackInstallment {
  id: string;
  number: number;
  amountBeforeVat: number;
  vatAmount: number;
  amountWithVat: number;
  dueAt: string | null;
  paidAt: string | null;
  status: string;
  transactionId: string;
  paymentSource: string;
}

export interface AdminTrackLead {
  id: string;
  trackType: string;
  name: string;
  phone: string;
  email: string;
  field: string;
  hesitationReason: string;
  hasProduct: string;
  hasSold: string;
  goal90: string;
  links: string;
  referredByLecturerId: string;
  referredByLecturerName: string;
  status: string;
  createdAt: string;
  userId: string | null;
  userName: string | null;
  plan: {
    id: string;
    amountBeforeVat: number;
    vatAmount: number;
    amountWithVat: number;
    status: string;
    createdAt: string;
  } | null;
  installments: AdminTrackInstallment[];
  currentInstallment: AdminTrackInstallment | null;
}

export interface AdminTracksDashboard {
  braveLeads: number;
  hesitantLeads: number;
  braveUsers: number;
  hesitantUsers: number;
  paid8: number;
  paid80: number;
  paid800: number;
  paid8000: number;
  dueNow: number;
  failedPayments: number;
  raffleTicketsGranted: number;
  followUp: number;
  billingMode: 'stripe' | 'pilot_manual';
  revenueByPhase: Array<{ installment: number; amountBeforeVat: number; paidCount: number; revenue: number }>;
  leads: AdminTrackLead[];
}
