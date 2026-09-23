import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Infinity as InfinityIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AccountMenu } from '../../components/AccountMenu';
import { scrollToWebinarForm, trackWebinarCta } from '../../utils/analytics';
import {
  WEBINAR_CTA_HEADER,
  WEBINAR_CTA_REGISTER,
  WEBINAR_CTA_NEXT_CYCLE,
  WEBINAR_CTA_NEXT_CYCLE_SHORT,
  WEBINAR_CTA_SHORT,
  WEBINAR_REGISTER_ID,
} from '../../constants/webinarPage';
import { useWebinarPhase } from '../hooks/useWebinarPhase';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const onPricing = location.pathname === '/pricing';
  const onWebinarLanding = location.pathname === '/webinar';
  const onWebinar = location.pathname.startsWith('/webinar');
  const onHesitation = location.pathname.startsWith('/hesitation');
  const onDecision = onPricing || onHesitation;
  const { phase, liveEnter } = useWebinarPhase();

  const headerCtaClass = 'header-cta btn-gold text-black';

  const decisionCta = (className: string, onClick?: () => void) => {
    if (onHesitation && !location.pathname.startsWith('/hesitation-success')) {
      return (
        <a href="#hesitation-form" onClick={onClick} className={className}>
          המשך במסלול
        </a>
      );
    }
    return (
      <Link to="/#pricing" onClick={onClick} className={className}>
        בחירת מסלול
      </Link>
    );
  };

  const headerCta = () => {
    if (onDecision) return decisionCta(headerCtaClass);
    if (phase === 'ended') {
      return (
        <Link to="/#pricing" className={headerCtaClass}>
          {WEBINAR_CTA_NEXT_CYCLE}
        </Link>
      );
    }
    if (phase === 'live' && liveEnter.href) {
      return (
        <a
          href={liveEnter.href}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackWebinarCta('header_enter')}
          className={headerCtaClass}
        >
          {liveEnter.label}
        </a>
      );
    }
    if (onWebinarLanding) {
      return (
        <button type="button" onClick={goToWebinarForm} className={headerCtaClass}>
          {WEBINAR_CTA_REGISTER}
        </button>
      );
    }
    return (
      <Link to={onWebinar ? `/webinar#${WEBINAR_REGISTER_ID}` : '/webinar'} className={headerCtaClass}>
        {WEBINAR_CTA_REGISTER}
      </Link>
    );
  };

  const compactBarCtaClass = 'header-cta btn-gold text-black shrink-0';

  const compactBarCta = () => {
    if (onDecision) return decisionCta(compactBarCtaClass);
    if (phase === 'ended') {
      return (
        <Link to="/#pricing" className={compactBarCtaClass}>
          {WEBINAR_CTA_NEXT_CYCLE_SHORT}
        </Link>
      );
    }
    if (phase === 'live' && liveEnter.href) {
      return (
        <a
          href={liveEnter.href}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackWebinarCta('header_enter')}
          className={compactBarCtaClass}
        >
          {WEBINAR_CTA_SHORT}
        </a>
      );
    }
    if (onWebinarLanding) {
      return (
        <button type="button" onClick={goToWebinarForm} className={compactBarCtaClass}>
          {WEBINAR_CTA_SHORT}
        </button>
      );
    }
    return (
      <Link to={onWebinar ? `/webinar#${WEBINAR_REGISTER_ID}` : '/webinar'} className={compactBarCtaClass}>
        {WEBINAR_CTA_SHORT}
      </Link>
    );
  };

  const mobileHeaderCta = () => {
    const close = () => setMobileMenuOpen(false);
    const mobileClass = 'btn-gold text-black text-base block w-full text-center px-8 py-4';
    if (onDecision) return decisionCta(mobileClass, close);
    if (phase === 'ended') {
      return (
        <Link to="/#pricing" onClick={close} className={mobileClass}>
          {WEBINAR_CTA_NEXT_CYCLE}
        </Link>
      );
    }
    if (phase === 'live' && liveEnter.href) {
      return (
        <a
          href={liveEnter.href}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            close();
            trackWebinarCta('header_enter');
          }}
          className={mobileClass}
        >
          {liveEnter.label}
        </a>
      );
    }
    if (onWebinar) {
      return (
        <button
          type="button"
          onClick={() => {
            close();
            goToWebinarForm();
          }}
          className={mobileClass}
        >
          {WEBINAR_CTA_HEADER}
        </button>
      );
    }
    return (
      <Link to="/webinar" onClick={close} className={mobileClass}>
        {WEBINAR_CTA_HEADER}
      </Link>
    );
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const outside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !burgerRef.current?.contains(event.target as Node)) setMobileMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener('click', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('click', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [mobileMenuOpen]);

  const goToWebinarForm = () => {
    trackWebinarCta('header');
    if (onWebinarLanding) {
      scrollToWebinarForm();
      return;
    }
    window.location.assign(`/webinar#${WEBINAR_REGISTER_ID}`);
  };

  return (
    <header
      role="banner"
      aria-label="כותרת האתר"
      className="editorial-site-header fixed top-0 inset-inline-0 z-50"
    >
      <div className="header-row mx-auto grid h-full w-full max-w-[1400px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-8 lg:px-10">
          <Link to="/" aria-label="Infinite Masterpiece, דף הבית" className="header-logo flex items-center gap-3 sm:gap-4 group shrink-0 min-h-11">
            <InfinityIcon className="w-8 h-8 text-[#dfc47d] opacity-80 group-hover:opacity-100 transition-opacity duration-300" strokeWidth={1} />
            <div className="header-wordmark flex flex-col">
              <span className="font-light text-[13px] sm:text-[15px] tracking-[0.25em] text-white/90 leading-tight uppercase">
                Infinite
                <br/>
                <span className="font-medium">Masterpiece</span>
              </span>
            </div>
          </Link>

          <div className="header-links min-w-0" aria-hidden="true" />

          <div className="header-actions flex items-center justify-end gap-2 sm:gap-3 shrink-0">
            <div className="header-desktop hidden lg:flex items-center gap-3">
              {headerCta()}
              <Link
                to="/library"
                className="px-5 py-3 rounded-full text-sm font-medium text-white/85 hover:text-[#b79043] transition-colors duration-200 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0b08]"
                aria-label="כניסה לספרייה אינסופית. קורסים והרצאות אונליין"
              >
                ספרייה
              </Link>
              <AccountMenu />
            </div>
            <div className="header-mobile flex items-center gap-2 lg:hidden">
              <div className="header-compact-cta">{compactBarCta()}</div>
              <AccountMenu />
              <button
                type="button"
                ref={burgerRef}
                className="header-burger p-2 text-white/85 hover:text-white transition-colors min-h-11 min-w-11 flex items-center justify-center cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation();
                  setMobileMenuOpen((open) => !open);
                }}
                aria-label={mobileMenuOpen ? 'סגירת תפריט ניווט' : 'תפריט ניווט'}
                aria-controls="site-mobile-menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" strokeWidth={1.5} /> : <Menu className="w-6 h-6" strokeWidth={1.5} />}
              </button>
            </div>
          </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={menuRef}
            id="site-mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="header-panel lg:hidden absolute top-full inset-inline-0 bg-[#0d0b08]/95 backdrop-blur-3xl border-b border-white/[0.05]"
          >
            <nav className="px-6 py-8 flex flex-col gap-6" aria-label="ניווט נייד">
              <div className="flex flex-col gap-4">
                {mobileHeaderCta()}
                <Link
                  to="/library"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-8 py-3 text-sm text-white/85 hover:text-[#b79043] min-h-11"
                >
                  כבר בפנים? כניסה לספרייה
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
