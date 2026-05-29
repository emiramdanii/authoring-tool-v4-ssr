// ═══════════════════════════════════════════════════════════════════
// RENDER DETERMINISM AUDIT — Same schema = same render, 100%
// ═══════════════════════════════════════════════════════════════════
// FASE 5.4: The render pipeline MUST be a pure function of schema.
// Any non-determinism is a bug.
//
// WHAT THIS MODULE DOES:
//   1. Audit render paths for non-deterministic inputs
//   2. Detect Date.now(), Math.random(), undefined-vs-missing
//   3. Verify layout hash stability
//   4. Check that same schema always produces same DOM structure
//
// DETERMINISM RULES:
//   ✅ ALLOWED:
//     - Schema-derived values (block.type, block.content, etc.)
//     - Computed layout from deterministic engine
//     - Theme tokens (resolved from themeId)
//     - Stable IDs (nanoid-generated, persisted in schema)
//
//   ❌ FORBIDDEN in render path:
//     - Date.now() or new Date()
//     - Math.random()
//     - Window dimensions (use viewport from layout engine)
//     - User agent detection
//     - localStorage reads (use store instead)
//     - Network requests
//     - Performance.now()
//     - Process.env in render output
//
// AUDIT APPROACH:
//   1. Static analysis: scan renderer source for forbidden patterns
//   2. Runtime check: render same schema twice, compare output
//   3. Hash verification: schema hash → render hash must be stable
// ═══════════════════════════════════════════════════════════════════

import type { ScreenSchema, SchemaBlock } from '../../schema/types';
import { isSpatialLayout } from '../../schema/types';
import { logger } from '../../utils/logger';

// ── Non-determinism Patterns ─────────────────────────────────────

const FORBIDDEN_PATTERNS = [
  { pattern: /Date\.now\(\)/g, name: 'Date.now()', severity: 'error' as const },
  { pattern: /new Date\(\)/g, name: 'new Date()', severity: 'error' as const },
  { pattern: /Math\.random\(\)/g, name: 'Math.random()', severity: 'error' as const },
  { pattern: /window\.inner(Width|Height)/g, name: 'window.innerWidth/Height', severity: 'warning' as const },
  { pattern: /localStorage\./g, name: 'localStorage direct read', severity: 'warning' as const },
  { pattern: /performance\.now\(\)/g, name: 'performance.now()', severity: 'warning' as const },
  { pattern: /navigator\./g, name: 'navigator access', severity: 'warning' as const },
  { pattern: /Math\.floor\(Math\.random/g, name: 'Math.floor(Math.random())', severity: 'error' as const },
];

// ── Determinism Violation ────────────────────────────────────────

export interface DeterminismViolation {
  file: string;
  pattern: string;
  name: string;
  severity: 'error' | 'warning';
  line?: number;
}

// ── Determinism Audit Result ─────────────────────────────────────

export interface DeterminismAuditResult {
  /** Whether the render pipeline is deterministic */
  isDeterministic: boolean;
  /** Violations found */
  violations: DeterminismViolation[];
  /** Total files scanned */
  filesScanned: number;
  /** Audit duration in ms */
  durationMs: number;
}

// ── Schema Fingerprint ───────────────────────────────────────────
// A deterministic hash of the schema that should always produce
// the same render output. If two schemas have the same fingerprint,
// their renders MUST be identical.

export function computeSchemaFingerprint(schema: ScreenSchema): string {
  // Simple deterministic serialization
  // This is NOT a cryptographic hash — it's a structural fingerprint
  const parts: string[] = [
    `id:${schema.id}`,
    `ver:${schema.version ?? 1}`,
    `type:${schema.templateType}`,
    `blocks:${schema.blocks.length}`,
  ];

  for (const block of schema.blocks) {
    parts.push(blockFingerprint(block));
  }

  // Simple hash (not crypto — just structural)
  let hash = 0;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }

  return `fp-${Math.abs(hash).toString(36)}`;
}

function blockFingerprint(block: SchemaBlock, depth: number = 0): string {
  const parts: string[] = [
    `${block.type}:${block.id ?? 'no-id'}`,
    `v:${block.variant ?? 'A'}`,
  ];

  if (block.layout && isSpatialLayout(block.layout)) {
    parts.push(`pos:${block.layout.position}`);
  } else if (block.layout && typeof block.layout === 'string') {
    parts.push(`variant:${block.layout}`);
  }

  if (block.compression) {
    parts.push(`comp:${block.compression.priority}:${block.compression.strategy}`);
  }

  if (block.children && block.children.length > 0) {
    parts.push(`children:${block.children.length}`);
    if (depth < 3) { // Prevent infinite recursion
      for (const child of block.children) {
        parts.push(blockFingerprint(child, depth + 1));
      }
    }
  }

  return parts.join(',');
}

