import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MOOD_RECOMMENDATIONS } from '../data/initialData';
import { CourseCard } from '../components/CourseCard';
import { Play, RefreshCw, Sparkles, Compass, Zap } from 'lucide-react';

export const QuizView: React.FC = () => {
  const { courses, setView } = useApp();
  
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<'short' | 'medium' | 'any'>('any');

  const moodRec = MOOD_RECOMMENDATIONS.find((m) => m.mood === selectedMood) || MOOD_RECOMMENDATIONS[0];

  const recommendedCourses = courses.filter((c) => {
    if (!selectedMood) return false;
    const matchesMood = moodRec.recommendedCourseIds.includes(c.id) || c.tags.some((t) => moodRec.recommendedTags.includes(t));
    if (selectedTime === 'short') return matchesMood && c.isShort;
    return matchesMood;
  });

  return (
    <div className="min-h-screen text-white pt-28 pb-24 px-4 sm:px-8 max-w-6xl mx-auto text-right">
      
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/40 text-primary-light text-xs font-black uppercase mb-3">
          <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
          <span>מנוע המלצות חכם VOD</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white mb-4">
          מה מתאים לי לראות עכשיו?
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
          ענו על 2 שאלות קצרות וניתן לאלגוריתם התוכן של Infinite Masterpiece למצוא עבורכם בדיוק את הפרק המדויק למצב הנפשי שלכם ברגע זה.
        </p>
      </div>

      {/* Question 1: Mood */}
      <div className="glass rounded-3xl p-8 mb-8 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-6">
          1. איך אתם מרגישים היום? (בחרו את המצב הכי קרוב)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MOOD_RECOMMENDATIONS.map((item) => {
            const isSelected = selectedMood === item.mood;
            return (
              <button
                key={item.mood}
                onClick={() => setSelectedMood(item.mood)}
                className={`p-6 rounded-2xl text-right transition-all flex items-center justify-between border card-hover ${
                  isSelected
                    ? 'bg-gradient-to-l from-primary/25 to-primary/5 border-primary text-white shadow-xl shadow-primary/10'
                    : 'bg-white/5 border-white/5 text-zinc-300 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="font-extrabold text-lg sm:text-xl text-white mb-1">
                    {item.label}
                  </div>
                  <div className="text-xs text-zinc-400 flex gap-1">
                    {item.recommendedTags.map((t) => (
                      <span key={t}>#{t} </span>
                    ))}
                  </div>
                </div>

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-primary text-black' : 'bg-black/40 text-primary-light'
                }`}>
                  <Sparkles className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question 2: Time */}
      {selectedMood && (
        <div className="glass rounded-3xl p-8 mb-12 border border-white/10 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-white mb-6">
            2. כמה זמן פנוי יש לכם לצפייה כרגע?
          </h2>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setSelectedTime('short')}
              className={`px-6 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 border ${
                selectedTime === 'short' ? 'bg-primary text-black border-primary-light shadow-lg' : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>עד 10 דקות (שיעור קצר)</span>
            </button>

            <button
              onClick={() => setSelectedTime('any')}
              className={`px-6 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 border ${
                selectedTime === 'any' ? 'bg-primary text-black border-primary-light shadow-lg' : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>לא מוגבל (קורס או סדרה מלאה)</span>
            </button>
          </div>
        </div>
      )}

      {/* Recommended Results */}
      {selectedMood && (
        <div className="animate-in fade-in duration-500">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-8">
            <h2 className="text-2xl font-heading text-primary-light">
              התכנים המדויקים ביותר עבורכם ({recommendedCourses.length || courses.slice(0, 3).length})
            </h2>
            <button
              onClick={() => setSelectedMood(null)}
              className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 focus-ring rounded-lg px-2 py-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>איפוס שאלון</span>
            </button>
          </div>

          {(() => {
            const results = recommendedCourses.length > 0 ? recommendedCourses : courses.slice(0, 3);
            const [featured, ...rest] = results;
            if (!featured) return null;
            return (
              <>
                <div className="mb-8 glass rounded-3xl p-6 border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
                  <div className="text-xs font-bold text-primary-light mb-2">ההמלצה המובילה שלנו</div>
                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <img src={featured.coverImage} alt={featured.title} className="w-full sm:w-48 aspect-video object-cover rounded-2xl" />
                    <div className="flex-1 text-right">
                      <h3 className="text-xl font-heading text-white mb-2">{featured.title}</h3>
                      <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{featured.subtitle}</p>
                      <button
                        onClick={() => setView('watch', { courseId: featured.id, episodeId: featured.episodes[0]?.id })}
                        className="px-6 py-3 rounded-full bg-primary text-black font-black flex items-center gap-2 focus-ring"
                      >
                        <Play className="w-4 h-4 fill-black" />
                        התחילו לצפות עכשיו
                      </button>
                    </div>
                  </div>
                </div>
                {rest.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
                    {rest.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

    </div>
  );
};
