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
  return SCENE_RESOLUTIONS[ratioId] || SCENE_RESOLUTIONS['16:9'];
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
    bottomNavHeight = isCompact ? 48 : 72,
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

/**
 * How a block handles content that exceeds its allocated height.
 * This replaces browser's default auto-height behavior.
 */
export type OverflowRule =
  | 'clip'           // Hard clip — content is cut off (overflow-hidden)
  | 'autoResize'     // Expand block height to fit content (up to maxHeight)
  | 'internalScroll' // Keep block size, add internal scroll (overflow-y: auto)
  | 'scaleDown';     // Scale content to fit within block (font-size reduction)

/** Overflow rule per block type — deterministic, not browser-driven */
export const BLOCK_OVERFLOW_RULES: Record<string, OverflowRule> = {
  // Layout blocks — full-bleed, never overflow
  'cover': 'clip',
  'hero': 'clip',

  // Content blocks — can expand within limits
  'petunjuk': 'autoResize',
  'tp': 'autoResize',
  'alur': 'autoResize',
  'def-box': 'autoResize',
  'nc-grid': 'autoResize',
  'nk-card': 'autoResize',
  'materi-section': 'autoResize',
  'tujuan-display': 'autoResize',
  'motivasi': 'autoResize',
  'rangkuman': 'autoResize',
  'diskusi': 'autoResize',
  'tabel-accord': 'autoResize',

  // Interactive blocks — fixed size with internal scroll
  'kuis': 'internalScroll',
  'skenario': 'internalScroll',
  'flashcard-set': 'internalScroll',
  'ftab': 'internalScroll',
  'sortir-game': 'clip',
  'roda-game': 'clip',
  'memory-game': 'clip',
  'matching-game': 'clip',
  'fill-blank-game': 'internalScroll',
  'word-search-game': 'clip',
  'true-false-game': 'internalScroll',
  'drag-drop-game': 'clip',
  'crossword-game': 'clip',
  'team-buzzer-game': 'clip',

  // Feedback blocks — can expand
  'hasil': 'autoResize',
  'refleksi': 'autoResize',
  'penutup': 'autoResize',
};

/** Get overflow rule for a block type */
export function getOverflowRule(blockType: string): OverflowRule {
  return BLOCK_OVERFLOW_RULES[blockType] || 'autoResize';
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

  // Compact mode reduces height by ~20%
  const compactFactor = isCompact ? 0.8 : 1;

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
    case 'cover':
    case 'hero': {
      // Cover/hero ALWAYS fills the entire scene height.
      // Do NOT use estimatedHeight from registry (600px) — it leaves
      // a 120px gap at the bottom of a 720px scene.
      // Pass sceneH via options or fall back to a reasonable default.
      contentHeight = options.sceneH ?? 720;
      break;
    }
    default: {
      // Use registry base height
      contentHeight = baseHeight;
    }
  }

  // Apply compact factor
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
  }
): ResolvedBlockPosition[] {
  const { isCompact } = options;
  const resolved: ResolvedBlockPosition[] = [];

  // Content area bounds
  const contentX = safeArea.left;
  const contentW = scene.w - safeArea.left - safeArea.right;
  const contentTop = safeArea.top;
  const contentBottom = scene.h - safeArea.bottom;

  const gap = BLOCK_GAP[isCompact ? 'compact' : 'normal'];

  // ── Phase 1: Resolve flow blocks (vertical stack) ──
  const flowBlocks = blocks.filter(b => !b.layout || b.layout.position === 'flow');
  let currentY = contentTop;

  for (let i = 0; i < flowBlocks.length; i++) {
    const block = flowBlocks[i];
    const { height, minHeight, maxHeight } = estimateBlockHeight(block, {
      isCompact,
      variant: block.variant || 'A',
      availableWidth: contentW,
      sceneH: scene.h,
    });

    // Check if block overflows available space
    const blockBottom = currentY + height;
    const isOverflowing = blockBottom > contentBottom;

    // If overflowing, cap the height to remaining space (but respect minHeight)
    const effectiveHeight = isOverflowing
      ? Math.max(minHeight, contentBottom - currentY)
      : height;

    resolved.push({
      block,
      x: contentX,
      y: currentY,
      width: contentW,
      height: effectiveHeight,
      position: 'flow',
      overflow: getOverflowRule(block.type),
      minHeight,
      maxHeight: Math.min(maxHeight, contentBottom - contentTop),
      zIndex: 1,
      rotation: 0,
      key: block.id || `flow-${block.type}-${i}`,
      isOverflowing,
    });

    currentY += effectiveHeight + gap;
  }

  // ── Phase 2: Resolve absolute blocks (coordinate-based) ──
  const absoluteBlocks = blocks.filter(b => b.layout?.position === 'absolute');

  for (let i = 0; i < absoluteBlocks.length; i++) {
    const block = absoluteBlocks[i];
    const layout = block.layout!;

    // Convert percentage coordinates to absolute pixels
    const absX = layout.x != null ? (layout.x / 100) * scene.w : contentX;
    const absY = layout.y != null ? (layout.y / 100) * scene.h : contentTop;
    const absW = layout.width != null && layout.width !== 'auto'
      ? (layout.width as number / 100) * scene.w
      : contentW;
    const absH = layout.height != null && layout.height !== 'auto'
      ? (layout.height as number / 100) * scene.h
      : estimateBlockHeight(block, { isCompact, sceneH: scene.h }).height;

    const isOverflowing = absY + absH > contentBottom;

    resolved.push({
      block,
      x: absX,
      y: absY,
      width: absW,
      height: absH,
      position: 'absolute',
      overflow: getOverflowRule(block.type),
      zIndex: layout.zIndex ?? 10,
      rotation: layout.rotation ?? 0,
      key: block.id || `abs-${block.type}-${i}`,
      isOverflowing,
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
