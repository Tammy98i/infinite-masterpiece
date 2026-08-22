import React from 'react';
import { useApp } from '../context/AppContext';
import { Clock, ArrowRight, Play } from 'lucide-react';
import { formatClock } from '../utils/time';
import { useWatchAccess } from '../utils/useWatchAccess';

function formatWhen(ts: number) {
  return new Date(ts).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

export const HistoryView: React.FC = () => {
  const { getWatchHistory, setView } = useApp();
  const { goWatch } = useWatchAccess();
  const items = getWatchHistory();

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-20 px-4 sm:px-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#C8A24C] text-xs mb-1">
            <Clock className="w-4 h-4" />
            <span>לאחרונה בספרייה</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold">היסטוריה</h1>
        </div>
        <button
          type="button"
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white min-h-11"
        >
          <span>לספרייה</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-white/45">עדיין אין צפיות. כשתתחילו הרצאה היא תופיע כאן.</p>
      ) : (
        <div className="divide-y divide-white/10">
          {items.map(({ course, episode, progress }) => {
            const pct = Math.min(
              100,
              Math.round((progress.currentTime / (progress.duration || 1)) * 100)
            );
            return (
              <button
                key={`${progress.courseId}_${progress.episodeId}`}
                type="button"
                onClick={() => goWatch(course.id, episode.id, 'history')}
                aria-label={`המשך צפייה: ${course.title}, ${episode.title}`}
                className="w-full text-right py-5 flex items-center gap-4 hover:bg-white/[0.03] transition-colors min-h-11"
              >
                <img
                  src={course.thumbnail}
                  alt=""
                  aria-hidden
                  className="w-28 h-16 object-cover rounded-lg shrink-0 border border-white/10"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{course.title}</div>
                  <div className="text-xs text-white/40 mt-1 truncate">{episode.title}</div>
                  <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#C8A24C]" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[11px] text-white/35 mt-1">
                    {progress.completed
                      ? 'הושלם'
                      : `${formatClock(progress.currentTime)} מתוך ${formatClock(progress.duration)}`}
                    {' · '}
                    {formatWhen(progress.updatedAt)}
                  </div>
                </div>
                <Play className="w-4 h-4 text-white/40 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
