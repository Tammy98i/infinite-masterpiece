import { Check, ChevronDown, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EntryTrackCards } from '../components/EntryTrackCards';
import { ProgramHighlights } from '../components/ProgramHighlights';
import { SectionNav } from '../components/SectionNav';
import { FAQS } from './FAQPage';

const INCLUDED = [
  'תוכנית ליווי ביצועית בת 33 ימים',
  'ארבעה שלבים: מכירה, שיווק, תשתיות וסקייל',
  'גישה מלאה למיזם ולספריית אינסוף',
  'שידורים, משימות, קפטנים וקהילה',
];
const PRICE_FAQS = FAQS.filter((_, index) => [3, 5, 6, 7, 8].includes(index));

export function Pricing() {
  return (
    <div className="w-full pb-24 text-center">
      <section className="mx-auto max-w-[1100px] px-4 pb-16 pt-16 sm:px-6 md:pb-20 md:pt-24 lg:px-8">
        <nav aria-label="פירורי לחם" className="mb-10 flex items-center justify-center gap-2 text-xs text-white/35">
          <Link to="/" className="min-h-11 inline-flex items-center hover:text-white">בית</Link><span aria-hidden>›</span><span className="text-[#C8A24C]">מסלולים ומחיר</span>
        </nav>
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#C8A24C]/20 bg-[#C8A24C]/10 px-4 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C8A24C]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#F7E7B5]">המחזור הקרוב נפתח בקרוב</span>
        </div>
        <h1 className="mb-5 text-4xl font-heading text-white md:text-6xl">שתי דרכי כניסה. <span className="text-gold-gradient">אותו מסע.</span></h1>
        <p className="mx-auto max-w-2xl text-base font-light leading-relaxed text-white/55 md:text-lg">מסלול מלא שבונה מערכת עסקית סביב היצירה. ההבדל בין המסלולים הוא בקצב התשלום ובכרטיסי ההגרלה — לא בגישה לתוכן.</p>
      </section>

      <SectionNav items={[{ id: 'choose-track', label: 'בחירת מסלול' }, { id: 'whats-included', label: 'מה מקבלים' }, { id: 'journey-preview', label: '33 הימים' }, { id: 'pricing-faq', label: 'שאלות' }]} />

      <section id="choose-track" className="section-block mx-auto max-w-[1050px] px-4 sm:px-6 lg:px-8">
        <p className="mb-4 text-[11px] uppercase tracking-[.25em] text-[#C8A24C]">בחירת מסלול</p>
        <h2 className="mb-4 text-3xl font-heading text-white md:text-4xl">אמיצים או הססנים</h2>
        <p className="mx-auto mb-10 max-w-xl text-sm font-light leading-relaxed text-white/45">אמיצים: 8,008 ₪ לפני מע״מ בתשלום מלא. הססנים: 8,888 ₪ לפני מע״מ בארבע פעימות.</p>
        <EntryTrackCards />
      </section>

      <section id="whats-included" className="section-block border-y border-white/[0.05] bg-[#010308]/30">
        <div className="mx-auto grid max-w-[1100px] gap-10 px-4 text-right sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-8">
          <div><p className="mb-4 text-[11px] uppercase tracking-[.25em] text-[#C8A24C]">אותו ערך בשני המסלולים</p><h2 className="mb-5 text-3xl font-heading text-white md:text-4xl">מה מקבלים בפועל?</h2><p className="font-light leading-relaxed text-white/50">לא עוד אוסף שיעורים. התהליך מחבר בין למידה, ביצוע, מדידה וקהילה כדי לבנות מערכת עבודה שחוזרת על עצמה.</p></div>
          <ul className="grid gap-3 sm:grid-cols-2">{INCLUDED.map(item => <li key={item} className="glass-card flex items-start gap-3 p-5 text-sm text-white/70"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C8A24C]" /><span>{item}</span></li>)}</ul>
        </div>
      </section>

      <section id="journey-preview" className="section-block mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <p className="mb-4 text-[11px] uppercase tracking-[.25em] text-[#C8A24C]">מפת הדרך</p>
        <h2 className="mb-4 text-3xl font-heading text-white md:text-4xl">33 ימים. ארבעה שלבים ברורים.</h2>
        <p className="mx-auto mb-10 max-w-2xl font-light text-white/50">ממכירה ראשונה ועד תשתיות, סקייל וקהילה — כל שלב נשען על השלב שלפניו.</p>
        <ProgramHighlights />
        <Link to="/journey" className="mt-8 inline-flex min-h-11 items-center text-sm text-[#C8A24C] hover:text-[#F7E7B5]">לכל פירוט המסע</Link>
      </section>

      <section className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="glass-card flex flex-col items-center gap-5 p-7 sm:flex-row sm:text-right">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#C8A24C]/10 text-[#C8A24C]"><ShieldCheck /></span>
          <div className="flex-1"><h2 className="mb-1 text-lg text-white">שקיפות לפני החלטה</h2><p className="text-sm font-light leading-relaxed text-white/50">לא מבטיחים הכנסה ודאית. הצלחה תלויה במאמץ, בביצוע ובהתמדה; תנאי ההחזרים והמימוש מפורטים במסמכים המשפטיים.</p></div>
          <Link to="/terms" className="min-h-11 shrink-0 rounded-full border border-white/15 px-5 py-3 text-sm text-white/65 hover:border-[#C8A24C]/50 hover:text-white">לתנאי השימוש</Link>
        </div>
      </section>

      <section id="pricing-faq" className="section-block mx-auto max-w-[800px] px-4 sm:px-6 lg:px-8">
        <p className="mb-4 text-[11px] uppercase tracking-[.25em] text-[#C8A24C]">לפני שמחליטים</p>
        <h2 className="mb-10 text-3xl font-heading text-white md:text-4xl">שאלות על המסלול והמחיר</h2>
        <div className="space-y-3 text-right">{PRICE_FAQS.map(item => <details key={item.q} className="group glass-card p-5"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-white"><span>{item.q}</span><ChevronDown className="h-4 w-4 shrink-0 text-[#C8A24C] transition-transform group-open:rotate-180" /></summary><p className="mt-4 text-sm font-light leading-relaxed text-white/50">{item.a}</p></details>)}</div>
        <Link to="/faq" className="mt-8 inline-flex min-h-11 items-center text-sm text-[#C8A24C] hover:text-[#F7E7B5]">לכל השאלות הנפוצות</Link>
      </section>
    </div>
  );
}
