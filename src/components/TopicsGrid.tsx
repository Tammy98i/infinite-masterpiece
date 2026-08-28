import React from 'react';
import { Play } from 'lucide-react';
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
      className="py-8 select-none scroll-mt-24"
      aria-labelledby="topics-heading"
    >
      <div className="px-4 sm:px-8 mb-4">
        <h2 id="topics-heading" className="text-base sm:text-lg font-semibold text-white tracking-tight">
          עיון לפי נושא
        </h2>
      </div>

      <div className="px-4 sm:px-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
        {topics.map(({ category, count, cover }) => (
          <button
            key={category.id}
            type="button"
            onClick={() => {
              trackEvent('topic_open', { content_id: category.id, section_name: 'topics' });
              setView('category', { categoryId: category.id });
            }}
            aria-label={`פתיחת נושא ${category.name}, ${count} הרצאות`}
            className="group relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] min-h-11"
          >
            {cover ? (
              <img
                src={cover}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover brightness-[0.55] group-hover:brightness-[0.65] group-hover:scale-105 transition-[filter,transform] duration-500 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            ) : (
              <div className="absolute inset-0 bg-zinc-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-end p-4 sm:p-5">
              <h3 className="text-[15px] sm:text-base font-semibold text-white leading-snug line-clamp-2">
                {category.name}
              </h3>
              <p className="text-[13px] text-white/65 mt-1">
                {count === 0 ? 'בקרוב' : count === 1 ? 'הרצאה אחת' : `${count} הרצאות`}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#C8A24C]">
                <Play className="w-3.5 h-3.5 fill-[#C8A24C]" />
                לצפייה
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
