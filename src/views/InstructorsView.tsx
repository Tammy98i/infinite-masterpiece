import React from 'react';
import { useApp } from '../context/AppContext';

export const InstructorsView: React.FC = () => {
  const { instructors, courses, setView } = useApp();

  return (
    <div className="library-catalog-page min-h-screen text-white pt-28 pb-24 px-4 sm:px-8 max-w-5xl mx-auto text-right">
      <h1 className="text-3xl sm:text-4xl font-semibold mb-3">מרצים</h1>
      <p className="text-sm text-white/45 font-light mb-12">בחרו מרצה כדי לראות את ההרצאות שלו בספרייה.</p>

      <div className="library-page-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {instructors.map((inst) => {
          const count = courses.filter((c) => c.instructorId === inst.id).length;
          return (
            <button
              key={inst.id}
              type="button"
              onClick={() => setView('instructor', { instructorId: inst.id })}
              aria-label={`${inst.name}, ${inst.title}, ${count === 0 ? 'אין הרצאות' : count === 1 ? 'הרצאה אחת' : `${count} הרצאות`}`}
              className="library-poster text-right min-h-11 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
            >
              <div className="relative aspect-video overflow-hidden rounded-[4px] bg-zinc-900">
                <img
                  src={inst.avatarUrl}
                  alt=""
                  aria-hidden
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 right-2 left-2">
                  <div className="text-[13px] font-semibold text-white truncate">{inst.name}</div>
                  <div className="text-[12px] text-white/70 truncate">
                    {inst.isFounder ? 'צוות המיזם · ' : ''}
                    {inst.title}
                  </div>
                </div>
              </div>
              <div className="sr-only">
                {count === 0 ? 'אין הרצאות עדיין' : count === 1 ? 'הרצאה אחת' : `${count} הרצאות`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
