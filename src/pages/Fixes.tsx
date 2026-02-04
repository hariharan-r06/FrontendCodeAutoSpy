import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ExternalLink, Filter, RefreshCw, Wrench, AlertTriangle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-spinner';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getFixes, FixAttempt, Pagination } from '@/lib/api';

const confidenceOptions = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];
const REFRESH_INTERVAL = 15000; // 15 seconds

export default function Fixes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [fixes, setFixes] = useState<FixAttempt[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState(searchParams.get('confidence') || 'ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFixes = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: 10,
      };
      const data = await getFixes(params);

      // Apply confidence filter on frontend
      let filtered = data.fixes;
      if (confidenceFilter !== 'ALL') {
        filtered = filtered.filter(f => {
          if (confidenceFilter === 'HIGH') return f.confidence >= 0.9;
          if (confidenceFilter === 'MEDIUM') return f.confidence >= 0.7 && f.confidence < 0.9;
          if (confidenceFilter === 'LOW') return f.confidence < 0.7;
          return true;
        });
      }

      setFixes(filtered);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to connect to backend. Make sure CodeAutoSpy server is running.');
      console.error('Fixes fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [searchParams, confidenceFilter]);

  useEffect(() => {
    setLoading(true);
    fetchFixes();
    const interval = setInterval(() => fetchFixes(false), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchFixes]);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: String(page), confidence: confidenceFilter });
  };

  const handleConfidenceChange = (value: string) => {
    setConfidenceFilter(value);
    setSearchParams({ page: '1', confidence: value });
  };

  const handleManualRefresh = () => {
    fetchFixes(true);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-500';
    if (confidence >= 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertTriangle className="w-16 h-16 text-yellow-500" />
          <h2 className="text-xl font-semibold text-foreground">Connection Error</h2>
          <p className="text-muted-foreground text-center max-w-md">{error}</p>
          <Button onClick={handleManualRefresh} variant="outline">
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Fixes</h1>
            <p className="text-muted-foreground mt-1">View all AI-generated fix attempts</p>
          </div>
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

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={confidenceFilter} onValueChange={handleConfidenceChange}>
            <SelectTrigger className="w-full sm:w-48 bg-card border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter confidence" />
            </SelectTrigger>
            <SelectContent>
              {confidenceOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === 'ALL' ? 'All Confidence' : `${opt} (${opt === 'HIGH' ? '≥90%' : opt === 'MEDIUM' ? '70-89%' : '<70%'})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingState message="Loading fixes..." />
        ) : fixes.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Wrench className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No fixes yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              When CodeAutoSpy detects a CI/CD failure and generates a fix, it will appear here.
            </p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Repository</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Error Type</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Confidence</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">PR</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {fixes.map((fix, idx) => (
                    <tr
                      key={fix.id}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <td className="p-4">
                        <div>
                          <span className="text-sm font-medium text-foreground">
                            {fix.failureEvent?.repoFullName || 'Unknown'}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {fix.failureEvent?.branch || 'Unknown branch'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {fix.failureEvent?.errorType || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-medium ${getConfidenceColor(fix.confidence)}`}>
                          {Math.round(fix.confidence * 100)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={fix.status} />
                      </td>
                      <td className="p-4">
                        {fix.prUrl ? (
                          <Link
                            to={fix.prUrl}
                            target="_blank"
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                            View
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(fix.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        )}

        {/* Real-time indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Auto-refresh every {REFRESH_INTERVAL / 1000} seconds</span>
        </div>
      </div>
    </Layout>
  );
}
