// ═══════════════════════════════════════════════════════════════════
// SNAPSHOT INTEGRITY — Checksum verification for saved data
// ═══════════════════════════════════════════════════════════════════
// FASE 6.3: Detects corrupted saves by computing and verifying
// checksums of schema data. When data is saved to localStorage or DB,
// a lightweight hash is computed and stored alongside the data.
//
// On load, the hash is recomputed and compared. If they don't match,
// the data was corrupted (truncated, bit-flipped, partial write, etc.).
//
// ARCHITECTURE:
//   SAVE: data + checksum → storage
//   LOAD: data + checksum → verify → accept / reject / heal
//
// CHECKSUM ALGORITHM:
//   We use a fast, deterministic hash (djb2 variant) that runs on
//   the JSON-serialized data. This is NOT cryptographic — it's for
//   detecting accidental corruption, not tampering.
//
// INTEGRATION POINTS:
//   1. persistence-slice.ts saveToStorage() — compute and store checksum
//   2. persistence-slice.ts loadFromStorage() — verify checksum
//   3. loadFromDB() — verify checksum
//   4. RecoveryDialog — offer healing when corruption detected
//
// GUARANTEES:
//   - Checksum computation is O(n) where n = JSON string length
//   - Checksum is a 32-bit unsigned integer (stored as hex string)
//   - False positive rate is ~1 in 4 billion (acceptable for corruption detection)
//   - Checksum never blocks the main thread for <100KB data
// ═══════════════════════════════════════════════════════════════════

import type { ScreenSchema, SchemaBlock } from './types';
import { schemaHealer } from './schema-healer';
import { logger } from '../utils/logger';

// ── Checksum Key ──────────────────────────────────────────────────

const CHECKSUM_KEY = 'silse_data_checksum';
const CHECKSUM_VERSION = 1;

// ── Integrity Check Result ────────────────────────────────────────

export type IntegrityStatus = 'valid' | 'corrupted' | 'no-checksum' | 'empty';

export interface IntegrityCheckResult {
  /** Status of the integrity check */
  status: IntegrityStatus;
  /** Expected checksum (from storage) */
  expectedChecksum: string | null;
  /** Computed checksum (from data) */
  computedChecksum: string | null;
  /** Whether the data can be salvaged */
  canRecover: boolean;
  /** Timestamp when the checksum was originally computed */
  checksumTimestamp: number | null;
  /** Size of the data in bytes (approximate) */
  dataSize: number;
}

// ── Checksum Computation ──────────────────────────────────────────

/**
 * Compute a fast djb2 hash of a string.
 * This is NOT cryptographic — it's for detecting accidental corruption.
 * Returns a hex string.
 */
export function computeChecksum(data: string): string {
  let hash = 5381;
  const len = data.length;

  // Standard djb2 with a slight twist for better distribution
  for (let i = 0; i < len; i++) {
    hash = ((hash << 5) + hash + data.charCodeAt(i)) | 0; // hash * 33 + c
  }

  // Convert to unsigned 32-bit hex
  const unsigned = hash >>> 0;
  return unsigned.toString(16).padStart(8, '0');
}

/**
 * Compute a checksum for a ScreenSchema.
 * Serializes to JSON deterministically (sorted keys) before hashing.
 */
export function computeSchemaChecksum(schema: ScreenSchema): string {
  // Deterministic serialization: sort keys to ensure same schema
  // always produces the same checksum regardless of key order
  const json = deterministicStringify(schema);
  return computeChecksum(json);
}

/**
 * Compute a checksum for the full persistence payload.
 * This covers pages[] + ratioId + metadata.
 */
export function computePayloadChecksum(payload: { pages: unknown[]; ratioId?: string; [key: string]: unknown }): string {
  const json = deterministicStringify(payload);
  return computeChecksum(json);
}

// ── Deterministic JSON Serialization ──────────────────────────────

/**
 * JSON.stringify with sorted keys for deterministic output.
 * This ensures that the same data always produces the same hash,
 * regardless of the order in which properties were added.
 */
function deterministicStringify(obj: unknown, depth: number = 0): string {
  if (depth > 50) return '"[max-depth]"'; // Prevent stack overflow

  if (obj === null) return 'null';
  if (obj === undefined) return 'null';

  const t = typeof obj;
  if (t === 'string') return JSON.stringify(obj);
  if (t === 'number' || t === 'boolean') return String(obj);

  if (Array.isArray(obj)) {
    const items = obj.map(item => deterministicStringify(item, depth + 1));
    return `[${items.join(',')}]`;
  }

  if (t === 'object') {
    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
    const pairs = sortedKeys.map(key => {
      const value = (obj as Record<string, unknown>)[key];
      return `${JSON.stringify(key)}:${deterministicStringify(value, depth + 1)}`;
    });
    return `{${pairs.join(',')}}`;
  }

  // Functions, Symbols, etc. — skip
  return 'null';
}

// ── Save/Load Checksum ────────────────────────────────────────────

/**
 * Save a checksum for the current data payload.
 * Called after successful save to localStorage.
 */
export function saveChecksum(checksum: string, dataSize: number): void {
  if (typeof window === 'undefined') return;

  try {
    const record = {
      v: CHECKSUM_VERSION,
      checksum,
      dataSize,
      timestamp: Date.now(),
    };
    localStorage.setItem(CHECKSUM_KEY, JSON.stringify(record));
  } catch {
    // Non-critical — checksum is a best-effort integrity check
  }
}

