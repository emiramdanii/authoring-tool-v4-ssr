/**
 * SILSE — Schema History System (Undo/Redo)
 *
 * Maintains a stack of committed schema snapshots for undo/redo.
 * Built on top of the Transaction system — every committed transaction
 * pushes a new entry onto the history stack.
 *
 * Key design decisions:
 * - History stores deep-cloned schemas (not references)
 * - Undo/redo moves a pointer in the stack (no mutation of entries)
 * - New commit after undo truncates the redo branch (standard behavior)
 * - Max history depth to prevent memory bloat (default 100)
 * - Each entry stores metadata: timestamp, operation type, description
 */

import type { ScreenSchema, SchemaOperation } from './types';
import { validateSchema, type ValidationResult } from './validation';

// ─── History Entry ─────────────────────────────────────────────────────
export interface HistoryEntry {
  /** Deep-cloned snapshot of the schema at this point */
  schema: ScreenSchema;
  /** Human-readable description of what changed */
  description: string;
  /** Timestamp when this entry was created */
  timestamp: number;
  /** The operation that led to this state */
  operationType: SchemaOperation['type'] | 'initial' | 'restore';
}

// ─── History State ─────────────────────────────────────────────────────
export interface HistoryState {
  entries: HistoryEntry[];
  /** Current position pointer (index into entries) */
  pointer: number;
  /** Maximum number of entries to keep */
  maxDepth: number;
}

// ─── History Action Result ─────────────────────────────────────────────
export interface HistoryActionResult {
  schema: ScreenSchema;
  description: string;
  success: boolean;
}

// ─── Schema History Class ──────────────────────────────────────────────

export class SchemaHistory {
  private state: HistoryState;

  constructor(maxDepth: number = 100) {
    this.state = {
      entries: [],
      pointer: -1,
      maxDepth,
    };
  }

  // ─── Initialize ─────────────────────────────────────────────────────

  /**
   * Initialize history with the initial schema state.
   * This should be called once when a page/schema is loaded.
   */
  initialize(schema: ScreenSchema, description: string = 'Initial state'): void {
    const entry: HistoryEntry = {
      schema: deepClone(schema),
      description,
      timestamp: Date.now(),
      operationType: 'initial',
    };

    this.state.entries = [entry];
    this.state.pointer = 0;
  }

  // ─── Push ───────────────────────────────────────────────────────────

  /**
   * Push a new committed schema onto the history stack.
   * If we're not at the end of the stack (i.e., user did undo then new edit),
   * the redo branch is truncated — standard undo/redo behavior.
   */
  push(schema: ScreenSchema, operationType: SchemaOperation['type'] | 'restore', description: string): void {
    const entry: HistoryEntry = {
      schema: deepClone(schema),
      description,
      timestamp: Date.now(),
      operationType,
    };

    // Truncate redo branch if we're not at the end
    if (this.state.pointer < this.state.entries.length - 1) {
      this.state.entries = this.state.entries.slice(0, this.state.pointer + 1);
    }

    this.state.entries.push(entry);
    this.state.pointer = this.state.entries.length - 1;

    // Enforce max depth — remove oldest entries
    while (this.state.entries.length > this.state.maxDepth) {
      this.state.entries.shift();
      this.state.pointer--;
    }

    // Safety: pointer should never be negative
    if (this.state.pointer < 0) {
      this.state.pointer = 0;
    }
  }

  // ─── Undo ───────────────────────────────────────────────────────────

  /**
   * Move back one step in history. Returns the previous schema state.
   * Returns null if cannot undo (already at beginning).
   */
  undo(): HistoryActionResult | null {
    if (!this.canUndo()) return null;

    this.state.pointer--;
    const entry = this.state.entries[this.state.pointer];

    return {
      schema: deepClone(entry.schema),
      description: `Undo: ${entry.description}`,
      success: true,
    };
  }

  // ─── Redo ───────────────────────────────────────────────────────────

  /**
   * Move forward one step in history. Returns the next schema state.
   * Returns null if cannot redo (already at end).
   */
  redo(): HistoryActionResult | null {
    if (!this.canRedo()) return null;

    this.state.pointer++;
    const entry = this.state.entries[this.state.pointer];

    return {
      schema: deepClone(entry.schema),
      description: `Redo: ${entry.description}`,
      success: true,
    };
  }

  // ─── Queries ────────────────────────────────────────────────────────

  canUndo(): boolean {
    return this.state.pointer > 0;
  }

  canRedo(): boolean {
    return this.state.pointer < this.state.entries.length - 1;
  }

