import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export function ApplicationThankYou() {
  const [params] = useSearchParams();
  const paid = params.get('paid') === '1';

  return (
    <div className="min-h-screen bg-transparent pt-32 pb-24 flex items-center justify-center">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-[#b79043]/10 border border-[#b79043]/40 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-[#dfc47d]" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {paid ? 'התשלום התקבל.' : 'הבקשה שלך התקבלה בהצלחה.'}
          </h1>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            {paid
              ? 'מסלול האמיצים שולם במלואו. אם יש לכם חשבון באותו אימייל, הגישה לספרייה תיפתח אוטומטית. אחרת הצוות יחזור אליכם לפתיחת החשבון.'
              : 'תודה שמילאת את הפרטים. הצוות שלנו יעבור על התשובות שלך כדי לבדוק התאמה למסלול. ניצור איתך קשר בימים הקרובים (לרוב עד 48 שעות) להמשך התהליך.'}
          </p>

          <div className="mb-8 text-start rounded-2xl border border-[#b79043]/25 bg-[#05070d]/60 p-5">
            <p className="text-sm font-semibold text-white mb-3">מה עכשיו</p>
            <ul className="space-y-2 text-sm text-white/75 leading-relaxed">
              <li>{paid ? 'הגישה לספרייה נפתחת באותו אימייל.' : 'חלון חזרה: הצוות יוצר קשר, לרוב עד 48 שעות.'}</li>
              <li>אפשר כבר להיכנס לספרייה ולראות את הטעימות.</li>
            </ul>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Link to="/library" className="btn-gold text-black min-w-44">
              כניסה לספרייה
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white font-medium min-h-11"
            >
              חזרה לעמוד הראשי
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
