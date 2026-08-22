import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useApp } from '../context/AppContext';
import { getTrialDaysRemaining } from '../utils/recommendations';
import { countFullyOpenCourses, userNeedsAccessStrip } from '../utils/libraryHome';
import { trackEvent } from '../utils/analytics';

export function LibraryPlanBanner() {
  const { user } = useUser();
  const { courses } = useApp();
  const navigate = useNavigate();
  const isTrial = user.subscriptionPlan === 'free_trial';
  const trialDaysLeft = isTrial ? getTrialDaysRemaining(user.trialEndsAt) : null;
  const openCount = countFullyOpenCourses(courses, user);

  useEffect(() => {
    if (!userNeedsAccessStrip(user)) return;
    trackEvent('access_strip_view', { user_state: user.subscriptionPlan });
  }, [user]);

  if (!userNeedsAccessStrip(user)) return null;

  const goLibraryAccess = () => {
    trackEvent('plan_compare_click', { user_state: user.subscriptionPlan });
    trackEvent('upgrade_clicked', { source: 'library_plan_banner' });
    navigate('/library-membership');
  };

  return (
    <div className="px-4 sm:px-8 mb-5" role="region" aria-label="סטטוס גישה לספרייה">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[#C8A24C]/30 border-r-4 border-r-[#C8A24C] bg-black/80 backdrop-blur-md px-5 py-3.5 text-right">
        <div className="min-w-0">
          {isTrial ? (
            <>
              <p className="text-sm text-white/85 font-medium">
                {trialDaysLeft ?? 0} ימי ניסיון נותרו
                {user.trialEndsAt ? ` · בתוקף עד ${user.trialEndsAt}` : ''}
              </p>
              <p className="text-[13px] text-white/50 font-light mt-1">
                גישה לכל ההרצאות — במנוי לספרייה (נפרד ממסלול המיזם).
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-white/85 font-light leading-relaxed">
                חלק מהספרייה פתוח לצפייה. גישה מלאה — במנוי לספרייה.
              </p>
              {openCount > 0 && (
                <p className="text-[13px] text-[#C8A24C]/90 mt-1">
                  {openCount === 1 ? 'הרצאה מלאה אחת פתוחה כרגע' : `${openCount} הרצאות מלאות פתוחות כרגע`}
                </p>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={goLibraryAccess}
          className="shrink-0 px-5 py-2.5 rounded-full bg-[#C8A24C] text-black text-sm font-semibold hover:bg-[#F7E7B5] min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          פתיחת גישה
        </button>
      </div>
    </div>
  );
}
