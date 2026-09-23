import { useEffect } from 'react';
import { Check, ChevronDown, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EntryTrackCards } from '../components/EntryTrackCards';
import { ProgramHighlights } from '../components/ProgramHighlights';
import { SectionNav } from '../components/SectionNav';
import { PROGRAM_INCLUDED } from '../data/programIncluded';
import { FAQS } from './FAQPage';
import './PricingFlowPolish.css';

const PRICE_FAQS = FAQS.filter((_, index) => [3, 5, 6, 7, 8].includes(index));

export function Pricing({ embedded = false }: { embedded?: boolean }) {
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.documentElement.classList.contains('a11y-reduce-motion');
    const islands = Array.from(document.querySelectorAll<HTMLElement>('.pricing-island'));
    const appear = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add('is-in');
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -16% 0px' },
    );
    for (const node of islands) {
      if (reduce) node.classList.add('is-in');
      appear.observe(node);
    }
    return () => appear.disconnect();
  }, []);

  return (
    <div className={`pricing-flow-page w-full text-center${embedded ? ' is-compact' : ' pb-24'}`}>
      <section className={`pricing-hero pricing-island is-in mx-auto max-w-[1100px] px-4 ${embedded ? 'pb-5 pt-5' : 'pb-16 pt-16 md:pb-20 md:pt-24'} sm:px-6 lg:px-8`}>
        {embedded ? null : (
        <nav aria-label="פירורי לחם" className="mb-10 flex items-center justify-center gap-2 text-xs text-white/35">
          <Link to="/" className="min-h-11 inline-flex items-center hover:text-white">בית</Link><span aria-hidden>›</span><span className="text-[#b79043]">מסלולים ומחיר</span>
        </nav>
        )}
        {embedded ? null : (
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#b79043]/20 bg-[#b79043]/10 px-4 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#b79043]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#dfc47d]">המחזור הקרוב נפתח בקרוב</span>
        </div>
        )}
        <h1 className={`font-heading text-white ${embedded ? 'mb-2 text-2xl md:text-3xl' : 'mb-5 text-4xl md:text-6xl'}`}>שתי דרכי כניסה. <span className="text-gold-gradient">אותו מסע.</span></h1>
        <p className={`mx-auto max-w-2xl font-light leading-relaxed text-white/55 ${embedded ? 'text-sm' : 'text-base md:text-lg'}`}>אותו מסע מלא. אמיצים: 8,008 ₪ לפני מע״מ בתשלום אחד. הססנים: 8,888 ₪ לפני מע״מ בארבע פעימות. זה קצב תשלום, לא הנחה ולא מוצר חלקי.</p>
        {embedded ? null : <span className="pricing-flow-stem" aria-hidden />}
      </section>

      {embedded ? null : (
      <SectionNav items={[{ id: 'choose-track', label: 'בחירת מסלול' }, { id: 'whats-included', label: 'מה מקבלים' }, { id: 'journey-preview', label: '33 הימים' }, { id: 'pricing-faq', label: 'שאלות' }]} />
      )}

      <section id="choose-track" className={`pricing-island mx-auto max-w-[1050px] px-4 sm:px-6 lg:px-8 ${embedded ? 'py-5' : 'section-block'}`}>
        {embedded ? null : (
          <>
            <p className="mb-4 text-[11px] uppercase tracking-[.25em] text-[#b79043]">בחירת מסלול</p>
            <h2 className="mb-4 text-3xl font-heading text-white md:text-4xl">אמיצים או הססנים</h2>
            <p className="mx-auto mb-10 max-w-xl text-sm font-light leading-relaxed text-white/45">אמיצים: 8,008 ₪ לפני מע״מ בתשלום מלא. הססנים: 8,888 ₪ לפני מע״מ בארבע פעימות.</p>
          </>
        )}
        <EntryTrackCards />
      </section>

      {embedded ? null : (
      <section id="whats-included" className="pricing-island section-block">
        <div className="mx-auto grid max-w-[1100px] gap-10 px-4 text-start sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-8">
          <div><p className="mb-4 text-[11px] uppercase tracking-[.25em] text-[#b79043]">אותו ערך בשני המסלולים</p><h2 className="mb-5 text-3xl font-heading text-white md:text-4xl">מה מקבלים בפועל?</h2><p className="font-light leading-relaxed text-white/50">לא עוד אוסף שיעורים. התהליך מחבר בין למידה, ביצוע, מדידה וקהילה כדי לבנות מערכת עבודה שחוזרת על עצמה.</p></div>
          <ul className="pricing-included grid gap-3 sm:grid-cols-2">
            {PROGRAM_INCLUDED.map(item => (
              <li key={item} className="glass-card flex items-start gap-3 p-5 text-sm text-white/70">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#b79043]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      {embedded ? null : (
      <section id="journey-preview" className="pricing-island section-block mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <p className="mb-4 text-[11px] uppercase tracking-[.25em] text-[#b79043]">33 הימים</p>
        <h2 className="mb-4 text-3xl font-heading text-white md:text-4xl">33 ימים. ארבעה שלבים ברורים.</h2>
        <p className="mx-auto mb-10 max-w-2xl font-light text-white/50">ממכירה ראשונה ועד תשתיות, סקייל וקהילה — כל שלב נשען על השלב שלפניו.</p>
        <ProgramHighlights />
        <Link to="/#journey" className="mt-8 inline-flex min-h-11 items-center text-sm text-[#b79043] hover:text-[#dfc47d]">לכל פירוט המסע</Link>
      </section>
      )}

      <section className={`pricing-trust pricing-island mx-auto max-w-[900px] px-4 sm:px-6 lg:px-8 ${embedded ? 'py-4' : 'py-12'}`}>
        {embedded ? (
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-light text-white/50">
            <ShieldCheck className="h-4 w-4 text-[#b79043]" aria-hidden />
            לא מבטיחים הכנסה ודאית. הצלחה תלויה בביצוע.
            <Link to="/terms" className="min-h-11 inline-flex items-center text-[#b79043] hover:text-[#dfc47d]">לתנאי השימוש</Link>
          </p>
        ) : (
        <div className="glass-card flex flex-col items-center gap-5 p-7 sm:flex-row sm:text-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#b79043]/10 text-[#b79043]"><ShieldCheck /></span>
          <div className="flex-1"><h2 className="mb-1 text-lg text-white">שקיפות לפני החלטה</h2><p className="text-sm font-light leading-relaxed text-white/50">לא מבטיחים הכנסה ודאית. הצלחה תלויה במאמץ, בביצוע ובהתמדה; תנאי ההחזרים והמימוש מפורטים במסמכים המשפטיים.</p></div>
          <Link to="/terms" className="min-h-11 shrink-0 rounded-full border border-white/15 px-5 py-3 text-sm text-white/65 hover:border-[#b79043]/50 hover:text-white">לתנאי השימוש</Link>
        </div>
        )}
      </section>

      <section id="pricing-faq" className={`pricing-island mx-auto max-w-[800px] px-4 sm:px-6 lg:px-8 ${embedded ? 'py-5' : 'section-block'}`}>
        <p className={`uppercase tracking-[.22em] text-[#b79043] ${embedded ? 'mb-3 text-[11px]' : 'mb-4 text-[11px]'}`}>שאלות</p>
        {embedded ? null : <h2 className="mb-10 text-3xl font-heading text-white md:text-4xl">שאלות על המסלול והמחיר</h2>}
        <div className={`text-start ${embedded ? 'divide-y divide-[#b79043]/15' : 'space-y-3'}`}>
          {PRICE_FAQS.map(item => (
            <details key={item.q} className={embedded ? 'group py-2' : 'group glass-card p-5'}>
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-white">
                <span className={embedded ? 'text-sm' : undefined}>{item.q}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#b79043] transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm font-light leading-relaxed text-white/50">{item.a}</p>
            </details>
          ))}
        </div>
        {embedded ? null : (
          <Link to="/#faq" className="mt-8 inline-flex min-h-11 items-center text-sm text-[#b79043] hover:text-[#dfc47d]">לכל השאלות הנפוצות</Link>
        )}
      </section>
    </div>
  );
}
