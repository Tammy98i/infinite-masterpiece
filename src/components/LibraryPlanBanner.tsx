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
    <div className="soundstage-console-strip library-island library-plan-banner px-4 sm:px-8 mb-2" role="region" aria-label="סטטוס גישה לספרייה">
      <div className="library-plan-strip soundstage-plan-strip max-w-[1400px] mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-[#D99B43]/25 px-5 py-4 text-start">
        <div className="min-w-0">
          {isTrial ? (
            <>
              <p className="text-base text-[#F2EFEB] font-medium">
                {trialDaysLeft ?? 0} ימי ניסיון נותרו
                {user.trialEndsAt ? ` · בתוקף עד ${user.trialEndsAt}` : ''}
              </p>
              <p className="text-[13px] text-[#c8ba9f] font-light mt-1">
                גישה לכל ההרצאות — במנוי לספרייה (נפרד ממסלול המיזם).
              </p>
            </>
          ) : (
            <>
              <p className="text-base text-[#F2EFEB] leading-relaxed">
                חלק מהספרייה פתוח לצפייה. גישה מלאה — במנוי לספרייה.
              </p>
              {openCount > 0 && (
                <p className="text-sm font-medium text-[#D99B43] mt-1">
                  {openCount === 1 ? 'הרצאה מלאה אחת פתוחה כרגע' : `${openCount} הרצאות מלאות פתוחות כרגע`}
                </p>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={goLibraryAccess}
          className="library-plan-cta soundstage-btn-primary shrink-0 px-6 py-2.5 rounded-full text-sm font-bold min-h-11 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D99B43]"
        >
          פתיחת גישה
        </button>
      </div>
    </div>
  );
}
