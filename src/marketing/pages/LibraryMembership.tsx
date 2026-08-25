import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import {
  LIBRARY_CHECKOUT_PENDING_KEY,
  LIBRARY_PLANS,
  type LibraryPaidPlan,
} from '../../constants/libraryPlans';
import { trackEvent } from '../../utils/analytics';
import { hasFullLibraryAccess } from '../../utils/access';
import { checkoutApi, startLibraryCheckout, type CheckoutStatus } from '../../api/checkout';

const PILOT_PAID_MESSAGE =
  'סליקה עדיין לא מחוברת. בפיילוט אדמין פותח גישה ידנית — לא רכישת הרצאה בודדת.';

export function LibraryMembership() {
  const { user, isGuest, startTrialOrSubscribe, refreshUser, setAuthModalOpen } = useUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasAccess = hasFullLibraryAccess(user);
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'info' | 'success'; text: string } | null>(
    null
  );
  const messageRef = useRef<HTMLParagraphElement>(null);

  const showMessage = (next: { kind: 'error' | 'info' | 'success'; text: string }) => {
    setMessage(next);
    window.setTimeout(() => {
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    void checkoutApi
      .status()
      .then(setStatus)
      .catch(() =>
        setStatus({
          enabled: false,
          library: {
            monthly: { beforeVat: 88, withVat: 102.96, label: LIBRARY_PLANS.monthly.priceLabel },
            annual: { beforeVat: 888, withVat: 1038.96, label: LIBRARY_PLANS.annual.priceLabel },
          },
        })
      );
  }, []);

  useEffect(() => {
    const paid = searchParams.get('paid') === '1';
    const cancelled = searchParams.get('cancelled') === '1';
    const sessionId = searchParams.get('session_id') || '';
    if (!paid && !cancelled) return;

    const clearQuery = () => {
      const next = new URLSearchParams(searchParams);
      next.delete('paid');
      next.delete('cancelled');
      next.delete('session_id');
      setSearchParams(next, { replace: true });
    };

    if (cancelled) {
      showMessage({ kind: 'info', text: 'התשלום בוטל. אפשר לבחור מנוי שוב בכל עת.' });
      clearQuery();
      return;
    }

    if (paid && sessionId && !isGuest) {
      setPending(true);
      void checkoutApi
        .confirmLibrary(sessionId)
        .then(async () => {
          await refreshUser();
          showMessage({ kind: 'success', text: 'המנוי לספרייה פעיל. אפשר לצפות בתכנים המלאים.' });
        })
        .catch((err) => {
          showMessage({
            kind: 'error',
            text:
              err instanceof Error
                ? err.message
                : 'התשלום התקבל, אך עדכון המנוי נכשל. רעננו את הדף או פנו אלינו.',
          });
        })
        .finally(() => {
          setPending(false);
          clearQuery();
        });
      return;
    }

    if (paid) {
      void refreshUser();
      showMessage({ kind: 'success', text: 'המנוי לספרייה פעיל. אפשר לצפות בתכנים המלאים.' });
      clearQuery();
    }
  }, [searchParams, isGuest, refreshUser, setSearchParams]);

  useEffect(() => {
    if (isGuest || status === null) return;
    const plan = sessionStorage.getItem(LIBRARY_CHECKOUT_PENDING_KEY);
    if (plan !== 'monthly' && plan !== 'annual') return;
    sessionStorage.removeItem(LIBRARY_CHECKOUT_PENDING_KEY);
    if (!status.enabled) {
      showMessage({ kind: 'info', text: PILOT_PAID_MESSAGE });
      return;
    }
    setPending(true);
    void startLibraryCheckout(plan)
      .catch((err) => {
        showMessage({
          kind: 'error',
          text: err instanceof Error ? err.message : 'לא ניתן לפתוח תשלום כרגע',
        });
      })
      .finally(() => setPending(false));
  }, [isGuest, status, user.id]);

  const chooseTrial = () => {
    trackEvent('upgrade_clicked', { source: 'library_membership', plan: 'free_trial' });
    trackEvent('trial_started', { source: 'library_membership' });
    if (isGuest) {
      startTrialOrSubscribe('free_trial');
      return;
    }
    startTrialOrSubscribe('free_trial');
    navigate('/library');
  };

  const choosePaid = (plan: LibraryPaidPlan) => {
    trackEvent('upgrade_clicked', { source: 'library_membership', plan });
    if (status === null) {
      showMessage({ kind: 'info', text: 'טוענים אפשרויות תשלום. נסו שוב בעוד רגע.' });
      return;
    }
    if (!status.enabled) {
      showMessage({ kind: 'info', text: PILOT_PAID_MESSAGE });
      return;
    }
    if (isGuest) {
      sessionStorage.setItem(LIBRARY_CHECKOUT_PENDING_KEY, plan);
      setAuthModalOpen(true);
      return;
    }
    setPending(true);
    void startLibraryCheckout(plan)
      .catch((err) => {
        showMessage({
          kind: 'error',
          text: err instanceof Error ? err.message : 'לא ניתן לפתוח תשלום כרגע',
        });
      })
      .finally(() => setPending(false));
  };

  const monthlyLabel = status?.library.monthly.label || LIBRARY_PLANS.monthly.priceLabel;
  const annualLabel = status?.library.annual.label || LIBRARY_PLANS.annual.priceLabel;
  const stripeOn = Boolean(status?.enabled);

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-right">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8A24C] mb-4">מנוי ספרייה</p>
      <h1 className="text-3xl md:text-4xl font-serif italic text-white mb-4">גישה לספריית Infinite Masterpiece</h1>
      <p className="text-sm md:text-base text-white/50 font-light leading-relaxed max-w-2xl mb-4">
        הספרייה נמכרת במנוי לצפייה — לא ברכישת קורס בודד. מנוי פותח הרצאות, הדרכות, מסלולים ועדכונים חדשים.
      </p>
      <p className="text-xs text-white/35 font-light mb-10 max-w-2xl">
        מסלול האמיצים / ההססנים (8,888 ₪) הוא כניסה למיזם — נפרד ממנוי הספרייה.{' '}
        <Link to="/pricing" className="text-[#C8A24C] hover:text-[#F7E7B5] underline-offset-2 hover:underline">
          בדיקת התאמה למסלול המלא
        </Link>
      </p>

      {message && (
        <p
          ref={messageRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          className={`rounded-2xl border p-4 mb-8 text-sm outline-none ${
            message.kind === 'error'
              ? 'border-rose-400/40 bg-rose-400/10 text-rose-200'
              : message.kind === 'success'
                ? 'border-[#C8A24C]/40 bg-[#C8A24C]/10 text-[#F7E7B5]'
                : 'border-white/15 bg-white/[0.04] text-white/75'
          }`}
        >
          {message.text}
        </p>
      )}

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
          const priceLabel =
            key === 'monthly' ? monthlyLabel : key === 'annual' ? annualLabel : plan.priceLabel;
          const paidDisabled = hasAccess || trialUsed || pending;
          return (
            <div
              key={key}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col"
            >
              <h2 className="text-lg font-medium text-white mb-1">{plan.title}</h2>
              <p className="text-xs text-white/45 mb-4 flex-1">{plan.subtitle}</p>
              <p className="text-2xl text-[#F7E7B5] mb-4">{priceLabel}</p>
              <button
                type="button"
                disabled={paidDisabled}
                aria-busy={pending && key !== 'trial'}
                onClick={() => {
                  if (key === 'trial') chooseTrial();
                  else choosePaid(plan.id as LibraryPaidPlan);
                }}
                className="w-full py-3 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11 cursor-pointer hover:bg-[#F7E7B5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {pending && key !== 'trial' ? 'מעבירים לתשלום...' : plan.cta}
              </button>
              {key !== 'trial' ? (
                <p className="text-[11px] text-white/30 mt-3 leading-relaxed">
                  {stripeOn
                    ? 'התשלום נפרד ממסלול האמיצים / ההססנים. כולל מע״מ 17%.'
                    : 'סליקה ב-Stripe תופעל עם מפתחות. בפיילוט — אדמין פותח גישה ידנית.'}
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

      {isGuest && (
        <p className="mt-6 text-xs text-white/35">
          להתחלת ניסיון צריך חשבון.{' '}
          <button
            type="button"
            className="text-[#C8A24C] hover:underline min-h-11"
            onClick={() => setAuthModalOpen(true)}
          >
            כניסה / הרשמה
          </button>
        </p>
      )}
    </div>
  );
}
