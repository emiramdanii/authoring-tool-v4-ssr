// ═══════════════════════════════════════════════════════════════════
// SCENE LAYOUT ENGINE — Deterministic, JS-driven layout calculator
// ═══════════════════════════════════════════════════════════════════
//
// PRINSIP: Browser hanya menggambar. Scene engine mengontrol layout.
//
// Masalah yang diselesaikan:
//   - Browser flex/grid layout → tidak deterministik → overflow chaos
//   - Auto height → berubah saat konten berubah → drift
//   - Responsive relayout → posisi berubah → preview ≠ export
//
// Solusi:
//   - Virtual canvas dengan fixed coordinate system
//   - Semua posisi dihitung di JS, bukan oleh CSS
//   - Scale transform untuk viewport adaptation (BUKAN relayout)
//   - Internal block boleh flex/grid, tapi scene position = absolute
//
// Pipeline:
//   SchemaBlock → resolveSceneLayout() → ResolvedBlock → renderer
//
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, BlockLayout } from '../schema/types';
import { getBlockMeta } from '../registry/BlockDefinitionRegistry';
import { getMeasuredHeight, hasMeasurement } from '../layout/BlockMeasurer';
import { computeCompressionDecision, type CompressionDecision } from '../layout/CompressionEngine';
import {
  deriveOverflowRule,
  isFullPageBlockType,
  isBlockTypeMeasurable,
  type OverflowRule,
} from '../schema/capability-registry';
import { getCompressedHeight } from '../schema/session-state';

// ── Virtual Scene Coordinate System ───────────────────────────

/** Virtual scene resolution — all coordinates are computed against this */
export interface SceneResolution {
  /** Virtual width in px — maps to the actual canvas ratio width */
  w: number;
  /** Virtual height in px — maps to the actual canvas ratio height */
  h: number;
}

/** Standard scene resolutions matching RATIOS from types.ts */
export const SCENE_RESOLUTIONS: Record<string, SceneResolution> = {
  '16:9': { w: 1280, h: 720 },
  '9:16': { w: 720, h: 1280 },
  '1:1':  { w: 800, h: 800 },
  'A4':   { w: 794, h: 1123 },
  '4:3':  { w: 1024, h: 768 },
};

/** Get scene resolution by ratio ID */
export function getSceneResolution(ratioId: string): SceneResolution {
  return SCENE_RESOLUTIONS[ratioId] ?? SCENE_RESOLUTIONS['16:9']!;
}

// ── Safe Area System ──────────────────────────────────────────

/** Safe area — content must stay within these bounds */
export interface SafeArea {
  /** Top offset in px (e.g., navbar height) */
  top: number;
  /** Bottom offset in px (e.g., bottom navbar height) */
  bottom: number;
  /** Left padding in px */
  left: number;
  /** Right padding in px */
  right: number;
}

/** Default safe area — no navbar, minimal padding */
export const DEFAULT_SAFE_AREA: SafeArea = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

/**
 * Compute safe area from navbar config and mode.
 * Navbar heights are deterministic — measured once, reused everywhere.
 * This replaces the ResizeObserver-based approach in PageFrame.
 */
export function computeSafeArea(options: {
  showTopNav: boolean;
  showBottomNav: boolean;
  isCompact: boolean;
  topNavHeight?: number;
  bottomNavHeight?: number;
  pagePadding?: number;
}): SafeArea {
  const {
    showTopNav,
    showBottomNav,
    isCompact,
    topNavHeight = isCompact ? 36 : 44,
    bottomNavHeight = isCompact ? 48 : 80,
    pagePadding = 16,
  } = options;

  return {
    top: showTopNav ? topNavHeight : 0,
    bottom: showBottomNav ? bottomNavHeight : 0,
    left: pagePadding,
    right: pagePadding,
  };
}

// ── Overflow Rules ────────────────────────────────────────────
// Re-export OverflowRule type from capability-registry (single source of truth).
// The type is defined in capability-registry.ts alongside deriveOverflowRule().
export type { OverflowRule } from '../schema/capability-registry';

/**
 * Explicit overflow rule overrides per block type.
 *
 * These entries OVERRIDE the capability-derived default from deriveOverflowRule().
 * Only add an entry here when a block type's overflow behavior differs from
 * what the capability registry would derive.
 *
 * Capability-derived defaults (from deriveOverflowRule()):
 *   - Not measurable (cover, hero, games) → 'clip'
 *   - Otherwise (measurable) → 'autoResize'
 *
 * The 'internalScroll' rule is NEVER derived — it's always an explicit override.
 * This is because the 'interactive' capability does NOT imply 'internalScroll':
 * many blocks are interactive (diskusi, refleksi) but should still auto-resize.
 * Only blocks with their own scroll/navigation UI need 'internalScroll'.
 *
 * When adding a new block type, you typically do NOT need to add an entry here.
 * The capability-derived default will be correct. Only add an override if
 * the derived rule doesn't match the desired behavior.
 */
