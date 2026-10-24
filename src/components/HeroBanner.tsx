import React from 'react';
import { Course } from '../types';
import { useApp } from '../context/AppContext';
import { ClockLabel } from './ClockLabel';
import { useWatchAccess } from '../utils/useWatchAccess';
import { canPreviewEpisode, canWatchEpisode } from '../utils/access';
import { getCardAccessState } from '../utils/libraryHome';
import { trackEvent } from '../utils/analytics';
import '../styles/LibraryCharcoalHero.css';

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
      className="library-charcoal-hero"
      dir="rtl"
      aria-label={continueWatching ? `המשך צפייה: ${course.title}` : `מומלץ: ${course.title}`}
    >
      <img
        className="charcoal-sky"
        src="https://media.base44.com/images/public/6aa94dfb715e7d446231f544/39d83ce2e_generated_af120ace.png"
        alt=""
      />
      <div className="charcoal-shade" aria-hidden="true" />
      <div className="charcoal-inner">
        <div className="charcoal-copy">
          <p className="charcoal-eyebrow">
            {continueWatching ? 'המשיכו מכאן' : 'הרצאה נבחרת'}
          </p>
          <h1 className="charcoal-title">{course.title}</h1>
          <p className="charcoal-meta">
            {instructor ? <>{instructor.name} <span aria-hidden="true">·</span> </> : null}
            <ClockLabel seconds={totalSecs} />
          </p>
          <p className="charcoal-description">{course.subtitle || course.description}</p>
          <div className="charcoal-actions">
            <button className="charcoal-button primary" type="button" onClick={handlePlayClick}>
              {primaryLabel}
            </button>
            <button className="charcoal-button" type="button" onClick={handleDetails}>
              לפרטים נוספים
            </button>
          </div>
        </div>
        <div className="charcoal-balance" aria-hidden="true" />
      </div>
    </section>
  );
};
