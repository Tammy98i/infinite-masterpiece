import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { scrollToWebinarForm, trackWebinarCta } from '../../utils/analytics';
import { WEBINAR_REGISTER_ID } from '../../constants/webinarPage';
import { webinarCopy } from '../../constants/webinarPhaseCopy';
import { useWebinarPhase } from '../hooks/useWebinarPhase';

const WEBINAR_NAV = [
  { name: 'הצוות', to: '/webinar#hosts' },
  { name: 'האנשים', to: '/webinar#webinar-people' },
  { name: 'התאמה', to: '/webinar#webinar-fit' },
  { name: 'שאלות נפוצות', to: '/webinar#webinar-faq' },
];

export function WebinarHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { phase, liveEnter } = useWebinarPhase();
  const copy = webinarCopy(phase);

  const headerCtaClass = 'btn-gold text-black text-sm px-5 py-3';
  const compactBarCtaClass =
    'btn-gold text-black text-[12px] px-3 py-2 shrink-0 max-w-[9.5rem] leading-tight text-center';

  const goToForm = () => {
    trackWebinarCta('header');
    if (location.pathname === '/webinar') {
      scrollToWebinarForm();
      return;
    }
    window.location.assign(`/webinar#${WEBINAR_REGISTER_ID}`);
  };

  const cta = (className: string, label: string) => {
    if (phase === 'live' && liveEnter.href) {
      return (
        <a
          href={liveEnter.href}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackWebinarCta('header_enter')}
          className={className}
        >
          {liveEnter.label}
        </a>
      );
    }
    return (
      <button type="button" onClick={goToForm} className={className}>
        {label}
      </button>
    );
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logo = (compact: boolean) => (
    <Link to="/webinar" className={cn('flex items-center group min-h-11', compact ? 'gap-2' : 'gap-3 sm:gap-4')}>
      <InfinityIcon
        className={cn(
          'text-[#F7E7B5] opacity-80 group-hover:opacity-100 transition-opacity duration-300',
          compact ? 'w-6 h-6' : 'w-8 h-8',
        )}
        strokeWidth={1}
      />
      <span
        className={cn(
          'font-light tracking-[0.2em] text-white/90 leading-tight uppercase text-center',
          compact ? 'text-[11px]' : 'text-[13px] sm:text-[15px] tracking-[0.25em] text-right',
        )}
      >
        Infinite
        {compact ? ' ' : <br />}
        <span className="font-medium">Masterpiece</span>
      </span>
    </Link>
  );

  return (
    <header
      role="banner"
      aria-label="כותרת הוובינר"
      className={cn(
        'fixed top-0 inset-x-0 z-50 h-20 transition-colors duration-500',
        isScrolled
          ? 'bg-[#010308]/82 backdrop-blur-2xl border-b border-white/[0.08]'
          : 'bg-gradient-to-b from-[#010308]/80 via-[#010308]/35 to-transparent border-b border-transparent',
      )}
    >
      <div className="hidden lg:grid mx-auto h-full w-full max-w-[1400px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {logo(false)}
        <nav className="flex items-center justify-center gap-6 xl:gap-10 min-w-0" aria-label="ניווט הוובינר">
          {WEBINAR_NAV.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              className="text-[13px] font-light tracking-wide transition-colors duration-300 text-white/85 hover:text-white"
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-end shrink-0">{cta(headerCtaClass, copy.headerCta)}</div>
      </div>

      <div className="lg:hidden grid h-full w-full grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-2 px-3">
        <button
          type="button"
          className="p-2 text-white/85 hover:text-white transition-colors min-h-11 min-w-11 flex items-center justify-center cursor-pointer justify-self-start"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="תפריט ניווט"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" strokeWidth={1.5} /> : <Menu className="w-6 h-6" strokeWidth={1.5} />}
        </button>
        <div className="flex justify-center min-w-0">{logo(true)}</div>
        {cta(compactBarCtaClass, copy.headerCtaShort)}
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden absolute top-full left-0 right-0 bg-[#010308]/95 backdrop-blur-3xl border-b border-white/[0.05]"
          >
            <nav className="px-6 py-8 flex flex-col gap-6" aria-label="ניווט נייד">
              {WEBINAR_NAV.map((link) => (
                <Link
                  key={link.name}
                  to={link.to}
                  className="text-lg font-light min-h-11 inline-flex items-center text-white/90 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-white/[0.05]">
                {phase === 'live' && liveEnter.href ? (
                  <a
                    href={liveEnter.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      trackWebinarCta('header_enter');
                    }}
                    className="btn-gold text-black text-base block w-full text-center px-8 py-4"
                  >
                    {liveEnter.label}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      goToForm();
                    }}
                    className="btn-gold text-black text-base w-full px-8 py-4"
                  >
                    {copy.headerCta}
                  </button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
