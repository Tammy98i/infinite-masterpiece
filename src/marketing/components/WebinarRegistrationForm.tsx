import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { webinarApi } from '../../api/webinar';
import type { WebinarPublicPayload } from '../../constants/webinar';
import { WEBINAR_BLOCKER_OPTIONS, WEBINAR_INTEREST_OPTIONS } from '../../constants/webinar';
import { trackEvent } from '../../utils/analytics';
import { getStoredUtm, utmAsRecord } from '../../utils/utm';
import { WebinarTrustStrip } from './WebinarSocialProof';
import { WebinarUrgencyStrip } from './WebinarCountdown';
import { consumeWebinarExitEmailPrefill } from './WebinarExitIntent';

type Props = {
  payload: WebinarPublicPayload;
  formId?: string;
  compact?: boolean;
  initialStep?: 'a' | 'b';
  registrationId?: string;
  onStepChange?: (step: 'a' | 'b') => void;
  onComplete?: (registrationId: string) => void;
};

export function WebinarRegistrationForm({
  payload,
  formId = 'webinar-register',
  compact,
  initialStep = 'a',
  registrationId: initialRegistrationId,
  onStepChange,
  onComplete,
}: Props) {
  const { config, registrationCount, spotsRemaining, isWaitlist, abVariant } = payload;
  const navigate = useNavigate();
  const [step, setStep] = useState<'a' | 'b'>(initialStep);
  const [registrationId, setRegistrationId] = useState(initialRegistrationId || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(false);
  const formViewTracked = useRef(false);
  const rootRef = useRef<HTMLFormElement>(null);
  const [prefillEmail] = useState(() => consumeWebinarExitEmailPrefill());

  useEffect(() => {
    if (initialRegistrationId) setRegistrationId(initialRegistrationId);
  }, [initialRegistrationId]);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || formViewTracked.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          formViewTracked.current = true;
          trackEvent('webinar_form_view', { formId });
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [formId]);

  const fieldClass =
    'w-full bg-[#010308]/60 border border-[#C8A24C]/25 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C8A24C] focus:ring-1 focus:ring-[#C8A24C]/40 min-h-11';

  const handleStepA = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent('webinar_step_a_started', { source: formId });
    }

    const data = new FormData(e.currentTarget);
    const utm = getStoredUtm();
    try {
      const { registration } = await webinarApi.register({
        step: 'a',
        fullName: String(data.get('fullName') || ''),
        phone: String(data.get('phone') || ''),
        email: String(data.get('email') || ''),
        marketingOptIn: data.get('marketingOptIn') === 'on',
        abVariant,
        ...utmAsRecord(utm),
      });
      setRegistrationId(registration.id);
      if (registration.isWaitlist || registration.status === 'waitlist') {
        navigate(
          `/webinar/thank-you?id=${encodeURIComponent(registration.id)}&name=${encodeURIComponent(registration.fullName)}&waitlist=1`
        );
        return;
      }
      setStep('b');
      trackEvent('webinar_step_b_started', { source: formId, registrationId: registration.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שליחה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepB = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    try {
      const { registration } = await webinarApi.register({
        step: 'b',
        registrationId,
        field: String(data.get('field') || ''),
        interest: String(data.get('interest') || ''),
        blocker: String(data.get('blocker') || ''),
      });
      onComplete?.(registration.id);
      navigate(
        `/webinar/thank-you?id=${encodeURIComponent(registration.id)}&name=${encodeURIComponent(registration.fullName)}&date=${encodeURIComponent(config.date)}&time=${encodeURIComponent(config.time)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שליחה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'b' && registrationId) {
    return (
      <form ref={rootRef} id={formId} onSubmit={handleStepB} className="space-y-4 text-right">
        {!compact ? (
          <div className="mb-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8A24C] mb-2">שלב 2 מתוך 2</p>
            <h2 className="text-xl font-light text-white mb-1">עוד 3 שאלות קצרות</h2>
            <p className="text-xs text-white/40 font-light">כדי שנוכל להתאים את הוובינר אליך</p>
          </div>
        ) : null}

        <div>
          <label htmlFor={`${formId}-field`} className="text-xs text-white/60 mb-1 block">
            תחום יצירה / עיסוק *
          </label>
          <input required id={`${formId}-field`} name="field" type="text" className={fieldClass} />
        </div>
        <div>
          <label htmlFor={`${formId}-interest`} className="text-xs text-white/60 mb-1 block">
            מה הכי מסקרן אותך? *
          </label>
          <select required id={`${formId}-interest`} name="interest" className={fieldClass} defaultValue="">
            <option value="" disabled>
              בחר/י
            </option>
            {WEBINAR_INTEREST_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${formId}-blocker`} className="text-xs text-white/60 mb-1 block">
            מה הכי תוקע אותך היום?
          </label>
          <select id={`${formId}-blocker`} name="blocker" className={fieldClass} defaultValue="">
            <option value="">לא חובה</option>
            {WEBINAR_BLOCKER_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black text-sm font-semibold min-h-11 hover:opacity-95 disabled:opacity-50"
        >
          {submitting ? 'שולח…' : 'סיום ההרשמה'}
        </button>
      </form>
    );
  }

  return (
    <form ref={rootRef} id={formId} onSubmit={handleStepA} className="space-y-4 text-right" aria-labelledby={`${formId}-title`}>
      {!compact ? (
        <div className="mb-2">
          <p id={`${formId}-title`} className="text-[11px] uppercase tracking-[0.2em] text-[#C8A24C] mb-2">
            הרשמה לוובינר · שלב 1 מתוך 2
          </p>
          <h2 className="text-xl font-light text-white mb-1">
            {isWaitlist ? 'הצטרפ/י לרשימת המתנה' : `שריינו מקום — ${config.spotsLabel}`}
          </h2>
          <p className="text-xs text-white/40 font-light mb-3">{config.title}</p>
          <WebinarUrgencyStrip
            config={config}
            registrationCount={registrationCount}
            spotsRemaining={spotsRemaining}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${formId}-fullName`} className="text-xs text-white/60 mb-1 block">
            שם מלא *
          </label>
          <input required id={`${formId}-fullName`} name="fullName" type="text" className={fieldClass} />
        </div>
        <div>
          <label htmlFor={`${formId}-phone`} className="text-xs text-white/60 mb-1 block">
            טלפון *
          </label>
          <input required id={`${formId}-phone`} name="phone" type="tel" className={fieldClass} />
        </div>
      </div>

      <div>
        <label htmlFor={`${formId}-email`} className="text-xs text-white/60 mb-1 block">
          אימייל *
        </label>
        <input required id={`${formId}-email`} name="email" type="email" className={fieldClass} defaultValue={prefillEmail} />
      </div>

      <label className="flex items-start gap-3 text-xs text-white/45 leading-relaxed cursor-pointer">
        <input type="checkbox" name="marketingOptIn" className="mt-1 accent-[#C8A24C] min-w-4 min-h-4" />
        <span>אני מאשר/ת קבלת עדכונים על הוובינר (ניתן לבטל בכל עת).</span>
      </label>

      <WebinarTrustStrip config={config} />

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || !config.enabled}
        className="w-full py-4 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black text-sm font-semibold min-h-11 hover:opacity-95 disabled:opacity-50"
      >
        {submitting ? 'שולח…' : isWaitlist ? 'הצטרפות לרשימת המתנה' : 'שריינו לי מקום — המשך'}
      </button>
    </form>
  );
}
