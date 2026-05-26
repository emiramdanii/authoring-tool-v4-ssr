// ═══════════════════════════════════════════════════════════════════
// OPERATION JOURNAL — High-level edit operation log
// ═══════════════════════════════════════════════════════════════════
// FASE 5.2: Unlike PatchHistory (which stores low-level immer patches),
// the Operation Journal records HIGH-LEVEL operations:
//
//   "User inserted cover block at page 0"
//   "AI updated 3 blocks in materi section"
//   "Sync reordered 5 blocks on page 2"
//
// This enables:
//   1. Audit trail — what happened and when
//   2. AI awareness — AI can understand user intent
//   3. Collaboration sync — replay operations on other clients
//   4. Time-travel debugging — see what led to a bug
//   5. Analytics — measure editing patterns
//
// DESIGN PRINCIPLES:
//   - Lightweight: only stores metadata, not full block data
//   - Append-only: entries are never modified
//   - Queryable: by time range, source, command type, block ID
//   - Bounded: max entries with oldest-first eviction
//   - Separate from PatchHistory: this is about INTENT, not STATE
// ═══════════════════════════════════════════════════════════════════

import type { CommandType, CommandSource, Command } from './types';

// ── Journal Entry ────────────────────────────────────────────────

export interface JournalEntry {
  /** Unique entry ID */
  id: string;
  /** Command ID that created this entry */
  commandId: string;
  /** Type of operation */
  type: CommandType;
  /** Source of the operation */
  source: CommandSource;
  /** Timestamp */
  timestamp: number;
  /** Page index affected */
  pageIndex?: number;
  /** Block IDs affected */
  blockIds: string[];
  /** Block types affected */
  blockTypes: string[];
  /** Human-readable description */
  description: string;
  /** Duration of execution in ms */
  durationMs: number;
  /** Whether the operation succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Parent command ID (for batch operations) */
  parentCommandId?: string;
  /** Number of blocks affected */
  affectedCount: number;
}

// ── Journal Query ────────────────────────────────────────────────

export interface JournalQuery {
  /** Filter by command type */
  type?: CommandType | CommandType[];
  /** Filter by source */
  source?: CommandSource | CommandSource[];
  /** Filter by time range (ms since epoch) */
  fromTime?: number;
  toTime?: number;
  /** Filter by page index */
  pageIndex?: number;
  /** Filter by block ID */
  blockId?: string;
  /** Filter by success/failure */
  success?: boolean;
  /** Maximum results to return */
  limit?: number;
  /** Include entries from batch operations */
  includeBatchChildren?: boolean;
}

// ── Journal Statistics ───────────────────────────────────────────

export interface JournalStats {
  totalEntries: number;
  entriesByType: Record<string, number>;
  entriesBySource: Record<string, number>;
  errorCount: number;
  averageDurationMs: number;
  lastEntryAt: number | null;
  firstEntryAt: number | null;
}

// ── Operation Journal Class ──────────────────────────────────────

export class OperationJournal {
  private entries: JournalEntry[] = [];
  private maxEntries: number;
  private listeners: Set<(entry: JournalEntry) => void> = new Set();
  private entryIdCounter = 0;

  constructor(maxEntries: number = 500) {
    this.maxEntries = maxEntries;
  }

  // ── Core Operations ──────────────────────────────────────────

