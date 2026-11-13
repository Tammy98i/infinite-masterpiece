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

// Small isolated fixtures exercise matching edge cases without changing the real catalog.
const fixture = (id: string, title: string, description = '') => ({
  ...crisis, id, title, description, subtitle: '', tags: [], whatYouWillLearn: [],
  instructorId: '', categoryId: '',
});

test('normalizes punctuation and invisible direction controls only for matching', () => {
  assert.equal(normalizeSearch('“AI” (קשיבות): café!'), 'ai קשיבות cafe');
  assert.equal(normalizeSearch('מיינד\u200fפולנס'), 'מיינדפולנס');
  assert.equal(normalizeSearch('don’t ד״ר'), 'dont דר');
  assert.deepEqual(search('(משברים)!').map(c => c.id), search('משברים').map(c => c.id));
  assert.deepEqual(searchRecoveryQueries(COURSES, INSTRUCTORS, CATEGORIES, '()?!'), []);
});

test('short words and synonym phrases require complete word boundaries', () => {
  const courses = [fixture('noise', 'Training chair repair תקשורתית'), fixture('ai', 'בינה מלאכותית'), fixture('real', 'תקשורת')];
  assert.deepEqual(searchCourses(courses, [], [], 'AI').map(c => c.id), ['ai']);
  assert.deepEqual(searchCourses(courses, [], [], 'קומוניקציה').map(c => c.id), ['real']);
  assert.deepEqual(searchCourses([fixture('noise', 'בינה מלאכותיתית')], [], [], 'AI'), []);
});

test('Hebrew attached prepositions still match without allowing arbitrary suffixes', () => {
  const courses = [fixture('prefixed', 'התמודדות ולחץ'), fixture('suffix', 'לחצים')];
  assert.deepEqual(searchCourses(courses, [], [], 'סטרס').map(c => c.id), ['prefixed']);
});

test('literal title and phrase matches rank ahead of synonyms and typos', () => {
  const courses = [fixture('typo', 'mindfulnes'), fixture('synonym', 'קשיבות'), fixture('description', 'מבוא', 'mindfulness'), fixture('title', 'Mindfulness')];
  assert.deepEqual(searchCourses(courses, [], [], 'mindfulness').map(c => c.id), ['title', 'description', 'synonym', 'typo']);
});

test('suggestions rank across types before limiting and omit instructors without courses', () => {
  const instructor = { ...INSTRUCTORS[0], id: 'empty', name: 'mindfulness', title: '' };
  const category = { ...CATEGORIES[0], id: 'topic', name: 'קשיבות' };
  const courses = [{ ...fixture('exact', 'Mindfulness'), categoryId: category.id }];
  assert.equal(searchSuggestions(courses, [instructor], [category], 'mindfulness', 1)[0]?.id, 'exact');
  assert.ok(!searchSuggestions(courses, [instructor], [category], 'mindfulness').some(s => s.id === instructor.id));
});

test('recovery ranks related labels first and deduplicates normalized queries', () => {
  const courses = [{ ...fixture('topics', 'מבוא'), tags: ['סתם', 'קשיבות', '“קשיבות”', '', '()'] }];
  assert.deepEqual(searchRecoveryQueries(courses, [], [], 'mindfulness זזזזזזזז'), ['קשיבות', 'סתם']);
});

test('access filters still apply to expanded search results without modifying courses', () => {
  const user = { role: 'student' as const, subscriptionPlan: 'none' as const };
  const results = search('משברימ');
  const filtered = filterCatalogCourses(results, user, 'open');
  assert.ok(filtered.every(course => getCardAccessState(course, user) === 'open'));
  assert.equal(results.find(course => course.id === crisis.id), crisis);
});
