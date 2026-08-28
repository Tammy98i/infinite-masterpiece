import { Link, useLocation } from 'react-router-dom';
import { Infinity as InfinityIcon } from 'lucide-react';
import { WEBINAR_REGISTER_ID } from '../../constants/webinarPage';

export function Footer() {
  const location = useLocation();
  const onWebinar = location.pathname.startsWith('/webinar');

  if (onWebinar) {
    return (
      <footer
        className="relative bg-[#010308]/40 overflow-hidden pt-12 pb-12 border-t border-white/[0.04]"
        role="contentinfo"
        aria-label="תחתית האתר"
      >
        <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="קישורי וובינר"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50 font-light mb-8"
          >
            <Link
              to={`/webinar#${WEBINAR_REGISTER_ID}`}
              className="hover:text-[#F7E7B5] min-h-11 inline-flex items-center"
            >
              הרשמה
            </Link>
            <Link to="/webinar#webinar-faq" className="hover:text-white min-h-11 inline-flex items-center">
              שאלות
            </Link>
            <Link to="/terms" className="hover:text-white min-h-11 inline-flex items-center">
              תנאי שימוש
            </Link>
            <Link to="/privacy" className="hover:text-white min-h-11 inline-flex items-center">
              פרטיות
            </Link>
            <Link to="/accessibility" className="hover:text-white min-h-11 inline-flex items-center">
              נגישות
            </Link>
          </nav>
          <div className="flex items-center justify-center gap-3 text-white/40">
            <InfinityIcon className="w-6 h-6" strokeWidth={1} />
            <span className="text-[11px] uppercase tracking-widest">© {new Date().getFullYear()} Infinite Masterpiece</span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative bg-[#010308]/40 overflow-hidden pt-20 pb-12 border-t border-white/[0.04]" role="contentinfo" aria-label="תחתית האתר">
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-right mb-16">
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#C8A24C] mb-4">המסלול</h3>
            <ul className="space-y-3 text-sm text-white/50 font-light">
              <li><a href="/#what-is-it" className="hover:text-white transition-colors">במה זה שונה</a></li>
              <li><Link to="/journey" className="hover:text-white transition-colors">התהליך. 33 ימים</Link></li>
              <li><a href="/#pricing" className="hover:text-white transition-colors">מחיר</a></li>
              <li><Link to="/hesitation" className="hover:text-white transition-colors">מסלול ההססנים</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#C8A24C] mb-4">
              <Link to="/webinar" className="hover:text-[#F7E7B5] transition-colors">
                וובינר
              </Link>
            </h3>
            <ul className="space-y-3 text-sm text-white/50 font-light">
              <li><Link to="/webinar" className="hover:text-white transition-colors text-[#C8A24C]/90">הרשמה לוובינר</Link></li>
              <li><a href="/#depth-layer" className="hover:text-white transition-colors">מהי שכבת העומק</a></li>
              <li><Link to="/premium-88" className="hover:text-white transition-colors">צוות המיזם</Link></li>
              <li><Link to="/application?type=88" className="hover:text-white transition-colors">הגשת מועמדות</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#C8A24C] mb-4">הספרייה</h3>
            <ul className="space-y-3 text-sm text-white/50 font-light">
              <li><Link to="/library-membership" className="hover:text-white transition-colors">מנוי ספרייה</Link></li>
              <li><Link to="/library" className="hover:text-white transition-colors">כניסה לספרייה</Link></li>
              <li><a href="/#infinite-library" className="hover:text-white transition-colors">הפלטפורמה</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-[#C8A24C] mb-4">מידע</h3>
            <ul className="space-y-3 text-sm text-white/50 font-light">
              <li><Link to="/faq" className="hover:text-white transition-colors">שאלות</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">תנאי שימוש</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">פרטיות</Link></li>
              <li><Link to="/accessibility" className="hover:text-white transition-colors">הצהרת נגישות</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 text-white/40">
            <InfinityIcon className="w-6 h-6" strokeWidth={1} />
            <span className="text-[11px] uppercase tracking-widest">© {new Date().getFullYear()} Infinite Masterpiece</span>
          </div>
          <Link
            to="/#pricing"
            className="text-sm text-[#C8A24C] hover:text-[#F7E7B5] transition-colors"
          >
            להצטרפות למסע
          </Link>
        </div>
      </div>
    </footer>
  );
}
