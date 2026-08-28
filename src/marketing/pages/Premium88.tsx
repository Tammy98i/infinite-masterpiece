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
    <div className="min-h-screen text-white selection:bg-[#C8A24C]/30">
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-6 font-semibold">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
          className="inline-flex justify-center py-4 px-10 rounded-full text-black bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] hover:shadow-[0_0_30px_rgba(200,162,76,0.3)] transition-all duration-300 font-bold text-lg min-h-11"
        >
          הגשת מועמדות לנבחרת 88
        </Link>
        <div className="mt-6">
          <a
            href="/#depth-layer"
            className="text-white/40 hover:text-[#C8A24C] transition-colors text-sm font-light"
          >
            רוצה להבין את שכבת העומק?
          </a>
        </div>
      </section>
    </div>
  );
}
