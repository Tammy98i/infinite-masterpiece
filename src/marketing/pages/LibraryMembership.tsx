import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { LIBRARY_PLANS } from '../../constants/libraryPlans';
import { checkoutApi } from '../../api/checkout';
import { trackEvent } from '../../utils/analytics';
import { hasFullLibraryAccess } from '../../utils/access';
import { amountWithVat } from '../../data/entryTracks';

function priceLabel(beforeVat: number | null | undefined, fallback: string) {
  if (!beforeVat) return fallback;
  const withVat = amountWithVat(beforeVat);
  return `₪${withVat.toLocaleString('he-IL')} כולל מע״מ`;
}

export function LibraryMembership() {
  const { user, isGuest, startTrialOrSubscribe } = useUser();
  const navigate = useNavigate();
  const hasAccess = hasFullLibraryAccess(user);
  const [libraryStripe, setLibraryStripe] = useState(false);
  const [monthlyBeforeVat, setMonthlyBeforeVat] = useState<number | null>(null);
  const [annualBeforeVat, setAnnualBeforeVat] = useState<number | null>(null);
  const [busy, setBusy] = useState<'monthly' | 'annual' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkoutApi
      .status()
      .then((res) => {
        setLibraryStripe(Boolean(res.library?.enabled));
        setMonthlyBeforeVat(res.library?.monthlyBeforeVat ?? null);
        setAnnualBeforeVat(res.library?.annualBeforeVat ?? null);
      })
      .catch(() => undefined);
  }, []);

  const choose = async (plan: 'free_trial' | 'monthly' | 'annual') => {
    setError('');
    trackEvent('upgrade_clicked', { source: 'library_membership', plan });
    if (plan === 'free_trial') {
      trackEvent('trial_started', { source: 'library_membership' });
      startTrialOrSubscribe(plan);
      if (!isGuest) navigate('/library');
      return;
    }
    if (libraryStripe && !isGuest) {
      setBusy(plan);
      try {
        const { url } = await checkoutApi.createLibrarySession(plan);
        window.location.href = url;
      } catch (err) {
        setBusy(null);
        setError(err instanceof Error ? err.message : 'לא ניתן לפתוח תשלום');
      }
      return;
    }
    startTrialOrSubscribe(plan);
    if (!isGuest && !libraryStripe) navigate('/library');
  };

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8A24C] mb-4">מנוי ספרייה</p>
      <h1 className="text-3xl md:text-4xl font-heading text-white mb-4">גישה לספריית Infinite Masterpiece</h1>
      <p className="text-sm md:text-base text-white/50 font-light leading-relaxed max-w-2xl mb-4">
        הספרייה נמכרת במנוי לצפייה — לא ברכישת קורס בודד. מנוי פותח הרצאות, הדרכות, מסלולים ועדכונים חדשים.
      </p>
      <p className="text-xs text-white/35 font-light mb-10 max-w-2xl">
        מסלול האמיצים / ההססנים (8,888 ₪) הוא כניסה למיזם — נפרד ממנוי הספרייה.{' '}
        <Link to="/pricing" className="text-[#C8A24C] hover:text-[#F7E7B5] underline-offset-2 hover:underline">
          בדיקת התאמה למסלול המלא
        </Link>
      </p>

      {hasAccess ? (
        <div className="rounded-2xl border border-[#C8A24C]/30 bg-[#C8A24C]/10 p-6 mb-8">
          <p className="text-white/85">יש לכם כבר גישה פעילה לספרייה.</p>
          <Link
            to="/library"
            className="btn-gold text-black mt-4 px-6 py-3 text-sm"
          >
            מעבר לספרייה
          </Link>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-300 mb-4">{error}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {(['trial', 'monthly', 'annual'] as const).map((key) => {
          const plan = LIBRARY_PLANS[key];
          const trialUsed = !isGuest && user.subscriptionPlan !== 'none' && key === 'trial';
          const label =
            key === 'monthly'
              ? priceLabel(monthlyBeforeVat, plan.priceLabel)
              : key === 'annual'
                ? priceLabel(annualBeforeVat, plan.priceLabel)
                : plan.priceLabel;
          return (
            <div
              key={key}
              className="glass-card p-6 flex flex-col"
            >
              <h2 className="text-lg font-medium text-white mb-1">{plan.title}</h2>
              <p className="text-xs text-white/45 mb-4 flex-1">{plan.subtitle}</p>
              <p className="text-2xl text-[#F7E7B5] mb-4">{label}</p>
              <button
                type="button"
                disabled={hasAccess || trialUsed || busy !== null}
                onClick={() => void choose(plan.id)}
                className="btn-gold text-black w-full py-3 text-sm cursor-pointer"
              >
                {busy === plan.id ? 'פותחים תשלום…' : plan.cta}
              </button>
              {key !== 'trial' ? (
                <p className="text-[11px] text-white/30 mt-3 leading-relaxed">
                  {libraryStripe
                    ? 'תשלום ב-Stripe למנוי ספרייה בלבד — לא מסלול 8888.'
                    : 'סליקה ב-Stripe תופעל כשייקבעו מחירים ומפתח live. בפיילוט — אדמין יכול לפתוח גישה ידנית.'}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/10 p-5 text-sm text-white/45 font-light leading-relaxed">
        <strong className="text-white/70 font-normal">נבחרת 88</strong> — מועמדות נפרדת עם גישת premium_88.{' '}
        <Link to="/application?type=88" className="text-[#C8A24C] hover:underline">
          הגשת מועמדות
        </Link>
      </div>
    </div>
  );
}
