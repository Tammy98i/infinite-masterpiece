import React, { useState } from 'react';
import { Course, WatchProgress } from '../types';
import { useApp } from '../context/AppContext';
import { Play, Plus, Check, Lock } from 'lucide-react';
import { formatClock, isolateClock } from '../utils/time';
import { ClockLabel } from './ClockLabel';
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
      ? `המשך מדקה ${isolateClock(progress.currentTime)}`
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

  /* Hover meta: only טעימה / נעול — not «פתוח» (polish 04) */
  const accessMeta = access === 'open' ? null : ACCESS_LABEL[access];
  const metaLine = [instructorName, resumeLabel || durationLabel, accessMeta]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={`relative shrink-0 text-start ${widthClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {rank != null && (
        <span
          className="absolute end-0 bottom-6 z-0 text-6xl sm:text-7xl font-accent font-bold leading-none text-[#b79043]/45 pointer-events-none select-none"
          aria-hidden
        >
          {rank}
        </span>
      )}

      <div className={`relative ${rank ? 'me-10 sm:me-14' : ''}`}>
        <div className="library-poster soundstage-card relative overflow-hidden">
          <button
            type="button"
            onClick={handleCardClick}
            aria-label={ariaTitle}
            className="block w-full cursor-pointer text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D99B43] focus-visible:ring-inset"
          >
            <div className="soundstage-card-frame relative aspect-[16/9] bg-[#0B0D11] overflow-hidden rounded-[4px]">
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
                className={`w-full h-full object-cover brightness-[0.88] saturate-[0.9] transition-[filter,transform] duration-200 motion-reduce:transition-none ${
                  isHovered ? 'brightness-105 saturate-100' : ''
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D11]/90 via-transparent to-transparent" />
              <span className="soundstage-cue-line" style={{ width: showProgress > 0 ? `${showProgress}%` : '42%' }} aria-hidden="true" />
              <span className="library-poster-play absolute inset-0 z-[3] flex items-center justify-center">
                <span className="library-poster-play-inner">
                  <Play className="ml-0.5 h-4 w-4 fill-current" data-icon="play" aria-hidden />
                </span>
              </span>

              <div className="library-poster-meta" aria-hidden>
                <b className="line-clamp-2">{title}</b>
                <span className="line-clamp-1">{metaLine}</span>
              </div>

              <span className="soundstage-card-dur absolute top-2 end-2 z-10 rounded-[3px] px-2 py-0.5 text-[11px] font-mono font-medium">
                <ClockLabel seconds={totalSecs} />
              </span>

              {showNew && (
                <span className="absolute bottom-2 end-2 z-10 rounded-[3px] bg-[#D99B43] px-2 py-0.5 text-[10px] font-bold text-[#0B0D11]">
                  חדש
                </span>
              )}

              {badgeDisplay ? (
                <span
                  className={`soundstage-card-badge absolute bottom-2 start-2 z-10 inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[11px] font-bold ${
                    badgeDisplay === 'המשך'
                      ? 'border border-[#D99B43] bg-[#14110c]/90 text-[#dfc47d]'
                      : badgeDisplay === 'טעימה'
                        ? 'bg-[#D99B43] text-[#0B0D11]'
                        : 'border border-[#D99B43]/50 bg-[#14110c]/90 text-[#dfc47d]'
                  }`}
                >
                  {badgeDisplay === 'נעול' ? <Lock className="w-3 h-3" aria-hidden /> : null}
                  {badgeDisplay}
                </span>
              ) : null}

              {showProgress > 0 && (
                <div
                  className="absolute bottom-0 inset-inline-0 h-1 bg-[#2a2419]"
                  role="progressbar"
                  aria-label={`התקדמות ב־${course.title}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(showProgress)}
                >
                  <div className="h-full bg-[#D99B43]" style={{ width: `${showProgress}%` }} />
                </div>
              )}
            </div>

            <div className="soundstage-card-body pt-2.5 pb-1 px-1 text-start">
              <div className="text-[14px] font-bold text-[#F2EFEB] leading-snug line-clamp-1">
                {title}
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[12px] text-[#b5a892]">
                <span className="truncate">{instructorName || 'Infinite Masterpiece'}</span>
                <span className="font-mono text-[#D99B43] shrink-0">{ACCESS_LABEL[access]}</span>
              </div>
              <div className="sr-only">
                {instructorName} {resumeLabel || durationLabel}, {ACCESS_LABEL[access]}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleListClick}
            className="library-poster-list soundstage-card-add absolute start-4 top-4 z-10 w-8 h-8 rounded-full border border-[#D99B43]/55 bg-[#0B0D11]/90 text-[#F2EFEB] hover:border-[#D99B43] hover:bg-[#D99B43] hover:text-[#0B0D11] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D99B43]"
            aria-label={isSaved ? `הסרה של ${course.title} מהרשימה` : `הוספת ${course.title} לרשימה`}
            aria-pressed={isSaved}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Plus className="w-3.5 h-3.5" aria-hidden />}
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
