import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { WebinarCountdown } from '../WebinarCountdown';
import {
  resolveWebinarSlideId,
  stepWebinarSlide,
  webinarSlideIndex,
  type WebinarSlideRef,
} from './webinarDeck';
import './WebinarExperience.css';

export type WebinarSlide = WebinarSlideRef & {
  title: string;
  children: ReactNode;
};

function prefersReducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.classList.contains('a11y-reduce-motion');
}

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

export function WebinarExperience({
  slides,
  date,
  time,
  meta,
  eventNight,
  eventEnded,
  onSlideChange,
}: {
  slides: WebinarSlide[];
  date: string;
  time: string;
  meta?: string;
  eventNight: boolean;
  eventEnded: boolean;
  onSlideChange?: (id: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Record<string, HTMLElement | null>>({});
  const ids = useMemo(() => slides.map((slide) => slide.id), [slides]);
  const [activeId, setActiveId] = useState(() => (
    typeof window === 'undefined' ? slides[0]?.id || '' : resolveWebinarSlideId(window.location.hash, slides)
  ));
  const [fullscreen, setFullscreen] = useState(false);
  const index = webinarSlideIndex(activeId, slides);
  const current = slides[index] || slides[0];
  const total = slides.length;
  const atStart = index <= 0;
  const atEnd = index >= total - 1;

  const syncHash = useCallback((id: string) => {
    const next = `#${id}`;
    if (window.location.hash === next) return;
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}${next}`);
  }, []);

  const goTo = useCallback((raw: string, focus = false) => {
    const id = resolveWebinarSlideId(raw, slides);
    setActiveId(id);
    syncHash(id);
    onSlideChange?.(id);
    if (!focus) return;
    window.requestAnimationFrame(() => {
      slideRefs.current[id]?.focus({ preventScroll: true });
    });
  }, [onSlideChange, slides, syncHash]);

  const step = useCallback((direction: 1 | -1) => {
    const next = slides[stepWebinarSlide(index, total, direction)];
    if (!next || next.id === activeId) return;
    goTo(next.id, true);
  }, [activeId, goTo, index, slides, total]);

  useEffect(() => {
    const onHash = () => goTo(window.location.hash);
    const onGo = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (id) goTo(id, true);
    };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('webinar:go', onGo);
    syncHash(activeId);
    onSlideChange?.(activeId);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('webinar:go', onGo);
    };
    // Mount-only: later navigation goes through goTo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (event.key === 'ArrowLeft' || event.key === 'PageDown') {
        event.preventDefault();
        step(1);
      } else if (event.key === 'ArrowRight' || event.key === 'PageUp') {
        event.preventDefault();
        step(-1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        goTo(ids[0], true);
      } else if (event.key === 'End') {
        event.preventDefault();
        goTo(ids[ids.length - 1], true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, ids, step]);

  useEffect(() => {
    const onFullscreen = () => {
      const node = rootRef.current;
      setFullscreen(Boolean(node && document.fullscreenElement === node));
    };
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);

  const toggleFullscreen = () => {
    const node = rootRef.current;
    if (!node) return;
    if (document.fullscreenElement === node) {
      void document.exitFullscreen?.();
      return;
    }
    void node.requestFullscreen?.();
  };

  const onShellKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isEditableTarget(event.target)) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(-1);
    }
  };

  if (!current) return null;

  const phaseLabel = eventNight ? 'הערב החי עכשיו' : eventEnded ? 'הערב החי הסתיים' : 'ערב חי';

  return (
    <div
      ref={rootRef}
      className={`webinar-stage-page webinar-deck${prefersReducedMotion() ? ' is-static' : ''}${fullscreen ? ' is-fullscreen' : ''}`}
      data-webinar-deck
      dir="rtl"
      onKeyDown={onShellKey}
    >
      <div className="webinar-deck-shell" role="navigation" aria-label="ניווט בשקופיות הוובינר">
        <p className="webinar-deck-when">
          <span className={`webinar-deck-dot${eventNight ? ' is-live' : ''}`} aria-hidden />
          <span>{phaseLabel}, {date}, {time}</span>
          {eventNight || eventEnded ? null : <WebinarCountdown date={date} time={time} className="webinar-deck-countdown" />}
        </p>
        <div className="webinar-deck-status">
          <p className="webinar-deck-title" aria-live="polite">
            <span className="webinar-deck-count">{index + 1}/{total}</span>
            <span>{current.title}</span>
          </p>
          <div className="webinar-deck-progress" aria-hidden>
            <span style={{ width: `${((index + 1) / total) * 100}%` }} />
          </div>
        </div>
        {meta ? <p className="webinar-deck-meta">{meta}</p> : null}
        <ol className="webinar-deck-dots">
          {slides.map((slide, slideIndex) => (
            <li key={slide.id}>
              <button
                type="button"
                className={slide.id === current.id ? 'is-active' : ''}
                aria-current={slide.id === current.id ? 'true' : undefined}
                aria-label={`שקופית ${slideIndex + 1} מתוך ${total}: ${slide.title}`}
                onClick={() => goTo(slide.id, true)}
              />
            </li>
          ))}
        </ol>
        <div className="webinar-deck-actions">
          <button
            type="button"
            className="webinar-deck-icon"
            onClick={toggleFullscreen}
            aria-pressed={fullscreen}
            aria-label={fullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'}
          >
            {fullscreen ? <Minimize2 aria-hidden /> : <Maximize2 aria-hidden />}
          </button>
          <button
            type="button"
            className="webinar-deck-step"
            onClick={() => step(-1)}
            disabled={atStart}
          >
            <ChevronRight aria-hidden />
            <span>הקודם</span>
          </button>
          <button
            type="button"
            className="webinar-deck-step is-next"
            onClick={() => step(1)}
            disabled={atEnd}
          >
            <span>המשך</span>
            <ChevronLeft aria-hidden />
          </button>
        </div>
      </div>

      <div className="webinar-deck-stage">
        <div className="webinar-deck-canvas">
          {slides.map((slide) => {
            const active = slide.id === current.id;
            return (
              <section
                key={slide.id}
                ref={(node) => {
                  slideRefs.current[slide.id] = node;
                }}
                className={`webinar-deck-slide${active ? ' is-active' : ''}`}
                data-slide={slide.id}
                aria-hidden={!active}
                aria-label={slide.title}
                tabIndex={-1}
              >
                {slide.children}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
