import React from 'react';
import { useApp } from '../../context/AppContext';
import { useOnboarding } from '../../context/OnboardingContext';
import type { OnboardingLevel } from '../../types';
import { Compass, Zap, Rocket } from 'lucide-react';

const LEVELS: { id: OnboardingLevel; label: string; desc: string; icon: typeof Compass }[] = [
  { id: 'fearful', label: 'תסבירו לי הכול לאט', desc: 'הדרכה מפורטת בכל שלב עם טיפים', icon: Compass },
  { id: 'hesitant', label: 'תנו לי הדרכה קצרה', desc: 'הסברים רק בפיצ\'רים המרכזיים', icon: Zap },
  { id: 'brave', label: 'אני מסתדר, רק תראו לי איפה הדברים החשובים', desc: 'checklist קצר ללא הפרעות', icon: Rocket },
];

interface Props {
  userId: string;
  role: 'student' | 'instructor';
  onClose?: () => void;
}

export const OnboardingLevelPicker: React.FC<Props> = ({ userId, role, onClose }) => {
  const { updateOnboardingLevel } = useApp();
  const { startOnboarding, isLoading, showLevelPicker } = useOnboarding();

  const handleSelect = async (level: OnboardingLevel) => {
    updateOnboardingLevel(level);
    await startOnboarding(userId, role, level);
  };

  if (!showLevelPicker) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass bg-zinc-950/95 border border-primary/40 rounded-3xl max-w-lg w-full p-8 relative shadow-2xl text-right">
        {onClose && (
          <button onClick={onClose} className="absolute top-6 left-6 text-zinc-400 hover:text-white text-sm focus-ring rounded px-2 py-1">
            דילוג
          </button>
        )}
        <h2 className="text-2xl font-heading text-white mb-2">איך תרצו שנלווה אתכם?</h2>
        <p className="text-sm text-zinc-400 mb-6">בחרו את רמת הליווי המתאימה לכם. ניתן לשנות בכל עת מהפרופיל.</p>
        <div className="grid gap-3">
          {LEVELS.map((lvl) => {
            const Icon = lvl.icon;
            return (
              <button
                key={lvl.id}
                disabled={isLoading}
                onClick={() => handleSelect(lvl.id)}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-right focus-ring"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary-light flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white">{lvl.label}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{lvl.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
