import { useEffect, useRef } from 'react';
import './VideoBackground.css';

const VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_104036_bd6924f6-3c8e-417e-8465-6d03c8c2e9e6.mp4';
const POSTER = 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/82e7eb75-c65f-490a-99b5-f3d1cad54200.webp';

/** Cross-fading video pair, scoped to the homepage hero. */
export function VideoBackground() {
  const root = useRef<HTMLDivElement>(null);
  const videoA = useRef<HTMLVideoElement>(null);
  const videoB = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const a = videoA.current;
    const b = videoB.current;
    const plate = root.current;
    if (!a || !b || !plate) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = () => preference.matches || document.documentElement.classList.contains('a11y-reduce-motion');
    let cur = a;
    let nxt = b;
    let swapping = false;
    let disposed = false;
    let generation = 0;
    let timer: number | undefined;
    let wasReduced: boolean | undefined;
    const reset = (video: HTMLVideoElement) => {
      video.pause();
      try { video.currentTime = 0; } catch { /* Metadata may not have arrived yet. */ }
    };
    const applyPreference = () => {
      const isReduced = reduced();
      if (isReduced === wasReduced) return;
      wasReduced = isReduced;
      generation++;
      window.clearTimeout(timer);
      swapping = false;
      reset(a);
      reset(b);
      a.classList.remove('is-outgoing');
      b.classList.remove('is-outgoing');
      a.classList.add('is-active');
      b.classList.remove('is-active');
      cur = a;
      nxt = b;
      plate.dataset.reduced = String(isReduced);
      if (!isReduced && !document.hidden) void a.play().catch(() => {});
    };
    const tick = async () => {
      if (reduced() || document.hidden || swapping || !Number.isFinite(cur.duration) || cur.duration - cur.currentTime > 1.2) return;
      swapping = true;
      const out = cur;
      const incoming = nxt;
      const attempt = generation;
      try {
        incoming.currentTime = 0;
        await incoming.play();
        if (disposed || attempt !== generation || reduced() || document.hidden) return;
        // Fade in above an opaque outgoing frame to avoid a dip to black.
        out.classList.add('is-outgoing');
        incoming.classList.add('is-active');
        out.classList.remove('is-active');
        [cur, nxt] = [incoming, out];
        timer = window.setTimeout(() => {
          out.classList.remove('is-outgoing');
          reset(out);
          swapping = false;
        }, 950);
      } catch {
        // Native looping keeps the current video visible if the second cannot play.
        if (attempt === generation) swapping = false;
      }
    };
    const visibility = () => {
      generation++;
      window.clearTimeout(timer);
      swapping = false;
      reset(nxt);
      nxt.classList.remove('is-active', 'is-outgoing');
      cur.classList.remove('is-outgoing');
      cur.classList.add('is-active');
      if (document.hidden || reduced()) cur.pause();
      else void cur.play().catch(() => {});
    };
    applyPreference();
    a.addEventListener('timeupdate', tick);
    b.addEventListener('timeupdate', tick);
    preference.addEventListener('change', applyPreference);
    document.addEventListener('visibilitychange', visibility);
    const observer = new MutationObserver(applyPreference);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      disposed = true;
      generation++;
      window.clearTimeout(timer);
      a.removeEventListener('timeupdate', tick);
      b.removeEventListener('timeupdate', tick);
      preference.removeEventListener('change', applyPreference);
      document.removeEventListener('visibilitychange', visibility);
      observer.disconnect();
      a.pause();
      b.pause();
    };
  }, []);

  return (
    <div ref={root} className="site-video-background" aria-hidden="true">
      <div className="site-video-frame">
        <img className="site-video-poster" src={POSTER} alt="" />
        <video ref={videoA} className="site-video is-active" muted loop playsInline preload="auto" disablePictureInPicture poster={POSTER} tabIndex={-1}>
          <source src={VIDEO} type="video/mp4" />
        </video>
        <video ref={videoB} className="site-video" muted loop playsInline preload="auto" disablePictureInPicture poster={POSTER} tabIndex={-1}>
          <source src={VIDEO} type="video/mp4" />
        </video>
      </div>
      <div className="site-video-shade">
        <div className="absolute inset-0 bg-[#010308]/58" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#010308]/55 via-transparent to-[#010308]/72" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(1,3,8,0.45)_100%)]" />
      </div>
    </div>
  );
}
