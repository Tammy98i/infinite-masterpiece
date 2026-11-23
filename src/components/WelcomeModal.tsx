import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Sparkles, Play, Compass } from 'lucide-react';
import { SITE_NAME } from '../constants/brand';

export const WelcomeModal: React.FC = () => {
  const { isWelcomeOpen, setWelcomeOpen, setView } = useApp();

  if (!isWelcomeOpen) return null;

  const steps = [
    {
      icon: Sparkles,
      title: 'ברוכים הבאים ל-' + SITE_NAME,
      desc: 'חשבון חינמי מוכן. אפשר לצפות בפרקים פתוחים, ואחר כך לפתוח גישה מלאה.',
    },
    {
      icon: Compass,
      title: 'תוכן מותאם אישית',
      desc: 'אפשר לבחור תחומי עניין בפרופיל כדי לקבל המלצות מדויקות יותר.',
    },
    {
      icon: Play,
      title: 'מוכנים להתחיל?',
      desc: 'התחילו מצפייה, או פתחו מנוי כדי לקבל את כל הספרייה.',
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="flex min-h-full items-start justify-center p-3 sm:p-4">
      <div className="glass bg-zinc-950/95 border border-primary/40 rounded-3xl max-w-lg w-full my-auto p-4 sm:p-8 relative shadow-2xl text-start">
        <div className="sticky top-0 z-10 flex justify-end bg-zinc-950/95 pb-2">
        <button
          onClick={() => setWelcomeOpen(false)}
          className="text-zinc-400 hover:text-white p-1 rounded-full bg-white/5 focus-ring min-h-11 min-w-11 inline-flex items-center justify-center"
          aria-label="סגירה"
        >
          <X className="w-5 h-5" />
        </button>
        </div>

        <h2 className="text-2xl font-heading text-white mb-4 sm:mb-6">שלושה צעדים להתחלה מושלמת</h2>

        <div className="grid gap-4 mb-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary-light flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-primary-light mb-0.5">שלב {i + 1}</div>
                  <div className="font-bold text-white">{step.title}</div>
                  <div className="text-sm text-zinc-400 mt-1">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-0 z-10 flex flex-col sm:flex-row gap-3 bg-zinc-950/95 pt-3 pb-1">
          <button
            onClick={() => {
              setWelcomeOpen(false);
              setView('quiz');
            }}
            className="flex-1 py-2.5 rounded-xl bg-primary text-black font-black hover:brightness-110 transition-all focus-ring min-h-11"
          >
            מה מתאים לי עכשיו?
          </button>
          <button
            onClick={() => setWelcomeOpen(false)}
            className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-bold hover:bg-white/15 transition-all focus-ring min-h-11"
          >
            לדף הבית
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
