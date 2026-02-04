import { useState, useEffect, useCallback } from 'react';
import { getHealth, getServerInfo } from '@/lib/api';

export function useServerStatus(pollInterval = 30000) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [serverInfo, setServerInfo] = useState<{ name: string; version: string } | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const [health, info] = await Promise.all([
        getHealth().catch(() => null),
        getServerInfo().catch(() => null),
      ]);
      
      setIsOnline(health?.status === 'healthy' || info?.status === 'running');
      if (info) {
        setServerInfo({ name: info.name, version: info.version });
      }
      setLastChecked(new Date());
    } catch {
      setIsOnline(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, pollInterval);
    return () => clearInterval(interval);
  }, [checkStatus, pollInterval]);

  return { isOnline, lastChecked, serverInfo, refresh: checkStatus };
}
