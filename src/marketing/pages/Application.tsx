import { useState, FormEvent, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { submitTrackLead } from '../../api/tracks';
import { checkoutApi, continueAfterTrackLead } from '../../api/checkout';
import { submitPremium88Application } from '../../api/premium88';
import { trackEvent } from '../../utils/analytics';

export function Application() {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  const trackParam = searchParams.get('track');
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkoutEnabled, setCheckoutEnabled] = useState(false);

  useEffect(() => {
    if (trackParam !== 'brave') return;
    checkoutApi
      .status()
      .then((res) => setCheckoutEnabled(res.enabled))
      .catch(() => setCheckoutEnabled(false));
  }, [trackParam]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      if (trackParam === 'brave') {
        trackEvent('brave_track_clicked');
        const fullName = String(data.get('fullName') || '');
        const email = String(data.get('email') || '');
        const { lead } = await submitTrackLead({
          trackType: 'brave',
          fullName,
          phone: String(data.get('phone') || ''),
          email,
          field: String(data.get('field') || ''),
          goal90: String(data.get('open') || ''),
          links: String(data.get('links') || ''),
        });
        const { redirected } = await continueAfterTrackLead({
          leadId: lead.id,
          trackType: 'brave',
          email,
          fullName,
        });
        if (!redirected) navigate('/thank-you-application');
        return;
      }
      if (typeParam === '88') {
        trackEvent('premium_88_cta_clicked');
        await submitPremium88Application({
          fullName: String(data.get('fullName') || ''),
          phone: String(data.get('phone') || ''),
          email: String(data.get('email') || ''),
          field: String(data.get('field') || ''),
          businessStage: String(data.get('stage') || ''),
          goal: String(data.get('goal') || ''),
          links: String(data.get('links') || ''),
          notes: String(data.get('open') || ''),
        });
        navigate('/thank-you-application');
        return;
      }
      navigate('/thank-you-application');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שליחה נכשלה');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-xl shadow-black/50"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-4">
              {typeParam === '88'
                ? 'הגשת מועמדות לנבחרת 88'
                : trackParam === 'brave'
                  ? 'מסלול האמיצים'
                  : 'בדיקת התאמה לתוכנית'}
            </h1>
            <p className="text-slate-400">
              מלאו את הפרטים בצורה המדויקת ביותר. התשובות שלכם יעזרו לנו להבין אם אנחנו יכולים לעזור לכם לייצר מערכת מכירות יציבה.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-slate-300">שם מלא *</label>
                <input required type="text" id="fullName" name="fullName" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all" />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-slate-300">טלפון נייד *</label>
                <input required type="tel" id="phone" name="phone" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">כתובת אימייל *</label>
              <input required type="email" id="email" name="email" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all" />
            </div>

            <div className="space-y-2">
              <label htmlFor="field" className="text-sm font-medium text-slate-300">תחום יצירה / עיסוק *</label>
              <input required type="text" id="field" name="field" placeholder="לדוגמה: מעצב גרפי, צלם, כותב תוכן" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all" />
            </div>

            <div className="space-y-2">
              <label htmlFor="stage" className="text-sm font-medium text-slate-300">באיזה שלב עסקי את/ה כרגע? *</label>
              <select required id="stage" name="stage" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none">
                <option value="">בחר/י שלב...</option>
                <option value="not_selling">עדיין לא מוכר/ת</option>
                <option value="first_sales">מכירות ראשונות</option>
                <option value="active">עסק פעיל</option>
                <option value="established">עסק מבוסס</option>
                <option value="scale">רוצה סקייל (התרחבות)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="goal" className="text-sm font-medium text-slate-300">מה המטרה המרכזית שלך כרגע? *</label>
              <select required id="goal" name="goal" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none">
                <option value="">בחר/י מטרה...</option>
                <option value="sales">להגדיל מכירות</option>
                <option value="brand">לשפר מיתוג</option>
                <option value="product">לבנות מוצר דיגיטלי/פיזי</option>
                <option value="exposure">להגדיל חשיפה</option>
                <option value="pricing">להעלות מחירים/תמחור</option>
                <option value="system">לייצר מערכת עסקית מסודרת</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="links" className="text-sm font-medium text-slate-300">לינק לאינסטגרם / אתר / תיק עבודות (אופציונלי)</label>
              <input type="url" id="links" name="links" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all" />
            </div>

            <div className="space-y-2">
              <label htmlFor="open" className="text-sm font-medium text-slate-300">מה הכי חשוב לך לשנות בעסק שלך עכשיו? *</label>
              <textarea required id="open" name="open" rows={4} className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"></textarea>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input required type="checkbox" id="consent" className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500" />
              <label htmlFor="consent" className="text-sm text-slate-400">
                אני מאשר/ת את <a href="/terms" className="text-cyan-400 hover:underline">תקנון האתר</a> ו<a href="/privacy" className="text-cyan-400 hover:underline">מדיניות הפרטיות</a>, ומסכים/ה לקבלת עדכונים ותכנים שיווקיים (ניתן להסיר את עצמך בכל עת).
              </label>
            </div>

            <div className="pt-6">
              {error ? <p className="text-sm text-rose-300 mb-4">{error}</p> : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 text-base font-medium rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : trackParam === 'brave' && checkoutEnabled ? (
                  'המשך לתשלום המלא'
                ) : (
                  'שליחת פרטים'
                )}
              </button>
              {trackParam === 'brave' ? (
                <p className="text-center text-white/30 text-[11px] leading-relaxed mt-4">
                  {checkoutEnabled
                    ? 'התשלום מתבצע דרך Stripe. פרטי הכרטיס לא נשמרים אצלנו.'
                    : 'החיוב עצמו ייפתח מול הצוות. אין כאן תשלום כרטיס מזויף.'}
                </p>
              ) : null}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
