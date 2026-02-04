import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, Filter, ExternalLink, RefreshCw, AlertTriangle, Activity } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getEvents, Event, Pagination } from '@/lib/api';

const statusOptions = ['ALL', 'FIXED', 'FAILED', 'ANALYZING', 'DETECTED', 'FIXING'];
const REFRESH_INTERVAL = 10000; // 10 seconds

export default function Events() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('repo') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEvents = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: 10,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        repo: searchQuery || undefined,
      };
      const data = await getEvents(params);
      setEvents(data.events);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to connect to backend. Make sure CodeAutoSpy server is running.');
      console.error('Events fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [searchParams, searchQuery, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
    const interval = setInterval(() => fetchEvents(false), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: String(page), status: statusFilter, repo: searchQuery });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setSearchParams({ page: '1', status: statusFilter, repo: value });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setSearchParams({ page: '1', status: value, repo: searchQuery });
  };

  const handleManualRefresh = () => {
    fetchEvents(true);
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
            <h1 className="text-3xl font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground mt-1">Track CI/CD failure events and their status</p>
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by repository..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-40 bg-card border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === 'ALL' ? 'All Status' : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingState message="Loading events..." />
        ) : events.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No events yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Push code with a CI/CD failure to see events here. The system will automatically detect and attempt to fix failures.
            </p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Repository</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Branch</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Error Type</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, idx) => (
                    <tr
                      key={event.id}
                      className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <td className="p-4">
                        <div>
                          <span className="text-sm font-medium text-foreground">{event.repoFullName}</span>
                          <span className="block text-xs text-muted-foreground font-mono">{event.commitSha?.slice(0, 7) || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-foreground">{event.branch}</span>
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