  /** Get the current schema (at pointer position) */
  getCurrentSchema(): ScreenSchema | null {
    if (this.state.pointer < 0 || this.state.entries.length === 0) return null;
    return deepClone(this.state.entries[this.state.pointer].schema);
  }

  /** Get the current history entry */
  getCurrentEntry(): HistoryEntry | null {
    if (this.state.pointer < 0) return null;
    return this.state.entries[this.state.pointer];
  }

  /** Get the previous entry (for undo preview) */
  getPreviousEntry(): HistoryEntry | null {
    if (!this.canUndo()) return null;
    return this.state.entries[this.state.pointer - 1];
  }

  /** Get the next entry (for redo preview) */
  getNextEntry(): HistoryEntry | null {
    if (!this.canRedo()) return null;
    return this.state.entries[this.state.pointer + 1];
  }

  /** Total number of history entries */
  getEntryCount(): number {
    return this.state.entries.length;
  }

  /** Current pointer position (0-indexed) */
  getPointer(): number {
    return this.state.pointer;
  }

  /** Get all entries (read-only) */
  getEntries(): ReadonlyArray<HistoryEntry> {
    return this.state.entries;
  }

  /** Get a summary of the history state (for debugging/UI) */
  getSummary(): { totalEntries: number; pointer: number; canUndo: boolean; canRedo: boolean; undoDescription: string | null; redoDescription: string | null } {
    return {
      totalEntries: this.state.entries.length,
      pointer: this.state.pointer,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoDescription: this.canUndo() ? this.state.entries[this.state.pointer - 1].description : null,
      redoDescription: this.canRedo() ? this.state.entries[this.state.pointer + 1].description : null,
    };
  }

  // ─── Reset ──────────────────────────────────────────────────────────

  /** Clear all history */
  reset(): void {
    this.state.entries = [];
    this.state.pointer = -1;
  }

  /** Check if history has been initialized */
  isInitialized(): boolean {
    return this.state.entries.length > 0 && this.state.pointer >= 0;
  }
}

// ─── Per-Page History Manager ──────────────────────────────────────────

/**
 * Manages SchemaHistory instances per page.
 * Each page (identified by pageId) has its own independent undo/redo stack.
 */
export class PageHistoryManager {
  private histories: Map<string, SchemaHistory> = new Map();
  private maxDepth: number;

  constructor(maxDepth: number = 100) {
    this.maxDepth = maxDepth;
  }

  /** Get or create history for a page */
  getHistory(pageId: string): SchemaHistory {
    let history = this.histories.get(pageId);
    if (!history) {
      history = new SchemaHistory(this.maxDepth);
      this.histories.set(pageId, history);
    }
    return history;
  }

  /** Initialize history for a page with its current schema */
  initializePage(pageId: string, schema: ScreenSchema, description?: string): void {
    const history = this.getHistory(pageId);
    if (!history.isInitialized()) {
      history.initialize(schema, description);
    }
  }

  /** Remove history for a page (when page is deleted) */
  removePage(pageId: string): void {
    this.histories.delete(pageId);
  }

  /** Get all tracked page IDs */
  getTrackedPageIds(): string[] {
    return [...this.histories.keys()];
  }

  /** Clear all histories */
  resetAll(): void {
    this.histories.clear();
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────

export const pageHistoryManager = new PageHistoryManager(100);

// ─── Operation Description Generator ───────────────────────────────────

/**
 * Generate a human-readable description for an operation.
 * Uses Indonesian language since this is for Indonesian teachers.
 */
export function describeOperation(
  operationType: SchemaOperation['type'] | 'initial' | 'restore',
  detail?: string
): string {
  switch (operationType) {
    case 'initial':
      return 'State awal';
    case 'restore':
      return detail ?? 'Restore';
    case 'insert-block':
      return `Sisipkan block${detail ? ` "${detail}"` : ''}`;
    case 'remove-block':
      return `Hapus block${detail ? ` "${detail}"` : ''}`;
    case 'move-block':
      return `Pindah block${detail ? ` "${detail}"` : ''}`;
    case 'update-block':
      return `Update block${detail ? ` "${detail}"` : ''}`;
    case 'duplicate-block':
      return `Duplikat block${detail ? ` "${detail}"` : ''}`;
    case 'change-variant':
      return `Ubah varian${detail ? ` "${detail}"` : ''}`;
    case 'split-scene':
      return 'Split halaman';
    case 'merge-scene':
      return 'Gabung halaman';
    default:
      return detail ?? 'Operasi tidak dikenal';
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
