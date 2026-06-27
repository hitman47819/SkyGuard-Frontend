import { useState, useEffect } from 'react';
import Header from './components/Header';
import FeaturesView from './components/FeaturesView';
import TechnologyView from './components/TechnologyView';
import ContactFormView from './components/ContactFormView';
import DashboardView from './components/DashboardView';
import SegmentsPage from './components/SegmentsPage';
import UsersPage from './components/UsersPage';
import InviteUserPage from './components/InviteUserPage';
import NotFoundView from './components/NotFoundView';
import Footer from './components/Footer';
import LoginView from './components/LoginView';
import AcceptInvitePage from './components/AcceptInvitePage';
import type { ActiveTab } from './types';

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

const fetchUserRole = async (): Promise<number | null> => {
  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (!token) return null;
  try {
    const res = await fetch('/api/Users/me', {
      headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
    });
    if (res.ok) {
      const data = await res.json();
      return data.userrole;
    }
  } catch { /* silent */ }
  return null;
};

type AuthRoute = 'login' | 'accept-invite' | null;

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('features');
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(SESSION_AUTH_STORAGE_KEY) === 'true'
  );
  const [authRoute, setAuthRoute] = useState<AuthRoute>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [systemStatus] = useState<'active' | 'alert' | 'securing'>('active');
  const [userRole, setUserRole] = useState<number | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (isAuthenticated) {
        const role = await fetchUserRole();
        setUserRole(role);
      }
    };
    fetchRole();
  }, [isAuthenticated]);

  useEffect(() => {
    let routeCheckId = 0;

    const rejectProtectedRoute = () => {
      localStorage.removeItem(SESSION_AUTH_STORAGE_KEY);
      setIsAuthenticated(false);
      setAuthRoute(null);
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

      // Public routes
      if (publicRoute || publicTabs.includes(publicTab)) {
        setAuthRoute(null);
        setActiveTab(publicRoute ? 'features' : publicTab);

        if (hash !== '#/not-found') {
          const tokenIsValid = await validateAccessToken(accessToken);
          if (checkId === routeCheckId && tokenIsValid) {
            // Token valid on public page - they can access dashboard
          }
        }
        return;
      }

      // Accept invite
      if (hash === '#/accept-invite') {
        setAuthRoute('accept-invite');
        return;
      }

      // Login
      if (hash === '#/login') {
        setIsCheckingAccess(true);
        const tokenIsValid = await validateAccessToken(accessToken);

        if (checkId !== routeCheckId) return;

        setIsCheckingAccess(false);

        if (!tokenIsValid) {
          rejectProtectedRoute();
          return;
        }

        setAuthRoute('login');
        return;
      }

      // Protected dashboard routes
      if (hash === '#/dashboard' || hash === '#/segments' || hash === '#/invite') {
        setIsCheckingAccess(true);
        const tokenIsValid = await validateAccessToken(accessToken);

        if (checkId !== routeCheckId) return;

        setIsCheckingAccess(false);

        if (!tokenIsValid) {
          rejectProtectedRoute();
          return;
        }

        if (localStorage.getItem(SESSION_AUTH_STORAGE_KEY) !== 'true') {
          setAuthRoute('login');
          window.location.hash = '#/login';
          return;
        }

        const role = await fetchUserRole();
        setUserRole(role);

        setAuthRoute(null);
        setActiveTab(hash.slice(2) as ActiveTab);
        return;
      }

      // Users page - Super and Admin only
      if (hash === '#/users') {
        setIsCheckingAccess(true);
        const tokenIsValid = await validateAccessToken(accessToken);

        if (checkId !== routeCheckId) return;

        setIsCheckingAccess(false);

        if (!tokenIsValid) {
          rejectProtectedRoute();
          return;
        }

        if (localStorage.getItem(SESSION_AUTH_STORAGE_KEY) !== 'true') {
          setAuthRoute('login');
          window.location.hash = '#/login';
          return;
        }

        const role = await fetchUserRole();
        setUserRole(role);

        // Only Super (1) and Admin (2) can access users page
        if (role !== 1 && role !== 2) {
          rejectProtectedRoute();
          return;
        }

        setAuthRoute(null);
        setActiveTab('users');
        return;
      }

      setAuthRoute(null);
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
    setAuthRoute(null);
    handleSetActiveTab('dashboard');
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  if (authRoute || isCheckingAccess) {
    return (
      <div className="min-h-screen bg-brand-bg text-slate-300 font-sans relative overflow-hidden">
        <div className="relative z-10">
          {isCheckingAccess ? (
            <div className="min-h-screen flex items-center justify-center px-6">
              <div className="border border-indigo-500/20 bg-slate-900/70 px-6 py-4 rounded-sm font-mono text-xs uppercase tracking-widest text-brand-cyan">
                Validating access token...
              </div>
            </div>
          ) : authRoute === 'login' ? (
            <LoginView onLogin={handleLogin} />
          ) : authRoute === 'accept-invite' ? (
            <AcceptInvitePage onSuccess={handleLogin} />
          ) : null}
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
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'segments' && <SegmentsPage />}
        {activeTab === 'users' && <UsersPage />}
        {activeTab === 'invite' && (
          <div className="w-full relative py-20 min-h-[95vh]">
            <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>
            <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16 relative z-10">
              <InviteUserPage userRole={userRole ?? 3} onInviteSent={() => {}} />
            </div>
          </div>
        )}
        {activeTab === 'not-found' && <NotFoundView setActiveTab={handleSetActiveTab} />}
      </main>
      <Footer setActiveTab={handleSetActiveTab} />
    </div>
  );
}
