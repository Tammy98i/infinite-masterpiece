import type { Course, Episode, UserProfile, WatchProgress } from '../types';
import { canPreviewEpisode, canWatchEpisode, hasFullLibraryAccess } from './access';

export type CardAccessState = 'open' | 'preview' | 'locked';

const CONTINUE_MIN_SECONDS = 30;
const CONTINUE_MAX_RATIO = 0.9;
const NEW_DAYS = 14;

/** Topics shown on library home grid (spec §13). */
export const LIBRARY_TOPIC_IDS = [
  'cat-sales',
  'cat-story',
  'cat-mindset',
  'cat-finance',
  'cat-founders',
] as const;

export function episodeProgressRatio(progress: WatchProgress) {
  return progress.currentTime / Math.max(1, progress.duration);
}

export function isContinueEligible(progress: WatchProgress) {
  if (progress.completed) return false;
  if (progress.currentTime < CONTINUE_MIN_SECONDS) return false;
  return episodeProgressRatio(progress) < CONTINUE_MAX_RATIO;
}

export function isCourseNew(course: Course, now = Date.now()) {
  if (course.isNew) {
    const created = Date.parse(course.createdAt);
    if (!Number.isNaN(created)) {
      return now - created <= NEW_DAYS * 24 * 60 * 60 * 1000;
    }
    return true;
  }
  const created = Date.parse(course.createdAt);
  if (Number.isNaN(created)) return false;
  return now - created <= NEW_DAYS * 24 * 60 * 60 * 1000;
}

export function courseTotalSeconds(course: Course) {
  return course.episodes.reduce((sum, ep) => sum + ep.duration, 0);
}

/** Spec: up to 10:59 inclusive. */
export function isTenMinuteCourse(course: Course) {
  if (course.isShort) return courseTotalSeconds(course) <= 659;
  return courseTotalSeconds(course) <= 659;
}

export function coursePrimaryEpisode(course: Course): Episode | undefined {
  return course.episodes[0];
}

export function getCardAccessState(
  course: Course,
  user: Pick<UserProfile, 'role' | 'subscriptionPlan' | 'entryTrack' | 'currentPaymentPhase'>
): CardAccessState {
  const episode = coursePrimaryEpisode(course);
  if (canWatchEpisode(episode, user, course)) return 'open';
  if (canPreviewEpisode(episode, user, course)) return 'preview';
  return 'locked';
}

/** Always-visible card badge. Empty when the lecture is fully open. */
export function cardBadgeLabel(
  access: CardAccessState,
  layout: 'card' | 'continue' = 'card'
): 'המשך' | 'טעימה' | 'נעול' | '' {
  if (layout === 'continue') return 'המשך';
  if (access === 'preview') return 'טעימה';
  if (access === 'locked') return 'נעול';
  return '';
}

export function countFullyOpenCourses(
  courses: Course[],
  user: Pick<UserProfile, 'role' | 'subscriptionPlan' | 'entryTrack' | 'currentPaymentPhase'>
) {
  return courses.filter((c) => getCardAccessState(c, user) === 'open').length;
}

export function userNeedsAccessStrip(
  user: Pick<UserProfile, 'role' | 'subscriptionPlan' | 'entryTrack' | 'currentPaymentPhase'>
) {
  return !hasFullLibraryAccess(user);
}

/**
 * Prefer unique items. If catalog is thin, allow a repeat only after `gap` new items.
 */
export function dedupeCourses(
  candidates: Course[],
  opts: {
    excludeIds?: Set<string>;
    limit: number;
    softExcludeIds?: Set<string>;
    softExcludeFirstN?: number;
    gapBeforeRepeat?: number;
  }
): Course[] {
  const exclude = opts.excludeIds || new Set<string>();
  const soft = opts.softExcludeIds || new Set<string>();
  const softFirstN = opts.softExcludeFirstN ?? 4;
  const gap = opts.gapBeforeRepeat ?? 4;
  const out: Course[] = [];
  const used = new Set<string>();
  const deferred: Course[] = [];

  for (const course of candidates) {
    if (exclude.has(course.id)) continue;
    if (used.has(course.id)) continue;
    if (soft.has(course.id) && out.length < softFirstN) {
      deferred.push(course);
      continue;
    }
    out.push(course);
    used.add(course.id);
    if (out.length >= opts.limit) return out;
  }

  for (const course of deferred) {
    if (used.has(course.id)) continue;
    if (out.length < gap) continue;
    out.push(course);
    used.add(course.id);
    if (out.length >= opts.limit) break;
  }

  return out;
}

export function pickWeeklyPopular(
  courses: Course[],
  limit = 5,
  weeklyPopularIds: string[] = []
) {
  if (weeklyPopularIds.length > 0) {
    const byId = new Map(courses.map((c) => [c.id, c]));
    const ranked = weeklyPopularIds.map((id) => byId.get(id)).filter(Boolean) as Course[];
    if (ranked.length >= Math.min(3, limit)) return ranked.slice(0, limit);
    const rest = [...courses]
      .filter((c) => !weeklyPopularIds.includes(c.id))
      .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating);
    return [...ranked, ...rest].slice(0, limit);
  }
  return [...courses]
    .filter((c) => c.isPopular || c.reviewCount > 0)
    .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
    .slice(0, limit);
}

export function pickStartHereCourses(
  courses: Course[],
  user: Pick<UserProfile, 'role' | 'subscriptionPlan' | 'entryTrack' | 'currentPaymentPhase'>
) {
  const used = new Set<string>();
  const take = (pred: (course: Course) => boolean) => {
    const found = courses.find((course) => !used.has(course.id) && pred(course));
    if (found) used.add(found.id);
    return found;
  };

  const tenMinute = take(isTenMinuteCourse);
  const taste = take((course) => {
    const state = getCardAccessState(course, user);
    return state === 'open' || state === 'preview';
  });
  let newest = take((course) => isCourseNew(course) || Boolean(course.isNew));
  if (!newest) {
    newest = [...courses]
      .filter((course) => !used.has(course.id))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  }

  return { tenMinute, taste, newest };
}
