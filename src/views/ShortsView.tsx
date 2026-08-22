import React from 'react';
import { useApp } from '../context/AppContext';
import { CourseCard } from '../components/CourseCard';
import { Zap, Clock, ArrowRight } from 'lucide-react';

export const ShortsView: React.FC = () => {
  const { courses, setView } = useApp();

  const shortCourses = courses.filter((c) => c.isShort);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-20 px-4 sm:px-8 max-w-7xl mx-auto text-right">
      
      {/* Header Banner */}
      <div className="glass rounded-3xl p-8 mb-10 bg-gradient-to-l from-purple-900/30 via-zinc-900 to-black border border-purple-500/30 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase mb-2">
          <Zap className="w-4 h-4 fill-purple-400" />
          <span>מצב צפייה מהירה</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black mb-3 text-white">
          יש לי 10 דקות (שיעורי מאסטר ממוקדים)
        </h1>

        <p className="text-zinc-300 text-base sm:text-lg max-w-2xl leading-relaxed">
          אין לכם זמן לסדרה ארוכה? ריכזנו עבורכם הרצאות קצרות וקולעות באורך 5-12 דקות בלבד שנותנות כלים פרקטיים ומיידיים לביצוע עוד היום.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
        {shortCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

    </div>
  );
};
