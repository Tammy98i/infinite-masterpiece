import React from 'react';
import { useApp } from '../context/AppContext';
import { Layers, Clock, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { CourseCard } from '../components/CourseCard';

export const LearningPathsView: React.FC = () => {
  const { learningPaths, courses, setView } = useApp();

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-24 px-4 sm:px-8 max-w-7xl mx-auto text-right">
      
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary-light text-xs font-black uppercase mb-3">
          <Layers className="w-4 h-4" />
          <span>תוכניות לימוד מובנות פרימיום</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white mb-4">
          מסלולי התפתחות וטרנספורמציה
        </h1>
        <p className="text-base sm:text-xl text-zinc-300 leading-relaxed">
          במקום להתלבט מאיפה להתחיל, צוות המומחים הקליניים והעסקיים שלנו בנה עבורכם מסלולי למידה שלביים המחברים מספר קורסים למהלך שלם של צמיחה.
        </p>
      </div>

      <div className="grid gap-12">
        {learningPaths.map((path) => {
          const pathCourses = courses.filter((c) => path.courseIds.includes(c.id));

          return (
            <div key={path.id} className="glass rounded-3xl p-6 sm:p-10 border border-white/10 relative overflow-hidden bg-gradient-to-br from-zinc-900/60 to-black">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-8 border-b border-white/10 pb-8">
                <div className="lg:col-span-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-primary text-black font-extrabold text-xs">
                      מסלול משולב • {path.totalDurationHours} שעות
                    </span>
                    <span className="text-xs text-zinc-400">{pathCourses.length} קורסים מובנים</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-black text-white mb-2">
                    {path.title}
                  </h2>
                  <p className="text-base sm:text-lg text-primary-light/90 font-semibold mb-3">
                    {path.subtitle}
                  </p>
                  <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
                    {path.description}
                  </p>
                </div>

                <div className="lg:col-span-4 flex justify-end">
                  <button
                    onClick={() => setView('course', { courseId: path.courseIds[0] })}
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-black font-black text-base hover:brightness-110 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-black" />
                    <span>התחל את המסלול מהשלב הראשון</span>
                  </button>
                </div>
              </div>

              {/* Courses in path row */}
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                  השלבים במסלול לפי סדר מומלץ:
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4 scroll-smooth">
                  {pathCourses.map((course, i) => (
                    <div key={course.id} className="relative shrink-0">
                      <div className="absolute -top-3 -right-3 z-30 w-8 h-8 rounded-full bg-primary text-black font-black text-sm flex items-center justify-center shadow-lg border-2 border-black">
                        {i + 1}
                      </div>
                      <CourseCard course={course} />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
