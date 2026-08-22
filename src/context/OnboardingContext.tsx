import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { onboardingApi, PATH_IDS } from '../api/onboarding';
import type {
  OnboardingLevel,
  OnboardingStep,
  OnboardingTrigger,
  UserOnboardingProgress,
  UserRole,
} from '../types';

interface OnboardingContextType {
  progress: UserOnboardingProgress | null;
  activeStep: OnboardingStep | null;
  showLevelPicker: boolean;
  showChecklist: boolean;
  showCompleteModal: boolean;
  unlockedBonus: { title: string; value?: string; bonusType: string } | null;
  isLoading: boolean;
  firedTriggers: Set<string>;
  setShowLevelPicker: (v: boolean) => void;
  setShowChecklist: (v: boolean) => void;
  setShowCompleteModal: (v: boolean) => void;
  startOnboarding: (userId: string, role: UserRole, level: OnboardingLevel) => Promise<void>;
  completeActiveStep: () => Promise<void>;
  skipActiveStep: () => Promise<void>;
  dismissActiveStep: () => void;
  fireTrigger: (trigger: OnboardingTrigger, userId: string, role: UserRole, level?: OnboardingLevel) => Promise<void>;
  refreshProgress: (userId: string) => Promise<void>;
  canSkip: (level?: OnboardingLevel) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const TRIGGER_STORAGE_KEY = 'im_onboarding_triggers';

function loadFiredTriggers(): Set<string> {
  try {
    const raw = localStorage.getItem(TRIGGER_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFiredTriggers(set: Set<string>) {
  localStorage.setItem(TRIGGER_STORAGE_KEY, JSON.stringify([...set]));
}

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<UserOnboardingProgress | null>(null);
  const [activeStep, setActiveStep] = useState<OnboardingStep | null>(null);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [unlockedBonus, setUnlockedBonus] = useState<{ title: string; value?: string; bonusType: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const firedTriggersRef = useRef<Set<string>>(loadFiredTriggers());
  const userLevelRef = useRef<OnboardingLevel>('hesitant');

  const canSkip = useCallback((level?: OnboardingLevel) => {
    const l = level || userLevelRef.current;
    return l !== 'fearful';
  }, []);

  const refreshProgress = useCallback(async (userId: string) => {
    try {
      const p = await onboardingApi.getUserProgress(userId);
      setProgress(p);
      const path = p.paths[0];
      if (path?.status === 'completed') {
        const bonus = path.bonuses.find((b) => b.unlocked);
        if (bonus) {
          setUnlockedBonus({ title: bonus.title, value: bonus.value, bonusType: bonus.bonusType });
          setShowCompleteModal(true);
        }
      }
    } catch (e) {
      console.warn('Onboarding progress fetch failed', e);
    }
  }, []);

  const showStep = useCallback((step: OnboardingStep, level: OnboardingLevel) => {
    if (level === 'brave' && step.type !== 'checklist') {
      setShowChecklist(true);
      return;
    }
    setActiveStep(step);
  }, []);

  const fireTriggerInternal = useCallback(
    async (trigger: OnboardingTrigger, userId: string, role: UserRole, level: OnboardingLevel, force = false) => {
      const key = `${userId}:${trigger}`;
      if (!force && firedTriggersRef.current.has(key)) return;

      try {
        const steps = await onboardingApi.getTriggerSteps(userId, role, trigger);
        if (steps.length === 0) return;

        firedTriggersRef.current.add(key);
        saveFiredTriggers(firedTriggersRef.current);

        const step = steps[0];
        const normalized: OnboardingStep = {
          ...step,
          stepId: step.stepId || step.id,
        };
        showStep(normalized, level);
      } catch (e) {
        console.warn('Trigger failed', trigger, e);
      }
    },
    [showStep]
  );

  const startOnboarding = useCallback(
    async (userId: string, role: UserRole, level: OnboardingLevel) => {
      setIsLoading(true);
      userLevelRef.current = level;
      try {
        const pathId = role === 'instructor' ? PATH_IDS.instructor : PATH_IDS.student;
        const p = await onboardingApi.start(userId, pathId, level);
        setProgress(p);
        setShowLevelPicker(false);
        if (level === 'brave') {
          setShowChecklist(true);
        } else {
          await fireTriggerInternal('first_login', userId, role, level, true);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [fireTriggerInternal]
  );

  const fireTrigger = useCallback(
    async (trigger: OnboardingTrigger, userId: string, role: UserRole, level?: OnboardingLevel) => {
      const l = level || userLevelRef.current;
      await fireTriggerInternal(trigger, userId, role, l);
    },
    [fireTriggerInternal]
  );

  const completeActiveStep = useCallback(async () => {
    if (!activeStep || !progress) return;
    const stepId = activeStep.stepId || activeStep.id;
    if (!stepId) return;
    const p = await onboardingApi.completeStep(progress.userId, stepId);
    setProgress(p);
    setActiveStep(null);
    await refreshProgress(progress.userId);
  }, [activeStep, progress, refreshProgress]);

  const skipActiveStep = useCallback(async () => {
    if (!activeStep || !progress || !canSkip()) return;
    const stepId = activeStep.stepId || activeStep.id;
    if (!stepId) return;
    const p = await onboardingApi.skipStep(progress.userId, stepId);
    setProgress(p);
    setActiveStep(null);
  }, [activeStep, progress, canSkip]);

  const dismissActiveStep = useCallback(() => {
    setActiveStep(null);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        progress,
        activeStep,
        showLevelPicker,
        showChecklist,
        showCompleteModal,
        unlockedBonus,
        isLoading,
        firedTriggers: firedTriggersRef.current,
        setShowLevelPicker,
        setShowChecklist,
        setShowCompleteModal,
        startOnboarding,
        completeActiveStep,
        skipActiveStep,
        dismissActiveStep,
        fireTrigger,
        refreshProgress,
        canSkip,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
};
