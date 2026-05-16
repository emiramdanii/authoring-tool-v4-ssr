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
import { isBlockTypeCompressionCapable } from '../schema/capability-registry';

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
  /**
   * Count content items in a block for minItemsForCompression check.
   *
   * Each block type has different content fields that hold "items"
   * (questions, cards, steps, etc.). This function extracts the item count
   * from the block's type-specific content fields.
   *
   * If not provided, defaults to 1 (always eligible for compression).
   * This replaces the old countBlockItems() switch statement — each profile
   * owns its own item counting logic.
   */
  itemCounter?: (block: SchemaBlock) => number;
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
// ── Item Count Helper ──────────────────────────────────────────
// Extracts an array field from a block and returns its length.
// Used by CompressionProfile.itemCounter to avoid the TS-invalid
// syntax `(x as unknown[]?.length)` — TypeScript can't parse
// optional chaining after a type assertion.

function countField(block: SchemaBlock, field: string): number {
  const arr = (block as Record<string, unknown>)[field];
  return Array.isArray(arr) ? arr.length : 0;
}

function countFieldsSum(block: SchemaBlock, ...fields: string[]): number {
  let sum = 0;
  const b = block as Record<string, unknown>;
  for (const field of fields) {
    const arr = b[field];
    if (Array.isArray(arr)) sum += arr.length;
  }
  return sum;
}

export const COMPRESSION_PROFILES: Record<string, CompressionProfile> = {
  'petunjuk': {
    blockType: 'petunjuk',
    strategies: ['accordion', 'reveal-set', 'collapsible'],
    defaultStrategy: 'accordion',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 4,
    itemCounter: (b) => countField(b, 'items'),
  },
  'tp': {
    blockType: 'tp',
    strategies: ['reveal-set', 'collapsible'],
    defaultStrategy: 'reveal-set',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 4,
    itemCounter: (b) => countField(b, 'items'),
  },
  'alur': {
    blockType: 'alur',
    strategies: ['step-reveal', 'accordion'],
    defaultStrategy: 'step-reveal',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.3 },
    minItemsForCompression: 4,
    itemCounter: (b) => countField(b, 'steps'),
  },
  'kuis': {
    blockType: 'kuis',
    strategies: ['step-reveal', 'reveal-set'],
    defaultStrategy: 'step-reveal',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.3 },
    minItemsForCompression: 3,
    itemCounter: (b) => countField(b, 'questions'),
  },
  'materi-section': {
    blockType: 'materi-section',
    strategies: ['accordion', 'collapsible'],
    defaultStrategy: 'accordion',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 3,
    itemCounter: (b) => countField(b, 'content'),
  },
  'ftab': {
    blockType: 'ftab',
    strategies: ['accordion'],
    defaultStrategy: 'accordion',
    savingsRatios: { accordion: 0.4, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 3,
    itemCounter: (b) => countField(b, 'tabs'),
  },
  'nc-grid': {
    blockType: 'nc-grid',
    strategies: ['reveal-set', 'collapsible'],
    defaultStrategy: 'reveal-set',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 4,
    itemCounter: (b) => countField(b, 'cards'),
  },
  'diskusi': {
    blockType: 'diskusi',
    strategies: ['reveal-set', 'accordion'],
    defaultStrategy: 'reveal-set',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 3,
    itemCounter: (b) => countFieldsSum(b, 'questions', 'kelompok'),
  },
  'rangkuman': {
    blockType: 'rangkuman',
    strategies: ['accordion', 'reveal-set'],
    defaultStrategy: 'accordion',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 3,
    itemCounter: (b) => countField(b, 'concepts'),
  },
  'skenario': {
    blockType: 'skenario',
    strategies: ['step-reveal'],
    defaultStrategy: 'step-reveal',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.3 },
    minItemsForCompression: 2,
    itemCounter: (b) => countField(b, 'chapters'),
  },
  'refleksi': {
    blockType: 'refleksi',
    strategies: ['reveal-set', 'collapsible'],
    defaultStrategy: 'reveal-set',
    savingsRatios: { accordion: 0.5, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 3,
    itemCounter: (b) => countField(b, 'questions'),
  },
  'tabel-accord': {
    blockType: 'tabel-accord',
    strategies: ['accordion'],
    defaultStrategy: 'accordion',
    savingsRatios: { accordion: 0.4, collapsible: 0.4, 'reveal-set': 0.6, 'step-reveal': 0.7 },
    minItemsForCompression: 3,
    itemCounter: (b) => countField(b, 'rows'),
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
    itemCounter: (b) => countField(b, 'objectives'),
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
    itemCounter: (b) => countField(b, 'preview'),
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

/**
 * Count content items in a block for minItemsForCompression check.
 *
 * This function now delegates to the profile's itemCounter if available,
 * falling back to 1 for types without a profile or counter.
 *
 * Previously, this was a giant switch statement that had to be updated
 * for every new block type. Now each CompressionProfile owns its own
 * counting logic via the itemCounter field.
 *
 * Adding a new compressible block type? Just add itemCounter to its
 * CompressionProfile entry — no need to edit this function.
 */
function countBlockItems(block: SchemaBlock): number {
  const profile = COMPRESSION_PROFILES[block.type];
  if (profile?.itemCounter) {
    return profile.itemCounter(block);
  }
  return 1; // Default: always eligible for compression
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

/**
 * Check if a block type supports compression.
 *
 * Delegates to BlockCapabilityRegistry (single source of truth) and also
 * verifies that a compression profile exists (we need to know HOW to
 * compress). Both must be true:
 *   1. Capability registry says compressionCapable (schema hints / definition)
 *   2. CompressionEngine has a profile (strategy + savings data)
 *
 * This replaces the old `blockType in COMPRESSION_PROFILES` check which
 * duplicated capability info already available in the registry.
 */
export function supportsCompression(blockType: string): boolean {
  return isBlockTypeCompressionCapable(blockType) && blockType in COMPRESSION_PROFILES;
}
