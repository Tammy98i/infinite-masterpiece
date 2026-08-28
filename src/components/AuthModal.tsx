import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { X } from 'lucide-react';
import { libraryPath } from '../utils/libraryPath';
import { EmailConfirmationRequiredError } from '../api/supabaseAuth';
import { takeAuthNext } from '../lib/authRedirect';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen, login, register, loginWithGoogle, supabaseAuthEnabled } =
    useUser();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [errorKind, setErrorKind] = useState<'error' | 'info'>('error');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorKind('error');
    setPending(true);
    try {
      const next =
        mode === 'register' ? await register(name, email, password) : await login(email, password);
      setName('');
      setEmail('');
      setPassword('');
      goAfterAuth(next.role);
    } catch (err) {
      if (err instanceof EmailConfirmationRequiredError) {
        setErrorKind('info');
        setError(err.message);
        setMode('login');
      } else {
        setError(err instanceof Error ? err.message : 'כשל התחברות');
      }
    } finally {
      setPending(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setErrorKind('error');
    setPending(true);
    try {
      const next =
        window.location.pathname === '/oauth/consent'
          ? `${window.location.pathname}${window.location.search}`
          : undefined;
      await loginWithGoogle(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'כשל התחברות עם Google');
      setPending(false);
    }
  };

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
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 text-center"
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
          {mode === 'login' ? 'כניסה לחשבון' : 'יצירת חשבון'}
        </h2>
        <p className="text-sm text-white/50 font-light mb-8">
          {mode === 'login'
            ? 'התחברו כדי לשמור התקדמות ולפתוח מנוי.'
            : 'חשבון חינמי. אחר כך אפשר לפתוח גישה מלאה.'}
        </p>

        {supabaseAuthEnabled ? (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => void handleGoogle()}
              disabled={pending}
              className="btn-gold text-black w-full gap-2"
            >
              <GoogleMark />
              <span>התחברות עם Google</span>
            </button>
            <p className="text-[11px] text-white/35 mt-4">או עם אימייל וסיסמה</p>
          </div>
        ) : null}

        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
          {mode === 'register' && (
            <label className="block text-center">
              <span className="block text-xs text-white/45 mb-1">שם מלא</span>
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#C8A24C] focus:outline-none min-h-11"
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#C8A24C] focus:outline-none min-h-11"
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
              className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#C8A24C] focus:outline-none min-h-11"
            />
          </label>

          {error ? (
            <p
              className={`text-sm ${errorKind === 'info' ? 'text-[#F7E7B5]' : 'text-rose-300'}`}
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11 cursor-pointer hover:bg-[#F7E7B5] transition-colors duration-200 disabled:opacity-60"
          >
            {pending ? 'רגע...' : mode === 'login' ? 'כניסה' : 'יצירת חשבון'}
          </button>
        </form>

        {mode === 'login' ? (
          <p className="mt-4 text-[11px] text-white/35">
            בפריוו בלי שרת: חשבונות הדמו עובדים כאן (אותו אימייל וסיסמה כמו ב־npm run dev).
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setError('');
            setErrorKind('error');
            setMode(mode === 'login' ? 'register' : 'login');
          }}
          className="mt-6 w-full text-sm text-white/45 hover:text-white min-h-11 cursor-pointer"
        >
          {mode === 'login' ? 'אין חשבון? הרשמה' : 'כבר רשומים? כניסה'}
        </button>
      </div>
    </div>
  );
};

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#111"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#111"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.99 8.99 0 0 0 9 18Z"
      />
      <path
        fill="#111"
        d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.59.1-1.17.27-1.71V4.96H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33Z"
      />
      <path
        fill="#111"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
