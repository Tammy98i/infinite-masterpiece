import React from 'react';
import { useApp } from '../context/AppContext';
import { CourseCard } from '../components/CourseCard';
import { Zap, ArrowRight } from 'lucide-react';
import { EmptyState } from '../components/LibraryStates';

export const ShortsView: React.FC = () => {
  const { courses, setView } = useApp();

  const shortCourses = courses.filter((c) => c.isShort);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-28 px-4 sm:px-8 max-w-7xl mx-auto text-right">
      <div className="rounded-3xl p-8 mb-10 border border-white/10 bg-white/[0.03] relative overflow-hidden">
        <div className="flex items-center gap-2 text-[#C8A24C] text-xs font-semibold mb-2">
          <Zap className="w-4 h-4" />
          <span>צפייה קצרה</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-heading font-semibold mb-3 text-white">יש לי 10 דקות</h1>

        <p className="text-white/55 text-base sm:text-lg max-w-2xl leading-relaxed font-light">
          הרצאות קצרות, 5 עד 12 דקות, עם כלי אחד שאפשר לבצע עוד היום.
        </p>
      </div>

      {shortCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
          {shortCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="אין עדיין הרצאות קצרות"
          body="כשיתווספו שיעורים עד 10 דקות, הם יופיעו כאן."
          actionLabel="לספרייה"
          onAction={() => setView('home')}
        />
      )}

      <button
        type="button"
        onClick={() => setView('home')}
        className="mt-10 inline-flex items-center gap-1.5 text-sm text-white/45 hover:text-white min-h-11 cursor-pointer"
      >
        <span>לספרייה</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
