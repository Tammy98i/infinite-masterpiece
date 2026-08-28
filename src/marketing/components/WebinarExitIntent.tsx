import { FormEvent, useEffect, useRef, useState } from 'react';
import { webinarApi } from '../../api/webinar';
import { trackEvent, scrollToWebinarForm } from '../../utils/analytics';
import { getStoredUtm, utmAsRecord } from '../../utils/utm';

const PREFILL_KEY = 'webinar_exit_email';

type Props = {
  enabled?: boolean;
};

export function WebinarExitIntent({ enabled = true }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    if (!enabled || shownRef.current) return;

    const reveal = () => {
      if (shownRef.current) return;
      shownRef.current = true;
      setOpen(true);
      trackEvent('webinar_exit_intent_shown');
    };

    const onMouseLeave = (event: MouseEvent) => {
      if (event.clientY > 0) return;
      reveal();
    };

    let lastY = window.scrollY;
    let wentDown = false;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 480) wentDown = true;
      const scrollingUpFast = wentDown && y < lastY - 70;
      const hero = document.getElementById('webinar-register-hero');
      const rect = hero?.getBoundingClientRect();
      const heroVisible = Boolean(rect && rect.bottom > 80 && rect.top < window.innerHeight);
      if (scrollingUpFast && !heroVisible) reveal();
      lastY = y;
    };

    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, [enabled]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return;
    setError('');
    setSubmitting(true);
    try {
      sessionStorage.setItem(PREFILL_KEY, value);
    } catch {
      /* ignore */
    }
    try {
      await webinarApi.register({
        step: 'lead',
        email: value,
        ...utmAsRecord(getStoredUtm()),
      });
      trackEvent('webinar_exit_intent_submitted', { source: 'exit' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירה נכשלה');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setOpen(false);
    scrollToWebinarForm();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="webinar-exit-title">
      <div className="w-full max-w-md rounded-3xl border border-[#C8A24C]/30 bg-[#010308] p-6 text-right shadow-2xl">
        <h2 id="webinar-exit-title" className="text-xl text-white font-light mb-2">
          לפני שיוצאים. השאירו אימייל.
        </h2>
        <p className="text-sm text-white/50 font-light mb-4">
          נשמור את הכתובת ונעביר אתכם להשלמת הרשמה. בלי כרטיס אשראי.
        </p>
        <form className="space-y-3" onSubmit={(e) => void handleSave(e)}>
          <label htmlFor="webinar-exit-email" className="sr-only">
            אימייל
          </label>
          <input
            type="email"
            id="webinar-exit-email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="אימייל"
            className="w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-white min-h-11"
          />
          {error ? (
            <p className="text-sm text-rose-300" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-full bg-[#C8A24C] text-black font-semibold min-h-11 cursor-pointer hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
          >
            {submitting ? 'שומר…' : 'כן. משאיר/ה אימייל וממשיך/ה'}
          </button>
        </form>
        <button type="button" onClick={() => setOpen(false)} className="mt-4 text-xs text-white/40 hover:text-white cursor-pointer min-h-11">
          סגירה
        </button>
      </div>
    </div>
  );
}

export function consumeWebinarExitEmailPrefill() {
  try {
    const value = sessionStorage.getItem(PREFILL_KEY)?.trim() || '';
    if (value) sessionStorage.removeItem(PREFILL_KEY);
    return value;
  } catch {
    return '';
  }
}
