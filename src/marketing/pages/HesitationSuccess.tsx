import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { DirBack } from '../../components/DirArrow';
import { Price } from '../../components/Price';
import { HESITANT_INSTALLMENTS } from '../../data/entryTracks';

export function HesitationSuccess() {
  const [params] = useSearchParams();
  const paid = params.get('paid') === '1';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen relative pt-32 pb-32 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0b08]/25 via-transparent to-[#0d0b08]/35" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-12"
        >
          <div className="w-24 h-24 rounded-full bg-[#b79043]/10 border border-[#b79043]/30 flex items-center justify-center mx-auto mb-8 relative">
            <CheckCircle2 className="w-10 h-10 text-[#b79043]" strokeWidth={1.5} />
          </div>

          <h1 className="text-4xl md:text-5xl font-light text-white mb-6 tracking-tight">
            {paid ? 'הפעימה הראשונה שולמה.' : 'הפעימה הראשונה בדרך.'}
          </h1>
          <p className="text-xl text-white/60 font-light leading-relaxed">
            {paid
              ? 'התשלום של 8 ₪ התקבל. הפעימות הבאות, 80, 800 ו־8,000, יגיעו במוצאי שבת לפי שלבי המיזם.'
              : 'הפרטים התקבלו. הצוות יחזור אליכם לפתיחת התשלום של 8 ₪, ואחר כך 80, 800 ו־8,000 לפי שלבי המיזם.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12 text-center">
          {HESITANT_INSTALLMENTS.map((item) => (
            <div key={item.number} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-white font-accent font-semibold mb-1"><Price amount={item.amountBeforeVat} /></p>
              <p className="text-xs text-white/40 font-light">{item.when}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 text-start rounded-2xl border border-[#b79043]/25 bg-[#05070d]/60 p-5">
          <p className="text-sm font-semibold text-white mb-3">מה עכשיו</p>
          <ul className="space-y-2 text-sm text-white/75 leading-relaxed">
            <li>הפעימה הבאה היא 80 ₪, ואחריה 800 ו־8,000, במוצאי שבת לפי שלבי המיזם.</li>
            <li>{paid ? 'הגישה לספרייה נפתחת באותו אימייל.' : 'הצוות יחזור לפתיחת הפעימה הראשונה של 8 ₪.'}</li>
          </ul>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Link to="/library" className="btn-gold text-black min-w-44">
            כניסה לספרייה
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-3 text-white/50 hover:text-white transition-colors group min-h-11"
          >
            <DirBack />
            <span className="text-[13px] uppercase tracking-widest">חזרה לעמוד הבית</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
