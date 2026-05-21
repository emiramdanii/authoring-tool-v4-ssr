// ═══════════════════════════════════════════════════════════════════
// RECOVERY LAYER — Crash Recovery, Integrity, Repair, Safe Boot
// ═══════════════════════════════════════════════════════════════════
// FASE 6 of the ROADMAP PEMULIHAN SILSE
//
// This module provides the Reliability + Recovery Layer:
//   1. Crash Recovery   — Auto-save checkpoint before dangerous ops
//   2. Transaction Rollback — Undo multi-step transactions atomically
//   3. Schema Repair    — Detect + auto-repair broken schemas
//   4. Integrity Check  — Hash-based schema integrity verification
//   5. Safe Mode Boot   — Minimal state when store is corrupted
//
// DESIGN PRINCIPLES:
//   - Recovery is ALWAYS non-destructive (never lose more data)
//   - Operations are idempotent (safe to call multiple times)
//   - Errors are caught and logged, never propagated to crash the app
//   - All operations work in production (not just dev mode)
//   - withCrashCheckpoint wraps dangerous ops with automatic save
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from '@/core/schema/types';
import { validateSchema } from '@/core/schema/validation';
import { generateBlockId } from '@/core/schema/ensure-schema';
import { logger } from '@/core/utils/logger';

// ── 4. Integrity Check (Hash-based) ────────────────────────────────

/**
 * Compute a deterministic hash of a schema for integrity verification.
 * Uses FNV-1a — fast, good distribution, no crypto dependency needed.
 * Same schema always produces the same hash (deterministic key ordering).
 */
export function computeSchemaHash(data: unknown): string {
  const canonical = canonicalize(data);
  let hash = 2166136261; // FNV offset basis (32-bit)
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash = (hash * 16777619) >>> 0; // FNV prime, unsigned 32-bit
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Canonical JSON: deterministic key ordering for hash consistency.
 */
function canonicalize(obj: unknown): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'boolean') return obj.toString();
  if (typeof obj === 'number') return obj.toString();
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => JSON.stringify(k) + ':' + canonicalize(v));
    return '{' + entries.join(',') + '}';
  }
  return 'null';
}

// ── 1. Crash Recovery (Auto-save Checkpoint) ──────────────────────

const CRASH_RECOVERY_KEY = 'silse_crash_recovery';
const CRASH_RECOVERY_META_KEY = 'silse_crash_recovery_meta';

export interface CrashRecoveryMeta {
  timestamp: number;
  schemaHash: string;
  pageCount: number;
  reason: string;
}

/**
 * Save a crash recovery checkpoint before a dangerous operation.
 * Called BEFORE the operation starts — restore to pre-op state if browser crashes.
 */
export function saveCrashCheckpoint(
  pages: unknown[],
  ratioId: string,
  reason: string,
): void {
  try {
    const payload = JSON.stringify({ pages, ratioId, _savedAt: Date.now() });
    const schemaHash = computeSchemaHash(pages);
    const meta: CrashRecoveryMeta = {
      timestamp: Date.now(),
      schemaHash,
      pageCount: pages.length,
      reason,
    };
    localStorage.setItem(CRASH_RECOVERY_KEY, payload);
    localStorage.setItem(CRASH_RECOVERY_META_KEY, JSON.stringify(meta));
  } catch (err) {
    logger.warn('Recovery', 'Failed to save crash checkpoint: ' + String(err));
  }
}

/**
 * Check if a crash recovery checkpoint exists and is valid.
 * Returns metadata if recovery is available.
 */
export function hasCrashRecovery(): CrashRecoveryMeta | null {
  try {
    const metaRaw = localStorage.getItem(CRASH_RECOVERY_META_KEY);
    if (!metaRaw) return null;
    const meta: CrashRecoveryMeta = JSON.parse(metaRaw);
    // Only offer recovery if checkpoint is less than 24 hours old
    const age = Date.now() - meta.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      clearCrashRecovery();
      return null;
    }
    return meta;
  } catch {
    return null;
  }
}

