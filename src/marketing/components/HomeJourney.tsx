import { Link } from 'react-router-dom';
import { Check, type LucideIcon } from 'lucide-react';
import { DirNext } from '../../components/DirArrow';
import { PROGRAM_INCLUDED } from '../data/programIncluded';

type Step = { num: string; days: string; title: string; desc: string; icon: LucideIcon };

export function HomeJourney({ steps }: { steps: Step[] }) {
  return <section dir="rtl" className="mx-auto max-w-7xl px-5 py-10 sm:px-9 md:py-16 text-center text-white">
    <header className="mx-auto mb-8 max-w-2xl">
      <p className="mb-3 text-sm font-bold text-amber-200">התהליך</p>
      <h2 className="text-4xl font-semibold md:text-6xl">מסע 33 הימים.</h2>
      <p className="mt-4 text-lg leading-relaxed text-slate-200">ארבעה שלבים שבונים מערכת עסקית סביב היצירה: ממכירה ראשונה ועד סקייל וקהילה.</p>
    </header>
    <section id="journey-preview" className="border-t border-white/20 pt-7">
      <h3 className="text-2xl font-semibold">33 ימים. ארבעה שלבים ברורים.</h3>
      <p className="mt-2 text-slate-200">ממכירה ראשונה ועד תשתיות, סקייל וקהילה — כל שלב נשען על השלב שלפניו.</p>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(step => <li key={step.num} className="rounded-2xl border border-white/15 bg-slate-950/85 p-5 sm:p-6">
          <div className="flex items-center justify-center gap-2 text-amber-200"><span className="text-sm font-bold">שלב {step.num}</span><step.icon size={20} aria-hidden="true" /></div>
          <p className="mt-4 text-sm text-slate-300">{step.days}</p>
          <h4 className="mt-1 text-xl font-semibold">{step.title}</h4>
          <p className="mt-3 leading-7 text-slate-200">{step.desc}</p>
        </li>)}
      </ol>
    </section>
    <section id="whats-included" className="mt-9 rounded-2xl border border-white/15 bg-slate-900/90 p-5 sm:p-8">
      <p className="text-sm font-bold text-amber-200">אותו ערך בשני המסלולים</p>
      <h3 className="mt-2 text-2xl font-semibold">מה מקבלים בפועל?</h3>
      <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-200">לא עוד אוסף שיעורים. התהליך מחבר בין למידה, ביצוע, מדידה וקהילה כדי לבנות מערכת עבודה שחוזרת על עצמה.</p>
      <ul className="mt-5 grid gap-x-8 sm:grid-cols-2">{PROGRAM_INCLUDED.map(item => <li key={item} className="flex items-start justify-center gap-3 border-t border-white/15 py-3 leading-7"><Check size={18} aria-hidden="true" className="mt-1 shrink-0 text-amber-200" />{item}</li>)}</ul>
    </section>
    <Link to="/#pricing" className="btn-gold mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 px-7 sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">להצטרפות למסע <DirNext /></Link>
  </section>;
}
