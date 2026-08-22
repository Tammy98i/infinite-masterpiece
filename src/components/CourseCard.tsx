import React, { useState } from 'react';
import { Course, WatchProgress } from '../types';
import { useApp } from '../context/AppContext';
import { Play, Plus, Check, Lock } from 'lucide-react';
import { formatClock } from '../utils/time';
import { useWatchAccess } from '../utils/useWatchAccess';
import { useMyListToggle } from '../utils/useMyListToggle';
import { getCardAccessState, isCourseNew, type CardAccessState } from '../utils/libraryHome';
import { trackEvent } from '../utils/analytics';
import { responsiveImageAttrs } from '../utils/responsiveImage';

interface CourseCardProps {
  course: Course;
  progress?: WatchProgress;
  customProgressPercentage?: number;
  layout?: 'card' | 'continue';
  fullWidth?: boolean;
  rank?: number;
  sectionName?: string;
  position?: number;
  recommendationReason?: string;
  showDurationBadge?: boolean;
  showNewBadge?: boolean;
}

const ACCESS_LABEL: Record<CardAccessState, string> = {
  open: 'פתוח',
  preview: 'טעימה',
  locked: 'דורש מסלול',
};

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  progress,
  customProgressPercentage,
  layout = 'card',
  fullWidth = false,
  rank,
  sectionName = 'rail',
  position = 0,
  recommendationReason,
  showDurationBadge = false,
  showNewBadge = false,
}) => {
  const { setView, isInMyList, getCourseProgress, user, instructors } = useApp();
  const { goWatch } = useWatchAccess();
  const toggleList = useMyListToggle();
  const [isHovered, setIsHovered] = useState(false);

  const isSaved = isInMyList(course.id);
  const progPct =
    customProgressPercentage !== undefined ? customProgressPercentage : getCourseProgress(course.id);
  const totalSecs = course.episodes.reduce((s, ep) => s + ep.duration, 0);
  const durationLabel = progress
    ? formatClock(Math.max(0, progress.duration - progress.currentTime))
    : formatClock(totalSecs);
  const resumeLabel =
    progress && layout === 'continue'
      ? `המשך מדקה ${formatClock(progress.currentTime)}`
      : undefined;
  const episodeTitle = progress
    ? course.episodes.find((e) => e.id === progress.episodeId)?.title
    : undefined;
  const title = layout === 'continue' && episodeTitle ? episodeTitle : course.title;
  const instructorName = instructors.find((i) => i.id === course.instructorId)?.name;
  const access = getCardAccessState(course, user);
  const showNew = showNewBadge && isCourseNew(course);

  const handleCardClick = () => {
    trackEvent('content_card_click', {
      content_id: course.id,
      section_name: sectionName,
      position: String(position),
      access_level: access,
    });
    if (layout === 'continue' && progress) {
      trackEvent('resume_click', { content_id: course.id, section_name: sectionName });
      goWatch(course.id, progress.episodeId, 'continue');
      return;
    }
    if (access === 'locked') {
      goWatch(course.id, course.episodes[0]?.id, 'locked_card');
      return;
    }
    setView('course', { courseId: course.id });
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    goWatch(course.id, progress ? progress.episodeId : course.episodes[0]?.id, 'card_play');
  };

  const handleListClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isSaved;
    toggleList(course.id);
    trackEvent(next ? 'add_to_list' : 'remove_from_list', {
      content_id: course.id,
      section_name: sectionName,
    });
  };

  const ariaTitle =
    layout === 'continue'
      ? `המשך צפייה ב־${course.title}`
      : rank != null
        ? `${rank}. ${course.title}`
        : course.title;

  return (
    <div
      className={`relative shrink-0 text-right ${
        fullWidth ? 'w-full' : rank ? 'w-[240px] sm:w-[300px]' : 'w-[220px] sm:w-[260px]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {rank != null && (
        <span
          className="absolute left-0 bottom-10 z-0 text-7xl sm:text-8xl font-black leading-none text-[#C8A24C]/30 pointer-events-none select-none"
          aria-hidden
        >
          {rank}
        </span>
      )}

      <div className={`relative ${rank ? 'ml-10 sm:ml-14' : ''}`}>
        <div
          className={`relative overflow-hidden rounded-xl border transition-colors duration-200 ${
            isHovered ? 'border-[#C8A24C]' : 'border-white/10'
          }`}
        >
          <button
            type="button"
            onClick={handleCardClick}
            aria-label={ariaTitle}
            className="block w-full text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] focus-visible:ring-inset"
          >
            <div className="relative aspect-[16/9] bg-zinc-900">
              <img
                {...responsiveImageAttrs(course.coverImage, {
                  sizes: fullWidth
                    ? '(max-width: 640px) 92vw, 420px'
                    : '(max-width: 640px) 72vw, (max-width: 1024px) 28vw, 240px',
                  defaultWidth: 640,
                })}
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-cover brightness-[0.78] transition-[filter,transform] duration-500 motion-reduce:transition-none ${
                  isHovered ? 'brightness-90 scale-105 motion-reduce:scale-100' : ''
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

              {showDurationBadge && (
                <span className="absolute top-2 left-2 z-10 rounded bg-black/75 px-2 py-0.5 text-[12px] font-medium text-white">
                  {formatClock(totalSecs)}
                </span>
              )}

              {showNew && (
                <span className="absolute top-2 right-2 z-10 rounded bg-[#C8A24C] px-2 py-0.5 text-[11px] font-semibold text-black">
                  חדש
                </span>
              )}

              {access === 'locked' && !showDurationBadge && (
                <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded bg-black/75 px-2 py-0.5 text-[11px] text-white/90">
                  <Lock className="w-3 h-3" aria-hidden />
                  דורש מסלול
                </span>
              )}
              {access === 'preview' && !showDurationBadge && (
                <span className="absolute top-2 left-2 z-10 rounded border border-[#C8A24C]/60 bg-black/70 px-2 py-0.5 text-[11px] text-[#F7E7B5]">
                  טעימה
                </span>
              )}

              <div className="absolute bottom-3 right-3 left-3 z-[1] text-right pointer-events-none">
                <div className="text-[15px] sm:text-base font-semibold text-white leading-snug line-clamp-2">
                  {title}
                </div>
                {instructorName && (
                  <div className="text-[13px] text-white/70 mt-0.5 truncate">{instructorName}</div>
                )}
                <div className="text-[13px] text-white/55 mt-0.5">
                  {resumeLabel || durationLabel}
                  <span className="sr-only">, {ACCESS_LABEL[access]}</span>
                </div>
              </div>

              {progPct > 0 && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15"
                  role="progressbar"
                  aria-label={`התקדמות ב־${course.title}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progPct)}
                >
                  <div className="h-full bg-[#C8A24C]" style={{ width: `${progPct}%` }} />
                </div>
              )}
            </div>
          </button>

          <div
            className={`absolute left-2 bottom-12 z-10 flex gap-2 transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0 focus-within:opacity-100'
            }`}
          >
            <button
              type="button"
              onClick={handlePlayClick}
              className="w-11 h-11 rounded-full bg-[#C8A24C] text-black flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:opacity-100"
              aria-label={`התחילו לצפות ב־${course.title}`}
            >
              <Play className="w-4 h-4 fill-black ml-0.5" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={handleListClick}
            className={`absolute right-2 top-2 z-10 w-11 h-11 rounded-full border border-white/30 bg-black/50 text-white flex items-center justify-center transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] focus-visible:opacity-100 ${
              isHovered || isSaved ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label={isSaved ? `הסרה של ${course.title} מהרשימה` : `הוספת ${course.title} לרשימה`}
            aria-pressed={isSaved}
          >
            {isSaved ? <Check className="w-4 h-4 text-[#C8A24C]" aria-hidden /> : <Plus className="w-4 h-4" aria-hidden />}
          </button>
        </div>

        {recommendationReason && (
          <p className="mt-2 text-[12px] text-white/45 font-light leading-snug line-clamp-2 px-0.5">
            {recommendationReason}
          </p>
        )}
      </div>
    </div>
  );
};
