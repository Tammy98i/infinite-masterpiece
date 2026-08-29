import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';

export interface PaywallPayload {
  source?: string;
  courseId?: string;
  courseTitle?: string;
  canPreview?: boolean;
  onPreview?: () => void;
}

interface PaywallContextType {
  isOpen: boolean;
  openPaywall: (sourceOrPayload?: string | PaywallPayload, maybePayload?: PaywallPayload) => void;
  closePaywall: () => void;
}

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

export const PaywallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState('unknown');
  const [courseTitle, setCourseTitle] = useState<string | undefined>();
  const [canPreview, setCanPreview] = useState(false);
  const onPreviewRef = useRef<(() => void) | undefined>();
  const triggerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const closePaywall = useCallback(() => {
    setIsOpen(false);
    setCourseTitle(undefined);
    setCanPreview(false);
    onPreviewRef.current = undefined;
    const prev = triggerRef.current;
    triggerRef.current = null;
    window.setTimeout(() => prev?.focus(), 0);
  }, []);

  const openPaywall = useCallback((sourceOrPayload: string | PaywallPayload = 'unknown', maybePayload?: PaywallPayload) => {
    const payload: PaywallPayload =
      typeof sourceOrPayload === 'string'
        ? { source: sourceOrPayload, ...(maybePayload || {}) }
        : sourceOrPayload;

    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSource(payload.source || 'unknown');
    setCourseTitle(payload.courseTitle);
    setCanPreview(Boolean(payload.canPreview && payload.onPreview));
    onPreviewRef.current = payload.onPreview;
    setIsOpen(true);
    trackEvent('paywall_opened', {
      source: payload.source || 'unknown',
      content_id: payload.courseId || '',
    });
    if (payload.source === 'locked_card' || payload.courseTitle) {
      trackEvent('locked_content_click', {
        content_id: payload.courseId || '',
        source: payload.source || 'unknown',
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePaywall();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        ),
      ].filter((el) => !el.hasAttribute('disabled'));
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    const firstBtn = dialogRef.current?.querySelector<HTMLElement>('button');
    firstBtn?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closePaywall]);

  const goLibraryAccess = () => {
    trackEvent('upgrade_clicked', { source });
    setIsOpen(false);
    navigate('/library-membership');
  };

  const goFitCheck = () => {
    trackEvent('plan_compare_click', { source });
    trackEvent('upgrade_clicked', { source: `fit_check:${source}` });
    setIsOpen(false);
    navigate('/pricing');
  };

  const goPreview = () => {
    const fn = onPreviewRef.current;
    closePaywall();
    fn?.();
  };

  const isLockedContent = Boolean(courseTitle) || source === 'locked_card' || source === 'hero';
  const sourced = copyBySource(source);
  const title = isLockedContent ? 'רוצה להמשיך לצפות?' : sourced.title;
  const body = isLockedContent
    ? 'ההדרכה הזו היא חלק מספריית Infinite Masterpiece למנויים. הצטרפות פותחת גישה לכל ההרצאות, ההדרכות, המסלולים והעדכונים החדשים.'
    : sourced.body;

  return (
    <PaywallContext.Provider value={{ isOpen, openPaywall, closePaywall }}>
      {children}

      {isOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="paywall-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 cursor-pointer"
            aria-label="סגירה"
            onClick={closePaywall}
          />
          <div
            ref={dialogRef}
            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 text-center"
          >
            <h2 id="paywall-title" className="text-2xl font-heading font-semibold text-white mb-2">
              {title}
            </h2>
            {courseTitle ? (
              <p className="text-sm text-white/80 mb-3 line-clamp-2">{courseTitle}</p>
            ) : null}
            <p className="text-sm text-white/70 font-light leading-relaxed mb-8">{body}</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={goLibraryAccess}
                className="btn-gold text-black w-full"
              >
                פתיחת גישה עכשיו
              </button>
              <button
                type="button"
                onClick={goFitCheck}
                className="w-full py-3 rounded-full border border-white/25 text-white text-sm min-h-11 cursor-pointer hover:border-white/50 transition-colors duration-200"
              >
                בדיקת התאמה
              </button>
              {canPreview && (
                <button
                  type="button"
                  onClick={goPreview}
                  className="w-full py-3 rounded-full border border-white/15 text-white/80 text-sm min-h-11 cursor-pointer hover:border-white/30 transition-colors duration-200"
                >
                  צפייה בטעימה
                </button>
              )}
              <button
                type="button"
                onClick={closePaywall}
                className="w-full py-3 text-sm text-white/70 hover:text-white min-h-11 cursor-pointer transition-colors duration-200"
              >
                לא עכשיו
              </button>
            </div>
          </div>
        </div>
      )}
    </PaywallContext.Provider>
  );
};

function copyBySource(source: string): { title: string; body: string } {
  const map: Record<string, { title: string; body: string }> = {
    first_login: {
      title: 'ברוכים הבאים לספרייה',
      body: 'פתיחת גישה נעשית במנוי לספרייה — לא ברכישת קורס בודד. מנוי פותח הרצאות, הדרכות ועדכונים. מסלול המיזם המלא (8888 ₪) הוא נפרד — «בדיקת התאמה».',
    },
    return_visit: {
      title: 'שמחים שחזרתם',
      body: 'הספרייה ממתינה. מנוי לצפייה פותח את התכנים. מסלול כניסה למיזם — דרך «בדיקת התאמה».',
    },
    save_list: {
      title: 'נשמר ברשימה',
      body: 'עם מנוי ספרייה תוכלו לחזור לכל מה ששמרתם, בלי הגבלה.',
    },
    save_limit: {
      title: 'הרשימה החינמית מלאה',
      body: 'אפשר לשמור עד שלוש הרצאות במסלול החינמי. מנוי ספרייה פותח שמירה בלי הגבלה.',
    },
    after_free: {
      title: 'הטעימה הסתיימה',
      body: 'ההמשך פתוח במנוי לספרייה — לא דרך רכישת ההרצאה הזו בנפרד.',
    },
    preview_limit: {
      title: 'הטעימה הסתיימה',
      body: 'ראיתם שתי דקות. ההמשך נפתח במנוי לספרייה.',
    },
    founder_profile: {
      title: 'הרצאות צוות המיזם',
      body: 'צפייה מלאה פתוחה במנוי ספרייה או במסלול כניסה למיזם.',
    },
  };
  return (
    map[source] || {
      title: 'רוצה להמשיך לצפות?',
      body: 'ההדרכה הזו היא חלק מספריית Infinite Masterpiece למנויים. מנוי לצפייה פותח גישה — לא רכישת קורס בודד. מסלול המיזם המלא נפרד.',
    }
  );
}

export const usePaywall = () => {
  const ctx = useContext(PaywallContext);
  if (!ctx) throw new Error('usePaywall must be used within PaywallProvider');
  return ctx;
};
