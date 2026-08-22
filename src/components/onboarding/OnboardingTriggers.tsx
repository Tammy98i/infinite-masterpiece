import { useEffect, useRef, type FC } from 'react';
import { useApp } from '../../context/AppContext';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingTrigger, UserRole } from '../../types';

export const OnboardingTriggers: FC = () => {
  const { user, currentView, isWelcomeOpen, setWelcomeOpen } = useApp();
  const { fireTrigger, setShowLevelPicker, refreshProgress } = useOnboarding();
  const prevView = useRef(currentView);

  useEffect(() => {
    if (isWelcomeOpen && user.subscriptionPlan !== 'none') {
      setShowLevelPicker(true);
      setWelcomeOpen(false);
    }
  }, [isWelcomeOpen, user.subscriptionPlan, setShowLevelPicker, setWelcomeOpen]);

  useEffect(() => {
    if (user.subscriptionPlan === 'none') return;
    refreshProgress(user.id);
  }, [user.id, user.subscriptionPlan, refreshProgress]);

  useEffect(() => {
    if (user.subscriptionPlan === 'none') return;
    const role = (user.role || 'student') as UserRole;

    if (currentView === 'course' && prevView.current !== 'course') {
      fireTrigger('first_course_view', user.id, role, user.onboardingLevel);
    }
    if (currentView === 'watch' && prevView.current !== 'watch') {
      fireTrigger('first_watch', user.id, role, user.onboardingLevel);
    }
    prevView.current = currentView;
  }, [currentView, user, fireTrigger]);

  useEffect(() => {
    if (user.subscriptionPlan === 'none') return;
    const handler = (e: Event) => {
      const trigger = (e as CustomEvent).detail as OnboardingTrigger;
      const role = (user.role || 'student') as UserRole;
      fireTrigger(trigger, user.id, role, user.onboardingLevel);
    };
    window.addEventListener('onboarding-trigger', handler);
    return () => window.removeEventListener('onboarding-trigger', handler);
  }, [user, fireTrigger]);

  return null;
};
