// ═══════════════════════════════════════════════════════════════════
// RENDER INVARIANTS — Validation for the render pipeline
// ═══════════════════════════════════════════════════════════════════
// FASE 2 — Validates that the render pipeline produces deterministic,
// correct output. These checks catch:
//
//   - Duplicate block IDs (causes selection/editing conflicts)
//   - NaN positions (causes invisible blocks)
//   - Zero-height blocks (causes layout gaps)
//   - Orphan blocks (blocks in resolved but not in schema)
//   - Invalid scene bounds (causes overflow)
//   - Layout non-determinism (same schema → different layout)
//
// USAGE:
//   Call validateRenderInvariant() after resolveSceneLayout() in dev mode.
//   Call computeLayoutHash() to detect non-determinism across renders.
//
// DESIGN:
//   - Dev-only (zero cost in production — tree-shaken)
//   - Non-blocking (logs warnings, never throws)
//   - Idempotent (safe to call on every render)
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from '../schema/types';
import type { ResolvedBlockPosition, SafeArea, SceneResolution } from '../scene/SceneLayoutEngine';

// ── Render Invariant Violation ────────────────────────────────────

export interface RenderViolation {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  blockId?: string;
  blockType?: string;
  detail?: Record<string, unknown>;
}

// ── Validation Result ─────────────────────────────────────────────

export interface RenderValidationResult {
  valid: boolean;
  violations: RenderViolation[];
  /** Hash of the layout — use to detect non-determinism */
  layoutHash: string;
}

// ── Layout Hash ───────────────────────────────────────────────────

/**
 * Compute a deterministic hash of the resolved layout.
 * If the same schema produces a different hash across renders,
 * there is a hidden mutation or non-determinism in the pipeline.
 *
 * The hash covers:
 *   - Block positions (x, y, width, height)
 *   - Block order
 *   - Overflow rules
 *   - Scene dimensions + safe area
 *
 * This is a simple FNV-1a hash — fast enough for every-render usage.
 */
