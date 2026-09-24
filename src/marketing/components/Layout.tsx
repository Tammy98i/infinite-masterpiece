import { ReactNode, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SkyBackdrop } from '../../components/SkyBackdrop';
import { Header } from './Header';
import { Footer } from './Footer';
import { ConversionBand } from './ConversionBand';

/** One static starfield persists behind both public and library routes. */
export function SiteBackdropLayout() {
  const isHome = useLocation().pathname === '/';
  const shell = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isHome) return;
    const shade = () => shell.current?.style.setProperty('--home-backdrop-shade', String(Math.min(1, window.scrollY / Math.max(1, window.innerHeight))));
    shade();
    window.addEventListener('scroll', shade, { passive: true });
    window.addEventListener('resize', shade);
    return () => {
      window.removeEventListener('scroll', shade);
      window.removeEventListener('resize', shade);
    };
  }, [isHome]);

  return (
    <div ref={shell} className="site-backdrop-layout">
      <SkyBackdrop />
      <div className="site-backdrop-content"><Outlet /></div>
    </div>
  );
}

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const pathname = useLocation().pathname;
  const isHome = pathname === '/';
  const onWebinar = pathname.startsWith('/webinar');
  return (
    <div className={`${isHome ? 'video-home ' : ''}${onWebinar ? 'webinar-isolated ' : ''}editorial-marketing-shell marketing-shell sky-readable min-h-screen flex flex-col relative bg-transparent text-white selection:bg-[#b79043]/30 selection:text-white`}>

      <div className="relative z-10 flex flex-col min-h-screen">
        <a href="#main-content" className="skip-link">
          דילוג לתוכן הראשי
        </a>
        {onWebinar ? null : <Header />}
        <main id="main-content" className="site-main flex-1 w-full text-start" tabIndex={-1}>
          {children}
        </main>
        {onWebinar ? null : <ConversionBand />}
        {onWebinar ? null : <Footer />}
      </div>
    </div>
  );
}
