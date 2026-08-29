import React, { useState } from 'react';
import { Course, WatchProgress } from '../types';
import { useApp } from '../context/AppContext';
import { Play, Plus, Check, Lock } from 'lucide-react';
import { formatClock } from '../utils/time';
import { useWatchAccess } from '../utils/useWatchAccess';
import { useMyListToggle } from '../utils/useMyListToggle';
import { cardBadgeLabel, getCardAccessState, isCourseNew, type CardAccessState } from '../utils/libraryHome';
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
  locked: 'נעול',
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
  const badge = cardBadgeLabel(access, layout === 'continue' ? 'continue' : 'card');
  const showNew = showNewBadge && isCourseNew(course);
  const showProgress = layout === 'continue' ? Math.max(progPct, 4) : progPct;

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

  const widthClass = fullWidth
    ? 'w-full'
    : layout === 'continue'
      ? 'w-[260px] sm:w-[340px]'
      : rank
        ? 'w-[240px] sm:w-[300px]'
        : 'w-[220px] sm:w-[260px]';

  return (
    <div
      className={`relative shrink-0 text-right ${widthClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {rank != null && (
        <span
          className="absolute left-0 bottom-10 z-0 text-7xl sm:text-8xl font-accent font-bold leading-none text-[#C8A24C]/30 pointer-events-none select-none"
          aria-hidden
        >
          {rank}
        </span>
      )}

      <div className={`relative ${rank ? 'ml-10 sm:ml-14' : ''}`}>
        <div
          className={`relative overflow-hidden rounded-2xl border transition-[border-color] duration-200 ${
            isHovered ? 'border-white/25' : 'border-white/10'
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
                className={`w-full h-full object-cover brightness-[0.78] transition-[filter] duration-300 motion-reduce:transition-none ${
                  isHovered ? 'brightness-90' : ''
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

              {showDurationBadge && !badge && (
                <span className="absolute top-2 start-2 z-10 rounded bg-black/75 px-2 py-0.5 text-[12px] font-medium text-white">
                  {formatClock(totalSecs)}
                </span>
              )}

              {showNew && (
                <span className="absolute top-2 end-14 z-10 rounded bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-black">
                  חדש
                </span>
              )}

              {badge ? (
                <span
                  className={`absolute top-2 start-2 z-10 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium ${
                    badge === 'המשך'
                      ? 'border border-[#C8A24C]/70 bg-black/75 text-[#F7E7B5]'
                      : badge === 'טעימה'
                        ? 'border border-[#C8A24C]/60 bg-black/70 text-[#F7E7B5]'
                        : 'bg-black/75 text-white/90'
                  }`}
                >
                  {badge === 'נעול' ? <Lock className="w-3 h-3" aria-hidden /> : null}
                  {badge}
                </span>
              ) : null}

              <div className="absolute bottom-3 right-3 left-3 z-[1] text-right pointer-events-none">
                <div className="text-[15px] sm:text-base font-heading font-semibold text-white leading-snug line-clamp-1">
                  {title}
                </div>
                {instructorName && (
                  <div className="text-[13px] text-white/70 mt-0.5 truncate">{instructorName}</div>
                )}
                <div className="text-[13px] text-white/70 mt-0.5">
                  {resumeLabel || durationLabel}
                  <span className="sr-only">, {ACCESS_LABEL[access]}</span>
                </div>
              </div>

              {showProgress > 0 && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-white/15"
                  role="progressbar"
                  aria-label={`התקדמות ב־${course.title}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(showProgress)}
                >
                  <div className="h-full bg-[#C8A24C]" style={{ width: `${showProgress}%` }} />
                </div>
              )}
            </div>
          </button>

          {layout === 'continue' ? (
            <button
              type="button"
              onClick={handlePlayClick}
              className="absolute start-2 bottom-14 z-10 w-11 h-11 rounded-full bg-white text-black flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C]"
              aria-label={`המשיכו לצפות ב־${course.title}`}
            >
              <Play className="w-4 h-4 fill-black ms-0.5" aria-hidden />
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleListClick}
            className="absolute end-2 top-2 z-10 w-11 h-11 rounded-full border border-white/35 bg-black/55 text-white flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C]"
            aria-label={isSaved ? `הסרה של ${course.title} מהרשימה` : `הוספת ${course.title} לרשימה`}
            aria-pressed={isSaved}
          >
            {isSaved ? <Check className="w-4 h-4" aria-hidden /> : <Plus className="w-4 h-4" aria-hidden />}
          </button>
        </div>

        {recommendationReason && (
          <p className="mt-2 text-[12px] text-white/70 font-light leading-snug line-clamp-2 px-0.5">
            {recommendationReason}
          </p>
        )}
      </div>
    </div>
  );
};
