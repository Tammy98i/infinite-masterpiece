import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SkyBackdrop } from '../../components/SkyBackdrop';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isHome = useLocation().pathname === '/';
  return (
    <div className={`${isHome ? 'video-home ' : ''}sky-readable min-h-screen flex flex-col relative bg-[#010308] text-white selection:bg-[#D4AF37]/30 selection:text-white`}>
      <SkyBackdrop />

      <div className="relative z-10 flex flex-col min-h-screen">
        <a href="#main-content" className="skip-link">
          דילוג לתוכן הראשי
        </a>
        <Header />
        <main id="main-content" className={`flex-1 w-full text-center ${isHome ? '' : 'pt-20'}`} tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
