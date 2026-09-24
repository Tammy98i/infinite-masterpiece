import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Infinity, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatIls } from '../../utils/bidi';

export const FAQS = [
  {
    q: "מה זה Infinite Masterpiece?",
    a: "Infinite Masterpiece היא מערכת־על ליוצרים, אמנים ואנשים יצירתיים. זה לא עוד 'קורס דיגיטלי', אלא תוכנית ליווי ביצועית בת 33 ימים שנועדה לבנות מערכת הכנסה ושיווק מסודרת סביב הכישרון שלך."
  },
  {
    q: "למי זה מתאים?",
    a: "לאמנים, מוזיקאים, מעצבים, כותבים, מטפלים, יועצים, ולכל מי שיש לו ידע, כישרון או יצירה אמיתית, אבל אין לו מערכת שמייצרת מזה הכנסה קבועה."
  },
  {
    q: "למי זה לא מתאים?",
    a: "למי שמחפש 'כסף קל' או 'התעשרות מהירה', למי שאין לו ערך אמיתי לתת, או למי שלא מוכן לעבוד, לבצע ולצאת מאזור הנוחות שלו."
  },
  {
    q: "מה קורה לאורך 33 הימים?",
    a: "התוכנית מחולקת ל-4 שלבים: קודם בניית הצעה ומכירה, לאחר מכן שיווק ומיצוב, משם למודל עסקי ותשתיות, ולבסוף פיננסים וסקייל. כל שלב מלווה בשידורים, משימות, וליווי של קפטנים וקהילה."
  },
  {
    q: "מה זה Pods ומה תפקיד הקפטנים?",
    a: "כדי שלא תלכו לאיבוד בקהילה גדולה, אנחנו מחלקים את המשתתפים לקבוצות עבודה קטנות (Pods). לכל קבוצה יש קפטן מנוסה שתפקידו לוודא ביצוע, לענות על שאלות ולשמור על הקצב."
  },
  {
    q: "מה זה ספריית אינסוף האם נשארת לי גישה?",
    a: "ספריית אינסוף היא מאגר עצום של הקלטות, שיעורים, תבניות וכלים שילוו אתכם גם אחרי המסע של 33 הימים. הגישה לספרייה היא מתמשכת כחלק מההצטרפות לתוכנית (בכפוף לתקנון)."
  },
  {
    q: "מה ההבדל בין מסלול האמיצים למסלול ההססנים?",
    a: `מסלול האמיצים: ${formatIls(8008)} לפני מע״מ בתשלום מלא מראש, ו־2 כרטיסי כניסה לכל הגרלה. מסלול ההססנים: ${formatIls(8888)} לפני מע״מ בארבע פעימות (${formatIls(8)}, ${formatIls(80)}, ${formatIls(800)} ו־${formatIls(8000)}), עם גישה מלאה למיזם ולספרייה וכרטיס אחד לכל הגרלה. מסלול ההססנים אינו הנחה ואינו מסלול חלקי.`,
  },
  {
    q: "מה ההבדל בין המסלול הראשי לנבחרת 88?",
    a: "המסלול הראשי הוא המערכת המלאה. נבחרת 88 היא שכבת פרימיום מצומצמת (עד 88 איש) שכוללת Micro-Pods, ניתוח עומק אישי, Hot Seats, וגישה צמודה יותר לצוות ולמומחים."
  },
  {
    q: "האם יש החזר כספי או התחייבות להכנסה?",
    a: "הצלחה תלויה במאמץ, בביצוע ובהתמדה שלך, ולכן אין לנו אפשרות להבטיח הכנסה ודאית או תוצאות ספציפיות. מדיניות ההחזרים המלאה מפורטת בתקנון האתר."
  }
];

export function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [query, setQuery] = useState('');
  const filteredFaqs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? FAQS.filter(item => `${item.q} ${item.a}`.toLowerCase().includes(normalized)) : FAQS;
  }, [query]);

  return (
    <div className="min-h-screen relative pt-32 pb-48">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0b08]/25 via-transparent to-[#0d0b08]/35" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-20">
          <Infinity className="w-8 h-8 text-white/20 mx-auto mb-8" strokeWidth={1} />
          <h1 className="text-4xl md:text-6xl font-light text-white mb-6 tracking-tight">שאלות נפוצות</h1>
          <p className="text-xl font-light text-white/50">
            בהירות לפני קבלת החלטות.
          </p>
        </div>

        <label className="relative mb-8 block">
          <span className="sr-only">חיפוש בשאלות נפוצות</span>
          <Search className="pointer-events-none absolute start-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b79043]" />
          <input value={query} onChange={event => { setQuery(event.target.value); setOpenIndex(null); }} placeholder="חיפוש לפי נושא או שאלה…" className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pe-12 ps-14 text-white outline-none placeholder:text-white/35 focus:border-[#b79043]/60" />
          {query ? <button type="button" onClick={() => setQuery('')} className="absolute end-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white/40 hover:text-white" aria-label="ניקוי חיפוש"><X size={17} /></button> : null}
        </label>
        <p className="mb-4 text-sm text-white/40" role="status">{filteredFaqs.length} שאלות</p>
        <div className="space-y-4 mb-32">
          {filteredFaqs.map((faq, idx) => (
            <div 
              key={idx}
              className="glass-card overflow-hidden transition-colors hover:border-[#b79043]/50"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-8 text-center focus:outline-none"
              >
                <span className="text-lg font-heading text-white/90">{faq.q}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-[#b79043]/60 transition-transform duration-500 ${openIndex === idx ? 'rotate-180' : ''}`} 
                  strokeWidth={1.5}
                />
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="p-8 pt-0 text-white/50 font-light leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {filteredFaqs.length === 0 ? <div className="glass-card p-10 text-center"><p className="text-white/55">לא נמצאה תשובה מתאימה.</p><Link to="/webinar" className="mt-4 inline-flex min-h-11 items-center text-[#b79043] hover:text-[#dfc47d]">אפשר לשאול אותנו בערב החי</Link></div> : null}
        </div>

        {/* Hesitation CTA in FAQ */}
        <div className="text-center">
          <h2 className="text-[13px] uppercase tracking-[0.3em] text-white/40 mb-6 font-semibold">לא בטוחים עדיין?</h2>
          
          <h3 className="text-3xl md:text-4xl font-light text-white mb-8">
            יש גם מסלול להססנים.
          </h3>
          
          <p className="text-lg text-white/50 font-light max-w-xl mx-auto mb-12 leading-relaxed">
            אותו מחיר מלא בפריסה שמתחילה ב־{formatIls(8)}, ואחר כך {formatIls(80)}, {formatIls(800)} ו־{formatIls(8000)} לפי שלבי המיזם. לא הנחה ולא מסלול חלקי.
          </p>

          <Link
            to="/hesitation"
            className="inline-flex flex-col items-center justify-center px-12 py-6 rounded-[24px] bg-white/[0.02] text-white border border-[#b79043]/30 hover:bg-white/[0.05] hover:border-[#b79043]/60 transition-all duration-500 text-lg shadow-[0_0_20px_rgba(183, 144, 67,0.05)] hover:shadow-[0_0_40px_rgba(183, 144, 67,0.15)] group"
          >
            <span className="font-medium mb-1">אני מתחיל/ה ב־{formatIls(8)}</span>
            <span className="text-sm text-white/40 group-hover:text-[#b79043] transition-colors">מסלול ההססנים. 4 פעימות</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
