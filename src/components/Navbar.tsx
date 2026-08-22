import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useUser } from '../context/UserContext';
import { Search, Mic, Shield, Menu, X, Infinity as InfinityIcon, Compass, Bookmark, User } from 'lucide-react';
import { AccountMenu } from './AccountMenu';
import { trackEvent } from '../utils/analytics';
import { searchSuggestions } from '../utils/searchCatalog';
import { formatClock } from '../utils/time';
import { getCardAccessState } from '../utils/libraryHome';

export const Navbar: React.FC = () => {
  const {
    currentView,
    setView,
    isAdmin,
    isLecturer,
    searchQuery,
    setSearchQuery,
    courses,
    instructors,
    categories,
  } = useApp();
  const { user, isGuest, setAuthModalOpen } = useUser();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestions = useMemo(
    () => (isSearchOpen ? searchSuggestions(courses, instructors, categories, searchQuery, 6) : []),
    [isSearchOpen, courses, instructors, categories, searchQuery]
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setView('search');
    }
  };

  const moreLinks = [
    { label: 'היסטוריה', view: 'history' as const },
    { label: 'מסלולי למידה', view: 'paths' as const },
    { label: 'יש לי 10 דקות', view: 'shorts' as const },
    { label: 'מומחים ומרצים', view: 'instructors' as const },
    { label: 'מה מתאים לי', view: 'quiz' as const },
  ];

  return (
    <>
      <header
        role="banner"
        aria-label="כותרת הספרייה"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || currentView !== 'home'
            ? 'bg-[#0a0a0acc] backdrop-blur-md border-b border-white/10 shadow-xl'
            : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Right Section: Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setView('home')}
                className="flex items-center gap-4 group focus-ring rounded-xl"
                aria-label="Infinite Masterpiece"
              >
                <InfinityIcon className="w-8 h-8 text-[#F7E7B5] opacity-80 group-hover:opacity-100 transition-opacity duration-300" strokeWidth={1} />
                <span className="hidden sm:block font-light text-[15px] tracking-[0.25em] text-white/90 leading-tight uppercase">
                  Infinite
                  <br />
                  <span className="font-medium">Masterpiece</span>
                </span>
              </button>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-[14px] sm:text-[15px] font-light" aria-label="ניווט הספרייה">
              <button
                type="button"
                onClick={() => setView('home')}
                className={`transition-colors py-2 min-h-11 border-b-2 ${
                  currentView === 'home'
                    ? 'text-white border-[#C8A24C]'
                    : 'text-white/60 hover:text-white border-transparent'
                }`}
              >
                ספרייה
              </button>
              <button
                type="button"
                onClick={() => setView('mylist')}
                className={`transition-colors py-2 min-h-11 border-b-2 ${
                  currentView === 'mylist'
                    ? 'text-white border-[#C8A24C]'
                    : 'text-white/60 hover:text-white border-transparent'
                }`}
              >
                הרשימה
              </button>
              <button
                type="button"
                onClick={() => setView('history')}
                className={`transition-colors py-2 min-h-11 border-b-2 ${
                  currentView === 'history'
                    ? 'text-white border-[#C8A24C]'
                    : 'text-white/60 hover:text-white border-transparent'
                }`}
              >
                היסטוריה
              </button>
              <button
                type="button"
                onClick={() => setView('shorts')}
                className={`transition-colors py-2 min-h-11 border-b-2 ${
                  currentView === 'shorts'
                    ? 'text-white border-[#C8A24C]'
                    : 'text-white/60 hover:text-white border-transparent'
                }`}
              >
                10 דק׳
              </button>
            </nav>
          </div>

          {/* Left Section: Search, My List, Profile, Admin */}
          <div className="flex items-center gap-3">
            
            {/* Search Bar / Icon */}
            <div className="relative flex items-center">
              {isSearchOpen ? (
                <div className="relative">
                  <form
                    onSubmit={(e) => {
                      handleSearchSubmit(e);
                      trackEvent('search_submit', { query: searchQuery.trim() });
                    }}
                    className="flex items-center animate-in fade-in slide-in-from-left-2 duration-200"
                  >
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="חיפוש בספרייה..."
                      className="w-56 sm:w-72 bg-zinc-900/90 border border-[#C8A24C]/50 rounded-full py-2 pr-9 pl-8 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#C8A24C]/40 shadow-inner min-h-11"
                      aria-label="חיפוש בספרייה"
                      aria-autocomplete="list"
                      aria-controls="library-search-suggestions"
                    />
                    <Search className="w-4 h-4 text-[#C8A24C] absolute right-3 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="absolute left-2.5 text-zinc-400 hover:text-white p-1 min-h-11 min-w-11 flex items-center justify-center"
                      aria-label="סגירת חיפוש"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>

                  {suggestions.length > 0 && (
                    <ul
                      id="library-search-suggestions"
                      role="listbox"
                      className="absolute top-full mt-2 end-0 w-72 sm:w-80 rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden z-50"
                    >
                      {suggestions.map((item) => (
                        <li key={`${item.type}-${item.id}`} role="option">
                          <button
                            type="button"
                            className="w-full text-right px-4 py-3 hover:bg-white/5 min-h-11 border-b border-white/5 last:border-0"
                            onClick={() => {
                              trackEvent('search_result_click', {
                                content_id: item.id,
                                type: item.type,
                              });
                              setIsSearchOpen(false);
                              if (item.type === 'course') setView('course', { courseId: item.id });
                              else if (item.type === 'instructor') setView('instructor', { instructorId: item.id });
                              else setView('category', { categoryId: item.id });
                            }}
                          >
                            <div className="text-sm text-white truncate">{item.label}</div>
                            <div className="text-xs text-white/45 mt-0.5 truncate">
                              {item.type === 'course'
                                ? item.meta || 'הרצאה'
                                : item.type === 'instructor'
                                  ? item.meta || 'מרצה'
                                  : 'נושא'}
                              {item.type === 'course'
                                ? (() => {
                                    const course = courses.find((c) => c.id === item.id);
                                    if (!course) return '';
                                    const access = getCardAccessState(course, user);
                                    const dur = course.episodes.reduce((s, ep) => s + ep.duration, 0);
                                    return ` · ${formatClock(dur)} · ${
                                      access === 'open' ? 'פתוח' : access === 'preview' ? 'טעימה' : 'דורש מסלול'
                                    }`;
                                  })()
                                : ''}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('search_open');
                    setIsSearchOpen(true);
                  }}
                  data-onboarding="search"
                  className="p-2.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors min-h-11 min-w-11 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C]"
                  title="חיפוש בספרייה"
                  aria-label="חיפוש בספרייה"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Admin — hidden unless Ctrl+Shift+A or already in admin mode */}
            {isLecturer && (
            <button
              type="button"
              onClick={() => setView(currentView === 'lecturer' ? 'home' : 'lecturer')}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs min-h-11 border transition-colors duration-200 ${
                currentView === 'lecturer'
                  ? 'border-[#C8A24C] text-[#C8A24C] bg-[#C8A24C]/10'
                  : 'border-white/10 text-white/55 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{currentView === 'lecturer' ? 'חזרה לספרייה' : 'מרצה'}</span>
            </button>
            )}

            {isAdmin && (
            <button
              type="button"
              onClick={() => setView(currentView === 'admin' ? 'home' : 'admin')}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs min-h-11 border transition-colors duration-200 ${
                currentView === 'admin'
                  ? 'border-[#C8A24C] text-[#C8A24C] bg-[#C8A24C]/10'
                  : 'border-white/10 text-white/55 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{currentView === 'admin' ? 'חזרה לספרייה' : 'ניהול'}</span>
            </button>
            )}


            {isGuest && (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="hidden sm:inline-flex items-center px-4 py-2.5 rounded-full border border-white/25 text-white/85 text-sm font-medium hover:border-white/50 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C]"
              >
                כניסה
              </button>
            )}

            <AccountMenu
              onOpenProfile={() => setView('profile')}
              onOpenAdmin={() => setView('admin')}
              onOpenLecturer={() => setView('lecturer')}
            />

            {/* Mobile Hamburger CTA */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 min-h-11 min-w-11 flex items-center justify-center"
              aria-label="תפריט ניווט"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <nav className="md:hidden bg-zinc-950 border-b border-white/10 px-6 py-5 grid gap-2" aria-label="ניווט נייד — ספרייה">
            <button
              type="button"
              onClick={() => {
                navigate('/');
                setIsMobileMenuOpen(false);
              }}
              className="text-right px-4 py-3 rounded-xl text-base text-zinc-200 hover:bg-white/5 min-h-11"
            >
              חזרה לאתר
            </button>
            <button
              type="button"
              onClick={() => {
                setView('mylist');
                setIsMobileMenuOpen(false);
              }}
              className="text-right px-4 py-3 rounded-xl text-base text-zinc-200 hover:bg-white/5 min-h-11"
            >
              הרשימה
            </button>
            {moreLinks.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setView(item.view);
                  setIsMobileMenuOpen(false);
                }}
                className={`text-right px-4 py-3 rounded-xl text-base min-h-11 ${
                  currentView === item.view ? 'bg-primary/15 text-primary-light font-bold' : 'text-zinc-200 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
            {isLecturer && (
              <button
                type="button"
                onClick={() => {
                  setView(currentView === 'lecturer' ? 'home' : 'lecturer');
                  setIsMobileMenuOpen(false);
                }}
                className="text-right px-4 py-3 rounded-xl text-sm text-[#C8A24C] min-h-11"
              >
                {currentView === 'lecturer' ? 'חזרה לספרייה' : 'אזור מרצה'}
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setView(currentView === 'admin' ? 'home' : 'admin');
                  setIsMobileMenuOpen(false);
                }}
                className="text-right px-4 py-3 rounded-xl text-sm text-[#C8A24C] min-h-11"
              >
                {currentView === 'admin' ? 'חזרה לספרייה' : 'ניהול'}
              </button>
            )}
          </nav>
        )}
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0af2] backdrop-blur-xl border-t border-white/10 py-2 px-6 flex items-center justify-between" aria-label="ניווט תחתון — ספרייה">
        <button
          type="button"
          onClick={() => setView('home')}
          className={`flex flex-col items-center gap-1 min-h-11 min-w-11 ${
            currentView === 'home' ? 'text-primary-light font-bold' : 'text-zinc-400'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">ספרייה</span>
        </button>
        <button
          type="button"
          onClick={() => setView('search')}
          className={`flex flex-col items-center gap-1 min-h-11 min-w-11 ${
            currentView === 'search' ? 'text-primary-light font-bold' : 'text-zinc-400'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px]">חיפוש</span>
        </button>
        <button
          type="button"
          onClick={() => setView('mylist')}
          data-onboarding="my-list"
          className={`flex flex-col items-center gap-1 min-h-11 min-w-11 ${
            currentView === 'mylist' ? 'text-primary-light font-bold' : 'text-zinc-400'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px]">הרשימה</span>
        </button>
        <button
          type="button"
          onClick={() => setView('profile')}
          className={`flex flex-col items-center gap-1 min-h-11 min-w-11 ${
            currentView === 'profile' ? 'text-primary-light font-bold' : 'text-zinc-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">חשבון</span>
        </button>
      </nav>
    </>
  );
};
