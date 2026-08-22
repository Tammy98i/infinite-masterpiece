import { useEffect, useState } from 'react';
import { trackEvent, scrollToWebinarForm } from '../../utils/analytics';

const PREFILL_KEY = 'webinar_exit_email';

type Props = {
  enabled?: boolean;
};

export function WebinarExitIntent({ enabled = true }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const onMouseLeave = (event: MouseEvent) => {
      if (shown || event.clientY > 0) return;
      setShown(true);
      setOpen(true);
      trackEvent('webinar_exit_intent_shown');
    };

    document.addEventListener('mouseleave', onMouseLeave);
    return () => document.removeEventListener('mouseleave', onMouseLeave);
  }, [enabled, shown]);

  const handleSave = () => {
    if (!email.trim()) return;
    try {
      sessionStorage.setItem(PREFILL_KEY, email.trim());
    } catch {
      /* ignore */
    }
    trackEvent('webinar_exit_intent_submitted');
    setOpen(false);
    scrollToWebinarForm();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-3xl border border-[#C8A24C]/30 bg-[#010308] p-6 text-right shadow-2xl">
        <h2 className="text-xl text-white font-light mb-2">לפני שיוצאים — שמר/י מקום</h2>
        <p className="text-sm text-white/50 font-light mb-4">
          הזינ/י אימייל ונעביר אותך להשלמת הרשמה מהירה.
        </p>
        <div className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="אימייל"
            className="w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-white min-h-11"
          />
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 rounded-full bg-[#C8A24C] text-black font-semibold min-h-11"
          >
            המשך להרשמה
          </button>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="mt-4 text-xs text-white/40 hover:text-white">
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