export const BLOCK_OVERFLOW_RULES: Record<string, OverflowRule> = {
  // ── internalScroll overrides ──
  // These blocks have their own scroll/navigation UI.
  // Capability-derived default would be 'autoResize' (they are measurable).
  'kuis': 'internalScroll',            // question navigation
  'skenario': 'internalScroll',         // step/chapter navigation
  'flashcard-set': 'internalScroll',    // card flip navigation
  'ftab': 'internalScroll',             // tab content scroll
  'fill-blank-game': 'internalScroll',  // fill-in-the-blank input scroll
  'true-false-game': 'internalScroll',  // question navigation in T/F game

  // ── clip overrides ──
  // These game types need 'clip' but their capability-derived default
  // already gives 'clip' (not measurable). Listed here for documentation
  // clarity — they could be removed without changing behavior.
  // (Uncomment if you want to be explicit about game overflow rules.)
  // 'sortir-game': 'clip',
  // 'roda-game': 'clip',
  // 'memory-game': 'clip',
  // 'matching-game': 'clip',
  // 'word-search-game': 'clip',
  // 'drag-drop-game': 'clip',
  // 'crossword-game': 'clip',
  // 'team-buzzer-game': 'clip',
};

/**
 * Get overflow rule for a block type.
 *
 * Resolution order:
 *   1. BLOCK_OVERFLOW_RULES — explicit overrides (when derived default is wrong)
 *   2. deriveOverflowRule() — capability-driven default (covers 90%+ of types)
 *
 * This means: new block types automatically get the right overflow rule
 * from their capabilities. No need to add an entry to BLOCK_OVERFLOW_RULES
 * unless the derived default is wrong.
 */
export function getOverflowRule(blockType: string): OverflowRule {
  return BLOCK_OVERFLOW_RULES[blockType] ?? deriveOverflowRule(blockType);
}

// ── Token-Based Spacing ───────────────────────────────────────

/**
 * Spacing tokens — deterministic, no magic numbers.
 * All spacing in the scene engine uses these values.
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export type SpacingKey = keyof typeof SPACING;

/** Gap between flow blocks in px */
export const BLOCK_GAP: Record<'compact' | 'normal', number> = {
  compact: SPACING.sm,  // 8px in canvas mode
  normal: SPACING.md,   // 12px in preview/export mode
};

/** Z-index for cover/hero full-page blocks.
 *
 * MUST be ≥ 1 so the cover renders ABOVE the page background.
 * Previously zIndex:0 caused the "cover invisible" bug — the cover
 * rendered behind the page background in certain CSS stacking contexts.
 *
 * Cover isolation (coverIsolation=true, the default) ensures that when
 * a cover block coexists with flow blocks on the same page, only the
 * cover is rendered, so there is no occlusion conflict with flow blocks
 * (which also use zIndex:1).
 */
export const COVER_Z_INDEX = 1;

// ── Resolved Block Position ───────────────────────────────────

/**
 * A block with computed absolute position in the virtual scene.
 * This is the OUTPUT of the scene layout engine.
 * The renderer simply maps these to CSS absolute positioning.
 *
 * This is the SINGLE SOURCE OF TRUTH for block positions.
 * Browser flex/grid is NO LONGER the layout authority.
 */
export interface ResolvedBlockPosition {
  /** The original schema block */
  block: SchemaBlock;
  /** X position in px (from left edge of scene) */
  x: number;
  /** Y position in px (from top edge of scene) */
  y: number;
  /** Width in px */
  width: number;
  /** Height in px (estimated — deterministic, not browser-driven) */
  height: number;
  /** Whether this block uses absolute or flow positioning */
  position: 'flow' | 'absolute';
  /** How overflow is handled */
  overflow: OverflowRule;
  /** Maximum height if autoResize (content can grow up to this) */
  maxHeight?: number;
  /** Minimum height (block won't shrink below this) */
  minHeight?: number;
  /** Z-index layer */
  zIndex: number;
  /** Rotation in degrees */
  rotation: number;
  /** Unique key for React rendering */
  key: string;
  /** Whether this block overflows the content area */
  isOverflowing: boolean;
  /** Compression decision (if block is compressed to fit) */
  compression?: CompressionDecision;
}

