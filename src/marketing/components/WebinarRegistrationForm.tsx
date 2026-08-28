import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { webinarApi } from '../../api/webinar';
import type { WebinarPublicPayload } from '../../constants/webinar';
import { WEBINAR_REGISTER_ID } from '../../constants/webinarPage';
import { trackEvent } from '../../utils/analytics';
import { getStoredUtm, utmAsRecord } from '../../utils/utm';
import { isIsraeliMobile } from '../../utils/phone';
import { WebinarTrustStrip } from './WebinarSocialProof';
import { WebinarUrgencyStrip } from './WebinarCountdown';

const RESUME_KEY = 'webinar_registration_id';

type Props = {
  payload: WebinarPublicPayload;
  formId?: string;
  compact?: boolean;
  onComplete?: (registrationId: string) => void;
};

const fieldClass =
  'w-full bg-[#010308]/60 border border-[#C8A24C]/25 rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 text-white text-base text-right focus:outline-none focus:border-[#C8A24C] focus:ring-1 focus:ring-[#C8A24C]/40 min-h-11';

export function WebinarRegistrationForm({
  payload,
  formId = 'webinar-register',
  compact,
  onComplete,
}: Props) {
  const { config, registrationCount, spotsRemaining, isWaitlist, abVariant } = payload;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const startedRef = useRef(false);
  const formViewTracked = useRef(false);
  const resumedRef = useRef(false);
  const rootRef = useRef<HTMLFormElement>(null);
  const [prefillEmail, setPrefillEmail] = useState('');

  const goToThankYou = (id: string, fullName: string, waitlisted?: boolean) => {
    try {
      sessionStorage.removeItem(RESUME_KEY);
    } catch {
      /* ignore */
    }
    const params = new URLSearchParams({
      id,
      name: fullName,
      date: config.date,
      time: config.time,
    });
    if (waitlisted) params.set('waitlist', '1');
    navigate(`/webinar/thank-you?${params.toString()}`);
  };

  useEffect(() => {
    if (formId !== `${WEBINAR_REGISTER_ID}-form` || resumedRef.current) return;
    const fromQuery = searchParams.get('resume')?.trim() || '';
    let fromSession = '';
    try {
      fromSession = sessionStorage.getItem(RESUME_KEY)?.trim() || '';
    } catch {
      fromSession = '';
    }
    const resumeId = fromQuery || fromSession;
    if (!resumeId) return;
    resumedRef.current = true;
    webinarApi
      .resume(resumeId)
      .then(({ registration }) => {
        if (registration.step === 'done' || registration.step === 'b') {
          goToThankYou(registration.id, registration.fullName);
          return;
        }
        try {
          sessionStorage.setItem(RESUME_KEY, registration.id);
        } catch {
          /* ignore */
        }
        if (registration.email) setPrefillEmail(registration.email);
      })
      .catch(() => {
        resumedRef.current = false;
      });
  }, [formId, searchParams]);

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

  const markStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent('webinar_form_started', { source: formId });
    trackEvent('webinar_step_a_started', { source: formId });
  };

  const finishRegistration = (id: string, fullName: string, waitlisted?: boolean) => {
    trackEvent('webinar_form_submitted', { source: formId, registrationId: id });
    onComplete?.(id);
    goToThankYou(id, fullName, waitlisted);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    markStarted();

    const data = new FormData(e.currentTarget);
    const phone = String(data.get('phone') || '');
    if (!isIsraeliMobile(phone)) {
      setError('נא להזין מספר נייד ישראלי');
      setSubmitting(false);
      return;
    }
    const utm = getStoredUtm();
    try {
      const { registration } = await webinarApi.register({
        step: 'a',
        fullName: String(data.get('fullName') || ''),
        phone,
        email: String(data.get('email') || ''),
        marketingOptIn: data.get('marketingOptIn') !== 'off',
        abVariant,
        ...utmAsRecord(utm),
      });
      finishRegistration(
        registration.id,
        registration.fullName,
        registration.isWaitlist || registration.status === 'waitlist'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שליחה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAlreadyRegistered = async () => {
    const email = prefillEmail.trim();
    if (!email) {
      setError('נא להזין את האימייל שבו נרשמת');
      return;
    }
    setError('');
    setLookingUp(true);
    try {
      const { registration } = await webinarApi.lookup(email);
      finishRegistration(registration.id, registration.fullName, registration.isWaitlist || registration.status === 'waitlist');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'לא מצאנו הרשמה למייל הזה');
    } finally {
      setLookingUp(false);
    }
  };

  const busy = submitting || lookingUp;

  return (
    <form
      ref={rootRef}
      id={formId}
      onSubmit={handleSubmit}
      onFocus={markStarted}
      className="space-y-4 sm:space-y-5 text-right"
      aria-labelledby={`${formId}-title`}
    >
      {!compact ? (
        <div className="mb-2">
          <p id={`${formId}-title`} className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#C8A24C] mb-2">
            {isWaitlist ? 'רשימת המתנה' : 'הרשמה לוובינר'}
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-white mb-1">
            {isWaitlist ? 'הצטרפ/י לרשימת המתנה' : 'נרשמים לערב החי'}
          </h2>
          <WebinarUrgencyStrip
            config={config}
            registrationCount={registrationCount}
            spotsRemaining={spotsRemaining}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label htmlFor={`${formId}-fullName`} className="text-sm text-white/60 mb-1.5 block text-right">
            שם מלא *
          </label>
          <input required id={`${formId}-fullName`} name="fullName" type="text" autoComplete="name" className={fieldClass} />
        </div>
        <div>
          <label htmlFor={`${formId}-phone`} className="text-sm text-white/60 mb-1.5 block text-right">
            טלפון *
          </label>
          <input
            required
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="05XXXXXXXX"
            dir="ltr"
            className={`${fieldClass} text-left`}
            aria-describedby={`${formId}-phone-hint`}
          />
          <p id={`${formId}-phone-hint`} className="mt-1 text-[11px] text-white/35 font-light">
            נייד ישראלי, 05 או 9725
          </p>
        </div>
      </div>

      <div>
          <label htmlFor={`${formId}-email`} className="text-sm text-white/60 mb-1.5 block text-right">
          אימייל *
        </label>
        <input
          required
          id={`${formId}-email`}
          name="email"
          type="email"
          autoComplete="email"
          className={`${fieldClass} text-left`}
          dir="ltr"
          value={prefillEmail}
          onChange={(event) => setPrefillEmail(event.target.value)}
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-white/45 leading-relaxed cursor-pointer">
        <input
          required
          type="checkbox"
          name="termsAccepted"
          className="mt-1 accent-[#C8A24C] min-w-4 min-h-4 cursor-pointer"
        />
        <span>
          אישור{' '}
          <Link to="/terms" className="text-[#C8A24C] hover:text-[#F7E7B5] underline-offset-2 hover:underline">
            תנאי שימוש
          </Link>{' '}
          ו
          <Link to="/privacy" className="text-[#C8A24C] hover:text-[#F7E7B5] underline-offset-2 hover:underline">
            מדיניות פרטיות
          </Link>
          . עדכוני הוובינר נשלחים כברירת מחדל, עם אפשרות לבטל בכל עת.
        </span>
      </label>

      <WebinarTrustStrip config={config} />

      {error ? (
        <p className="text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || !config.enabled}
        className="w-full py-4 sm:py-5 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black text-base font-semibold min-h-11 cursor-pointer hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
      >
        {submitting ? 'שולח…' : isWaitlist ? 'הצטרפות לרשימת המתנה' : 'כן. אני מגיע/ה לערב החי'}
      </button>

      <p className="text-center">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleAlreadyRegistered()}
          className="text-sm text-white/45 hover:text-[#F7E7B5] min-h-11 inline-flex items-center cursor-pointer disabled:opacity-50 transition-colors duration-200"
        >
          {lookingUp ? 'בודקים…' : 'כבר נרשמתי'}
        </button>
      </p>
    </form>
  );
}
