import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, Megaphone, ScrollText, Infinity, ArrowLeft } from 'lucide-react';

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

export function Journey() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full">
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-6 font-semibold">התהליך</p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight mb-6">מסע 33 הימים.</h1>
          <p className="text-lg text-white/50 font-light max-w-2xl leading-relaxed">
            ארבעה שלבים שבונים מערכת עסקית סביב היצירה: ממכירה ראשונה ועד סקייל וקהילה.
          </p>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className="relative bg-white/[0.02] border border-white/[0.04] backdrop-blur-3xl rounded-[32px] p-10 hover:bg-white/[0.04] transition-all duration-700 shadow-[0_24px_48px_rgba(0,0,0,0.2)] group flex flex-col h-full overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#C8A24C]/0 via-transparent to-[#C8A24C]/0 group-hover:from-[#C8A24C]/5 transition-all duration-700" />
                <div className="relative z-10">
                  <div className="text-[48px] font-light text-white/10 mb-8 leading-none font-serif tracking-tighter">
                    {step.num}
                  </div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#C8A24C]">{step.days}</span>
                    <step.icon
                      className="w-6 h-6 text-white/30 group-hover:text-[#C8A24C] transition-colors duration-500"
                      strokeWidth={1}
                    />
                  </div>
                  <h2 className="text-2xl font-light text-white mb-4">{step.title}</h2>
                  <p className="text-white/40 text-[15px] leading-relaxed font-light">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/pricing"
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black text-sm font-bold min-h-11 inline-flex items-center justify-center gap-2"
            >
              <span>להצטרפות</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link to="/" className="text-sm text-white/40 hover:text-[#C8A24C] transition-colors">
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