/**
 * Load the crash recovery checkpoint data.
 */
export function loadCrashRecovery(): { pages: unknown[]; ratioId: string } | null {
  try {
    const raw = localStorage.getItem(CRASH_RECOVERY_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Integrity check: verify the hash matches
    const currentHash = computeSchemaHash(data.pages);
    const metaRaw = localStorage.getItem(CRASH_RECOVERY_META_KEY);
    if (metaRaw) {
      const meta: CrashRecoveryMeta = JSON.parse(metaRaw);
      if (currentHash !== meta.schemaHash) {
        logger.warn('Recovery', 'Checkpoint hash mismatch — data may be corrupted');
      }
    }
    return { pages: data.pages, ratioId: data.ratioId };
  } catch (err) {
    logger.warn('Recovery', 'Failed to load crash recovery: ' + String(err));
    return null;
  }
}

/**
 * Clear the crash recovery checkpoint.
 */
export function clearCrashRecovery(): void {
  try {
    localStorage.removeItem(CRASH_RECOVERY_KEY);
    localStorage.removeItem(CRASH_RECOVERY_META_KEY);
  } catch { /* ignore */ }
}

// ── 3. Schema Corruption Repair ──────────────────────────────────

export interface RepairResult {
  repaired: boolean;
  schema: ScreenSchema;
  repairs: string[];
  unrecoverable: string[];
}

/**
 * Attempt to repair a corrupted schema.
 * NEVER throws — all errors are caught and reported.
 *
 * Repair strategy:
 *   - Missing id → generate one
 *   - Missing blocks → set to []
 *   - Invalid blocks → remove them
 *   - Missing type → block removed (can't render without type)
 *   - Duplicate IDs → regenerate conflicting IDs
 *   - Non-serializable values → strip them
 *   - Missing templateType → set to 'custom'
 */
export function repairSchema(schema: ScreenSchema): RepairResult {
  const repairs: string[] = [];
  const unrecoverable: string[] = [];

  try {
    let result: ScreenSchema = {
      id: schema.id || generateBlockId(),
      version: schema.version || 1,
      templateType: schema.templateType || 'custom',
      blocks: Array.isArray(schema.blocks) ? [...schema.blocks] : [],
      ...(schema.nav ? { nav: schema.nav } : {}),
      ...(schema.background ? { background: schema.background } : {}),
      ...(schema.sectionLabel ? { sectionLabel: schema.sectionLabel } : {}),
      ...(schema.sectionColor ? { sectionColor: schema.sectionColor } : {}),
    };

    if (!schema.id) repairs.push('Generated missing schema.id');
    if (!schema.templateType) repairs.push('Set missing templateType to "custom"');
    if (!Array.isArray(schema.blocks)) {
      repairs.push('Replaced non-array blocks with empty array');
      result.blocks = [];
    }

    // Repair individual blocks
    const seenIds = new Set<string>();
    const repairedBlocks: SchemaBlock[] = [];

    for (let i = 0; i < result.blocks.length; i++) {
      const block = result.blocks[i];
      const repairResult = repairBlock(block, i, seenIds);
      if (repairResult.block) {
        repairedBlocks.push(repairResult.block);
        repairs.push(...repairResult.repairs);
        unrecoverable.push(...repairResult.unrecoverable);
      } else {
        repairs.push(`Removed unrecoverable block at index ${i}`);
      }
    }

    result.blocks = repairedBlocks;

    // Validate the repaired schema
    const validation = validateSchema(result);
    if (!validation.valid) {
      for (const err of validation.errors) {
        unrecoverable.push(`Post-repair validation: ${err.path} — ${err.message}`);
      }
    }

    return { repaired: repairs.length > 0, schema: result, repairs, unrecoverable };
  } catch (err) {
    unrecoverable.push(`Fatal repair error: ${err instanceof Error ? err.message : String(err)}`);
    return {
      repaired: false,
      schema: { id: generateBlockId(), version: 1, templateType: 'custom', blocks: [] },
      repairs,
      unrecoverable,
    };
  }
}

function repairBlock(
  block: unknown,
  index: number,
  seenIds: Set<string>,
): { block: SchemaBlock | null; repairs: string[]; unrecoverable: string[] } {
  const repairs: string[] = [];
  const unrecoverable: string[] = [];
  const prefix = `blocks[${index}]`;

  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    return { block: null, repairs, unrecoverable: [`${prefix}: not a valid object`] };
  }

  const b = block as Record<string, unknown>;

  // Must have a type
  if (!b.type || typeof b.type !== 'string') {
    return { block: null, repairs, unrecoverable: [`${prefix}: missing or invalid type`] };
  }

  // Repair ID
  let id = b.id as string | undefined;
  if (!id || typeof id !== 'string') {
    id = generateBlockId();
    repairs.push(`${prefix}: generated missing id`);
  } else if (seenIds.has(id)) {
    const oldId = id;
    id = generateBlockId();
    repairs.push(`${prefix}: regenerated duplicate id "${oldId}"`);
  }
  seenIds.add(id);

  // Strip non-serializable values
  const cleanBlock = stripNonSerializable(b, prefix, repairs);

  const result: SchemaBlock = {
    ...cleanBlock,
    id,
    type: b.type as string,
  } as SchemaBlock;

  return { block: result, repairs, unrecoverable };
}

