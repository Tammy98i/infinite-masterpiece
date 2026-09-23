import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { WebinarConfig } from '../../constants/webinar';
import {
  WEBINAR_CTA_ENDED,
  WEBINAR_CTA_NEXT_CYCLE,
  WEBINAR_CTA_REGISTER,
  WEBINAR_PUNCHLINE,
  webinarLiveEnter,
} from '../../constants/webinarPage';
import { trackWebinarCta } from '../../utils/analytics';
import './WebinarNeuralHero.css';

export const WEBINAR_NEURAL_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_104303_0c6d60b2-9353-408e-9449-585108a22fb5.mp4';
export const WEBINAR_NEURAL_POSTER =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/130837c4-0244-4f37-9c61-8d801d93fd29.jpg';

function prefersReducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.classList.contains('a11y-reduce-motion');
}

export function NeuralChevron({ className = 'webinar-neural-chev' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 11 20" aria-hidden="true">
      <path d="M1.15 1.15 L9.6 10 L1.15 18.85" />
    </svg>
  );
}

function CtaArrow() {
  return (
    <svg className="webinar-neural-arrow" viewBox="0 0 16 11" aria-hidden="true">
      <path d="M0 5.5 H14.6 M10.3 1.2 L14.9 5.5 L10.3 9.8" />
    </svg>
  );
}

export function WebinarNeuralSky() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (prefersReducedMotion()) {
        video.pause();
        return;
      }
      const play = video.play();
      if (play) play.catch(() => undefined);
    };
    sync();
    query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        className="webinar-neural-art"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        poster={WEBINAR_NEURAL_POSTER}
        src={WEBINAR_NEURAL_VIDEO}
      />
      <div className="webinar-neural-veil" aria-hidden="true" />
    </>
  );
}

export function WebinarNeuralHero({
  config,
  headlineParts,
  eventNight,
  eventEnded,
  onRegister,
}: {
  config: WebinarConfig;
  headlineParts: { line1: string; line2: string };
  eventNight: boolean;
  eventEnded: boolean;
  onRegister: (section: string) => void;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const liveEnter = webinarLiveEnter(config.zoomLink, config.whatsappGroupUrl);
  const when = eventNight ? 'הערב החי עכשיו' : eventEnded ? WEBINAR_CTA_ENDED : 'ערב חי';

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion()) {
      root.classList.add('is-entered');
      return;
    }
    const done = () => {
      window.clearTimeout(safety);
      root.classList.add('is-entered');
    };
    const safety = window.setTimeout(done, 2800);
    const last = root.querySelector('[data-neural-end]');
    last?.addEventListener('animationend', done, { once: true });
    return () => {
      window.clearTimeout(safety);
      last?.removeEventListener('animationend', done);
    };
  }, []);

  const primary = eventEnded ? (
    <Link to="/pricing" className="webinar-neural-cta" data-neural-end>
      <span>{WEBINAR_CTA_NEXT_CYCLE}</span>
      <CtaArrow />
    </Link>
  ) : eventNight && liveEnter.href ? (
    <a href={liveEnter.href} target="_blank" rel="noreferrer" onClick={() => trackWebinarCta('hero_enter')} className="webinar-neural-cta" data-neural-end>
      <span>{liveEnter.label}</span>
      <CtaArrow />
    </a>
  ) : eventNight && !liveEnter.href ? (
    <p className="webinar-neural-note" data-neural-end>{liveEnter.label}</p>
  ) : (
    <button type="button" onClick={() => onRegister('hero')} className="webinar-neural-cta" data-neural-end>
      <span>{WEBINAR_CTA_REGISTER}</span>
      <CtaArrow />
    </button>
  );

  return (
    <section ref={rootRef} id="webinar-hero" className="webinar-stage-hero webinar-neural-hero is-slim webinar-island" dir="rtl">
      <div className="webinar-stage-shell">
        <div className="webinar-stage-copy">
          <p className="webinar-neural-when">
            {when} · {config.date} · {config.time}
          </p>
          <h1>
            <span id="webinar-h1a">{headlineParts.line1}</span>
            {headlineParts.line2 ? <span id="webinar-h1b">{headlineParts.line2}</span> : null}
          </h1>
          <p className="webinar-stage-punchline">{WEBINAR_PUNCHLINE}</p>
          {primary}
        </div>
      </div>
    </section>
  );
}
