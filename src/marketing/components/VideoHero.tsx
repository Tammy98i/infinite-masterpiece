import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { WEBINAR_CTA_ENDED, WEBINAR_CTA_HEADER, WEBINAR_CTA_NEXT_CYCLE } from '../../constants/webinarPage';
import { useWebinarPhase } from '../hooks/useWebinarPhase';
import './VideoHero.css';

const VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_104036_bd6924f6-3c8e-417e-8465-6d03c8c2e9e6.mp4';
const POSTER = 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/82e7eb75-c65f-490a-99b5-f3d1cad54200.webp';

export function VideoHero() {
  const rootRef = useRef<HTMLElement>(null);
  const videoA = useRef<HTMLVideoElement>(null);
  const videoB = useRef<HTMLVideoElement>(null);
  const { phase } = useWebinarPhase();

  useLayoutEffect(() => {
    const stage = rootRef.current?.closest('.video-home');
    if (!stage) return;
    // This hero has its own font-aware entrance, rather than the site's boot cover.
    document.getElementById('quiet-boot')?.remove();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion')) return;
    let disposed = false;
    let started = false;
    let finished = false;
    let ceiling: number;
    let safety: number;
    const clean = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(ceiling);
      window.clearTimeout(safety);
      stage.removeEventListener('animationend', onEnd, true);
      stage.classList.remove('hero-anim', 'hero-go');
    };
    const onEnd = (event: Event) => {
      if ((event as AnimationEvent).animationName === 'vh-pill-in' && (event.target as HTMLElement).classList.contains('vh-library')) clean();
    };
    const start = () => {
      if (disposed || started) return;
      started = true;
      window.clearTimeout(ceiling);
      stage.addEventListener('animationend', onEnd, true);
      safety = window.setTimeout(clean, 2600);
      stage.classList.add('hero-go');
    };
    stage.classList.add('hero-anim');
    ceiling = window.setTimeout(start, 900);
    if (document.fonts) document.fonts.ready.then(start, start);
    else start();
    return () => { disposed = true; clean(); };
  }, []);

  useEffect(() => {
    const a = videoA.current;
    const b = videoB.current;
    if (!a || !b) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let cur = a;
    let nxt = b;
    let swapping = false;
    let timer: number;
    const reduced = () => preference.matches || document.documentElement.classList.contains('a11y-reduce-motion');
    const play = (video: HTMLVideoElement) => { void video.play()?.catch(() => {}); };
    const reset = (video: HTMLVideoElement) => {
      video.pause();
      try { video.currentTime = 0; } catch { /* Metadata may not have arrived yet. */ }
    };
    const applyPreference = () => {
      window.clearTimeout(timer);
      swapping = false;
      reset(a);
      reset(b);
      a.classList.add('is-active');
      b.classList.remove('is-active');
      cur = a;
      nxt = b;
      if (reduced()) a.removeAttribute('autoplay');
      else play(a);
    };
    const tick = () => {
      if (reduced() || swapping || !cur.duration || cur.duration - cur.currentTime > 0.9) return;
      swapping = true;
      const out = cur;
      nxt.currentTime = 0;
      play(nxt);
      nxt.classList.add('is-active');
      out.classList.remove('is-active');
      [cur, nxt] = [nxt, cur];
      timer = window.setTimeout(() => { reset(out); swapping = false; }, 1000);
    };
    applyPreference();
    a.addEventListener('timeupdate', tick);
    b.addEventListener('timeupdate', tick);
    preference.addEventListener('change', applyPreference);
    const observer = new MutationObserver(applyPreference);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      window.clearTimeout(timer);
      a.removeEventListener('timeupdate', tick);
      b.removeEventListener('timeupdate', tick);
      preference.removeEventListener('change', applyPreference);
      observer.disconnect();
      a.pause();
      b.pause();
    };
  }, []);

  return (
    <section ref={rootRef} className="video-hero" aria-labelledby="home-hero-title">
      <div className="vh-bg" role="img" aria-label="כדור הארץ בנקודות סגולות מסתובב באיטיות על רקע כוכבים">
        <video ref={videoA} className="vh-video is-active" autoPlay muted loop playsInline preload="auto" disablePictureInPicture aria-hidden="true" poster={POSTER}>
          <source src={VIDEO} type="video/mp4" />
        </video>
        <video ref={videoB} className="vh-video" muted loop playsInline preload="auto" disablePictureInPicture aria-hidden="true" poster={POSTER}>
          <source src={VIDEO} type="video/mp4" />
        </video>
      </div>
      <div className="vh-shade" aria-hidden="true" />
      <div className="vh-inner">
        <div className="vh-eyebrow" dir="ltr"><span />The Masterpiece Framework</div>
        <h1 id="home-hero-title">
          <span className="vh-line"><span className="vh-line-inner">יש לך יצירה.</span></span>
          <span className="vh-line vh-line-wide"><span className="vh-line-inner">עכשיו בונים לה מערכת הכנסה.</span></span>
        </h1>
        <p className="vh-sub">הבעיה היא לא שאין לך כישרון. הבעיה היא שאין סביב הכישרון שלך מערכת עסקית. אנו הופכים יצירה לעסק, השפעה וחופש.</p>
        <div className="vh-ctas">
          <Link to={phase === 'ended' ? '/pricing' : '/webinar'} className="vh-btn vh-primary">
            {phase === 'ended' ? WEBINAR_CTA_NEXT_CYCLE : WEBINAR_CTA_HEADER}<ArrowLeft aria-hidden="true" />
          </Link>
          {phase === 'ended' ? <p className="vh-ended">{WEBINAR_CTA_ENDED}</p> : (
            <a href="/#pricing" className="vh-btn vh-ghost">למסלול האמיצים והססנים<ArrowLeft aria-hidden="true" /></a>
          )}
        </div>
        <Link to="/library" className="vh-library">כבר בפנים? כניסה לספרייה</Link>
      </div>
    </section>
  );
}
