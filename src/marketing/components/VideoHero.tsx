import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { WEBINAR_CTA_ENDED, WEBINAR_CTA_HEADER, WEBINAR_CTA_NEXT_CYCLE } from '../../constants/webinarPage';
import { useWebinarPhase } from '../hooks/useWebinarPhase';
import { VideoBackground } from '../../components/VideoBackground';
import './VideoHero.css';

export function VideoHero() {
  const rootRef = useRef<HTMLElement>(null);
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

  return (
    <section ref={rootRef} className="video-hero" aria-labelledby="home-hero-title">
      <VideoBackground />
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