/**
 * Verify the integrity of loaded data against the stored checksum.
 * Called after loading from localStorage.
 */
export function verifyIntegrity(
  payload: { pages: unknown[]; ratioId?: string; [key: string]: unknown }
): IntegrityCheckResult {
  if (typeof window === 'undefined') {
    return {
      status: 'no-checksum',
      expectedChecksum: null,
      computedChecksum: null,
      canRecover: true,
      checksumTimestamp: null,
      dataSize: 0,
    };
  }

  // Read stored checksum
  let storedChecksum: string | null = null;
  let checksumTimestamp: number | null = null;
  let storedDataSize: number = 0;

  try {
    const raw = localStorage.getItem(CHECKSUM_KEY);
    if (raw) {
      const record = JSON.parse(raw);
      storedChecksum = record.checksum;
      checksumTimestamp = record.timestamp;
      storedDataSize = record.dataSize || 0;
    }
  } catch {
    // Corrupted checksum record
  }

  // Compute current checksum
  const json = deterministicStringify(payload);
  const computedChecksum = computeChecksum(json);
  const dataSize = json.length;

  // No stored checksum — can't verify
  if (!storedChecksum) {
    return {
      status: 'no-checksum',
      expectedChecksum: null,
      computedChecksum,
      canRecover: true,
      checksumTimestamp: null,
      dataSize,
    };
  }

  // Empty data
  if (!payload.pages || payload.pages.length === 0) {
    return {
      status: 'empty',
      expectedChecksum: storedChecksum,
      computedChecksum,
      canRecover: false,
      checksumTimestamp,
      dataSize,
    };
  }

  // Verify
  if (storedChecksum === computedChecksum) {
    return {
      status: 'valid',
      expectedChecksum: storedChecksum,
      computedChecksum,
      canRecover: true,
      checksumTimestamp,
      dataSize,
    };
  }

  // Mismatch — data is corrupted
  logger.error('SNAPSHOT-INTEGRITY', `Checksum mismatch! Expected ${storedChecksum}, got ${computedChecksum}. Data may be corrupted.`);

  return {
    status: 'corrupted',
    expectedChecksum: storedChecksum,
    computedChecksum,
    canRecover: true, // We can try to heal
    checksumTimestamp,
    dataSize,
  };
}

/**
 * Remove the stored checksum (e.g., after factory reset).
 */
export function clearChecksum(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CHECKSUM_KEY);
  } catch {
    // Non-critical
  }
}

// ── Page-Level Integrity ──────────────────────────────────────────

/**
 * Compute a checksum for a single page's schema.
 * Useful for detecting which specific page is corrupted.
 */
export function computePageChecksum(pageIndex: number, schema: ScreenSchema): string {
  return computeChecksum(deterministicStringify({ pageIndex, schema }));
}

/**
 * Verify the integrity of a single page by checking its schema
 * blocks for structural validity and serializability.
 */
export function verifyPageIntegrity(schema: ScreenSchema): {
  valid: boolean;
  blockErrors: Array<{ blockIndex: number; blockId?: string; error: string }>;
} {
  const blockErrors: Array<{ blockIndex: number; blockId?: string; error: string }> = [];

  if (!schema.blocks || !Array.isArray(schema.blocks)) {
    return { valid: false, blockErrors: [{ blockIndex: -1, error: 'Schema blocks is not an array' }] };
  }

  for (let i = 0; i < schema.blocks.length; i++) {
    const block = schema.blocks[i];

    if (!block || typeof block !== 'object') {
      blockErrors.push({ blockIndex: i, error: 'Block is not an object' });
      continue;
    }

    if (!block.type || typeof block.type !== 'string') {
      blockErrors.push({ blockIndex: i, blockId: block.id, error: `Invalid type: ${block.type}` });
    }

    // Check for non-serializable values at top level
    for (const key of Object.keys(block)) {
      const val = (block as Record<string, unknown>)[key];
      if (typeof val === 'function') {
        blockErrors.push({ blockIndex: i, blockId: block.id, error: `Non-serializable field: ${key} (function)` });
      }
    }
  }

  return { valid: blockErrors.length === 0, blockErrors };
}

// ── Healing Integration ──────────────────────────────────────────

/**
 * Attempt to heal corrupted data by running the SchemaHealer
 * on each page's schema. Returns the healed pages array.
 */
export function healCorruptedPages(pages: Array<{ schema?: ScreenSchema; [key: string]: unknown }>): {
  pages: Array<{ schema?: ScreenSchema; [key: string]: unknown }>;
  healedCount: number;
  report: string[];
} {
  const report: string[] = [];
  let healedCount = 0;

  const healedPages = pages.map((page, idx) => {
    if (!page.schema) return page;

    try {
      const result = schemaHealer.heal(page.schema);
      if (result.wasRepaired) {
        healedCount++;
        report.push(`Page ${idx} (${page.schema.id}): ${result.report.repairedCount} blocks repaired, ${result.report.removedCount} removed`);
        return { ...page, schema: result.schema };
      }
    } catch (err) {
      report.push(`Page ${idx}: Healing failed — ${err instanceof Error ? err.message : String(err)}`);
    }

    return page;
  });

  return { pages: healedPages, healedCount, report };
}
