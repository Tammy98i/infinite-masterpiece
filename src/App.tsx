import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './marketing/components/Layout';
import { Home } from './marketing/pages/Home';
import { Premium88 } from './marketing/pages/Premium88';
import { FounderPage } from './marketing/pages/FounderPage';
import { FAQPage } from './marketing/pages/FAQPage';
import { Application } from './marketing/pages/Application';
import { ApplicationThankYou } from './marketing/pages/ApplicationThankYou';
import { Terms } from './marketing/pages/Terms';
import { Privacy } from './marketing/pages/Privacy';
import { Checkout } from './marketing/pages/Checkout';
import { Hesitation } from './marketing/pages/Hesitation';
import { HesitationSuccess } from './marketing/pages/HesitationSuccess';
import { Pricing } from './marketing/pages/Pricing';
import { Journey } from './marketing/pages/Journey';
import { BridgeShell } from './components/BridgeShell';
import { QuietBoot } from './components/QuietBoot';
import { UserProvider } from './context/UserContext';
import { AuthModal } from './components/AuthModal';
import { captureReferralFromSearch } from './utils/referral';
import { captureUtmFromSearch } from './utils/utm';
import { A11yWidget } from './a11y/A11yWidget';
import { MotionA11yProvider } from './a11y/MotionA11yProvider';
import { AccessibilityStatement } from './marketing/pages/AccessibilityStatement';
import { LibraryMembership } from './marketing/pages/LibraryMembership';
import { WebinarLanding } from './marketing/pages/WebinarLanding';
import { WebinarThankYou } from './marketing/pages/WebinarThankYou';
import { AuthCallback } from './marketing/pages/AuthCallback';
import { OAuthConsent } from './marketing/pages/OAuthConsent';

const PublicLayoutWrapper = () => {
  const location = useLocation();
  return (
    <Layout>
      <div key={location.pathname} className="page-fade">
        <Outlet />
      </div>
    </Layout>
  );
};

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    captureReferralFromSearch(location.search);
    captureUtmFromSearch(location.search);
  }, [location.search]);

  useEffect(() => {
    if (location.hash) {
      const rawId = location.hash.replace('#', '');
      const aliases: Record<string, string> = {
        'webinar-register-hero': 'webinar-register',
        'about-creation': 'hosts',
        pilot: 'tracks',
      };
      const id = aliases[rawId] || rawId;
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth' });
      }, 80);
      return () => window.clearTimeout(timer);
    }
    if (location.pathname.startsWith('/library')) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  return null;
}

function prefersReduced() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('a11y-reduce-motion')
  );
}

function LibraryFallback() {
  return <BridgeShell />;
}

const VodShell = lazy(async () => {
  const [{ AppProvider }, { ToastProvider }, { OnboardingProvider }, vod] = await Promise.all([
    import('./context/AppContext'),
    import('./context/ToastContext'),
    import('./context/OnboardingContext'),
    import('./VodApp'),
  ]);

  const VodApp = vod.default;

  function LibraryApp() {
    return (
      <AppProvider>
        <ToastProvider>
          <OnboardingProvider>
            <VodApp />
          </OnboardingProvider>
        </ToastProvider>
      </AppProvider>
    );
  }

  return { default: LibraryApp };
});

function LibraryRoute() {
  return (
    <Suspense fallback={<LibraryFallback />}>
      <VodShell />
    </Suspense>
  );
}

export default function App() {
  return (
    <UserProvider>
    <BrowserRouter>
      <MotionA11yProvider>
      <QuietBoot />
      <ScrollManager />
      <AuthModal />
      <A11yWidget />
      <Routes>
        <Route element={<PublicLayoutWrapper />}>
          <Route path="/" element={<Home />} />
          <Route path="/journey" element={<Journey />} />
          <Route path="/premium-88" element={<Premium88 />} />
          <Route path="/premium-88/:founderId" element={<FounderPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/application" element={<Application />} />
          <Route path="/thank-you-application" element={<ApplicationThankYou />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/accessibility" element={<AccessibilityStatement />} />
          <Route path="/library-membership" element={<LibraryMembership />} />
          <Route path="/webinar" element={<WebinarLanding />} />
          <Route path="/webinar/thank-you" element={<WebinarThankYou />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/oauth/consent" element={<OAuthConsent />} />
          <Route path="/hesitation" element={<Hesitation />} />
          <Route path="/hesitation-success" element={<HesitationSuccess />} />
        </Route>

        <Route path="/library/*" element={<LibraryRoute />} />
        <Route path="/login" element={<Navigate to="/library" replace />} />
        <Route path="/dashboard" element={<Navigate to="/library" replace />} />
      </Routes>
      </MotionA11yProvider>
    </BrowserRouter>
    </UserProvider>
  );
}
