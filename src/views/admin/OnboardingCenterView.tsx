import React, { useEffect, useState } from 'react';
import { adminOnboardingApi } from '../../api/onboarding';
import type { OnboardingPath, OnboardingStep } from '../../types';
import { BarChart3 } from 'lucide-react';
import { OpsCardTitle, OpsDeskStack, OpsEmptyList, OpsFact, OpsListRow, OpsMasterDetail, OpsPageHeader } from '../../components/ops/OpsUi';

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
    <OpsDeskStack>
      <OpsPageHeader title="הדרכות" hint="מסלולי קליטה, שלבים, וסטטיסטיקות השלמה." />
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-white/45 mb-1">התחילו מסלול</div>
            <div className="text-2xl font-light text-[#C8A24C]">{stats.totalStarted}</div>
          </div>
          <div className="rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-white/45 mb-1">סיימו מסלול</div>
            <div className="text-2xl font-light text-emerald-300">{stats.totalCompleted}</div>
          </div>
          <div className="rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-white/45 mb-1">אחוז השלמה</div>
            <div className="text-2xl font-light text-white">{stats.completionRate}%</div>
          </div>
          <div className="rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-white/45 mb-1">בונוסים שנפתחו</div>
            <div className="text-2xl font-light text-white">{stats.bonusesUnlockedCount}</div>
          </div>
        </div>
      )}

      {stats && stats.stepsWithMostSkips.length > 0 && (
        <div className="rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-2 text-sm text-white/70 mb-3">
            <BarChart3 className="w-4 h-4 text-[#C8A24C]" />
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

      <OpsMasterDetail
        hasSelection={Boolean(selectedPath)}
        onCloseDetail={() => setSelectedPathId(null)}
        emptyDetail="בחרו מסלול מהרשימה."
        list={
          paths.length === 0 ? (
            <OpsEmptyList>אין מסלולי הדרכה.</OpsEmptyList>
          ) : (
            <ul className="divide-y divide-white/10">
              {paths.map((path) => (
                <li key={path.id}>
                  <OpsListRow
                    active={selectedPathId === path.id}
                    onClick={() => setSelectedPathId(path.id)}
                    title={path.name}
                    meta={`${path.targetRole} · ${path.steps?.length || 0} שלבים`}
                    status={path.isActive ? 'פעיל' : 'כבוי'}
                    statusClass={path.isActive ? 'text-emerald-300' : 'text-white/45'}
                  />
                </li>
              ))}
            </ul>
          )
        }
        detail={
          selectedPath ? (
            <div className="grid gap-3">
              <div>
                <OpsCardTitle>{selectedPath.name}</OpsCardTitle>
                {selectedPath.description ? (
                  <p className="text-sm text-white/50 mt-1">{selectedPath.description}</p>
                ) : null}
              </div>
              <OpsFact label="תפקיד יעד">{selectedPath.targetRole}</OpsFact>
              <OpsFact label="שלבים">{selectedPath.steps?.length || 0}</OpsFact>
              <button
                type="button"
                onClick={() => void togglePathActive(selectedPath)}
                className="px-3.5 py-2 rounded-full border border-white/15 text-sm min-h-11 w-fit"
              >
                {selectedPath.isActive ? 'כיבוי מסלול' : 'הפעלת מסלול'}
              </button>
              <div className="grid gap-3">
                {selectedPath.steps?.map((step) => {
                  const stepId = step.id || step.stepId || '';
                  return (
                    <div key={stepId} className="grid gap-2 border-t border-white/10 pt-3">
                      <span className="text-xs text-white/40">שלב {step.stepOrder} · {step.type}</span>
                      <input
                        defaultValue={step.title}
                        onBlur={(e) => void updateStepField(step, 'title', e.target.value)}
                        className="w-full bg-transparent text-sm text-white focus:outline-none border-b border-transparent focus:border-[#C8A24C]/50 min-h-11"
                        aria-label={`כותרת שלב ${step.stepOrder}`}
                      />
                      <textarea
                        defaultValue={step.description}
                        onBlur={(e) => void updateStepField(step, 'description', e.target.value)}
                        rows={2}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-2 text-xs text-white/70 focus:outline-none focus:border-[#C8A24C]"
                        aria-label={`תיאור שלב ${step.stepOrder}`}
                      />
                      <p className="text-xs text-white/40">
                        טריגר: {step.triggerEvent || 'אין'} · סלקטור: {step.targetSelector || 'אין'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null
        }
      />
    </OpsDeskStack>
  );
};
