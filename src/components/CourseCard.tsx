import React from 'react';
import './CourseCard.css';
import { Course, WatchProgress } from '../types';
import { useApp } from '../context/AppContext';
import { Plus, Check, Lock } from 'lucide-react';
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

  const widthClass = fullWidth ? 'w-full' : 'w-[340px] max-w-full';

  return (
    <div className={`library-course-card relative shrink-0 text-start ${widthClass}`}>
      {rank != null && (
        <span className="premium-course-rank" aria-hidden>{rank}</span>
      )}
      <div className="premium-course-card" dir="rtl" onClick={handleCardClick}>
        <div className="premium-course-poster">
          <img
            {...responsiveImageAttrs(course.coverImage, {
              sizes: fullWidth ? '(max-width: 640px) 92vw, 420px' : '(max-width: 640px) 88vw, 340px',
              defaultWidth: 640,
            })}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
          />
          <span className="premium-course-duration"><ClockLabel seconds={totalSecs} /></span>
          {(badgeDisplay || recommendationReason) && (
            <span className="premium-course-badge">
              {badgeDisplay === 'נעול' && <Lock size={12} aria-hidden />}
              {badgeDisplay || recommendationReason}
            </span>
          )}
          {showNew && <span className="premium-course-new">חדש</span>}
          <button
            type="button"
            onClick={handleListClick}
            className="premium-course-add"
            aria-label={isSaved ? `הסרה של ${course.title} מהרשימה` : `הוספת ${course.title} לרשימה`}
            aria-pressed={isSaved}
          >
            {isSaved ? <Check aria-hidden /> : <Plus strokeWidth={1.8} aria-hidden />}
          </button>
          <button type="button" className="premium-course-play" aria-label={ariaTitle}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7 4.8a1 1 0 0 1 1.5-.86l11 7.2a1 1 0 0 1 0 1.72l-11 7.2A1 1 0 0 1 7 19.2z" />
            </svg>
          </button>
          {showProgress > 0 && (
            <div className="premium-course-progress" role="progressbar"
              aria-label={`התקדמות ב־${course.title}`} aria-valuemin={0} aria-valuemax={100}
              aria-valuenow={Math.round(showProgress)}>
              <div style={{ width: `${showProgress}%` }} />
            </div>
          )}
        </div>
        <div className="premium-course-body">
          <div className="premium-course-title">{title}</div>
          <div className="premium-course-signature" aria-hidden="true" />
          <div className="premium-course-details">
            <span className="premium-course-instructor">{instructorName || 'Infinite Masterpiece'}</span>
            <span className="premium-course-access">{ACCESS_LABEL[access]}</span>
          </div>
          <div className="sr-only">{instructorName} {resumeLabel || durationLabel}, {ACCESS_LABEL[access]}</div>
        </div>
      </div>
      {recommendationReason && badgeDisplay && (
        <p className="premium-course-reason">{recommendationReason}</p>
      )}
    </div>
  );
};
