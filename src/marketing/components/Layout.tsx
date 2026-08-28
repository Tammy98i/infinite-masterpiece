import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative bg-[#010308] text-slate-300 selection:bg-[#D4AF37]/30 selection:text-white">
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
