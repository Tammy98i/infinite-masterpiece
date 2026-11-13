import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSES, INSTRUCTORS, CATEGORIES } from '../data/initialData.ts';
import { normalizeSearch, searchCourses, searchSuggestions, searchRecoveryQueries, filterCatalogCourses } from './searchCatalog.ts';
import { getCardAccessState } from './libraryHome.ts';

const search = (query: string) => searchCourses(COURSES, INSTRUCTORS, CATEGORIES, query);
const crisis = COURSES.find(course => course.id === 'course-crisis-growth')!;

test('normalizes Hebrew marks, quotes, punctuation, casing and whitespace', () => {
  assert.equal(normalizeSearch('  מַשְׁבֵּר־זהות  AI '), 'משבר זהות ai');
  assert.equal(normalizeSearch('ד״ר'), 'דר');
  assert.deepEqual(search('  '), []);
  assert.deepEqual(search('?!'), []);
});

test('exact title ranks first and all query words are required', () => {
  assert.equal(search(crisis.title)[0].id, crisis.id);
  assert.ok(search('משברים מיכל').some(course => course.id === crisis.id));
  assert.deepEqual(search('משברים זזזזזזזזז'), []);
});

test('handles substitution, omission, extra letter and swapped letters', () => {
  for (const query of ['משברימ', 'משברי', 'משבריים', 'משבירם']) {
    assert.ok(search(query).some(course => course.id === crisis.id), query);
  }
  assert.deepEqual(search('זזזזזזזזז'), []);
  assert.deepEqual(search('zz'), []);
});

test('synonyms resolve to real courses and work within multiword queries', () => {
  assert.ok(search('קשיבות').length > 0);
  assert.deepEqual(search('mindfulness').map(course => course.id), search('קשיבות').map(course => course.id));
  assert.ok(search('סטרס').some(course => course.id === crisis.id));
  assert.ok(search('סטרס מיכל').some(course => course.id === crisis.id));
});

test('existing instructor, category, tag and learning-outcome search remains supported', () => {
  for (const query of [INSTRUCTORS[0].name, crisis.tags[0], crisis.whatYouWillLearn[0]]) {
    assert.ok(search(query).some(course => course.id === crisis.id));
  }
  const category = CATEGORIES.find(item => item.id === crisis.categoryId)!;
  assert.ok(search(category.name).some(course => course.id === crisis.id));
});

test('navbar suggestions tolerate typos and obey the limit', () => {
  const suggestions = searchSuggestions(COURSES, INSTRUCTORS, CATEGORIES, 'משברימ', 3);
  assert.ok(suggestions.some(item => item.id === crisis.id));
  assert.ok(suggestions.length <= 3);
  assert.deepEqual(searchSuggestions(COURSES, INSTRUCTORS, CATEGORIES, 'משברים', 0), []);
});

test('empty-state suggestions come only from the supplied catalog and yield results', () => {
  const queries = searchRecoveryQueries(COURSES, INSTRUCTORS, CATEGORIES, 'זזזזזזזזז');
  const labels = [...CATEGORIES.map(item => item.name), ...COURSES.flatMap(item => item.tags)];
  assert.ok(queries.length > 0 && queries.length <= 5);
  for (const query of queries) {
    assert.ok(labels.includes(query));
    assert.ok(search(query).length > 0);
  }
  assert.deepEqual(searchRecoveryQueries([], [], [], 'משהו'), []);
});

test('access filters still apply to expanded search results without modifying courses', () => {
  const user = { role: 'student' as const, subscriptionPlan: 'none' as const };
  const results = search('משברימ');
  const filtered = filterCatalogCourses(results, user, 'open');
  assert.ok(filtered.every(course => getCardAccessState(course, user) === 'open'));
  assert.equal(results.find(course => course.id === crisis.id), crisis);
});