  /**
   * Record a journal entry from a command execution.
   * Called by CommandEngine after every successful/failed command.
   */
  record(command: Command, result: {
    success: boolean;
    durationMs: number;
    error?: string;
    blockIds?: string[];
    blockTypes?: string[];
  }): JournalEntry {
    const entry: JournalEntry = {
      id: `journal-${++this.entryIdCounter}`,
      commandId: command.id,
      type: command.type,
      source: command.source,
      timestamp: command.timestamp,
      pageIndex: command.pageIndex,
      blockIds: result.blockIds ?? [],
      blockTypes: result.blockTypes ?? [],
      description: command.description ?? command.type,
      durationMs: result.durationMs,
      success: result.success,
      error: result.error,
      parentCommandId: command.parentCommandId,
      affectedCount: result.blockIds?.length ?? 0,
    };

    this.entries.push(entry);

    // Enforce max entries — evict oldest
    if (this.entries.length > this.maxEntries) {
      const excess = this.entries.length - this.maxEntries;
      this.entries = this.entries.slice(excess);
    }

    // Notify listeners
    const listenersArr = Array.from(this.listeners);
    for (const listener of listenersArr) {
      try {
        listener(entry);
      } catch {
        // Journal listeners must never crash the pipeline
      }
    }

    return entry;
  }

  // ── Query Methods ─────────────────────────────────────────────

  /** Query journal entries with flexible filters */
  query(q: JournalQuery = {}): JournalEntry[] {
    let results = [...this.entries];

    if (q.type) {
      const types = Array.isArray(q.type) ? q.type : [q.type];
      results = results.filter(e => types.includes(e.type));
    }

    if (q.source) {
      const sources = Array.isArray(q.source) ? q.source : [q.source];
      results = results.filter(e => sources.includes(e.source));
    }

    if (q.fromTime !== undefined) {
      results = results.filter(e => e.timestamp >= q.fromTime!);
    }

    if (q.toTime !== undefined) {
      results = results.filter(e => e.timestamp <= q.toTime!);
    }

    if (q.pageIndex !== undefined) {
      results = results.filter(e => e.pageIndex === q.pageIndex);
    }

    if (q.blockId) {
      results = results.filter(e => e.blockIds.includes(q.blockId!));
    }

    if (q.success !== undefined) {
      results = results.filter(e => e.success === q.success);
    }

    if (!q.includeBatchChildren) {
      results = results.filter(e => !e.parentCommandId);
    }

    if (q.limit) {
      results = results.slice(-q.limit);
    }

    return results;
  }

  /** Get recent entries (last N) */
  getRecent(limit: number = 20): JournalEntry[] {
    return this.entries.slice(-limit);
  }

  /** Get a specific entry by ID */
  getById(id: string): JournalEntry | undefined {
    return this.entries.find(e => e.id === id);
  }

  /** Get entries for a specific command */
  getByCommandId(commandId: string): JournalEntry[] {
    return this.entries.filter(e => e.commandId === commandId);
  }

  // ── Statistics ────────────────────────────────────────────────

  /** Get journal statistics */
  getStats(): JournalStats {
    const byType: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let totalDuration = 0;
    let errorCount = 0;

    for (const entry of this.entries) {
      byType[entry.type] = (byType[entry.type] ?? 0) + 1;
      bySource[entry.source] = (bySource[entry.source] ?? 0) + 1;
      totalDuration += entry.durationMs;
      if (!entry.success) errorCount++;
    }

    return {
      totalEntries: this.entries.length,
      entriesByType: byType,
      entriesBySource: bySource,
      errorCount,
      averageDurationMs: this.entries.length > 0 ? totalDuration / this.entries.length : 0,
      lastEntryAt: this.entries.length > 0 ? this.entries[this.entries.length - 1].timestamp : null,
      firstEntryAt: this.entries.length > 0 ? this.entries[0].timestamp : null,
    };
  }

  // ── Subscription ──────────────────────────────────────────────

  /** Subscribe to new journal entries */
  subscribe(listener: (entry: JournalEntry) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ── Lifecycle ─────────────────────────────────────────────────

  /** Clear all entries */
  clear(): void {
    this.entries = [];
    this.entryIdCounter = 0;
  }

  /** Destroy the journal */
  destroy(): void {
    this.entries = [];
    this.listeners.clear();
  }

  /** Export entries for debugging/analysis */
  export(): JournalEntry[] {
    return [...this.entries];
  }
}

// ── Global Singleton ─────────────────────────────────────────────

export const operationJournal = new OperationJournal(500);
