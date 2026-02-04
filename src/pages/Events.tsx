import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, Filter, ExternalLink } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getEvents, Event, Pagination } from '@/lib/api';

const mockEvents: Event[] = [
  { id: '1', repoFullName: 'acme/frontend', repoOwner: 'acme', repoName: 'frontend', branch: 'main', commitSha: 'abc123def456', status: 'FIXED', errorType: 'SyntaxError', errorMessage: 'Unexpected token', filePath: 'src/index.ts', lineNumber: 42, prUrl: 'https://github.com/acme/frontend/pull/123', confidence: 0.95, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), fixAttempts: [] },
  { id: '2', repoFullName: 'acme/backend', repoOwner: 'acme', repoName: 'backend', branch: 'develop', commitSha: 'def456ghi789', status: 'ANALYZING', errorType: 'TypeError', errorMessage: 'Cannot read property of undefined', filePath: 'src/api/handler.ts', lineNumber: 128, createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date().toISOString(), fixAttempts: [] },
  { id: '3', repoFullName: 'acme/mobile', repoOwner: 'acme', repoName: 'mobile', branch: 'feature/auth', commitSha: 'ghi789jkl012', status: 'FAILED', errorType: 'ReferenceError', errorMessage: 'Variable is not defined', filePath: 'src/screens/Login.tsx', lineNumber: 56, createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date().toISOString(), fixAttempts: [] },
  { id: '4', repoFullName: 'acme/api', repoOwner: 'acme', repoName: 'api', branch: 'main', commitSha: 'jkl012mno345', status: 'FIXING', errorType: 'ImportError', errorMessage: 'Module not found', filePath: 'src/utils/helpers.ts', lineNumber: 12, createdAt: new Date(Date.now() - 10800000).toISOString(), updatedAt: new Date().toISOString(), fixAttempts: [] },
  { id: '5', repoFullName: 'acme/dashboard', repoOwner: 'acme', repoName: 'dashboard', branch: 'main', commitSha: 'mno345pqr678', status: 'FIXED', errorType: 'SyntaxError', errorMessage: 'Missing semicolon', filePath: 'src/components/Chart.tsx', lineNumber: 89, prUrl: 'https://github.com/acme/dashboard/pull/45', confidence: 0.88, createdAt: new Date(Date.now() - 14400000).toISOString(), updatedAt: new Date().toISOString(), fixAttempts: [] },
  { id: '6', repoFullName: 'acme/service', repoOwner: 'acme', repoName: 'service', branch: 'main', commitSha: 'pqr678stu901', status: 'DETECTED', errorType: 'RuntimeError', errorMessage: 'Stack overflow', filePath: 'src/worker.ts', lineNumber: 234, createdAt: new Date(Date.now() - 18000000).toISOString(), updatedAt: new Date().toISOString(), fixAttempts: [] },
];

const statusOptions = ['ALL', 'FIXED', 'FAILED', 'ANALYZING', 'DETECTED', 'FIXING'];

export default function Events() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('repo') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params = {
          page: parseInt(searchParams.get('page') || '1'),
          limit: 10,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          repo: searchQuery || undefined,
        };
        const data = await getEvents(params);
        setEvents(data.events);
        setPagination(data.pagination);
      } catch {
        // Use mock data
        const filtered = mockEvents.filter(e => {
          const matchesSearch = !searchQuery || e.repoFullName.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
          return matchesSearch && matchesStatus;
        });
        setEvents(filtered);
        setPagination({ page: 1, limit: 10, total: filtered.length, pages: 1 });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [searchParams, searchQuery, statusFilter]);

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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground mt-1">Track CI/CD failure events and their status</p>
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
          <EmptyState 
            title="No events found" 
            description="No events match your current filters."
          />
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
                          <span className="block text-xs text-muted-foreground font-mono">{event.commitSha.slice(0, 7)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-foreground">{event.branch}</span>
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
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </Layout>
  );
}
