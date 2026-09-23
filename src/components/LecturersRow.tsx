import React from 'react';
import { useApp } from '../context/AppContext';
import { trackEvent } from '../utils/analytics';

export const LecturersRow: React.FC = () => {
  const { instructors, courses, setView } = useApp();

  const list = [...instructors]
    .map((inst) => ({
      inst,
      count: courses.filter((c) => c.instructorId === inst.id).length,
    }))
    .filter((row) => row.count > 0 || row.inst.isFounder)
    .sort((a, b) => {
      if (a.inst.isFounder && !b.inst.isFounder) return -1;
      if (!a.inst.isFounder && b.inst.isFounder) return 1;
      return (a.inst.sortOrder || 0) - (b.inst.sortOrder || 0) || b.count - a.count;
    });

  if (list.length === 0) return null;

  return (
    <section className="library-spacious-section library-island py-3 select-none scroll-mt-24" aria-labelledby="lecturers-heading">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-8 mb-1">
        <h2 id="lecturers-heading" className="library-rail-title text-white tracking-tight">
          המרצים שלנו
        </h2>
        <button
          type="button"
          onClick={() => setView('instructors')}
          className="text-sm text-white/55 hover:text-white transition-colors min-h-11 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043] rounded"
        >
          לכל המרצים
        </button>
      </div>

      <div className="library-rail-scroller flex overflow-x-auto px-4 sm:px-8">
        {list.map(({ inst, count }) => (
          <button
            key={inst.id}
            type="button"
            onClick={() => {
              trackEvent('content_card_click', {
                content_id: inst.id,
                section_name: 'lecturers',
              });
              setView('instructor', { instructorId: inst.id });
            }}
            aria-label={`${inst.name}, ${inst.title}`}
            className="w-[132px] sm:w-[156px] shrink-0 text-right group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043] rounded min-h-11"
          >
            <div className="library-instructor-frame relative overflow-hidden rounded-[4px] mb-2">
              {inst.avatarUrl ? (
                <img
                  src={inst.avatarUrl}
                  alt=""
                  aria-hidden
                  className="group-hover:brightness-110 transition-[filter] duration-200 motion-reduce:transition-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-[#b79043] text-2xl font-semibold" aria-hidden>
                  {inst.name.trim().charAt(0) || 'מ'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/25 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
            </div>
            <div className="text-[13px] font-medium text-white truncate">{inst.name}</div>
            <div className="text-[12px] text-white/55 mt-0.5 truncate">{inst.title}</div>
            <div className="sr-only">
              {count === 0 ? 'אין הרצאות עדיין' : count === 1 ? 'הרצאה אחת' : `${count} הרצאות`}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