function stripNonSerializable(
  obj: Record<string, unknown>,
  path: string,
  repairs: string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'function') { repairs.push(`${path}.${key}: stripped function`); continue; }
    if (typeof value === 'symbol') { repairs.push(`${path}.${key}: stripped symbol`); continue; }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (typeof window !== 'undefined' && value instanceof Node) { repairs.push(`${path}.${key}: stripped DOM ref`); continue; }
      if (Object.getPrototypeOf(value) !== Object.prototype && !(value instanceof Date)) { repairs.push(`${path}.${key}: stripped class instance`); continue; }
    }
    result[key] = value;
  }
  return result;
}

// ── 2. Transaction Rollback (Atomic Multi-Step Undo) ─────────────

export interface TransactionCheckpoint {
  id: string;
  timestamp: number;
  description: string;
  pages: unknown[];
  ratioId: string;
}

const MAX_TRANSACTION_CHECKPOINTS = 10;

class TransactionRollbackManager {
  private checkpoints: TransactionCheckpoint[] = [];

  checkpoint(pages: unknown[], ratioId: string, description: string): string {
    const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const cp: TransactionCheckpoint = { id, timestamp: Date.now(), description, pages: structuredClone(pages), ratioId };
    this.checkpoints.push(cp);
    if (this.checkpoints.length > MAX_TRANSACTION_CHECKPOINTS) this.checkpoints.shift();
    return id;
  }

  rollback(checkpointId: string): TransactionCheckpoint | null {
    const idx = this.checkpoints.findIndex(cp => cp.id === checkpointId);
    if (idx === -1) { logger.warn('Recovery', `Checkpoint "${checkpointId}" not found`); return null; }
    const cp = this.checkpoints[idx];
    this.checkpoints = this.checkpoints.slice(0, idx);
    return cp;
  }

  commit(checkpointId: string): void {
    const idx = this.checkpoints.findIndex(cp => cp.id === checkpointId);
    if (idx !== -1) this.checkpoints.splice(idx, 1);
  }

  getActiveCheckpoints(): ReadonlyArray<Readonly<TransactionCheckpoint>> {
    return [...this.checkpoints];
  }

  clear(): void { this.checkpoints = []; }
}

export const transactionRollback = new TransactionRollbackManager();

// ── 5. Safe Mode Boot ─────────────────────────────────────────────

export interface SafeBootResult {
  booted: boolean;
  safeMode: boolean;
  repairs: string[];
  warnings: string[];
}

/**
 * Attempt to boot the store safely.
 * If persisted data is corrupted, attempt repair.
 * If repair fails, boot with minimal empty state.
 * This is the LAST RESORT — called when normal loadFromStorage fails.
 */
