import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search } from 'lucide-react';
import { searchCourses, searchSuggestions } from '../utils/searchCatalog';
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

  const suggestions = useMemo(
    () => (queryLower.length >= 1 ? searchSuggestions(courses, instructors, categories, query, 5) : []),
    [courses, instructors, categories, query, queryLower]
  );

  const popularTopics = categories.filter((c) =>
    (LIBRARY_TOPIC_IDS as readonly string[]).includes(c.id)
  );

  const openResult = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    trackEvent('search_result_click', { content_id: course.id });
    setView('course', { courseId: course.id });
  };

  return (
    <div className="library-catalog-page min-h-screen text-white pt-28 pb-28 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-heading font-semibold mb-6 text-white">חיפוש בספרייה</h1>

        <div className="relative flex items-center justify-center">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                trackEvent('search_submit', { query: searchQuery.trim() });
              }
            }}
            placeholder="שם הרצאה, מרצה או נושא"
            className="library-search-field w-full border py-4 pr-12 pl-6 text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#b79043]/40 min-h-11"
            autoFocus
            aria-label="חיפוש בספרייה"
            enterKeyHint="search"
          />
          <Search className="w-5 h-5 text-[#b79043] absolute right-4 pointer-events-none" />
        </div>
      </div>

      {query ? (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-right border-b border-white/10 pb-3 flex items-center justify-between gap-3">
            <span>תוצאות עבור {query}</span>
            <span className="text-sm font-medium text-[#b79043]">{results.length === baseResults.length ? results.length : `${results.length} מתוך ${baseResults.length}`}</span>
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
              title="לא מצאנו הרצאה שמתאימה לחיפוש"
              body={activeFilterCount > 0 ? 'אין תוצאות שמתאימות למסננים שבחרתם. אפשר לנקות מסנן אחד או יותר.' : 'אפשר לנסות שם מרצה, נושא, או לבחור אחד מהנושאים הפופולריים.'}
              actionLabel={activeFilterCount > 0 ? 'ניקוי מסננים' : undefined}
              onAction={activeFilterCount > 0 ? () => setFilters(EMPTY_FILTERS) : undefined}
            />
          )}

          {suggestions.length > 0 && baseResults.length === 0 ? (
            <div className="mt-8 text-center">
              <p className="text-sm text-white/45 mb-4">הצעות קרובות</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => {
                      if (item.type === 'course') openResult(item.id);
                      else if (item.type === 'instructor') setView('instructor', { instructorId: item.id });
                      else setView('category', { categoryId: item.id });
                    }}
                    className="px-4 py-2 rounded-full border border-white/15 text-sm text-white/70 hover:border-[#b79043] hover:text-[#dfc47d] min-h-11 cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

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
                  {topic.name}
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
                {topic.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
