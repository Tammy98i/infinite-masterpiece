import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { libraryPath } from '../../utils/libraryPath';
import { safeNextPath, takeAuthNext } from '../../lib/authRedirect';

export function AuthCallback() {
  const { completeOAuthLogin } = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    let cancelled = false;
    const run = async () => {
      try {
        const next = await completeOAuthLogin();
        if (cancelled) return;
        const requested =
          safeNextPath(new URLSearchParams(window.location.search).get('next')) || takeAuthNext();
        if (requested) {
          navigate(requested, { replace: true });
          return;
        }
        if (next.role === 'admin') navigate(libraryPath('admin'), { replace: true });
        else if (next.role === 'instructor') navigate(libraryPath('lecturer'), { replace: true });
        else navigate('/library', { replace: true });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'ההתחברות נכשלה');
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [completeOAuthLogin, navigate]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      {error ? (
        <>
          <p className="text-rose-300 text-sm mb-6" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="btn-gold text-black"
          >
            חזרה לדף הבית
          </button>
        </>
      ) : (
        <p className="text-white/70">משלימים התחברות...</p>
      )}
    </div>
  );
}