export function computeLayoutHash(
  resolved: ResolvedBlockPosition[],
  scene: SceneResolution,
  safeArea: SafeArea,
): string {
  // Build a string representation of the layout state
  const parts: string[] = [
    `scene:${scene.w}x${scene.h}`,
    `safe:${safeArea.top},${safeArea.bottom},${safeArea.left},${safeArea.right}`,
  ];

  for (const rb of resolved) {
    parts.push(
      `${rb.block.id || rb.key}:${rb.block.type}:` +
      `${Math.round(rb.x)},${Math.round(rb.y)},${Math.round(rb.width)},${Math.round(rb.height)}:` +
      `${rb.overflow}:${rb.zIndex}:${rb.isOverflowing ? 1 : 0}`
    );
  }

  const layoutStr = parts.join('|');

  // FNV-1a hash (32-bit)
  let hash = 2166136261;
  for (let i = 0; i < layoutStr.length; i++) {
    hash ^= layoutStr.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
}

// ── Last Layout Hash (for non-determinism detection) ─────────────

const _lastLayoutHashes = new Map<string, { hash: string; schemaBlockCount: number }>();

/**
 * Check if the layout hash has changed without a schema change.
 * If it has, there's a hidden mutation or non-determinism.
 *
 * @param pageId - The page ID (to track per-page)
 * @param schema - The schema that produced this layout
 * @param currentHash - The hash from computeLayoutHash()
 */
export function checkLayoutDeterminism(
  pageId: string,
  schema: ScreenSchema,
  currentHash: string,
): void {
  const schemaBlockCount = schema.blocks.length;
  const last = _lastLayoutHashes.get(pageId);

  if (last && last.schemaBlockCount === schemaBlockCount && last.hash !== currentHash) {
    // Same number of blocks but different layout hash — NON-DETERMINISM!
    console.warn(
      `[RENDER-DETERMINISM] Page "${pageId}": Layout hash changed ` +
      `(${last.hash} → ${currentHash}) without schema change. ` +
      `This indicates non-determinism in the render pipeline. ` +
      `Possible causes: measurement cache drift, stale compressed heights, ` +
      `or external state affecting resolveSceneLayout().`
    );
  }

  _lastLayoutHashes.set(pageId, { hash: currentHash, schemaBlockCount });
}

/**
 * Clear the stored hash for a page (e.g., after schema mutation).
 */
export function invalidateLayoutHash(pageId: string): void {
  _lastLayoutHashes.delete(pageId);
}

// ── Render Invariant Validation ───────────────────────────────────

/**
 * Validate that the render pipeline output is correct and consistent.
 *
 * Checks:
 *   1. Block IDs are unique (no duplicates)
 *   2. No NaN positions (x, y, width, height)
 *   3. No zero-height flow blocks (causes layout gaps)
 *   4. No negative positions (causes invisible blocks)
 *   5. All schema blocks are represented in resolved output
 *   6. Scene bounds are valid
 *
 * @param schema - The input schema
 * @param resolved - The output from resolveSceneLayout()
 * @param scene - Scene resolution
 * @param safeArea - Safe area
 * @returns Validation result with violations and layout hash
 */
export function validateRenderInvariant(
  schema: ScreenSchema,
  resolved: ResolvedBlockPosition[],
  scene: SceneResolution,
  safeArea: SafeArea,
): RenderValidationResult {
  const violations: RenderViolation[] = [];

  // ── Check 1: Block ID uniqueness ──
  const seenIds = new Map<string, number>();
  for (const rb of resolved) {
    const id = rb.block.id;
    if (!id) continue;
    const count = (seenIds.get(id) || 0) + 1;
    seenIds.set(id, count);
    if (count > 1) {
      violations.push({
        severity: 'error',
        code: 'DUPLICATE_BLOCK_ID',
        message: `Block ID "${id}" appears ${count} times — causes selection/editing conflicts`,
        blockId: id,
        blockType: rb.block.type,
      });
    }
  }

  // ── Check 2: No NaN positions ──
  for (const rb of resolved) {
    if (Number.isNaN(rb.x) || Number.isNaN(rb.y) || Number.isNaN(rb.width) || Number.isNaN(rb.height)) {
      violations.push({
        severity: 'error',
        code: 'NAN_POSITION',
        message: `Block "${rb.block.id || rb.key}" has NaN position — will be invisible`,
        blockId: rb.block.id,
        blockType: rb.block.type,
        detail: { x: rb.x, y: rb.y, width: rb.width, height: rb.height },
      });
    }
  }

  // ── Check 3: Zero-height flow blocks ──
  for (const rb of resolved) {
    if (rb.position === 'flow' && rb.height <= 0) {
      violations.push({
        severity: 'warning',
        code: 'ZERO_HEIGHT_FLOW',
        message: `Flow block "${rb.block.id || rb.key}" has zero height — may cause layout gap`,
        blockId: rb.block.id,
        blockType: rb.block.type,
        detail: { height: rb.height },
      });
    }
  }

  // ── Check 4: Negative positions for flow blocks ──
  for (const rb of resolved) {
    if (rb.position === 'flow' && rb.y < 0) {
      violations.push({
        severity: 'error',
        code: 'NEGATIVE_FLOW_Y',
        message: `Flow block "${rb.block.id || rb.key}" has negative Y (${rb.y}) — will be invisible`,
        blockId: rb.block.id,
        blockType: rb.block.type,
      });
    }
  }

  // ── Check 5: All schema blocks are in resolved output ──
  const resolvedBlockIds = new Set(resolved.map(rb => rb.block.id).filter(Boolean));
  for (const block of schema.blocks) {
    if (block.id && !resolvedBlockIds.has(block.id)) {
      violations.push({
        severity: 'warning',
        code: 'ORPHAN_SCHEMA_BLOCK',
        message: `Schema block "${block.id}" (${block.type}) not in resolved layout — will not render`,
        blockId: block.id,
        blockType: block.type,
      });
    }
  }

  // ── Check 6: Scene bounds valid ──
  if (scene.w <= 0 || scene.h <= 0) {
    violations.push({
      severity: 'error',
      code: 'INVALID_SCENE_BOUNDS',
      message: `Scene bounds are invalid: ${scene.w}x${scene.h}`,
      detail: { sceneW: scene.w, sceneH: scene.h },
    });
  }

  // ── Check 7: Safe area consistency ──
  if (safeArea.top < 0 || safeArea.bottom < 0 || safeArea.left < 0 || safeArea.right < 0) {
    violations.push({
      severity: 'error',
      code: 'NEGATIVE_SAFE_AREA',
      message: `Safe area has negative values — will cause layout issues`,
      detail: { safeArea },
    });
  }

  // Compute layout hash
  const layoutHash = computeLayoutHash(resolved, scene, safeArea);

  return {
    valid: violations.filter(v => v.severity === 'error').length === 0,
    violations,
    layoutHash,
  };
}
