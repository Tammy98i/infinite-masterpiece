import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { OnboardingLevel, UserProfile } from '../types';
import { formatTrialEndDate } from '../utils/recommendations';
import { TRIAL_DAYS } from '../constants/brand';
import type { PlanId } from '../data/plans';
import { authApi, getAuthToken, setAuthToken, type AuthUserPayload } from '../api/auth';
import { isPaidPlan } from '../utils/access';
import {
  isSupabaseAuthEnabled,
  restoreSupabaseBrowserSession,
  sessionFromSupabaseUser,
  supabaseCompleteOAuthFromUrl,
  supabaseLogin,
  supabaseRegister,
  supabaseRequestPasswordReset,
  supabaseSignOut,
  supabaseStartGoogleOAuth,
  supabaseStartPhoneOtp,
  supabaseUpdatePassword,
  supabaseVerifyPhoneOtp,
  subscribeSupabaseAuth,
} from '../api/supabaseAuth';
import { isGoogleProviderEnabled, isPhoneProviderEnabled, loadSupabaseConfig } from '../lib/supabase';
import { previewLogin, previewRegister, previewSessionFromToken, isPreviewToken, isDemoEmail } from '../lib/previewAuth';
import { isApiUnavailableMessage } from '../lib/supabaseUser';

const GUEST_USER: UserProfile = {
  id: 'guest',
  name: 'אורח/ת',
  email: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
  subscriptionPlan: 'none',
  role: 'student',
  interests: [],
};

function fromPayload(user: AuthUserPayload): UserProfile {
  return {
    ...GUEST_USER,
    ...user,
    role: user.role || 'student',
    interests: user.interests || [],
    subscriptionPlan: user.subscriptionPlan || 'none',
    isFounder: Boolean(user.isFounder),
    staffDesk: user.staffDesk || '',
    staffStatus: user.staffStatus || 'active',
  };
}

