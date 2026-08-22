import type { Course, Instructor, Category } from '../types';
import { getCardAccessState, isCourseNew, isTenMinuteCourse } from './libraryHome';
import type { UserProfile } from '../types';

export function searchCourses(
  courses: Course[],
  instructors: Instructor[],
  categories: Category[],
  query: string
): Course[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  return courses.filter((c) => {
    const instructor = instructors.find((i) => i.id === c.instructorId);
    const category = categories.find((cat) => cat.id === c.categoryId);
    return (
      c.title.toLowerCase().includes(q) ||
      c.subtitle.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q)) ||
      (instructor?.name.toLowerCase().includes(q) ?? false) ||
      (instructor?.title.toLowerCase().includes(q) ?? false) ||
      (category?.name.toLowerCase().includes(q) ?? false)
    );
  });
}

export function searchSuggestions(
  courses: Course[],
  instructors: Instructor[],
  categories: Category[],
  query: string,
  limit = 6
): Array<{ type: 'course' | 'instructor' | 'topic'; id: string; label: string; meta?: string }> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const out: Array<{ type: 'course' | 'instructor' | 'topic'; id: string; label: string; meta?: string }> = [];

  for (const cat of categories) {
    if (['cat-shorts', 'cat-paths'].includes(cat.id)) continue;
    if (cat.name.toLowerCase().includes(q)) {
      out.push({ type: 'topic', id: cat.id, label: cat.name, meta: 'נושא' });
    }
    if (out.length >= limit) return out;
  }

  for (const inst of instructors) {
    if (inst.name.toLowerCase().includes(q) || inst.title.toLowerCase().includes(q)) {
      out.push({ type: 'instructor', id: inst.id, label: inst.name, meta: inst.title });
    }
    if (out.length >= limit) return out;
  }

  for (const c of searchCourses(courses, instructors, categories, q)) {
    const instructor = instructors.find((i) => i.id === c.instructorId);
    out.push({
      type: 'course',
      id: c.id,
      label: c.title,
      meta: instructor?.name,
    });
    if (out.length >= limit) break;
  }

  return out;
}

export type CatalogFilter = 'all' | 'open' | 'short' | 'new';

export function filterCatalogCourses(
  courses: Course[],
  user: Pick<UserProfile, 'role' | 'subscriptionPlan' | 'entryTrack' | 'currentPaymentPhase'>,
  filter: CatalogFilter,
  instructorId: string | 'all' = 'all'
) {
  let list = [...courses];
  if (filter === 'open') {
    list = list.filter((c) => getCardAccessState(c, user) === 'open');
  } else if (filter === 'short') {
    list = list.filter(isTenMinuteCourse);
  } else if (filter === 'new') {
    list = list.filter((c) => isCourseNew(c) || c.isNew);
  }
  if (instructorId !== 'all') {
    list = list.filter((c) => c.instructorId === instructorId);
  }
  return list;
}
