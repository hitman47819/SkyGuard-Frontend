import { useState, useEffect } from 'react';
import { ShieldAlert, Terminal, ArrowLeft, RefreshCw } from 'lucide-react';
import type { ActiveTab } from '../types';

interface NotFoundViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export default function NotFoundView({ setActiveTab }: NotFoundViewProps) {
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'INITIATING ROUTE SWEEP...',
    'RESOLVING RESOLUTION TARGETS...',
    'CRITICAL: ACCESS TO PRIVATE NODE REFUSED OR UNRESOLVED.',
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Generate a random dynamic terminal log simulation
  useEffect(() => {
    const errorMessages = [
      'ERR_SECTOR_NOT_FOUND: Sector 404 coordinates unknown.',
      'WARNING: Airspace coordinates outside passive radar range.',
      'Cils Node Daemon: Beacon search timed out at 3000ms.',
      'SIGNAL INTEGRITY: 0.00% [LOST]',
      'ALERT: Decryption failure on virtual path proxy coordinate loop.'
    ];

    const timer = setInterval(() => {
      const idx = Math.floor(Math.random() * errorMessages.length);
      setTerminalLogs(prev => [
        ...prev.slice(-4),
        `[${new Date().toLocaleTimeString()}] ${errorMessages[idx]}`
      ]);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const handleScanSector = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] INITIATING FULL THEATER SCAN ZONE DEVIATION [A-404]...`]);

    const interval = setInterval(() => {
      setScanProgress(curr => {
        if (curr >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setTerminalLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] SCAN DIRECTORY COMPLETED: 0 TARGETS ACQUIRED AT SITE [A-404].`,
            `[${new Date().toLocaleTimeString()}] RECOMMENDATION: CALIBRATE COORDINATES & RETURN TO MAIN PERIMETER.`
          ]);
          return 100;
        }
        return curr + 20;
      });
    }, 300);
  };

  return (
    <div className="w-full relative py-20 min-h-[90vh] flex flex-col justify-center items-center">
      <div className="absolute inset-0 cyber-grid opacity-25 pointer-events-none"></div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 w-full flex flex-col items-center justify-center relative z-10 text-center space-y-8 mt-12">
        {/* Holographic Glowing 404 Shield */}
        <div className="relative flex items-center justify-center w-40 h-40">
          {/* Animated Ambient Pulsating Rings */}
          <div className="absolute inset-0 border border-purple-500/10 rounded-full animate-pulse scale-150"></div>
          <div className="absolute inset-4 border border-indigo-500/20 rounded-full animate-ping"></div>
          <div className="absolute inset-8 border border-purple-500/30 rounded-full"></div>
          
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-b from-indigo-950/85 to-purple-950/30 border border-indigo-500/40 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <ShieldAlert className="w-12 h-12 text-[#A855F7] animate-pulse" />
          </div>
        </div>

        {/* Hero Alert Information */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-purple-500/30 bg-purple-500/5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span className="font-mono text-[9px] tracking-widest text-[#A855F7] uppercase font-bold">
              ERR_COORDINATES_LOST // INDEX 404
            </span>
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight">
            Restricted <span className="text-[#A855F7]">Airspace</span>
          </h1>
          <p className="font-sans text-on-surface-variant text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            The telemetry coordinate path you tried to access does not exist on this SkyGuard beacon network. It might have been relocated or terminated by airspace defense commands.
          </p>
        </div>

        {/* Cyber Command Log Diagnostic console */}
        <div className="w-full max-w-lg bg-black/60 border border-white/5 hud-border rounded-sm overflow-hidden text-left shadow-[0_0_20px_rgba(168,85,247,0.04)]">
          {/* Bar top control */}
          <div className="bg-[#111115] border-b border-white/5 py-2.5 px-4 flex justify-between items-center text-[10px] font-mono text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></span>
              <span className="ml-1 tracking-wider uppercase font-bold text-slate-400">Tactical_Shell.exe</span>
            </div>
            <span className="font-bold flex items-center gap-1 text-purple-400 animate-pulse">
              <Terminal className="w-3.5 h-3.5" />
              STATUS: ERR_404
            </span>
          </div>

          {/* Logs scrollable output */}
          <div className="p-4 font-mono text-[10px] text-slate-300 space-y-2 h-44 overflow-y-auto leading-relaxed">
            {terminalLogs.map((log, idx) => (
              <p 
                key={idx} 
                className={`${
                  log.includes('CRITICAL') || log.includes('ERR_') || log.includes('LOST')
                    ? 'text-rose-400 font-bold' 
                    : log.includes('INITIATING') || log.includes('SCAN') 
                      ? 'text-[#A855F7]' 
                      : 'text-slate-400'
                }`}
              >
                &gt; {log}
              </p>
            ))}

            {isScanning && (
              <div className="space-y-1 py-1 text-[#A855F7] font-bold">
                <p>&gt; RUNNING RADAR SWEEP RESOLVER: {scanProgress}%</p>
                <div className="w-full bg-slate-900 border border-[#A855F7]/30 h-1.5 rounded-md overflow-hidden max-w-xs">
                  <div className="bg-[#A855F7] h-full transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Tactical controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md pt-4">
          <button
            onClick={() => setActiveTab('features')}
            className="w-full sm:w-auto bg-[#6366F1] hover:bg-[#818CF8] text-white font-sans px-8 py-3.5 font-bold tracking-wider text-xs uppercase transition-all duration-300 flex items-center justify-center gap-2 border border-[#6366F1] cursor-pointer rounded-sm shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Command Center
          </button>
          <button
            onClick={handleScanSector}
            disabled={isScanning}
            className={`w-full sm:w-auto border border-purple-500/40 hover:border-purple-400 text-purple-400 font-sans px-8 py-3.5 font-bold tracking-wider text-xs uppercase transition-all duration-300 flex items-center justify-center gap-2 rounded-sm ${
              isScanning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500/5 cursor-pointer'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            Scan Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
