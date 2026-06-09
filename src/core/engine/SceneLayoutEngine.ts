/**
 * SILSE — Scene Layout Engine
 * Computes layout for 1280×720 fixed-scene authoring.
 * Refactored in Task #1 — uses BlockCapabilityRegistry.
 */

import type { ScreenSchema, SchemaBlock } from '../schema/types';
import { estimateBlockHeight, SCENE_MAX_HEIGHT, type OverflowCheckResult } from '../schema/transaction';
import { BlockCapabilityRegistry, isCompositeBlockType } from '../schema/capability-registry';

// ─── Layout Constants ──────────────────────────────────────────────────
export const SCENE_WIDTH = 1280;
export const SCENE_HEIGHT = 720;
export const HEADER_HEIGHT = 42;
export const FOOTER_HEIGHT = 42;
export const CONTENT_PADDING = 24;
export const CONTENT_WIDTH = SCENE_WIDTH - CONTENT_PADDING * 2;
export const CONTENT_MAX_HEIGHT = SCENE_MAX_HEIGHT;

// ─── Block Layout ──────────────────────────────────────────────────────
export interface BlockLayout {
  blockId: string;
  blockType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  variant: string;
  isOverflowing: boolean;
  children?: BlockLayout[];
}

// ─── Scene Layout Result ───────────────────────────────────────────────
export interface SceneLayout {
  width: number;
  height: number;
  contentX: number;
  contentY: number;
  contentWidth: number;
  contentMaxHeight: number;
  blocks: BlockLayout[];
  totalHeight: number;
  overflow: OverflowCheckResult;
}

// ─── Engine ────────────────────────────────────────────────────────────

export class SceneLayoutEngine {
  /**
   * Compute layout for a single scene (page).
   * Blocks are laid out top-to-bottom within the content area.
   */
  computeLayout(schema: ScreenSchema): SceneLayout {
    const blocks: BlockLayout[] = [];
    let currentY = 0;

    for (const block of schema.blocks) {
      const layout = this.layoutBlock(block, CONTENT_PADDING, currentY, CONTENT_WIDTH);
      blocks.push(layout);
      currentY += layout.height;
    }

    const overflow: OverflowCheckResult = {
      hasOverflow: currentY > CONTENT_MAX_HEIGHT,
      totalHeight: currentY,
      maxHeight: CONTENT_MAX_HEIGHT,
      remainingSpace: CONTENT_MAX_HEIGHT - currentY,
      blockHeights: blocks.map(b => ({
        blockId: b.blockId,
        type: b.blockType,
        estimatedHeight: b.height,
      })),
    };

    return {
      width: SCENE_WIDTH,
      height: SCENE_HEIGHT,
      contentX: CONTENT_PADDING,
      contentY: HEADER_HEIGHT,
      contentWidth: CONTENT_WIDTH,
      contentMaxHeight: CONTENT_MAX_HEIGHT,
      blocks,
      totalHeight: currentY,
      overflow,
    };
  }

  /**
   * Layout a single block and its children.
   */
  private layoutBlock(
    block: SchemaBlock,
    x: number,
    y: number,
    availableWidth: number
  ): BlockLayout {
    const height = estimateBlockHeight(block);
    const isOverflowing = y + height > SCENE_HEIGHT;

    const layout: BlockLayout = {
      blockId: block.id ?? '',
      blockType: block.type,
      x,
      y,
      width: availableWidth,
      height,
      variant: block.variant ?? 'A',
      isOverflowing,
    };

    // Layout children of composite blocks
    if (isCompositeBlockType(block.type)) {
      const blockAny = block as Record<string, unknown>;
      const children = (block.children ?? (blockAny.items as SchemaBlock[] | undefined) ?? (blockAny.tabs as SchemaBlock[] | undefined)) ?? [];
      if (children.length > 0) {
        layout.children = [];
        let childY = y;
        for (const child of children) {
          const childLayout = this.layoutBlock(child, x + CONTENT_PADDING, childY, availableWidth - CONTENT_PADDING * 2);
          layout.children.push(childLayout);
          childY += childLayout.height;
        }
      }
    }

    return layout;
  }

  /**
   * Quick overflow check without full layout computation.
   */
  checkOverflow(schema: ScreenSchema): OverflowCheckResult {
    let totalHeight = 0;
    const blockHeights: OverflowCheckResult['blockHeights'] = [];

    for (const block of schema.blocks) {
      const h = estimateBlockHeight(block);
      totalHeight += h;
      blockHeights.push({ blockId: block.id ?? '', type: block.type, estimatedHeight: h });
    }

    return {
      hasOverflow: totalHeight > CONTENT_MAX_HEIGHT,
      totalHeight,
      maxHeight: CONTENT_MAX_HEIGHT,
      remainingSpace: CONTENT_MAX_HEIGHT - totalHeight,
      blockHeights,
    };
  }
}

// Singleton
export const sceneLayoutEngine = new SceneLayoutEngine();
