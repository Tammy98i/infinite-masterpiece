import React from 'react';
import { useApp } from '../context/AppContext';
import { CourseCard } from '../components/CourseCard';
import { Bookmark, ArrowRight } from 'lucide-react';
import { FREE_LIST_LIMIT, hasFullLibraryAccess } from '../utils/access';

export const MyListView: React.FC = () => {
  const { myList, courses, setView, user } = useApp();

  const savedCourses = courses.filter((c) => myList.includes(c.id));
  const isFreeList = user.role !== 'admin' && !hasFullLibraryAccess(user);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
      
      <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-primary-light text-xs font-bold uppercase mb-1">
            <Bookmark className="w-4 h-4 fill-primary-light" />
            <span>רשימת צפייה אישית</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            הרשימה שלי ({savedCourses.length})
          </h1>
          {isFreeList && (
            <p className="text-xs text-white/40 mt-2">
              {savedCourses.length >= FREE_LIST_LIMIT
                ? 'הרשימה החינמית מלאה. מנוי פותח שמירה בלי הגבלה.'
                : `שמירת עד ${FREE_LIST_LIMIT} הרצאות במסלול החינמי.`}
            </p>
          )}
        </div>

        <button
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
        >
          <span>לספרייה המלאה</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {savedCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
          {savedCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-3xl p-16 text-center max-w-lg mx-auto my-12 border border-white/10">
          <Bookmark className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">הרשימה שלך עדיין ריקה</h3>
          <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
            כשאת נתקלת בקורס או הרצאה שמעניינים אותך ואין לך זמן לצפות מיד, לחצי על סמל הסימנייה כדי לשמור אותם לכאן.
          </p>
          <button
            onClick={() => setView('home')}
            className="px-8 py-3.5 rounded-full bg-primary text-black font-extrabold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            גלי תוכן פרימיום עכשיו
          </button>
        </div>
      )}

    </div>
  );
};
