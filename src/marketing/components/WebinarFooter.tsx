import { Link } from 'react-router-dom';
import { Infinity as InfinityIcon } from 'lucide-react';
import { WEBINAR_REGISTER_ID } from '../../constants/webinarPage';
import { webinarCopy } from '../../constants/webinarPhaseCopy';
import { useWebinarPhase } from '../hooks/useWebinarPhase';

export function WebinarFooter() {
  const { phase } = useWebinarPhase();
  const copy = webinarCopy(phase);

  return (
    <footer
      className="relative bg-[#010308]/78 backdrop-blur-xl overflow-hidden pt-8 pb-24 border-t border-white/[0.08]"
      role="contentinfo"
      aria-label="תחתית הוובינר"
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
            {copy.footerRegister}
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
