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
    })
    .slice(0, 6);

  if (list.length === 0) return null;

  return (
    <section className="py-6 select-none scroll-mt-24" aria-labelledby="lecturers-heading">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-8 mb-4">
        <h2 id="lecturers-heading" className="text-base sm:text-lg font-semibold text-white tracking-tight">
          המרצים שלנו
        </h2>
        <button
          type="button"
          onClick={() => setView('instructors')}
          className="text-sm text-white/55 hover:text-white transition-colors min-h-11 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] rounded"
        >
          לכל המרצים
        </button>
      </div>

      <div
        className={`px-4 sm:px-8 ${
          list.length <= 2
            ? 'grid grid-cols-2 gap-4 max-w-xl'
            : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
        }`}
      >
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
            className="text-right group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] rounded-xl min-h-11"
          >
            <div className="aspect-square overflow-hidden rounded-xl border border-white/10 mb-3">
              <img
                src={inst.avatarUrl}
                alt=""
                aria-hidden
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </div>
            <div className="text-[15px] font-medium text-white truncate">{inst.name}</div>
            <div className="text-[13px] text-[#C8A24C]/90 mt-0.5 truncate">{inst.title}</div>
            <div className="text-[13px] text-white/45 mt-1">
              {count === 0 ? 'אין הרצאות עדיין' : count === 1 ? 'הרצאה אחת' : `${count} הרצאות`}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
