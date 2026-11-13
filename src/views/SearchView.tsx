import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search } from 'lucide-react';
import { searchCourses, searchRecoveryQueries } from '../utils/searchCatalog';
import { SearchRecovery } from '../components/SearchRecovery';
import { LIBRARY_TOPIC_IDS, getCardAccessState } from '../utils/libraryHome';
import { formatClock } from '../utils/time';
import { trackEvent } from '../utils/analytics';
import { EmptyState } from '../components/LibraryStates';
import { EMPTY_FILTERS, SearchFilters, type SearchFilterState } from '../components/SearchFilters';
import { CourseCard } from '../components/CourseCard';

const ACCESS_LABEL = {
  open: 'פתוח',
  preview: 'טעימה',
  locked: 'דורש מנוי',
} as const;

export const SearchView: React.FC = () => {
  const { searchQuery, setSearchQuery, courses, instructors, categories, user, setView } = useApp();
  const [filters, setFilters] = useState<SearchFilterState>(EMPTY_FILTERS);
  const query = searchQuery.trim();
  const queryLower = query.toLowerCase();

  const baseResults = useMemo(
    () => (queryLower.length >= 1 ? searchCourses(courses, instructors, categories, queryLower) : []),
    [courses, instructors, categories, queryLower]
  );

  const results = useMemo(() => {
    const duration = (course: (typeof courses)[number]) => course.episodes.reduce((sum, episode) => sum + episode.duration, 0);
    const filtered = baseResults.filter(course => {
      const seconds = duration(course);
      const durationMatch = filters.duration === 'all' || (filters.duration === 'short' && seconds <= 900) || (filters.duration === 'medium' && seconds > 900 && seconds <= 2700) || (filters.duration === 'long' && seconds > 2700);
      return durationMatch && (filters.level === 'all' || course.level === filters.level) && (filters.access === 'all' || getCardAccessState(course, user) === filters.access);
    });
    if (filters.sort === 'newest') return [...filtered].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    if (filters.sort === 'shortest') return [...filtered].sort((a, b) => duration(a) - duration(b));
    return filtered;
  }, [baseResults, filters, user, courses]);
  const activeFilterCount = [filters.duration, filters.level, filters.access].filter(value => value !== 'all').length;

  const recoveryQueries = useMemo(
    () => (query && baseResults.length === 0 ? searchRecoveryQueries(courses, instructors, categories, query) : []),
    [courses, instructors, categories, query, baseResults.length]
  );

  const popularTopics = categories.filter((c) =>
    (LIBRARY_TOPIC_IDS as readonly string[]).includes(c.id)
  );

  return (
    <div className="library-catalog-page min-h-screen text-white pt-28 pb-28 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-heading font-semibold mb-6 text-white">חיפוש בספרייה</h1>

        <label htmlFor="library-page-search" className="block text-start text-sm text-white/70 mb-2">מה מעניין אתכם ללמוד?</label>
        <div className="relative flex items-center justify-center">
          <input
            id="library-page-search"
            type="search"
            dir="auto"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                trackEvent('search_submit', { query: searchQuery.trim() });
              }
            }}
            placeholder="שם הרצאה, מרצה או נושא"
            className="library-search-field w-full border py-4 px-12 text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#b79043]/40 min-h-11"
            autoFocus
            aria-label="חיפוש בספרייה"
            enterKeyHint="search"
            aria-describedby="library-search-help"
          />
          <Search className="w-5 h-5 text-[#b79043] absolute start-4 pointer-events-none" data-icon="search" />
        </div>
        <p id="library-search-help" className="mt-3 text-sm text-[#bdc8d9] text-start">החיפוש כולל גם מילים נרדפות ושגיאות כתיב קלות, ומציג התאמות מדויקות תחילה.</p>
      </div>

      {query ? (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-start border-b border-white/10 pb-3 flex items-center justify-between gap-3">
            <span className="min-w-0 break-words">תוצאות עבור <bdi dir="auto">{query}</bdi></span>
            <span className="shrink-0 text-sm font-medium text-[#dfc47d]" role="status" aria-live="polite" aria-atomic="true">{results.length === baseResults.length ? results.length : `${results.length} מתוך ${baseResults.length}`} תוצאות</span>
          </h2>
          <SearchFilters value={filters} onChange={setFilters} activeCount={activeFilterCount} />

          {results.length > 0 ? (
            <ul className="library-page-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" role="list">
              {results.map((course, index) => {
                const instructor = instructors.find((i) => i.id === course.instructorId);
                const duration = course.episodes.reduce((s, ep) => s + ep.duration, 0);
                const access = getCardAccessState(course, user);
                return (
                  <li key={course.id} className="min-w-0">
                    <CourseCard
                      course={course}
                      fullWidth
                      sectionName="search"
                      position={index}
                    />
                    <p className="sr-only">
                      {instructor?.name || 'מרצה'} · {formatClock(duration)} · {ACCESS_LABEL[access]}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              eyebrow="חיפוש"
              title="לא מצאנו הרצאה שמתאימה לחיפוש"
              body={activeFilterCount > 0 ? 'אין תוצאות שמתאימות למסננים שבחרתם. אפשר לנקות מסנן אחד או יותר.' : 'אפשר לנסות שם מרצה, נושא, או לבחור אחד מהנושאים הפופולריים.'}
              actionLabel={activeFilterCount > 0 ? 'ניקוי מסננים' : 'ניקוי החיפוש'}
              onAction={activeFilterCount > 0 ? () => setFilters(EMPTY_FILTERS) : () => { setSearchQuery(''); document.getElementById('library-page-search')?.focus(); }}
            />
          )}

          {baseResults.length === 0 && <SearchRecovery queries={recoveryQueries} onSelect={value => {
            setFilters(EMPTY_FILTERS);
            setSearchQuery(value);
          }} />}

          <div className="mt-10 text-center">
            <p className="text-sm text-white/45 mb-4">נושאים פופולריים</p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setView('category', { categoryId: topic.id })}
                  className="px-4 py-2 rounded-full border border-white/15 text-sm text-white/70 hover:border-[#b79043] hover:text-[#dfc47d] min-h-11 cursor-pointer"
                >
                  <bdi dir="auto">{topic.name}</bdi>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-white/45 mb-4">נושאים פופולריים</p>
          <div className="flex flex-wrap justify-center gap-2">
            {popularTopics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => setView('category', { categoryId: topic.id })}
                className="px-4 py-2 rounded-full border border-white/15 text-sm text-white/70 hover:border-[#b79043] hover:text-[#dfc47d] min-h-11 cursor-pointer"
              >
                <bdi dir="auto">{topic.name}</bdi>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
