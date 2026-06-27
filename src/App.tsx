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
import DetectionsPage from './components/DetectionsPage';
import AIResultsPage from './components/AIResultsPage';
import PacksPage from './components/PacksPage';
import DroneTypesPage from './components/DroneTypesPage';
import type { ActiveTab } from './types';

const ACCESS_TOKEN_STORAGE_KEY = 'skyguard-access-token';
const REFRESH_TOKEN_STORAGE_KEY = 'skyguard-refresh-token';
const SESSION_AUTH_STORAGE_KEY = 'skyguard-authenticated';

// --- Route Configuration ---
const PUBLIC_TABS: ActiveTab[] = ['features', 'technology', 'contact', 'not-found'];

// Define routes that require authentication
const PROTECTED_TABS: ActiveTab[] = [
  'dashboard',
  'segments',
  'detections',
  'airesults',
  'packs',
  'dronetypes',
  'invite'
];

// Define routes that require specific roles (1 = Super, 2 = Admin)
const ROLE_RESTRICTED_TABS: { tab: ActiveTab; allowedRoles: number[] }[] = [
  { tab: 'users', allowedRoles: [1, 2] }
];

const getTokenFromStorage = () => localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

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
  const [authRoute, setAuthRoute] = useState<AuthRoute>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [systemStatus] = useState<'active' | 'alert' | 'securing'>('active');
  const [userRole, setUserRole] = useState<number | null>(null);

  const handleSetActiveTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.location.hash = `#/${tab}`;
  };

  const handleLogin = (accessToken?: string, refreshToken?: string) => {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);

    localStorage.setItem(SESSION_AUTH_STORAGE_KEY, 'true');
    setAuthRoute(null);
    handleSetActiveTab('dashboard');
  };

  useEffect(() => {
    let routeCheckId = 0;

    const rejectProtectedRoute = () => {
      localStorage.removeItem(SESSION_AUTH_STORAGE_KEY);
      setAuthRoute(null);
      setActiveTab('not-found');
      if (window.location.hash !== '#/not-found') {
        window.location.hash = '#/not-found';
      }
    };

    const handleHashChange = async () => {
      const checkId = ++routeCheckId;
      const rawHash = window.location.hash || '#/features';
      const hashPath = rawHash.split('?')[0].slice(2) as ActiveTab; // Remove '#/'
      const accessToken = getTokenFromStorage();

      // 1. Handle Auth Routes (Login / Accept Invite)
      if (hashPath === 'login' || hashPath === 'accept-invite') {
        if (hashPath === 'accept-invite') {
          setAuthRoute('accept-invite');
          return;
        }

        // Login route logic
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
          return;
        }

        // Already logged in, send to dashboard
        handleSetActiveTab('dashboard');
        return;
      }

      // 2. Handle Public Routes
      if (PUBLIC_TABS.includes(hashPath) || rawHash === '#/' || rawHash === '') {
        setAuthRoute(null);
        setActiveTab(hashPath || 'features');
        return;
      }

      // 3. Handle Protected Routes (Dashboard, Segments, Detections, etc.)
      const isProtectedRoute = PROTECTED_TABS.includes(hashPath);
      const roleRestriction = ROLE_RESTRICTED_TABS.find(r => r.tab === hashPath);
      
      if (isProtectedRoute || roleRestriction) {
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
        if (checkId !== routeCheckId) return;
        setUserRole(role);

        // Check role restrictions (e.g., Users page)
        if (roleRestriction && role && !roleRestriction.allowedRoles.includes(role)) {
          rejectProtectedRoute();
          return;
        }

        setAuthRoute(null);
        setActiveTab(hashPath);
        return;
      }

      // 4. Fallback to 404
      setAuthRoute(null);
      setActiveTab('not-found');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
        
        {/* Protected Routes */}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'segments' && <SegmentsPage />}
        {activeTab === 'users' && <UsersPage />}
        {activeTab === 'detections' && <DetectionsPage />}
        {activeTab === 'airesults' && <AIResultsPage />}
        {activeTab === 'packs' && <PacksPage />}
        {activeTab === 'dronetypes' && <DroneTypesPage />}
        
        {activeTab === 'invite' && (
          <div className="w-full relative py-20 min-h-[95vh]">
            <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>
            <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16 relative z-10">
              <InviteUserPage userRole={userRole ?? 3} onInviteSent={() => {}} />
            </div>
          </div>
        )}
        
        {/* 404 Fallback */}
        {activeTab === 'not-found' && <NotFoundView setActiveTab={handleSetActiveTab} />}
      </main>
      <Footer setActiveTab={handleSetActiveTab} />
    </div>
  );
}