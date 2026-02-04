import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ExternalLink, Filter } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getFixes, FixAttempt, Pagination } from '@/lib/api';

const mockFixes: FixAttempt[] = [
  {
    id: 'fix1',
    failureEventId: '1',
    originalCode: 'const x = (',
    fixedCode: 'const x = () => {',
    diffSummary: 'Added missing parenthesis and function body',
    confidence: 0.95,
    status: 'success',
    prUrl: 'https://github.com/acme/frontend/pull/123',
    createdAt: new Date().toISOString(),
    failureEvent: { repoFullName: 'acme/frontend', branch: 'main', errorType: 'SyntaxError' },
  },
  {
    id: 'fix2',
    failureEventId: '2',
    originalCode: 'import { thing } from "./missing"',
    fixedCode: 'import { thing } from "./utils/thing"',
    diffSummary: 'Corrected import path',
    confidence: 0.88,
    status: 'success',
    prUrl: 'https://github.com/acme/backend/pull/45',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    failureEvent: { repoFullName: 'acme/backend', branch: 'develop', errorType: 'ImportError' },
  },
  {
    id: 'fix3',
    failureEventId: '3',
    originalCode: 'arr.map(x => x.value',
    fixedCode: 'arr.map(x => x.value)',
    diffSummary: 'Added missing closing parenthesis',
    confidence: 0.92,
    status: 'success',
    prUrl: 'https://github.com/acme/mobile/pull/78',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    failureEvent: { repoFullName: 'acme/mobile', branch: 'main', errorType: 'SyntaxError' },
  },
  {
    id: 'fix4',
    failureEventId: '4',
    originalCode: 'const result = await fetch(url',
    fixedCode: 'const result = await fetch(url);',
    diffSummary: 'Added missing closing parenthesis and semicolon',
    confidence: 0.75,
    status: 'failed',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    failureEvent: { repoFullName: 'acme/api', branch: 'feature/api', errorType: 'SyntaxError' },
  },
  {
    id: 'fix5',
    failureEventId: '5',
    originalCode: 'if (condition) return',
    fixedCode: 'if (condition) return null;',
    diffSummary: 'Added explicit return value',
    confidence: 0.82,
    status: 'pending',
    createdAt: new Date(Date.now() - 18000000).toISOString(),
    failureEvent: { repoFullName: 'acme/dashboard', branch: 'main', errorType: 'TypeError' },
  },
];

const confidenceOptions = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];

export default function Fixes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [fixes, setFixes] = useState<FixAttempt[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [confidenceFilter, setConfidenceFilter] = useState(searchParams.get('confidence') || 'ALL');

  useEffect(() => {
    const fetchFixes = async () => {
      setLoading(true);
      try {
        const params = {
          page: parseInt(searchParams.get('page') || '1'),
          limit: 10,
        };
        const data = await getFixes(params);
        setFixes(data.fixes);
        setPagination(data.pagination);
      } catch {
        // Use mock data and filter
        let filtered = [...mockFixes];
        if (confidenceFilter !== 'ALL') {
          filtered = filtered.filter(f => {
            if (confidenceFilter === 'HIGH') return f.confidence >= 0.9;
            if (confidenceFilter === 'MEDIUM') return f.confidence >= 0.7 && f.confidence < 0.9;
            if (confidenceFilter === 'LOW') return f.confidence < 0.7;
            return true;
          });
        }
        setFixes(filtered);
        setPagination({ page: 1, limit: 10, total: filtered.length, pages: 1 });
      } finally {
        setLoading(false);
      }
    };

    fetchFixes();
  }, [searchParams, confidenceFilter]);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: String(page), confidence: confidenceFilter });
  };

  const handleConfidenceChange = (value: string) => {
    setConfidenceFilter(value);
    setSearchParams({ page: '1', confidence: value });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-success';
    if (confidence >= 0.7) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fixes</h1>
          <p className="text-muted-foreground mt-1">View all AI-generated fix attempts</p>
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
          <EmptyState 
            title="No fixes found" 
            description="No fix attempts match your current filters."
          />
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
      </div>
    </Layout>
  );
}
