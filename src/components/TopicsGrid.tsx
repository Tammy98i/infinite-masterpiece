import React from 'react';
import { useApp } from '../context/AppContext';
import { LIBRARY_TOPIC_IDS } from '../utils/libraryHome';
import { coursesInCategory } from '../utils/recommendations';
import { trackEvent } from '../utils/analytics';

export const TopicsGrid: React.FC = () => {
  const { categories, courses, setView } = useApp();

  const topics = LIBRARY_TOPIC_IDS.map((id) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return null;
    const items = coursesInCategory(courses, id);
    return { category, count: items.length, cover: category.coverImage || items[0]?.coverImage };
  }).filter(Boolean) as Array<{
    category: (typeof categories)[number];
    count: number;
    cover?: string;
  }>;

  if (topics.length === 0) return null;

  return (
    <section
      className="library-spacious-section library-island py-3 select-none scroll-mt-24"
      aria-labelledby="topics-heading"
    >
      <div className="px-4 sm:px-8 mb-1">
        <h2 id="topics-heading" className="library-rail-title text-white tracking-tight">
          עיון לפי נושא
        </h2>
      </div>

      <div className="library-rail-scroller flex overflow-x-auto px-4 sm:px-8 lg:px-10">
        {topics.map(({ category, count, cover }) => (
          <button
            key={category.id}
            type="button"
            onClick={() => {
              trackEvent('topic_open', { content_id: category.id, section_name: 'topics' });
              setView('category', { categoryId: category.id });
            }}
            aria-label={`פתיחת נושא ${category.name}, ${count} הרצאות`}
            className="library-poster group relative aspect-[16/9] w-[168px] sm:w-[210px] shrink-0 overflow-hidden rounded-[4px] text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043] min-h-11"
          >
            {cover ? (
              <img
                src={cover}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover brightness-[0.7] group-hover:brightness-90 transition-[filter] duration-200 motion-reduce:transition-none"
              />
            ) : (
              <div className="absolute inset-0 bg-zinc-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-end p-2 text-start">
              <h3 className="text-[13px] font-semibold text-white leading-snug line-clamp-2">
                {category.name}
              </h3>
              <p className="sr-only">
                {count === 0 ? 'בקרוב' : count === 1 ? 'הרצאה אחת' : `${count} הרצאות`}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
