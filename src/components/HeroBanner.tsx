import React from 'react';
import { Course } from '../types';
import { useApp } from '../context/AppContext';
import { Play } from 'lucide-react';
import { formatClock } from '../utils/time';
import { useWatchAccess } from '../utils/useWatchAccess';
import { canPreviewEpisode, canWatchEpisode } from '../utils/access';
import { getCardAccessState } from '../utils/libraryHome';
import { trackEvent } from '../utils/analytics';
import { responsiveImageAttrs } from '../utils/responsiveImage';

interface HeroBannerProps {
  course: Course;
  continueWatching?: {
    episodeId: string;
    episodeTitle: string;
    currentTime: number;
    duration: number;
  };
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ course, continueWatching }) => {
  const { setView, user, instructors } = useApp();
  const { goWatch } = useWatchAccess();
  const instructor = instructors.find((item) => item.id === course.instructorId);
  const totalSecs = course.episodes.reduce((sum, item) => sum + item.duration, 0);

  const episode =
    course.episodes.find((e) => e.id === continueWatching?.episodeId) || course.episodes[0];
  const access = getCardAccessState(course, user);
  const canFull = canWatchEpisode(episode, user, course);
  const canPreview = canPreviewEpisode(episode, user, course);

  const primaryLabel = continueWatching
    ? 'המשיכו לצפות'
    : canFull
      ? 'התחילו לצפות'
      : canPreview
        ? 'צפו בטעימה'
        : 'פתיחת גישה';

  const continuePct = continueWatching
    ? Math.min(
        100,
        Math.max(4, Math.round((continueWatching.currentTime / (continueWatching.duration || 1)) * 100))
      )
    : 0;

  const handlePlayClick = () => {
    trackEvent('hero_play_click', {
      content_id: course.id,
      access_level: access,
    });
    goWatch(course.id, continueWatching?.episodeId || course.episodes[0]?.id, 'hero');
  };

  const handleDetails = () => {
    trackEvent('hero_details_click', { content_id: course.id });
    setView('course', { courseId: course.id });
  };

  return (
    <section
      className="library-hero relative w-full min-h-[78vh] md:h-[88vh] flex items-end overflow-hidden pt-24 pb-16 md:pb-24"
      aria-label={continueWatching ? `המשך צפייה: ${course.title}` : `מומלץ: ${course.title}`}
    >
      <div className="absolute inset-0 select-none overflow-hidden">
        <img
          {...responsiveImageAttrs(course.backdropImage || course.coverImage, {
            widths: [768, 1200, 1600, 2000],
            sizes: '100vw',
            defaultWidth: 1600,
          })}
          alt=""
          aria-hidden
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-center scale-105"
        />
        <div className="library-hero-veil-bottom absolute inset-0 bg-gradient-to-t from-[#0d0b08] via-[#0d0b08]/70 to-transparent" />
        <div className="library-hero-veil-side absolute inset-0 bg-gradient-to-l from-[#0d0b08]/90 via-[#0d0b08]/55 to-transparent w-full md:w-[70%] ms-auto" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 w-full z-10 text-right md:max-w-2xl md:ms-0 md:me-auto">
        <h1 className="text-4xl sm:text-6xl lg:text-[5rem] font-bold text-white leading-[1.05] tracking-tight mb-4">
          {course.title}
        </h1>

        <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/80">
          {instructor ? <span>{instructor.name}</span> : null}
          {instructor ? <span aria-hidden>·</span> : null}
          <span>{formatClock(totalSecs)}</span>
          <span aria-hidden>·</span>
          <span>{canFull ? 'פתוח לצפייה' : canPreview ? 'טעימה' : 'דורש מנוי'}</span>
        </p>

        <p className="text-sm sm:text-base text-white/80 font-light leading-relaxed max-w-xl mb-6 line-clamp-2">
          {course.subtitle || course.description}
        </p>

        {continueWatching && (
          <div className="max-w-sm mb-7">
            <div className="flex items-center justify-between text-[11px] text-white/70 mb-2" id="hero-progress-label">
              <span>
                {formatClock(continueWatching.currentTime)} / {formatClock(continueWatching.duration)}
              </span>
              <span>המשך צפייה</span>
            </div>
            <div
              className="h-1 rounded-full bg-white/15 overflow-hidden"
              role="progressbar"
              aria-labelledby="hero-progress-label"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={continuePct}
            >
              <div className="h-full bg-[#b79043]" style={{ width: `${continuePct}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handlePlayClick}
            className="library-hero-play inline-flex items-center gap-2.5 px-7 py-2.5 text-sm font-semibold min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{primaryLabel}</span>
          </button>

          <button
            type="button"
            onClick={handleDetails}
            className="library-hero-more inline-flex items-center px-6 py-2.5 text-sm font-medium min-h-11 hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
          >
            פרטים
          </button>
        </div>
      </div>
    </section>
  );
};
