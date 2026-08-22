import { Course } from '../types';
import { INTEREST_TO_CATEGORY } from '../data/categories';

export function getRecommendedCourses(courses: Course[], interests: string[]): Course[] {
  return getRecommendedWithReasons(courses, interests).courses;
}

export function getRecommendedWithReasons(
  courses: Course[],
  interests: string[],
  recentTitles: string[] = []
): { courses: Course[]; reasons: Record<string, string>; isPersonal: boolean } {
  const reasons: Record<string, string> = {};

  if (interests.length === 0 && recentTitles.length === 0) {
    const system = courses.filter((c) => c.isPopular || c.isFeatured).slice(0, 8);
    const fallback = system.length >= 4 ? system : courses.slice(0, 8);
    for (const c of fallback) {
      reasons[c.id] = 'בחירת המערכת';
    }
    return { courses: fallback, reasons, isPersonal: false };
  }

  const categoryIds = new Set(interests.map((i) => INTEREST_TO_CATEGORY[i]).filter(Boolean));
  const matched = courses.filter(
    (c) =>
      categoryIds.has(c.categoryId) ||
      c.tags.some((t) => interests.some((i) => t.includes(i) || i.includes(t)))
  );

  const unique = [...new Map(matched.map((c) => [c.id, c])).values()];
  const seedTitle = recentTitles[0];

  let list: Course[];
  let isPersonal = unique.length > 0 || recentTitles.length > 0;

  if (unique.length >= 4) {
    list = unique.slice(0, 8);
  } else {
    const popular = courses.filter((c) => c.isPopular && !unique.find((u) => u.id === c.id));
    list = [...unique, ...popular].slice(0, 8);
  }

  for (const c of list) {
    if (seedTitle) {
      reasons[c.id] = `כי צפית ב${seedTitle}`;
    } else if (interests.length > 0) {
      reasons[c.id] = 'בחירת המערכת';
      isPersonal = unique.some((u) => u.id === c.id);
      if (isPersonal && categoryIds.has(c.categoryId)) {
        reasons[c.id] = 'מומלץ לפי תחומי העניין שלכם';
      }
    } else {
      reasons[c.id] = 'בחירת המערכת';
    }
  }

  if (!unique.length && !recentTitles.length) {
    isPersonal = false;
  }

  return { courses: list, reasons, isPersonal };
}

export function getTrialDaysRemaining(trialEndsAt?: string): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function formatTrialEndDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

export function coursesInCategory(courses: Course[], categoryId: string) {
  if (categoryId === 'cat-shorts') return courses.filter((c) => c.isShort);
  return courses.filter((c) => c.categoryId === categoryId);
}
