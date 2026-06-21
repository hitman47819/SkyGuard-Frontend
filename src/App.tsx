import { useState, useEffect } from 'react';
import Header from './components/Header';
import FeaturesView from './components/FeaturesView';
import TechnologyView from './components/TechnologyView';
import ContactFormView from './components/ContactFormView';
import DashboardView from './components/DashboardView';
import NotFoundView from './components/NotFoundView';
import Footer from './components/Footer';
import LoginView from './LoginView';
import { ActiveTab } from './types';

const ACCESS_TOKEN_STORAGE_KEY = 'skyguard-access-token';
const REFRESH_TOKEN_STORAGE_KEY = 'skyguard-refresh-token';
const SESSION_AUTH_STORAGE_KEY = 'skyguard-authenticated';

const publicTabs: ActiveTab[] = ['features', 'technology', 'contact', 'not-found'];

// ✅ Read token only from localStorage
const getTokenFromStorage = () => {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
};

const validateAccessToken = async (accessToken: string | null) => {
  if (!accessToken) return false;

  try {
    const response = await fetch('/api/Authentication/validate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });

    if (!response.ok) return false;

    const result = await response.json();
    return result?.success === true && result?.data === true;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('features');
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(SESSION_AUTH_STORAGE_KEY) === 'true'
  );
  const [isLoginRoute, setIsLoginRoute] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'active' | 'alert' | 'securing'>('active');

  useEffect(() => {
    let routeCheckId = 0;

    const rejectProtectedRoute = () => {
      localStorage.removeItem(SESSION_AUTH_STORAGE_KEY);
      setIsAuthenticated(false);
      setIsLoginRoute(false);
      setActiveTab('not-found');
      if (window.location.hash !== '#/not-found') {
        window.location.hash = '#/not-found';
      }
    };

    const handleHashChange = async () => {
      const checkId = ++routeCheckId;
      const rawHash = window.location.hash || '#/features';
      const hash = rawHash.split('?')[0];
      const accessToken = getTokenFromStorage();

      const publicRoute = !hash || hash === '#/' || hash === '#/features';
      const publicTab = hash.slice(2) as ActiveTab;

      if (publicRoute || publicTabs.includes(publicTab)) {
        setIsLoginRoute(false);
        setActiveTab(publicRoute ? 'features' : publicTab);

        if (hash !== '#/not-found') {
          const tokenIsValid = await validateAccessToken(accessToken);
          if (checkId === routeCheckId && tokenIsValid) {
            window.location.hash = '#/login';
          }
        }
        return;
      }

      if (hash === '#/login') {
        setIsCheckingAccess(true);
        const tokenIsValid = await validateAccessToken(accessToken);

        if (checkId !== routeCheckId) return;

        setIsCheckingAccess(false);

        if (!tokenIsValid) {
          rejectProtectedRoute();
          return;
        }

        setIsLoginRoute(true);
        return;
      }

      if (hash === '#/dashboard') {
        setIsCheckingAccess(true);
        const tokenIsValid = await validateAccessToken(accessToken);

        if (checkId !== routeCheckId) return;

        setIsCheckingAccess(false);

        if (!tokenIsValid) {
          rejectProtectedRoute();
          return;
        }

        if (localStorage.getItem(SESSION_AUTH_STORAGE_KEY) !== 'true') {
          setIsLoginRoute(true);
          window.location.hash = '#/login';
          return;
        }

        setIsLoginRoute(false);
        setActiveTab('dashboard');
        return;
      }

      setIsLoginRoute(false);
      setActiveTab('not-found');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSetActiveTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.location.hash = `#/${tab}`;
  };

  const handleLogin = (accessToken?: string, refreshToken?: string) => {
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }

    localStorage.setItem(SESSION_AUTH_STORAGE_KEY, 'true');
    setIsAuthenticated(true);
    setIsLoginRoute(false);
    handleSetActiveTab('dashboard');
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  if (isLoginRoute || isCheckingAccess) {
    return (
      <div className="min-h-screen bg-brand-bg text-slate-300 font-sans relative overflow-hidden">
        <div className="relative z-10">
          {isCheckingAccess ? (
            <div className="min-h-screen flex items-center justify-center px-6">
              <div className="border border-indigo-500/20 bg-slate-900/70 px-6 py-4 rounded-sm font-mono text-xs uppercase tracking-widest text-brand-cyan">
                Validating access token...
              </div>
            </div>
          ) : (
            <LoginView onLogin={handleLogin} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-slate-300 flex flex-col font-sans relative overflow-hidden">
      <Header activeTab={activeTab} setActiveTab={handleSetActiveTab} systemStatus={systemStatus} />
      <main className="flex-grow z-10">
        {activeTab === 'features' && <FeaturesView onEnterC2={() => handleSetActiveTab('dashboard')} setActiveTab={handleSetActiveTab} />}
        {activeTab === 'technology' && <TechnologyView onEnterC2={() => handleSetActiveTab('dashboard')} />}
        {activeTab === 'contact' && <ContactFormView />}
        {activeTab === 'dashboard' && <DashboardView setSystemStatus={setSystemStatus} />}
        {activeTab === 'not-found' && <NotFoundView setActiveTab={handleSetActiveTab} />}
      </main>
      <Footer setActiveTab={handleSetActiveTab} />
    </div>
  );
}
