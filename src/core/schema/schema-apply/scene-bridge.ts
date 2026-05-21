// ═══════════════════════════════════════════════════════════════════
// SCHEMA APPLY — Scene Plan → Transaction Bridge
// ═══════════════════════════════════════════════════════════════════
// These functions bridge the SceneOverflowEngine's computed plans
// with the transaction system. They convert DERIVED layout decisions
// into ATOMIC schema mutations.
//
// Flow:
//   SceneOverflowEngine.computeScenePlan() → ScenePlan
//   → rebalanceFromScenePlan() → Transaction
//   → commitSceneTransaction() → Store updated
//
// The ScenePlan is a DERIVED view (computed, disposable).
// The Transaction is a MUTATION (atomic, validated, rolled-back on failure).
// This bridge converts one to the other.
// ═══════════════════════════════════════════════════════════════════

import { useCanvaStore } from '@/store/canva/store';
import type { TransactionResult } from '../scene-transaction';
import { isFullPageBlockType } from '../capability-registry';
import { computeScenePlan, type ScenePlan } from '../../layout/SceneOverflowEngine';
import { getSceneResolution, computeSafeArea, DEFAULT_SAFE_AREA } from '../../scene/SceneLayoutEngine';
import { getMeasuredHeight } from '../../layout/BlockMeasurer';
import { rebalancePageCompression } from './transaction-ops';

/**
 * Compute a scene plan for a page and rebalance using transactions.
 *
 * This is the HIGH-LEVEL bridge between SceneOverflowEngine and
 * the transaction system. It:
 *   1. Computes a fresh ScenePlan from current measurements
 *   2. If the plan shows overflow, uses a transaction to rebalance
 *   3. Commits atomically — if validation fails, no changes
 *
 * Strategy (compression-first):
 *   - If blocks can be compressed to fit → compress (no page split)
 *   - If compression isn't enough → split into pages (promote)
 *   - If single scene → no action needed
 *
 * @param pageId - The page to rebalance
 * @param options - Scene computation options
 * @returns Transaction result with scene plan attached
 */
export function rebalanceFromScenePlan(
  pageId: string,
  options?: {
    /** Whether in compact (canvas) mode */
    isCompact?: boolean;
    /** Scene ratio ID (default: '16:9') */
    ratioId?: string;
    /** Whether to attempt compression before splitting */
    compressionFirst?: boolean;
  },
): TransactionResult & { pageUpdated: boolean; scenePlan: ScenePlan | null } {
  const store = useCanvaStore.getState();
  const page = store.pages.find(p => p.id === pageId);
  if (!page?.schema) {
    return {
      success: false,
      schema: null,
      executedSteps: [],
      error: `Page "${pageId}" has no schema`,
      measurements: new Map(),
      compressedHeights: new Map(),
      pageUpdated: false,
      scenePlan: null,
    };
  }

  const isCompact = options?.isCompact ?? true;
  const ratioId = options?.ratioId ?? '16:9';
  const sceneRes = getSceneResolution(ratioId);
  // Check if the page is a full-page block (cover, hero) that fills the entire scene.
  // Uses capability registry as single source of truth — previously used indirect
  // capability checks (not compressionCapable AND not splittable) which was fragile.
  const hasFullPageBlock = page.schema.blocks.length === 1 &&
    isFullPageBlockType(page.schema.blocks[0].type);
  const safeArea = hasFullPageBlock
    ? DEFAULT_SAFE_AREA
    : computeSafeArea({
        showTopNav: false,
        showBottomNav: false,
        isCompact,
        pagePadding: 16,
      });

  // Step 1: Compute fresh scene plan from current measurements
  const scenePlan = computeScenePlan(page.schema, sceneRes, safeArea, { isCompact });

  // Single scene → no overflow, nothing to rebalance
  if (scenePlan.isSingleScene) {
    return {
      success: true,
      schema: page.schema,
      executedSteps: [],
      measurements: new Map(),
      compressedHeights: new Map(),
      pageUpdated: false,
      scenePlan,
    };
  }

  // Step 2: Collect measurements from the measurement cache
  const measurements = new Map<string, number>();
  for (const block of page.schema.blocks) {
    if (block.id) {
      const h = getMeasuredHeight(block.id);
      if (h != null) {
        measurements.set(block.id, h);
      }
    }
  }

  // Step 3: Rebalance using transaction
  //   - If compression-first: try to compress blocks to fit
  //   - If that's not enough: the user can manually promote the split
  const availableHeight = sceneRes.h - safeArea.top - safeArea.bottom;
  const compressionFirst = options?.compressionFirst ?? true;

  const result = rebalancePageCompression(pageId, measurements, {
    availableHeight,
    compressionFirst,
    blockGap: isCompact ? 8 : 12,
  });

  return {
    ...result,
    scenePlan,
  };
}
