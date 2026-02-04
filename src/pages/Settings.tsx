import { useEffect, useState } from 'react';
import { 
  Server, 
  Globe, 
  Copy, 
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { LoadingState } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useServerStatus } from '@/hooks/useServerStatus';
import { toast } from 'sonner';

export default function Settings() {
  const { isOnline, serverInfo, lastChecked, refresh } = useServerStatus(10000);
  const [apiUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:3000');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const webhookUrl = `${apiUrl}/webhooks/github`;

  if (loading) {
    return (
      <Layout>
        <LoadingState message="Loading settings..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your CodeAutoSpy integration</p>
        </div>

        {/* Server Status */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Server className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Server Status</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    isOnline === null ? 'bg-muted-foreground animate-pulse' :
                    isOnline ? 'bg-success glow-success' : 'bg-destructive'
                  }`} />
                  <span className="text-sm font-medium text-foreground">
                    {isOnline === null ? 'Checking...' : isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={refresh}>
                  Refresh
                </Button>
              </div>

              {serverInfo && (
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="text-sm font-medium text-foreground">{serverInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Version</span>
                    <span className="text-sm font-medium text-foreground">{serverInfo.version}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {lastChecked && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">Last checked</span>
                  <p className="text-sm font-medium text-foreground">
                    {lastChecked.toLocaleTimeString()}
                  </p>
                </div>
              )}

              {!isOnline && isOnline !== null && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-destructive">Server Unreachable</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Make sure the backend server is running at {apiUrl}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* API Endpoint */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">API Configuration</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">API Endpoint</label>
              <div className="flex gap-2">
                <Input 
                  value={apiUrl} 
                  readOnly 
                  className="bg-muted/30 border-border font-mono text-sm"
                />
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(apiUrl, 'API URL')}
                  className="shrink-0"
                >
                  {copied === 'API URL' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">GitHub Webhook URL</label>
              <div className="flex gap-2">
                <Input 
                  value={webhookUrl} 
                  readOnly 
                  className="bg-muted/30 border-border font-mono text-sm"
                />
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                  className="shrink-0"
                >
                  {copied === 'Webhook URL' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook Setup Guide */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Info className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Webhook Setup Guide</h3>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <p>To set up the GitHub webhook for your repository:</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Go to your GitHub repository settings</li>
              <li>Navigate to <span className="text-foreground font-medium">Webhooks → Add webhook</span></li>
              <li>Set the Payload URL to: <code className="text-primary bg-muted/50 px-1 rounded">{webhookUrl}</code></li>
              <li>Set Content type to <span className="text-foreground font-medium">application/json</span></li>
              <li>Select <span className="text-foreground font-medium">Workflow runs</span> under "Let me select individual events"</li>
              <li>Click <span className="text-foreground font-medium">Add webhook</span></li>
            </ol>
          </div>
        </div>

        {/* Environment Info */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Environment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Mode</span>
              <p className="text-sm font-medium text-foreground mt-1">
                {import.meta.env.MODE}
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Base URL</span>
              <p className="text-sm font-medium text-foreground mt-1 font-mono">
                {import.meta.env.BASE_URL}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
