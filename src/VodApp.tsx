import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { OnboardingUI } from './components/onboarding/OnboardingUI';
import { OnboardingTriggers } from './components/onboarding/OnboardingTriggers';
import { PaywallProvider } from './context/PaywallContext';
import { ConfirmProvider } from './components/ops/ConfirmDialog';
import { PaywallTriggers } from './components/PaywallTriggers';
import { SITE_TAGLINE } from './constants/brand';

import { HomeView } from './views/HomeView';
import { CategoryView } from './views/CategoryView';
import { CourseDetailView } from './views/CourseDetailView';
import { WatchView } from './views/WatchView';
import { SearchView } from './views/SearchView';
import { MyListView } from './views/MyListView';
import { HistoryView } from './views/HistoryView';
import { ProfileView } from './views/ProfileView';
import { QuizView } from './views/QuizView';
import { ShortsView } from './views/ShortsView';
import { LearningPathsView } from './views/LearningPathsView';
import { InstructorsView } from './views/InstructorsView';
import { InstructorProfileView } from './views/InstructorProfileView';
import { AdminView } from './views/AdminView';
import { LecturerView } from './views/LecturerView';
import { libraryPath } from './utils/libraryPath';

export const VodApp: React.FC = () => {
  const { currentView, setView } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const open = searchParams.get('open');
    if (!open) return;
    if (open === 'subscription') {
      navigate('/pricing', { replace: true });
      return;
    }
    const id = searchParams.get('id');
    const path =
      open === 'course' && id
        ? libraryPath('course', { courseId: id })
        : open === 'profile' || open === 'admin' || open === 'lecturer'
          ? libraryPath(open)
          : null;
    if (path) {
      navigate(path, { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (currentView === 'subscription') {
      navigate('/pricing', { replace: true });
    }
  }, [currentView, navigate]);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'category':
        return <CategoryView />;
      case 'course':
        return <CourseDetailView />;
      case 'watch':
        return <WatchView />;
      case 'search':
        return <SearchView />;
      case 'mylist':
        return <MyListView />;
      case 'history':
        return <HistoryView />;
      case 'profile':
        return <ProfileView />;
      case 'quiz':
        return <QuizView />;
      case 'shorts':
        return <ShortsView />;
      case 'paths':
        return <LearningPathsView />;
      case 'instructors':
        return <InstructorsView />;
      case 'instructor':
        return <InstructorProfileView />;
      case 'subscription':
        return null;
      case 'admin':
        return <AdminView />;
      case 'lecturer':
        return <LecturerView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <PaywallProvider>
    <ConfirmProvider>
    <PaywallTriggers />
    <div className="vod-app flex flex-col min-h-screen bg-[#050505] text-white">
      {currentView !== 'watch' && (
        <a href="#library-main" className="skip-link">
          דילוג לתוכן הראשי
        </a>
      )}
      {currentView !== 'watch' && currentView !== 'admin' && currentView !== 'lecturer' && <Navbar />}

      <main id="library-main" className="flex-grow" tabIndex={-1}>
        {renderView()}
      </main>

      {currentView !== 'watch' && (
        <footer className="border-t border-white/10 bg-black py-6 px-4 sm:px-8 text-right select-none" role="contentinfo" aria-label="תחתית הספרייה">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-sm text-zinc-400">
            <div>
              <p className="text-white/80 mb-1 text-sm">Infinite Masterpiece</p>
              <p className="text-sm">{SITE_TAGLINE}</p>
            </div>
            <div className="flex flex-wrap gap-5 text-sm">
              <Link to="/" className="hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] rounded min-h-11 inline-flex items-center">האתר הראשי</Link>
              <button type="button" onClick={() => setView('profile')} className="hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] rounded min-h-11">חשבון</button>
              <button type="button" onClick={() => setView('history')} className="hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] rounded min-h-11">היסטוריה</button>
              <Link to="/terms" className="hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] rounded min-h-11 inline-flex items-center">תנאי שימוש</Link>
              <Link to="/privacy" className="hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] rounded min-h-11 inline-flex items-center">מדיניות פרטיות</Link>
              <Link to="/accessibility" className="hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] rounded min-h-11 inline-flex items-center">הצהרת נגישות</Link>
            </div>
          </div>
          <p className="max-w-7xl mx-auto mt-4 text-sm text-zinc-600">Infinite Masterpiece © כל הזכויות שמורות.</p>
        </footer>
      )}

      {currentView !== 'watch' && (
        <>
          <OnboardingTriggers />
          <OnboardingUI />
        </>
      )}
    </div>
    </ConfirmProvider>
    </PaywallProvider>
  );
};

export default VodApp;
