import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatusBadge } from '@/components/ui/status-badge';
import { CodeBlock } from '@/components/ui/code-block';
import { LoadingState } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { getEvent, Event, FixAttempt } from '@/lib/api';

const mockEvent: Event = {
  id: '1',
  repoFullName: 'acme/frontend',
  repoOwner: 'acme',
  repoName: 'frontend',
  branch: 'main',
  commitSha: 'abc123def456789',
  status: 'FIXED',
  errorType: 'SyntaxError',
  errorMessage: 'Unexpected token \')\'. Expected an identifier or keyword.',
  filePath: 'src/components/Dashboard.tsx',
  lineNumber: 42,
  prUrl: 'https://github.com/acme/frontend/pull/123',
  confidence: 0.95,
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  updatedAt: new Date().toISOString(),
  fixAttempts: [
    {
      id: 'fix1',
      failureEventId: '1',
      originalCode: `const handleClick = (event) => {
  console.log(event.target.value)
  setData(prevData => {
    ...prevData,
    clicked: true
  });
};`,
      fixedCode: `const handleClick = (event) => {
  console.log(event.target.value);
  setData(prevData => ({
    ...prevData,
    clicked: true
  }));
};`,
      diffSummary: 'Added missing parentheses around object literal in arrow function return and semicolons',
      confidence: 0.95,
      status: 'success',
      prUrl: 'https://github.com/acme/frontend/pull/123',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
};

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await getEvent(id);
        setEvent(data);
      } catch {
        // Use mock data
        setEvent(mockEvent);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <LoadingState message="Loading event details..." />
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <EmptyState 
          title="Event not found" 
          description="The event you're looking for doesn't exist."
          action={
            <Button onClick={() => navigate('/events')}>Back to Events</Button>
          }
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Events</span>
        </button>

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
                {event.commitSha.slice(0, 7)}
              </span>
            </div>
          </div>
          <StatusBadge status={event.status} className="self-start" />
        </div>

        {/* Event Info */}
        <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Error Type</span>
            <p className="text-sm font-medium text-foreground mt-1">{event.errorType}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">File</span>
            <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-1">
              <FileCode className="w-4 h-4" />
              {event.filePath}:{event.lineNumber}
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
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Error Details
          </h3>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-foreground font-mono">{event.errorMessage}</p>
          </div>
        </div>

        {/* Fix Attempts */}
        {event.fixAttempts && event.fixAttempts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Fix Attempts</h3>
            
            {event.fixAttempts.map((fix: FixAttempt, index: number) => (
              <div key={fix.id} className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      fix.status === 'success' ? 'bg-success/20 text-success' : 
                      fix.status === 'failed' ? 'bg-destructive/20 text-destructive' :
                      'bg-warning/20 text-warning'
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <CodeBlock
                    code={fix.originalCode}
                    title="Original Code"
                    variant="removed"
                  />
                  <CodeBlock
                    code={fix.fixedCode}
                    title="Fixed Code"
                    variant="added"
                  />
                </div>
              </div>
            ))}
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
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  fix.status === 'success' ? 'bg-success' : 
                  fix.status === 'failed' ? 'bg-destructive' : 'bg-warning'
                }`} />
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Fix Attempt #{idx + 1} - {fix.status === 'success' ? 'Successful' : 'Failed'}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {format(new Date(fix.createdAt), 'MMM d, yyyy h:mm:ss a')}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                event.status === 'FIXED' ? 'bg-success' : 
                event.status === 'FAILED' ? 'bg-destructive' : 'bg-warning'
              }`} />
              <div>
                <span className="text-sm font-medium text-foreground">
                  Status: {event.status}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {format(new Date(event.updatedAt), 'MMM d, yyyy h:mm:ss a')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
