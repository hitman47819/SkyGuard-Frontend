import { useState } from 'react';
import {
  Shield, Radar, Activity, AlertCircle, LayoutDashboard,
  Layers, Users, LogOut, Cpu, Package, Plane,
} from 'lucide-react';
import type { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  systemStatus: 'active' | 'alert' | 'securing';
  user: any | null;
  isPublicMode: boolean;
}

export default function Header({
  activeTab,
  setActiveTab,
  systemStatus,
  user,
  isPublicMode,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const canAccessUsers = user?.userrole === 1 || user?.userrole === 2;

  const handleLogout = () => {
    setActiveTab('features');
  };

  // ── Public navigation items ──
  const publicNavItems: { tab: ActiveTab; label: string; icon: any }[] = [
    { tab: 'features', label: 'Features', icon: Radar },
    { tab: 'technology', label: 'Technology', icon: Activity },
    { tab: 'contact', label: 'Contact', icon: AlertCircle },
  ];

  // ── Internal navigation items ──
  const internalNavItems: { tab: ActiveTab; label: string; icon: any }[] = [
    { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { tab: 'segments', label: 'Segments', icon: Layers },
    { tab: 'detections', label: 'Detections', icon: Radar },
    { tab: 'airesults', label: 'AI Results', icon: Cpu },
    { tab: 'packs', label: 'Packs', icon: Package },
    { tab: 'dronetypes', label: 'Drone Types', icon: Plane },
    ...(canAccessUsers
      ? [{ tab: 'users' as ActiveTab, label: 'Users', icon: Users }]
      : []),
  ];

  const navItems = isPublicMode ? publicNavItems : internalNavItems;

  const navButtonClass = (tab: ActiveTab) =>
    `font-sans text-sm tracking-wide font-medium transition-all cursor-pointer pb-1 border-b-2 bg-transparent flex items-center gap-1.5 ${
      activeTab === tab
        ? 'text-brand-cyan border-brand-cyan font-bold'
        : 'text-on-surface-variant hover:text-brand-accent border-transparent'
    }`;

  return (
    <header className="fixed top-0 w-full z-50 bg-brand-bg/85 border-b border-white/5 backdrop-blur-md">
      <nav className="flex justify-between items-center px-6 lg:px-12 py-4 max-w-[1440px] mx-auto">
        {/* Brand Logo */}
        <button
          onClick={() => setActiveTab('features')}
          className="flex items-center gap-2 text-xl lg:text-2xl font-bold tracking-tighter text-brand-accent hover:opacity-90 transition-opacity cursor-pointer bg-transparent border-none appearance-none"
        >
          <Shield className="w-6 h-6 text-brand-cyan fill-brand-cyan/25" />
          <span className="font-display">SkyGuard</span>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={navButtonClass(item.tab)}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="md:hidden p-2 border border-white/10 text-slate-400 hover:text-brand-cyan rounded-sm"
        >
          {mobileMenuOpen ? (
            <span className="text-xs">Close</span>
          ) : (
            <span className="text-xs">Menu</span>
          )}
        </button>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* System Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 border border-white/10 rounded-full bg-brand-slate/50">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  systemStatus === 'active'
                    ? 'bg-indigo-400'
                    : systemStatus === 'securing'
                    ? 'bg-amber-400'
                    : 'bg-red-500'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  systemStatus === 'active'
                    ? 'bg-indigo-500'
                    : systemStatus === 'securing'
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
              ></span>
            </span>
            <span className="font-mono text-[10px] text-brand-cyan tracking-wider uppercase font-medium">
              C2_STATUS: {systemStatus.toUpperCase()}
            </span>
          </div>

          {/* Internal mode only: User badge + Logout */}
          {!isPublicMode && user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 border border-brand-cyan/20 rounded-full bg-brand-cyan/5">
                <div className="w-5 h-5 rounded-full bg-brand-cyan/20 flex items-center justify-center">
                  <span className="text-[9px] font-mono font-bold text-brand-cyan">
                    {user.userFirstName?.[0]?.toUpperCase()}
                    {user.userLastName?.[0]?.toUpperCase()}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-brand-cyan tracking-wider">
                  {user.userrole === 1
                    ? 'SUPER'
                    : user.userrole === 2
                    ? 'ADMIN'
                    : 'ANALYTICS'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 transition-all font-mono text-[10px] uppercase tracking-wider rounded-sm"
                title="Logout"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 px-6 py-4 space-y-2 bg-brand-bg/95 backdrop-blur-md">
          {navItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => {
                setActiveTab(item.tab);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left font-sans text-sm tracking-wide font-medium transition-all cursor-pointer px-3 py-2 rounded-sm bg-transparent flex items-center gap-2 ${
                activeTab === item.tab
                  ? 'text-brand-cyan bg-brand-cyan/10 font-bold'
                  : 'text-on-surface-variant hover:text-brand-accent hover:bg-white/5'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}

          {!isPublicMode && user && (
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 rounded-sm font-mono text-xs uppercase tracking-wider bg-transparent cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
}