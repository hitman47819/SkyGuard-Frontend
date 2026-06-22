import { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertCircle, ShieldAlert, Zap, Compass, RefreshCw,
  Trash2, Radio, Play, Pause, Database, Layers, Swords, Info
} from 'lucide-react';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

import { DroneTarget, SystemLog, RFBandInfo } from '../types';

interface DashboardViewProps {
  setSystemStatus: (status: 'active' | 'alert' | 'securing') => void;
}

/* ---------------- MOCK DATA ---------------- */

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

/* ---------------- COMPONENT ---------------- */

export default function DashboardView({ setSystemStatus }: DashboardViewProps) {

  /* ---------- USER ---------- */
  const [user, setUser] = useState<any>(null);

 useEffect(() => {
  const fetchUser = async () => {
    const token = localStorage.getItem("skyguard-access-token");

    if (!token) {
      console.warn("No token found");
      return;
    }

    const res = await fetch(`/api/Users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "*/*",
      },
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data);
    } else {
      console.error("Failed:", await res.text());
    }
  };

  fetchUser();
}, []);

  /* ---------- STATE ---------- */

  const [targets, setTargets] = useState<DroneTarget[]>(INITIAL_TARGETS);
  const [selectedTargetId, setSelectedTargetId] = useState("SG-A45");
  const [bands] = useState<RFBandInfo[]>(INITIAL_BANDS);

  const [logs, setLogs] = useState<SystemLog[]>([
    { id: '1', timestamp: '16:52:10', module: 'C2_SYSTEM', message: 'SkyGuard initialized.', type: 'info' }
  ]);

  const [logFilter, setLogFilter] = useState<'all' | 'alert' | 'actions'>('all');
  const [radarSweepAngle, setRadarSweepAngle] = useState(0);
  const [interference, setInterference] = useState(15);
  const [jammingPower, setJammingPower] = useState(0);
  const [isJammingActive, setIsJammingActive] = useState(false);
  const [cameraMovement, setCameraMovement] = useState({ x: 40, y: 35 });

  const [chartData, setChartData] = useState([
    { time: '16:50', signal: 80, interference: 10 }
  ]);

  const activeTarget = targets.find(t => t.id === selectedTargetId) || targets[0];

  /* ---------- RADAR LOOP ---------- */

  useEffect(() => {
    const interval = setInterval(() => {
      setRadarSweepAngle(p => (p + 4) % 360);

      setTargets(prev =>
        prev.map(t => ({
          ...t,
          azimuth: +(t.azimuth + (Math.random() - 0.5)).toFixed(1),
          range: Math.max(0.1, +(t.range + (Math.random() - 0.5) * 0.05).toFixed(2)),
          signalStrength: Math.max(0, Math.min(100, t.signalStrength + (Math.random() - 0.5)))
        }))
      );

      setCameraMovement(p => ({
        x: Math.max(10, Math.min(90, p.x + (Math.random() - 0.5) * 2)),
        y: Math.max(10, Math.min(90, p.y + (Math.random() - 0.5) * 2)),
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  /* ---------- CHART LOOP ---------- */

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const time = now.toTimeString().slice(0, 8);

      setChartData(prev => [
        ...prev.slice(-9),
        {
          time,
          signal: isJammingActive ? 10 : activeTarget.signalStrength,
          interference
        }
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTarget, interference, isJammingActive]);

  /* ---------- LOGS ---------- */

  const addLog = (message: string, module: SystemLog['module'], type: SystemLog['type'] = 'info') => {
    setLogs(prev => [
      {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        module,
        message,
        type
      },
      ...prev
    ]);
  };

  /* ---------- UI ACTIONS ---------- */

  const handleDeployJammer = () => {
    setIsJammingActive(true);
    setJammingPower(90);
    setSystemStatus('securing');

    addLog(`JAMMING TARGET ${activeTarget.id}`, 'COUNTER', 'warning');
  };

  const handleSlewCamera = () => {
    addLog(`LOCKED ON ${activeTarget.id}`, 'OPTICAL', 'info');
  };

  /* ---------- LOG FILTER ---------- */

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    if (logFilter === 'alert') return ['alert', 'warning', 'critical'].includes(log.type);
    if (logFilter === 'actions') return log.module === 'C2_SYSTEM' || log.module === 'COUNTER';
    return true;
  });

  /* ---------- RENDER ---------- */

  return (
    <div className="w-full relative py-20 min-h-[95vh]">

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16 space-y-8">

        {/* HEADER */}
        <div className="bg-brand-slate/40 p-5 border border-white/5 rounded-sm">

          <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-cyan animate-pulse" />
            Airspace Tactical Control Console
          </h1>

          {user && (
            <p className="text-xs text-brand-cyan font-mono mt-1">
              Hello, {user.userFirstName} 👋 | Role: {user.userrole}
            </p>
          )}

          <p className="text-xs text-on-surface-variant mt-1">
            Central command theater mapping real-time RF nodes.
          </p>
        </div>

        {/* باقي الداشبورد عندك زي ما هو (Radar / Charts / Logs) */}
        {/* أنا سيبتهم اختصارًا عشان الرسالة ما تبقاش 2000 سطر */}
        {/* لو عايز أرجعهولك كامل 100% UI زي ما هو قولّي */}

      </div>
    </div>
  );
}