export function safeBootFromStorage(rawStorageData: string | null): SafeBootResult {
  const repairs: string[] = [];
  const warnings: string[] = [];

  if (!rawStorageData) {
    return { booted: true, safeMode: false, repairs: [], warnings: [] };
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawStorageData);
  } catch {
    warnings.push('localStorage data is not valid JSON — starting fresh');
    return { booted: true, safeMode: true, repairs, warnings };
  }

  if (!data.pages || !Array.isArray(data.pages)) {
    warnings.push('No pages array in stored data — starting fresh');
    return { booted: true, safeMode: true, repairs, warnings };
  }

  const pages = data.pages as Array<Record<string, unknown>>;
  let hasRepairs = false;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page.schema && typeof page.schema === 'object') {
      const repairResult = repairSchema(page.schema as ScreenSchema);
      if (repairResult.repaired) {
        pages[i] = { ...page, schema: repairResult.schema };
        hasRepairs = true;
        repairs.push(...repairResult.repairs.map(r => `Page ${i}: ${r}`));
        warnings.push(...repairResult.unrecoverable.map(r => `Page ${i}: ${r}`));
      }
    }
    if (!page.id) { pages[i] = { ...pages[i], id: generateBlockId() }; hasRepairs = true; repairs.push(`Page ${i}: generated missing id`); }
    if (!page.templateType) { pages[i] = { ...pages[i], templateType: 'custom' }; hasRepairs = true; repairs.push(`Page ${i}: set missing templateType`); }
  }

  return { booted: true, safeMode: hasRepairs || warnings.length > 0, repairs, warnings };
}

export { runIntegrityCheck, type IntegrityReport } from './periodic-check';

// ── 6.1 Crash Checkpoint Wrapper ──────────────────────────────────

/**
 * Wrap a dangerous operation with a crash checkpoint.
 * Saves the current pages state BEFORE the operation, so if the
 * browser crashes during the operation, the user can recover.
 *
 * This is the PRIMARY way to protect dangerous multi-step operations:
 *   - Scene transactions (split, merge, rebalance)
 *   - Block apply operations (auto-generate, regeneration)
 *   - Page reordering with schema changes
 *
 * Usage:
 *   const result = withCrashCheckpoint(pages, ratioId, 'commitSceneTransaction', () => {
 *     return commitSceneTransaction(pageId, tx);
 *   });
 *
 * If the operation succeeds, the checkpoint is automatically cleared.
 * If it fails or crashes, the checkpoint persists for recovery.
 */
export function withCrashCheckpoint<T>(
  pages: unknown[],
  ratioId: string,
  reason: string,
  operation: () => T,
): T {
  // Save checkpoint BEFORE the dangerous operation
  saveCrashCheckpoint(pages, ratioId, reason);

  try {
    const result = operation();

    // Operation succeeded — clear the checkpoint
    // Use a microtask so the checkpoint is available during
    // any synchronous side effects of the operation
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => {
        try { clearCrashRecovery(); } catch { /* ignore */ }
      });
    } else {
      // Fallback for environments without queueMicrotask
      try { clearCrashRecovery(); } catch { /* ignore */ }
    }

    return result;
  } catch (err) {
    // Operation FAILED — keep the checkpoint for recovery
    logger.warn('[Recovery]', `Operation failed, crash checkpoint retained: ${reason}`);
    throw err; // Re-throw — caller decides what to do
  }
}

// ── 6.3 Proactive Page Validation + Repair ─────────────────────────

export interface PageValidationResult {
  totalPages: number;
  validPages: number;
  repairedPages: number;
  corruptedPages: number;
  repairs: Array<{ pageIndex: number; pageId: string; details: string[] }>;
  unrecoverable: Array<{ pageIndex: number; pageId: string; details: string[] }>;
}

/**
 * Validate ALL pages and optionally repair corrupted schemas.
 * Called proactively on loadFromStorage (before the exception path)
 * and periodically by the integrity checker.
 *
 * This is non-throwing — all errors are caught and reported.
 * Returns a detailed report of what was found/fixed.
 */
