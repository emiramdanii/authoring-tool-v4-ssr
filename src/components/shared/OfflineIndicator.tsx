'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, CloudOff, RefreshCw } from 'lucide-react';
import { useServiceWorker } from '@/hooks/use-service-worker';
import { getQueueStatus, type SyncQueueStatus } from '@/lib/offline-sync';
import { useCanvaStore } from '@/store/canva-store';
import { cn } from '@/lib/utils';

/**
 * OfflineIndicator — Non-intrusive online/offline status indicator
 *
 * Appears in the bottom-left corner when offline.
 * Shows:
 *   - Online/offline icon
 *   - Sync queue count (pending changes to sync)
 *   - Syncing animation when flushing queue
 *   - Mode-aware: simpler labels in sederhana mode
 *
 * When online, the indicator is hidden (or shows a subtle online dot).
 */

export function OfflineIndicator() {
  const { isOnline } = useServiceWorker();
  const [queueStatus, setQueueStatus] = useState<SyncQueueStatus>({ pending: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const isSederhana = teacherMode;

  // Poll queue status periodically when offline
  useEffect(() => {
    const updateStatus = () => {
      setQueueStatus(getQueueStatus());
    };

    updateStatus();

    const interval = setInterval(updateStatus, 5000);

    // Also update on custom events
    const handleQueueChange = () => updateStatus();
    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncEnd = () => {
      setIsSyncing(false);
      updateStatus();
    };

    window.addEventListener('silse-queue-changed', handleQueueChange);
    window.addEventListener('silse-sync-start', handleSyncStart);
    window.addEventListener('silse-sync-end', handleSyncEnd);

    return () => {
      clearInterval(interval);
      window.removeEventListener('silse-queue-changed', handleQueueChange);
      window.removeEventListener('silse-sync-start', handleSyncStart);
      window.removeEventListener('silse-sync-end', handleSyncEnd);
    };
  }, []);

  // Don't render if online and no pending items
  if (isOnline && queueStatus.pending === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-all duration-300',
        isOnline
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
          : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
      )}
      role="status"
      aria-live="polite"
      aria-label={isOnline ? 'Online' : 'Offline'}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          {queueStatus.pending > 0 ? (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>refresh</span>
              {isSederhana ? `Menyinkronkan (${queueStatus.pending})` : `Menyinkronkan (${queueStatus.pending})`}
            </span>
          ) : (
            <span>Online</span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>{isSederhana ? 'Tidak Ada Internet' : 'Offline'}</span>
          {queueStatus.pending > 0 && (
            <span className="flex items-center gap-1 ml-1 text-xs opacity-80">
              <CloudOff className="h-3 w-3" />
              {isSederhana ? `${queueStatus.pending} menunggu` : `${queueStatus.pending} tertunda`}
            </span>
          )}
        </>
      )}
    </div>
  );
}
