Here is the fixed `DashboardView` component. 

Just like the previous pages, the analytics API returns a **raw array** (or raw object) instead of being wrapped in `{ data: [...] }`. Because of this, `data.data` was undefined, meaning none of your charts and stats were receiving the information.

I have updated the `fetchDashboard` function to correctly unwrap the raw API responses. I also added a normalization step for `recent` detections to ensure the `id`, `name`, and `detectedAt` fields map correctly regardless of how the backend formats them.

```tsx
import { useState, useEffect } from 'react';
import {
  BarChart3, Target, Cpu, TrendingUp, Clock, Activity,
  AlertCircle, RefreshCw, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import type { DashboardStats, TimelinePoint, DroneTypeDistribution, HourlyStat, RecentDetection } from '../types';

const COLORS = ['#6366F1', '#A855F7', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6'];

const getAuthHeaders = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export default function DashboardView() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [droneTypes, setDroneTypes] = useState<DroneTypeDistribution[]>([]);
  const [hourly, setHourly] = useState<HourlyStat[]>([]);
  const [recent, setRecent] = useState<RecentDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUser = async () => {
    const token = localStorage.getItem('skyguard-access-token');
    if (!token) return;
    try {
      const res = await fetch('/api/Users/me', {
        headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
      });
      if (res.ok) {
        const raw = await res.json();
        // Handle both raw object and { data: {...} } response structures
        setUser(raw.data ? raw.data : raw);
      }
    } catch { /* silent */ }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const to = now.toISOString();

      const [statsRes, timelineRes, droneRes, hourlyRes, recentRes] = await Promise.all([
        fetch(`/api/Analytic/dashboard?from=${from}&to=${to}`, { headers: getAuthHeaders() }),
        fetch(`/api/Analytic/timeline?days=30`, { headers: getAuthHeaders() }),
        fetch(`/api/Analytic/top-drone-types?count=6`, { headers: getAuthHeaders() }),
        fetch(`/api/Analytic/hourly`, { headers: getAuthHeaders() }),
        fetch(`/api/Analytic/recent?count=10`, { headers: getAuthHeaders() }),
      ]);

      if (statsRes.ok) {
        const raw = await statsRes.json();
        setStats(raw.data ? raw.data : raw);
      }
      
      if (timelineRes.ok) {
        const raw = await timelineRes.json();
        const items = Array.isArray(raw) ? raw : (raw.data ?? []);
        setTimeline(items);
      }
      
      if (droneRes.ok) {
        const raw = await droneRes.json();
        const items = Array.isArray(raw) ? raw : (raw.data ?? []);
        setDroneTypes(items);
      }
      
      if (hourlyRes.ok) {
        const raw = await hourlyRes.json();
        const items = Array.isArray(raw) ? raw : (raw.data ?? []);
        setHourly(items);
      }
      
      if (recentRes.ok) {
        const raw = await recentRes.json();
        const items = Array.isArray(raw) ? raw : (raw.data ?? []);
        
        // Normalize fields to ensure UI components get what they expect
        const normalized = items.map((d: any) => ({
          ...d,
          id: d.id ?? d.detectionId,
          name: d.name ?? d.detectionName ?? 'Unknown',
          detectedAt: d.detectedAt ?? d.createdAt ?? new Date().toISOString(),
        }));
        
        setRecent(normalized);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchDashboard();
  }, []);

  const statCards = [
    {
      label: 'Total AI Results',
      value: stats?.totalAIResults ?? 0,
      icon: Cpu,
      color: '#6366F1',
    },
    {
      label: 'Drone Detections',
      value: stats?.totalDroneDetections ?? 0,
      icon: Target,
      color: '#A855F7',
    },
    {
      label: 'Unique Drone Types',
      value: stats?.uniqueDroneTypes ?? 0,
      icon: BarChart3,
      color: '#10B981',
    },
    {
      label: 'Avg Confidence',
      value: `${(stats?.averageConfidence ?? 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: '#F59E0B',
    },
  ];

  if (loading) {
    return (
      <div className="w-full relative py-20 min-h-[95vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-2 border-brand-cyan/20 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
            <Zap className="absolute inset-0 m-auto w-6 h-6 text-brand-cyan" />
          </div>
          <p className="font-mono text-xs text-brand-cyan tracking-widest uppercase animate-pulse">Initializing Command Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative py-20 min-h-[95vh]">
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16 space-y-8 relative z-10">
        {/* Header */}
        <div className="space-y-4">
          <div className="bg-brand-slate/40 p-5 border border-white/5 rounded-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-cyan animate-pulse" />
                  Command Analytics Overview
                </h1>
                {user && (
                  <p className="text-xs text-brand-cyan font-mono mt-1">
                    Welcome, {user.userFirstName} {user.userLastName} | Role: {user.userrole === 1 ? 'Super' : user.userrole === 2 ? 'Admin' : 'Analytics'}
                  </p>
                )}
              </div>
              <button
                onClick={fetchDashboard}
                className="flex items-center gap-2 px-4 py-2 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 transition-all font-mono text-xs uppercase tracking-wider rounded-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              Real-time airspace analytics and detection intelligence metrics.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 border border-rose-500/30 bg-rose-500/10 rounded-sm text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-brand-slate/40 border border-white/5 p-5 rounded-sm hover:border-brand-cyan/20 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
                <div className="w-8 h-1 rounded-full" style={{ backgroundColor: card.color, opacity: 0.4 }}></div>
              </div>
              <div className="font-display text-2xl font-bold text-white">{card.value}</div>
              <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mt-1">
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Timeline Chart */}
          <div className="bg-brand-slate/40 border border-white/5 p-5 rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-cyan" />
                30-Day Detection Timeline
              </h3>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Last 30 Days</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111115', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '4px', fontSize: '12px' }}
                  labelStyle={{ color: '#6366F1' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366F1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Drone Type Distribution */}
          <div className="bg-brand-slate/40 border border-white/5 p-5 rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-accent" />
                Drone Type Distribution
              </h3>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Top Types</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={droneTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="droneTypeName"
                >
                  {droneTypes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111115', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '4px', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconSize={8}
                  iconType="circle"
                  formatter={(value: string) => <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Activity + Recent Detections */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Hourly Activity */}
          <div className="lg:col-span-2 bg-brand-slate/40 border border-white/5 p-5 rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Hourly Activity Pattern
              </h3>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">24 Hours</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `${v}h`} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111115', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '4px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Detections */}
          <div className="bg-brand-slate/40 border border-white/5 p-5 rounded-sm">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-rose-400" />
              Recent Detections
            </h3>
            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
              {recent.length === 0 && (
                <p className="text-xs text-on-surface-variant font-mono text-center py-8">No recent detections</p>
              )}
              {recent.map((det) => (
                <div key={det.id} className="flex items-center gap-3 p-3 bg-brand-bg/50 border border-white/5 rounded-sm hover:border-brand-cyan/20 transition-all">
                  <div className="w-8 h-8 rounded-full bg-brand-cyan/10 flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-brand-cyan" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{det.name}</p>
                    <p className="text-[10px] text-on-surface-variant font-mono">{det.droneTypeName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-mono text-emerald-400">{(det.confidence).toFixed(0)}%</p>
                    <p className="text-[9px] font-mono text-on-surface-variant">
                      {new Date(det.detectedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Last Detection */}
        {stats?.lastDetectionTime && (
          <div className="flex items-center gap-2 px-4 py-3 border border-brand-cyan/20 bg-brand-cyan/5 rounded-sm">
            <Clock className="w-4 h-4 text-brand-cyan" />
            <span className="font-mono text-xs text-brand-cyan">
              Last Detection: {new Date(stats.lastDetectionTime).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```