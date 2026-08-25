import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { OnboardingLevel, UserProfile } from '../types';
import { formatTrialEndDate } from '../utils/recommendations';
import { TRIAL_DAYS } from '../constants/brand';
import type { PlanId } from '../data/plans';
import { authApi, getAuthToken, setAuthToken, type AuthUserPayload } from '../api/auth';
import { isPaidPlan } from '../utils/access';
import { LIBRARY_CHECKOUT_PENDING_KEY } from '../constants/libraryPlans';

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
  const pendingPlanRef = useRef<PlanId | null>(null);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      if (!getAuthToken()) {
        setReady(true);
        return;
      }
      try {
        const { user: next } = await authApi.me();
        if (!cancelled) setUser(fromPayload(next));
      } catch {
        setAuthToken(null);
        if (!cancelled) setUser(GUEST_USER);
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void boot();
    return () => {
      cancelled = true;
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
    if (pending === 'free_trial') {
      applyPlan(pending, next.id);
    } else if (pending === 'monthly' || pending === 'annual') {
      sessionStorage.setItem(LIBRARY_CHECKOUT_PENDING_KEY, pending);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    applySession(result.token, result.user);
    const plan = result.user.subscriptionPlan || 'none';
    if (!isPaidPlan(plan) && result.user.role !== 'admin') {
      sessionStorage.setItem('mc_paywall_login', '1');
    }
    return result.user;
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await authApi.register(name, email, password);
    applySession(result.token, result.user);
    setWelcomeOpen(true);
    return result.user;
  };

  const logout = () => {
    pendingPlanRef.current = null;
    void authApi.logout();
    setUser(GUEST_USER);
  };

  const startTrialOrSubscribe = (plan: PlanId) => {
    if (user.id === 'guest') {
      pendingPlanRef.current = plan;
      setAuthModalOpen(true);
      return;
    }
    if (plan === 'free_trial') {
      applyPlan(plan, user.id);
      return;
    }
    sessionStorage.setItem(LIBRARY_CHECKOUT_PENDING_KEY, plan);
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
    if (!getAuthToken()) {
      setUser(GUEST_USER);
      return;
    }
    try {
      const { user: next } = await authApi.me();
      setUser(fromPayload(next));
    } catch {
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