// ── Block Height Estimation ───────────────────────────────────

/**
 * Estimate the rendered height of a block based on its schema data.
 * This is DETERMINISTIC — it uses block content + registry data,
 * NOT browser measurement.
 *
 * The estimation considers:
 *   - Block type base height (from registry)
 *   - Content quantity (number of items, questions, etc.)
 *   - Variant (A/B/C)
 *   - Compact mode (canvas vs preview)
 *
 * Future evolution: estimateBlockHeight() → measureBlock()
 * When inline editing / AI generation requires actual measurement,
 * we'll add a measure pass after initial resolve.
 */
export function estimateBlockHeight(
  block: SchemaBlock,
  options: {
    isCompact: boolean;
    variant?: 'A' | 'B' | 'C';
    availableWidth?: number;
    /** Scene height — required for cover/hero blocks to fill entire scene */
    sceneH?: number;
  }
): { height: number; minHeight: number; maxHeight: number } {
  const { isCompact, variant = block.variant || 'A' } = options;
  const meta = getBlockMeta(block.type);

  // Base height from registry
  const baseHeight = meta?.estimatedHeight[variant] ?? 300;

  // FIX 2: compactFactor removed — compact mode no longer reduces estimated heights.
  // Font sizes are no longer reduced in compact mode (they use full values),
  // so estimated heights must also use full values to prevent overlap.
  // Compact mode ONLY affects spacing (BLOCK_GAP, safe area), not content height.
  const compactFactor = 1;

  // Content-based height adjustment
  let contentHeight = baseHeight;

  switch (block.type) {
    case 'kuis': {
      const q = block as { questions?: unknown[] };
      const numQ = q.questions?.length || 1;
      contentHeight = 60 + numQ * (isCompact ? 80 : 110);
      break;
    }
    case 'petunjuk': {
      const p = block as { items?: unknown[]; navigation?: unknown[]; learningObjectives?: unknown[] };
      const numItems = p.items?.length || 1;
      const numNav = p.navigation?.length || 0;
      const numObj = p.learningObjectives?.length || 0;
      contentHeight = 60 + numItems * 65 + numNav * 30 + numObj * 28;
      break;
    }
    case 'tp': {
      const t = block as { items?: unknown[] };
      const numItems = t.items?.length || 1;
      contentHeight = 50 + numItems * 45;
      break;
    }
    case 'alur': {
      const a = block as { steps?: unknown[] };
      const numSteps = a.steps?.length || 1;
      contentHeight = 50 + numSteps * 55;
      break;
    }
    case 'diskusi': {
      const d = block as { questions?: unknown[]; kelompok?: unknown[] };
      const numQ = d.questions?.length || 1;
      const numK = d.kelompok?.length || 0;
      contentHeight = 60 + numQ * 80 + numK * 60;
      break;
    }
    case 'def-box': {
      const db = block as { content?: string };
      const textLen = db.content?.length || 50;
      contentHeight = 40 + Math.ceil(textLen / 40) * 20;
      break;
    }
    case 'nc-grid': {
      const nc = block as { cards?: unknown[] };
      const numCards = nc.cards?.length || 1;
      contentHeight = 40 + Math.ceil(numCards / 2) * 100;
      break;
    }
    case 'materi-section': {
      // MateriSection height = header + nested content blocks + takeaways + self-check
      const ms = block as { content?: SchemaBlock[]; takeaways?: unknown[]; selfCheck?: string };
      const numTakeaway = ms.takeaways?.length || 0;
      const selfCheckH = ms.selfCheck ? 60 : 0;
      // Recursively estimate child block heights for accurate total
      let childH = 0;
      for (const child of (ms.content || [])) {
        const childEst = estimateBlockHeight(child, { ...options, sceneH: options.sceneH });
        childH += childEst.height + 8; // 8px gap between children
      }
      contentHeight = 60 + childH + numTakeaway * 30 + selfCheckH + 16; // 16px padding
      break;
    }
    case 'skenario': {
      const sk = block as { chapters?: unknown[] };
      const numCh = sk.chapters?.length || 1;
      contentHeight = 60 + numCh * 120;
      break;
    }
    case 'flashcard-set': {
      // Flashcard shows one at a time, so height is mostly fixed
      contentHeight = 200;
      break;
    }
    case 'rangkuman': {
      const r = block as { concepts?: unknown[] };
      const numConcepts = r.concepts?.length || 1;
      contentHeight = 50 + numConcepts * 80;
      break;
    }
    case 'refleksi': {
      const ref = block as { questions?: unknown[]; penugasan?: unknown };
      const numQ = ref.questions?.length || 1;
      const hasPenugasan = !!ref.penugasan;
      contentHeight = 60 + numQ * 70 + (hasPenugasan ? 100 : 0);
      break;
    }
    case 'penutup': {
      const pen = block as { preview?: unknown[]; nextPertemuan?: unknown };
      const numPreview = pen.preview?.length || 0;
      contentHeight = 60 + numPreview * 50;
      break;
    }
    case 'tabel-accord': {
      const ta = block as { rows?: unknown[] };
      const numRows = ta.rows?.length || 1;
      contentHeight = 40 + numRows * 48;
      break;
    }
    case 'ftab': {
      // Ftab height = tab header + progress bar + tallest tab content
      // Only one tab is visible at a time, so we estimate the tallest.
      const ft = block as { tabs?: Array<{ icon: string; label: string; content: SchemaBlock[] }>; showProgress?: boolean };
      const tabs = ft.tabs || [];
      const tabHeaderH = 44; // Tab icon + label row
      const progressBarH = ft.showProgress ? 30 : 0;
      // Estimate tallest tab content by recursively estimating child blocks
      let maxTabContentH = 200; // Minimum tab content height
      for (const tab of tabs) {
        let tabH = 0;
        for (const child of (tab.content || [])) {
          const childEst = estimateBlockHeight(child, { ...options, sceneH: options.sceneH });
          tabH += childEst.height + 8; // 8px gap between children
        }
        if (tabH > maxTabContentH) maxTabContentH = tabH;
      }
      contentHeight = tabHeaderH + progressBarH + maxTabContentH + 16; // 16px padding
      break;
    }
    default: {
      // ── Full-page blocks (cover, hero, etc.) ──
      // Uses capability registry as single source of truth instead of
      // hardcoded type checks. Any new full-page block type added to
      // FULL_PAGE_BLOCK_TYPES in capability-registry.ts is automatically handled.
      if (isFullPageBlockType(block.type)) {
        // Cover/hero ALWAYS fills the entire scene height.
        // Do NOT use estimatedHeight from registry (600px) — it leaves
        // a 120px gap at the bottom of a 720px scene.
        // Pass sceneH via options or fall back to a reasonable default.
        contentHeight = options.sceneH ?? 720;
        break;
      }

      // ── Non-measurable blocks (games, etc.) ──
      // These have fixed visual layout — use registry base height.
      // No content-based adjustment needed.
      if (!isBlockTypeMeasurable(block.type)) {
        contentHeight = baseHeight;
        break;
      }

      // Check if block has generic `children` — estimate their heights too.
      // This ensures blocks using BaseBlock.children get correct height
      // instead of falling through to a flat registry value.
      const blockChildren = (block as { children?: SchemaBlock[] }).children;
      if (blockChildren && blockChildren.length > 0) {
        let childH = 0;
        for (const child of blockChildren) {
          const childEst = estimateBlockHeight(child, { ...options, sceneH: options.sceneH });
          childH += childEst.height + 8; // 8px gap between children
        }
        contentHeight = 40 + childH + 16; // 40px header + children + 16px padding
      } else {
        // Use registry base height
        contentHeight = baseHeight;
      }
    }
  }

  // Full-page blocks (cover, hero) ALWAYS fill the scene —
  // do NOT apply compactFactor. They use the full scene height
  // regardless of canvas mode, ensuring no overflow or gap.
  if (isFullPageBlockType(block.type)) {
    return { height: contentHeight, minHeight: contentHeight, maxHeight: contentHeight };
  }

  // Apply compact factor for non-full-page blocks
  const estimatedHeight = Math.round(contentHeight * compactFactor);

  // Determine min/max bounds
  const minHeight = Math.round(estimatedHeight * 0.6);
  const maxHeight = Math.round(estimatedHeight * 1.8);

  return { height: estimatedHeight, minHeight, maxHeight };
}

