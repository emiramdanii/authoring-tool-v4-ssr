// ═══════════════════════════════════════════════════════════════════
// COMPRESSION ENGINE — Smart content compression for fixed scenes
// ═══════════════════════════════════════════════════════════════════
//
// PROBLEM:
//   Scene is fixed 1280×720. When a block's real DOM height exceeds
//   the available space, current solutions are:
//     - clip → content lost
//     - internalScroll → user must scroll (bad UX for learning)
//     - autoResize → grows beyond scene, other blocks get pushed
//   None of these preserve the "one screen = one concept" principle.
//
// SOLUTION:
//   COMPRESSION — make content smaller so it FITS in the scene.
//
//   Compression strategies:
//     1. ACCORDION — Show headers only, expand on click (50% savings)
//     2. COLLAPSIBLE — Collapse to summary, expand for detail (40% savings)
//     3. REVEAL_SET — Show N items, "Lihat lainnya" for rest (60% savings)
//     4. STEP_REVEAL — Show one step at a time, navigate between (70% savings)
//
//   Each strategy has:
//     - A COMPRESSED height (what the engine uses for layout)
//     - A MAX_EXPANDED height (what it could grow to if fully expanded)
//     - A savings ratio (compressed / expanded)
//
//   The engine decides:
//     1. Measure block's real height
//     2. If it overflows → apply best compression strategy
//     3. Use compressed height for layout
//     4. Block renders in compressed mode with expand capability
//
// KEY ARCHITECTURE DECISION:
//   Compression is a DERIVED STATE — like scene overflow splitting.
//   The source schema is NEVER modified. Compression is applied at
//   render time based on the layout plan.
//
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock } from '../schema/types';

// ── Compression Types ──────────────────────────────────────────

/** Available compression strategies */
export type CompressionStrategy =
  | 'accordion'     // Headers only, click to expand each
  | 'collapsible'   // Summary + expand button
  | 'reveal-set'    // Show N items, "show more" for rest
  | 'step-reveal';  // One step at a time, prev/next navigation

/** Which block types support which compression strategies */
export interface CompressionProfile {
  /** The block type this profile applies to */
  blockType: string;
  /** Available compression strategies (in priority order) */
  strategies: CompressionStrategy[];
  /** Default strategy (first in list if not specified) */
  defaultStrategy: CompressionStrategy;
  /** Estimated compressed height as fraction of expanded height */
  savingsRatios: Record<CompressionStrategy, number>;
  /** Minimum items before compression kicks in */
  minItemsForCompression: number;
}

/** A compression decision made by the engine */
export interface CompressionDecision {
  /** The block ID this applies to */
  blockId: string;
  /** Whether compression is active */
  isCompressed: boolean;
  /** The chosen strategy */
  strategy: CompressionStrategy;
  /** The compressed height in px (what the engine uses for layout) */
  compressedHeight: number;
  /** The expanded height in px (real DOM measurement) */
  expandedHeight: number;
  /** Savings ratio (compressed / expanded) */
  savingsRatio: number;
  /** Parameters for the compression renderer */
  params: CompressionParams;
}

/** Parameters passed to the compressed block renderer */
export interface CompressionParams {
  /** For accordion: which items are expanded (by index) */
  expandedIndices?: number[];
  /** For reveal-set: how many items to show initially */
  visibleItemCount?: number;
  /** For collapsible: whether the block is expanded */
  isExpanded?: boolean;
  /** For step-reveal: current step index */
  currentStep?: number;
  /** Maximum height when expanded (for smooth animation) */
  maxExpandedHeight?: number;
}

// ── Compression Profiles Registry ─────────────────────────────

/**
 * Compression profiles per block type.
 * Each profile defines which strategies are available and their savings.
 *
 * Savings ratios represent the compressed height as a FRACTION of expanded:
 *   0.5 means compressed = 50% of expanded (50% savings)
 *   0.4 means compressed = 40% of expanded (60% savings)
 */
