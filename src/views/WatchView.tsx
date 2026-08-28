import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { usePaywall } from '../context/PaywallContext';
import { ArrowRight, Lock, Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { formatClock } from '../utils/time';
import { canPreviewEpisode, canWatchEpisode, episodeAccess, hasFullLibraryAccess, PREVIEW_SECONDS } from '../utils/access';
import { trackEvent } from '../utils/analytics';
import { playbackApi } from '../api/playback';
import { PlayerSkeleton } from '../components/LibraryStates';
import { useA11yPrefs } from '../a11y/prefs';

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;
const SPEED_KEY = 'mc_playback_rate';

function readSpeed() {
  try {
    const value = Number(localStorage.getItem(SPEED_KEY));
    return SPEED_OPTIONS.includes(value as (typeof SPEED_OPTIONS)[number]) ? value : 1;
  } catch {
    return 1;
  }
}

function episodeName(title: string) {
  return title.replace(/^פרק\s+\d+\s*[:·-]\s*/, '');
}

export const WatchView: React.FC = () => {
  const {
    courses,
    selectedCourseId,
    selectedEpisodeId,
    setView,
    updateProgress,
    watchProgress,
    user,
  } = useApp();
  const { isOpen: paywallOpen, openPaywall } = usePaywall();
  const { muteMedia } = useA11yPrefs();
  const skipPaywallClose = useRef(true);

  const course = courses.find((c) => c.id === selectedCourseId);
  const episodeIndex = course?.episodes.findIndex((e) => e.id === selectedEpisodeId) ?? -1;
  const episode = course?.episodes[episodeIndex !== -1 ? episodeIndex : 0];
  const nextEpisode = course && episodeIndex >= 0 ? course.episodes[episodeIndex + 1] : undefined;

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(episode?.duration || 0);
  const [muted, setMuted] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(readSpeed);
  const [showChrome, setShowChrome] = useState(true);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [playbackError, setPlaybackError] = useState('');
  const [captionTracks, setCaptionTracks] = useState<
    Array<{ src: string; label: string; srclang: string; kind?: 'subtitles' | 'captions'; default?: boolean }>
  >([]);
  const [captionsOn, setCaptionsOn] = useState(true);

  const savedProg = course && episode ? watchProgress[`${course.id}_${episode.id}`] : undefined;
  const remaining = Math.max(0, duration - currentTime);
  const paid = canWatchEpisode(episode, user, course);
  const previewing = Boolean(episode) && !paid && canPreviewEpisode(episode, user, course);
  const locked = Boolean(episode) && !paid && !previewing;
  const nextLocked = !!nextEpisode && !canWatchEpisode(nextEpisode, user, course) && !canPreviewEpisode(nextEpisode, user, course);
  const marks = useRef({ started: false, p25: false, p50: false, p75: false, completed: false });

  const revealChrome = useCallback(() => {
    setShowChrome(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !showEpisodes) setShowChrome(false);
    }, 2500);
  }, [showEpisodes]);

  useEffect(() => {
    marks.current = { started: false, p25: false, p50: false, p75: false, completed: false };
  }, [episode?.id]);

  useEffect(() => {
    if (!episode || locked) {
      setPlaybackUrl('');
      return;
    }
    let cancelled = false;
    setPlaybackError('');
    setPlaybackUrl('');
    void playbackApi
      .createSession(episode.id)
      .then((session) => {
        if (cancelled) return;
        setPlaybackUrl(session.playbackUrl);
        setCaptionTracks(session.captionTracks || episode.captionTracks || []);
      })
      .catch((err) => {
        if (cancelled) return;
        if (episode.videoUrl) {
          setPlaybackUrl(episode.videoUrl);
          setCaptionTracks(episode.captionTracks || []);
        } else {
          setPlaybackError(err instanceof Error ? err.message : 'לא הצלחנו להפעיל את הפרק');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [episode?.id, locked]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || locked || !playbackUrl) return;
    if (previewing && savedProg && savedProg.currentTime >= PREVIEW_SECONDS) {
      video.currentTime = PREVIEW_SECONDS;
      video.pause();
      setIsPlaying(false);
      openPaywall('preview_limit');
      return;
    }
    if (savedProg && savedProg.currentTime > 5 && !savedProg.completed) {
      const startAt = previewing ? Math.min(savedProg.currentTime, PREVIEW_SECONDS - 1) : savedProg.currentTime;
      video.currentTime = startAt;
    }
    setShowEndOverlay(false);
    for (const track of Array.from(video.textTracks) as TextTrack[]) {
      track.mode = captionsOn ? 'showing' : 'hidden';
    }
    void video.play().catch(() => setIsPlaying(false));
  }, [episode?.id, locked, previewing, playbackUrl, captionsOn]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
    try {
      localStorage.setItem(SPEED_KEY, String(playbackRate));
    } catch {
      /* ignore */
    }
  }, [playbackRate, episode?.id, playbackUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted || muteMedia;
  }, [muted, muteMedia, playbackUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    for (const track of Array.from(video.textTracks) as TextTrack[]) {
      track.mode = captionsOn ? 'showing' : 'hidden';
    }
  }, [captionsOn]);

  useEffect(() => {
    if (!locked || !episode) return;
    skipPaywallClose.current = true;
    openPaywall('watch_locked');
  }, [locked, episode?.id, openPaywall]);

  useEffect(() => {
    if (paywallOpen) {
      skipPaywallClose.current = false;
      return;
    }
    if (!locked || skipPaywallClose.current || !course) return;
    setView('course', { courseId: course.id });
  }, [paywallOpen, locked, course?.id, setView]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const playEpisode = (epId: string) => {
    if (!course) return;
    const target = course.episodes.find((e) => e.id === epId);
    if (!canWatchEpisode(target, user, course) && !canPreviewEpisode(target, user, course)) {
      openPaywall('watch_list');
      return;
    }
    setShowEpisodes(false);
    setView('watch', { courseId: course.id, episodeId: epId });
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
      setShowChrome(true);
    }
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(previewing ? PREVIEW_SECONDS : duration, Math.max(0, time));
  };

  const toggleFullscreen = async () => {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) await playerRef.current.requestFullscreen();
    else await document.exitFullscreen();
  };

  const watchProps = () => ({
    courseId: course?.id || '',
    episodeId: episode?.id || '',
  });

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !episode || !course) return;
    if (previewing && video.currentTime >= PREVIEW_SECONDS) {
      video.currentTime = PREVIEW_SECONDS;
      video.pause();
      setIsPlaying(false);
      openPaywall('preview_limit');
      return;
    }
    setCurrentTime(video.currentTime);
    if (video.duration) setDuration(video.duration);
    updateProgress(course.id, episode.id, video.currentTime, video.duration || episode.duration);
    const total = video.duration || episode.duration || 0;
    if (total <= 0) return;
    const ratio = video.currentTime / total;
    if (ratio >= 0.25 && !marks.current.p25) {
      marks.current.p25 = true;
      trackEvent('video_25_percent', watchProps());
    }
    if (ratio >= 0.5 && !marks.current.p50) {
      marks.current.p50 = true;
      trackEvent('video_50_percent', watchProps());
    }
    if (ratio >= 0.75 && !marks.current.p75) {
      marks.current.p75 = true;
      trackEvent('video_75_percent', watchProps());
    }
  };

  const handleEnded = () => {
    if (episode && course) updateProgress(course.id, episode.id, episode.duration, episode.duration);
    if (!marks.current.completed) {
      marks.current.completed = true;
      trackEvent('video_completed', watchProps());
    }
    setIsPlaying(false);
    if (nextEpisode) {
      setShowEndOverlay(true);
      setShowChrome(true);
    } else if (
      episode &&
      episodeAccess(episode) === 'free' &&
      !hasFullLibraryAccess(user) &&
      user.role !== 'admin'
    ) {
      openPaywall('after_free');
    }
  };

  const cycleSpeed = (dir: 1 | -1) => {
    const idx = SPEED_OPTIONS.indexOf(playbackRate as (typeof SPEED_OPTIONS)[number]);
    const next = SPEED_OPTIONS[Math.min(SPEED_OPTIONS.length - 1, Math.max(0, (idx === -1 ? 1 : idx) + dir))];
    setPlaybackRate(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'l' || e.key === 'L' || e.key === 'ArrowRight') {
        e.preventDefault();
        seekTo(currentTime + 10);
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowLeft') {
        e.preventDefault();
        seekTo(currentTime - 10);
      } else if (e.key === '>' || e.key === '.') {
        e.preventDefault();
        cycleSpeed(1);
      } else if (e.key === '<' || e.key === ',') {
        e.preventDefault();
        cycleSpeed(-1);
      } else if ((e.key === 'n' || e.key === 'N') && nextEpisode) {
        e.preventDefault();
        playEpisode(nextEpisode.id);
      } else if (e.key === 'f' || e.key === 'F') {
        void toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        if (!muteMedia) setMuted((v) => !v);
      } else if ((e.key === 'c' || e.key === 'C') && captionTracks.length > 0) {
        setCaptionsOn((v) => !v);
      } else if (e.key === 'e' || e.key === 'E') {
        setShowEpisodes((v) => !v);
      } else if (e.key === 'Escape' && showEpisodes) {
        setShowEpisodes(false);
      }
      revealChrome();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showEpisodes, currentTime, revealChrome, captionTracks.length, muteMedia, playbackRate, nextEpisode]);

  if (!course || !episode) {
    return (
      <div className="fixed inset-0 z-[60] bg-black text-white">
        <PlayerSkeleton />
      </div>
    );
  }

  const chromeOn = showChrome || showEndOverlay || showEpisodes;

  return (
    <div
      ref={playerRef}
      dir="rtl"
      className="fixed inset-0 z-[60] bg-black text-white select-none"
      onMouseMove={revealChrome}
      onTouchStart={revealChrome}
    >
      {locked ? (
        <img
          src={course.coverImage}
          alt={course.title ? `תצוגה מקדימה: ${course.title}` : 'תצוגה מקדימה'}
          className="absolute inset-0 w-full h-full object-cover blur-md brightness-50"
        />
      ) : playbackError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-white/70">{playbackError}</p>
          <button
            type="button"
            onClick={() => {
              if (!episode) return;
              setPlaybackError('');
              void playbackApi
                .createSession(episode.id)
                .then((s) => setPlaybackUrl(s.playbackUrl))
                .catch((err) =>
                  setPlaybackError(err instanceof Error ? err.message : 'לא הצלחנו להפעיל את הפרק')
                );
            }}
            className="px-5 py-2.5 rounded-full bg-[#C8A24C] text-black text-sm font-semibold min-h-11"
          >
            ניסיון נוסף
          </button>
        </div>
      ) : !playbackUrl ? (
        <PlayerSkeleton />
      ) : (
      <video
        ref={videoRef}
        data-onboarding="watch-player"
        src={playbackUrl}
        playsInline
        autoPlay
        muted={muted || muteMedia}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => {
          setIsPlaying(true);
          if (!marks.current.started) {
            marks.current.started = true;
            trackEvent('video_view_started', watchProps());
          } else if (!marks.current.completed) {
            trackEvent('video_resumed', watchProps());
          }
        }}
        onPause={() => {
          setIsPlaying(false);
          const video = videoRef.current;
          if (video && !video.ended && marks.current.started && !marks.current.completed) {
            trackEvent('video_paused', watchProps());
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current?.duration) setDuration(videoRef.current.duration);
          const video = videoRef.current;
          if (video) {
            for (const track of Array.from(video.textTracks) as TextTrack[]) {
              track.mode = captionsOn ? 'showing' : 'hidden';
            }
          }
        }}
        onEnded={handleEnded}
        onClick={togglePlay}
        onDoubleClick={() => void toggleFullscreen()}
        className="absolute inset-0 w-full h-full object-contain bg-black"
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

      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          chromeOn ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      <div
        className={`absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-5 pt-4 transition-opacity duration-300 ${
          chromeOn ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setView('course', { courseId: course.id })}
          className="flex items-center gap-2 text-right min-h-11 focus-ring rounded-lg"
        >
          <ArrowRight className="w-5 h-5 text-white/80" />
          <span className="text-sm text-white">
            פרק {episode.episodeNumber} · {episodeName(episode.title)}
          </span>
          {previewing ? (
            <span className="text-[11px] text-[#C8A24C] border border-[#C8A24C]/40 rounded-full px-2 py-0.5">
              טעימה
            </span>
          ) : null}
        </button>

        <div className="flex items-center gap-1">
          {captionTracks.length > 0 ? (
            <button
              type="button"
              onClick={() => setCaptionsOn((v) => !v)}
              className={`px-3 py-2 rounded-full text-[12px] min-h-11 border cursor-pointer ${
                captionsOn ? 'border-[#C8A24C] text-[#F7E7B5]' : 'border-white/20 text-white/50'
              }`}
              aria-pressed={captionsOn}
            >
              כתוביות
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => cycleSpeed(playbackRate >= 2 ? -1 : 1)}
            className="px-3 py-2 rounded-full text-[12px] min-h-11 border border-white/20 text-white/70 hover:border-[#C8A24C] cursor-pointer"
            aria-label={`מהירות ${playbackRate}`}
          >
            {playbackRate}x
          </button>
          <button
            type="button"
            onClick={() => {
              if (!muteMedia) setMuted((v) => !v);
            }}
            className="p-2.5 text-white/70 hover:text-white min-h-11 min-w-11 flex items-center justify-center cursor-pointer"
            aria-label={muted || muteMedia ? 'הפעלת שמע' : 'השתקה'}
            disabled={muteMedia}
          >
            {muted || muteMedia ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="p-2.5 text-white/70 hover:text-white min-h-11 min-w-11 flex items-center justify-center"
            aria-label={isFullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <aside
        className={`absolute top-0 bottom-0 start-0 z-30 flex flex-col w-[min(100%,280px)] bg-black/90 border-e border-white/10 transition-transform duration-300 ${
          showEpisodes ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
        aria-label="פרקים"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-white/10">
          <h2 className="text-sm text-white">פרקים</h2>
          <button
            type="button"
            onClick={() => setShowEpisodes(false)}
            className="text-sm text-white/50 hover:text-white min-h-11 px-2"
          >
            סגירה
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto py-2 carousel-scroll">
          {course.episodes.map((ep) => {
            const isActive = ep.id === episode.id;
            const lockedEp = !canWatchEpisode(ep, user, course);
            return (
              <button
                key={ep.id}
                type="button"
                onClick={() => playEpisode(ep.id)}
                className={`w-full flex items-baseline gap-3 px-4 py-3 text-right cursor-pointer ${
                  isActive ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                }`}
              >
                <span className={`w-5 text-xs tabular-nums ${isActive ? 'text-[#C8A24C]' : 'text-white/35'}`}>
                  {ep.episodeNumber}
                </span>
                <span className={`flex-1 min-w-0 text-sm leading-snug ${isActive ? 'text-white' : 'text-white/70'}`}>
                  {episodeName(ep.title)}
                  {lockedEp && <Lock className="inline w-3 h-3 mr-1.5 text-white/35" />}
                </span>
                <span className="text-[11px] text-white/35 tabular-nums">{formatClock(ep.duration)}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {showEndOverlay && nextEpisode && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-labelledby="next-chapter-title"
        >
          <div className="text-center px-6">
            <p className="text-xs text-white/50 mb-2">הבא</p>
            <p id="next-chapter-title" className="text-xl text-white mb-6">
              פרק {nextEpisode.episodeNumber} · {episodeName(nextEpisode.title)}
            </p>
            <button
              type="button"
              onClick={() => {
                if (nextLocked) {
                  openPaywall({
                    source: 'locked_card',
                    courseId: course.id,
                    courseTitle: episodeName(nextEpisode.title),
                  });
                  return;
                }
                playEpisode(nextEpisode.id);
              }}
              className="px-6 py-3 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11"
            >
              {nextLocked ? 'פתיחת גישה' : 'לפרק הבא'}
            </button>
          </div>
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 z-20 px-5 pb-6 transition-opacity duration-300 ${
          chromeOn && !showEndOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <label className="flex-1 block" dir="ltr">
            <span className="sr-only">התקדמות בפרק</span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full h-1 appearance-none bg-white/20 rounded-full accent-[#C8A24C] cursor-pointer"
            />
          </label>
          <span className="text-[11px] text-white/45 tabular-nums shrink-0">
            נותרו <span dir="ltr">{formatClock(remaining)}</span>
          </span>
        </div>

        <div className="grid grid-cols-3 items-center">
          <button
            type="button"
            onClick={() => setShowEpisodes((v) => !v)}
            className="justify-self-start text-sm text-white/70 hover:text-white min-h-11"
          >
            פרקים
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="justify-self-center w-12 h-12 rounded-full bg-white text-black flex items-center justify-center cursor-pointer"
            aria-label={isPlaying ? 'השהיה' : 'הפעלה'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
          </button>

          <div className="justify-self-end flex items-center gap-3">
            {nextEpisode ? (
              <button
                type="button"
                onClick={() => {
                  if (nextLocked) {
                    openPaywall({
                      source: 'locked_card',
                      courseId: course.id,
                      courseTitle: episodeName(nextEpisode.title),
                    });
                    return;
                  }
                  playEpisode(nextEpisode.id);
                }}
                className="text-sm text-white/70 hover:text-white min-h-11 cursor-pointer"
              >
                {nextLocked ? 'פתיחת גישה' : 'הבא'}
              </button>
            ) : null}
            <span className="text-sm text-white/40 tabular-nums" dir="ltr">
              {formatClock(currentTime)}
            </span>
          </div>
        </div>
      </div>

      {(muted || muteMedia) && playbackUrl && !locked ? (
        <button
          type="button"
          onClick={() => {
            if (!muteMedia) setMuted(false);
          }}
          className="absolute bottom-28 inset-x-0 mx-auto w-fit z-20 px-4 py-2 rounded-full border border-white/20 bg-black/70 text-xs text-white/80 min-h-11 cursor-pointer"
        >
          {muteMedia ? 'השמע מושתק בהגדרות הנגישות' : 'מושתק. לחצו להפעלת שמע'}
        </button>
      ) : null}
    </div>
  );
};
