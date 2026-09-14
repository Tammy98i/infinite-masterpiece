import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AccountMenu } from '../../components/AccountMenu';
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

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const onPremium88 = location.pathname === '/premium-88';
  const onPricing = location.pathname === '/pricing';
  const onJourney = location.pathname === '/journey';
  const onWebinarLanding = location.pathname === '/webinar';
  const onWebinar = location.pathname.startsWith('/webinar');
  const { phase, liveEnter } = useWebinarPhase();
  const copy = webinarCopy(phase);

  const headerCtaClass = 'btn-gold text-black text-sm px-5 py-3';
  const compactBarCtaClass = 'btn-gold text-black text-[12px] px-3 py-2 shrink-0 max-w-[9.5rem] leading-tight text-center';

  const goToWebinarForm = () => {
    trackWebinarCta('header');
    if (onWebinarLanding) {
      scrollToWebinarForm();
      return;
    }
    window.location.assign(`/webinar#${WEBINAR_REGISTER_ID}`);
  };

  const renderPhaseCta = (className: string, label: string, liveLabel?: string): ReactNode => {
    if (phase === 'live' && liveEnter.href) {
      return (
        <a
          href={liveEnter.href}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackWebinarCta('header_enter')}
          className={className}
        >
          {liveLabel || liveEnter.label}
        </a>
      );
    }
    if (onWebinarLanding || phase === 'ended') {
      return (
        <button type="button" onClick={goToWebinarForm} className={className}>
          {label}
        </button>
      );
    }
    return (
      <Link to={onWebinar ? `/webinar#${WEBINAR_REGISTER_ID}` : '/webinar'} className={className}>
        {label}
      </Link>
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const defaultNavLinks: Array<{ name: string; to: string; accent?: boolean }> = [
    { name: 'וובינר', to: '/webinar', accent: true },
    { name: 'תהליך', to: '/journey' },
    { name: 'צוות המיזם', to: '/premium-88' },
    { name: 'מחירון', to: '/pricing' },
    { name: 'שאלות', to: '/faq' },
  ];
  const navLinks = onWebinar ? WEBINAR_NAV : defaultNavLinks;

  const logo = (compact: boolean) => (
    <Link to="/" className={cn('flex items-center group min-h-11', compact ? 'gap-2' : 'gap-3 sm:gap-4')}>
      <InfinityIcon
        className={cn('text-[#F7E7B5] opacity-80 group-hover:opacity-100 transition-opacity duration-300', compact ? 'w-6 h-6' : 'w-8 h-8')}
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
      aria-label="כותרת האתר"
      className={cn(
        'fixed top-0 inset-x-0 z-50 h-20 transition-colors duration-500',
        isScrolled
          ? 'bg-[#010308]/82 backdrop-blur-2xl border-b border-white/[0.08]'
          : 'bg-gradient-to-b from-[#010308]/80 via-[#010308]/35 to-transparent border-b border-transparent'
      )}
    >
      <div className="hidden lg:grid mx-auto h-full w-full max-w-[1400px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {logo(false)}
        <nav className="flex items-center justify-center gap-6 xl:gap-10 min-w-0" aria-label="ניווט ראשי">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              className={cn(
                'text-[13px] font-light tracking-wide transition-colors duration-300',
                onWebinar
                  ? 'text-white/85 hover:text-white'
                  : 'accent' in link && link.accent
                    ? onPremium88 && link.to === '/premium-88'
                      ? 'text-[#F7E7B5] font-medium'
                      : 'text-[#C8A24C] hover:text-[#F7E7B5]'
                    : link.to === '/pricing' && onPricing
                      ? 'text-white font-medium'
                      : link.to === '/journey' && onJourney
                        ? 'text-white font-medium'
                        : 'text-white/85 hover:text-white'
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-3 shrink-0">
          {renderPhaseCta(headerCtaClass, copy.headerCta)}
          {!onWebinar ? (
            <Link
              to="/library"
              className="px-5 py-3 rounded-full text-sm font-medium text-white/85 hover:text-[#C8A24C] transition-colors duration-500 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#010308]"
              aria-label="כניסה לספרייה אינסופית. קורסים והרצאות אונליין"
            >
              ספרייה
            </Link>
          ) : null}
          <AccountMenu />
        </div>
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
        {renderPhaseCta(compactBarCtaClass, copy.headerCtaShort)}
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
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.to}
                  className={cn(
                    'text-lg font-light min-h-11 inline-flex items-center',
                    'accent' in link && link.accent ? 'text-[#F7E7B5]' : 'text-white/90 hover:text-white'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-white/[0.05] flex flex-col gap-4">
                <div className="flex justify-center">
                  <AccountMenu />
                </div>
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
                      goToWebinarForm();
                    }}
                    className="btn-gold text-black text-base w-full px-8 py-4"
                  >
                    {copy.headerCta}
                  </button>
                )}
                {!onWebinar ? (
                  <Link
                    to="/library"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-8 py-3 text-sm text-white/85 hover:text-[#C8A24C] min-h-11"
                  >
                    כבר בפנים? כניסה לספרייה
                  </Link>
                ) : null}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