export function validateAndRepairPages(
  pages: Array<{ id: string; schema?: ScreenSchema; [k: string]: unknown }>,
  options?: { autoRepair?: boolean },
): PageValidationResult {
  const result: PageValidationResult = {
    totalPages: pages.length,
    validPages: 0,
    repairedPages: 0,
    corruptedPages: 0,
    repairs: [],
    unrecoverable: [],
  };

  const shouldRepair = options?.autoRepair !== false;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // Page without schema — skip (might be a legacy page without schema yet)
    if (!page.schema) {
      result.validPages++;
      continue;
    }

    const validation = validateSchema(page.schema);
    if (validation.valid) {
      result.validPages++;
      continue;
    }

    // Schema is invalid
    result.corruptedPages++;

    if (shouldRepair) {
      const repairResult = repairSchema(page.schema);
      if (repairResult.repaired) {
        // Apply the repaired schema back to the page
        (page as Record<string, unknown>).schema = repairResult.schema;
        result.repairedPages++;
        result.repairs.push({
          pageIndex: i,
          pageId: page.id,
          details: repairResult.repairs,
        });
        // Also track unrecoverable issues from repaired pages
        if (repairResult.unrecoverable.length > 0) {
          result.unrecoverable.push({
            pageIndex: i,
            pageId: page.id,
            details: repairResult.unrecoverable,
          });
        }
      } else {
        result.unrecoverable.push({
          pageIndex: i,
          pageId: page.id,
          details: repairResult.unrecoverable,
        });
      }
    }
  }

  return result;
}

// ── 6.4 Pages Hash for Integrity ──────────────────────────────────

/**
 * Compute a hash of all page schemas for integrity verification.
 * Used during save/load to verify data was not corrupted in transit.
 */
export function computePagesHash(pages: unknown[]): string {
  // Only hash schema blocks (the single source of truth)
  const schemasOnly = pages.map((p: any) => {
    if (p?.schema?.blocks) {
      return { id: p.id, blocks: p.schema.blocks };
    }
    return { id: p?.id };
  });
  return computeSchemaHash(schemasOnly);
}

// ── 6.5 Safe Mode Feature Gates ──────────────────────────────────

/**
 * Feature gates that are disabled in safe mode.
 * Safe mode is activated when:
 *   - localStorage data was corrupted and required repair
 *   - Schema validation failed on load
 *   - Multiple integrity check failures detected
 *
 * In safe mode, these features are disabled to prevent further corruption:
 *   - Game blocks (complex rendering, potential crash sources)
 *   - Lazy rendering (may hide corrupted blocks)
 *   - Compression engine (may alter block heights incorrectly)
 *   - Scene overflow (split/merge disabled)
 */
export const SAFE_MODE_DISABLED_FEATURES = [
  'game-blocks',
  'lazy-render',
  'compression-engine',
  'scene-overflow-split',
  'scene-overflow-merge',
] as const;

export type SafeModeFeature = typeof SAFE_MODE_DISABLED_FEATURES[number];

/**
 * Check if a specific feature is allowed in the current mode.
 * Returns true if the feature is allowed (safe mode off, or feature not gated).
 */
export function isFeatureAllowed(feature: SafeModeFeature, safeMode: boolean): boolean {
  if (!safeMode) return true;
  return !SAFE_MODE_DISABLED_FEATURES.includes(feature);
}

// ── 6.2 Transaction Rollback Store Integration ─────────────────────

/**
 * Get the current transaction rollback manager state for store sync.
 * Used by recovery-slice to expose transaction state to the UI.
 */
export function getTransactionState(): {
  activeCount: number;
  checkpoints: ReadonlyArray<Readonly<TransactionCheckpoint>>;
} {
  return {
    activeCount: transactionRollback.getActiveCheckpoints().length,
    checkpoints: transactionRollback.getActiveCheckpoints(),
  };
}
