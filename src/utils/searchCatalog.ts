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
    // Direction controls are formatting, not word separators. Never use this value for display.
    .replace(/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/(?<=\p{L})["'׳״‘’“”](?=\p{L})/gu, '')
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

function containsPhrase(field: string, phrase: string, allowHebrewPrefix = false): boolean {
  if ((` ${field} `).includes(` ${phrase} `)) return true;
  if (!allowHebrewPrefix) return false;
  const words = field.split(' ');
  const terms = phrase.split(' ');
  // Hebrew prepositions/articles attach to words (לחץ → ולחץ); never strip arbitrary substrings.
  return words.some((_, start) => terms.every((term, offset) => {
    const word = words[start + offset];
    if (word === term) return true;
    if (!word || !/^[א-ת]{3,}$/.test(term) || !word.endsWith(term)) return false;
    return /^(?:ו?[בכלמהש]|ו)$/.test(word.slice(0, -term.length));
  }));
}

function matchScore(fields: string[], units: string[][], query: string): number {
  if (!query || !units.length) return Infinity;
  const normalized = fields.map(normalizeSearch);
  const direct = normalized.findIndex(field => containsPhrase(field, query));
  // All literal phrases beat expanded matches; field order favors the title.
  if (direct >= 0) return direct / normalized.length;
  const words = normalized.join(' ').split(' ');
  let tier = 1;
  let cost = 0;
  for (const alternatives of units) {
    if (normalized.some(field => containsPhrase(field, alternatives[0], true))) cost += 1;
    else if (alternatives.slice(1).some(term => normalized.some(field => containsPhrase(field, term, true)))) {
      tier = Math.max(tier, 2);
      cost += 3;
    } else if (alternatives.some(term => !term.includes(' ') && words.some(word => isTypo(term, word)))) {
      tier = 3;
      cost += 5;
    } else return Infinity;
  }
  // A long literal query must not rank below a short fuzzy query.
  return tier * 10 + cost / units.length;
}

function rankCourses(courses: Course[], instructors: Instructor[], categories: Category[], query: string) {
  const units = queryUnits(query);
  const instructorById = new Map(instructors.map(item => [item.id, item]));
  const categoryById = new Map(categories.map(item => [item.id, item]));
  return courses.map(course => {
    const instructor = instructorById.get(course.instructorId);
    const category = categoryById.get(course.categoryId);
    const score = matchScore([
      course.title, course.subtitle, ...course.tags, instructor?.name || '',
      category?.name || '', instructor?.title || '', course.description,
      ...course.whatYouWillLearn,
    ], units, query);
    return { course, score };
  }).filter(item => Number.isFinite(item.score)).sort((a, b) => a.score - b.score);
}

export function searchCourses(
  courses: Course[],
  instructors: Instructor[],
  categories: Category[],
  query: string
): Course[] {
  const q = normalizeSearch(query);
  if (!q) return [];
  return rankCourses(courses, instructors, categories, q).map(item => item.course);
}

/** Useful alternate queries, never invented titles or dead-end suggestions. */
export function searchRecoveryQueries(courses: Course[], instructors: Instructor[], categories: Category[], query: string): string[] {
  const q = normalizeSearch(query);
  if (!q) return [];
  const candidates = new Map<string, string>();
  for (const label of [
    ...categories.filter(category => courses.some(course => course.categoryId === category.id)).map(category => category.name),
    ...courses.flatMap(course => course.tags),
  ]) {
    const key = normalizeSearch(label);
    if (key && key !== q && !candidates.has(key)) candidates.set(key, label);
  }
  const units = queryUnits(q);
  return [...candidates.values()].map(label => {
    const scores = units.map(unit => matchScore([label], [unit], unit[0])).filter(Number.isFinite);
    return { label, matches: scores.length, score: scores.length ? Math.min(...scores) : Infinity };
  })
    // Related labels first; unrelated catalog topics remain a useful fallback.
    .sort((a, b) => b.matches - a.matches || a.score - b.score)
    .filter(item => searchCourses(courses, instructors, categories, item.label).length > 0)
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

  const out: Array<{ type: 'course' | 'instructor' | 'topic'; id: string; label: string; meta?: string; score: number }> = [];

  for (const cat of categories) {
    if (['cat-shorts', 'cat-paths'].includes(cat.id)) continue;
    const score = matchScore([cat.name], units, q);
    if (courses.some(course => course.categoryId === cat.id) && Number.isFinite(score)) {
      out.push({ type: 'topic', id: cat.id, label: cat.name, meta: 'נושא', score });
    }
  }

  for (const inst of instructors) {
    const score = matchScore([inst.name, inst.title], units, q);
    if (courses.some(course => course.instructorId === inst.id) && Number.isFinite(score)) {
      out.push({ type: 'instructor', id: inst.id, label: inst.name, meta: inst.title, score });
    }
  }

  for (const { course, score } of rankCourses(courses, instructors, categories, q)) {
    out.push({
      type: 'course',
      id: course.id,
      label: course.title,
      meta: instructors.find(item => item.id === course.instructorId)?.name,
      score,
    });
  }

  return out.sort((a, b) => a.score - b.score).slice(0, limit).map(({ score, ...item }) => item);
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
