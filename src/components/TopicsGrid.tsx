import React from 'react';
import { useApp } from '../context/AppContext';
import { LIBRARY_TOPIC_IDS } from '../utils/libraryHome';
import { coursesInCategory } from '../utils/recommendations';
import { trackEvent } from '../utils/analytics';

export const TopicsGrid: React.FC = () => {
  const { categories, courses, setView, currentView } = useApp();
  const topicArtwork = [
    'https://media.base44.com/images/public/6aa94dfb715e7d446231f544/3f0a5d20e_generated_e815267b.jpg',
    'https://media.base44.com/images/public/6aa94dfb715e7d446231f544/4c6f01d5c_generated_7933bc55.jpg',
    'https://media.base44.com/images/public/6aa94dfb715e7d446231f544/a8e035f35_generated_5e419867.jpg',
    'https://media.base44.com/images/public/6aa94dfb715e7d446231f544/60e4cb956_generated_f27d1c4e.jpg',
  ];

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
      <div className="soundstage-section-header mx-auto flex max-w-[1400px] items-baseline justify-between px-4 sm:px-8 lg:px-10 mb-3 pb-3 border-b border-[#D99B43]/20">
        <h2 id="topics-heading" className="library-rail-title text-[#F2EFEB] tracking-tight">
          עיון לפי נושא
        </h2>
      </div>

      <div className="library-rail-scroller mx-auto max-w-[1400px] flex overflow-x-auto px-4 sm:px-8 lg:px-10">
        {topics.map(({ category, count, cover }, index) => (
          <button
            key={category.id}
            type="button"
            onClick={() => {
              trackEvent('topic_open', { content_id: category.id, section_name: 'topics' });
              setView('category', { categoryId: category.id });
            }}
            aria-label={`פתיחת נושא ${category.name}, ${count} הרצאות`}
            className="library-poster soundstage-topic-tile group relative aspect-[2.39/1] w-[220px] sm:w-[280px] shrink-0 overflow-hidden rounded-[4px] text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D99B43] min-h-11"
          >
            {cover || currentView === 'home' ? (
              <img
                src={cover || topicArtwork[index % topicArtwork.length]}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover brightness-[0.58] saturate-[0.82] group-hover:brightness-75 transition-[filter] duration-200 motion-reduce:transition-none"
              />
            ) : (
              <div className="absolute inset-0 bg-[#14110c]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D11]/95 via-[#0B0D11]/35 to-transparent" />
            <div className="relative z-10 h-full flex items-end justify-between gap-2 p-3 text-start">
              <h3 className="text-[15px] font-extrabold text-[#F2EFEB] leading-snug line-clamp-1">
                {category.name}
              </h3>
              <p className="library-topic-count font-mono shrink-0" aria-hidden>
                {count === 0 ? 'בקרוב' : count === 1 ? 'הרצאה אחת' : `${count} הרצאות`}
              </p>
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
