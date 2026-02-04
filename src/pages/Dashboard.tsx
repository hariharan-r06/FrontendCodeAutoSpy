import { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { getStats, Stats, Event } from '@/lib/api';

const REFRESH_INTERVAL = 10000; // 10 seconds for real-time updates

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      const data = await getStats();
      setStats(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to connect to backend. Make sure CodeAutoSpy server is running on port 3000.');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(false), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleManualRefresh = () => {
    fetchStats(true);
  };

  if (loading) {
    return (
      <Layout>
        <LoadingState message="Loading dashboard..." />
      </Layout>
    );
  }

  if (error || !stats) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertTriangle className="w-16 h-16 text-yellow-500" />
          <h2 className="text-xl font-semibold text-foreground">Connection Error</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {error || 'Unable to fetch data from the backend.'}
          </p>
          <div className="flex gap-4">
            <Button onClick={handleManualRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Tip: Run <code className="bg-muted px-2 py-1 rounded">npm run dev</code> in the CodeAutoSpy backend folder
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Monitor your CI/CD failures and AI-generated fixes</p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated: {format(lastUpdated, 'h:mm:ss a')}
              </span>
            )}
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon={Activity}
            variant="primary"
          />
          <StatCard
            title="Fixed"
            value={stats.fixedEvents}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Failed"
            value={stats.failedEvents}
            icon={XCircle}
            variant="danger"
          />
          <StatCard
            title="Pending"
            value={stats.pendingEvents}
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* Success Rate & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Success Rate */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Success Rate</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="url(#successGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(stats.successRate / 100) * 440} 440`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(160 84% 39%)" />
                      <stop offset="100%" stopColor="hsl(172 66% 50%)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-foreground">{stats.successRate}%</span>
                  <span className="text-xs text-muted-foreground">Success</span>
                </div>
              </div>
            </div>
          </div>

          {/* Events Over Time */}
          <div className="glass-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Events Over Time</h3>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="h-48">
              {stats.eventsOverTime && stats.eventsOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.eventsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => format(new Date(value), 'MMM d')}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No event data available yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Events & Top Repos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Events */}
          <div className="glass-card lg:col-span-2 overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">Recent Events</h3>
            </div>
            {stats.recentEvents && stats.recentEvents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Repository</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Error Type</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Time</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentEvents.map((event: Event) => (
                      <tr
                        key={event.id}
                        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <td className="p-4">
                          <span className="text-sm font-medium text-foreground">{event.repoFullName}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{event.errorType || 'Unknown'}</span>
                        </td>
                        <td className="p-4">
                          <StatusBadge status={event.status} />
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(event.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </td>
                        <td className="p-4">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No events yet. Trigger a CI/CD failure to see data here.</p>
              </div>
            )}
          </div>

          {/* Top Repos */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Top Repositories</h3>
            <div className="h-64">
              {stats.topRepos && stats.topRepos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topRepos} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="repo"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      width={100}
                      tickFormatter={(value) => value.split('/')[1] || value}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No repository data yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real-time indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Real-time updates every {REFRESH_INTERVAL / 1000} seconds</span>
        </div>
      </div>
    </Layout>
  );
}