export const COMPRESSION_PROFILES: Record<string, CompressionProfile> = {
  'petunjuk': {
    blockType: 'petunjuk',
    strategies: ['accordion', 'reveal-set', 'collapsible'],
    defaultStrategy: 'accordion',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 4,
  },
  'tp': {
    blockType: 'tp',
    strategies: ['reveal-set', 'collapsible'],
    defaultStrategy: 'reveal-set',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 4,
  },
  'alur': {
    blockType: 'alur',
    strategies: ['step-reveal', 'accordion'],
    defaultStrategy: 'step-reveal',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.3 },
    minItemsForCompression: 4,
  },
  'kuis': {
    blockType: 'kuis',
    strategies: ['step-reveal', 'reveal-set'],
    defaultStrategy: 'step-reveal',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.3 },
    minItemsForCompression: 3,
  },
  'materi-section': {
    blockType: 'materi-section',
    strategies: ['accordion', 'collapsible'],
    defaultStrategy: 'accordion',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 3,
  },
  'ftab': {
    blockType: 'ftab',
    strategies: ['accordion'],
    defaultStrategy: 'accordion',
    savingsRatios: { accordion: 0.4, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 3,
  },
  'nc-grid': {
    blockType: 'nc-grid',
    strategies: ['reveal-set', 'collapsible'],
    defaultStrategy: 'reveal-set',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 4,
  },
  'diskusi': {
    blockType: 'diskusi',
    strategies: ['reveal-set', 'accordion'],
    defaultStrategy: 'reveal-set',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 3,
  },
  'rangkuman': {
    blockType: 'rangkuman',
    strategies: ['accordion', 'reveal-set'],
    defaultStrategy: 'accordion',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 3,
  },
  'skenario': {
    blockType: 'skenario',
    strategies: ['step-reveal'],
    defaultStrategy: 'step-reveal',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.3 },
    minItemsForCompression: 2,
  },
  'refleksi': {
    blockType: 'refleksi',
    strategies: ['reveal-set', 'collapsible'],
    defaultStrategy: 'reveal-set',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 3,
  },
  'tabel-accord': {
    blockType: 'tabel-accord',
    strategies: ['accordion'],
    defaultStrategy: 'accordion',
    savingsRatios: { accordion: 0.4, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 3,
  },
  'def-box': {
    blockType: 'def-box',
    strategies: ['collapsible'],
    defaultStrategy: 'collapsible',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 1,
  },
  'tujuan-display': {
    blockType: 'tujuan-display',
    strategies: ['reveal-set', 'collapsible'],
    defaultStrategy: 'reveal-set',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 4,
  },
  'motivasi': {
    blockType: 'motivasi',
    strategies: ['collapsible'],
    defaultStrategy: 'collapsible',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 1,
  },
  'penutup': {
    blockType: 'penutup',
    strategies: ['reveal-set', 'collapsible'],
    defaultStrategy: 'reveal-set',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 3,
  },
  'nk-card': {
    blockType: 'nk-card',
    strategies: ['accordion', 'collapsible'],
    defaultStrategy: 'accordion',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 1,
  },
};

// ── Compression Engine ─────────────────────────────────────────

/**
 * Compute compression decisions for blocks that overflow.
 *
 * This is called by the layout engine when a block's measured height
 * exceeds the available space. It decides:
 *   1. Should this block be compressed?
 *   2. Which strategy to use?
 *   3. What's the compressed height?
 *
 * The decision is based on:
 *   - Block type's compression profile
 *   - Measured height vs available space
 *   - Content item count vs minimum for compression
 *
 * IMPORTANT:
 *   - Compression decisions are DERIVED, not stored in schema
 *   - The same block can be compressed in canvas mode but expanded in preview
 *   - The source schema is NEVER modified
 */
export function computeCompressionDecision(
  block: SchemaBlock,
  measuredHeight: number,
  availableHeight: number,
  options?: {
    /** Override the default strategy */
    preferredStrategy?: CompressionStrategy;
    /** Item count hint (if known, avoids counting in this function) */
    itemCount?: number;
  }
): CompressionDecision | null {
  const profile = COMPRESSION_PROFILES[block.type];
  if (!profile) return null; // This block type doesn't support compression

  // Only compress if the block actually overflows
  if (measuredHeight <= availableHeight) return null;

  // Count items (for minItemsForCompression check)
  const itemCount = options?.itemCount ?? countBlockItems(block);
  if (itemCount < profile.minItemsForCompression) return null;

  // Choose strategy
  const strategy = options?.preferredStrategy ?? profile.defaultStrategy;
  const savingsRatio = profile.savingsRatios[strategy] ?? 0.5;
  const compressedHeight = Math.round(measuredHeight * savingsRatio);

  // If compressed height still overflows, use a more aggressive strategy
  let effectiveStrategy = strategy;
  let effectiveCompressedHeight = compressedHeight;

  if (compressedHeight > availableHeight) {
    // Try to find a strategy with better savings
    for (const altStrategy of profile.strategies) {
      const altRatio = profile.savingsRatios[altStrategy] ?? 0.5;
      const altHeight = Math.round(measuredHeight * altRatio);
      if (altHeight <= availableHeight) {
        effectiveStrategy = altStrategy;
        effectiveCompressedHeight = altHeight;
        break;
      }
    }
    // If still overflows, cap at available height
    if (effectiveCompressedHeight > availableHeight) {
      effectiveCompressedHeight = availableHeight;
    }
  }

  return {
    blockId: block.id || block.type,
    isCompressed: true,
    strategy: effectiveStrategy,
    compressedHeight: effectiveCompressedHeight,
    expandedHeight: measuredHeight,
    savingsRatio: savingsRatio,
    params: getDefaultParams(effectiveStrategy, itemCount),
  };
}

