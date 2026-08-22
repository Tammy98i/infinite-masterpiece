import type { Course, Episode, UserProfile, WatchProgress } from '../types';
import { canPreviewEpisode, canWatchEpisode, episodeAccess } from './access';

export function episodeDisplayName(title: string) {
  return title.replace(/^פרק\s+\d+\s*[:·-]\s*/, '');
}

export type EpisodeUiAccess = 'open' | 'preview' | 'locked';

export function episodeUiAccess(
  episode: Episode,
  user: Pick<UserProfile, 'role' | 'subscriptionPlan' | 'entryTrack' | 'currentPaymentPhase'>,
  course: Course
): EpisodeUiAccess {
  if (canWatchEpisode(episode, user, course)) {
    return episodeAccess(episode) === 'free' || episode.isFreeSample ? 'open' : 'open';
  }
  if (canPreviewEpisode(episode, user, course)) return 'preview';
  return 'locked';
}

export function firstAvailableEpisode(
  course: Course,
  user: Pick<UserProfile, 'role' | 'subscriptionPlan' | 'entryTrack' | 'currentPaymentPhase'>
) {
  return (
    course.episodes.find((ep) => canWatchEpisode(ep, user, course) || canPreviewEpisode(ep, user, course)) ||
    null
  );
}

export function findContinueEpisode(
  course: Course,
  watchProgress: Record<string, WatchProgress>
) {
  const items = course.episodes
    .map((ep) => ({ ep, prog: watchProgress[`${course.id}_${ep.id}`] }))
    .filter(({ prog }) => prog && !prog.completed && prog.currentTime >= 30)
    .filter(({ prog }) => prog && prog.currentTime / Math.max(1, prog.duration) < 0.9)
    .sort((a, b) => (b.prog?.updatedAt || 0) - (a.prog?.updatedAt || 0));
  return items[0] || null;
}

export function courseCompleted(
  course: Course,
  watchProgress: Record<string, WatchProgress>
) {
  if (course.episodes.length === 0) return false;
  return course.episodes.every((ep) => watchProgress[`${course.id}_${ep.id}`]?.completed);
}

export function completedChapterCount(
  course: Course,
  watchProgress: Record<string, WatchProgress>
) {
  return course.episodes.filter((ep) => watchProgress[`${course.id}_${ep.id}`]?.completed).length;
}

export type PrimaryCtaMode = 'start' | 'resume' | 'replay' | 'preview' | 'access';

export function resolvePrimaryCta(
  course: Course,
  user: Pick<UserProfile, 'role' | 'subscriptionPlan' | 'entryTrack' | 'currentPaymentPhase'>,
  watchProgress: Record<string, WatchProgress>
): { mode: PrimaryCtaMode; label: string; episodeId: string | null } {
  const available = firstAvailableEpisode(course, user);
  if (!available) {
    return { mode: 'access', label: 'בחירת מסלול', episodeId: course.episodes[0]?.id || null };
  }

  if (courseCompleted(course, watchProgress)) {
    return { mode: 'replay', label: 'צפייה חוזרת', episodeId: available.id };
  }

  const cont = findContinueEpisode(course, watchProgress);
  if (cont) {
    return { mode: 'resume', label: 'המשך צפייה', episodeId: cont.ep.id };
  }

  const first = course.episodes[0];
  if (
    first &&
    available.id === first.id &&
    !canWatchEpisode(first, user, course) &&
    canPreviewEpisode(first, user, course)
  ) {
    return { mode: 'preview', label: 'צפו בטעימה', episodeId: first.id };
  }

  return { mode: 'start', label: 'התחילו לצפות', episodeId: available.id };
}

export function timeBasedCourseProgress(
  course: Course,
  watchProgress: Record<string, WatchProgress>
) {
  const total = course.episodes.reduce((s, ep) => s + ep.duration, 0);
  if (total <= 0) return 0;
  let watched = 0;
  for (const ep of course.episodes) {
    const prog = watchProgress[`${course.id}_${ep.id}`];
    if (!prog) continue;
    if (prog.completed) watched += ep.duration;
    else watched += Math.min(ep.duration, prog.currentTime);
  }
  return Math.min(100, Math.round((watched / total) * 100));
}
