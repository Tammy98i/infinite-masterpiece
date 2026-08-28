import { ReactNode } from 'react';
import { SkyBackdrop } from '../../components/SkyBackdrop';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="sky-readable min-h-screen flex flex-col relative bg-[#010308] text-white selection:bg-[#D4AF37]/30 selection:text-white">
      <SkyBackdrop />

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
