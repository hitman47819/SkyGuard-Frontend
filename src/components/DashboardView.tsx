import { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, AlertCircle, ShieldAlert, Zap, Compass, RefreshCw, 
  Trash2, Radio, Play, Pause, Database, Layers, Swords, Info
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { DroneTarget, SystemLog, RFBandInfo } from '../types';

interface DashboardViewProps {
  setSystemStatus: (status: 'active' | 'alert' | 'securing') => void;
}

const INITIAL_TARGETS: DroneTarget[] = [
  {
    id: "SG-A45",
    name: "DJI Inspire 3 Pro",
    azimuth: 240.5,
    elevation: 15.2,
    range: 3.4,
    signalStrength: 98.2,
    speed: 82,
    altitude: 1240,
    status: 'tracking',
    threatLevel: 'high',
    classification: 'Commercial Surveillance'
  },
  {
    id: "MX-700",
    name: "Autel Evo Max 4T",
    azimuth: 114.2,
    elevation: 8.4,
    range: 4.8,
    signalStrength: 76.5,
    speed: 65,
    altitude: 830,
    status: 'tracking',
    threatLevel: 'medium',
    classification: 'Unidentified UAV'
  },
  {
    id: "TR-55",
    name: "Abyss Swarm Node-01",
    azimuth: 45.1,
    elevation: 24.3,
    range: 1.8,
    signalStrength: 91.0,
    speed: 110,
    altitude: 450,
    status: 'tracking',
    threatLevel: 'high',
    classification: 'Swarm Intruder'
  }
];

const INITIAL_BANDS: RFBandInfo[] = [
  { name: '2.4 GHz ISM', frequency: '2.41 - 2.48', signalStrength: 82, status: 'active', load: 68 },
  { name: '5.8 GHz ISM', frequency: '5.72 - 5.85', signalStrength: 91, status: 'alert', load: 85 },
  { name: '1.2 GHz GPS L2', frequency: '1.22 - 1.25', signalStrength: 24, status: 'scanning', load: 12 },
  { name: '915 MHz telemetry', frequency: '0.90 - 0.92', signalStrength: 45, status: 'scanning', load: 30 }
];

export default function DashboardView({ setSystemStatus }: DashboardViewProps) {
  const [targets, setTargets] = useState<DroneTarget[]>(INITIAL_TARGETS);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("SG-A45");
  const [bands, setBands] = useState<RFBandInfo[]>(INITIAL_BANDS);
  const [logs, setLogs] = useState<SystemLog[]>([
    { id: '1', timestamp: '16:52:10', module: 'C2_SYSTEM', message: 'SkyGuard Active air surveillance initialized.', type: 'info' },
    { id: '2', timestamp: '16:53:01', module: 'SPECTRUM', message: 'Heavy RF emissions scanned on channel 5.82GHz.', type: 'alert' },
    { id: '3', timestamp: '16:53:15', module: 'TRIANGULATION', message: 'Target locked [SG-A45] at azimuth 240.5°.', type: 'warning' },
    { id: '4', timestamp: '16:53:40', module: 'OPTICAL', message: 'Auto-slewing EO/IR camera. Bounding box secured on [SG-A45].', type: 'info' }
  ]);
  const [logFilter, setLogFilter] = useState<'all' | 'alert' | 'actions'>('all');
  const [radarSweepAngle, setRadarSweepAngle] = useState(0);
  const [interference, setInterference] = useState(15); // slider
  const [jammingPower, setJammingPower] = useState(0); // slider
  const [isJammingActive, setIsJammingActive] = useState(false);
  const [cameraMovement, setCameraMovement] = useState({ x: 40, y: 35 });
  const [chartData, setChartData] = useState<{ time: string; signal: number; interference: number }[]>([
    { time: '16:50', signal: 80, interference: 10 },
    { time: '16:51', signal: 85, interference: 12 },
    { time: '16:52', signal: 92, interference: 15 },
    { time: '16:53', signal: 98, interference: 16 }
  ]);

  // Current selected drone
  const activeTarget = targets.find(t => t.id === selectedTargetId) || targets[0];

  // Radar sweep animation + live telemetry simulation update
  useEffect(() => {
    const interval = setInterval(() => {
      // Rotate radar sweep
      setRadarSweepAngle(prev => (prev + 4) % 360);

      // Mutate coordinates slightly for high-fidelity real-time feel
      setTargets(prevTargets => 
        prevTargets.map(t => {
          if (t.status === 'tracking') {
            const rangeMutation = (Math.random() - 0.5) * 0.04;
            const azMutation = (Math.random() - 0.5) * 0.2;
            const altMutation = Math.floor((Math.random() - 0.5) * 4);
            const signalFluctuation = (Math.random() - 0.5) * 1.5;
            
            return {
              ...t,
              range: Math.max(0.1, +(t.range + rangeMutation).toFixed(2)),
              azimuth: +(t.azimuth + azMutation).toFixed(1),
              altitude: t.altitude + altMutation,
              signalStrength: Math.min(100, Math.max(0, +(t.signalStrength + signalFluctuation).toFixed(1)))
            };
          }
          return t;
        })
      );

      // Random jitter on optical camera view bounding box
      setCameraMovement(prev => ({
        x: Math.max(10, Math.min(90, prev.x + (Math.random() - 0.5) * 2)),
        y: Math.max(10, Math.min(90, prev.y + (Math.random() - 0.5) * 2))
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Update Recharts live signal timeline
  useEffect(() => {
    const chartInterval = setInterval(() => {
      setChartData(prev => {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        const activeSignal = activeTarget ? activeTarget.signalStrength : 70;
        
        const nextData = [...prev.slice(-9), {
          time: timeStr,
          signal: isJammingActive ? Math.max(5, activeSignal - jammingPower) : activeSignal,
          interference: interference
        }];
        return nextData;
      });
    }, 3000);

    return () => clearInterval(chartInterval);
  }, [activeTarget, interference, jammingPower, isJammingActive]);

  // Command logs handler
  const addLog = (message: string, module: SystemLog['module'], type: SystemLog['type'] = 'info') => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newLog: SystemLog = {
      id: String(Date.now()),
      timestamp: timeStr,
      module,
      message,
      type
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Intercept command (Deploy Jammer)
  const handleDeployJammer = () => {
    if (!activeTarget) return;

    if (activeTarget.status === 'intercepted') {
      addLog(`[SYSTEM] Target [${activeTarget.id}] is already successfully jammed.`, 'C2_SYSTEM', 'info');
      return;
    }

    setIsJammingActive(true);
    setJammingPower(90);
    setSystemStatus('securing');

    addLog(`INITIALIZED PASSIVE S-BAND JAMMING ARRAY TARGETING [${activeTarget.id}]`, 'COUNTER', 'warning');
    addLog(`EMITTING DECONSTRUCTIVE MULTI-PATH SIGNALS...`, 'SPECTRUM', 'info');

    setTimeout(() => {
      setTargets(prev => 
        prev.map(t => t.id === activeTarget.id ? { ...t, status: 'intercepted', signalStrength: 4.8 } : t)
      );
      addLog(`DRONE SIGNAL RECEPTION DISRUPTED. [${activeTarget.id}] FALLING TO ZERO COORDINATES`, 'COUNTER', 'success');
      setSystemStatus('active');
    }, 2000);
  };

  // Slew Cameras (Confirm Lock)
  const handleSlewCamera = () => {
    if (!activeTarget) return;
    addLog(`OPTICAL FEED FOCUS-ALIGNED AT AZIMUTH: ${activeTarget.azimuth}°, ELEVATION: ${activeTarget.elevation}°`, 'OPTICAL', 'info');
    addLog(`AI RESIDUAL DIFFERENCE CLASSIFIED TARGET AS: ${activeTarget.classification}`, 'OPTICAL', 'success');
  };

  // Simulate Swarm Attack
  const handleSimulateSwarm = () => {
    setSystemStatus('alert');
    const ids = ["SW-01", "SW-02", "SW-03", "SW-04", "SW-05"];
    const names = ["Swarm Probe A", "Swarm Probe B", "Swarm Probe C", "Swarm Probe D", "Swarm Probe E"];
    
    const spawned: DroneTarget[] = ids.map((id, index) => ({
      id,
      name: names[index],
      azimuth: +(Math.random() * 360).toFixed(1),
      elevation: +(5 + Math.random() * 30).toFixed(1),
      range: +(0.8 + Math.random() * 1.5).toFixed(2),
      signalStrength: +(80 + Math.random() * 20).toFixed(1),
      speed: 120 + index * 5,
      altitude: 350 + index * 40,
      status: 'tracking',
      threatLevel: 'high',
      classification: 'Autonomous Micro Swarm Cluster'
    }));

    setTargets(prev => [...prev.filter(t => !t.id.startsWith("SW-")), ...spawned]);
    addLog(`[ALARM] INCOMING MICRO-UAV SWARM INTRUSION CLUSTERS RECONSTRUCTED`, 'C2_SYSTEM', 'critical');
    addLog(`EMITTING SCRAMBLED FREQUENCY ALERT. SECTOR SECURITY FLAGGED RED`, 'C2_SYSTEM', 'critical');
  };

  // Clear target list back to default
  const handleClearSwarms = () => {
    setTargets(INITIAL_TARGETS);
    setSelectedTargetId("SG-A45");
    setIsJammingActive(false);
    setJammingPower(0);
    setSystemStatus('active');
    addLog(`Tactical theater maps reset. Airspace cleared back to parameters.`, 'C2_SYSTEM', 'info');
  };

  // Log filter computations
  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    if (logFilter === 'alert') return log.type === 'critical' || log.type === 'alert' || log.type === 'warning';
    if (logFilter === 'actions') return log.module === 'COUNTER' || log.module === 'C2_SYSTEM';
    return true;
  });

  return (
    <div className="w-full relative py-20 min-h-[95vh]">
      {/* HUD visuals overlay */}
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16 space-y-8 text-left">
        {/* Top Header Controls Bar */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-brand-slate/40 p-5 border border-white/5 rounded-sm">
          <div className="space-y-1">
            <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-brand-cyan animate-pulse" />
              Airspace Tactical Control Console
            </h1>
            <p className="font-sans text-xs text-on-surface-variant">
              Central command theater mapping real-time passive RF triangulated nodes.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            {/* Alarm swarm trigger */}
            <button
              onClick={handleSimulateSwarm}
              className="px-4 py-2 border border-[#f43f5e]/40 hover:border-[#f43f5e] bg-[#f43f5e]/5 text-[#f43f5e] font-mono text-[10px] tracking-wider uppercase font-bold flex items-center gap-2 cursor-pointer rounded-sm hover:bg-[#f43f5e]/10 transition-all"
            >
              <Swords className="w-3.5 h-3.5" />
              Sim Swarm Aggression
            </button>

            <button
              onClick={handleClearSwarms}
              className="px-4 py-2 border border-white/10 hover:border-white/20 bg-brand-bg/50 text-on-surface-variant font-mono text-[10px] tracking-wider uppercase font-bold flex items-center gap-2 cursor-pointer rounded-sm hover:text-white transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset Airspace Map
            </button>
          </div>
        </div>

        {/* Dashboard grid structure */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Left column: Targets listing and Custom Radar (col-span-4) */}
          <section className="xl:col-span-4 space-y-6">
            
            {/* Custom Interactive circular Map Radar */}
            <div className="hud-border bg-brand-slate p-5 space-y-4 rounded-sm relative">
              <div className="absolute top-0 left-0 w-8 h-[2px] bg-brand-cyan"></div>
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="font-sans text-xs tracking-wider uppercase font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-brand-cyan" />
                  Triangulation Scan Radar
                </h3>
                <span className="font-mono text-[9px] text-brand-cyan tracking-wider font-bold uppercase animate-pulse">
                  Sweeping Active
                </span>
              </div>

              {/* Dynamic Sweep representation with target dots */}
              <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-brand-bg rounded-full border border-brand-cyan/20 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 cyber-grid opacity-15"></div>
                
                {/* Embedded dynamic sweep */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{ transform: `rotate(${radarSweepAngle}deg)` }}
                >
                  <div className="w-1/2 h-full border-r border-brand-cyan/45 bg-gradient-to-l from-brand-cyan/15 to-transparent origin-right transform rotate-90"></div>
                </div>

                {/* Concentric rings to symbolize focus */}
                <div className="absolute w-[80%] h-[80%] rounded-full border border-white/5 pointer-events-none"></div>
                <div className="absolute w-[50%] h-[50%] rounded-full border border-white/5 pointer-events-none"></div>
                <div className="absolute w-[20%] h-[20%] rounded-full border border-white/5 pointer-events-none"></div>

                {/* Plot active targets as selectable nodes on the radar */}
                {targets.map((tgt) => {
                  // Translate azimuth and range into polar coordinates for radial rendering
                  const rad = (tgt.azimuth * Math.PI) / 180;
                  // Map range 0-6km onto radius 0-100%
                  const distanceRadius = Math.min(90, (tgt.range / 6) * 90);
                  const x = 50 + (distanceRadius / 2) * Math.cos(rad - Math.PI/2);
                  const y = 50 + (distanceRadius / 2) * Math.sin(rad - Math.PI/2);

                  const isSelected = tgt.id === selectedTargetId;

                  return (
                    <button
                      key={tgt.id}
                      onClick={() => setSelectedTargetId(tgt.id)}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-rose-500 scale-125 z-20 shadow-[0_0_8px_#f43f5e]' 
                          : tgt.status === 'intercepted' 
                            ? 'bg-emerald-400 scale-100'
                            : 'bg-brand-cyan font-bold scale-100 animate-pulse'
                      }`}
                      title={`${tgt.name} (${tgt.id})`}
                    >
                      {/* Inner dot pulse */}
                      {isSelected && <span className="absolute w-5 h-5 rounded-full border border-rose-500 animate-ping"></span>}
                    </button>
                  );
                })}
              </div>

              {/* Targets listing selector */}
              <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                <div className="font-mono text-[9px] text-[#8e9aa8] uppercase font-bold tracking-widest">
                  Target Vector Directory
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
                  {targets.map((tgt) => {
                    const isSelected = tgt.id === selectedTargetId;
                    return (
                      <button
                        key={tgt.id}
                        onClick={() => setSelectedTargetId(tgt.id)}
                        className={`w-full text-left p-3 border transition-all cursor-pointer rounded-sm flex justify-between items-center ${
                          isSelected
                            ? 'border-brand-cyan bg-brand-cyan/10'
                            : 'border-white/5 bg-brand-bg/30 hover:bg-brand-bg/60'
                        }`}
                      >
                        <div className="space-y-1 leading-none">
                          <p className="font-mono text-xs text-white font-bold">{tgt.id}</p>
                          <p className="font-sans text-[10px] text-on-surface-variant">{tgt.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-xs font-bold text-brand-cyan">{tgt.range.toFixed(2)} km</p>
                          <span className={`inline-block font-mono text-[7px] font-bold px-1 py-0.5 rounded-sm uppercase tracking-wide ${
                            tgt.status === 'intercepted'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/20'
                              : tgt.threatLevel === 'high'
                                ? 'bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/20'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            {tgt.status.toUpperCase()}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </section>

          {/* Center Column: Optical Bounding Box Lock and dynamic charts (col-span-5) */}
          <section className="xl:col-span-5 space-y-6">
            
            {/* High fidelity Bounding Box lock view */}
            <div className="hud-border bg-brand-slate p-5 rounded-sm relative space-y-4">
              <div className="absolute top-0 left-0 w-8 h-[2px] bg-brand-cyan"></div>
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="font-sans text-xs tracking-wider uppercase font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-brand-cyan animate-spin" />
                  OPTICAL TARGET TRACKING FEED
                </h3>
                <span className="font-mono text-[9px] text-[#4cd7f6] uppercase tracking-wider font-bold">
                  Slew Rate Locked
                </span>
              </div>

              {/* Dynamic Box visual */}
              <div className="relative aspect-video bg-indigo-950/20 rounded-sm overflow-hidden flex items-center justify-center border border-white/5">
                {/* Cloud background sky aesthetic placeholder */}
                <div className="absolute inset-0 opacity-40 mix-blend-color-dodge pointer-events-none">
                  <div className="w-full h-full bg-gradient-to-tr from-brand-slate to-brand-cyan/25"></div>
                </div>
                <div className="absolute inset-0 scanline"></div>

                {/* Dynamic Green square locator tracking movement */}
                <div 
                  className="absolute w-24 h-24 border-2 border-emerald-400 bg-emerald-400/5 flex flex-col justify-between p-1.5 transition-all duration-300 ease-out"
                  style={{ 
                    left: `calc(50% + ${cameraMovement.x - 50}px)`, 
                    top: `calc(50% + ${cameraMovement.y - 50}px)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {/* Bounding corners */}
                  <span className="font-mono text-[7px] text-emerald-400 font-bold uppercase tracking-widest">
                    TARGET: {activeTarget ? activeTarget.id : 'N/A'}
                  </span>
                  <span className="font-mono text-[7px] font-bold text-right text-emerald-300">
                    CONFIDENCE: 98%
                  </span>
                </div>

                {/* Coordinate overlay boxes */}
                <div className="absolute top-4 left-4 bg-brand-bg/85 border border-brand-cyan/30 px-3 py-1.5 font-mono text-[9px] tracking-wide text-brand-cyan rounded-sm backdrop-blur-md">
                  ALTITUDE: {activeTarget ? activeTarget.altitude : 0} m<br />
                  SPEED: {activeTarget ? activeTarget.speed : 0} km/h
                </div>

                <div className="absolute bottom-4 right-4 bg-brand-bg/95 border border-[#f43f5e]/30 px-3 py-1.5 font-mono text-[9px] text-[#f43f5e] font-bold tracking-wide rounded-sm">
                  CROSS-HAIR CORRELATION OK
                </div>
              </div>

              {/* Micro actions buttons */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={handleDeployJammer}
                  className="bg-brand-cyan hover:bg-brand-cyan-light text-brand-bg font-sans font-bold py-3 uppercase tracking-wider text-[10px] rounded-sm cursor-pointer transition-all"
                >
                  Deploy RF Passive Jammer
                </button>
                <button
                  onClick={handleSlewCamera}
                  className="border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 font-sans font-bold py-3 uppercase tracking-wider text-[10px] rounded-sm cursor-pointer transition-all"
                >
                  Slew Optical Focus Lock
                </button>
              </div>
            </div>

            {/* Signal Strength history chart */}
            <div className="hud-border bg-brand-slate p-5 rounded-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-sans text-xs tracking-wider uppercase font-bold text-white">
                  Real-time Signal History Timeline
                </h3>
                <span className="font-mono text-[8px] text-on-surface-variant font-bold uppercase">
                  Telemetry logs (SNR)
                </span>
              </div>

              <div className="w-full h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '9px', fontFamily: 'monospace' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '9px', fontFamily: 'monospace' }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#111115', border: '1px solid #6366f1' }} />
                    <Line type="monotone" dataKey="signal" stroke="#6366f1" strokeWidth={2} dot={false} name="Signal Strength %" />
                    <Line type="monotone" dataKey="interference" stroke="#f43f5e" strokeWidth={1} dot={false} name="Ambient Noise dB" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </section>

          {/* Right Column: Console Log feeds and custom interactive sliders (col-span-3) */}
          <section className="xl:col-span-3 space-y-6">
            
            {/* Sliders adjustments control box */}
            <div className="hud-border bg-brand-slate p-5 space-y-4 rounded-sm">
              <div className="absolute top-0 left-0 w-8 h-[2px] bg-brand-cyan"></div>
              <h3 className="font-sans text-xs tracking-wider uppercase font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-cyan" />
                Interference Simulation Controls
              </h3>

              {/* Interference Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-on-surface-variant font-medium">
                  <span>Ambient Weather Noise</span>
                  <span className="text-brand-cyan">{interference} dB</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={interference}
                  onChange={(e) => setInterference(Number(e.target.value))}
                  className="w-full accent-brand-cyan bg-brand-bg h-1 cursor-pointer outline-none rounded-full"
                />
              </div>

              {/* Jamming Power Output Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-on-surface-variant font-medium">
                  <span>RF Jammer Antenna Power</span>
                  <span className={`${isJammingActive ? 'text-rose-500 font-bold' : 'text-on-surface-variant'}`}>
                    {jammingPower} W
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={jammingPower}
                  onChange={(e) => setJammingPower(Number(e.target.value))}
                  className="w-full accent-brand-cyan bg-brand-bg h-1 cursor-pointer outline-none rounded-full"
                />
              </div>

              {/* Fast parameters details summary */}
              <div className="p-3.5 bg-brand-bg/50 border border-white/5 rounded-sm font-mono text-[9px] text-[#8e9aa8] space-y-1.5 leading-normal">
                <p>WEATHER DEVIATION: <span className="text-white">{interference > 30 ? "HEAVY RAIN" : "CLEAR STABLE"}</span></p>
                <p>ANTENNA ARRAY LOAD: <span className="text-white">{isJammingActive ? "82% - HIGH" : "18% - OPTIMAL"}</span></p>
                <p>CILS SPECTRUM STATUS: <span className={`${isJammingActive ? 'text-rose-500 animate-pulse font-bold' : 'text-emerald-400 font-bold'}`}>{isJammingActive ? "COUNTERING ACTIVE" : "STANDBY WATCH"}</span></p>
              </div>
            </div>

            {/* Rolling C2 Log Feed */}
            <div className="hud-border bg-brand-slate p-5 space-y-4 rounded-sm">
              <h3 className="font-sans text-xs tracking-wider uppercase font-bold text-white flex items-center justify-between border-b border-white/5 pb-3">
                <span>Tactical Network Log</span>
                <span className="font-mono text-[9px] tracking-wide text-brand-cyan font-bold uppercase animate-pulse">
                  Streaming
                </span>
              </h3>

              {/* Log Categories Buttons */}
              <div className="flex gap-1">
                {['all', 'alert', 'actions'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLogFilter(filter as any)}
                    className={`px-2.5 py-1 text-[8px] font-mono tracking-widest uppercase font-bold rounded-sm cursor-pointer border ${
                      logFilter === filter
                        ? 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40'
                        : 'bg-transparent text-on-surface-variant/80 border-transparent hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Logs visualizer block */}
              <div className="h-44 overflow-y-auto space-y-2 pr-1.5 font-mono text-[9px]">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="border-b border-white/5 pb-1.5 space-y-0.5 leading-relaxed">
                    <div className="flex justify-between items-center text-[8px] text-on-surface-variant">
                      <span className="font-bold text-brand-cyan">{log.module}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className={`text-left ${
                      log.type === 'critical' || log.type === 'alert'
                        ? 'text-rose-500 font-bold'
                        : log.type === 'warning'
                          ? 'text-amber-400 font-semibold'
                          : log.type === 'success'
                            ? 'text-emerald-400'
                            : 'text-on-surface-variant/90'
                    }`}>
                      &gt; {log.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </section>
        </div>
      </div>
    </div>
  );
}
