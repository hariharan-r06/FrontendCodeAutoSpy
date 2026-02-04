import { useEffect, useState, useCallback } from 'react';
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingState, LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { getQueueStats, retryFailedJobs, cleanQueue, QueueStats } from '@/lib/api';
import { toast } from 'sonner';

const REFRESH_INTERVAL = 5000; // 5 seconds for queue (faster updates)

export default function Queue() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getQueueStats();
      setStats(data);
      setError(null);
      setIsConnected(true);
    } catch (err) {
      setError('Failed to connect to backend');
      setIsConnected(false);
      console.error('Queue fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleRetryFailed = async () => {
    setRetrying(true);
    try {
      const result = await retryFailedJobs();
      toast.success(result.message);
      fetchStats();
    } catch {
      toast.error('Failed to retry jobs');
    } finally {
      setRetrying(false);
    }
  };

  const handleCleanQueue = async () => {
    setCleaning(true);
    try {
      const result = await cleanQueue();
      toast.success(result.message);
      fetchStats();
    } catch {
      toast.error('Failed to clean queue');
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingState message="Loading queue status..." />
      </Layout>
    );
  }

  if (error || !stats) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <WifiOff className="w-16 h-16 text-yellow-500" />
          <h2 className="text-xl font-semibold text-foreground">Connection Error</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {error || 'Unable to fetch queue data from backend.'}
          </p>
          <Button onClick={fetchStats} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Queue</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage the job queue</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRetryFailed}
              disabled={retrying || stats.failed === 0}
              className="gap-2"
            >
              {retrying ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
              Retry Failed
            </Button>
            <Button
              variant="outline"
              onClick={handleCleanQueue}
              disabled={cleaning}
              className="gap-2"
            >
              {cleaning ? <LoadingSpinner size="sm" /> : <Trash2 className="w-4 h-4" />}
              Clean Queue
            </Button>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Connected - Auto-refreshing every {REFRESH_INTERVAL / 1000} seconds</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-red-500">Disconnected - Retrying...</span>
            </>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active"
            value={stats.active}
            icon={PlayCircle}
            variant="primary"
          />
          <StatCard
            title="Waiting"
            value={stats.waiting}
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Completed"
            value={stats.counts.completed}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Failed"
            value={stats.failed}
            icon={XCircle}
            variant="danger"
          />
        </div>

        {/* Active Jobs */}
        {stats.active > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" />
              Active Jobs ({stats.active})
            </h3>
            <div className="space-y-3">
              {Array.from({ length: stats.active }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <LoadingSpinner size="sm" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">Processing fix attempt...</span>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-primary h-2 rounded-full animate-pulse"
                        style={{ width: '60%' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waiting Jobs */}
        {stats.waiting > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Waiting Jobs ({stats.waiting})
            </h3>
            <div className="text-sm text-muted-foreground">
              {stats.waiting} job{stats.waiting > 1 ? 's' : ''} waiting in queue
            </div>
          </div>
        )}

        {/* Failed Jobs */}
        {stats.recentFailed && stats.recentFailed.length > 0 ? (
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-foreground">Failed Jobs ({stats.recentFailed.length})</h3>
            </div>
            <div className="divide-y divide-border/50">
              {stats.recentFailed.map((job) => (
                <div key={job.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">Job #{job.id}</span>
                      <p className="text-sm text-red-500 mt-1">{job.failedReason}</p>
                      {job.data && typeof job.data === 'object' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(job.data).slice(0, 100)}...
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Attempts</span>
                      <span className="block text-sm font-medium text-foreground">{job.attemptsMade}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={CheckCircle2}
            title="No failed jobs"
            description="All jobs are running smoothly!"
          />
        )}
      </div>
    </Layout>
  );
}
