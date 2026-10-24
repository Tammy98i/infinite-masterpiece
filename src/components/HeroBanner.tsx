import React from 'react';
import { Course } from '../types';
import { useApp } from '../context/AppContext';
import { Play } from 'lucide-react';
import { ClockLabel } from './ClockLabel';
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
      className="library-hero soundstage-hero relative w-full pt-28 pb-8 md:pt-32 md:pb-12 px-4 sm:px-8 lg:px-10"
      aria-label={continueWatching ? `המשך צפייה: ${course.title}` : `מומלץ: ${course.title}`}
    >
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-stretch lg:items-center gap-8 lg:gap-12">
        <div className="soundstage-viewfinder w-full lg:w-[55%] xl:w-[760px] shrink-0">
          <div className="soundstage-scope relative overflow-hidden">
            <img
              {...responsiveImageAttrs(course.backdropImage || course.coverImage, {
                widths: [768, 1200, 1600, 2000],
                sizes: '(max-width: 1024px) 100vw, 760px',
                defaultWidth: 1200,
              })}
              alt=""
              aria-hidden
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover object-center"
            />
            <div className="soundstage-scope-vignette absolute inset-0 pointer-events-none" />
            <span className="soundstage-timecode font-mono">
              <ClockLabel seconds={totalSecs} />
            </span>
            <button
              type="button"
              onClick={handlePlayClick}
              aria-label={`${primaryLabel}: ${course.title}`}
              className="soundstage-scope-trigger absolute inset-0 flex items-center justify-center group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D99B43] focus-visible:ring-inset"
            >
              <span className="soundstage-scope-play flex items-center justify-center w-14 h-14 rounded-full transition-transform duration-200 group-hover:scale-105">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </span>
            </button>
          </div>
        </div>

        <div className="soundstage-hero-copy flex-1 text-start min-w-0">
          <p className="soundstage-eyebrow font-mono mb-3">
            {continueWatching ? 'המשיכו מכאן' : 'הרצאה נבחרת'}
          </p>
          <h1 className="soundstage-hero-title text-4xl sm:text-5xl xl:text-[4.25rem] font-black text-[#F2EFEB] leading-[1.05] tracking-tight mb-4">
            {course.title}
          </h1>

          <div className="mb-4 flex flex-wrap items-center gap-3 text-[15px] text-[#d4c5a9]">
            {instructor ? <span className="font-medium text-[#F2EFEB]">{instructor.name}</span> : null}
            <span className="soundstage-badge font-mono">
              <ClockLabel seconds={totalSecs} />
            </span>
            {continueWatching?.episodeTitle ? (
              <span className="text-sm text-[#dfc47d]">· {continueWatching.episodeTitle}</span>
            ) : null}
          </div>

          <p className="text-base sm:text-lg text-[#e5dccb]/85 leading-relaxed max-w-xl mb-7 line-clamp-3">
            {course.subtitle || course.description}
          </p>

          <div className="flex items-center gap-3.5 flex-wrap">
            <button
              type="button"
              onClick={handlePlayClick}
              className="library-hero-play soundstage-btn-primary inline-flex items-center gap-2.5 px-8 py-3.5 text-base font-bold min-h-11 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D99B43]"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{primaryLabel}</span>
            </button>

            <button
              type="button"
              onClick={handleDetails}
              className="library-hero-more soundstage-btn-secondary inline-flex items-center px-7 py-3.5 text-base font-semibold min-h-11 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D99B43]"
            >
              לפרטים נוספים
            </button>
          </div>

          {continueWatching ? (
            <div className="max-w-md mt-6">
              <div className="flex items-center justify-between text-[11px] text-[#dfc47d] mb-2 font-mono" id="hero-progress-label">
                <span>
                  <ClockLabel seconds={continueWatching.currentTime} /> / <ClockLabel seconds={continueWatching.duration} />
                </span>
                <span>המשך צפייה</span>
              </div>
              <div
                className="soundstage-progress h-1 rounded-full overflow-hidden"
                role="progressbar"
                aria-labelledby="hero-progress-label"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={continuePct}
              >
                <div className="soundstage-progress-bar h-full" style={{ width: `${continuePct}%` }} />
              </div>
            </div>
          ) : (
            <div className="soundstage-progress max-w-md mt-6 h-[3px] rounded-full overflow-hidden" aria-hidden="true">
              <div className="soundstage-progress-bar h-full w-1/3" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
