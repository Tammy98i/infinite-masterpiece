import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { CourseCard } from './CourseCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { trackEvent } from '../utils/analytics';

export const ContinueWatchingRow: React.FC = () => {
  const { getContinueWatchingList, setView } = useApp();
  const rowRef = useRef<HTMLDivElement>(null);
  const continueList = getContinueWatchingList().slice(0, 8);

  if (continueList.length === 0) return null;

  const scroll = (dir: 'prev' | 'next') => {
    rowRef.current?.scrollBy({ left: dir === 'next' ? -320 : 320, behavior: 'smooth' });
    trackEvent(dir === 'next' ? 'carousel_next_click' : 'carousel_previous_click', {
      section_name: 'continue',
    });
  };

  return (
    <section
      className="library-spacious-section library-island library-island-flush py-3 select-none scroll-mt-24"
      data-onboarding="continue-watching"
      aria-label="המשך צפייה — רשימת הרצאות"
    >
      <div className="soundstage-section-header mx-auto flex max-w-[1400px] items-baseline justify-between gap-3 px-4 sm:px-8 mb-3 pb-3 border-b border-[#D99B43]/20">
        <h2 className="library-rail-title font-heading text-[#F2EFEB]">המשך צפייה</h2>
        <button
          type="button"
          onClick={() => setView('history')}
          className="text-sm text-[#D99B43] hover:text-[#f0b45f] font-medium transition-colors min-h-11 px-1 cursor-pointer"
        >
          לכל היסטוריית הצפייה
        </button>
      </div>

      <div className="relative group/row">
        <button
          type="button"
          onClick={() => scroll('prev')}
          className="rail-control absolute start-1 sm:start-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-[4px] bg-black/85 text-white border border-white/15 hidden sm:flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
          aria-label="הצגת פריטים קודמים"
        >
          <ChevronRight className="w-5 h-5" aria-hidden />
        </button>

        <div
          ref={rowRef}
          role="region"
          aria-label="המשך צפייה"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              // Visual contract in RTL: left = toward end = next cards.
              e.preventDefault();
              scroll('next');
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              scroll('prev');
            }
          }}
          className="library-rail-scroller flex overflow-x-auto px-4 sm:px-8 scroll-smooth snap-x snap-mandatory carousel-scroll focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043] focus-visible:ring-inset"
        >
          {continueList.map(({ course, progress }, index) => {
            const progressPercentage = Math.min(
              100,
              Math.max(5, Math.round((progress.currentTime / (progress.duration || 1)) * 100))
            );
            return (
              <div key={progress.episodeId} className="snap-start">
                <CourseCard
                  course={course}
                  progress={progress}
                  customProgressPercentage={progressPercentage}
                  layout="continue"
                  sectionName="continue"
                  position={index}
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scroll('next')}
          className="rail-control absolute end-1 sm:end-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-[4px] bg-black/85 text-white border border-white/15 hidden sm:flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
          aria-label="הצגת פריטים נוספים"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden />
        </button>
      </div>

      <div className="soundstage-filmstrip mx-auto max-w-[1400px] px-4 sm:px-8 mt-3 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, idx) => (
          <i
            key={idx}
            className={`soundstage-filmstrip-cell ${idx < Math.min(continueList.length, 3) ? 'is-active' : ''}`}
          />
        ))}
      </div>
    </section>
  );
};
