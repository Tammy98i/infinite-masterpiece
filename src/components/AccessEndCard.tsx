import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';

type Props = {
  source: string;
  courseTitle?: string;
  onDismiss?: () => void;
};

export function AccessEndCard({ source, courseTitle, onDismiss }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent('paywall_opened', { source, content_id: '' });
  }, [source]);

  const goLibrary = () => {
    trackEvent('upgrade_clicked', { source });
    navigate('/library-membership');
  };

  const goFit = () => {
    trackEvent('plan_compare_click', { source });
    trackEvent('upgrade_clicked', { source: `fit_check:${source}` });
    navigate('/pricing');
  };

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-[#010308]/80 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-end-title"
    >
      <div className="glass-card w-full max-w-md p-8 text-center">
        <h2 id="access-end-title" className="text-2xl font-heading text-white mb-4">
          רוצה להמשיך לצפות?
        </h2>
        <p className="text-sm text-white/90 font-medium leading-relaxed mb-8">
          {courseTitle
            ? 'ההדרכה הזו היא חלק מספריית Infinite Masterpiece למנויים. מנוי לצפייה פותח גישה — לא רכישת קורס בודד.'
            : 'הטעימה הסתיימה. ההמשך נפתח במנוי לספרייה.'}
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button type="button" onClick={goLibrary} className="btn-gold text-black w-full">
            פתיחת גישה עכשיו
          </button>
          <button
            type="button"
            onClick={goFit}
            className="w-full py-3 rounded-full border border-[#C8A24C]/50 text-[#F7E7B5] text-sm min-h-11 cursor-pointer hover:border-[#F7E7B5]"
          >
            בדיקת התאמה
          </button>
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="w-full py-3 text-sm text-white/80 hover:text-white min-h-11 cursor-pointer"
            >
              לא עכשיו
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
