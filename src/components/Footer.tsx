import { Share2, Mail, Shield } from 'lucide-react';
import { ActiveTab } from '../types';

interface FooterProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export default function Footer({ setActiveTab }: FooterProps) {
  const handleShare = () => {
    // Generate simple share toast alert or fallback
    navigator.clipboard.writeText(window.location.href);
    alert("Tactical URL copied to clipboard for direct coordination sharing!");
  };

  return (
    <footer className="w-full mt-12 bg-brand-container-lowest border-t border-white/5 relative z-40 bg-brand-bg">
      <div className="flex flex-col md:flex-row justify-between items-center px-6 lg:px-12 py-10 max-w-[1440px] mx-auto gap-6">
        
        {/* Logo and Copyright left */}
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
          <button 
            onClick={() => setActiveTab('features')}
            className="text-lg font-bold text-brand-cyan flex items-center gap-2 cursor-pointer bg-transparent border-none appearance-none"
          >
            <Shield className="w-5 h-5 text-brand-cyan fill-brand-cyan/25" />
            SkyGuard
          </button>
          <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest leading-loose">
            © 2026 SkyGuard Defense Systems. All rights reserved.
          </p>
        </div>

        {/* Global policies directory links */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
          <a href="#" className="font-mono text-[10px] text-on-surface-variant hover:text-brand-cyan underline decoration-brand-cyan/35 underline-offset-4 transition-all">
            Privacy Policy
          </a>
          <a href="#" className="font-mono text-[10px] text-on-surface-variant hover:text-brand-cyan underline decoration-brand-cyan/35 underline-offset-4 transition-all">
            Terms of Service
          </a>
          <a href="#" className="font-mono text-[10px] text-on-surface-variant hover:text-brand-cyan underline decoration-brand-cyan/35 underline-offset-4 transition-all">
            Security Architecture
          </a>
          <button
            onClick={() => setActiveTab('not-found')} 
            className="font-mono text-[10px] text-rose-400 hover:text-rose-300 underline decoration-rose-500/35 underline-offset-4 transition-all cursor-pointer bg-transparent border-none"
          >
            Simulate 404
          </button>
        </div>

        {/* Action icons right */}
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            title="Share system portal URL"
            className="w-10 h-10 flex items-center justify-center border border-white/10 text-on-surface-variant hover:border-brand-cyan/45 hover:text-brand-cyan transition-all cursor-pointer bg-transparent rounded-sm"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            title="Contact secure response support line"
            className="w-10 h-10 flex items-center justify-center border border-white/10 text-on-surface-variant hover:border-brand-cyan/45 hover:text-brand-cyan transition-all cursor-pointer bg-transparent rounded-sm"
          >
            <Mail className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
