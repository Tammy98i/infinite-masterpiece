import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { LIBRARY_PLANS } from '../../constants/libraryPlans';
import { trackEvent } from '../../utils/analytics';
import { hasFullLibraryAccess } from '../../utils/access';

export function LibraryMembership() {
  const { user, isGuest, startTrialOrSubscribe } = useUser();
  const navigate = useNavigate();
  const hasAccess = hasFullLibraryAccess(user);

  const choose = (plan: 'free_trial' | 'monthly' | 'annual') => {
    trackEvent('upgrade_clicked', { source: 'library_membership', plan });
    if (plan === 'free_trial') {
      trackEvent('trial_started', { source: 'library_membership' });
    } else {
      trackEvent('subscription_started', { source: 'library_membership', plan });
    }
    startTrialOrSubscribe(plan);
  };

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-right">
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
            className="inline-flex mt-4 px-6 py-3 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11 items-center"
          >
            מעבר לספרייה
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {(['trial', 'monthly', 'annual'] as const).map((key) => {
          const plan = LIBRARY_PLANS[key];
          const trialUsed = !isGuest && user.subscriptionPlan !== 'none' && key === 'trial';
          return (
            <div
              key={key}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col"
            >
              <h2 className="text-lg font-medium text-white mb-1">{plan.title}</h2>
              <p className="text-xs text-white/45 mb-4 flex-1">{plan.subtitle}</p>
              <p className="text-2xl text-[#F7E7B5] mb-4">{plan.priceLabel}</p>
              <button
                type="button"
                disabled={hasAccess || trialUsed}
                onClick={() => {
                  choose(plan.id);
                  if (!isGuest) navigate('/library');
                }}
                className="w-full py-3 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11 cursor-pointer hover:bg-[#F7E7B5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {plan.cta}
              </button>
              {key !== 'trial' ? (
                <p className="text-[11px] text-white/30 mt-3 leading-relaxed">
                  סליקה ב-Stripe תופעל בשלב ההשקה. בפיילוט — אדמין יכול לפתוח גישה ידנית.
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
