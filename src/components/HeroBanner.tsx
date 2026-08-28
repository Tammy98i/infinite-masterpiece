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
  const { setView, user } = useApp();
  const { goWatch } = useWatchAccess();

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
      className="relative w-full min-h-[620px] md:h-[78vh] flex items-end overflow-hidden pt-24 pb-28 md:pb-36"
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#010308] via-[#010308]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-l from-[#010308]/90 via-[#010308]/40 to-transparent w-full md:w-[65%] ms-auto" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 w-full z-10 text-right md:max-w-2xl md:ms-0 md:me-auto">
        <p className="text-[#C8A24C] text-xs sm:text-sm font-medium tracking-[0.18em] mb-4">
          {continueWatching ? 'המשך צפייה' : 'מומלץ הערב'}
        </p>

        <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-bold text-white leading-[1.1] mb-5">
          {course.title}
        </h1>

        <p className="text-sm sm:text-base text-white/75 font-light leading-relaxed max-w-xl mb-6 line-clamp-2">
          {course.subtitle || course.description}
        </p>

        {continueWatching && (
          <div className="max-w-sm mb-7">
            <div className="flex items-center justify-between text-[11px] text-white/55 mb-2" id="hero-progress-label">
              <span>
                {formatClock(continueWatching.currentTime)} / {formatClock(continueWatching.duration)}
              </span>
              <span>המשך צפייה</span>
            </div>
            <div
              className="h-[3px] rounded-full bg-white/15 overflow-hidden"
              role="progressbar"
              aria-labelledby="hero-progress-label"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={continuePct}
            >
              <div className="h-full bg-[#C8A24C]" style={{ width: `${continuePct}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handlePlayClick}
            className="inline-flex items-center gap-2.5 px-8 py-3 rounded-full bg-[#C8A24C] text-black font-semibold text-sm hover:bg-[#F7E7B5] transition-colors min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>{primaryLabel}</span>
          </button>

          <button
            type="button"
            onClick={handleDetails}
            className="inline-flex items-center px-7 py-3 rounded-full border border-white/35 text-white font-medium text-sm hover:bg-white/10 transition-colors min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            פרטים
          </button>
        </div>
      </div>
    </section>
  );
};
