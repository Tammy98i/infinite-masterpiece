import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Play,
  Pause,
  Bookmark,
  BookmarkCheck,
  Lock,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { formatClock } from '../utils/time';
import { canPreviewEpisode, canWatchEpisode, PREVIEW_SECONDS } from '../utils/access';
import { playbackApi } from '../api/playback';
import { trackEvent } from '../utils/analytics';
import { AuthRequiredDialog } from '../components/AuthRequiredDialog';
import { AccessEndCard } from '../components/AccessEndCard';
import { CategoryRow } from '../components/CategoryRow';
import {
  completedChapterCount,
  episodeDisplayName,
  episodeUiAccess,
  resolvePrimaryCta,
  timeBasedCourseProgress,
} from '../utils/coursePage';
import { coursesInCategory } from '../utils/recommendations';
import { getCardAccessState } from '../utils/libraryHome';

type InfoTab = 'course' | 'instructor';

export const CourseDetailView: React.FC = () => {
  const {
    courses,
    selectedCourseId,
    instructors,
    setView,
    isInMyList,
    toggleMyList,
    watchProgress,
    updateProgress,
    user,
    isGuest,
    setAuthModalOpen,
    catalogStatus,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const course = courses.find((c) => c.id === selectedCourseId);
  const instructor = course ? instructors.find((i) => i.id === course.instructorId) : undefined;

  const chapterFromUrl = useMemo(() => {
    const q = new URLSearchParams(location.search).get('chapter');
    return q || null;
  }, [location.search]);

  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);
  const [playerOn, setPlayerOn] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerError, setPlayerError] = useState(false);
  const [infoTab, setInfoTab] = useState<InfoTab>('course');
  const [toast, setToast] = useState('');
  const [authRequiredOpen, setAuthRequiredOpen] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [playbackMode, setPlaybackMode] = useState<'full' | 'preview'>('full');
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [accessCardSource, setAccessCardSource] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [captionTracks, setCaptionTracks] = useState<
    Array<{ src: string; label: string; srclang: string; kind?: 'subtitles' | 'captions'; default?: boolean }>
  >([]);
  const [captionsOn, setCaptionsOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaveRef = useRef(0);
  const progressMarks = useRef({ p25: false, p50: false, p75: false, completed: false });

  const isSaved = course ? isInMyList(course.id) : false;

  useEffect(() => {
    if (!course) return;
    document.title = `${course.title} | Infinite Masterpiece`;
    const desc = course.subtitle || course.description.slice(0, 155);
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', course.title);

    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', course.coverImage);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}/library/course/${encodeURIComponent(course.id)}`;

    if (course.status && course.status !== 'published') {
      let robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement('meta');
        robots.setAttribute('name', 'robots');
        document.head.appendChild(robots);
      }
      robots.setAttribute('content', 'noindex');
    }

    trackEvent('course_view', {
      course_id: course.id,
      course_slug: course.id,
      user_state: isGuest ? 'guest' : user.subscriptionPlan,
    });
    return () => {
      document.title = 'Infinite Masterpiece';
    };
  }, [course?.id]);

  // Resolve active chapter from URL → continue → first available
  useEffect(() => {
    if (!course) return;
    const cta = resolvePrimaryCta(course, user, watchProgress);
    const fromUrl = chapterFromUrl && course.episodes.find((e) => e.id === chapterFromUrl);
    const nextId = fromUrl?.id || cta.episodeId || course.episodes[0]?.id || null;
    setActiveEpisodeId(nextId);
    setPlayerOn(false);
    setIsPlaying(false);
    setPlayerError(false);
    setPlaybackUrl('');
    setShowEndOverlay(false);
    setAccessCardSource(null);
    progressMarks.current = { p25: false, p50: false, p75: false, completed: false };
  }, [course?.id, chapterFromUrl]);

  const activeEpisode = course?.episodes.find((e) => e.id === activeEpisodeId) || course?.episodes[0];
  const cta = course ? resolvePrimaryCta(course, user, watchProgress) : null;
  const completedCount = course ? completedChapterCount(course, watchProgress) : 0;
  const timeProgress = course ? timeBasedCourseProgress(course, watchProgress) : 0;
  const episodeCount = course?.episodes.length || 0;
  const activeIndex = course && activeEpisode ? course.episodes.findIndex((e) => e.id === activeEpisode.id) : -1;
  const nextEpisode =
    course && activeIndex >= 0 && activeIndex < course.episodes.length - 1
      ? course.episodes[activeIndex + 1]
      : undefined;
  const nextLocked =
    !!nextEpisode &&
    !canWatchEpisode(nextEpisode, user, course) &&
    !canPreviewEpisode(nextEpisode, user, course);
  const relatedCourses = useMemo(() => {
    if (!course) return [];
    return coursesInCategory(courses, course.categoryId)
      .filter((item) => item.id !== course.id)
      .slice(0, 8);
  }, [course, courses]);
  const courseAccess = course ? getCardAccessState(course, user) : 'locked';
  const accessLabel =
    courseAccess === 'open' ? 'פתוח לצפייה' : courseAccess === 'preview' ? 'טעימה' : 'דורש מנוי';

  const setChapterInUrl = useCallback(
    (episodeId: string, replace = false) => {
      if (!course) return;
      const path = `/library/course/${encodeURIComponent(course.id)}?chapter=${encodeURIComponent(episodeId)}`;
      navigate(path, { replace });
      setActiveEpisodeId(episodeId);
    },
    [course, navigate]
  );

  const saveProgressNow = useCallback(() => {
    if (!course || !activeEpisode || !videoRef.current) return;
    const v = videoRef.current;
    updateProgress(course.id, activeEpisode.id, v.currentTime, v.duration || activeEpisode.duration);
  }, [course, activeEpisode, updateProgress]);

  const startPlayback = useCallback(
    async (episodeId: string, source = 'course') => {
      if (!course) return;
      const ep = course.episodes.find((e) => e.id === episodeId);
      if (!ep) return;

      const canFull = canWatchEpisode(ep, user, course);
      const canPrev = canPreviewEpisode(ep, user, course);
      if (!canFull && !canPrev) {
        trackEvent('course_locked_chapter_click', {
          course_id: course.id,
          chapter_id: ep.id,
        });
        setChapterInUrl(episodeId);
        setAccessCardSource('locked_card');
        trackEvent('course_access_dialog_view', { course_id: course.id, chapter_id: ep.id });
        return;
      }

      setChapterInUrl(episodeId);
      setSessionLoading(true);
      setPlayerError(false);
      setShowEndOverlay(false);
      setAccessCardSource(null);
      try {
        const session = await playbackApi.createSession(ep.id);
        setPlaybackUrl(session.playbackUrl);
        setPlaybackMode(session.mode);
        setCaptionTracks(session.captionTracks || ep.captionTracks || []);
        setPlayerOn(true);
        setIsPlaying(true);
        trackEvent(source === 'resume' ? 'course_resume_started' : 'course_play_started', {
          course_id: course.id,
          courseId: course.id,
          chapter_id: ep.id,
          access_state: session.mode,
        });
      } catch (err) {
        // Seed/offline fallback only when a local URL still exists
        if (ep.videoUrl) {
          setPlaybackUrl(ep.videoUrl);
          setPlaybackMode(canFull ? 'full' : 'preview');
          setCaptionTracks(ep.captionTracks || []);
          setPlayerOn(true);
          setIsPlaying(true);
        } else {
          setPlayerError(true);
          setPlayerOn(true);
          setToast(err instanceof Error ? err.message : 'לא הצלחנו להפעיל את הפרק');
        }
      } finally {
        setSessionLoading(false);
      }
    },
    [course, user, setChapterInUrl]
  );

  const handlePrimaryCta = () => {
    if (!course || !cta) return;
    trackEvent('course_primary_cta_click', {
      course_id: course.id,
      mode: cta.mode,
    });
    if (cta.mode === 'access') {
      setAccessCardSource('course');
      trackEvent('course_access_dialog_view', { course_id: course.id });
      return;
    }
    if (cta.episodeId) void startPlayback(cta.episodeId, cta.mode === 'resume' ? 'resume' : 'play');
  };

  const handleListToggle = () => {
    if (!course) return;
    if (isGuest) {
      setAuthRequiredOpen(true);
      return;
    }
    const adding = !isSaved;
    toggleMyList(course.id);
    trackEvent(adding ? 'course_add_to_list' : 'course_remove_from_list', {
      course_id: course.id,
    });
    setToast(adding ? 'נוסף לרשימה' : 'הוסר מהרשימה');
  };

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2500);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Wire video element when player turns on / episode changes
  useEffect(() => {
    if (!playerOn || !activeEpisode || !videoRef.current || !course || !playbackUrl) return;
    const video = videoRef.current;
    const prog = watchProgress[`${course.id}_${activeEpisode.id}`];
    const previewing = playbackMode === 'preview';

    const startAt =
      prog && prog.currentTime > 5 && !prog.completed
        ? previewing
          ? Math.min(prog.currentTime, PREVIEW_SECONDS - 1)
          : Math.max(0, prog.currentTime - 5)
        : 0;

    const onLoaded = () => {
      if (startAt > 0) video.currentTime = startAt;
      video.muted = muted;
      for (const track of Array.from(video.textTracks) as TextTrack[]) {
        track.mode = captionsOn ? 'showing' : 'hidden';
      }
      void video.play().catch(() => {
        setIsPlaying(false);
        setPlayerError(true);
      });
    };

    video.addEventListener('loadedmetadata', onLoaded, { once: true });
    video.load();
    return () => video.removeEventListener('loadedmetadata', onLoaded);
  }, [playerOn, activeEpisode?.id, playbackUrl, playbackMode, captionsOn]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    for (const track of Array.from(video.textTracks) as TextTrack[]) {
      track.mode = captionsOn ? 'showing' : 'hidden';
    }
  }, [captionsOn]);

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !course || !activeEpisode) return;
    setCurrentTime(video.currentTime);
    setDuration(video.duration || activeEpisode.duration);

    if (playbackMode === 'preview' && video.currentTime >= PREVIEW_SECONDS) {
      video.pause();
      setIsPlaying(false);
      setAccessCardSource('preview_limit');
      return;
    }

    const now = Date.now();
    if (now - lastSaveRef.current >= 15000) {
      lastSaveRef.current = now;
      updateProgress(course.id, activeEpisode.id, video.currentTime, video.duration || activeEpisode.duration);
    }

    const pct = video.duration ? video.currentTime / video.duration : 0;
    if (pct >= 0.25 && !progressMarks.current.p25) {
      progressMarks.current.p25 = true;
      trackEvent('course_chapter_progress_25', { course_id: course.id, chapter_id: activeEpisode.id });
    }
    if (pct >= 0.5 && !progressMarks.current.p50) {
      progressMarks.current.p50 = true;
      trackEvent('course_chapter_progress_50', { course_id: course.id, chapter_id: activeEpisode.id });
    }
    if (pct >= 0.75 && !progressMarks.current.p75) {
      progressMarks.current.p75 = true;
      trackEvent('course_chapter_progress_75', { course_id: course.id, chapter_id: activeEpisode.id });
    }
  };

  const onPause = () => {
    setIsPlaying(false);
    saveProgressNow();
  };

  const onEnded = () => {
    if (!course || !activeEpisode) return;
    updateProgress(course.id, activeEpisode.id, activeEpisode.duration, activeEpisode.duration);
    trackEvent('course_chapter_completed', { course_id: course.id, chapter_id: activeEpisode.id });
    setIsPlaying(false);
    setShowEndOverlay(true);
  };

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') saveProgressNow();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [saveProgressNow]);

  if (!course) {
    if (catalogStatus === 'loading') {
      return (
        <div className="library-catalog-page min-h-screen text-white pt-28 px-4 sm:px-8 max-w-[1360px] mx-auto animate-pulse">
          <div className="h-4 w-48 bg-white/10 rounded mb-8" />
          <div className="h-10 w-2/3 bg-white/10 rounded mb-4" />
          <div className="aspect-video bg-white/10 rounded-[4px]" />
        </div>
      );
    }
    return (
      <div className="library-catalog-page min-h-screen text-white pt-28 px-4 text-center">
        <h1 className="text-2xl font-semibold mb-4">הקורס לא נמצא</h1>
        <button
          type="button"
          onClick={() => setView('home')}
          className="library-hero-play inline-flex items-center justify-center px-6 py-3 text-sm font-semibold min-h-11"
        >
          חזרה לספרייה
        </button>
      </div>
    );
  }

  const totalDuration = course.episodes.reduce((s, ep) => s + ep.duration, 0);

  return (
    <div className="library-catalog-page library-course-page min-h-screen text-white pb-16">
      <header className="library-course-billboard relative min-h-[58vh] md:min-h-[70vh] flex items-end overflow-hidden pt-24 pb-16 md:pb-20">
        <div className="absolute inset-0 select-none overflow-hidden">
          <img
            src={course.backdropImage || course.coverImage}
            alt=""
            aria-hidden
            className="w-full h-full object-cover object-center scale-105"
          />
          <div className="library-course-veil-a absolute inset-0" />
          <div className="library-course-veil-b absolute inset-0" />
          <div className="library-course-veil-c absolute inset-0" />
          <div className="library-course-veil-d absolute inset-0" />
        </div>

        <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-8 w-full text-right">
          <nav className="mb-6 text-sm text-white/70" aria-label="ניווט משני">
            <button
              type="button"
              onClick={() => setView('home')}
              className="hover:text-white min-h-11 inline-flex items-center"
            >
              ספרייה
            </button>
            <span className="mx-2 text-white/35" aria-hidden>
              ›
            </span>
            <span className="text-white">{course.title}</span>
          </nav>

          <h1 className="text-4xl sm:text-6xl lg:text-[4.5rem] font-bold text-white leading-[1.05] tracking-tight mb-4 max-w-4xl">
            {course.title}
          </h1>

          {course.subtitle ? (
            <p className="text-sm sm:text-base text-white/80 font-light leading-relaxed max-w-2xl mb-4 line-clamp-3">
              {course.subtitle}
            </p>
          ) : null}

          <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/80">
            {instructor ? <span>{instructor.name}</span> : null}
            {instructor ? <span aria-hidden>·</span> : null}
            <span>{formatClock(totalDuration)}</span>
            <span aria-hidden>·</span>
            <span>
              {completedCount} מתוך {episodeCount} פרקים
            </span>
            <span aria-hidden>·</span>
            <span>{accessLabel}</span>
          </p>

          {instructor ? (
            <button
              type="button"
              onClick={() => setView('instructor', { instructorId: instructor.id })}
              aria-label={`${instructor.name}, ${instructor.title}`}
              className="inline-flex items-center gap-3 mb-5 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043] rounded"
            >
              <img
                src={instructor.avatarUrl}
                alt=""
                aria-hidden
                className="w-11 h-11 rounded-full object-cover"
                loading="lazy"
              />
              <span className="text-right">
                <span className="block text-sm font-medium text-white">{instructor.name}</span>
                <span className="block text-[13px] text-white/60">{instructor.title}</span>
              </span>
            </button>
          ) : null}

          <div className="mb-6 max-w-md">
            <p className="text-[13px] text-white/70 mb-2" id="course-progress-label">
              {completedCount} מתוך {episodeCount} פרקים
              <span className="text-white/35"> · </span>
              {formatClock(totalDuration)}
            </p>
            <div
              className="h-1 rounded-full bg-white/15 overflow-hidden"
              role="progressbar"
              aria-labelledby="course-progress-label"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(timeProgress)}
              aria-valuetext={`${Math.round(timeProgress)} אחוז מהקורס`}
            >
              <div
                className={`h-full transition-all ${timeProgress > 0 ? 'bg-[#b79043]' : 'bg-transparent'}`}
                style={{ width: `${timeProgress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="library-hero-play inline-flex items-center justify-center gap-2.5 px-7 py-2.5 text-sm font-semibold min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
            >
              <Play className="w-5 h-5 fill-current" />
              {cta?.label || 'התחילו לצפות'}
            </button>
            <button
              type="button"
              onClick={handleListToggle}
              className="library-hero-more inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {isSaved ? 'הסרה מהרשימה' : 'הוספה לרשימה'}
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-8 max-w-[1360px] mx-auto px-4 sm:px-8 text-right">
        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6 mb-10">
          <section aria-label="נגן הקורס" className="min-w-0">
            <div className="library-course-stage relative aspect-video overflow-hidden bg-black">
              {playerOn && activeEpisode ? (
                <>
                  {sessionLoading || !playbackUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-white/60">
                      טוען נגן...
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-contain bg-black"
                      src={playbackUrl}
                      playsInline
                      muted={muted}
                      controls={false}
                      onTimeUpdate={onTimeUpdate}
                      onPlay={() => setIsPlaying(true)}
                      onPause={onPause}
                      onEnded={onEnded}
                      onError={() => setPlayerError(true)}
                    >
                      {captionTracks.map((t) => (
                        <track
                          key={t.src}
                          kind={t.kind || 'subtitles'}
                          src={t.src}
                          srcLang={t.srclang}
                          label={t.label}
                          default={Boolean(t.default)}
                        />
                      ))}
                    </video>
                  )}
                  {playerError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
                      <p className="text-sm text-white/70">לא הצלחנו להפעיל את הפרק</p>
                      <button
                        type="button"
                        onClick={() => void startPlayback(activeEpisode.id)}
                        className="library-hero-play px-5 py-2.5 text-sm"
                      >
                        ניסיון נוסף
                      </button>
                    </div>
                  ) : showEndOverlay && !accessCardSource ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 p-6 text-center">
                      <p className="text-base text-white">הפרק הסתיים</p>
                      {nextEpisode && !nextLocked ? (
                        <button
                          type="button"
                          onClick={() => void startPlayback(nextEpisode.id)}
                          className="library-hero-play px-6 py-3 text-sm"
                        >
                          לפרק הבא
                        </button>
                      ) : nextEpisode && nextLocked ? (
                        <button
                          type="button"
                          onClick={() => setAccessCardSource('locked_card')}
                          className="library-hero-play px-6 py-3 text-sm"
                        >
                          פתיחת גישה
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          setShowEndOverlay(false);
                          if (videoRef.current) {
                            videoRef.current.currentTime = 0;
                            void videoRef.current.play();
                          }
                        }}
                        className="text-sm text-white/50 hover:text-white min-h-11"
                      >
                        צפייה חוזרת בפרק
                      </button>
                    </div>
                  ) : (
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 to-transparent flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const v = videoRef.current;
                          if (!v) return;
                          if (v.paused) void v.play();
                          else v.pause();
                        }}
                        className="w-11 h-11 rounded-full bg-white text-[#141414] flex items-center justify-center"
                        aria-label={isPlaying ? 'השהיה' : 'הפעלה'}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="h-1 rounded-full bg-white/20 overflow-hidden mb-1.5">
                          <div
                            className="h-full bg-[#b79043]"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  ((currentTime || 0) / Math.max(1, duration || activeEpisode.duration)) * 100
                                )
                              )}%`,
                            }}
                            aria-hidden
                          />
                        </div>
                        <div className="text-[12px] text-white/70 tabular-nums">
                          {formatClock(currentTime)} / {formatClock(duration || activeEpisode.duration)}
                        </div>
                      </div>
                      {captionTracks.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setCaptionsOn((v) => !v)}
                          className={`px-3 py-2 rounded-[4px] text-[12px] min-h-11 border ${
                            captionsOn
                              ? 'border-[#b79043] text-[#dfc47d]'
                              : 'border-white/20 text-white/50'
                          }`}
                          aria-pressed={captionsOn}
                        >
                          כתוביות
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          const next = !muted;
                          setMuted(next);
                          if (videoRef.current) videoRef.current.muted = next;
                        }}
                        className="p-2.5 text-white/70 hover:text-white min-h-11 min-w-11 flex items-center justify-center cursor-pointer"
                        aria-label={muted ? 'הפעלת שמע' : 'השתקה'}
                      >
                        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <img
                    src={course.backdropImage || course.coverImage}
                    alt=""
                    aria-hidden
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/45" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/20 to-transparent" />
                  <button
                    type="button"
                    onClick={() => {
                      if (activeEpisode) void startPlayback(activeEpisode.id, cta?.mode === 'resume' ? 'resume' : 'play');
                      else handlePrimaryCta();
                    }}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white text-[#141414] flex items-center justify-center hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
                    aria-label={cta?.label || 'התחילו לצפות'}
                  >
                    <Play className="w-7 h-7 fill-current ml-1" />
                  </button>
                </>
              )}
              {accessCardSource ? (
                <AccessEndCard
                  source={accessCardSource}
                  courseTitle={course.title}
                  onDismiss={() => setAccessCardSource(null)}
                />
              ) : null}
            </div>
            {activeEpisode && (
              <p className="mt-3 text-sm text-white/60">
                פרק {activeEpisode.episodeNumber}: {episodeDisplayName(activeEpisode.title)}
              </p>
            )}
          </section>

          <section
            aria-labelledby="chapters-heading"
            className="min-w-0 flex flex-col lg:max-h-[min(100%,calc((100vw-4rem)*0.62*9/16))] xl:max-h-none"
          >
            <h2 id="chapters-heading" className="library-rail-title text-white mb-3">
              פרקים
            </h2>
            <ul
              className={`flex flex-col ${
                course.episodes.length > 3 ? 'overflow-y-auto lg:flex-1 pe-1' : ''
              }`}
            >
              {course.episodes.map((ep) => {
                const access = episodeUiAccess(ep, user, course);
                const prog = watchProgress[`${course.id}_${ep.id}`];
                const isActive = ep.id === activeEpisodeId;
                const done = Boolean(prog?.completed);
                const partial =
                  prog && !done && prog.currentTime >= 30
                    ? Math.round((prog.currentTime / Math.max(1, prog.duration)) * 100)
                    : 0;

                return (
                  <li key={ep.id}>
                    <button
                      type="button"
                      aria-current={isActive ? 'true' : undefined}
                      aria-label={`פרק ${ep.episodeNumber}: ${episodeDisplayName(ep.title)}${
                        access === 'locked' ? ', דורש מנוי' : access === 'preview' ? ', טעימה' : ''
                      }${done ? ', הושלם' : ''}`}
                      onClick={() => {
                        trackEvent('course_chapter_selected', {
                          course_id: course.id,
                          chapter_id: ep.id,
                          chapter_order: String(ep.episodeNumber),
                        });
                        if (access === 'locked') {
                          void startPlayback(ep.id);
                          return;
                        }
                        saveProgressNow();
                        setChapterInUrl(ep.id);
                        if (playerOn) void startPlayback(ep.id);
                      }}
                      className={`library-episode-row w-full text-right p-3 transition-colors min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043] ${
                        isActive ? 'is-active' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="relative w-[88px] sm:w-[108px] aspect-video overflow-hidden rounded-[4px] bg-zinc-900 shrink-0">
                          <img
                            src={course.coverImage}
                            alt=""
                            aria-hidden
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute inset-0 bg-black/25" />
                          <span className="absolute inset-0 flex items-center justify-center">
                            {access === 'locked' ? (
                              <Lock className="w-4 h-4 text-white/80" aria-hidden />
                            ) : (
                              <Play
                                className={`w-4 h-4 ${isActive ? 'text-white fill-white' : 'text-white/80 fill-white/80'}`}
                                aria-hidden
                              />
                            )}
                          </span>
                          {partial > 0 && !done ? (
                            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/20">
                              <span className="block h-full bg-[#b79043]" style={{ width: `${partial}%` }} />
                            </span>
                          ) : null}
                        </span>
                        <span className="text-sm text-white/40 tabular-nums w-5 shrink-0 pt-1">
                          {ep.episodeNumber}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-medium text-white leading-snug line-clamp-2">
                            {episodeDisplayName(ep.title)}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-white/50">
                            <span className="tabular-nums">{formatClock(ep.duration)}</span>
                            {access === 'open' && <span className="text-[#b79043]">פתוח</span>}
                            {access === 'preview' && <span className="text-[#dfc47d]">טעימה</span>}
                            {access === 'locked' && (
                              <span className="inline-flex items-center gap-1 text-white/45">
                                <Lock className="w-3 h-3" aria-hidden />
                                דורש מנוי
                              </span>
                            )}
                            {done && (
                              <span className="inline-flex items-center gap-1 text-white/45">
                                <Check className="w-3.5 h-3.5" aria-hidden />
                                הושלם
                              </span>
                            )}
                            {partial > 0 && !done && <span>המשך מ־{formatClock(prog!.currentTime)}</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {course.episodes.length === 0 && (
              <p className="text-sm text-white/50">הפרקים עדיין אינם זמינים</p>
            )}
          </section>
        </div>

        {relatedCourses.length > 0 ? (
          <CategoryRow
            id="rail-more-like"
            title="עוד בקטלוג"
            courses={relatedCourses}
            sectionName="more_like_this"
          />
        ) : null}

        <div className="mb-4 lg:hidden flex gap-2 border-b border-white/10 pb-2" role="tablist" aria-label="מידע על הקורס">
          {(
            [
              ['course', 'על הקורס', 'panel-about-course'],
              ['instructor', 'על המרצה', 'panel-about-instructor'],
            ] as const
          ).map(([id, label, panelId]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={infoTab === id}
              aria-controls={panelId}
              tabIndex={infoTab === id ? 0 : -1}
              onClick={() => setInfoTab(id)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault();
                  setInfoTab(infoTab === 'course' ? 'instructor' : 'course');
                }
              }}
              className={`px-4 py-2 rounded-[4px] text-sm min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043] ${
                infoTab === id ? 'bg-white text-[#141414] font-semibold' : 'text-white/55 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 pb-8">
          <section
            id="panel-about-course"
            role="tabpanel"
            aria-labelledby="about-course-heading"
            className={`${infoTab === 'course' ? 'block' : 'hidden'} lg:block`}
          >
            <h2 id="about-course-heading" className="library-rail-title text-white mb-4">
              על הקורס
            </h2>
            <p className="text-[15px] sm:text-base text-white/70 font-light leading-relaxed max-w-[65ch]">
              {course.description}
            </p>
            {course.whatYouWillLearn?.length > 0 && (
              <ul className="mt-5 space-y-2 text-[14px] text-white/60">
                {course.whatYouWillLearn.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="w-4 h-4 text-[#b79043] shrink-0 mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            id="panel-about-instructor"
            role="tabpanel"
            aria-labelledby="about-instructor-heading"
            className={`${infoTab === 'instructor' ? 'block' : 'hidden'} lg:block`}
          >
            <h2 id="about-instructor-heading" className="library-rail-title text-white mb-4">
              על המרצה
            </h2>
            {instructor ? (
              <div className="library-instructor-card p-4">
                <img
                  src={instructor.avatarUrl}
                  alt={instructor.name ? `תמונת פרופיל: ${instructor.name}` : 'תמונת מרצה'}
                  className="w-full max-w-[280px] aspect-[3/4] object-contain object-center rounded-[4px] mb-4 bg-[#141414]"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => setView('instructor', { instructorId: instructor.id })}
                  className="text-base font-medium text-white hover:text-[#dfc47d] min-h-11"
                >
                  {instructor.name}
                </button>
                <p className="text-[13px] text-[#b79043]/90 mt-1">{instructor.title}</p>
                {instructor.bio && (
                  <p className="text-[14px] text-white/55 font-light leading-relaxed mt-3">{instructor.bio}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/45">פרטי המרצה אינם זמינים</p>
            )}
          </section>
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {toast}
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-full bg-zinc-900 border border-white/15 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
      <AuthRequiredDialog
        open={authRequiredOpen}
        title="נדרשת התחברות"
        body="כדי להוסיף לרשימה צריך להתחבר לחשבון."
        onClose={() => setAuthRequiredOpen(false)}
        onLogin={() => {
          setAuthRequiredOpen(false);
          setAuthModalOpen(true);
        }}
      />
    </div>
  );
};
