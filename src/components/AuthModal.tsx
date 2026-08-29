import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { X } from 'lucide-react';
import { libraryPath } from '../utils/libraryPath';
import { EmailConfirmationRequiredError } from '../api/supabaseAuth';
import { takeAuthNext } from '../lib/authRedirect';
import { formatPhoneDisplay } from '../utils/phone';

type Mode = 'login' | 'register' | 'forgot';
type Method = 'email' | 'phone';

const OTP_COOLDOWN_SEC = 60;

const fieldClass =
  'w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#C8A24C] focus:outline-none min-h-11';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    login,
    register,
    startPhoneOtp,
    verifyPhoneOtp,
    requestPasswordReset,
    loginWithGoogle,
    googleAuthEnabled,
    phoneAuthEnabled,
    supabaseAuthEnabled,
  } = useUser();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [method, setMethod] = useState<Method>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone] = useState('+972');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [errorKind, setErrorKind] = useState<'error' | 'info'>('error');
  const inFlight = useRef(false);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    setMethod('email');
    setOtpSent(false);
    setOtp('');
    setError('');
    setErrorKind('error');
    setResendIn(0);
  }, [isAuthModalOpen, mode]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  if (!isAuthModalOpen) return null;

  const goAfterAuth = (role: string) => {
    const next = takeAuthNext();
    if (next) {
      navigate(next);
      return;
    }
    if (role === 'admin') navigate(libraryPath('admin'));
    else if (role === 'instructor') navigate(libraryPath('lecturer'));
    else if (!window.location.pathname.startsWith('/library')) navigate('/library');
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setPhone('+972');
    setOtp('');
    setOtpSent(false);
    setResendIn(0);
  };

  const runExclusive = async (fn: () => Promise<void>) => {
    if (inFlight.current || pending) return;
    inFlight.current = true;
    setPending(true);
    try {
      await fn();
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorKind('error');
    if (mode === 'register' && password !== passwordConfirm) {
      setError('הסיסמאות אינן זהות');
      return;
    }
    await runExclusive(async () => {
      try {
        const next =
          mode === 'register' ? await register(name, email, password) : await login(email, password);
        resetForm();
        goAfterAuth(next.role);
      } catch (err) {
        if (err instanceof EmailConfirmationRequiredError) {
          setErrorKind('info');
          setError(err.message);
          setMode('login');
          setMethod('email');
        } else {
          setError(err instanceof Error ? err.message : 'כשל התחברות');
        }
      }
    });
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorKind('error');
    await runExclusive(async () => {
      try {
        await requestPasswordReset(email);
        setErrorKind('info');
        setError('אם יש חשבון עם האימייל הזה, נשלח קישור לאיפוס סיסמה.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שליחת קישור האיפוס נכשלה');
      }
    });
  };

  const sendOtp = async () => {
    await startPhoneOtp(phone);
    setOtpSent(true);
    setResendIn(OTP_COOLDOWN_SEC);
    setErrorKind('info');
    setError(`נשלח קוד ב-SMS אל ${formatPhoneDisplay(phone)}`);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorKind('error');
    await runExclusive(async () => {
      try {
        await sendOtp();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שליחת הקוד נכשלה');
      }
    });
  };

  const handleResendOtp = async () => {
    if (resendIn > 0) return;
    setError('');
    setErrorKind('error');
    await runExclusive(async () => {
      try {
        await sendOtp();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שליחת הקוד נכשלה');
      }
    });
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorKind('error');
    await runExclusive(async () => {
      try {
        const next = await verifyPhoneOtp(phone, otp, name);
        resetForm();
        goAfterAuth(next.role);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'הקוד שגוי');
      }
    });
  };

  const handleGoogle = async () => {
    setError('');
    setErrorKind('error');
    await runExclusive(async () => {
      try {
        const next =
          window.location.pathname === '/oauth/consent'
            ? `${window.location.pathname}${window.location.search}`
            : undefined;
        await loginWithGoogle(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'כשל התחברות עם Google');
      }
    });
  };

  const title =
    mode === 'forgot' ? 'איפוס סיסמה' : mode === 'login' ? 'כניסה לחשבון' : 'יצירת חשבון';
  const subtitle =
    mode === 'forgot'
      ? 'נשלח קישור לאימייל לאיפוס הסיסמה.'
      : mode === 'login'
        ? phoneAuthEnabled
          ? 'התחברו עם אימייל וסיסמה, או עם קוד לטלפון.'
          : 'התחברו עם האימייל והסיסמה שלכם.'
        : phoneAuthEnabled
          ? 'חשבון חינמי עם אימייל וסיסמה, או עם מספר טלפון.'
          : 'חשבון חינמי עם אימייל וסיסמה.';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 cursor-pointer"
        aria-label="סגירה"
        onClick={() => setAuthModalOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 text-center max-h-[92vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-6 start-6 p-2 text-white/50 hover:text-white min-h-11 min-w-11 flex items-center justify-center cursor-pointer"
          aria-label="סגירה"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="auth-title" className="text-2xl font-medium text-white mb-2">
          {title}
        </h2>
        <p className="text-sm text-white/50 font-light mb-6">{subtitle}</p>

        {mode !== 'forgot' && supabaseAuthEnabled && phoneAuthEnabled ? (
          <div className="mb-6 grid grid-cols-2 gap-2" role="tablist" aria-label="אופן התחברות">
            <MethodTab
              selected={method === 'email'}
              onClick={() => {
                setMethod('email');
                setError('');
                setOtpSent(false);
              }}
            >
              אימייל וסיסמה
            </MethodTab>
            <MethodTab
              selected={method === 'phone'}
              onClick={() => {
                setMethod('phone');
                setError('');
                if (!phone) setPhone('+972');
              }}
            >
              טלפון
            </MethodTab>
          </div>
        ) : null}

        {mode === 'forgot' ? (
          <form onSubmit={(e) => void handleForgotSubmit(e)} className="grid gap-4">
            <label className="block text-center">
              <span className="block text-xs text-white/45 mb-1">אימייל</span>
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${fieldClass} text-left`}
              />
            </label>
            <AuthAlert kind={errorKind} message={error} />
            <button type="submit" disabled={pending} className="btn-gold text-black w-full disabled:opacity-60">
              {pending ? 'שולחים...' : 'שליחת קישור לאיפוס'}
            </button>
          </form>
        ) : method === 'phone' && supabaseAuthEnabled ? (
          <form onSubmit={(e) => void (otpSent ? handleVerifyOtp(e) : handleSendOtp(e))} className="grid gap-4">
            {mode === 'register' && !otpSent ? (
              <label className="block text-center">
                <span className="block text-xs text-white/45 mb-1">שם מלא</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass}
                />
              </label>
            ) : null}
            <label className="block text-center">
              <span className="block text-xs text-white/45 mb-1">טלפון נייד</span>
              <input
                type="tel"
                required
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+972501234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={otpSent}
                className={`${fieldClass} text-left`}
                aria-describedby="auth-phone-hint"
              />
              <p id="auth-phone-hint" className="mt-1 text-[11px] text-white/35 font-light">
                פורמט בינלאומי E.164, למשל +972501234567 או 05XXXXXXXX
              </p>
            </label>
            {otpSent ? (
              <label className="block text-center">
                <span className="block text-xs text-white/45 mb-1">קוד מ-SMS</span>
                <input
                  type="text"
                  required
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="\d{6}"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`${fieldClass} text-left tracking-[0.4em]`}
                />
              </label>
            ) : null}

            <AuthAlert kind={errorKind} message={error} />

            <button
              type="submit"
              disabled={pending || (!phoneAuthEnabled && !otpSent)}
              className="btn-gold text-black w-full disabled:opacity-60"
            >
              {pending ? 'רגע...' : otpSent ? 'אישור קוד' : 'שליחת קוד'}
            </button>
            {otpSent ? (
              <button
                type="button"
                disabled={pending || resendIn > 0}
                onClick={() => void handleResendOtp()}
                className="w-full text-sm text-white/45 hover:text-white min-h-11 cursor-pointer disabled:opacity-40"
              >
                {resendIn > 0 ? `שליחת קוד מחדש בעוד ${resendIn} שניות` : 'שליחת קוד מחדש'}
              </button>
            ) : null}
          </form>
        ) : (
          <form onSubmit={(e) => void handleEmailSubmit(e)} className="grid gap-4">
            {mode === 'register' && (
              <label className="block text-center">
                <span className="block text-xs text-white/45 mb-1">שם מלא</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass}
                />
              </label>
            )}
            <label className="block text-center">
              <span className="block text-xs text-white/45 mb-1">אימייל</span>
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${fieldClass} text-left`}
              />
            </label>
            <label className="block text-center">
              <span className="block text-xs text-white/45 mb-1">סיסמה</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
              />
            </label>
            {mode === 'register' ? (
              <label className="block text-center">
                <span className="block text-xs text-white/45 mb-1">אימות סיסמה</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className={fieldClass}
                />
              </label>
            ) : null}

            <AuthAlert kind={errorKind} message={error} />

            <button type="submit" disabled={pending} className="btn-gold text-black w-full disabled:opacity-60">
              {pending ? 'רגע...' : mode === 'login' ? 'כניסה' : 'יצירת חשבון'}
            </button>
            {mode === 'login' && supabaseAuthEnabled ? (
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError('');
                  setErrorKind('error');
                }}
                className="w-full text-sm text-[#C8A24C] hover:text-[#F7E7B5] min-h-11 cursor-pointer"
              >
                שכחתי סיסמה
              </button>
            ) : null}
          </form>
        )}

        {mode !== 'forgot' && googleAuthEnabled ? (
          <>
            <div className="my-5 flex items-center gap-3" role="separator" aria-label="או">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] text-white/35">או</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <button
              type="button"
              onClick={() => void handleGoogle()}
              disabled={pending}
              className="w-full min-h-11 rounded-full border border-white/15 text-white/70 text-sm hover:text-white hover:border-white/40 cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <GoogleMark />
              <span>התחברות עם Google</span>
            </button>
          </>
        ) : null}

        {mode === 'login' && method === 'email' && !supabaseAuthEnabled ? (
          <p className="mt-4 text-[11px] text-white/35">
            בפריוו בלי שרת: חשבונות הדמו עובדים כאן (אותו אימייל וסיסמה כמו ב־npm run dev).
          </p>
        ) : null}

        {!phoneAuthEnabled && method === 'phone' && mode !== 'forgot' ? (
          <p className="mt-4 text-[11px] text-white/45" role="status">
            Phone/SMS עדיין כבוי ב-Supabase. יש להפעיל Authentication → Providers → Phone ולהגדיר Twilio (Account
            SID, Auth Token, מספר שולח). בינתיים אפשר להירשם באימייל וסיסמה.
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setError('');
            setErrorKind('error');
            setOtpSent(false);
            if (mode === 'forgot') setMode('login');
            else setMode(mode === 'login' ? 'register' : 'login');
          }}
          className="mt-6 w-full text-sm text-white/45 hover:text-white min-h-11 cursor-pointer"
        >
          {mode === 'forgot'
            ? 'חזרה לכניסה'
            : mode === 'login'
              ? 'אין חשבון? הרשמה'
              : 'כבר רשומים? כניסה'}
        </button>
      </div>
    </div>
  );
};

function MethodTab({
  selected,
  onClick,
  children,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-11 rounded-full text-sm font-medium cursor-pointer disabled:opacity-40 ${
        selected ? 'btn-gold text-black' : 'border border-white/15 text-white/60 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function AuthAlert({ kind, message }: { kind: 'error' | 'info'; message: string }) {
  if (!message) return null;
  return (
    <p className={`text-sm ${kind === 'info' ? 'text-[#F7E7B5]' : 'text-rose-300'}`} role="alert">
      {message}
    </p>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="currentColor"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.99 8.99 0 0 0 9 18Z"
      />
      <path
        fill="currentColor"
        d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.59.1-1.17.27-1.71V4.96H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33Z"
      />
      <path
        fill="currentColor"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
