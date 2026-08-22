import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Course } from '../types';
import { CourseCard } from './CourseCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { trackEvent } from '../utils/analytics';

interface CategoryRowProps {
  id?: string;
  title: string;
  courses: Course[];
  ranked?: boolean;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  sectionName?: string;
  reasons?: Record<string, string>;
  showDurationBadge?: boolean;
  showNewBadge?: boolean;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({
  id,
  title,
  courses,
  ranked = false,
  onSeeAll,
  seeAllLabel = 'הצג הכל',
  sectionName,
  reasons,
  showDurationBadge = false,
  showNewBadge = false,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const railName = sectionName || id || title;

  const updateArrows = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 8) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    // RTL: scrollLeft may be negative in some browsers
    const left = Math.abs(el.scrollLeft);
    setCanPrev(left > 8);
    setCanNext(left < max - 8);
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [courses, updateArrows]);

  if (courses.length === 0) return null;

  const scroll = (dir: 'prev' | 'next') => {
    const el = rowRef.current;
    if (!el) return;
    const delta = dir === 'next' ? -340 : 340;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    trackEvent(dir === 'next' ? 'carousel_next_click' : 'carousel_previous_click', {
      section_name: railName,
    });
  };

  return (
    <section
      id={id}
      className="py-3 select-none relative group/row scroll-mt-24"
      aria-label={`${title} — רשימת הרצאות`}
    >
      <div className="flex items-center gap-3 px-4 sm:px-8 mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">{title}</h2>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-sm text-white/55 hover:text-white transition-colors min-h-11 px-1"
          >
            {seeAllLabel}
          </button>
        )}
      </div>

      <div className="relative">
        {canPrev && (
          <button
            type="button"
            onClick={() => scroll('prev')}
            className="rail-control absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/85 text-white border border-white/15 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C]"
            aria-label="הצגת פריטים קודמים"
          >
            <ChevronRight className="w-5 h-5" aria-hidden />
          </button>
        )}

        <div
          ref={rowRef}
          role="region"
          aria-label={title}
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
          className={`flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-8 pb-2 pt-2 scroll-smooth snap-x snap-mandatory carousel-scroll focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] focus-visible:ring-inset ${
            ranked ? 'pt-4' : ''
          }`}
        >
          {courses.map((course, index) => (
            <div key={course.id} className="snap-start">
              <CourseCard
                course={course}
                rank={ranked ? index + 1 : undefined}
                sectionName={railName}
                position={index}
                recommendationReason={reasons?.[course.id]}
                showDurationBadge={showDurationBadge}
                showNewBadge={showNewBadge}
              />
            </div>
          ))}
        </div>

        {canNext && (
          <button
            type="button"
            onClick={() => scroll('next')}
            className="rail-control absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/85 text-white border border-white/15 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C]"
            aria-label="הצגת פריטים נוספים"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden />
          </button>
        )}
      </div>
    </section>
  );
};
