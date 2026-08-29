import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

export function UpdatePassword() {
  const { updatePassword, isGuest } = useUser();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== passwordConfirm) {
      setError('הסיסמאות אינן זהות');
      return;
    }
    if (pending) return;
    setPending(true);
    try {
      await updatePassword(password);
      navigate('/library', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'עדכון הסיסמה נכשל');
    } finally {
      setPending(false);
    }
  };

  if (isGuest) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-white/70 mb-6">קישור האיפוס אינו תקף או שפג תוקפו. בקשו קישור חדש.</p>
        <button type="button" className="btn-gold text-black" onClick={() => navigate('/library')}>
          חזרה לספרייה
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 text-center grid gap-4"
      >
        <h1 className="text-2xl font-medium text-white">סיסמה חדשה</h1>
        <p className="text-sm text-white/50 font-light">בחרו סיסמה חדשה לחשבון, לפחות 8 תווים.</p>
        <label className="block text-center">
          <span className="block text-xs text-white/45 mb-1">סיסמה חדשה</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#C8A24C] focus:outline-none min-h-11"
          />
        </label>
        <label className="block text-center">
          <span className="block text-xs text-white/45 mb-1">אימות סיסמה</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#C8A24C] focus:outline-none min-h-11"
          />
        </label>
        {error ? (
          <p className="text-sm text-rose-300" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={pending} className="btn-gold text-black w-full disabled:opacity-60">
          {pending ? 'שומרים...' : 'שמירת סיסמה'}
        </button>
      </form>
    </div>
  );
}

export default UpdatePassword;
