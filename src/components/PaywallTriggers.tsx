import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { usePaywall } from '../context/PaywallContext';
import { hasFullLibraryAccess } from '../utils/access';

const VISITS_KEY = 'mc_lib_visits';
const SESSION_KEY = 'mc_lib_session';
const LOGIN_KEY = 'mc_paywall_login';

export function PaywallTriggers() {
  const { user, isGuest, currentView, isWelcomeOpen } = useApp();
  const { openPaywall } = usePaywall();

  useEffect(() => {
    if (currentView === 'watch' || currentView === 'admin' || currentView === 'lecturer') return;
    if (user.role === 'admin' || hasFullLibraryAccess(user)) return;
    if (isWelcomeOpen) return;

    if (sessionStorage.getItem(LOGIN_KEY) === '1' && !isGuest) {
      sessionStorage.removeItem(LOGIN_KEY);
      openPaywall('first_login');
      return;
    }

    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');
    const visits = Number(localStorage.getItem(VISITS_KEY) || '0') + 1;
    localStorage.setItem(VISITS_KEY, String(visits));
    if (visits >= 3) openPaywall('return_visit');
  }, [currentView, user.role, user.subscriptionPlan, isGuest, isWelcomeOpen, openPaywall]);

  return null;
}
