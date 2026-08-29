import type { AuthUserPayload } from '../api/auth';
import type { UserRole } from '../types';
import { configuredAdminEmails } from '../data/adminEmails';
import { formatPhoneDisplay, phonePlaceholderEmail } from '../utils/phone';

export type ProfileRow = {
  role?: string | null;
  subscription_plan?: string | null;
  is_founder?: boolean | null;
  staff_desk?: string | null;
  staff_status?: string | null;
  full_name?: string | null;
};

export function adminEmailList(extra = ''): string[] {
  return configuredAdminEmails(extra);
}

export function roleFromProfile(profileRole: string | undefined | null, email: string, extraAdminEmails = ''): UserRole {
  const normalized = email.trim().toLowerCase();
  if (adminEmailList(extraAdminEmails).includes(normalized)) return 'admin';
  if (profileRole === 'admin') return 'admin';
  if (profileRole === 'lecturer') return 'instructor';
  return 'student';
}

export function payloadFromSupabase(input: {
  id: string;
  email?: string | null;
  phone?: string | null;
  fullName?: string;
  avatar?: string | null;
  profile?: ProfileRow | null;
  extraAdminEmails?: string;
}): AuthUserPayload {
  const phone = String(input.phone || '').trim();
  const rawEmail = String(input.email || '')
    .trim()
    .toLowerCase();
  const email = rawEmail.includes('@') ? rawEmail : phone ? phonePlaceholderEmail(phone) : '';
  const name =
    input.fullName?.trim() ||
    input.profile?.full_name?.trim() ||
    (phone ? formatPhoneDisplay(phone) : '') ||
    email.split('@')[0] ||
    'משתמש/ת';
  const plan = input.profile?.subscription_plan;
  const subscriptionPlan =
    plan === 'free_trial' || plan === 'monthly' || plan === 'annual' || plan === 'premium_88'
      ? plan
      : 'none';
  const desk = String(input.profile?.staff_desk || '');
  const staffDesk = (
    ['content', 'support', 'sales', 'legal', 'finance', 'community'].includes(desk) ? desk : ''
  ) as AuthUserPayload['staffDesk'];
  const status = String(input.profile?.staff_status || 'active');
  const staffStatus = (
    ['active', 'suspended', 'limited'].includes(status) ? status : 'active'
  ) as AuthUserPayload['staffStatus'];

  return {
    id: input.id,
    email,
    name,
    role: roleFromProfile(input.profile?.role, email, input.extraAdminEmails),
    subscriptionPlan,
    interests: [],
    avatar:
      input.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isFounder: Boolean(input.profile?.is_founder),
    staffDesk,
    staffStatus,
    phone: phone || undefined,
  };
}

export function isApiUnavailableMessage(message: string) {
  return (
    message.includes('לא ניתן להתחבר') ||
    message.includes('שרת ההתחברות לא זמין') ||
    message.includes('פריוויו של Vercel') ||
    message.includes('התחברות חיצונית אינה מוגדרת') ||
    message.includes('Protected deployment')
  );
}
