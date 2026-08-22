import React from 'react';
import { useApp } from '../context/AppContext';

export const FoundersRow: React.FC = () => {
  const { instructors, courses, setView } = useApp();
  const founders = [...instructors]
    .filter((inst) => inst.isFounder)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (founders.length === 0) return null;

  return (
    <section id="rail-founders" className="py-3 select-none scroll-mt-24">
      <div className="flex items-center gap-2 px-4 sm:px-8 mb-3">
        <button
          type="button"
          onClick={() => setView('instructors')}
          className="text-xs text-white/45 hover:text-white min-h-11"
        >
          כל המרצים
        </button>
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-8 pb-2 scroll-smooth carousel-scroll">
        {founders.map((inst) => {
          const count = courses.filter((c) => c.instructorId === inst.id).length;
          return (
            <button
              key={inst.id}
              type="button"
              onClick={() => setView('instructor', { instructorId: inst.id })}
              aria-label={`${inst.name}, ${inst.title}, ${count === 0 ? 'אין הרצאות' : count === 1 ? 'הרצאה אחת' : `${count} הרצאות`}`}
              className="shrink-0 w-[220px] sm:w-[260px] text-right rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#C8A24C]/50 transition-colors min-h-11 cursor-pointer"
            >
              <img
                src={inst.avatarUrl}
                alt=""
                aria-hidden
                className="w-16 h-16 rounded-full object-cover border border-white/10 mb-3"
              />
              <div className="text-sm font-medium truncate">{inst.name}</div>
              <div className="text-xs text-[#C8A24C]/80 mt-1">צוות המיזם</div>
              <div className="text-xs text-white/40 mt-1 truncate">{inst.title}</div>
              <div className="text-xs text-white/30 mt-2">
                {count === 0 ? 'אין הרצאות עדיין' : count === 1 ? 'הרצאה אחת' : `${count} הרצאות`}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
