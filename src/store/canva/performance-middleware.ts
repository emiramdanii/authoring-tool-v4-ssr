// ═══════════════════════════════════════════════════════════════
// PERFORMANCE MIDDLEWARE — Zustand middleware for dev-only perf tracking
// ═══════════════════════════════════════════════════════════════
// Logs slow state updates (>16ms), detects action storms,
// and provides a performance report method.
// Only active in development mode — no-op in production.
// ═══════════════════════════════════════════════════════════════

import type { StateCreator, StoreApi } from 'zustand';
import {
  SLOW_UPDATE_MS,
  ACTION_STORM_WINDOW_MS,
  ACTION_STORM_THRESHOLD,
} from '@/lib/performance';
import { logger } from '@/core/utils/logger';

const IS_DEV = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

// ── Action tracking ────────────────────────────────────────────

interface ActionRecord {
  name: string;
  timestamp: number;
  duration: number;
}

interface PerformanceStats {
  slowUpdates: ActionRecord[];
  actionFrequency: Record<string, number>;
  stormDetections: { timestamp: number; actionCount: number; windowMs: number }[];
  totalUpdates: number;
  totalDuration: number;
}

const stats: PerformanceStats = {
  slowUpdates: [],
  actionFrequency: {},
  stormDetections: [],
  totalUpdates: 0,
  totalDuration: 0,
};

// Rolling window of recent actions for storm detection
const recentActions: { name: string; timestamp: number }[] = [];

function detectStorm(actionName: string): void {
  const now = performance.now();
  recentActions.push({ name: actionName, timestamp: now });

  // Prune old entries outside the window
  const cutoff = now - ACTION_STORM_WINDOW_MS;
  while (recentActions.length > 0 && recentActions[0].timestamp < cutoff) {
    recentActions.shift();
  }

  // Check for storm
  if (recentActions.length >= ACTION_STORM_THRESHOLD) {
    const stormRecord = {
      timestamp: Date.now(),
      actionCount: recentActions.length,
      windowMs: ACTION_STORM_WINDOW_MS,
    };
    stats.stormDetections.push(stormRecord);

    // Keep last 20 storms
    if (stats.stormDetections.length > 20) {
      stats.stormDetections = stats.stormDetections.slice(-20);
    }

    logger.warn('PerfMiddleware', `Action storm detected: ${recentActions.length} updates in ${ACTION_STORM_WINDOW_MS}ms — ${recentActions.map(a => a.name).join(', ')}`);

    // Clear to avoid repeated warnings
    recentActions.length = 0;
  }
}

export function trackAction(actionName: string, duration: number): void {
  stats.totalUpdates++;
  stats.totalDuration += duration;

  // Track frequency
  stats.actionFrequency[actionName] = (stats.actionFrequency[actionName] || 0) + 1;

  // Track slow updates
  if (duration > SLOW_UPDATE_MS) {
    const record: ActionRecord = {
      name: actionName,
      timestamp: Date.now(),
      duration,
    };
    stats.slowUpdates.push(record);

    // Keep last 50 slow updates
    if (stats.slowUpdates.length > 50) {
      stats.slowUpdates = stats.slowUpdates.slice(-50);
    }

    logger.warn('PerfMiddleware', `Slow Zustand update: "${actionName}" took ${duration.toFixed(1)}ms (> ${SLOW_UPDATE_MS}ms threshold)`);
  }

  // Detect storms
  detectStorm(actionName);
}

// ── Public API ─────────────────────────────────────────────────

export function getPerformanceReport(): PerformanceStats & {
  avgUpdateMs: number;
  topActions: { name: string; count: number }[];
} {
  return {
    ...stats,
    avgUpdateMs: stats.totalUpdates > 0 ? stats.totalDuration / stats.totalUpdates : 0,
    topActions: Object.entries(stats.actionFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count })),
  };
}

export function clearPerformanceStats(): void {
  stats.slowUpdates = [];
  stats.actionFrequency = {};
  stats.stormDetections = [];
  stats.totalUpdates = 0;
  stats.totalDuration = 0;
  recentActions.length = 0;
}

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE — Wraps Zustand store creation with perf tracking
// ═══════════════════════════════════════════════════════════════

type AnyState = Record<string, unknown>;

export function withPerformanceMiddleware<T extends AnyState>(
  config: StateCreator<T>,
): StateCreator<T> {
  if (!IS_DEV) return config;

  return (set, get, api) => {
    // Wrap the set function to track performance
    const trackedSet: typeof set = (partial, replace) => {
      const start = performance.now();
      set(partial, replace);
      const duration = performance.now() - start;

      // Try to determine the action name from the partial state keys
      let actionName = 'unknown';
      if (typeof partial === 'function') {
        // Try to infer action name from the result
        const result = partial(get());
        if (result && typeof result === 'object') {
          const keys = Object.keys(result);
          actionName = keys.length > 0 ? keys.slice(0, 3).join('+') : 'empty-update';
        }
      } else if (partial && typeof partial === 'object') {
        const keys = Object.keys(partial);
        actionName = keys.length > 0 ? keys.slice(0, 3).join('+') : 'empty-update';
      }

      trackAction(actionName, duration);
    };

    return config(trackedSet, get, api);
  };
}
