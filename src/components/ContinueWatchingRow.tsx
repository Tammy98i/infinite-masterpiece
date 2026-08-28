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
      className="py-8 select-none scroll-mt-24"
      data-onboarding="continue-watching"
      aria-label="המשך צפייה — רשימת הרצאות"
    >
      <div className="flex items-center gap-3 px-4 sm:px-8 mb-5">
        <h2 className="text-lg sm:text-xl font-semibold text-white">המשך צפייה</h2>
        <button
          type="button"
          onClick={() => setView('history')}
          className="text-sm text-white/55 hover:text-white transition-colors min-h-11 px-1"
        >
          לכל היסטוריית הצפייה
        </button>
      </div>

      <div className="relative group/row">
        <button
          type="button"
          onClick={() => scroll('prev')}
          className="rail-control absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/85 text-white border border-white/15 hidden sm:flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C]"
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
              e.preventDefault();
              scroll('next');
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              scroll('prev');
            }
          }}
          className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-8 pb-2 scroll-smooth snap-x snap-mandatory carousel-scroll focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] focus-visible:ring-inset"
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
          className="rail-control absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/85 text-white border border-white/15 hidden sm:flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C]"
          aria-label="הצגת פריטים נוספים"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden />
        </button>
      </div>
    </section>
  );
};
