import { useState, useEffect, useRef } from 'react';
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

const ACCESS_TOKEN_KEY = 'skyguard-access-token';
const REFRESH_TOKEN_KEY = 'skyguard-refresh-token';
const SESSION_KEY = 'skyguard-authenticated';

const PUBLIC_TABS: ActiveTab[] = ['features', 'technology', 'contact', 'not-found'];
const PROTECTED_TABS: ActiveTab[] = ['dashboard', 'segments', 'detections', 'airesults', 'packs', 'dronetypes', 'invite'];
const ROLE_RESTRICTED_TABS: { tab: ActiveTab; allowedRoles: number[] }[] = [
  { tab: 'users', allowedRoles: [1, 2] },
];

const AUTO_REDIRECT_PATHS = ['', 'features'];

const validateToken = async (token: string | null): Promise<boolean> => {
  if (!token) return false;
  try {
    const res = await fetch('/api/Authentication/validate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: token }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.success === true && data?.data === true;
  } catch {
    return false;
  }
};

const fetchUser = async (token: string): Promise<any> => {
  try {
    const res = await fetch('/api/Users/me', {
      headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
    });
    if (res.ok) {
      const data = await res.json();
      return data?.data ? data.data : data;
    }
  } catch { /* silent */ }
  return null;
};

type AuthRoute = 'login' | 'accept-invite' | null;

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('features');
  const [authRoute, setAuthRoute] = useState<AuthRoute>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [systemStatus] = useState<'active' | 'alert' | 'securing'>('active');
  const initialPublicCheckDone = useRef(false);

  // Ref for values accessed inside the hashchange closure to avoid stale closures
  const userRef = useRef(user);
  userRef.current = user;

  const hasSession = () => localStorage.getItem(SESSION_KEY) === 'true';

  const navigate = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.location.hash = `#/${tab}`;
  };

  const handleLogin = (accessToken?: string, refreshToken?: string) => {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(SESSION_KEY, 'true');
    setAuthRoute(null);
    navigate('dashboard');

    const token = accessToken || localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      fetchUser(token).then((u) => setUser(u));
    }
  };

  // Fetch user data on mount if already authenticated
  useEffect(() => {
    if (hasSession()) {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        fetchUser(token).then((u) => setUser(u));
      }
    }
  }, []);

  useEffect(() => {
    let checkId = 0;

    const reject = () => {
      setAuthRoute(null);
      setActiveTab('not-found');
      window.location.hash = '#/not-found';
    };

    const handleHashChange = async () => {
      const id = ++checkId;
      let rawHash = window.location.hash || '#/';
      if (rawHash === '#' || rawHash === '') rawHash = '#/';
      const path = rawHash.split('?')[0].slice(2);
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      const sessionValid = hasSession();
      const currentUser = userRef.current;

      // ── 1. Accept invite — always accessible ──
      if (path === 'accept-invite') {
        if (id !== checkId) return;
        setAuthRoute('accept-invite');
        return;
      }

      // ── 2. Login page — requires valid token ──
      if (path === 'login') {
        setIsChecking(true);
        const valid = await validateToken(token);
        if (id !== checkId) return;
        setIsChecking(false);

        if (!valid) {
          reject();
          return;
        }

        // Already logged in → dashboard
        if (sessionValid) {
          navigate('dashboard');
          return;
        }

        setAuthRoute('login');
        return;
      }

      // ── 3. Public routes ──
      const isPublic =
        PUBLIC_TABS.includes(path as ActiveTab) ||
        rawHash === '#/';

      if (isPublic) {
        // Auto-redirect only on initial load, specific paths, no session
        if (
          !initialPublicCheckDone.current &&
          !sessionValid &&
          AUTO_REDIRECT_PATHS.includes(path)
        ) {
          initialPublicCheckDone.current = true;
          if (token) {
            setIsChecking(true);
            const valid = await validateToken(token);
            if (id !== checkId) return;
            setIsChecking(false);

            if (valid) {
              navigate('login');
              return;
            }
          }
        }

        setAuthRoute(null);
        setActiveTab((path || 'features') as ActiveTab);
        return;
      }

      // ── 4. Protected / role-restricted routes ──
      const isProtected = PROTECTED_TABS.includes(path as ActiveTab);
      const roleRestriction = ROLE_RESTRICTED_TABS.find(
        (r) => r.tab === path,
      );

      if (isProtected || roleRestriction) {
        if (!sessionValid) {
          // No session — try sending to login if token is structurally valid
          if (token) {
            setIsChecking(true);
            const valid = await validateToken(token);
            if (id !== checkId) return;
            setIsChecking(false);

            if (valid) {
              navigate('login');
              return;
            }
          }
          reject();
          return;
        }

        // Fetch user inline if needed for role checks
        if (!currentUser && roleRestriction) {
          if (token) {
            const fetched = await fetchUser(token);
            if (id !== checkId) return;
            if (fetched) {
              setUser(fetched);
              userRef.current = fetched;
            }
          }
        }

        const userNow = userRef.current;
        if (
          roleRestriction &&
          userNow?.userrole != null &&
          !roleRestriction.allowedRoles.includes(userNow.userrole)
        ) {
          reject();
          return;
        }

        setAuthRoute(null);
        setActiveTab(path as ActiveTab);
        return;
      }

      // ── 5. Fallback 404 ──
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

  const isPublicMode = ['features', 'technology', 'contact', 'not-found'].includes(
    activeTab,
  );

  if (authRoute || isChecking) {
    return (
      <div className="min-h-screen bg-brand-bg text-slate-300 font-sans relative overflow-hidden">
        <div className="relative z-10">
          {isChecking ? (
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
    <div className="min-h-screen bg-brand-bg text-slate-300 flex flex-col font-sans relative overflow-x-hidden">
      <Header
        activeTab={activeTab}
        setActiveTab={navigate}
        systemStatus={systemStatus}
        user={user}
        isPublicMode={isPublicMode}
      />
      <main className="flex-grow z-10">
        {activeTab === 'features' && (
          <FeaturesView
            onEnterC2={() => navigate('dashboard')}
            setActiveTab={navigate}
          />
        )}
        {activeTab === 'technology' && (
          <TechnologyView onEnterC2={() => navigate('dashboard')} />
        )}
        {activeTab === 'contact' && <ContactFormView />}

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
              <InviteUserPage
                userRole={user?.userrole ?? 3}
                onInviteSent={() => {}}
              />
            </div>
          </div>
        )}

        {activeTab === 'not-found' && (
          <NotFoundView setActiveTab={navigate} />
        )}
      </main>
      <Footer setActiveTab={navigate} />
    </div>
  );
}