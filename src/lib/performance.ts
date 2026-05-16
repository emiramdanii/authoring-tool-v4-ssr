// ═══════════════════════════════════════════════════════════════
// PERFORMANCE UTILITY — Dev-only performance measurement helpers
// ═══════════════════════════════════════════════════════════════
// Provides reusable timing, profiling, and memory utilities.
// All functions are no-ops in production (tree-shaken away).
// ═══════════════════════════════════════════════════════════════

// ── Threshold constants ────────────────────────────────────────
/** 16ms = one frame at 60fps. Renders slower than this drop frames. */
export const SLOW_RENDER_MS = 16;
/** 50ms = noticeable lag. Renders slower than this feel janky. */
export const CRITICAL_RENDER_MS = 50;
/** 16ms threshold for slow state updates (Zustand middleware) */
export const SLOW_UPDATE_MS = 16;
/** Window for detecting action storms (multiple rapid updates) */
export const ACTION_STORM_WINDOW_MS = 100;
/** Number of actions within the window that constitutes a storm */
export const ACTION_STORM_THRESHOLD = 8;

const IS_DEV = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

// ── Render timing ──────────────────────────────────────────────

/**
 * Wraps a synchronous function with console.time/timeEnd measurement.
 * No-op in production.
 */
export function measureRender(componentName: string, fn: () => void): void {
  if (!IS_DEV) {
    fn();
    return;
  }
  console.time(`⏱ ${componentName}`);
  fn();
  console.timeEnd(`⏱ ${componentName}`);
}

/**
 * Creates a React.Profiler onRender callback for the given component name.
 * Logs slow/critical renders and returns data for the PerformanceMonitor.
 * Only active in development mode.
 */
export function createProfilerCallback(componentName: string) {
  return (
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number,
  ) => {
    if (!IS_DEV) return;

    // Dispatch to the global performance collector
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__SILSE_PERF__) {
      const collector = (window as unknown as Record<string, { addRender: (name: string, phase: string, actual: number, base: number, commit: number) => void }>).__SILSE_PERF__;
      collector.addRender(componentName || id, phase, actualDuration, baseDuration, commitTime);
    }

    // Console warnings for slow renders
    if (actualDuration > CRITICAL_RENDER_MS) {
      console.warn(
        `🔴 CRITICAL render: ${componentName || id} (${phase}) took ${actualDuration.toFixed(1)}ms (base: ${baseDuration.toFixed(1)}ms)`,
      );
    } else if (actualDuration > SLOW_RENDER_MS) {
      console.warn(
        `🟡 Slow render: ${componentName || id} (${phase}) took ${actualDuration.toFixed(1)}ms (base: ${baseDuration.toFixed(1)}ms)`,
      );
    }
  };
}

// ── Memory usage ───────────────────────────────────────────────

export interface MemoryStats {
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  usedMB?: string;
  totalMB?: string;
  available: boolean;
}

/**
 * Returns memory usage stats if `performance.memory` is available
 * (Chromium-based browsers only).
 */
export function getMemoryUsage(): MemoryStats {
  if (
    typeof performance !== 'undefined' &&
    'memory' in performance &&
    performance.memory
  ) {
    const mem = (performance as unknown as { memory: { jsHeapSizeLimit: number; totalJSHeapSize: number; usedJSHeapSize: number } }).memory;
    return {
      jsHeapSizeLimit: mem.jsHeapSizeLimit,
      totalJSHeapSize: mem.totalJSHeapSize,
      usedJSHeapSize: mem.usedJSHeapSize,
      usedMB: (mem.usedJSHeapSize / 1048576).toFixed(1),
      totalMB: (mem.totalJSHeapSize / 1048576).toFixed(1),
      available: true,
    };
  }
  return { available: false };
}

// ── Async timing ───────────────────────────────────────────────

/**
 * Wraps an async function with timing measurement.
 * Returns the result of the function. Logs duration in dev.
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!IS_DEV) return fn();

  const start = performance.now();
  try {
    return await fn();
  } finally {
    const elapsed = performance.now() - start;
    if (elapsed > SLOW_RENDER_MS) {
      console.warn(`⏱ Async ${name}: ${elapsed.toFixed(1)}ms`);
    } else {
      console.log(`⏱ Async ${name}: ${elapsed.toFixed(1)}ms`);
    }
  }
}

// ── Global performance collector (for PerformanceMonitor) ──────

export interface RenderEntry {
  componentName: string;
  phase: string;
  actualDuration: number;
  baseDuration: number;
  commitTime: number;
  timestamp: number;
}

export interface PerfCollector {
  renders: RenderEntry[];
  addRender: (name: string, phase: string, actual: number, base: number, commit: number) => void;
  getSlowRenders: (threshold?: number) => RenderEntry[];
  getRenderCounts: () => Record<string, number>;
  clear: () => void;
}

/**
 * Initializes the global performance collector on `window.__SILSE_PERF__`.
 * Called once by PerformanceMonitor on mount. No-op in production.
 */
export function initPerfCollector(): PerfCollector | null {
  if (!IS_DEV) return null;
  if (typeof window === 'undefined') return null;

  const existing = (window as unknown as Record<string, unknown>).__SILSE_PERF__;
  if (existing) return existing as PerfCollector;

  const collector: PerfCollector = {
    renders: [],
    addRender(name, phase, actual, base, commit) {
      collector.renders.push({
        componentName: name,
        phase,
        actualDuration: actual,
        baseDuration: base,
        commitTime: commit,
        timestamp: Date.now(),
      });
      // Keep last 500 entries to prevent memory leaks
      if (collector.renders.length > 500) {
        collector.renders = collector.renders.slice(-300);
      }
    },
    getSlowRenders(threshold = SLOW_RENDER_MS) {
      return collector.renders
        .filter(r => r.actualDuration > threshold)
        .sort((a, b) => b.actualDuration - a.actualDuration);
    },
    getRenderCounts() {
      const counts: Record<string, number> = {};
      for (const r of collector.renders) {
        counts[r.componentName] = (counts[r.componentName] || 0) + 1;
      }
      return counts;
    },
    clear() {
      collector.renders = [];
    },
  };

  (window as unknown as Record<string, unknown>).__SILSE_PERF__ = collector;
  return collector;
}
