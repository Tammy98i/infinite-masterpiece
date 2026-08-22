import React from 'react';
import { useApp } from '../../context/AppContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { OnboardingLevelPicker } from './OnboardingLevelPicker';
import { OnboardingModal } from './OnboardingModal';
import { OnboardingChecklist } from './OnboardingChecklist';
import { OnboardingTooltip } from './OnboardingTooltip';
import { OnboardingBanner } from './OnboardingBanner';
import { OnboardingCompleteModal } from './OnboardingCompleteModal';

export const OnboardingUI: React.FC = () => {
  const { user } = useApp();
  const { setShowLevelPicker } = useOnboarding();

  if (user.subscriptionPlan === 'none') return null;

  return (
    <>
      <OnboardingLevelPicker
        userId={user.id}
        role={user.role === 'instructor' ? 'instructor' : 'student'}
        onClose={() => setShowLevelPicker(false)}
      />
      <OnboardingModal />
      <OnboardingChecklist />
      <OnboardingTooltip />
      <OnboardingBanner />
      <OnboardingCompleteModal />
    </>
  );
};
