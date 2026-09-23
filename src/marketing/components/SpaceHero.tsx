import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { WEBINAR_CTA_ENDED, WEBINAR_CTA_HEADER, WEBINAR_CTA_NEXT_CYCLE } from '../../constants/webinarPage';
import { useWebinarPhase } from '../hooks/useWebinarPhase';
import './SpaceHero.css';

type PlanetId = 'earth' | 'venus' | 'mars';

type Planet = {
  id: PlanetId;
  name: string;
  video: string;
  poster: string;
  cutout: string;
};

const PLANETS: Planet[] = [
  {
    id: 'earth',
    name: 'EARTH',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_3ffb4889-c520-432d-8458-038009eb40df.mp4',
    poster: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_508c64b8-a31e-4290-bdfc-1187df70e0a6.png',
    cutout: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202005_3346cc4d-ec3b-44ab-825c-b18e49f5021a.png',
  },
  {
    id: 'venus',
    name: 'VENUS',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_b211cd74-013b-4dd3-bfd0-64491d8696fa.mp4',
    poster: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_cf55d1d8-7b59-4a64-80da-d72052ae974e.png',
    cutout: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202012_640b239a-d08a-4200-adb2-741bbe129ac8.png',
  },
  {
    id: 'mars',
    name: 'MARS',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_51eae59a-2459-4c84-907c-cc5edfe5fea7.mp4',
    poster: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_0ba6de7c-285d-43dc-b7ab-8c54c73707cb.png',
    cutout: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202018_3d559490-f613-4ed7-a3bb-3b7e9fc90fb8.png',
  },
];

function PlanetSlot({ side, planet, onSelect }: { side: 'l' | 'r'; planet: Planet; onSelect: (planet: Planet) => void }) {
  return (
    <button
      className={`space-planet space-planet-${side}`}
      type="button"
      aria-label={`Feature planet ${planet.name}`}
      onClick={() => onSelect(planet)}
    >
      {PLANETS.map((item) => (
        <img
          key={item.id}
          className={item.id === planet.id ? 'is-shown' : ''}
          data-planet={item.id}
          src={item.cutout}
          alt=""
        />
      ))}
    </button>
  );
}

export function SpaceHero() {
  const rootRef = useRef<HTMLElement>(null);
  const [featured, setFeatured] = useState<PlanetId>('earth');
  const [loaded, setLoaded] = useState<Set<PlanetId>>(() => new Set(['earth']));
  const { phase } = useWebinarPhase();

  const featuredIndex = PLANETS.findIndex((planet) => planet.id === featured);
  const current = PLANETS[featuredIndex];
  const left = PLANETS[(featuredIndex + 1) % PLANETS.length];
  const right = PLANETS[(featuredIndex + 2) % PLANETS.length];

  const selectPlanet = (planet: Planet) => {
    setLoaded((existing) => new Set(existing).add(planet.id));
    setFeatured(planet.id);
  };

  useEffect(() => {
    document.getElementById('quiet-boot')?.remove();
    const root = rootRef.current;
    if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion')) return;
    root.classList.add('space-anim');
    const start = window.setTimeout(() => root.classList.add('space-go'), 40);
    const clean = window.setTimeout(() => root.classList.remove('space-anim', 'space-go'), 2500);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(clean);
    };
  }, []);

  useEffect(() => {
    const videos = rootRef.current?.querySelectorAll<HTMLVideoElement>('.space-sky video');
    if (!videos) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion');
    videos.forEach((video) => {
      if (reduced || video.dataset.planet !== featured) {
        video.pause();
        return;
      }
      try { video.currentTime = 0; } catch { /* Metadata may not be available yet. */ }
      void video.play().catch(() => undefined);
    });
  }, [featured, loaded]);

  return (
    <section ref={rootRef} className="space-hero" aria-labelledby="space-hero-title" dir="ltr">
      <div className="space-sky" style={{ backgroundImage: `url(${current.poster})` }}>
        {PLANETS.map((planet) => (
          <video
            key={planet.id}
            className={planet.id === featured ? 'is-active' : ''}
            data-planet={planet.id}
            src={loaded.has(planet.id) ? planet.video : undefined}
            poster={planet.poster}
            autoPlay={planet.id === featured}
            muted
            loop
            playsInline
            preload={planet.id === 'earth' ? 'auto' : 'none'}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="space-ui">
        <div className="space-copy" dir="rtl">
          <h1 className="space-col space-title" id="space-hero-title">
            <span className="space-ent-mask"><span className="space-ent-line">The Masterpiece</span></span>
            <span className="space-ent-mask space-title-wide"><span className="space-ent-line">Framework</span></span>
          </h1>
          <div className="space-col space-rule"><span /></div>
          <p className="space-col space-lede"><strong>יש לך יצירה. עכשיו בונים לה מערכת הכנסה.</strong><br />הבעיה היא לא שאין לך כישרון. הבעיה היא שאין סביב הכישרון שלך מערכת עסקית.<br /> אנו הופכים יצירה לעסק, השפעה וחופש.</p>
          <div className="space-col space-cta">
            <PlanetSlot side="l" planet={left} onSelect={selectPlanet} />
            <PlanetSlot side="r" planet={right} onSelect={selectPlanet} />
            <Link to={phase === 'ended' ? '/#pricing' : '/webinar'}>
              {phase === 'ended' ? WEBINAR_CTA_NEXT_CYCLE : WEBINAR_CTA_HEADER}<ArrowLeft aria-hidden="true" />
            </Link>
            <span className="space-label space-label-l">{left.name}</span>
            <span className="space-label space-label-r">{right.name}</span>
            <div className="space-secondary-actions">
              {phase === 'ended' ? <p className="space-ended">{WEBINAR_CTA_ENDED}</p> : <Link to="/#pricing">למסלול האמיצים והססנים</Link>}
              <Link to="/library">כבר בפנים? כניסה לספרייה</Link>
            </div>
          </div>
        </div>
      </div>

      <button
        className="space-scroll"
        type="button"
        aria-label="Scroll to next section"
        onClick={() => rootRef.current?.nextElementSibling?.scrollIntoView({ behavior: 'smooth' })}
      >
        <svg viewBox="0 0 26 33" fill="none" aria-hidden="true">
          <path d="M13 1.5 V31.5 M1.9 20.4 L13 31.5 L24.1 20.4" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
        </svg>
      </button>
    </section>
  );
}
