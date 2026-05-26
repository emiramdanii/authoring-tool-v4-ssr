// ═══════════════════════════════════════════════════════════════════
// TRANSACTION LOG — Dev-mode mutation tracking for the SILSE pipeline
// ═══════════════════════════════════════════════════════════════════
// FASE 2 — Transaction log system for the stabilization roadmap.
//
// Records every significant mutation in the render pipeline so
// developers can trace "why did the canvas re-render?" in real time.
//
// DESIGN PRINCIPLE: Module-level mutable ring buffer, NOT React state.
// - No re-renders triggered by log entries
// - Zero cost in production (all code tree-shaken)
// - Accessible via browser console: __silseTransactionLog
//
// LOG ENTRY TYPES:
//   ADD_BLOCK      — New block added to schema
//   UPDATE_SCHEMA  — Block content updated
//   LAYOUT_RECALC  — resolveSceneLayout() called
//   SCENE_SPLIT    — SceneOverflowEngine computed new plan
//   PAGE_CHANGE    — User navigated to different page
//   HISTORY_PUSH   — Snapshot pushed to undo stack
//   COMMIT_UPDATE  — commitSchemaUpdate() called
//
// USAGE (browser console):
//   __silseTransactionLog.getRecent(20)   // Last 20 entries
//   __silseTransactionLog.clear()         // Clear log
//   __silseTransactionLog.getStats()      // Count by type
// ═══════════════════════════════════════════════════════════════════

// ── Transaction Types ──────────────────────────────────────────

export type TransactionType =
  | 'ADD_BLOCK'
  | 'DELETE_BLOCK'
  | 'UPDATE_SCHEMA'
  | 'LAYOUT_RECALC'
  | 'SCENE_SPLIT'
  | 'PAGE_CHANGE'
  | 'HISTORY_PUSH'
  | 'COMMIT_UPDATE'
  | 'SCENE_NAV'
  | 'MEASUREMENT_COMMIT'
  | 'COMPRESSION_DECISION';

// ── Transaction Entry ──────────────────────────────────────────

export interface TransactionEntry {
  /** Monotonic sequence number */
  seq: number;
  /** Transaction type */
  type: TransactionType;
  /** Timestamp (performance.now) */
  ts: number;
  /** Page index (if applicable) */
  pageIndex?: number;
  /** Block ID (if applicable) */
  blockId?: string;
  /** Block type (if applicable) */
  blockType?: string;
  /** Human-readable description */
  detail?: string;
  /** Duration in ms (for performance-critical entries) */
  durationMs?: number;
}

// ── Ring Buffer ────────────────────────────────────────────────

const MAX_LOG_SIZE = 200;

const entries: TransactionEntry[] = [];
let seqCounter = 0;

// ── Log Function ───────────────────────────────────────────────

/**
 * Record a transaction in the dev-mode log.
 * No-op in production — entire call is wrapped in env check.
 */
export function logTransaction(
  type: TransactionType,
  data?: Partial<Omit<TransactionEntry, 'seq' | 'ts' | 'type'>>
): void {
  if (process.env.NODE_ENV === 'production') return;

  const entry: TransactionEntry = {
    seq: ++seqCounter,
    type,
    ts: performance.now(),
    ...data,
  };

  // Ring buffer: push new, shift old if over limit
  entries.push(entry);
  if (entries.length > MAX_LOG_SIZE) {
    entries.shift();
  }
}

// ── Query Functions ────────────────────────────────────────────

/**
 * Get the most recent N log entries.
 * Returns in chronological order (oldest first).
 */
export function getRecentTransactions(count: number = 20): TransactionEntry[] {
  return entries.slice(-count);
}

/**
 * Get all log entries.
 */
export function getAllTransactions(): readonly TransactionEntry[] {
  return entries;
}

/**
 * Clear the transaction log.
 */
export function clearTransactionLog(): void {
  entries.length = 0;
  seqCounter = 0;
}

/**
 * Get statistics: count of entries by type.
 */
export function getTransactionStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const entry of entries) {
    stats[entry.type] = (stats[entry.type] || 0) + 1;
  }
  return stats;
}

// ── Browser Console Bridge ─────────────────────────────────────

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as any).__silseTransactionLog = {
    getRecent: getRecentTransactions,
    getAll: getAllTransactions,
    clear: clearTransactionLog,
    getStats: getTransactionStats,
  };
}
