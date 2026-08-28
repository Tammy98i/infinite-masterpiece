import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSupabase, isSupabaseAuthEnabled, loadSupabaseConfig } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { storeAuthNext } from '../../lib/authRedirect';

type AuthorizationDetails = {
  authorization_id?: string;
  redirect_uri?: string;
  redirect_url?: string;
  scope?: string;
  client?: { name?: string; client_uri?: string };
};

const SCOPE_LABELS: Record<string, string> = {
  openid: 'זהות בסיסית',
  email: 'כתובת האימייל',
  profile: 'שם ותמונת פרופיל',
  phone: 'מספר טלפון',
};

function scopeLabel(scope: string) {
  return SCOPE_LABELS[scope] || scope;
}

export function OAuthConsent() {
  const [searchParams] = useSearchParams();
  const authorizationId = searchParams.get('authorization_id') || '';
  const { isGuest, setAuthModalOpen, supabaseAuthEnabled } = useUser();
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await loadSupabaseConfig();
      if (cancelled) return;
      if (!authorizationId) {
        setError('חסר מזהה הרשאה. פתחו את האפליקציה מחדש.');
        setLoading(false);
        return;
      }
      if (!isSupabaseAuthEnabled()) {
        setError('התחברות חיצונית אינה מוגדרת.');
        setLoading(false);
        return;
      }
      if (isGuest) {
        storeAuthNext(`/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`);
        setAuthModalOpen(true);
        setLoading(false);
        return;
      }

      const supabase = getSupabase();
      if (!supabase) {
        setError('התחברות חיצונית אינה מוגדרת.');
        setLoading(false);
        return;
      }

      const { data, error: detailsError } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (cancelled) return;
      if (detailsError) {
        setError(detailsError.message || 'בקשת ההרשאה אינה תקינה');
        setLoading(false);
        return;
      }

      const payload = data as AuthorizationDetails | null;
      if (payload && !('authorization_id' in payload) && payload.redirect_url) {
        window.location.assign(payload.redirect_url);
        return;
      }
      setDetails(payload);
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [authorizationId, isGuest, setAuthModalOpen]);

  const decide = async (approve: boolean) => {
    if (!authorizationId) return;
    const supabase = getSupabase();
    if (!supabase) return;
    setPending(true);
    setError('');
    const { data, error: decideError } = approve
      ? await supabase.auth.oauth.approveAuthorization(authorizationId)
      : await supabase.auth.oauth.denyAuthorization(authorizationId);
    if (decideError) {
      setError(decideError.message);
      setPending(false);
      return;
    }
    const redirectUrl = (data as { redirect_url?: string } | null)?.redirect_url;
    if (redirectUrl) {
      window.location.assign(redirectUrl);
      return;
    }
    setError('לא התקבלה כתובת חזרה מהשרת');
    setPending(false);
  };

  const scopes = (details?.scope || '')
    .split(' ')
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 text-center">
        <h1 className="text-2xl font-medium text-white mb-2">אישור גישה</h1>
        {loading ? (
          <p className="text-white/60">טוענים בקשת הרשאה...</p>
        ) : error ? (
          <p className="text-rose-300 text-sm" role="alert">
            {error}
          </p>
        ) : isGuest ? (
          <>
            <p className="text-sm text-white/60 mb-6">
              כדי לאשר לאפליקציה לגשת לחשבון, צריך להתחבר קודם.
            </p>
            <button type="button" className="btn-gold text-black w-full" onClick={() => setAuthModalOpen(true)}>
              התחברות
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-white/60 mb-6">
              <strong className="text-white">{details?.client?.name || 'אפליקציה חיצונית'}</strong>
              {' '}מבקשת גישה לחשבון Infinite Masterpiece שלכם.
            </p>
            {details?.redirect_uri ? (
              <p className="text-[11px] text-white/35 mb-6 break-all" dir="ltr">
                {details.redirect_uri}
              </p>
            ) : null}
            {scopes.length ? (
              <ul className="text-sm text-white/70 mb-8 space-y-2 text-start">
                {scopes.map((scope) => (
                  <li key={scope}>{scopeLabel(scope)}</li>
                ))}
              </ul>
            ) : null}
            <div className="grid gap-3">
              <button
                type="button"
                className="btn-gold text-black w-full"
                disabled={pending || !supabaseAuthEnabled}
                onClick={() => void decide(true)}
              >
                {pending ? 'רגע...' : 'אישור'}
              </button>
              <button
                type="button"
                className="w-full py-3 rounded-full border border-white/15 text-white/70 text-sm min-h-11 cursor-pointer hover:text-white"
                disabled={pending}
                onClick={() => void decide(false)}
              >
                דחייה
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
