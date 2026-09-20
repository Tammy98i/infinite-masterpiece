import { ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const HIDDEN_ROUTES = [
  '/application',
  '/thank-you-application',
  '/checkout',
  '/terms',
  '/privacy',
  '/accessibility',
  '/auth',
  '/oauth',
  '/webinar',
];

export function ConversionBand() {
  const { pathname } = useLocation();

  if (HIDDEN_ROUTES.some((route) => pathname.startsWith(route))) return null;

  return (
    <section className="conversion-band px-4 py-10 sm:px-6 md:py-14 lg:px-8" aria-labelledby="conversion-band-title">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-8 rounded-[28px] border border-[#C8A24C]/25 bg-[#05070d]/88 px-6 py-9 text-center shadow-[0_28px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:flex-row md:px-10 md:py-10 md:text-right">
        <div className="max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C8A24C]">הצעד הבא שלך</p>
          <h2 id="conversion-band-title" className="mb-3 text-2xl font-heading text-white sm:text-3xl">היצירה כבר קיימת. עכשיו בונים סביבה מערכת.</h2>
          <p className="text-sm leading-relaxed text-white/60 sm:text-base">בחרו את דרך הכניסה שמתאימה לקצב שלכם — וקבלו מסלול ברור מהרעיון ועד למערכת עובדת.</p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/pricing" className="btn-gold min-w-44 gap-2">
            לצפייה במסלולים
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link to="/webinar" className="btn-secondary min-w-44">להכיר בערב החי</Link>
        </div>
      </div>
    </section>
  );
}
