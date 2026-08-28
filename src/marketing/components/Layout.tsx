import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const onWebinar = useLocation().pathname.startsWith('/webinar');

  return (
    <div className="min-h-screen flex flex-col relative bg-[#010308] text-slate-300 selection:bg-[#D4AF37]/30 selection:text-white">
      {onWebinar ? (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <img
            src="/webinar-background.jpg"
            alt=""
            width={1536}
            height={1024}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#010308]/35" />
        </div>
      ) : (
        <>
          <div className="fixed inset-0 bg-noise mix-blend-overlay" aria-hidden="true" />
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#1e3a8a]/10 blur-[150px] mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#3b1c66]/10 blur-[150px] mix-blend-screen" />
            <div className="absolute top-[40%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-[#C8A24C]/[0.03] blur-[150px] mix-blend-screen" />
          </div>
        </>
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        <a href="#main-content" className="skip-link">
          דילוג לתוכן הראשי
        </a>
        <Header />
        <main id="main-content" className="flex-1 w-full pt-20 text-center" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
