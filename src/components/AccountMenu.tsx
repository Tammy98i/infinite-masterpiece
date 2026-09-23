import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogIn, LogOut, Mic, Shield, User } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { planLabel } from '../data/plans';
import { getTrialDaysRemaining } from '../utils/recommendations';
import { libraryPath } from '../utils/libraryPath';
import { Bidi } from './Bidi';

interface AccountMenuProps {
  onOpenProfile?: () => void;
  onOpenAdmin?: () => void;
  onOpenLecturer?: () => void;
}

export function AccountMenu({ onOpenProfile, onOpenAdmin, onOpenLecturer }: AccountMenuProps) {
  const {
    user,
    isGuest,
    logout,
    setAuthModalOpen,
  } = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const isUnpaid = user.subscriptionPlan === 'none';
  const isTrial = user.subscriptionPlan === 'free_trial';
  const trialDaysLeft = isTrial ? getTrialDaysRemaining(user.trialEndsAt) : null;
  const displayName = user.name.split(' ')[0] || 'אורח/ת';

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const goLibrary = (openView?: 'profile' | 'lecturer') => {
    setOpen(false);
    if (openView === 'profile' && onOpenProfile) {
      onOpenProfile();
      return;
    }
    if (openView === 'lecturer' && onOpenLecturer) {
      onOpenLecturer();
      return;
    }
    navigate(openView ? libraryPath(openView) : '/library');
  };

  const goAdmin = () => {
    setOpen(false);
    if (onOpenAdmin) {
      onOpenAdmin();
      return;
    }
    navigate(libraryPath('admin'));
  };

  const goLecturer = () => goLibrary('lecturer');

  const goLibraryAccess = () => {
    setOpen(false);
    navigate('/library-membership');
  };

  const goFitCheck = () => {
    setOpen(false);
    navigate('/pricing');
  };

  return (
    <div ref={rootRef} className="relative flex items-center gap-2">
      {isTrial && trialDaysLeft !== null && trialDaysLeft >= 0 && (
        <button
          type="button"
          onClick={goLibraryAccess}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-bold min-h-11"
        >
          <Clock className="w-3.5 h-3.5" data-icon="clock" />
          <span>{trialDaysLeft} ימי ניסיון נותרו</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          isGuest ? 'פתיחת החשבון' : `חשבון ${user.name}${user.email ? `, ${user.email}` : ''}`
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`inline-flex items-center gap-2 p-1 pe-3 rounded-full border transition-all min-h-11 ${
          open || !isGuest
            ? 'border-primary-light bg-primary-light/10'
            : 'border-primary-light/50 bg-primary-light/10 hover:border-primary-light'
        }`}
      >
        {!isGuest ? (
          <>
            <img
              src={user.avatar}
              alt=""
              aria-hidden
              className="w-8 h-8 rounded-full object-cover border border-primary-light/50"
            />
            <span className="text-xs font-semibold text-zinc-200 truncate max-w-[88px]">
              {displayName}
            </span>
          </>
        ) : (
          <>
            <span className="text-xs font-bold text-white ps-1">הצטרפו</span>
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light text-black flex items-center justify-center">
              <User className="w-4 h-4" />
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="אזור אישי"
          className="absolute top-full end-0 mt-3 w-[min(92vw,380px)] rounded-3xl border border-white/10 bg-[#0a0a0af5] backdrop-blur-xl shadow-2xl shadow-black/50 p-4 z-[80] text-start"
        >
          {!isGuest ? (
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
              <img
                src={user.avatar}
                alt=""
                aria-hidden
                className="w-12 h-12 rounded-full object-cover border-2 border-primary-light/60"
              />
              <div className="min-w-0">
                <div className="font-bold text-white truncate">{user.name}</div>
                {user.email ? (
                  <Bidi kind="email" className="text-[11px] text-white/55 truncate mt-0.5">
                    {user.email}
                  </Bidi>
                ) : null}
                <div className="text-[11px] text-primary-light font-semibold mt-0.5">
                  {planLabel(user.subscriptionPlan)}
                  {user.role === 'admin' ? ' · אדמין' : ''}
                  {isTrial && user.trialEndsAt ? ` · עד ${user.trialEndsAt}` : ''}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="text-sm font-black text-white">הצטרפו ל-Infinite Masterpiece</div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                התחברו או צרו חשבון כדי לפתוח מנוי ולשמור התקדמות.
              </p>
            </div>
          )}

          {isGuest && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setAuthModalOpen(true);
              }}
              className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-white/15 text-xs font-bold text-white hover:bg-white/5 min-h-11"
            >
              <LogIn className="w-3.5 h-3.5" />
              התחברות
            </button>
          )}

          {(isGuest || ((isUnpaid || isTrial) && user.role !== 'admin')) && (
            <>
              <button
                type="button"
                onClick={goLibraryAccess}
                className="w-full mb-2 text-start rounded-2xl border border-[#b79043]/40 bg-[#b79043]/10 p-4 hover:border-[#dfc47d] transition-colors"
              >
                <div className="text-sm font-semibold text-white mb-1">פתיחת גישה</div>
                <p className="text-[11px] text-white/50 font-light leading-relaxed">
                  מנוי לספרייה פותח צפייה בהרצאות ובהדרכות.
                </p>
                <div className="mt-2.5 text-[11px] font-semibold text-[#b79043]">למנוי הספרייה</div>
              </button>
              <button
                type="button"
                onClick={goFitCheck}
                className="w-full mb-4 text-start px-3 py-2 text-[11px] text-white/55 hover:text-white min-h-11"
              >
                בדיקת התאמה למסע
              </button>
            </>
          )}

          {!isGuest && (
            <div className="grid gap-1.5">
              {user.role === 'admin' && (
                <button
                  type="button"
                  onClick={goAdmin}
                  className="w-full flex items-center justify-start gap-2 px-3 py-2.5 rounded-xl text-sm text-[#b79043] hover:bg-white/5 min-h-11"
                >
                  <Shield className="w-4 h-4" />
                  ניהול
                </button>
              )}
              {user.role === 'instructor' && (
                <button
                  type="button"
                  onClick={goLecturer}
                  className="w-full flex items-center justify-start gap-2 px-3 py-2.5 rounded-xl text-sm text-[#b79043] hover:bg-white/5 min-h-11"
                >
                  <Mic className="w-4 h-4" />
                  אזור מרצה
                </button>
              )}
              {user.role === 'student' && (
                <button
                  type="button"
                  onClick={goLecturer}
                  className="w-full flex items-center justify-start gap-2 px-3 py-2.5 rounded-xl text-sm text-zinc-200 hover:bg-white/5 hover:text-primary-light min-h-11"
                >
                  <Mic className="w-4 h-4" />
                  להגיש בקשה להיות מרצה
                </button>
              )}
              <button
                type="button"
                onClick={() => goLibrary('profile')}
                className="w-full text-start px-3 py-2.5 rounded-xl text-sm text-zinc-200 hover:bg-white/5 hover:text-primary-light min-h-11"
              >
                האזור האישי
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="w-full flex items-center justify-start gap-2 px-3 py-2.5 rounded-xl text-sm text-rose-300 hover:bg-rose-500/10 min-h-11"
              >
                <LogOut className="w-4 h-4" />
                התנתקות
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
