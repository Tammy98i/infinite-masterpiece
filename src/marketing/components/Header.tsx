import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AccountMenu } from '../../components/AccountMenu';

const NAV_LINKS = [
  { name: 'תהליך', to: '/journey' },
  { name: 'האנשים', to: '/team' },
  { name: 'צוות המיזם', to: '/premium-88' },
  { name: 'מחירון', to: '/pricing' },
  { name: 'שאלות', to: '/faq' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const onPremium88 = location.pathname === '/premium-88';
  const onPricing = location.pathname === '/pricing';
  const onJourney = location.pathname === '/journey';
  const onTeam = location.pathname === '/team';

  const headerCtaClass = 'btn-gold text-black text-sm px-5 py-3';
  const compactBarCtaClass =
    'btn-gold text-black text-[12px] px-3 py-2 shrink-0 max-w-[9.5rem] leading-tight text-center';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logo = (compact: boolean) => (
    <Link to="/" className={cn('flex items-center group min-h-11', compact ? 'gap-2' : 'gap-3 sm:gap-4')}>
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

  const navClass = (to: string) =>
    cn(
      'text-[13px] font-light tracking-wide transition-colors duration-300',
      (to === '/premium-88' && onPremium88) ||
        (to === '/pricing' && onPricing) ||
        (to === '/journey' && onJourney) ||
        (to === '/team' && onTeam)
        ? 'text-white font-medium'
        : 'text-white/85 hover:text-white',
    );

  return (
    <header
      role="banner"
      aria-label="כותרת האתר"
      className={cn(
        'fixed top-0 inset-x-0 z-50 h-20 transition-colors duration-500',
        isScrolled
          ? 'bg-[#010308]/82 backdrop-blur-2xl border-b border-white/[0.08]'
          : 'bg-gradient-to-b from-[#010308]/80 via-[#010308]/35 to-transparent border-b border-transparent',
      )}
    >
      <div className="hidden lg:grid mx-auto h-full w-full max-w-[1400px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {logo(false)}
        <nav className="flex items-center justify-center gap-6 xl:gap-10 min-w-0" aria-label="ניווט ראשי">
          {NAV_LINKS.map((link) => (
            <Link key={link.name} to={link.to} className={navClass(link.to)}>
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-3 shrink-0">
          <Link to="/pricing" className={headerCtaClass}>
            בחירת מסלול
          </Link>
          <Link
            to="/library"
            className="px-5 py-3 rounded-full text-sm font-medium text-white/85 hover:text-[#C8A24C] transition-colors duration-500 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#010308]"
            aria-label="כניסה לספרייה אינסופית. קורסים והרצאות אונליין"
          >
            ספרייה
          </Link>
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
        <Link to="/pricing" className={compactBarCtaClass}>
          בחירת מסלול
        </Link>
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
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  to={link.to}
                  className="text-lg font-light min-h-11 inline-flex items-center text-white/90 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-white/[0.05] flex flex-col gap-4">
                <div className="flex justify-center">
                  <AccountMenu />
                </div>
                <Link
                  to="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-gold text-black text-base block w-full text-center px-8 py-4"
                >
                  בחירת מסלול
                </Link>
                <Link
                  to="/library"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-8 py-3 text-sm text-white/85 hover:text-[#C8A24C] min-h-11"
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
