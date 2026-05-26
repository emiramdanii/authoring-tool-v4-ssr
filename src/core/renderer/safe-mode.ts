// ═══════════════════════════════════════════════════════════════════
// SAFE MODE BOOT — Identify crash-causing blocks, skip on next boot
// ═══════════════════════════════════════════════════════════════════
// FASE 6.4: When a block renderer crashes (BlockErrorBoundary catches
// it), the block ID and type are recorded. On the NEXT boot, if the
// same block continues to crash, it's rendered in "safe mode" —
// a lightweight placeholder that shows the block type and ID without
// executing any potentially crashy rendering logic.
//
// SAFE MODE THRESHOLDS:
//   1 crash  → normal retry (user clicks "Coba Lagi")
//   2 crashes → auto-downgrade to safe mode for this session
//   3+ crashes → permanent safe mode until manual reset
//
// ARCHITECTURE:
//   BlockErrorBoundary catches error
//     → recordBlockCrash(blockId, blockType, error)
//     → checkSafeMode(blockId)
//     → if safe mode: render SafeModePlaceholder
//     → if not: render normal with retry option
//
// DATA FLOW:
//   crash → sessionStorage (session crashes) + localStorage (persistent)
//   boot  → check persistent crash records → mark blocks as safe-mode
//
// GUARANTEES:
//   - Safe mode NEVER crashes (it's a simple div with text)
//   - Crash records are bounded (max 50 block entries)
//   - Users can manually exit safe mode via UI
//   - Crash records auto-expire after 7 days
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from '../schema/types';
import { logger } from '../utils/logger';

// ── Constants ─────────────────────────────────────────────────────

const SESSION_CRASH_KEY = 'silse_session_crashes';
const PERSISTENT_CRASH_KEY = 'silse_persistent_crashes';
const MAX_CRASH_RECORDS = 50;
const CRASH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SAFE_MODE_THRESHOLD = 2; // Crashes before safe mode activates
const PERMANENT_THRESHOLD = 3; // Crashes before permanent safe mode

// ── Crash Record ──────────────────────────────────────────────────

export interface BlockCrashRecord {
  /** Block ID that crashed */
  blockId: string;
  /** Block type */
  blockType: string;
  /** Error message */
  errorMessage: string;
  /** Error stack (first 500 chars) */
  errorStack?: string;
  /** When the crash happened */
  timestamp: number;
  /** Which page index */
  pageIndex?: number;
}

export interface CrashRegistry {
  /** Map of blockId → array of crash records */
  records: Map<string, BlockCrashRecord[]>;
}

export type SafeModeLevel = 'normal' | 'session-safe' | 'permanent-safe';

export interface SafeModeStatus {
  /** The safe mode level for this block */
  level: SafeModeLevel;
  /** Number of crashes recorded */
  crashCount: number;
  /** Last error message */
  lastError: string | null;
  /** Whether the block should be rendered in safe mode */
  shouldUseSafeMode: boolean;
}

// ── Safe Mode Manager Class ──────────────────────────────────────

export class SafeModeManager {
  private sessionCrashes: Map<string, BlockCrashRecord[]> = new Map();
  private persistentCrashes: Map<string, BlockCrashRecord[]> = new Map();
  private manualOverrides: Set<string> = new Set(); // Blocks user manually un-safe-moded
  private initialized = false;

  // ── Initialization ──────────────────────────────────────────────

  /**
   * Initialize the safe mode manager by loading crash records from storage.
   * Call once at app startup.
   */
  init(): void {
    if (this.initialized) return;

    this.loadSessionCrashes();
    this.loadPersistentCrashes();
    this.expireOldRecords();
    this.initialized = true;
  }

  // ── Crash Recording ─────────────────────────────────────────────

