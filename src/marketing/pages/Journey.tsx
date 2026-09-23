import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, Megaphone, ScrollText, Infinity, ArrowLeft, Check } from 'lucide-react';
import { PROGRAM_INCLUDED } from '../data/programIncluded';

const STEPS = [
  {
    num: '01',
    days: 'ימים 1-8',
    title: 'מכירות והשפעה',
    desc: 'איך מציגים ערך, שיחת מכירה, משא ומתן, וסגירת עסקאות מיידיות.',
    icon: Trophy,
  },
  {
    num: '02',
    days: 'ימים 9-16',
    title: 'שיווק ובידול',
    desc: 'מיתוג, מסרים, יצירת תוכן מבוסס ערך, ונוכחות שמושכת לקוחות.',
    icon: Megaphone,
  },
  {
    num: '03',
    days: 'ימים 17-24',
    title: 'מודל ותשתיות',
    desc: 'ארכיטקטורת מוצר, תמחור פרימיום, CRM ותהליכי עבודה אוטומטיים.',
    icon: ScrollText,
  },
  {
    num: '04',
    days: 'ימים 25-33',
    title: 'סקייל וקהילה',
    desc: 'פיננסים, שותפויות אסטרטגיות, בניית קהילה והמשך צמיחה.',
    icon: Infinity,
  },
];

const cardClass =
  'relative bg-white/[0.02] border border-white/[0.04] backdrop-blur-3xl rounded-[32px] hover:bg-white/[0.04] transition-all duration-700 shadow-[0_24px_48px_rgba(0,0,0,0.2)] group flex flex-col h-full overflow-hidden';

export function Journey({ embedded = false }: { embedded?: boolean }) {
  useEffect(() => {
    if (!embedded) window.scrollTo(0, 0);
  }, [embedded]);

  return (
    <div className="w-full">
      <section className={embedded ? 'pt-8 pb-10 md:pt-10 md:pb-12' : 'pt-32 pb-16 md:pt-40 md:pb-20'}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[13px] uppercase tracking-[0.3em] text-[#b79043] mb-6 font-semibold">התהליך</p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight mb-6">מסע 33 הימים.</h1>
          <p className="text-lg text-white/50 font-light max-w-2xl leading-relaxed">
            ארבעה שלבים שבונים מערכת עסקית סביב היצירה: ממכירה ראשונה ועד סקייל וקהילה.
          </p>
        </div>
      </section>

      <section id="whats-included" className={embedded ? 'pb-10 md:pb-14' : 'pb-16'}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[13px] uppercase tracking-[0.3em] text-[#b79043] mb-6 font-semibold">אותו ערך בשני המסלולים</p>
          <h2 className="text-3xl md:text-5xl font-light text-white leading-tight mb-5">מה מקבלים בפועל?</h2>
          <p className="text-lg text-white/50 font-light max-w-2xl leading-relaxed mb-10">
            לא עוד אוסף שיעורים. התהליך מחבר בין למידה, ביצוע, מדידה וקהילה כדי לבנות מערכת עבודה שחוזרת על עצמה.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PROGRAM_INCLUDED.map((item, idx) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className={`${cardClass} p-10 xl:p-12`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#b79043]/0 via-transparent to-[#b79043]/0 group-hover:from-[#b79043]/5 transition-all duration-700" />
                <div className="relative z-10 flex items-start gap-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/[0.06] text-[#b79043]">
                    <Check className="h-5 w-5" strokeWidth={1.25} />
                  </span>
                  <p className="pt-2 text-xl font-light text-white leading-relaxed">{item}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="journey-preview" className={embedded ? 'pb-12 md:pb-16' : 'pb-20 md:pb-28'}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[13px] uppercase tracking-[0.3em] text-[#b79043] mb-6 font-semibold">33 הימים</p>
          <h2 className="text-3xl md:text-5xl font-light text-white leading-tight mb-5">33 ימים. ארבעה שלבים ברורים.</h2>
          <p className="text-lg text-white/50 font-light max-w-2xl leading-relaxed mb-10">
            ממכירה ראשונה ועד תשתיות, סקייל וקהילה — כל שלב נשען על השלב שלפניו.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className={`${cardClass} p-10 xl:p-12`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#b79043]/0 via-transparent to-[#b79043]/0 group-hover:from-[#b79043]/5 transition-all duration-700" />
                <div className="relative z-10">
                  <div className="text-[48px] font-accent font-semibold tabular-nums text-white/10 mb-8 leading-none">
                    {step.num}
                  </div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#b79043]">{step.days}</span>
                    <step.icon
                      className="w-6 h-6 text-white/30 group-hover:text-[#b79043] transition-colors duration-500"
                      strokeWidth={1}
                    />
                  </div>
                  <h3 className="text-2xl font-light text-white mb-4">{step.title}</h3>
                  <p className="text-white/40 text-[15px] leading-relaxed font-light">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/#pricing"
              className="btn-gold text-black w-full sm:w-auto px-10 py-4 text-sm"
            >
              <span>להצטרפות למסע</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
            {embedded ? null : (
              <Link to="/" className="text-sm text-white/40 hover:text-[#b79043] transition-colors">
                חזרה לדף הבית
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
