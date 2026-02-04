import { useEffect, useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp,
  ExternalLink,
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
import { getStats, Stats, Event } from '@/lib/api';

// Mock data for demo
const mockStats: Stats = {
  totalEvents: 156,
  fixedEvents: 118,
  failedEvents: 24,
  pendingEvents: 14,
  successRate: 76,
  recentEvents: [
    { id: '1', repoFullName: 'acme/frontend', repoOwner: 'acme', repoName: 'frontend', branch: 'main', commitSha: 'abc123', status: 'FIXED', errorType: 'SyntaxError', errorMessage: 'Unexpected token', filePath: 'src/index.ts', lineNumber: 42, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), fixAttempts: [] },
    { id: '2', repoFullName: 'acme/backend', repoOwner: 'acme', repoName: 'backend', branch: 'develop', commitSha: 'def456', status: 'ANALYZING', errorType: 'TypeError', errorMessage: 'Cannot read property', filePath: 'src/api/handler.ts', lineNumber: 128, createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date().toISOString(), fixAttempts: [] },
    { id: '3', repoFullName: 'acme/mobile', repoOwner: 'acme', repoName: 'mobile', branch: 'feature/auth', commitSha: 'ghi789', status: 'FAILED', errorType: 'ReferenceError', errorMessage: 'Variable is not defined', filePath: 'src/screens/Login.tsx', lineNumber: 56, createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date().toISOString(), fixAttempts: [] },
    { id: '4', repoFullName: 'acme/api', repoOwner: 'acme', repoName: 'api', branch: 'main', commitSha: 'jkl012', status: 'FIXING', errorType: 'ImportError', errorMessage: 'Module not found', filePath: 'src/utils/helpers.ts', lineNumber: 12, createdAt: new Date(Date.now() - 10800000).toISOString(), updatedAt: new Date().toISOString(), fixAttempts: [] },
    { id: '5', repoFullName: 'acme/dashboard', repoOwner: 'acme', repoName: 'dashboard', branch: 'main', commitSha: 'mno345', status: 'FIXED', errorType: 'SyntaxError', errorMessage: 'Missing semicolon', filePath: 'src/components/Chart.tsx', lineNumber: 89, createdAt: new Date(Date.now() - 14400000).toISOString(), updatedAt: new Date().toISOString(), fixAttempts: [] },
  ],
  topRepos: [
    { repo: 'acme/frontend', count: 45 },
    { repo: 'acme/backend', count: 38 },
    { repo: 'acme/mobile', count: 28 },
    { repo: 'acme/api', count: 25 },
    { repo: 'acme/dashboard', count: 20 },
  ],
  eventsOverTime: [
    { date: '2024-01-28', count: 12 },
    { date: '2024-01-29', count: 18 },
    { date: '2024-01-30', count: 15 },
    { date: '2024-01-31', count: 24 },
    { date: '2024-02-01', count: 21 },
    { date: '2024-02-02', count: 28 },
    { date: '2024-02-03', count: 22 },
  ],
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch {
        // Use mock data when API is unavailable
        setStats(mockStats);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Layout>
        <LoadingState message="Loading dashboard..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <EmptyState 
          title="Failed to load dashboard" 
          description={error}
        />
      </Layout>
    );
  }

  const data = stats || mockStats;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your CI/CD failures and AI-generated fixes</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Events"
            value={data.totalEvents}
            icon={Activity}
            variant="primary"
          />
          <StatCard
            title="Fixed"
            value={data.fixedEvents}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Failed"
            value={data.failedEvents}
            icon={XCircle}
            variant="danger"
          />
          <StatCard
            title="Pending"
            value={data.pendingEvents}
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
                    strokeDasharray={`${(data.successRate / 100) * 440} 440`}
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
                  <span className="text-4xl font-bold text-foreground">{data.successRate}%</span>
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.eventsOverTime || mockStats.eventsOverTime}>
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
                  {data.recentEvents.map((event: Event) => (
                    <tr 
                      key={event.id} 
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <td className="p-4">
                        <span className="text-sm font-medium text-foreground">{event.repoFullName}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{event.errorType}</span>
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
          </div>

          {/* Top Repos */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Top Repositories</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topRepos} layout="vertical">
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
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