// ── Scene Layout Resolver ─────────────────────────────────────

/**
 * Resolve all block positions in a scene.
 * This is the CORE of the scene layout engine.
 *
 * Input:  schema blocks + scene dimensions + safe area
 * Output: array of ResolvedBlockPosition with deterministic coordinates
 *
 * Algorithm:
 *   1. Separate flow blocks and absolute blocks
 *   2. Flow blocks: stack vertically with gap, compute y incrementally
 *   3. Absolute blocks: use schema layout coordinates (x%, y%, w%, h%)
 *   4. Apply overflow rules per block
 *   5. Mark overflowing blocks
 *   6. Return resolved positions
 *
 * THIS IS THE SINGLE SOURCE OF LAYOUT AUTHORITY.
 * After this, browser only renders — it does NOT control layout.
 */
export function resolveSceneLayout(
  blocks: SchemaBlock[],
  scene: SceneResolution,
  safeArea: SafeArea,
  options: {
    isCompact: boolean;
    /**
     * FASE 11A.4 — Per-block gaps from the rhythm engine.
     * When provided, each flow block uses its own transition-based gap
     * instead of the uniform BLOCK_GAP.
     *
     * perBlockGaps[i] = gap BEFORE block i (0 for first block).
     * Length should equal blocks.length. If shorter, remaining blocks
     * fall back to uniform BLOCK_GAP.
     *
     * Backward compatible: if not provided, uses uniform BLOCK_GAP.
     */
    perBlockGaps?: number[];
    /**
     * FIX 1: Cover Page Isolation — when true, if a full-page block
     * (cover/hero) exists on a page with other blocks, the full-page
     * block becomes the ONLY rendered block. Other blocks are marked
     * as overflow-hidden (height:0) so the OverflowIndicator can
     * suggest splitting the page.
     *
     * Cover blocks use COVER_Z_INDEX (1) — above the page background.
     * Cover isolation prevents occlusion of flow blocks (also zIndex:1).
     *
     * Default: true (cover isolation is always enforced).
     */
    coverIsolation?: boolean;
  }
): ResolvedBlockPosition[] {
  const { isCompact, perBlockGaps, coverIsolation = true } = options;
  const resolved: ResolvedBlockPosition[] = [];

  // ═══ FIX 1: COVER PAGE ISOLATION ═══════════════════════════════
  // When a full-page block (cover/hero) exists on a page with other
  // blocks, the full-page block MUST be the only rendered content.
  // Other blocks are hidden (height:0, isOverflowing:true) and the
  // OverflowIndicator gives the user the option to split the page.
  //
  // ROOT CAUSE of "cover invisible" (original bug):
  //   Cover was assigned zIndex:0 (background layer), flow blocks got
  //   zIndex:1 (foreground). In a mixed layout, flow blocks rendered
  //   ON TOP of the cover, making it invisible. Even worse, the
  //   safe area pushed the cover down, creating a gap at the top.
  //
  // FIX: Cover blocks now use zIndex:1 (COVER_Z_INDEX) — same level
  // as flow blocks, always above the page background. Cover isolation
  // ensures no occlusion conflict with flow blocks.
  //
  // A page with a cover block is a COVER PAGE, period.
  // Other blocks must move to the next page.
  const fullPageBlocks = blocks.filter(b => isFullPageBlockType(b.type));
  const nonFullPageBlocks = blocks.filter(b => !isFullPageBlockType(b.type));
  const hasMixedLayout = fullPageBlocks.length > 0 && nonFullPageBlocks.length > 0;

  if (coverIsolation && hasMixedLayout) {
    // DEV WARNING: Cover page has non-cover blocks
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[SceneLayout] FIX 1: Cover page has ${nonFullPageBlocks.length} non-cover blocks. ` +
        `These blocks are hidden. Use OverflowIndicator to split the page. ` +
        `Block types: ${nonFullPageBlocks.map(b => b.type).join(', ')}`
      );
    }

    // Render ONLY the full-page block(s) — cover fills entire scene
    for (let i = 0; i < fullPageBlocks.length; i++) {
      const block = fullPageBlocks[i]!;
      resolved.push({
        block,
        x: 0,
        y: 0,
        width: scene.w,
        height: scene.h,
        position: 'absolute',
        overflow: 'clip' as const,
        zIndex: COVER_Z_INDEX, // FIX: was 0 — caused "cover invisible" bug
        rotation: 0,
        key: block.id || `cover-iso-${block.type}-${i}`,
        isOverflowing: false,
      });
    }

    // Hide non-full-page blocks — they overflow (height:0) so
    // OverflowIndicator can suggest splitting the page.
    for (let i = 0; i < nonFullPageBlocks.length; i++) {
      const block = nonFullPageBlocks[i]!;
      resolved.push({
        block,
        x: safeArea.left,
        y: scene.h,  // Below visible area
        width: scene.w - safeArea.left - safeArea.right,
        height: 0,
        position: 'flow',
        overflow: getOverflowRule(block.type),
        minHeight: 0,
        maxHeight: 0,
        zIndex: 1,
        rotation: 0,
        key: block.id || `cover-hidden-${block.type}-${i}`,
        isOverflowing: true,  // Triggers OverflowIndicator → split
      });
    }

    return resolved;
  }

  // Content area bounds
  const contentX = safeArea.left;
  const contentW = scene.w - safeArea.left - safeArea.right;
  const contentTop = safeArea.top;
  const contentBottom = scene.h - safeArea.bottom;

  const defaultGap = BLOCK_GAP[isCompact ? 'compact' : 'normal'];

  // ── Phase 1: Resolve flow blocks (vertical stack) ──
  // SAFETY: Full-page blocks (cover, hero) without an explicit layout property
  // are treated as absolute-positioned blocks, not flow blocks. This prevents
  // legacy cover blocks (created before layout was added to createDefault())
  // from being stacked as flow blocks and overflowing.
  const flowBlocks = blocks.filter(b => {
    if (isFullPageBlockType(b.type) && (!b.layout || b.layout.position !== 'flow')) {
      return false; // Full-page blocks → absolute path
    }
    return !b.layout || b.layout.position === 'flow';
  });
  let currentY = contentTop;

  for (let i = 0; i < flowBlocks.length; i++) {
    const block = flowBlocks[i]!;
    const blockId = block.id || `flow-${block.type}-${i}`;

    // ═══ FASE 11A.4 — Per-block gap BEFORE this block ═══
    // perBlockGaps[i] = gap BEFORE block i (0 for first block).
    // Add the gap BEFORE positioning the block, not after,
    // so the gap is between the previous block and this one.
    const originalIndex = blocks.indexOf(block);
    const gapBeforeThisBlock = (i === 0) ? 0
      : (perBlockGaps && originalIndex >= 0 && originalIndex < perBlockGaps.length)
        ? perBlockGaps[originalIndex]!
        : defaultGap;
    currentY += gapBeforeThisBlock;

    // ═══ MEASUREMENT-FIRST: Use real DOM height if available ═══
    // This is the KEY change that makes layout deterministic.
    // Height resolution priority: compressed cache > measured > estimated
    // Pipeline: Render (estimated) → Paint → Measure → Re-render (measured)
    //   → Rebalance (compressed) → Re-render (compressed)
    const compressedH = block.id ? getCompressedHeight(block.id) : undefined;
    const measuredH = block.id ? getMeasuredHeight(block.id) : undefined;
    const { height: estimatedH, minHeight, maxHeight } = estimateBlockHeight(block, {
      isCompact,
      variant: block.variant || 'A',
      availableWidth: contentW,
      sceneH: scene.h,
    });

    // Use compressed > measured > estimated
    // Compressed height takes precedence because it represents a deliberate
    // layout decision from SceneTransaction.rebalanceSchema() — the engine
    // should honor that decision rather than recomputing independently.
    const height = compressedH != null ? compressedH : (measuredH != null ? measuredH : estimatedH);

    // Check if block overflows available space
    const remainingSpace = contentBottom - currentY;
    const blockBottom = currentY + height;
    const isOverflowing = blockBottom > contentBottom;

    // ═══ COMPRESSION-AWARE: Try compression before capping ═══
    // If a block overflows, check if it can be compressed
    // (accordion, reveal-set, collapsible, step-reveal).
    // Compression is BETTER than capping because:
    //   - Content is accessible (expand on interaction)
    //   - No content is lost (unlike clip)
    //   - Block fits within scene bounds
    //
    // NOTE: If we already have a cached compressed height, the transaction
    // already made the compression decision — don't recompute.
    let effectiveHeight = height;
    let compressionDecision: CompressionDecision | undefined;

    if (compressedH == null && isOverflowing && measuredH != null) {
      // Try compression — only when we have real measurements
      const decision = computeCompressionDecision(
        block,
        measuredH,
        remainingSpace,
      );
      if (decision) {
        // Use compressed height instead of capping
        effectiveHeight = decision.compressedHeight;
        compressionDecision = decision;
      } else {
        // No compression available — cap to remaining space
        effectiveHeight = Math.max(minHeight, remainingSpace);
      }
    } else if (isOverflowing) {
      // No measurement yet — cap to remaining space
      effectiveHeight = Math.max(minHeight, remainingSpace);
    }

    // ═══ LAYOUT-04 FIX: Clamp autoResize effectiveHeight to maxHeight ═══
    // When measuredH > maxHeight, CSS clips the block at maxHeight (via
    // style.maxHeight + overflowY:hidden), but the layout engine still
    // allocates measuredH worth of vertical space — creating an invisible
    // gap between the visual block bottom and the next block's top.
    // Fix: clamp effectiveHeight so layout allocation matches CSS rendering.
    const overflowRule = getOverflowRule(block.type);
    if (overflowRule === 'autoResize' && effectiveHeight > maxHeight) {
      effectiveHeight = maxHeight;
    }

    // ═══ LAYOUT-06 FIX: Stop advancing past contentBottom ═══
    // When one block overflows past contentBottom, all subsequent blocks
    // would be positioned below the visible area and become invisible.
    // Fix: if currentY already exceeds contentBottom, mark this and all
    // remaining flow blocks as overflowing and stop advancing.
    if (currentY >= contentBottom) {
      resolved.push({
        block,
        x: contentX,
        y: contentBottom,
        width: contentW,
        height: 0,
        position: 'flow',
        overflow: overflowRule,
        minHeight,
        maxHeight: Math.min(maxHeight, contentBottom - contentTop),
        zIndex: 1,
        rotation: 0,
        key: block.id || `flow-${block.type}-${i}`,
        isOverflowing: true,
      });
      continue;
    }

    resolved.push({
      block,
      x: contentX,
      y: currentY,
      width: contentW,
      height: effectiveHeight,
      position: 'flow',
      overflow: overflowRule,
      minHeight,
      maxHeight: Math.min(maxHeight, contentBottom - contentTop),
      zIndex: 1,
      rotation: 0,
      key: block.id || `flow-${block.type}-${i}`,
      isOverflowing: isOverflowing && !compressionDecision,
      compression: compressionDecision,
    });

    currentY += effectiveHeight;
  }

  // ── Phase 2: Resolve absolute blocks (coordinate-based) ──
  const absoluteBlocks = blocks.filter(b => b.layout?.position === 'absolute');

  for (let i = 0; i < absoluteBlocks.length; i++) {
    const block = absoluteBlocks[i]!;
    const layout = block.layout!;

    // Convert percentage coordinates to absolute pixels
    const absX = layout.x != null ? (layout.x / 100) * scene.w : contentX;
    // FIX (cover overflow to top): Full-page blocks in mixed layouts must
    // respect safe area. When cover/hero is on a page with flow blocks,
    // y=0% causes overflow into navbar. Clamp to contentTop in mixed layouts.
    const rawAbsY = layout.y != null ? (layout.y / 100) * scene.h : contentTop;
    const isFullPageAbs = isFullPageBlockType(block.type);
    // Pure full-page block on a page with flow blocks → respect safe area
    const hasFlowBlocksSoFar = resolved.some(r => r.position === 'flow');
    const absY = (isFullPageAbs && hasFlowBlocksSoFar && rawAbsY < contentTop)
      ? contentTop
      : rawAbsY;
    const absW = layout.width != null && layout.width !== 'auto'
      ? (layout.width as number / 100) * scene.w
      : contentW;
    const rawAbsH = layout.height != null && layout.height !== 'auto'
      ? (layout.height as number / 100) * scene.h
      : estimateBlockHeight(block, { isCompact, sceneH: scene.h }).height;
    // Clamp cover height in mixed layouts to avoid overflow past contentBottom
    const absH = (isFullPageAbs && hasFlowBlocksSoFar)
      ? Math.min(rawAbsH, contentBottom - absY)
      : rawAbsH;

    const isOverflowing = absY + absH > contentBottom;

    resolved.push({
      block,
      x: absX,
      y: absY,
      width: absW,
      height: absH,
      position: 'absolute',
      overflow: getOverflowRule(block.type),
      // FIX: Full-page blocks (cover/hero) use COVER_Z_INDEX (1) so they render
      // ABOVE the page background. Previously zIndex:0 caused "cover invisible" bug.
      // Cover isolation prevents occlusion of flow blocks (also zIndex:1).
      // Non-full-page absolute blocks (e.g., floating badges) keep zIndex: 10.
      zIndex: layout.zIndex ?? (isFullPageBlockType(block.type) ? COVER_Z_INDEX : 10),
      rotation: layout.rotation ?? 0,
      key: block.id || `abs-${block.type}-${i}`,
      isOverflowing,
    });
  }

  // ── Phase 3: Legacy full-page blocks WITHOUT layout property ──
  // FIX: Cover/hero blocks created by TemplateAdapter or genCoverSchema()
  // may lack the `layout` property entirely. Phase 1 excludes them from flow
  // (because they're full-page), and Phase 2 only picks blocks with
  // `layout.position === 'absolute'`. Without this phase, they're silently
  // dropped — never rendered — which is the root cause of "cover overflow
  // to top" and "cover block doesn't appear on canvas" bugs.
  //
  // FIX (cover overflow to top): Legacy full-page blocks in MIXED layouts
  // (cover + flow blocks on same page) must respect the safe area.
  // Previously hardcoded y:0 caused cover to overflow into navbar space.
  // Now: pure cover page → y:0 (full bleed), mixed layout → y:contentTop
  // to stay below the navbar.
  const resolvedBlockIds = new Set(resolved.map(r => r.block.id).filter(Boolean));
  const legacyFullPageBlocks = blocks.filter(b =>
    isFullPageBlockType(b.type)
    && !b.layout
    && !resolvedBlockIds.has(b.id)
  );

  // Detect if this is a mixed layout (full-page block + flow blocks)
  const hasFlowBlocks = resolved.some(r => r.position === 'flow');

  for (let i = 0; i < legacyFullPageBlocks.length; i++) {
    const block = legacyFullPageBlocks[i]!;
    // In mixed layouts, cover blocks must stay within the safe area
    // to avoid overflowing into navbar space. In pure cover pages,
    // they fill the entire scene (y:0, full bleed).
    const coverY = hasFlowBlocks ? contentTop : 0;
    const coverH = hasFlowBlocks ? (contentBottom - contentTop) : scene.h;
    resolved.push({
      block,
      x: 0,
      y: coverY,
      width: scene.w,
      height: coverH,
      position: 'absolute',
      overflow: 'clip' as const,
      zIndex: COVER_Z_INDEX, // FIX: was 0 — caused "cover invisible" bug
      rotation: 0,
      key: block.id || `legacy-fp-${block.type}-${i}`,
      isOverflowing: false,
    });
  }

  return resolved;
}

// ── Scale Computation ─────────────────────────────────────────

/**
 * Compute the scale factor to fit the virtual scene into a viewport.
 * This is SCALE-FIRST rendering — we scale the entire scene,
 * NOT relayout individual blocks.
 */
export function computeSceneScale(
  scene: SceneResolution,
  viewport: { w: number; h: number },
  padding: number = 0,
): number {
  const availW = viewport.w - padding * 2;
  const availH = viewport.h - padding * 2;
  const scaleW = availW / scene.w;
  const scaleH = availH / scene.h;
  return Math.min(scaleW, scaleH, 1); // Never upscale beyond 1:1
}

// ── Scene Container Style ─────────────────────────────────────

/**
 * Generate the CSS style for the scene container.
 * Uses transform: scale() to fit the virtual scene into the viewport.
 * The scene uses FIXED coordinates — viewport adaptation = scale only.
 */
export function getSceneContainerStyle(
  scene: SceneResolution,
  scale: number,
): React.CSSProperties {
  return {
    width: scene.w,
    height: scene.h,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };
}

/**
 * Generate the CSS style for a resolved block position.
 * Uses absolute positioning with deterministic coordinates.
 * Browser only renders — it does NOT control position.
 *
 * INTERNAL block layout (flex/grid) is allowed inside the block.
 * SCENE layout (position, size) is controlled by this engine.
 */
export function getBlockPositionStyle(
  resolved: ResolvedBlockPosition,
): React.CSSProperties {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: resolved.x,
    top: resolved.y,
    width: resolved.width,
    overflowX: 'hidden' as const,
    zIndex: resolved.zIndex,
    wordBreak: 'break-word' as const,
    overflowWrap: 'break-word' as const,
  };

  // Height + overflow handling per rule
  switch (resolved.overflow) {
    case 'clip':
      // Hard clip — content is cut off at allocated height
      style.height = resolved.height;
      style.overflowY = 'hidden';
      break;

    case 'autoResize':
      // Block grows to fit content up to maxHeight, then clips
      style.minHeight = resolved.minHeight;
      style.maxHeight = resolved.maxHeight;
      style.overflowY = 'hidden';  // Clip when content exceeds maxHeight
      break;

    case 'internalScroll':
      // Fixed size with scrollable content area inside
      style.height = resolved.height;
      style.overflowY = 'auto';
      // Smooth scrolling for touch devices
      style.WebkitOverflowScrolling = 'touch';
      break;

    case 'scaleDown':
      // Fixed size — renderer handles font-size scaling internally
      style.height = resolved.height;
      style.overflowY = 'hidden';
      break;
  }

  // Rotation
  if (resolved.rotation) {
    style.transform = `rotate(${resolved.rotation}deg)`;
  }

  return style;
}
