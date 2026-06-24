/**
 * Offline Sync — Queue-based sync system for offline DB saves
 *
 * When offline, DB saves are queued in localStorage.
 * When back online, queued saves are replayed in order.
 * Deduplication: only the latest save per project is kept.
 *
 * Storage key: `silse_sync_queue`
 */

import { canvaPagesToSavePages } from '@/lib/save-utils';
import { logger } from '@/core/utils/logger';

// ── Types ──────────────────────────────────────────────────────

export interface SyncQueueItem {
  projectId: string;
  data: SyncPayload;
  timestamp: number;
  id: string; // unique ID for dedup tracking
}

export interface SyncPayload {
  pages: ReturnType<typeof canvaPagesToSavePages>;
  ratioId: string;
  meta: {
    title: string;
    subject?: string;
    grade?: string;
    // V5-PATCH-02 (P2): Added metadata-only fields for project listing / DB metadata.
    semester?: string;
    teacherName?: string;
    schoolName?: string;
  };
  authoringData: Record<string, unknown>;
}

export interface SyncQueueStatus {
  pending: number;
}

const QUEUE_KEY = 'silse_sync_queue';

// ── Queue Persistence ──────────────────────────────────────────

function readQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SyncQueueItem[];
  } catch {
    return [];
  }
}

function writeQueue(queue: SyncQueueItem[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage might be full — try clearing old items
    try {
      const trimmed = queue.slice(-5); // Keep only last 5
      localStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
    } catch {
      logger.warn('offline-sync', 'Failed to write queue to localStorage');
    }
  }
  // Notify listeners that queue changed
  window.dispatchEvent(new CustomEvent('silse-queue-changed'));
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Enqueue a save for when the app is offline.
 * Deduplication: if a save for the same projectId already exists in the queue,
 * it is replaced with the latest data (keeping its position or moving to end).
 */
export function enqueueSave(projectId: string, data: SyncPayload): void {
  const queue = readQueue();

  // Remove existing items for the same project (dedup — keep only latest)
  const filtered = queue.filter((item) => item.projectId !== projectId);

  // Add new item at the end
  filtered.push({
    projectId,
    data,
    timestamp: Date.now(),
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  });

  writeQueue(filtered);
}

/**
 * Flush the entire sync queue — process all pending saves in order.
 * Called when the app comes back online.
 *
 * Returns the number of successfully flushed items.
 */
export async function flushQueue(): Promise<number> {
  const queue = readQueue();
  if (queue.length === 0) return 0;

  window.dispatchEvent(new CustomEvent('silse-sync-start'));

  let successCount = 0;
  const failed: SyncQueueItem[] = [];

  for (const item of queue) {
    try {
      const res = await fetch(`/api/projects/${item.projectId}/save`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });

      if (res.ok) {
        successCount++;
      } else {
        // Server error — keep in queue to retry later
        failed.push(item);
      }
    } catch {
      // Network error — keep in queue to retry later
      failed.push(item);
    }
  }

  // Update queue with only failed items
  writeQueue(failed);

  window.dispatchEvent(new CustomEvent('silse-sync-end'));

  return successCount;
}

/**
 * Get the current queue status.
 */
export function getQueueStatus(): SyncQueueStatus {
  const queue = readQueue();
  return { pending: queue.length };
}

/**
 * Clear all pending items from the queue.
 */
export function clearQueue(): void {
  writeQueue([]);
}

/**
 * Auto-flush: listen for 'online' events and flush the queue.
 * Should be called once on app initialization.
 */
export function initAutoFlush(): () => void {
  const handleOnline = async () => {
    const status = getQueueStatus();
    if (status.pending > 0) {
      try {
        const count = await flushQueue();
        if (count > 0) {
          if (process.env.NODE_ENV === 'development') console.log(`[offline-sync] Flushed ${count} pending saves`);
        }
      } catch (error) {
        logger.warn('offline-sync', 'Auto-flush failed: ' + String(error));
      }
    }
  };

  // Flush on 'online' event
  window.addEventListener('online', handleOnline);

  // Also listen for our custom 'silse-online' event (from use-service-worker)
  window.addEventListener('silse-online', handleOnline);

  // If already online, try flushing immediately (in case items were left from last session)
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    // Delay slightly to avoid race conditions with app initialization
    setTimeout(handleOnline, 3000);
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('silse-online', handleOnline);
  };
}
