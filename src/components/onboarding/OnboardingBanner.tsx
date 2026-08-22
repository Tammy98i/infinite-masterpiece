import React from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import { X, CheckCircle2 } from 'lucide-react';

export const OnboardingBanner: React.FC = () => {
  const { activeStep, completeActiveStep, dismissActiveStep } = useOnboarding();

  if (!activeStep || activeStep.type !== 'banner') return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-[63] px-4 pointer-events-none">
      <div className="max-w-3xl mx-auto glass border border-primary/40 rounded-2xl p-4 flex items-center justify-between gap-4 pointer-events-auto shadow-xl bg-primary/10">
        <div className="text-right flex-1">
          <div className="text-xs font-bold text-primary-light">{activeStep.title}</div>
          <p className="text-sm text-zinc-200">{activeStep.description}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={completeActiveStep} className="px-4 py-2 rounded-xl bg-primary text-black text-xs font-bold flex items-center gap-1 focus-ring">
            <CheckCircle2 className="w-3.5 h-3.5" />
            הבנתי
          </button>
          <button onClick={dismissActiveStep} className="p-2 rounded-xl bg-white/10 focus-ring">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