  /**
   * Record a block crash. Called by BlockErrorBoundary.componentDidCatch().
   *
   * @param blockId - The ID of the crashed block
   * @param blockType - The type of the crashed block
   * @param error - The error that was thrown
   * @param pageIndex - Which page the block is on
   */
  recordCrash(
    blockId: string,
    blockType: string,
    error: Error,
    pageIndex?: number
  ): void {
    this.init();

    const record: BlockCrashRecord = {
      blockId,
      blockType,
      errorMessage: error.message || 'Unknown error',
      errorStack: error.stack?.substring(0, 500),
      timestamp: Date.now(),
      pageIndex,
    };

    // Add to session crashes
    const sessionRecords = this.sessionCrashes.get(blockId) ?? [];
    sessionRecords.push(record);
    this.sessionCrashes.set(blockId, sessionRecords);

    // Add to persistent crashes
    const persistentRecords = this.persistentCrashes.get(blockId) ?? [];
    persistentRecords.push(record);
    this.persistentCrashes.set(blockId, persistentRecords);

    // Persist to storage
    this.saveSessionCrashes();
    this.savePersistentCrashes();

    const crashCount = this.getTotalCrashCount(blockId);
    const level = this.determineSafeModeLevel(blockId);

    logger.warn('SAFE-MODE', `Block "${blockId}" (${blockType}) crashed [${crashCount}x] → level: ${level}`);

    // If entering safe mode, record which blocks are affected
    if (level !== 'normal') {
      logger.warn('SAFE-MODE', `Block "${blockId}" is now in ${level} mode — will render placeholder on next boot`);
    }
  }

  // ── Safe Mode Check ─────────────────────────────────────────────

  /**
   * Check the safe mode status for a specific block.
   * Used by the renderer to decide whether to render the block
   * normally or use a safe mode placeholder.
   */
  checkSafeMode(blockId: string): SafeModeStatus {
    this.init();

    // Check for manual override (user said "render normally anyway")
    if (this.manualOverrides.has(blockId)) {
      return {
        level: 'normal',
        crashCount: this.getTotalCrashCount(blockId),
        lastError: this.getLastError(blockId),
        shouldUseSafeMode: false,
      };
    }

    const level = this.determineSafeModeLevel(blockId);
    const crashCount = this.getTotalCrashCount(blockId);

    return {
      level,
      crashCount,
      lastError: this.getLastError(blockId),
      shouldUseSafeMode: level !== 'normal',
    };
  }

  /**
   * Check which blocks in a schema are in safe mode.
   * Returns a map of blockId → SafeModeStatus for all safe-mode blocks.
   */
  scanSchemaForSafeBlocks(schema: ScreenSchema): Map<string, SafeModeStatus> {
    const result = new Map<string, SafeModeStatus>();

    function scanBlocks(blocks: SchemaBlock[]) {
      for (const block of blocks) {
        if (block.id) {
          const status = safeModeManager.checkSafeMode(block.id);
          if (status.shouldUseSafeMode) {
            result.set(block.id, status);
          }
        }
        // Recurse into children
        if (block.children) scanBlocks(block.children);
      }
    }

    scanBlocks(schema.blocks);
    return result;
  }

  // ── Manual Override ─────────────────────────────────────────────

  /**
   * Manually remove a block from safe mode.
   * The user clicks "Tampilkan Normal" on the safe mode placeholder.
   */
  exitSafeMode(blockId: string): void {
    this.manualOverrides.add(blockId);
    logger.warn('SAFE-MODE', `Block "${blockId}" manually removed from safe mode`);
  }

  /**
   * Clear safe mode for all blocks (reset).
   */
  clearAllSafeModes(): void {
    this.sessionCrashes.clear();
    this.persistentCrashes.clear();
    this.manualOverrides.clear();
    this.saveSessionCrashes();
    this.savePersistentCrashes();
  }

  /**
   * Clear crash records for a specific block.
   */
  clearBlockCrashes(blockId: string): void {
    this.sessionCrashes.delete(blockId);
    this.persistentCrashes.delete(blockId);
    this.manualOverrides.delete(blockId);
    this.saveSessionCrashes();
    this.savePersistentCrashes();
  }

  // ── Safe Mode Boot Integration ──────────────────────────────────

  /**
   * Prepare the schema for safe mode boot.
   * Marks blocks that should be rendered in safe mode by adding
   * a `_safeMode` flag (which is stripped by normalization).
   *
   * This is called ONCE at boot time, before the first render.
   *
   * @returns List of blocks that are in safe mode (for UI notification)
   */
  prepareSafeModeBoot(schema: ScreenSchema): {
    schema: ScreenSchema;
    safeBlockIds: string[];
    safeBlockTypes: string[];
  } {
    this.init();

    const safeBlockIds: string[] = [];
    const safeBlockTypes: string[] = [];

    // Scan all blocks for safe mode status
    function scanAndMark(blocks: SchemaBlock[]): SchemaBlock[] {
      return blocks.map(block => {
        if (block.id) {
          const status = safeModeManager.checkSafeMode(block.id);
          if (status.shouldUseSafeMode) {
            safeBlockIds.push(block.id);
            safeBlockTypes.push(block.type);
          }
        }

        // Recurse into children
        const result = { ...block };
        if (block.children) {
          result.children = scanAndMark(block.children);
        }
        return result;
      });
    }

    const newBlocks = scanAndMark(schema.blocks);

    return {
      schema: { ...schema, blocks: newBlocks },
      safeBlockIds,
      safeBlockTypes,
    };
  }

