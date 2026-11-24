import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Mic } from 'lucide-react';
import { Bidi } from '../components/Bidi';
import { DirBack } from '../components/DirArrow';
import { useApp } from '../context/AppContext';
import { PlansGrid } from '../components/PlansGrid';
import { planLabel } from '../data/plans';
import { getTrialDaysRemaining } from '../utils/recommendations';
import { INTEREST_OPTIONS } from '../data/categories';
import { uploadFile } from '../api/upload';

export const ProfileView: React.FC = () => {
  const { user, isGuest, logout, setView, setAuthModalOpen, updateUserInterests, updateOwnProfile, cancelSubscription } = useApp();
  const location = useLocation();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user.interests);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState(user.name === 'אורח/ת' ? '' : user.name);
  const [city, setCity] = useState(user.city || '');
  const [profileNote, setProfileNote] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const id = location.hash.replace('#', '');
    if (!id) return;
    const timer = window.setTimeout(() => {
      const node = document.getElementById(id);
      node?.scrollIntoView({ block: 'center' });
      const field = node?.querySelector('input');
      if (field instanceof HTMLElement) field.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  const isPaying = user.subscriptionPlan === 'monthly' || user.subscriptionPlan === 'annual' || user.subscriptionPlan === 'premium_88';
  const trialDays = user.subscriptionPlan === 'free_trial' ? getTrialDaysRemaining(user.trialEndsAt) : null;

  const saveInterests = () => {
    updateUserInterests(selectedInterests);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="crm-desk library-catalog-page min-h-screen text-white pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-10 text-start">
        <div className="library-back-bar px-0">
          <button
            type="button"
            onClick={() => setView('home')}
            className="library-page-back inline-flex items-center gap-1.5 text-sm min-h-11"
          >
            <DirBack />
            חזור
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name ? `תמונת פרופיל: ${user.name}` : 'תמונת פרופיל'}
              className="w-16 h-16 rounded-full object-cover border border-white/10"
            />
            <div>
              <h1 className="text-3xl font-semibold"><bdi dir="auto">{isGuest ? 'אורח/ת' : user.name}</bdi></h1>
              {!isGuest && (user.birthday || user.phone || user.city) ? (
                <p className="text-sm text-white/55 mt-1">
                  {user.birthday ? <>יום הולדת <Bidi>{user.birthday.split('-').reverse().join('.')}</Bidi></> : null}
                  {user.phone ? <>{user.birthday ? ' · ' : ''}<Bidi kind="phone">{user.phone}</Bidi></> : null}
                  {user.city ? <>{(user.birthday || user.phone) ? ' · ' : ''}{user.city}</> : null}
                </p>
              ) : null}
              <p className="text-sm text-white/45 mt-1">
                {planLabel(user.subscriptionPlan)}
                {trialDays !== null && trialDays >= 0 ? ` · ${trialDays} ימי ניסיון נותרו` : ''}
                {user.email ? <>{' · '}<Bidi kind="email" className="break-all">{user.email}</Bidi></> : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isGuest ? (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-5 py-2.5 rounded-full bg-[#b79043] text-black text-sm min-h-11 cursor-pointer"
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

        {!isPaying ? (
          <section className="mb-14">
            <h2 className="text-sm text-white/40 mb-4">{isGuest ? 'בחירת מסלול' : 'גישה'}</h2>
            <p className="text-sm text-white/55 font-light mb-6">
              {isGuest
                ? 'כדי להיכנס לקהילה ולספרייה, בוחרים אחד מהמסלולים הקיימים.'
                : 'הקהילה נפתחת למנויים משלמים. בחרו מסלול כדי להמשיך.'}
            </p>
            <PlansGrid />
          </section>
        ) : (
          <section className="mb-16 border border-white/10 rounded-2xl p-7 md:p-9 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
            <div>
              <h2 className="text-sm text-white/40 mb-1">מנוי</h2>
              <p className="text-lg font-medium">{planLabel(user.subscriptionPlan)}</p>
              {user.trialEndsAt && user.subscriptionPlan === 'free_trial' ? (
                <p className="text-sm text-white/45 mt-1">בתוקף עד <Bidi>{user.trialEndsAt}</Bidi></p>
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
          <section id="profile-details" className="mb-16 grid gap-6">
            <h2 className="text-sm text-white/40">פרטי החשבון</h2>
            <form className="grid gap-4 max-w-xl" onSubmit={(event) => {
              event.preventDefault();
              setProfileError('');
              void updateOwnProfile({ fullName, city }).then(() => setProfileNote('הפרטים נשמרו')).catch((err: unknown) => {
                setProfileNote('');
                setProfileError(err instanceof Error ? err.message : 'השמירה נכשלה');
              });
            }}>
              <label id="profile-name" className="grid gap-2">
                שם מלא
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="min-h-11 rounded-xl border border-white/15 bg-transparent px-3 text-white" />
              </label>
              <label id="profile-city" className="grid gap-2">
                עיר
                <input value={city} onChange={(event) => setCity(event.target.value)} className="min-h-11 rounded-xl border border-white/15 bg-transparent px-3 text-white" />
              </label>
              <label id="profile-avatar" className="grid gap-2">
                תמונת פרופיל
                <input type="file" accept="image/*" className="min-h-11" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setProfileError('');
                  void uploadFile(file, 'image').then((url) => updateOwnProfile({ avatar: url })).then(() => setProfileNote('התמונה נשמרה')).catch((err: unknown) => {
                    setProfileError(err instanceof Error ? err.message : 'העלאת התמונה נכשלה');
                  });
                }} />
              </label>
              <button type="submit" className="w-fit px-5 py-2.5 rounded-full bg-[#b79043] text-black text-sm min-h-11 cursor-pointer">שמירת פרטים</button>
              {profileNote ? <p>{profileNote}</p> : null}
              {profileError ? <p role="alert">{profileError}</p> : null}
            </form>
          </section>
        )}

        {!isGuest && (
          <section id="profile-interests">
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
                      on ? 'border-[#b79043] text-[#b79043]' : 'border-white/10 text-white/55 hover:border-white/30'
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