interface UserContextType {
  user: UserProfile;
  isGuest: boolean;
  isAuthModalOpen: boolean;
  isWelcomeOpen: boolean;
  login: (email: string, password: string) => Promise<AuthUserPayload>;
  register: (name: string, email: string, password: string) => Promise<AuthUserPayload>;
  startPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, code: string, fullName?: string) => Promise<AuthUserPayload>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  loginWithGoogle: (nextPath?: string) => Promise<void>;
  completeOAuthLogin: () => Promise<AuthUserPayload>;
  supabaseAuthEnabled: boolean;
  googleAuthEnabled: boolean;
  phoneAuthEnabled: boolean;
  logout: () => void;
  startTrialOrSubscribe: (plan: PlanId) => void;
  cancelSubscription: () => void;
  setAuthModalOpen: (open: boolean) => void;
  setWelcomeOpen: (open: boolean) => void;
  updateUserInterests: (interests: string[]) => void;
  updateOnboardingLevel: (level: OnboardingLevel) => void;
  hasActiveSubscription: () => boolean;
  isPaying: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(GUEST_USER);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isWelcomeOpen, setWelcomeOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [supabaseAuthEnabled, setSupabaseAuthEnabled] = useState(isSupabaseAuthEnabled());
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);
  const [phoneAuthEnabled, setPhoneAuthEnabled] = useState(false);
  const pendingPlanRef = useRef<PlanId | null>(null);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      await loadSupabaseConfig();
      if (cancelled) return;
      setSupabaseAuthEnabled(isSupabaseAuthEnabled());
      setGoogleAuthEnabled(isGoogleProviderEnabled());
      setPhoneAuthEnabled(isPhoneProviderEnabled());

      const restored = (await restoreSupabaseBrowserSession()) || previewSessionFromToken(getAuthToken());
      if (cancelled) return;

      if (isPreviewToken(getAuthToken()) && restored) {
        setUser(fromPayload(restored.user));
        if (!cancelled) setReady(true);
        return;
      }

      if (restored) {
        setAuthToken(restored.token);
        setUser(fromPayload(restored.user));
        if (!cancelled) setReady(true);
        void authApi
          .me()
          .then(({ user: next }) => {
            if (!cancelled) setUser(fromPayload(next));
          })
          .catch(() => undefined);
        return;
      }

      if (getAuthToken()) {
        try {
          const { user: next } = await authApi.me();
          if (!cancelled) setUser(fromPayload(next));
        } catch {
          setAuthToken(null);
          if (!cancelled) setUser(GUEST_USER);
        }
      }
      if (!cancelled) setReady(true);
    };
    void boot();
    const unsub = subscribeSupabaseAuth((event, accessToken) => {
      if (cancelled) return;
      if (event === 'INITIAL_SESSION') return;
      if (event === 'SIGNED_OUT') {
        if (isPreviewToken(getAuthToken())) return;
        setAuthToken(null);
        setUser(GUEST_USER);
        return;
      }
      if (
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') &&
        accessToken
      ) {
        if (isPreviewToken(getAuthToken())) return;
        void sessionFromSupabaseUser(accessToken)
          .then((result) => {
            if (cancelled) return;
            setAuthToken(result.token);
            setUser(fromPayload(result.user));
          })
          .catch(() => undefined);
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const applyPlan = (plan: PlanId, userId: string) => {
    const trialEndsAt = plan === 'free_trial' ? formatTrialEndDate(TRIAL_DAYS) : undefined;
    setUser((prev) => ({
      ...prev,
      subscriptionPlan: plan,
      trialEndsAt,
    }));
    if (userId !== 'guest') {
      void authApi.setPlan(plan, trialEndsAt).then(({ user: next }) => setUser(fromPayload(next)));
    }
  };

  const applySession = (token: string, next: AuthUserPayload) => {
    setAuthToken(token);
    setUser(fromPayload(next));
    setAuthModalOpen(false);
    const pending = pendingPlanRef.current;
    pendingPlanRef.current = null;
    if (pending) applyPlan(pending, next.id);
  };

  const login = async (email: string, password: string) => {
    try {
      const result = isSupabaseAuthEnabled()
        ? await supabaseLogin(email, password)
        : await authApi.login(email, password);
      applySession(result.token, result.user);
      const plan = result.user.subscriptionPlan || 'none';
      if (!isPaidPlan(plan) && result.user.role !== 'admin') {
        sessionStorage.setItem('mc_paywall_login', '1');
      }
      return result.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      const canPreview = isApiUnavailableMessage(message) || isDemoEmail(email);
      if (!canPreview) throw err;
      const result = previewLogin(email, password);
      applySession(result.token, result.user);
      const plan = result.user.subscriptionPlan || 'none';
      if (!isPaidPlan(plan) && result.user.role !== 'admin') {
        sessionStorage.setItem('mc_paywall_login', '1');
      }
      return result.user;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const result = isSupabaseAuthEnabled()
        ? await supabaseRegister(name, email, password)
        : await authApi.register(name, email, password);
      applySession(result.token, result.user);
      setWelcomeOpen(true);
      return result.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (!isApiUnavailableMessage(message)) throw err;
      const result = previewRegister(name, email, password);
      applySession(result.token, result.user);
      setWelcomeOpen(true);
      return result.user;
    }
  };

  const completePhoneLogin = async (phone: string, code: string, fullName = '') => {
    const result = await supabaseVerifyPhoneOtp(phone, code, fullName);
    applySession(result.token, result.user);
    const plan = result.user.subscriptionPlan || 'none';
    if (!isPaidPlan(plan) && result.user.role !== 'admin') {
      sessionStorage.setItem('mc_paywall_login', '1');
    }
    return result.user;
  };

  const startPhoneOtp = async (phone: string) => {
    await supabaseStartPhoneOtp(phone);
  };

  const verifyPhoneOtp = async (phone: string, code: string, fullName = '') => {
    const user = await completePhoneLogin(phone, code, fullName);
    if (fullName.trim()) setWelcomeOpen(true);
    return user;
  };

  const requestPasswordReset = async (email: string) => {
    await supabaseRequestPasswordReset(email);
  };

  const updatePassword = async (password: string) => {
    await supabaseUpdatePassword(password);
  };

  const loginWithGoogle = async (nextPath?: string) => {
    await supabaseStartGoogleOAuth(nextPath);
  };

  const completeOAuthLogin = async () => {
    const result = await supabaseCompleteOAuthFromUrl();
    applySession(result.token, result.user);
    const plan = result.user.subscriptionPlan || 'none';
    if (!isPaidPlan(plan) && result.user.role !== 'admin') {
      sessionStorage.setItem('mc_paywall_login', '1');
    }
    return result.user;
  };

  const logout = () => {
    pendingPlanRef.current = null;
    setAuthToken(null);
    setUser(GUEST_USER);
    void supabaseSignOut().catch(() => undefined);
    void authApi.logout();
  };

  const startTrialOrSubscribe = (plan: PlanId) => {
    if (user.id === 'guest') {
      pendingPlanRef.current = plan;
      setAuthModalOpen(true);
      return;
    }
    applyPlan(plan, user.id);
  };

  const cancelSubscription = () => {
    if (user.id === 'guest') return;
    setUser((prev) => ({ ...prev, subscriptionPlan: 'none', trialEndsAt: undefined }));
    void authApi.setPlan('none').then(({ user: next }) => setUser(fromPayload(next)));
  };

  const updateUserInterests = (interests: string[]) => {
    setUser((prev) => ({ ...prev, interests }));
    if (user.id !== 'guest') void authApi.setInterests(interests);
  };

  const updateOnboardingLevel = (level: OnboardingLevel) => {
    setUser((prev) => ({ ...prev, onboardingLevel: level }));
  };

  const refreshUser = useCallback(async () => {
    if (isPreviewToken(getAuthToken())) {
      const restored = previewSessionFromToken(getAuthToken());
      if (restored) {
        setUser(fromPayload(restored.user));
        return;
      }
      setAuthToken(null);
      setUser(GUEST_USER);
      return;
    }
    if (!getAuthToken()) {
      const restored = await restoreSupabaseBrowserSession();
      if (restored) {
        setAuthToken(restored.token);
        setUser(fromPayload(restored.user));
        return;
      }
      setUser(GUEST_USER);
      return;
    }
    try {
      const { user: next } = await authApi.me();
      setUser(fromPayload(next));
    } catch {
      const restored = await restoreSupabaseBrowserSession();
      if (restored) {
        setAuthToken(restored.token);
        setUser(fromPayload(restored.user));
        return;
      }
      setAuthToken(null);
      setUser(GUEST_USER);
    }
  }, []);

  const hasActiveSubscription = () =>
    user.subscriptionPlan === 'free_trial' ||
    user.subscriptionPlan === 'monthly' ||
    user.subscriptionPlan === 'annual' ||
    user.subscriptionPlan === 'premium_88';

  const isPaying =
    user.subscriptionPlan === 'monthly' ||
    user.subscriptionPlan === 'annual' ||
    user.subscriptionPlan === 'premium_88';
  const isGuest = user.id === 'guest';

  if (!ready) return null;

  return (
    <UserContext.Provider
      value={{
        user,
        isGuest,
        isAuthModalOpen,
        isWelcomeOpen,
        login,
        register,
        startPhoneOtp,
        verifyPhoneOtp,
        requestPasswordReset,
        updatePassword,
        loginWithGoogle,
        completeOAuthLogin,
        supabaseAuthEnabled,
        googleAuthEnabled,
        phoneAuthEnabled,
        logout,
        startTrialOrSubscribe,
        cancelSubscription,
        setAuthModalOpen,
        setWelcomeOpen,
        updateUserInterests,
        updateOnboardingLevel,
        hasActiveSubscription,
        isPaying,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};
