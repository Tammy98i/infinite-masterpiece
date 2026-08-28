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
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

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
      const form = document.getElementById('webinar-register');
      const rect = form?.getBoundingClientRect();
      const formVisible = Boolean(rect && rect.bottom > 80 && rect.top < window.innerHeight);
      if (scrollingUpFast && !formVisible) reveal();
      lastY = y;
    };

    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, [enabled]);

  useEffect(() => {
    if (!open) return;
    const input = dialogRef.current?.querySelector<HTMLInputElement>('input');
    input?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        ),
      ].filter((el) => !el.hasAttribute('disabled'));
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="webinar-exit-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
        aria-label="סגירה"
        onClick={() => setOpen(false)}
      />
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-3xl border border-[#C8A24C]/30 bg-[#010308] px-6 py-8 text-center shadow-2xl"
      >
        <h2 id="webinar-exit-title" className="font-heading text-2xl text-white mb-3">
          לפני שיוצאים. השאירו אימייל.
        </h2>
        <p className="font-body text-base text-white/55 leading-relaxed mb-6 max-w-sm mx-auto">
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
            inputMode="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-white text-center min-h-11"
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
        <button
          ref={closeRef}
          type="button"
          onClick={() => setOpen(false)}
          className="mt-5 font-body font-normal text-sm text-white/45 hover:text-white cursor-pointer py-3 px-4 min-h-11"
        >
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
