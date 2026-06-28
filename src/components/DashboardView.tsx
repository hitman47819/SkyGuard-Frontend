import { useState, useEffect } from 'react';
import {
  BarChart3, Target, Cpu, TrendingUp, Clock, Activity,
  AlertCircle, RefreshCw, Zap, Eye, TrendingDown, Minus
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  Legend, LineChart, Line
} from 'recharts';

const COLORS = ['#6366F1', '#A855F7', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6', '#F97316'];

const tooltipStyle = {
  backgroundColor: '#111115',
  border: '1px solid rgba(99,102,241,0.3)',
  borderRadius: '4px',
  fontSize: '12px',
};

const axisTick = { fontSize: 10, fill: '#6B7280' };
const gridStroke = 'rgba(255,255,255,0.05)';

const getAuthHeaders = () => {
  const token = localStorage.getItem('skyguard-access-token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const safeArray = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  if (raw?.responses && Array.isArray(raw.responses)) return raw.responses;
  return [];
};

const fmtDate = (d: string) => {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch { return d; }
};

const timeAgo = (dateStr: string) => {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(dateStr);
};

const normalizeDailyTypes = (items: any[]): any[] => {
  if (items.length === 0) return [];
  const first = items[0];
  if (first.types && Array.isArray(first.types)) {
    return items.map((d: any) => {
      const flat: any = { date: d.date };
      d.types.forEach((t: any) => { flat[t.name || t.droneTypeName || t.type] = t.count; });
      return flat;
    });
  }
  return items;
};

export default function DashboardView() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [droneTypes, setDroneTypes] = useState<any[]>([]);
  const [hourly, setHourly] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [detectionDist, setDetectionDist] = useState<any[]>([]);
  const [confidence, setConfidence] = useState<any[]>([]);
  const [confidenceByDrone, setConfidenceByDrone] = useState<any[]>([]);
  const [dailyTypes, setDailyTypes] = useState<any[]>([]);
  const [trend, setTrend] = useState<any>(null);   // object, not array
  const [lastSeen, setLastSeen] = useState<any[]>([]);
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

      const [
        statsRes, timelineRes, droneRes, hourlyRes, recentRes,
        distRes, confRes, confByDroneRes, dailyRes, trendRes, lastSeenRes,
      ] = await Promise.all([
        fetch(`/api/Analytic/dashboard?from=${from}&to=${to}`, { headers: getAuthHeaders() }),
        fetch(`/api/Analytic/timeline?days=30`, { headers: getAuthHeaders() }),
        fetch(`/api/Analytic/top-drone-types?count=8`, { headers: getAuthHeaders() }),
        fetch(`/api/Analytic/hourly`, { headers: getAuthHeaders() }),
        fetch(`/api/Analytic/recent?count=10`, { headers: getAuthHeaders() }),
        fetch(`/api/Analytic/detection-distribution?from=${from}&to=${to}`, { headers: getAuthHeaders() }),
        fetch(`/api/Analytic/confidence`, { headers: getAuthHeaders() }),
        fetch(`/api/Analytic/confidence-by-drone`, { headers: getAuthHeaders() }),
        fetch(`/api/Analytic/daily-detection-types?days=30`, { headers: getAuthHeaders() }),
        fetch(`/api/Analytic/trend`, { headers: getAuthHeaders() }),
        fetch(`/api/Analytic/last-seen`, { headers: getAuthHeaders() }),
      ]);

      if (statsRes.ok) {
        const raw = await statsRes.json();
        setStats(raw.data ? raw.data : raw);
      }

      if (timelineRes.ok) {
        const raw = await timelineRes.json();
        setTimeline(safeArray(raw));
      }

      // ---------- Drone Types (Pie) ----------
      if (droneRes.ok) {
        const raw = await droneRes.json();
        const rawArray = safeArray(raw);
        const normalised = rawArray.map((item: any) => ({
          droneTypeName: item.droneTypeName ?? 'Unknown',
          count: item.totalDetections ?? 0,
        }));
        setDroneTypes(normalised);
      } else {
        console.warn('Failed to load top-drone-types:', droneRes.status);
      }

      if (hourlyRes.ok) {
        const raw = await hourlyRes.json();
        setHourly(safeArray(raw));
      }

      if (recentRes.ok) {
        const raw = await recentRes.json();
        const items = safeArray(raw);
        const normalized = items.map((d: any) => ({
          ...d,
          id: d.id ?? d.detectionId,
          name: d.name ?? d.detectionName ?? 'Unknown',
          detectedAt: d.detectedAt ?? d.createdAt ?? new Date().toISOString(),
        }));
        setRecent(normalized);
      }

      // ---------- Detection Distribution ----------
      if (distRes.ok) {
        const raw = await distRes.json();
        const rawArray = safeArray(raw);
        const normalised = rawArray.map((item: any) => ({
          name: item.name ?? item.detectionName ?? item.detection ?? 'Unknown',
          count: item.count ?? item.value ?? 0,
        }));
        setDetectionDist(normalised);
      } else {
        console.warn('Failed to load detection-distribution:', distRes.status);
      }

      if (confRes.ok) {
        const raw = await confRes.json();
        setConfidence(safeArray(raw));
      }

      // ---------- Confidence by Drone Type ----------
      if (confByDroneRes.ok) {
        const raw = await confByDroneRes.json();
        const rawArray = safeArray(raw);
        const normalised = rawArray.map((item: any) => ({
          droneTypeName: item.droneTypeName ?? 'Unknown',
          confidence: item.averageConfidence ?? 0,
        }));
        setConfidenceByDrone(normalised);
      } else {
        console.warn('Failed to load confidence-by-drone:', confByDroneRes.status);
      }

      if (dailyRes.ok) {
        const raw = await dailyRes.json();
        setDailyTypes(normalizeDailyTypes(safeArray(raw)));
      }

      // ---------- Detection Trend ----------
      if (trendRes.ok) {
        const raw = await trendRes.json();
        setTrend(raw);   // store the object directly
      } else {
        console.warn('Failed to load trend:', trendRes.status);
      }

      if (lastSeenRes.ok) {
        const raw = await lastSeenRes.json();
        setLastSeen(safeArray(raw));
      } else {
        console.warn('Failed to load last-seen:', lastSeenRes.status);
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
    { label: 'Total AI Results', value: stats?.totalAIResults ?? 0, icon: Cpu, color: '#6366F1' },
    { label: 'Drone Detections', value: stats?.totalDroneDetections ?? 0, icon: Target, color: '#A855F7' },
    { label: 'Unique Drone Types', value: stats?.uniqueDroneTypes ?? 0, icon: BarChart3, color: '#10B981' },
    { label: 'Avg Confidence', value: `${(stats?.averageConfidence ?? 0).toFixed(1)}%`, icon: TrendingUp, color: '#F59E0B' },
  ];

  const dailyTypeKeys = dailyTypes.length > 0
    ? Object.keys(dailyTypes[0]).filter(k => k !== 'date' && k !== 'id' && typeof dailyTypes[0][k] === 'number')
    : [];

  const ChartCard = ({ title, icon: Icon, iconColor, badge, children, className = '' }: {
    title: string; icon: any; iconColor: string; badge?: string; children: React.ReactNode; className?: string;
  }) => (
    <div className={`bg-brand-slate/40 border border-white/5 p-5 rounded-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
          {title}
        </h3>
        {badge && <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{badge}</span>}
      </div>
      {children}
    </div>
  );

  const EmptyChart = ({ msg = 'No data available' }: { msg?: string }) => (
    <div className="flex items-center justify-center h-[200px] text-xs text-slate-600 font-mono">{msg}</div>
  );

  // Trend indicator helper
  const TrendIndicator = ({ data }: { data: any }) => {
    if (!data) return <EmptyChart />;
    const isUp = data.direction === 'up';
    const isDown = data.direction === 'down';
    const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
    const color = isUp ? '#10B981' : isDown ? '#EF4444' : '#6B7280';
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Icon className="w-12 h-12" style={{ color }} />
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{data.currentPeriodCount}</p>
          <p className="text-xs text-on-surface-variant">Current Period</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-mono" style={{ color }}>
            {isUp ? '+' : ''}{data.percentageChange}%
          </p>
          <p className="text-[10px] text-on-surface-variant uppercase">vs previous</p>
        </div>
      </div>
    );
  };

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

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-16 space-y-6 relative z-10">

        {/* Header */}
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
            <button onClick={fetchDashboard} disabled={loading} className="flex items-center gap-2 px-4 py-2 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 transition-all font-mono text-xs uppercase tracking-wider rounded-sm disabled:opacity-30 disabled:cursor-not-allowed">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <p className="text-xs text-on-surface-variant mt-2">Real-time airspace analytics and detection intelligence metrics.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 border border-rose-500/30 bg-rose-500/10 rounded-sm text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="bg-brand-slate/40 border border-white/5 p-5 rounded-sm hover:border-brand-cyan/20 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
                <div className="w-8 h-1 rounded-full" style={{ backgroundColor: card.color, opacity: 0.4 }}></div>
              </div>
              <div className="font-display text-2xl font-bold text-white">{card.value}</div>
              <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Row 2: Timeline + Drone Types Pie */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard title="30-Day Detection Timeline" icon={TrendingUp} iconColor="#6366F1" badge="Last 30 Days">
            {timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" tick={axisTick} tickFormatter={(v) => String(v).slice(5)} />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6366F1' }} />
                  <Area type="monotone" dataKey="count" stroke="#6366F1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Drone Type Distribution" icon={Target} iconColor="#A855F7" badge="Top Types">
            {droneTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={droneTypes} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="count" nameKey="droneTypeName">
                    {droneTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle"
                    formatter={(value: string) => <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>
        </div>

        {/* Row 3: Hourly + Detection Distribution */}
        <div className="grid lg:grid-cols-3 gap-6">
          <ChartCard title="Hourly Activity Pattern" icon={Clock} iconColor="#10B981" badge="24 Hours" className="lg:col-span-2">
            {hourly.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="hour" tick={axisTick} tickFormatter={(v) => `${v}h`} />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#6366F1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Detection Distribution" icon={BarChart3} iconColor="#F59E0B" badge="By Type">
            {detectionDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={detectionDist} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                  <XAxis type="number" tick={axisTick} />
                  <YAxis type="category" dataKey="name" tick={{ ...axisTick, fontSize: 9 }} width={80} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#F59E0B" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>
        </div>

        {/* Row 4: Daily Detection Types + Last Seen */}
        <div className="grid lg:grid-cols-3 gap-6">
          <ChartCard title="Daily Detection Types" icon={Activity} iconColor="#3B82F6" badge="30 Days" className="lg:col-span-2">
            {dailyTypes.length > 0 && dailyTypeKeys.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dailyTypes}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" tick={axisTick} tickFormatter={(v) => String(v).slice(5)} />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#9CA3AF' }} />
                  {dailyTypeKeys.map((key, i) => (
                    <Bar key={key} dataKey={key} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === dailyTypeKeys.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Last Seen" icon={Eye} iconColor="#EC4899">
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {lastSeen.length === 0 && <p className="text-xs text-on-surface-variant font-mono text-center py-8">No data</p>}
              {lastSeen.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-brand-bg/50 border border-white/5 rounded-sm">
                  <div className="w-7 h-7 rounded-full bg-brand-cyan/10 flex items-center justify-center flex-shrink-0">
                    <Target className="w-3.5 h-3.5 text-brand-cyan" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{item.droneTypeName || item.name || 'Unknown'}</p>
                    <p className="text-[9px] text-on-surface-variant font-mono">{item.count != null ? `${item.count} detections` : ''}</p>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400 flex-shrink-0">{timeAgo(item.lastSeen)}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Row 5: Confidence Distribution + Confidence by Drone + Trend */}
        <div className="grid lg:grid-cols-3 gap-6">
          <ChartCard title="Confidence Distribution" icon={TrendingUp} iconColor="#10B981">
            {confidence.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={confidence}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="range" tick={{ ...axisTick, fontSize: 9 }} />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#10B981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Confidence by Drone Type" icon={Cpu} iconColor="#8B5CF6">
            {confidenceByDrone.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={confidenceByDrone}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="droneTypeName" tick={{ ...axisTick, fontSize: 8 }} angle={-25} textAnchor="end" height={50} />
                  <YAxis tick={axisTick} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, 'Avg Confidence']} />
                  <Bar dataKey="confidence" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          {/* Detection Trend – now a KPI card because the API returns a summary object */}
          <ChartCard title="Detection Trend" icon={TrendingUp} iconColor="#6366F1">
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendIndicator data={trend} />
            </div>
          </ChartCard>
        </div>

        {/* Row 6: Recent Detections */}
        <ChartCard title="Recent Detections" icon={Activity} iconColor="#EF4444">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {recent.length === 0 && <p className="text-xs text-on-surface-variant font-mono text-center py-6 col-span-full">No recent detections</p>}
            {recent.map((det) => (
              <div key={det.id} className="flex items-center gap-3 p-3 bg-brand-bg/50 border border-white/5 rounded-sm hover:border-brand-cyan/20 transition-all">
                <div className="w-8 h-8 rounded-full bg-brand-cyan/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-brand-cyan" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">{det.name}</p>
                  <p className="text-[9px] text-on-surface-variant font-mono truncate">{det.droneTypeName || ''}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-mono text-emerald-400">{det.confidence != null ? det.confidence.toFixed(0) : 0}%</span>
                    <span className="text-[9px] font-mono text-on-surface-variant">{new Date(det.detectedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Last Detection Footer */}
        {stats?.lastDetectionTime && (
          <div className="flex items-center gap-2 px-4 py-3 border border-brand-cyan/20 bg-brand-cyan/5 rounded-sm">
            <Clock className="w-4 h-4 text-brand-cyan" />
            <span className="font-mono text-xs text-brand-cyan">
              Last Detection: {fmtDate(stats.lastDetectionTime)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}