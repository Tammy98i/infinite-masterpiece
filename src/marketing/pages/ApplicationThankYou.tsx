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
          <div className="w-20 h-20 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-cyan-400" />
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

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium"
          >
            חזרה לעמוד הראשי
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
