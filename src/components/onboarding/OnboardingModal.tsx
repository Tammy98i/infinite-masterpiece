import React from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import { X, CheckCircle2, SkipForward } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { activeStep, completeActiveStep, skipActiveStep, dismissActiveStep, canSkip } = useOnboarding();

  if (!activeStep || activeStep.type !== 'modal') return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="glass bg-zinc-950/95 border border-primary/30 rounded-3xl max-w-md w-full p-8 relative shadow-2xl text-right animate-in fade-in zoom-in-95">
        <button
          onClick={dismissActiveStep}
          className="absolute top-5 left-5 text-zinc-400 hover:text-white p-1 rounded-full bg-white/5 focus-ring"
          aria-label="סגירה"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-xs font-bold text-primary-light mb-2">הדרכה</div>
        <h3 className="text-xl font-black font-display text-white mb-3">{activeStep.title}</h3>
        <p className="text-sm text-zinc-300 leading-relaxed mb-6">{activeStep.description}</p>
        {activeStep.videoUrl && (
          <video src={activeStep.videoUrl} controls className="w-full rounded-xl mb-4" />
        )}
        {activeStep.screenzEmbed && (
          <div className="mb-4 p-4 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-500">
            {activeStep.screenzEmbed}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={completeActiveStep}
            className="flex-1 py-3 rounded-xl bg-primary text-black font-black flex items-center justify-center gap-2 focus-ring"
          >
            <CheckCircle2 className="w-4 h-4" />
            הבנתי
          </button>
          {canSkip() && (
            <button
              onClick={skipActiveStep}
              className="px-4 py-3 rounded-xl bg-white/10 text-zinc-300 font-bold flex items-center gap-1 focus-ring"
            >
              <SkipForward className="w-4 h-4" />
              דלג
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
