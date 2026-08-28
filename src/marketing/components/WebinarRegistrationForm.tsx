import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { webinarApi } from '../../api/webinar';
import {
  WEBINAR_BLOCKER_OPTIONS,
  WEBINAR_INTEREST_OPTIONS,
  type WebinarPublicPayload,
} from '../../constants/webinar';
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
  'w-full bg-[#010308]/60 border border-[#C8A24C]/25 rounded-xl px-4 py-3 text-white text-sm text-right focus:outline-none focus:border-[#C8A24C] focus:ring-1 focus:ring-[#C8A24C]/40 min-h-11';

export function WebinarRegistrationForm({
  payload,
  formId = 'webinar-register',
  compact,
  onComplete,
}: Props) {
  const { config, registrationCount, spotsRemaining, isWaitlist, abVariant } = payload;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'a' | 'b'>('a');
  const [registrationId, setRegistrationId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(false);
  const formViewTracked = useRef(false);
  const resumedRef = useRef(false);
  const rootRef = useRef<HTMLFormElement>(null);
  const [prefillEmail, setPrefillEmail] = useState('');

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
        if (registration.step === 'done') {
          goToThankYou(registration.id, registration.fullName);
          return;
        }
        setRegistrationId(registration.id);
        try {
          sessionStorage.setItem(RESUME_KEY, registration.id);
        } catch {
          /* ignore */
        }
        if (registration.email) setPrefillEmail(registration.email);
        if (registration.step === 'b') {
          setStep('b');
          trackEvent('webinar_step_b_started', { source: 'resume', registrationId: registration.id });
        }
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

  const handleStepA = async (e: FormEvent<HTMLFormElement>) => {
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
        marketingOptIn: data.get('marketingOptIn') === 'on',
        abVariant,
        ...utmAsRecord(utm),
      });
      setRegistrationId(registration.id);
      try {
        sessionStorage.setItem(RESUME_KEY, registration.id);
      } catch {
        /* ignore */
      }
      if (registration.isWaitlist || registration.status === 'waitlist') {
        trackEvent('webinar_form_submitted', { source: formId, registrationId: registration.id });
        onComplete?.(registration.id);
        goToThankYou(registration.id, registration.fullName, true);
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
      trackEvent('webinar_form_submitted', { source: formId, registrationId: registration.id });
      onComplete?.(registration.id);
      goToThankYou(registration.id, registration.fullName);
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
            <h2 className="text-xl font-light text-white mb-1">כדי שנתאים את הערב אליך</h2>
            <p className="text-xs text-white/40 font-light">המקום כבר נשמר. עוד כמה פרטים.</p>
          </div>
        ) : null}

        <div>
          <label htmlFor={`${formId}-field`} className="text-xs text-white/60 mb-1 block text-right">
            תחום יצירה / עיסוק *
          </label>
          <input required id={`${formId}-field`} name="field" type="text" className={fieldClass} />
        </div>
        <div>
          <label htmlFor={`${formId}-interest`} className="text-xs text-white/60 mb-1 block text-right">
            איפה את/ה נמצא/ת היום? *
          </label>
          <select required id={`${formId}-interest`} name="interest" className={`${fieldClass} cursor-pointer`} defaultValue="">
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
          <label htmlFor={`${formId}-blocker`} className="text-xs text-white/60 mb-1 block text-right">
            מה צוואר הבקבוק המרכזי שלך? *
          </label>
          <select required id={`${formId}-blocker`} name="blocker" className={`${fieldClass} cursor-pointer`} defaultValue="">
            <option value="" disabled>
              בחר/י
            </option>
            {WEBINAR_BLOCKER_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <p className="text-sm text-rose-300" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black text-sm font-semibold min-h-11 cursor-pointer hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
        >
          {submitting ? 'שולח…' : 'סיום ההרשמה'}
        </button>
      </form>
    );
  }

  return (
    <form
      ref={rootRef}
      id={formId}
      onSubmit={handleStepA}
      onFocus={markStarted}
      className="space-y-4 text-right"
      aria-labelledby={`${formId}-title`}
    >
      {!compact ? (
        <div className="mb-2">
          <p id={`${formId}-title`} className="text-[11px] uppercase tracking-[0.2em] text-[#C8A24C] mb-2">
            {isWaitlist ? 'רשימת המתנה' : 'הרשמה לוובינר, שלב 1 מתוך 2'}
          </p>
          <h2 className="text-xl font-light text-white mb-1">
            {isWaitlist ? 'הצטרפ/י לרשימת המתנה' : 'נרשמים לערב החי'}
          </h2>
          <WebinarUrgencyStrip
            config={config}
            registrationCount={registrationCount}
            spotsRemaining={spotsRemaining}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${formId}-fullName`} className="text-xs text-white/60 mb-1 block text-right">
            שם מלא *
          </label>
          <input required id={`${formId}-fullName`} name="fullName" type="text" autoComplete="name" className={fieldClass} />
        </div>
        <div>
          <label htmlFor={`${formId}-phone`} className="text-xs text-white/60 mb-1 block text-right">
            טלפון *
          </label>
          <input
            required
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0500000000"
            dir="ltr"
            className={`${fieldClass} text-left`}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${formId}-email`} className="text-xs text-white/60 mb-1 block text-right">
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

      <label className="flex items-start gap-3 text-xs text-white/45 leading-relaxed cursor-pointer">
        <input type="checkbox" name="marketingOptIn" className="mt-1 accent-[#C8A24C] min-w-4 min-h-4 cursor-pointer" />
        <span>אישור קבלת עדכונים על הוובינר (ניתן לבטל בכל עת).</span>
      </label>

      <label className="flex items-start gap-3 text-xs text-white/45 leading-relaxed cursor-pointer">
        <input required type="checkbox" name="termsAccepted" className="mt-1 accent-[#C8A24C] min-w-4 min-h-4 cursor-pointer" />
        <span>
          אישור{' '}
          <Link to="/terms" className="text-[#C8A24C] hover:text-[#F7E7B5] underline-offset-2 hover:underline">
            תנאי שימוש
          </Link>{' '}
          ו
          <Link to="/privacy" className="text-[#C8A24C] hover:text-[#F7E7B5] underline-offset-2 hover:underline">
            מדיניות פרטיות
          </Link>
          .
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
        disabled={submitting || !config.enabled}
        className="w-full py-4 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black text-sm font-semibold min-h-11 cursor-pointer hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
      >
        {submitting ? 'שולח…' : isWaitlist ? 'הצטרפות לרשימת המתנה' : 'כן. אני מגיע/ה לערב החי'}
      </button>
    </form>
  );
}
