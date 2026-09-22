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
          field: '',
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
          field: '',
          businessStage: '',
          goal: '',
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
      <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 lg:p-14 shadow-xl shadow-black/50"
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
              שם, טלפון ואימייל מספיקים כדי להתקדם. שאר הפרטים ייאספו אחר כך, לא לפני התשלום.
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

            <div className="flex items-start gap-3 pt-2">
              <input required type="checkbox" id="consent" className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500" />
              <label htmlFor="consent" className="text-sm text-slate-400">
                אני מאשר/ת את <a href="/terms" className="text-[#dfc47d] hover:underline">תקנון האתר</a> ו<a href="/privacy" className="text-[#dfc47d] hover:underline">מדיניות הפרטיות</a>, ומסכים/ה לקבלת עדכונים ותכנים שיווקיים (ניתן להסיר את עצמך בכל עת).
              </label>
            </div>

            <div className="pt-6">
              {error ? <p className="text-sm text-rose-300 mb-4">{error}</p> : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-gold text-black w-full py-4 text-base disabled:opacity-70 disabled:cursor-not-allowed"
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
