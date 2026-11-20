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
      <div className="soundstage-section-header mx-auto flex max-w-[1400px] items-baseline justify-between gap-3 px-4 sm:px-8 lg:px-10 mb-3 pb-3 border-b border-[#D99B43]/20">
        <h2 id="lecturers-heading" className="library-rail-title text-[#F2EFEB] tracking-tight">
          המרצים שלנו
        </h2>
        <button
          type="button"
          onClick={() => setView('instructors')}
          className="text-sm text-[#D99B43] hover:text-[#f0b45f] font-medium transition-colors min-h-11 px-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D99B43] rounded"
        >
          לכל המרצים
        </button>
      </div>

      <div className="library-rail-scroller mx-auto max-w-[1400px] flex overflow-x-auto px-4 sm:px-8 lg:px-10">
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
            className="soundstage-lecturer-badge w-[136px] sm:w-[152px] shrink-0 text-center flex flex-col items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D99B43] rounded min-h-11"
          >
            <div className="soundstage-lecturer-ring relative w-[112px] h-[112px] sm:w-[126px] sm:h-[126px] rounded-full overflow-hidden mb-3">
              {inst.avatarUrl ? (
                <img
                  src={inst.avatarUrl}
                  alt=""
                  aria-hidden
                  className="w-full h-full object-cover group-hover:brightness-110 transition-[filter,transform] duration-200 group-hover:scale-105 motion-reduce:transition-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#14110c] text-[#D99B43] text-2xl font-bold" aria-hidden>
                  {inst.name.trim().charAt(0) || 'מ'}
                </div>
              )}
            </div>
            <div className="text-[14px] font-bold text-[#F2EFEB] truncate w-full">{inst.name}</div>
            <div className="text-[12px] text-[#b5a892] mt-0.5 truncate w-full">{inst.title}</div>
            <div className="sr-only">
              {count === 0 ? 'אין הרצאות עדיין' : count === 1 ? 'הרצאה אחת' : `${count} הרצאות`}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
