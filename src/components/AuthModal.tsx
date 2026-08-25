import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { X } from 'lucide-react';
import { libraryPath } from '../utils/libraryPath';
import { EmailConfirmationRequiredError } from '../api/supabaseAuth';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen, login, register } = useUser();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [errorKind, setErrorKind] = useState<'error' | 'info'>('error');

  if (!isAuthModalOpen) return null;

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
      if (next.role === 'admin') navigate(libraryPath('admin'));
      else if (next.role === 'instructor') navigate(libraryPath('lecturer'));
      else if (!window.location.pathname.startsWith('/library')) navigate('/library');
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
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 text-right"
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

        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
          {mode === 'register' && (
            <label className="block text-right">
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
          <label className="block text-right">
            <span className="block text-xs text-white/45 mb-1">אימייל</span>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              aria-invalid={Boolean(error) && errorKind === 'error'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#C8A24C] focus:outline-none min-h-11"
            />
          </label>
          <label className="block text-right">
            <span className="block text-xs text-white/45 mb-1">סיסמה</span>
            <input
              id="auth-password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              aria-invalid={Boolean(error) && errorKind === 'error'}
              aria-describedby="auth-password-hint"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#C8A24C] focus:outline-none min-h-11"
            />
            <span id="auth-password-hint" className="mt-1 block text-xs text-white/35">
              לפחות 8 תווים
            </span>
          </label>

          {error && (
            <p
              className={`text-sm ${errorKind === 'info' ? 'text-[#F7E7B5]' : 'text-rose-300'}`}
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11 cursor-pointer hover:bg-[#F7E7B5] transition-colors duration-200 disabled:opacity-60"
          >
            {pending ? 'רגע...' : mode === 'login' ? 'כניסה' : 'יצירת חשבון'}
          </button>
        </form>

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
