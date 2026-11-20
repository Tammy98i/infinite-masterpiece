import React from 'react';
import { useApp } from '../context/AppContext';
import { CourseCard } from '../components/CourseCard';
import { Zap } from 'lucide-react';
import { DirBack } from '../components/DirArrow';
import { EmptyState } from '../components/LibraryStates';

export const ShortsView: React.FC = () => {
  const { courses, setView } = useApp();

  const shortCourses = courses.filter((c) => c.isShort);

  return (
    <div className="library-catalog-page min-h-screen text-white pt-28 pb-28 px-4 sm:px-8 max-w-7xl mx-auto text-start">
      <div className="library-page-hero relative overflow-hidden p-8 mb-8 border">
        <div className="flex items-center gap-2 text-[#b79043] text-xs font-semibold mb-2">
          <Zap className="w-4 h-4" />
          <span>צפייה קצרה</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-heading font-semibold mb-3 text-white">יש לי 10 דקות</h1>

        <p className="text-white/55 text-base sm:text-lg max-w-2xl leading-relaxed font-light">
          הרצאות קצרות, 5 עד 12 דקות, עם כלי אחד שאפשר לבצע עוד היום.
        </p>
      </div>

      {shortCourses.length > 0 ? (
        <div className="library-page-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 justify-items-stretch">
          {shortCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow="10 דקות"
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
        <DirBack />
      </button>
    </div>
  );
};
