import React from 'react';
import { useApp } from '../context/AppContext';

export const InstructorsView: React.FC = () => {
  const { instructors, courses, setView } = useApp();

  return (
    <div className="min-h-screen text-white pt-28 pb-24 px-4 sm:px-8 max-w-5xl mx-auto text-right">
      <h1 className="text-3xl sm:text-4xl font-semibold mb-3">מרצים</h1>
      <p className="text-sm text-white/45 font-light mb-12">בחרו מרצה כדי לראות את ההרצאות שלו בספרייה.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {instructors.map((inst) => {
          const count = courses.filter((c) => c.instructorId === inst.id).length;
          return (
            <button
              key={inst.id}
              type="button"
              onClick={() => setView('instructor', { instructorId: inst.id })}
              aria-label={`${inst.name}, ${inst.title}, ${count === 0 ? 'אין הרצאות' : count === 1 ? 'הרצאה אחת' : `${count} הרצאות`}`}
              className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] text-right hover:border-[#C8A24C]/50 transition-colors duration-200 min-h-11 cursor-pointer"
            >
              <img
                src={inst.avatarUrl}
                alt=""
                aria-hidden
                className="w-16 h-16 rounded-full object-cover border border-white/10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-medium text-white truncate">{inst.name}</div>
                <div className="text-xs text-white/45 mt-1 truncate">
                  {inst.isFounder ? 'צוות המיזם · ' : ''}
                  {inst.title}
                </div>
                <div className="text-xs text-white/35 mt-1">
                  {count === 0 ? 'אין הרצאות עדיין' : count === 1 ? 'הרצאה אחת' : `${count} הרצאות`}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
