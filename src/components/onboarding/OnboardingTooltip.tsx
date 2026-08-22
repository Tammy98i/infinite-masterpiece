import React, { useEffect, useState } from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import { CheckCircle2, SkipForward, X } from 'lucide-react';

export const OnboardingTooltip: React.FC = () => {
  const { activeStep, completeActiveStep, skipActiveStep, dismissActiveStep, canSkip } = useOnboarding();
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!activeStep || activeStep.type !== 'tooltip' || !activeStep.targetSelector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(activeStep.targetSelector);
    if (el) {
      setRect(el.getBoundingClientRect());
      el.classList.add('onboarding-highlight');
      return () => el.classList.remove('onboarding-highlight');
    }
  }, [activeStep]);

  if (!activeStep || activeStep.type !== 'tooltip' || !rect) return null;

  return (
    <>
      <div className="fixed inset-0 z-[64] bg-black/50 pointer-events-none" />
      <div
        className="fixed z-[66] w-72 glass border border-primary/40 rounded-2xl p-4 shadow-2xl text-right animate-in fade-in"
        style={{
          top: Math.min(rect.bottom + 12, window.innerHeight - 200),
          left: Math.max(8, Math.min(rect.left, window.innerWidth - 300)),
        }}
      >
        <button onClick={dismissActiveStep} className="absolute top-2 left-2 p-1 text-zinc-500 hover:text-white focus-ring rounded">
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="text-xs font-bold text-primary-light mb-1">טיפ</div>
        <div className="font-bold text-white text-sm mb-1">{activeStep.title}</div>
        <p className="text-xs text-zinc-400 mb-3">{activeStep.description}</p>
        <div className="flex gap-2">
          <button onClick={completeActiveStep} className="flex-1 py-1.5 rounded-lg bg-primary text-black text-xs font-bold focus-ring">
            הבנתי
          </button>
          {canSkip() && (
            <button onClick={skipActiveStep} className="px-2 py-1.5 rounded-lg bg-white/10 text-xs focus-ring">
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};