/**
 * Compute compression decisions for all blocks in a scene.
 * Returns a map of blockId → CompressionDecision.
 */
export function computeSceneCompression(
  blocks: SchemaBlock[],
  measuredHeights: Map<string, number>,
  availableHeight: number,
): Map<string, CompressionDecision> {
  const decisions = new Map<string, CompressionDecision>();

  for (const block of blocks) {
    const blockId = block.id || block.type;
    const measuredH = measuredHeights.get(blockId);
    if (measuredH == null) continue;

    const decision = computeCompressionDecision(block, measuredH, availableHeight);
    if (decision) {
      decisions.set(blockId, decision);
    }
  }

  return decisions;
}

// ── Helper Functions ───────────────────────────────────────────

/** Count content items in a block (for minItemsForCompression check) */
function countBlockItems(block: SchemaBlock): number {
  const b = block as Record<string, unknown>;

  switch (block.type) {
    case 'petunjuk': {
      const items = b.items as unknown[] | undefined;
      return items?.length ?? 0;
    }
    case 'tp': {
      const items = b.items as unknown[] | undefined;
      return items?.length ?? 0;
    }
    case 'alur': {
      const steps = b.steps as unknown[] | undefined;
      return steps?.length ?? 0;
    }
    case 'kuis': {
      const questions = b.questions as unknown[] | undefined;
      return questions?.length ?? 0;
    }
    case 'nc-grid': {
      const cards = b.cards as unknown[] | undefined;
      return cards?.length ?? 0;
    }
    case 'diskusi': {
      const questions = b.questions as unknown[] | undefined;
      const kelompok = b.kelompok as unknown[] | undefined;
      return (questions?.length ?? 0) + (kelompok?.length ?? 0);
    }
    case 'rangkuman': {
      const concepts = b.concepts as unknown[] | undefined;
      return concepts?.length ?? 0;
    }
    case 'skenario': {
      const chapters = b.chapters as unknown[] | undefined;
      return chapters?.length ?? 0;
    }
    case 'refleksi': {
      const questions = b.questions as unknown[] | undefined;
      return questions?.length ?? 0;
    }
    case 'tabel-accord': {
      const rows = b.rows as unknown[] | undefined;
      return rows?.length ?? 0;
    }
    case 'materi-section': {
      const content = b.content as unknown[] | undefined;
      return content?.length ?? 0;
    }
    case 'ftab': {
      const tabs = b.tabs as unknown[] | undefined;
      return tabs?.length ?? 0;
    }
    case 'penutup': {
      const preview = b.preview as unknown[] | undefined;
      return preview?.length ?? 0;
    }
    case 'tujuan-display': {
      const objectives = b.objectives as unknown[] | undefined;
      return objectives?.length ?? 0;
    }
    default:
      return 1;
  }
}

/** Get default parameters for a compression strategy */
function getDefaultParams(strategy: CompressionStrategy, itemCount: number): CompressionParams {
  switch (strategy) {
    case 'accordion':
      return { expandedIndices: [0] }; // First item expanded by default
    case 'reveal-set':
      return { visibleItemCount: Math.max(2, Math.ceil(itemCount * 0.4)) }; // Show ~40% of items
    case 'collapsible':
      return { isExpanded: false };
    case 'step-reveal':
      return { currentStep: 0 };
  }
}

/** Get the compression profile for a block type */
export function getCompressionProfile(blockType: string): CompressionProfile | undefined {
  return COMPRESSION_PROFILES[blockType];
}

/** Check if a block type supports compression */
export function supportsCompression(blockType: string): boolean {
  return blockType in COMPRESSION_PROFILES;
}
