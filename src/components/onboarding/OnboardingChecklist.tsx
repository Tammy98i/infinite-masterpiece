import React, { useEffect, useState } from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import { onboardingApi } from '../../api/onboarding';
import { X, CheckCircle2, Circle, SkipForward } from 'lucide-react';

export const OnboardingChecklist: React.FC = () => {
  const { progress, showChecklist, setShowChecklist, refreshProgress, canSkip } = useOnboarding();
  const path = progress?.paths[0];

  if (!showChecklist || !path) return null;

  const handleComplete = async (stepId: string) => {
    if (!progress) return;
    await onboardingApi.completeStep(progress.userId, stepId);
    await refreshProgress(progress.userId);
  };

  const handleSkip = async (stepId: string) => {
    if (!progress || !canSkip(path.onboardingLevel)) return;
    await onboardingApi.skipStep(progress.userId, stepId);
    await refreshProgress(progress.userId);
  };

  return (
    <div className="fixed bottom-24 md:bottom-8 left-4 z-[55] w-80 max-w-[calc(100vw-2rem)] glass border border-primary/30 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-primary/10">
        <div>
          <div className="text-xs font-bold text-primary-light">מסלול הדרכה</div>
          <div className="font-bold text-white text-sm">{path.pathName}</div>
        </div>
        <button onClick={() => setShowChecklist(false)} className="p-1 rounded-lg hover:bg-white/10 focus-ring">
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>
      <div className="px-4 py-2">
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${path.completionPercentage}%` }}
          />
        </div>
        <div className="text-[10px] text-zinc-500 mb-2">{path.completionPercentage}% הושלם</div>
      </div>
      <div className="max-h-64 overflow-y-auto px-2 pb-2 grid gap-1">
        {path.steps.map((step) => {
          const stepId = step.stepId || step.id || '';
          const done = step.status === 'completed';
          const skipped = step.status === 'skipped';
          return (
            <div
              key={stepId}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs ${
                done ? 'bg-primary/10 text-primary-light' : skipped ? 'opacity-50' : 'bg-white/5'
              }`}
            >
              {done ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Circle className="w-4 h-4 shrink-0 text-zinc-500" />}
              <span className="flex-1 font-medium">{step.title}</span>
              {!done && !skipped && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleComplete(stepId)}
                    className="px-2 py-0.5 rounded bg-primary text-black font-bold text-[10px] focus-ring"
                  >
                    סיום
                  </button>
                  {canSkip(path.onboardingLevel) && (
                    <button onClick={() => handleSkip(stepId)} className="p-0.5 text-zinc-500 hover:text-white focus-ring rounded">
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
