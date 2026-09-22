import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FounderRoster } from '../components/FounderRoster';
import { trackEvent } from '../../utils/analytics';

export function Premium88() {
  useEffect(() => {
    trackEvent('premium_88_page_view');
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen text-white selection:bg-[#b79043]/30">
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-10 text-center">
          <p className="text-[13px] uppercase tracking-[0.3em] text-[#b79043] mb-6 font-semibold">
            האנשים שמאחורי שכבת העומק
          </p>
          <h1 className="text-4xl md:text-6xl font-heading text-white tracking-tight mb-6">
            צוות המיזם
          </h1>
          <p className="text-lg text-white/50 font-light leading-relaxed">
            מי עומד מאחורי Infinite Masterpiece, ומה כל יזם מביא.
          </p>
        </div>
      </section>

      <section className="pb-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
          <FounderRoster />
        </div>
      </section>

      <section className="pb-16 text-center px-4">
        <p className="text-lg text-white/50 font-light max-w-2xl mx-auto leading-relaxed">
          מי שנכנס לנבחרת 88 עובד קרוב יותר לצוות הזה. לא עוד שכבת קהילה רחוקה.
        </p>
      </section>

      <section className="pb-32 text-center px-4">
        <Link
          to="/application?type=88"
          onClick={() => trackEvent('premium_88_cta_clicked')}
          className="btn-gold text-black py-4 px-10 text-lg"
        >
          הגשת מועמדות לנבחרת 88
        </Link>
        <div className="mt-6">
          <a
            href="/#team"
            className="text-white/40 hover:text-[#b79043] transition-colors text-sm font-light"
          >
            רוצה להבין את שכבת העומק?
          </a>
        </div>
      </section>
    </div>
  );
}
