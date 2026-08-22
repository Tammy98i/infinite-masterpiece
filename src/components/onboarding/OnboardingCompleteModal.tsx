import React from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import { Award, Download, X } from 'lucide-react';

export const OnboardingCompleteModal: React.FC = () => {
  const { showCompleteModal, unlockedBonus, setShowCompleteModal } = useOnboarding();

  if (!showCompleteModal || !unlockedBonus) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass bg-zinc-950/95 border border-primary/40 rounded-3xl max-w-md w-full p-8 text-center relative shadow-2xl">
        <button
          onClick={() => setShowCompleteModal(false)}
          className="absolute top-5 left-5 text-zinc-400 hover:text-white focus-ring rounded p-1"
        >
          <X className="w-5 h-5" />
        </button>
        <Award className="w-16 h-16 text-primary-light mx-auto mb-4" />
        <h2 className="text-2xl font-black font-display text-white mb-2">סיימתם את מסלול ההדרכה!</h2>
        <p className="text-sm text-zinc-400 mb-6">קיבלתם בונוס: {unlockedBonus.title}</p>
        {unlockedBonus.value && unlockedBonus.bonusType === 'pdf' && (
          <a
            href={unlockedBonus.value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-black font-black focus-ring"
          >
            <Download className="w-4 h-4" />
            הורדת המדריך
          </a>
        )}
      </div>
    </div>
  );
};
