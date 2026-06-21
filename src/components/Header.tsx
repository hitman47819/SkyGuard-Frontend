// Provide minimal JSX/runtime declarations to satisfy TypeScript in environments
// where @types/react or react/jsx-runtime types are not installed.
declare global {
  namespace JSX {
    // allow any intrinsic element to avoid JSX.IntrinsicElements missing errors
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

import { Shield, Radio, Activity, AlertCircle } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  systemStatus: 'active' | 'alert' | 'securing';
}

export default function Header({ activeTab, setActiveTab, systemStatus }: HeaderProps) {
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

        {/* Central Navigation Links */}
        <div className="hidden md:flex items-center gap-10">
          <button
            onClick={() => setActiveTab('features')}
            className={`font-sans text-sm tracking-wide font-medium transition-all cursor-pointer pb-1 border-b-2 bg-transparent ${
              activeTab === 'features'
                ? 'text-brand-cyan border-brand-cyan font-bold'
                : 'text-on-surface-variant hover:text-brand-accent border-transparent'
            }`}
          >
            Features
          </button>
          <button
            onClick={() => setActiveTab('technology')}
            className={`font-sans text-sm tracking-wide font-medium transition-all cursor-pointer pb-1 border-b-2 bg-transparent ${
              activeTab === 'technology'
                ? 'text-brand-cyan border-brand-cyan font-bold'
                : 'text-on-surface-variant hover:text-brand-accent border-transparent'
            }`}
          >
            Technology
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`font-sans text-sm tracking-wide font-medium transition-all cursor-pointer pb-1 border-b-2 bg-transparent ${
              activeTab === 'contact'
                ? 'text-brand-cyan border-brand-cyan font-bold'
                : 'text-on-surface-variant hover:text-brand-accent border-transparent'
            }`}
          >
            Contact
          </button>
        </div>

        {/* System Status Indicators and CTA */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 border border-white/10 rounded-full bg-brand-slate/50">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                systemStatus === 'active' ? 'bg-indigo-400' : systemStatus === 'securing' ? 'bg-amber-400' : 'bg-red-500'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                systemStatus === 'active' ? 'bg-indigo-500' : systemStatus === 'securing' ? 'bg-amber-500' : 'bg-red-500'
              }`}></span>
            </span>
            <span className="font-mono text-[10px] text-brand-cyan tracking-wider uppercase font-medium">
              C2_STATUS: {systemStatus.toUpperCase()}
            </span>
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-2 font-mono text-xs uppercase tracking-widest font-bold transition-all border rounded-sm cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-brand-cyan text-brand-bg border-brand-cyan hover:bg-brand-cyan-light shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                : 'bg-transparent text-brand-cyan border-brand-cyan/40 hover:bg-brand-cyan/10 hover:border-brand-cyan'
            }`}
          >
            C2 Operations
          </button>
        </div>
      </nav>
    </header>
  );
}
