import React, { useEffect, useState } from 'react';
import { adminOnboardingApi } from '../../api/onboarding';
import type { OnboardingPath, OnboardingStep } from '../../types';
import { BarChart3, BookOpen, ToggleLeft, ToggleRight } from 'lucide-react';

export const OnboardingCenterView: React.FC = () => {
  const [paths, setPaths] = useState<OnboardingPath[]>([]);
  const [stats, setStats] = useState<{
    totalStarted: number;
    totalCompleted: number;
    completionRate: number;
    bonusesUnlockedCount: number;
    stepsWithMostSkips: { title: string; id: string; skip_count: number }[];
  } | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([adminOnboardingApi.getPaths(), adminOnboardingApi.getStats()]);
      setPaths(p);
      setStats(s);
      if (!selectedPathId && p.length > 0) setSelectedPathId(p[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedPath = paths.find((p) => p.id === selectedPathId);

  const togglePathActive = async (path: OnboardingPath) => {
    await adminOnboardingApi.updatePath(path.id, { isActive: !path.isActive });
    await load();
  };

  const updateStepField = async (step: OnboardingStep, field: string, value: string) => {
    const stepId = step.id || step.stepId;
    if (!stepId) return;
    await adminOnboardingApi.updateStep(stepId, { [field]: value } as Partial<OnboardingStep>);
    await load();
  };

  if (loading) {
    return <div className="text-center py-20 text-zinc-400">טוען מרכז הדרכות...</div>;
  }

  return (
    <div className="grid gap-8">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-zinc-500 mb-1">התחילו מסלול</div>
            <div className="text-2xl font-accent font-semibold tabular-nums text-primary-light">{stats.totalStarted}</div>
          </div>
          <div className="glass rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-zinc-500 mb-1">סיימו מסלול</div>
            <div className="text-2xl font-accent font-semibold tabular-nums text-emerald-400">{stats.totalCompleted}</div>
          </div>
          <div className="glass rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-zinc-500 mb-1">אחוז השלמה</div>
            <div className="text-2xl font-accent font-semibold tabular-nums text-white">{stats.completionRate}%</div>
          </div>
          <div className="glass rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-zinc-500 mb-1">בונוסים שנפתחו</div>
            <div className="text-2xl font-accent font-semibold tabular-nums text-white">{stats.bonusesUnlockedCount}</div>
          </div>
        </div>
      )}

      {stats && stats.stepsWithMostSkips.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-300 mb-3">
            <BarChart3 className="w-4 h-4 text-primary-light" />
            שלבים עם הכי הרבה דילוגים
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.stepsWithMostSkips.map((s) => (
              <span key={s.id} className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 text-xs">
                {s.title} ({s.skip_count})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 glass rounded-2xl p-4 border border-white/10">
          <div className="font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-light" />
            מסלולי הדרכה
          </div>
          <div className="grid gap-2">
            {paths.map((path) => (
              <button
                key={path.id}
                onClick={() => setSelectedPathId(path.id)}
                className={`w-full text-right p-3 rounded-xl border transition-all ${
                  selectedPathId === path.id
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-white/5 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="font-bold text-sm text-white">{path.name}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{path.targetRole} • {path.steps?.length || 0} שלבים</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 glass rounded-2xl p-5 border border-white/10">
          {selectedPath ? (
            <>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <div>
                  <h3 className="font-heading text-lg text-white">{selectedPath.name}</h3>
                  <p className="text-xs text-zinc-400">{selectedPath.description}</p>
                </div>
                <button
                  onClick={() => togglePathActive(selectedPath)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs font-bold focus-ring"
                >
                  {selectedPath.isActive ? (
                    <><ToggleRight className="w-4 h-4 text-emerald-400" /> פעיל</>
                  ) : (
                    <><ToggleLeft className="w-4 h-4 text-zinc-500" /> כבוי</>
                  )}
                </button>
              </div>
              <div className="grid gap-3">
                {selectedPath.steps?.map((step) => {
                  const stepId = step.id || step.stepId || '';
                  return (
                    <div key={stepId} className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="text-[10px] font-bold text-primary-light">שלב {step.stepOrder}</span>
                          <input
                            defaultValue={step.title}
                            onBlur={(e) => updateStepField(step, 'title', e.target.value)}
                            className="block w-full bg-transparent font-bold text-white text-sm focus:outline-none border-b border-transparent focus:border-primary/50"
                          />
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{step.type}</span>
                      </div>
                      <textarea
                        defaultValue={step.description}
                        onBlur={(e) => updateStepField(step, 'description', e.target.value)}
                        rows={2}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-primary/50 mb-2"
                      />
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500">
                        <span>טריגר: {step.triggerEvent || 'אין'}</span>
                        <span>סלקטור: {step.targetSelector || 'אין'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-zinc-500">בחרו מסלול לעריכה</div>
          )}
        </div>
      </div>
    </div>
  );
};