  // ── Internal ────────────────────────────────────────────────────

  private determineSafeModeLevel(blockId: string): SafeModeLevel {
    const sessionCount = (this.sessionCrashes.get(blockId) ?? []).length;
    const persistentCount = (this.persistentCrashes.get(blockId) ?? []).length;
    const totalCount = Math.max(sessionCount, persistentCount);

    if (totalCount >= PERMANENT_THRESHOLD) return 'permanent-safe';
    if (totalCount >= SAFE_MODE_THRESHOLD) return 'session-safe';
    return 'normal';
  }

  private getTotalCrashCount(blockId: string): number {
    const sessionCount = (this.sessionCrashes.get(blockId) ?? []).length;
    const persistentCount = (this.persistentCrashes.get(blockId) ?? []).length;
    return Math.max(sessionCount, persistentCount);
  }

  private getLastError(blockId: string): string | null {
    const records = this.persistentCrashes.get(blockId) ?? this.sessionCrashes.get(blockId);
    if (!records || records.length === 0) return null;
    return records[records.length - 1].errorMessage;
  }

  private expireOldRecords(): void {
    const now = Date.now();

    for (const [blockId, records] of this.persistentCrashes) {
      const fresh = records.filter(r => now - r.timestamp < CRASH_EXPIRY_MS);
      if (fresh.length === 0) {
        this.persistentCrashes.delete(blockId);
      } else if (fresh.length !== records.length) {
        this.persistentCrashes.set(blockId, fresh);
      }
    }

    this.savePersistentCrashes();
  }

  // ── Storage Persistence ─────────────────────────────────────────

  private loadSessionCrashes(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(SESSION_CRASH_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, BlockCrashRecord[]>;
        this.sessionCrashes = new Map(Object.entries(data));
      }
    } catch {
      // Corrupted — start fresh
    }
  }

  private saveSessionCrashes(): void {
    if (typeof window === 'undefined') return;
    try {
      const data: Record<string, BlockCrashRecord[]> = {};
      let count = 0;
      for (const [key, value] of this.sessionCrashes) {
        if (count >= MAX_CRASH_RECORDS) break;
        data[key] = value.slice(-3); // Keep last 3 crashes per block
        count++;
      }
      sessionStorage.setItem(SESSION_CRASH_KEY, JSON.stringify(data));
    } catch {
      // Storage full — non-critical
    }
  }

  private loadPersistentCrashes(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(PERSISTENT_CRASH_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, BlockCrashRecord[]>;
        this.persistentCrashes = new Map(Object.entries(data));
      }
    } catch {
      // Corrupted — start fresh
    }
  }

  private savePersistentCrashes(): void {
    if (typeof window === 'undefined') return;
    try {
      const data: Record<string, BlockCrashRecord[]> = {};
      let count = 0;
      for (const [key, value] of this.persistentCrashes) {
        if (count >= MAX_CRASH_RECORDS) break;
        data[key] = value.slice(-3); // Keep last 3 crashes per block
        count++;
      }
      localStorage.setItem(PERSISTENT_CRASH_KEY, JSON.stringify(data));
    } catch {
      // Storage full — non-critical
    }
  }

  // ── Debugging ───────────────────────────────────────────────────

  /** Get all crash records for debugging */
  getCrashRecords(): { session: Map<string, BlockCrashRecord[]>; persistent: Map<string, BlockCrashRecord[]> } {
    return {
      session: new Map(this.sessionCrashes),
      persistent: new Map(this.persistentCrashes),
    };
  }

  /** Get the count of blocks currently in safe mode */
  getSafeModeBlockCount(): number {
    let count = 0;
    for (const [blockId] of this.persistentCrashes) {
      if (this.determineSafeModeLevel(blockId) !== 'normal') {
        count++;
      }
    }
    return count;
  }
}

// ── Global Singleton ─────────────────────────────────────────────

export const safeModeManager = new SafeModeManager();
