import React from 'react';
import { useApp } from '../context/AppContext';
import { CourseCard } from '../components/CourseCard';
import { Bookmark } from 'lucide-react';
import { DirBack } from '../components/DirArrow';
import { FREE_LIST_LIMIT, hasFullLibraryAccess } from '../utils/access';
import { StartHereRail } from '../components/StartHereRail';
import { EmptyState } from '../components/LibraryStates';
import { pickStartHereCourses } from '../utils/libraryHome';

export const MyListView: React.FC = () => {
  const { myList, courses, setView, user } = useApp();

  const savedCourses = courses.filter((c) => myList.includes(c.id));
  const isFreeList = user.role !== 'admin' && !hasFullLibraryAccess(user);

  return (
    <div className="library-catalog-page min-h-screen text-white pt-28 pb-28 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#b79043] text-xs font-semibold mb-1">
            <Bookmark className="w-4 h-4" />
            <span>רשימת צפייה אישית</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-white">
            הרשימה שלי ({savedCourses.length})
          </h1>
          {isFreeList && (
            <p className="text-xs text-white/70 mt-2">
              {savedCourses.length >= FREE_LIST_LIMIT
                ? 'הרשימה החינמית מלאה. מנוי פותח שמירה בלי הגבלה.'
                : `שמירת עד ${FREE_LIST_LIMIT} הרצאות במסלול החינמי.`}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors min-h-11 cursor-pointer"
        >
          <span>לספרייה המלאה</span>
          <DirBack />
        </button>
      </div>

      {savedCourses.length > 0 ? (
        <div className="library-page-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 justify-items-stretch">
          {savedCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="grid gap-8">
          <EmptyState
            eyebrow="הרשימה שלי"
            title="עדיין אין הרצאות שמורות"
            body="בחרו מהכרזה או מהפסים — הכל נשאר במקומו."
            actionLabel="להמשיך לגלול"
            onAction={() => setView('home')}
          />
          <StartHereRail {...pickStartHereCourses(courses, user)} />
        </div>
      )}
    </div>
  );
};
