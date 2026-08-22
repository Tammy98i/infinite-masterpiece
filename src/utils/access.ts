import type { AccessLevel, Course, Episode, UserProfile } from '../types';

type AccessUser = Pick<UserProfile, 'role' | 'subscriptionPlan' | 'entryTrack' | 'currentPaymentPhase'>;

export function episodeAccess(episode: Pick<Episode, 'isFreeSample' | 'accessLevel'> | undefined): AccessLevel {
  if (!episode) return 'premium';
  if (episode.accessLevel) return episode.accessLevel;
  return episode.isFreeSample ? 'free' : 'premium';
}

export function isPaidPlan(plan: UserProfile['subscriptionPlan']) {
  return plan === 'free_trial' || plan === 'monthly' || plan === 'annual' || plan === 'premium_88';
}

export function unlockedProgramWeek(user: AccessUser) {
  if (user.role === 'admin') return 4;
  if (user.entryTrack === 'brave' && (user.currentPaymentPhase || 0) >= 1) return 4;
  if (user.entryTrack === 'hesitant') return Math.min(4, Math.max(0, user.currentPaymentPhase || 0));
  if (isPaidPlan(user.subscriptionPlan)) return 4;
  return 0;
}

export function hasFullLibraryAccess(user: AccessUser) {
  if (user.role === 'admin') return true;
  return unlockedProgramWeek(user) >= 4 || isPaidPlan(user.subscriptionPlan);
}

export const FREE_LIST_LIMIT = 3;

export function canAddToList(user: AccessUser, currentCount: number) {
  if (user.role === 'admin') return true;
  if (hasFullLibraryAccess(user)) return true;
  return currentCount < FREE_LIST_LIMIT;
}

const SAVE_PAYWALL_KEY = 'mc_paywall_save';

export function shouldPromptSavePaywall(user: AccessUser) {
  if (user.role === 'admin') return false;
  if (hasFullLibraryAccess(user)) return false;
  if (sessionStorage.getItem(SAVE_PAYWALL_KEY) === '1') return false;
  sessionStorage.setItem(SAVE_PAYWALL_KEY, '1');
  return true;
}

export function canWatchEpisode(
  episode: Pick<Episode, 'isFreeSample' | 'accessLevel'> | undefined,
  user: AccessUser,
  course?: Pick<Course, 'programWeek'>
) {
  if (!episode) return false;
  if (user.role === 'admin') return true;
  const level = episodeAccess(episode);
  if (level === 'free') return true;
  if (level === 'admin_only') return false;
  if (level === 'premium_88') return user.subscriptionPlan === 'premium_88';
  const week = course?.programWeek || 0;
  if (week > 0) return unlockedProgramWeek(user) >= week;
  return hasFullLibraryAccess(user);
}

export const PREVIEW_SECONDS = 120;

export function canPreviewEpisode(
  episode: Pick<Episode, 'isFreeSample' | 'accessLevel'> | undefined,
  user: AccessUser,
  course?: Pick<Course, 'programWeek'>
) {
  if (!episode) return false;
  if (canWatchEpisode(episode, user, course)) return false;
  return episodeAccess(episode) !== 'admin_only';
}
