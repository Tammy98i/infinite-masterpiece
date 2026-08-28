import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LogOut, Mic } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlansGrid } from '../components/PlansGrid';
import { planLabel } from '../data/plans';
import { getTrialDaysRemaining } from '../utils/recommendations';
import { INTEREST_OPTIONS } from '../data/categories';

export const ProfileView: React.FC = () => {
  const { user, isGuest, logout, setView, setAuthModalOpen, updateUserInterests, cancelSubscription } = useApp();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user.interests);
  const [saved, setSaved] = useState(false);

  const isUnpaid = user.subscriptionPlan === 'none';
  const trialDays = user.subscriptionPlan === 'free_trial' ? getTrialDaysRemaining(user.trialEndsAt) : null;

  const saveInterests = () => {
    updateUserInterests(selectedInterests);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen text-white pt-24 pb-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 text-right">
        <button
          type="button"
          onClick={() => setView('home')}
          className="inline-flex items-center gap-1.5 text-sm text-white/45 hover:text-white mb-10 min-h-11"
        >
          <ArrowRight className="w-4 h-4" />
          ספרייה
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name ? `תמונת פרופיל: ${user.name}` : 'תמונת פרופיל'}
              className="w-16 h-16 rounded-full object-cover border border-white/10"
            />
            <div>
              <h1 className="text-3xl font-semibold">{isGuest ? 'אורח/ת' : user.name}</h1>
              <p className="text-sm text-white/45 mt-1">
                {planLabel(user.subscriptionPlan)}
                {trialDays !== null && trialDays >= 0 ? ` · ${trialDays} ימי ניסיון נותרו` : ''}
                {user.email ? ` · ${user.email}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isGuest ? (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-5 py-2.5 rounded-full bg-[#C8A24C] text-black text-sm min-h-11 cursor-pointer"
              >
                התחברות
              </button>
            ) : (
              <>
                {user.role === 'instructor' ? (
                  <button
                    type="button"
                    onClick={() => setView('lecturer')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/15 text-sm min-h-11 cursor-pointer hover:border-white/40"
                  >
                    <Mic className="w-4 h-4" />
                    אזור מרצה
                  </button>
                ) : user.role !== 'admin' ? (
                  <button
                    type="button"
                    onClick={() => setView('lecturer')}
                    className="px-4 py-2.5 rounded-full border border-white/15 text-sm min-h-11 cursor-pointer hover:border-white/40"
                  >
                    בקשה להיות מרצה
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setView('home');
                  }}
                  className="p-3 rounded-full border border-white/15 text-white/45 hover:text-white min-h-11 min-w-11 cursor-pointer"
                  aria-label="התנתקות"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {isUnpaid ? (
          <section className="mb-14">
            <h2 className="text-sm text-white/40 mb-4">גישה</h2>
            <p className="text-sm text-white/55 font-light mb-6">
              פתיחת גישה לכל ההרצאות, ההדרכות והמסלולים במסלול האמיצים או במסלול ההססנים.
            </p>
            <PlansGrid />
          </section>
        ) : (
          <section className="mb-14 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm text-white/40 mb-1">מנוי</h2>
              <p className="text-lg font-medium">{planLabel(user.subscriptionPlan)}</p>
              {user.trialEndsAt && user.subscriptionPlan === 'free_trial' ? (
                <p className="text-sm text-white/45 mt-1">בתוקף עד {user.trialEndsAt}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
            <Link
              to="/pricing"
              className="px-5 py-2.5 rounded-full border border-white/15 text-sm min-h-11 inline-flex items-center hover:border-white/40"
            >
              שינוי תוכנית
            </Link>
            {user.role !== 'admin' ? (
              <button
                type="button"
                onClick={() => cancelSubscription()}
                className="px-5 py-2.5 rounded-full border border-white/15 text-sm min-h-11 cursor-pointer hover:border-white/40 text-white/55"
              >
                ביטול מנוי
              </button>
            ) : null}
            </div>
          </section>
        )}

        {!isGuest && (
          <section>
            <h2 className="text-sm text-white/40 mb-4">נושאים שמעניינים אתכם</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {INTEREST_OPTIONS.map((tag) => {
                const on = selectedInterests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setSelectedInterests((prev) => (on ? prev.filter((t) => t !== tag) : [...prev, tag]))
                    }
                    className={`px-3 py-2 rounded-full text-sm min-h-11 border ${
                      on ? 'border-[#C8A24C] text-[#C8A24C]' : 'border-white/10 text-white/55 hover:border-white/30'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={saveInterests}
              className="px-5 py-2.5 rounded-full border border-white/15 text-sm min-h-11 cursor-pointer hover:border-white/40"
            >
              {saved ? 'נשמר' : 'שמירת נושאים'}
            </button>
          </section>
        )}
      </div>
    </div>
  );
};
