import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Types
export interface Event {
  id: string;
  repoFullName: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  commitSha: string;
  status: 'FIXED' | 'FAILED' | 'ANALYZING' | 'DETECTED' | 'FIXING';
  errorType: string;
  errorMessage: string;
  filePath: string;
  lineNumber: number;
  prUrl?: string;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
  fixAttempts: FixAttempt[];
}

export interface FixAttempt {
  id: string;
  failureEventId: string;
  originalCode: string;
  fixedCode: string;
  diffSummary: string;
  confidence: number;
  status: 'success' | 'failed' | 'pending';
  prUrl?: string;
  createdAt: string;
  failureEvent?: {
    repoFullName: string;
    branch: string;
    errorType: string;
  };
}

export interface Stats {
  totalEvents: number;
  fixedEvents: number;
  failedEvents: number;
  pendingEvents: number;
  successRate: number;
  recentEvents: Event[];
  topRepos: { repo: string; count: number }[];
  eventsOverTime?: { date: string; count: number }[];
}

export interface QueueStats {
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  active: number;
  waiting: number;
  failed: number;
  recentFailed: Array<{
    id: string;
    data: Record<string, unknown>;
    failedReason: string;
    attemptsMade: number;
  }>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// API Functions
export const getStats = async (): Promise<Stats> => {
  const { data } = await api.get('/api/stats');
  return data;
};

export const getEvents = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  repo?: string;
}): Promise<{ events: Event[]; pagination: Pagination }> => {
  const { data } = await api.get('/api/events', { params });
  return data;
};

export const getEvent = async (id: string): Promise<Event> => {
  const { data } = await api.get(`/api/events/${id}`);
  return data;
};

export const getFixes = async (params: {
  page?: number;
  limit?: number;
}): Promise<{ fixes: FixAttempt[]; pagination: Pagination }> => {
  const { data } = await api.get('/api/fixes', { params });
  return data;
};

export const getQueueStats = async (): Promise<QueueStats> => {
  const { data } = await api.get('/api/queue');
  return data;
};

export const retryFailedJobs = async (): Promise<{ message: string; jobIds: string[] }> => {
  const { data } = await api.post('/api/queue/retry-failed');
  return data;
};

export const cleanQueue = async (): Promise<{ message: string }> => {
  const { data } = await api.post('/api/queue/clean');
  return data;
};

export const getHealth = async (): Promise<{ status: string; timestamp: string }> => {
  const { data } = await api.get('/webhooks/health');
  return data;
};

export const getServerInfo = async (): Promise<{ name: string; version: string; status: string }> => {
  const { data } = await api.get('/');
  return data;
};
