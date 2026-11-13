import type { Course, Instructor, Category } from '../types';
import { getCardAccessState, isCourseNew, isTenMinuteCourse } from './libraryHome';
import type { UserProfile } from '../types';

// Linguistic equivalents only: results and suggestions always come from the supplied catalog.
const SYNONYMS = [
  ['מיינדפולנס', 'קשיבות', 'mindfulness'],
  ['לחץ', 'סטרס', 'stress'],
  ['זוגיות', 'יחסים זוגיים'],
  ['תקשורת', 'קומוניקציה'],
  ['כסף', 'פיננסים'],
  ['תזונה', 'תזונה נכונה'],
  ['בינה מלאכותית', 'ai'],
  ['ניהול זמן', 'ניהול זמנים'],
];

export function normalizeSearch(text: string): string {
  return text.normalize('NFKD').toLowerCase()
    .replace(/[\u0591-\u05bd\u05bf\u05c1-\u05c2\u05c4-\u05c5\u05c7\u0300-\u036f]/g, '')
    .replace(/["'׳״]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

// One edit (including adjacent swapped letters). Short words are never fuzzy-matched.
function isTypo(a: string, b: string): boolean {
  if (a.length < 4 || b.length < 4 || a.length > 48 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  if (a.length === b.length) {
    return a.slice(i + 1) === b.slice(i + 1) ||
      (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  }
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

function queryUnits(query: string): string[][] {
  const words = normalizeSearch(query).split(' ').filter(Boolean);
  const units: string[][] = [];
  for (let i = 0; i < words.length; i++) {
    const pair = `${words[i]} ${words[i + 1] || ''}`;
    const phraseGroup = SYNONYMS.find(group => group.includes(pair));
    const group = phraseGroup || SYNONYMS.find(group => group.includes(words[i]));
    units.push(group ? [phraseGroup ? pair : words[i], ...group.filter(term => term !== (phraseGroup ? pair : words[i]))] : [words[i]]);
    if (phraseGroup) i++;
  }
  return units;
}

function matchScore(fields: string[], units: string[][], query: string): number {
  const normalized = fields.map(normalizeSearch);
  const direct = normalized.findIndex(field => field.includes(query));
  if (direct >= 0) return direct / normalized.length; // Exact phrases, especially titles, rank first.
  const words = normalized.join(' ').split(' ');
  let score = 20;
  for (const alternatives of units) {
    if (normalized.some(field => field.includes(alternatives[0]))) score += 1;
    else if (alternatives.slice(1).some(term => normalized.some(field => field.includes(term)))) score += 3;
    else if (alternatives.some(term => !term.includes(' ') && words.some(word => isTypo(term, word)))) score += 5;
    else return Infinity;
  }
  return score;
}

export function searchCourses(
  courses: Course[],
  instructors: Instructor[],
  categories: Category[],
  query: string
): Course[] {
  const q = normalizeSearch(query);
  if (!q) return [];
  const units = queryUnits(q);
  const instructorById = new Map(instructors.map(item => [item.id, item]));
  const categoryById = new Map(categories.map(item => [item.id, item]));
  return courses.map(course => {
    const instructor = instructorById.get(course.instructorId);
    const category = categoryById.get(course.categoryId);
    const score = matchScore([
      course.title, course.subtitle, ...course.tags, instructor?.name || '',
      category?.name || '', instructor?.title || '', course.description,
      ...course.whatYouWillLearn,
    ], units, q);
    return { course, score };
  }).filter(item => Number.isFinite(item.score))
    .sort((a, b) => a.score - b.score).map(item => item.course);
}

/** Useful alternate queries, never invented titles or dead-end suggestions. */
export function searchRecoveryQueries(courses: Course[], instructors: Instructor[], categories: Category[], query: string): string[] {
  const candidates = [...new Set([
    ...categories.filter(category => courses.some(course => course.categoryId === category.id)).map(category => category.name),
    ...courses.flatMap(course => course.tags),
  ])];
  const units = queryUnits(query);
  return candidates.map(label => ({ label, score: Math.min(...units.map(unit => matchScore([label], [unit], unit[0]))) }))
    .sort((a, b) => a.score - b.score)
    .filter(item => normalizeSearch(item.label) !== normalizeSearch(query) && searchCourses(courses, instructors, categories, item.label).length > 0)
    .slice(0, 5).map(item => item.label);
}

export function searchSuggestions(
  courses: Course[],
  instructors: Instructor[],
  categories: Category[],
  query: string,
  limit = 6
): Array<{ type: 'course' | 'instructor' | 'topic'; id: string; label: string; meta?: string }> {
  const q = normalizeSearch(query);
  if (!q || limit <= 0) return [];
  const units = queryUnits(q);

  const out: Array<{ type: 'course' | 'instructor' | 'topic'; id: string; label: string; meta?: string }> = [];

  for (const cat of categories) {
    if (['cat-shorts', 'cat-paths'].includes(cat.id)) continue;
    if (courses.some(course => course.categoryId === cat.id) && Number.isFinite(matchScore([cat.name], units, q))) {
      out.push({ type: 'topic', id: cat.id, label: cat.name, meta: 'נושא' });
    }
    if (out.length >= limit) return out;
  }

  for (const inst of instructors) {
    if (Number.isFinite(matchScore([inst.name, inst.title], units, q))) {
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
