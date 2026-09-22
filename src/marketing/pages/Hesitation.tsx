import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Compass, Loader2, ArrowLeft } from 'lucide-react';
import { HESITANT_INSTALLMENTS, ENTRY_TRACK_FINE_PRINT } from '../../data/entryTracks';
import { submitTrackLead } from '../../api/tracks';
import { checkoutApi, continueAfterTrackLead } from '../../api/checkout';
import { trackEvent } from '../../utils/analytics';

function formatAmount(amount: number) {
  return amount.toLocaleString('he-IL');
}

export function Hesitation() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkoutEnabled, setCheckoutEnabled] = useState(false);

  useEffect(() => {
    trackEvent('hesitant_track_clicked');
    window.scrollTo(0, 0);
    checkoutApi
      .status()
      .then((res) => setCheckoutEnabled(res.enabled))
      .catch(() => setCheckoutEnabled(false));
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const fullName = String(data.get('fullName') || '');
      const email = String(data.get('email') || '');
      const { lead } = await submitTrackLead({
        trackType: 'hesitant',
        fullName,
        phone: String(data.get('phone') || ''),
        email,
        field: '',
        hesitationReason: String(data.get('hesitationReason') || ''),
      });
      trackEvent('hesitant_8_payment_started');
      const { redirected } = await continueAfterTrackLead({
        leadId: lead.id,
        trackType: 'hesitant',
        email,
        fullName,
      });
      if (!redirected) navigate('/hesitation-success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שליחה נכשלה');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative pt-24 pb-32">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0b08]/25 via-transparent to-[#0d0b08]/35" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[40vw] h-[40vw] bg-[#b79043]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <Compass className="w-10 h-10 text-[#b79043]/60 mx-auto mb-6" strokeWidth={1} />
          <h1 className="text-3xl md:text-5xl font-light text-white mb-6 tracking-tight">
            מסלול ההססנים
          </h1>
          <p className="text-lg text-white/60 font-light max-w-xl mx-auto leading-relaxed">
            אותו מחיר מלא, 8,888 ₪ לפני מע״מ, בארבע פעימות שמתחילות ב־8 ₪. לא הנחה ולא מסלול חלקי.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {HESITANT_INSTALLMENTS.map((item) => (
            <div key={item.number} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
              <p className="text-xl text-white font-accent font-semibold tabular-nums mb-1">{formatAmount(item.amountBeforeVat)} ₪</p>
              <p className="text-[11px] text-white/40 font-light leading-relaxed">{item.when}</p>
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/[0.01] border border-[#b79043]/20 backdrop-blur-2xl rounded-[32px] p-8 md:p-12 lg:p-14"
        >
          <form id="hesitation-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] text-white/60 uppercase tracking-widest px-2">שם מלא</label>
                <input required name="fullName" type="text" className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#b79043]/50 transition-colors min-h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] text-white/60 uppercase tracking-widest px-2">טלפון נייד</label>
                <input required name="phone" type="tel" dir="ltr" className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#b79043]/50 transition-colors text-center min-h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] text-white/60 uppercase tracking-widest px-2">אימייל</label>
              <input required name="email" type="email" dir="ltr" className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#b79043]/50 transition-colors text-center min-h-11" />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] text-white/60 uppercase tracking-widest px-2">על מה ההתלבטות שלך?</label>
              <select required name="hesitationReason" defaultValue="" className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#b79043]/50 transition-colors appearance-none cursor-pointer min-h-11">
                <option value="" disabled>בחר/י את הסיבה המרכזית</option>
                <option value="price" className="bg-[#0d0b08] text-white">המחיר. זה כרגע גדול עליי</option>
                <option value="not_sure_fit" className="bg-[#0d0b08] text-white">לא בטוח/ה אם זה מתאים ספציפית לי</option>
                <option value="not_ready" className="bg-[#0d0b08] text-white">לא בטוח/ה שאני מוכן/ה עדיין</option>
                <option value="no_product" className="bg-[#0d0b08] text-white">אין לי מוצר או שירות ברור עדיין</option>
                <option value="fear_of_sales" className="bg-[#0d0b08] text-white">יש לי חסם משמעותי ממכירות</option>
                <option value="time" className="bg-[#0d0b08] text-white">לא בטוח/ה שיש לי מספיק זמן</option>
                <option value="talk_first" className="bg-[#0d0b08] text-white">אני פשוט חייב/ת לדבר עם מישהו קודם</option>
                <option value="other" className="bg-[#0d0b08] text-white">אחר</option>
              </select>
            </div>

            <div className="flex items-start gap-4 pt-4">
              <input required type="checkbox" id="consent" className="mt-1.5 w-4 h-4 bg-transparent border-white/20 rounded text-[#b79043] focus:ring-[#b79043] focus:ring-offset-0" />
              <label htmlFor="consent" className="text-sm text-white/40 leading-relaxed font-light cursor-pointer">
                ידוע לי שמסלול ההססנים הוא תשלום מלא של 8,888 ₪ לפני מע״מ בארבע פעימות, ואינו הנחה.
                {checkoutEnabled
                  ? ' אחרי השליחה תועברו לתשלום מאובטח של הפעימה הראשונה, 8 ₪ לפני מע״מ.'
                  : ' הפרטים נקלטים כדי לפתוח את הפעימה הראשונה של 8 ₪ מול הצוות.'}
              </label>
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-gold text-black w-full py-5 text-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>שולח פרטים...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span>{checkoutEnabled ? 'המשך לתשלום מאובטח של 8 ₪' : 'אני מתחיל/ה ב־8 ₪'}</span>
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                </div>
              )}
            </button>
            <p className="text-center text-white/30 text-[11px] leading-relaxed mt-4">
              {checkoutEnabled
                ? 'התשלום מתבצע דרך Stripe. פרטי הכרטיס לא נשמרים אצלנו.'
                : 'החיוב עצמו ייפתח מול הצוות. אין כאן תשלום כרטיס מזויף.'}
            </p>
          </form>
        </motion.div>

        <p className="mt-10 text-[11px] text-white/30 font-light leading-relaxed text-center">
          {ENTRY_TRACK_FINE_PRINT}
        </p>
      </div>
    </div>
  );
}
