import { Link, useLocation } from 'react-router-dom';
import { Infinity as InfinityIcon } from 'lucide-react';
import { WEBINAR_REGISTER_ID } from '../../constants/webinarPage';

const FOOTER_LINK =
  'text-[#dfc47d] hover:text-[#dfc47d] transition-colors min-h-11 inline-flex items-center';
const FOOTER_HEADING = 'text-[11px] uppercase tracking-[0.2em] text-[#b79043] mb-4';

export function Footer() {
  const location = useLocation();
  const onWebinar = location.pathname.startsWith('/webinar');

  if (onWebinar) {
    return (
      <footer
        className="editorial-site-footer relative bg-[#0d0b08]/78 backdrop-blur-xl overflow-hidden pt-12 pb-12 border-t border-white/[0.08]"
        role="contentinfo"
        aria-label="תחתית האתר"
      >
        <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="קישורי וובינר"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-light mb-8"
          >
            <Link to="/" className={FOOTER_LINK}>
              האתר
            </Link>
            <Link to="/library" className={FOOTER_LINK}>
              ספרייה
            </Link>
            <Link to={`/webinar#${WEBINAR_REGISTER_ID}`} className={FOOTER_LINK}>
              הרשמה
            </Link>
            <Link to="/webinar#webinar-faq" className={FOOTER_LINK}>
              שאלות
            </Link>
            <Link to="/terms" className={FOOTER_LINK}>
              תנאי שימוש
            </Link>
            <Link to="/privacy" className={FOOTER_LINK}>
              פרטיות
            </Link>
            <Link to="/accessibility" className={FOOTER_LINK}>
              נגישות
            </Link>
          </nav>
          <div className="flex items-center justify-center gap-3 text-[#dfc47d]">
            <InfinityIcon className="w-6 h-6" strokeWidth={1} />
            <span className="text-[11px] uppercase tracking-widest">© {new Date().getFullYear()} Infinite Masterpiece</span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="editorial-site-footer relative bg-[#0d0b08]/78 backdrop-blur-xl overflow-hidden pt-24 pb-14 border-t border-white/[0.08]" role="contentinfo" aria-label="תחתית האתר">
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-16 text-start mb-20">
          <div>
            <h3 className={FOOTER_HEADING}>המסלול</h3>
            <ul className="space-y-3 text-sm font-light">
              <li><Link to="/#difference" className={FOOTER_LINK}>במה זה שונה</Link></li>
              <li><Link to="/#journey" className={FOOTER_LINK}>התהליך. 33 ימים</Link></li>
              <li><Link to="/#pricing" className={FOOTER_LINK}>מחיר</Link></li>
              <li><Link to="/hesitation" className={FOOTER_LINK}>מסלול ההססנים</Link></li>
            </ul>
          </div>
          <div>
            <h3 className={FOOTER_HEADING}>
              <Link to="/webinar" className="hover:text-[#dfc47d] transition-colors">
                וובינר
              </Link>
            </h3>
            <ul className="space-y-3 text-sm font-light">
              <li><Link to="/webinar" className={FOOTER_LINK}>הרשמה לוובינר</Link></li>
              <li><Link to="/#team" className={FOOTER_LINK}>מהי שכבת העומק</Link></li>
              <li><Link to="/#team" className={FOOTER_LINK}>צוות המיזם</Link></li>
              <li><Link to="/application?type=88" className={FOOTER_LINK}>הגשת מועמדות</Link></li>
            </ul>
          </div>
          <div>
            <h3 className={FOOTER_HEADING}>הספרייה</h3>
            <ul className="space-y-3 text-sm font-light">
              <li><Link to="/library-membership" className={FOOTER_LINK}>מנוי ספרייה</Link></li>
              <li><Link to="/library" className={FOOTER_LINK}>כניסה לספרייה</Link></li>
              <li><Link to="/#platform" className={FOOTER_LINK}>הפלטפורמה</Link></li>
            </ul>
          </div>
          <div>
            <h3 className={FOOTER_HEADING}>מידע</h3>
            <ul className="space-y-3 text-sm font-light">
              <li><Link to="/#faq" className={FOOTER_LINK}>שאלות</Link></li>
              <li><Link to="/terms" className={FOOTER_LINK}>תנאי שימוש</Link></li>
              <li><Link to="/privacy" className={FOOTER_LINK}>פרטיות</Link></li>
              <li><Link to="/accessibility" className={FOOTER_LINK}>הצהרת נגישות</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 text-[#dfc47d]">
            <InfinityIcon className="w-6 h-6" strokeWidth={1} />
            <span className="text-[11px] uppercase tracking-widest">© {new Date().getFullYear()} Infinite Masterpiece</span>
          </div>
          <Link
            to="/#pricing"
            className="text-sm text-[#b79043] hover:text-[#dfc47d] transition-colors min-h-11 inline-flex items-center"
          >
            להצטרפות למסע
          </Link>
        </div>
      </div>
    </footer>
  );
}
