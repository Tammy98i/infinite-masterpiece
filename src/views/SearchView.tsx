import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Search } from 'lucide-react';
import { searchCourses } from '../utils/searchCatalog';
import { LIBRARY_TOPIC_IDS, getCardAccessState } from '../utils/libraryHome';
import { formatClock } from '../utils/time';
import { trackEvent } from '../utils/analytics';

const ACCESS_LABEL = {
  open: 'פתוח',
  preview: 'טעימה',
  locked: 'דורש מסלול',
} as const;

export const SearchView: React.FC = () => {
  const { searchQuery, setSearchQuery, courses, instructors, categories, user, setView } = useApp();
  const query = searchQuery.trim();
  const queryLower = query.toLowerCase();

  const results = useMemo(
    () => (queryLower.length >= 1 ? searchCourses(courses, instructors, categories, queryLower) : []),
    [courses, instructors, categories, queryLower]
  );

  const popularTopics = categories.filter((c) =>
    (LIBRARY_TOPIC_IDS as readonly string[]).includes(c.id)
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold mb-6 text-white">חיפוש בספרייה</h1>

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
            className="w-full bg-zinc-900 border border-[#C8A24C]/50 rounded-full py-4 pr-12 pl-6 text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#C8A24C]/40"
            autoFocus
            aria-label="חיפוש בספרייה"
          />
          <Search className="w-5 h-5 text-[#C8A24C] absolute right-4 pointer-events-none" />
        </div>
      </div>

      {query ? (
        <div>
          <h2 className="text-lg font-semibold mb-6 text-right border-b border-white/10 pb-3 flex items-center justify-between gap-3">
            <span>תוצאות עבור «{query}»</span>
            <span className="text-sm font-medium text-[#C8A24C]">{results.length}</span>
          </h2>

          {results.length > 0 ? (
            <ul className="grid gap-3" role="list">
              {results.map((course) => {
                const instructor = instructors.find((i) => i.id === course.instructorId);
                const duration = course.episodes.reduce((s, ep) => s + ep.duration, 0);
                const access = getCardAccessState(course, user);
                return (
                  <li key={course.id}>
                    <button
                      type="button"
                      onClick={() => {
                        trackEvent('search_result_click', { content_id: course.id });
                        setView('course', { courseId: course.id });
                      }}
                      aria-label={course.title}
                      className="w-full flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-right hover:border-[#C8A24C]/50 transition-colors min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C]"
                    >
                      <img
                        src={course.coverImage}
                        alt=""
                        aria-hidden
                        className="w-28 sm:w-36 aspect-video object-cover rounded-lg shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-semibold text-white truncate">{course.title}</div>
                        <div className="text-[13px] text-white/55 mt-1 truncate">
                          {instructor?.name || 'מרצה'} · {formatClock(duration)} · {ACCESS_LABEL[access]}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-3xl p-10 text-center max-w-xl mx-auto border border-white/10 bg-white/[0.03]">
              <h3 className="text-lg font-semibold text-white mb-2">
                לא מצאנו הרצאה שמתאימה לחיפוש. אפשר לנסות שם מרצה או נושא.
              </h3>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {popularTopics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setView('category', { categoryId: topic.id })}
                    className="px-4 py-2 rounded-full border border-white/15 text-sm text-white/70 hover:border-[#C8A24C] hover:text-[#F7E7B5] min-h-11"
                  >
                    {topic.name}
                  </button>
                ))}
              </div>
            </div>
          )}
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
                className="px-4 py-2 rounded-full border border-white/15 text-sm text-white/70 hover:border-[#C8A24C] hover:text-[#F7E7B5] min-h-11"
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
