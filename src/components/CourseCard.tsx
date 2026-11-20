import React, { useState } from 'react';
import { Course, WatchProgress } from '../types';
import { useApp } from '../context/AppContext';
import { Play, Plus, Check, Lock } from 'lucide-react';
import { ClockLabel } from './ClockLabel';
import { useWatchAccess } from '../utils/useWatchAccess';
import { useMyListToggle } from '../utils/useMyListToggle';
import { cardBadgeLabel, getCardAccessState, isCourseNew } from '../utils/libraryHome';
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
  showNewBadge = false,
}) => {
  const { setView, isInMyList, getCourseProgress, user } = useApp();
  const { goWatch } = useWatchAccess();
  const toggleList = useMyListToggle();
  const [isHovered, setIsHovered] = useState(false);

  const isSaved = isInMyList(course.id);
  const progPct =
    customProgressPercentage !== undefined ? customProgressPercentage : getCourseProgress(course.id);
  const totalSecs = course.episodes.reduce((s, ep) => s + ep.duration, 0);
  const episodeTitle = progress
    ? course.episodes.find((e) => e.id === progress.episodeId)?.title
    : undefined;
  const title = layout === 'continue' && episodeTitle ? episodeTitle : course.title;
  const access = getCardAccessState(course, user);
  const badge = cardBadgeLabel(access, layout === 'continue' ? 'continue' : 'card');
  const showNew = showNewBadge && isCourseNew(course);
  const showProgress = layout === 'continue' ? Math.max(progPct, 4) : progPct;
  const badgeDisplay =
    badge === 'דורש מנוי' ? 'נעול' : badge === 'טעימה' ? 'טעימה' : badge;

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
    setView('course', { courseId: course.id });
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
      ? 'w-[240px] sm:w-[280px]'
      : rank
        ? 'w-[180px] sm:w-[210px]'
        : 'w-[168px] sm:w-[210px]';

  const durationSeconds = progress
    ? Math.max(0, progress.duration - progress.currentTime)
    : totalSecs;

  return (
    <div
      className={`library-course-card relative shrink-0 text-start ${widthClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {rank != null && (
        <span
          className="absolute end-0 bottom-6 z-0 text-6xl sm:text-7xl font-accent font-bold leading-none text-[#f3ede2]/55 pointer-events-none select-none"
          aria-hidden
        >
          {rank}
        </span>
      )}

      <div className={`relative ${rank ? 'me-10 sm:me-14' : ''}`}>
        <div className="library-poster relative overflow-hidden rounded-[4px]">
          <button
            type="button"
            onClick={handleCardClick}
            aria-label={ariaTitle}
            className="block w-full cursor-pointer text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043] focus-visible:ring-inset"
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
                className={`w-full h-full object-cover brightness-[0.92] transition-[filter] duration-200 motion-reduce:transition-none ${
                  isHovered ? 'brightness-110' : ''
                }`}
              />
              <div className="library-card-veil absolute inset-0" />
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-2 text-start pointer-events-none">
                <div className="library-card-title text-[13px] font-semibold leading-snug text-white line-clamp-2">
                  <bdi dir="auto">{title}</bdi>
                </div>
                <p className="library-topic-count mt-0.5">
                  <ClockLabel seconds={durationSeconds} />
                </p>
              </div>
              <span className="library-poster-play absolute inset-0 z-[3] flex items-center justify-center">
                <span className="library-poster-play-inner">
                  <Play className="ml-0.5 h-4 w-4 fill-black" data-icon="play" aria-hidden />
                </span>
              </span>

              {showNew && (
                <span className="absolute top-2 end-14 z-10 rounded-[4px] bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-black">
                  חדש
                </span>
              )}

              {badgeDisplay ? (
                <span
                  className={`absolute top-2 start-2 z-10 inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-medium ${
                    badgeDisplay === 'המשך'
                      ? 'border border-[#b79043]/70 bg-black/75 text-[#dfc47d]'
                      : badgeDisplay === 'טעימה'
                        ? 'border border-white/25 bg-black/70 text-white/90'
                        : 'border border-white/20 bg-black/70 text-white/85'
                  }`}
                >
                  {badgeDisplay === 'נעול' ? <Lock className="w-3 h-3" aria-hidden /> : null}
                  {badgeDisplay}
                </span>
              ) : null}

              {showProgress > 0 && (
                <div
                  className="absolute bottom-0 inset-inline-0 h-1 bg-white/15"
                  role="progressbar"
                  aria-label={`התקדמות ב־${course.title}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(showProgress)}
                >
                  <div className="h-full bg-[#b79043]" style={{ width: `${showProgress}%` }} />
                </div>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={handleListClick}
            className="library-poster-list absolute end-2 top-2 z-10 w-11 h-11 rounded-[4px] border border-white/35 bg-black/55 text-white flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
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
