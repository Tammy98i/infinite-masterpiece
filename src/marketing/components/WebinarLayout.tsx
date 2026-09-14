import { ReactNode } from 'react';
import { SkyBackdrop } from '../../components/SkyBackdrop';
import { WebinarHeader } from './WebinarHeader';
import { WebinarFooter } from './WebinarFooter';

export function WebinarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="sky-readable min-h-screen flex flex-col relative bg-[#010308] text-white selection:bg-[#D4AF37]/30 selection:text-white">
      <SkyBackdrop />
      <div className="relative z-10 flex flex-col min-h-screen">
        <a href="#webinar-main" className="skip-link">
          דילוג לתוכן הראשי
        </a>
        <WebinarHeader />
        <main id="webinar-main" className="flex-1 w-full pt-20 text-center" tabIndex={-1}>
          {children}
        </main>
        <WebinarFooter />
      </div>
    </div>
  );
}
