import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  GitBranch,
  GitCommit,
  FileCode,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatusBadge } from '@/components/ui/status-badge';
import { CodeBlock } from '@/components/ui/code-block';
import { LoadingState } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { getEvent, Event, FixAttempt } from '@/lib/api';

const REFRESH_INTERVAL = 10000; // 10 seconds for real-time updates

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEvent = useCallback(async (showRefresh = false) => {
    if (!id) return;

    try {
      if (showRefresh) setIsRefreshing(true);
      const data = await getEvent(id);
      setEvent(data);
      setError(null);
    } catch (err) {
      setError('Failed to load event details. Make sure the backend is running.');
      console.error('Event fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
    const interval = setInterval(() => fetchEvent(false), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchEvent]);

  const handleManualRefresh = () => {
    fetchEvent(true);
  };

  if (loading) {
    return (
      <Layout>
        <LoadingState message="Loading event details..." />
      </Layout>
    );
  }

  if (error || !event) {
    return (
      <Layout>
        <div className="space-y-6">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Events</span>
          </button>
          <EmptyState
            icon={AlertTriangle}
            title="Event not found"
            description={error || "The event you're looking for doesn't exist or cannot be loaded."}
            action={
              <div className="flex gap-2">
                <Button onClick={handleManualRefresh} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
                <Button onClick={() => navigate('/events')}>Back to Events</Button>
              </div>
            }
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Events</span>
          </button>
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{event.repoFullName}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <GitBranch className="w-4 h-4" />
                {event.branch}
              </span>
              <span className="flex items-center gap-1">
                <GitCommit className="w-4 h-4" />
                {event.commitSha?.slice(0, 7) || 'N/A'}
              </span>
            </div>
          </div>
          <StatusBadge status={event.status} className="self-start" />
        </div>

        {/* Event Info */}
        <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Error Type</span>
            <p className="text-sm font-medium text-foreground mt-1">{event.errorType || 'Unknown'}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">File</span>
            <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-1">
              <FileCode className="w-4 h-4" />
              {event.filePath ? `${event.filePath}:${event.lineNumber}` : 'Not specified'}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Created</span>
            <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {format(new Date(event.createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
          {event.prUrl && (
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Pull Request</span>
              <Link
                to={event.prUrl}
                target="_blank"
                className="text-sm font-medium text-primary mt-1 flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                View PR
              </Link>
            </div>
          )}
        </div>

        {/* Error Details */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Error Details
          </h3>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-foreground font-mono whitespace-pre-wrap">
              {event.errorMessage || 'No error message available'}
            </p>
          </div>
        </div>

        {/* Fix Attempts */}
        {event.fixAttempts && event.fixAttempts.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Fix Attempts ({event.fixAttempts.length})</h3>

            {event.fixAttempts.map((fix: FixAttempt, index: number) => (
              <div key={fix.id} className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${fix.status === 'success' ? 'bg-green-500/20 text-green-500' :
                        fix.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                          'bg-yellow-500/20 text-yellow-500'
                      }`}>
                      {fix.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                        <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">Attempt #{index + 1}</span>
                      <span className="block text-xs text-muted-foreground">
                        {format(new Date(fix.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Confidence</span>
                      <span className="block text-sm font-medium text-foreground">
                        {Math.round(fix.confidence * 100)}%
                      </span>
                    </div>
                    {fix.prUrl && (
                      <Link
                        to={fix.prUrl}
                        target="_blank"
                        className="text-primary hover:underline text-sm flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View PR
                      </Link>
                    )}
                  </div>
                </div>

                {fix.diffSummary && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Summary</span>
                    <p className="text-sm text-foreground mt-1">{fix.diffSummary}</p>
                  </div>
                )}

                {(fix.originalCode || fix.fixedCode) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <CodeBlock
                      code={fix.originalCode || 'No original code available'}
                      title="Original Code"
                      variant="removed"
                    />
                    <CodeBlock
                      code={fix.fixedCode || 'No fixed code available'}
                      title="Fixed Code"
                      variant="added"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No fix attempts yet</h3>
            <p className="text-muted-foreground">
              The system is analyzing this error and will generate a fix soon.
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Timeline</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <span className="text-sm font-medium text-foreground">Event Detected</span>
                <span className="block text-xs text-muted-foreground">
                  {format(new Date(event.createdAt), 'MMM d, yyyy h:mm:ss a')}
                </span>
              </div>
            </div>
            {event.fixAttempts?.map((fix, idx) => (
              <div key={fix.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${fix.status === 'success' ? 'bg-green-500' :
                    fix.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Fix Attempt #{idx + 1} - {fix.status === 'success' ? 'Successful' : fix.status === 'failed' ? 'Failed' : 'Pending'}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {format(new Date(fix.createdAt), 'MMM d, yyyy h:mm:ss a')}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${event.status === 'FIXED' ? 'bg-green-500' :
                  event.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
              <div>
                <span className="text-sm font-medium text-foreground">
                  Current Status: {event.status}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {format(new Date(event.updatedAt), 'MMM d, yyyy h:mm:ss a')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Auto-refresh every {REFRESH_INTERVAL / 1000} seconds</span>
        </div>
      </div>
    </Layout>
  );
}