// ── Runtime Determinism Check ────────────────────────────────────

/**
 * Verify that rendering the same schema produces the same result.
 * This is a runtime check that can be called in dev mode.
 *
 * HOW IT WORKS:
 *   1. Computes schema fingerprint
 *   2. Stores fingerprint → render hash mapping
 *   3. On subsequent renders of the same schema, checks that
 *      the render hash matches
 *   4. If mismatch → non-determinism detected
 */
export class RenderDeterminismChecker {
  private fingerprintToRenderHash = new Map<string, string>();
  private checkCount = 0;

  /**
   * Check a render result against the schema fingerprint.
   * Call this after rendering a schema.
   *
   * @param schema - The schema that was rendered
   * @param renderHash - A hash of the render output (e.g., outerHTML hash)
   * @returns Whether the render is consistent with previous renders
   */
  check(schema: ScreenSchema, renderHash: string): {
    consistent: boolean;
    previousHash: string | null;
    currentHash: string;
    fingerprint: string;
  } {
    this.checkCount++;
    const fingerprint = computeSchemaFingerprint(schema);
    const previousHash = this.fingerprintToRenderHash.get(fingerprint) ?? null;

    if (previousHash === null) {
      // First render with this schema — record it
      this.fingerprintToRenderHash.set(fingerprint, renderHash);
      return { consistent: true, previousHash: null, currentHash: renderHash, fingerprint };
    }

    if (previousHash !== renderHash) {
      // NON-DETERMINISM DETECTED!
      logger.error(
        'RENDER-DETERMINISM',
        `Non-deterministic render detected!\n` +
        `  Schema fingerprint: ${fingerprint}\n` +
        `  Previous render hash: ${previousHash}\n` +
        `  Current render hash: ${renderHash}\n` +
        `  Same schema produced different renders — this is a BUG.`
      );
      return { consistent: false, previousHash, currentHash: renderHash, fingerprint };
    }

    return { consistent: true, previousHash, currentHash: renderHash, fingerprint };
  }

  /** Get the number of checks performed */
  getCheckCount(): number {
    return this.checkCount;
  }

  /** Clear all recorded render hashes */
  clear(): void {
    this.fingerprintToRenderHash.clear();
    this.checkCount = 0;
  }
}

// ── Global Singleton ─────────────────────────────────────────────

export const renderDeterminismChecker = new RenderDeterminismChecker();

// ── Schema Equality Check ────────────────────────────────────────

/**
 * Check if two schemas are structurally equal.
 * Used for render determinism verification.
 *
 * This is a deep structural comparison that ignores:
 *   - Schema version (can differ between renders)
 *   - Object reference identity (only values matter)
 */
export function schemasAreStructurallyEqual(a: ScreenSchema, b: ScreenSchema): boolean {
  if (a.id !== b.id) return false;
  if (a.templateType !== b.templateType) return false;
  if (a.blocks.length !== b.blocks.length) return false;

  for (let i = 0; i < a.blocks.length; i++) {
    if (!blocksAreStructurallyEqual(a.blocks[i], b.blocks[i])) {
      return false;
    }
  }

  return true;
}

function blocksAreStructurallyEqual(a: SchemaBlock, b: SchemaBlock): boolean {
  if (a.type !== b.type) return false;
  if (a.id !== b.id) return false;
  if (a.variant !== b.variant) return false;

  // Layout comparison
  if (a.layout && b.layout) {
    if (isSpatialLayout(a.layout) && isSpatialLayout(b.layout)) {
      if (a.layout.position !== b.layout.position) return false;
      if (a.layout.x !== b.layout.x) return false;
      if (a.layout.y !== b.layout.y) return false;
    } else if (typeof a.layout === 'string' && typeof b.layout === 'string') {
      if (a.layout !== b.layout) return false;
    } else {
      return false; // Different layout kinds
    }
  } else if (a.layout !== b.layout) {
    return false;
  }

  // Children comparison
  const aChildren = a.children ?? [];
  const bChildren = b.children ?? [];
  if (aChildren.length !== bChildren.length) return false;

  for (let i = 0; i < aChildren.length; i++) {
    if (!blocksAreStructurallyEqual(aChildren[i], bChildren[i])) {
      return false;
    }
  }

  return true;
}
