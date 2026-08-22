import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AccountMenu } from '../../components/AccountMenu';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const onPremium88 = location.pathname === '/premium-88';
  const onPricing = location.pathname === '/pricing';
  const onJourney = location.pathname === '/journey';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: Array<{ name: string; to: string; accent?: boolean }> = [
    { name: 'תהליך', to: '/journey' },
    { name: 'צוות המיזם', to: '/premium-88', accent: true },
    { name: 'מחירון', to: '/pricing' },
    { name: 'שאלות', to: '/faq' },
  ];

  return (
    <header
      role="banner"
      aria-label="כותרת האתר"
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-[#010308]/60 backdrop-blur-2xl border-b border-white/[0.03] py-4'
          : 'bg-transparent py-8'
      )}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-4 group">
            <InfinityIcon className="w-8 h-8 text-[#F7E7B5] opacity-80 group-hover:opacity-100 transition-opacity duration-300" strokeWidth={1} />
            <div className="flex flex-col">
              <span className="font-light text-[15px] tracking-[0.25em] text-white/90 leading-tight uppercase">
                Infinite
                <br/>
                <span className="font-medium">Masterpiece</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10" aria-label="ניווט ראשי">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                className={cn(
                  'text-[13px] font-light tracking-wide transition-colors duration-300',
                  link.accent
                    ? onPremium88
                      ? 'text-[#F7E7B5] font-medium'
                      : 'text-[#C8A24C] hover:text-[#F7E7B5]'
                    : link.to === '/pricing' && onPricing
                    ? 'text-white font-medium'
                    : link.to === '/journey' && onJourney
                    ? 'text-white font-medium'
                    : 'text-white/60 hover:text-white'
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/library"
              className="px-6 py-3 rounded-full text-sm font-medium text-white/90 border border-[#C8A24C]/40 hover:border-[#F7E7B5] hover:text-white transition-all duration-300 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#010308]"
              aria-label="כניסה לספרייה אינסופית. קורסים והרצאות אונליין"
            >
              ספרייה
            </Link>
            <AccountMenu />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <AccountMenu />
            <button
              type="button"
              className="p-2 text-white/60 hover:text-white transition-colors min-h-11 min-w-11 flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="תפריט ניווט"
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
                    'text-lg font-light',
                    link.accent ? 'text-[#F7E7B5]' : 'text-white/70 hover:text-white'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-white/[0.05] flex flex-col gap-4">
                <Link
                  to="/library"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-8 py-4 rounded-full text-base font-medium text-white border border-[#C8A24C]/40 min-h-11"
                >
                  ספרייה
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
