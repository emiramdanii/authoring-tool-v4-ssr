// ═══════════════════════════════════════════════════════════════════
// BASE SCHEMA TYPES — Foundation types for the screen schema system
// ═══════════════════════════════════════════════════════════════════

// ── Base Schema Types ──────────────────────────────────────────

export interface BlockLayout {
  /** Layout strategy: flow (flexbox) or absolute (coordinate-based) */
  position: 'flow' | 'absolute';
  /** X position in % (only for absolute) */
  x?: number;
  /** Y position in % (only for absolute) */
  y?: number;
  /** Width in % or 'auto' (only for absolute) */
  width?: number | 'auto';
  /** Height in % or 'auto' (only for absolute) */
  height?: number | 'auto';
  /** Preferred width hint: 'full' | 'half' | 'third' — used by layout engine BEFORE render */
  preferredWidth?: 'full' | 'half' | 'third';
  /** Minimum height in px — used by layout engine for scene splitting */
  minHeight?: number;
  /** Z-index layer */
  zIndex?: number;
  /** Rotation in degrees */
  rotation?: number;
}

// ── Type Guard ────────────────────────────────────────────────────
// Some block types (TabIconsBlock, InfografisBlock) override `layout`
// with a string union like 'horizontal' | 'grid'. This type guard
// safely checks if a block's layout is a spatial BlockLayout object
// (with position/x/y) vs a visual variant string.

export function isSpatialLayout(layout: unknown): layout is BlockLayout {
  return typeof layout === 'object' && layout !== null && 'position' in layout;
}

// ── Compression Hints ────────────────────────────────────────────
// Intelligence that the layout/compression engine uses BEFORE render.
// The renderer is pure + dumb — all intelligence lives here.

export interface CompressionHints {
  /** How important is this block? High priority blocks stay visible longer. */
  priority: 'high' | 'medium' | 'low';
  /** When space is tight, how should this block compress? */
  strategy: 'accordion' | 'truncate' | 'scroll' | 'none';
  /** Can this block be split across scenes? */
  splittable?: boolean;
  /** If split, minimum content to show in first fragment (in px) */
  minFragmentHeight?: number;
  // NOTE: _compressedHeight was REMOVED from CompressionHints.
  // It was a derived runtime value that leaked into localStorage via schema.
  // The layout engines (CompressionEngine, SceneOverflowEngine, SceneLayoutEngine)
  // compute their own CompressionResult.compressedHeight at runtime.
  // The rebalance transaction now writes to a runtime cache instead of the schema.
  // See: session-state.ts → compressedHeightCache
}

// ── Semantic Hints ───────────────────────────────────────────────
// Metadata about the MEANING of this block.
// Used by AI regeneration, search, export, and smart features.

export interface SemanticHints {
  /** Topic/keyword this block relates to */
  topic?: string;
  /** Importance score 0–1 — used for prioritization in layout + export */
  importance?: number;
  /** BSNP relevance — is this block required by BSNP curriculum standards? */
  bsnpRelevant?: boolean;
  /** Which phase of learning does this block serve? */
  // Sprint 8.6B: added 'evaluasi' as a valid phase — used by preset schemas
  // (e.g. pancasila-golden-schema) to mark assessment blocks. The 4th phase
  // aligns with Kurikulum Merdeka's 4-phase learning cycle.
  learningPhase?: 'pendahuluan' | 'inti' | 'penutup' | 'evaluasi';
  /** Interaction type hint — what kind of student interaction? */
  interactionType?: 'read' | 'write' | 'choose' | 'drag' | 'discuss' | 'reflect';
}

export interface BaseBlock {
  type: string;
  id?: string;
  /** Optional style token overrides */
  style?: Record<string, string>;
  /** Optional variant for layout variation */
  variant?: 'A' | 'B' | 'C';
  /** Whether block is interactive */
  interactive?: boolean;
  /** Optional condition for visibility */
  showIf?: string;
  /**
   * Optional layout definition.
   * Default is flow (flexbox) — blocks stack vertically.
   * Set position: 'absolute' for coordinate-based placement.
   * This is the foundation for the Scene Node system.
   *
   * Includes preferredWidth and minHeight hints that the layout engine
   * uses BEFORE render. The renderer is pure + dumb.
   */
  layout?: BlockLayout;
  /**
   * Compression intelligence — how the scene engine should handle
   * this block when space is tight. All intelligence lives here,
   * NOT in the renderer.
   */
  compression?: CompressionHints;
  /**
   * Semantic metadata — what this block MEANS, not just what it looks like.
   * Used by AI regeneration, search, export, and smart features.
   * This is the foundation for SILSE as a "document engine".
   */
  semantic?: SemanticHints;
  /**
   * Optional children for composite blocks.
   * A composite block = mini scene with child blocks.
   * This enables: nested blocks, grouping, z-index, layer panel.
   */
  children?: import('./schema').SchemaBlock[];
  /**
   * FASE 11A — Visual Intent
   * WHY this block is visually present. Same block type can have
   * different visual treatment based on intent.
   *
   * Affects: border weight, spacing, accent color intensity, typography emphasis.
   * Default: derived from BlockStyleContract per block type.
   */
  visualIntent?: import('../../vcs/types').VisualIntent;
}

// ── Block Variant Type ──────────────────────────────────────────

export type BlockVariant = 'A' | 'B' | 'C';

// ── Container Reference ─────────────────────────────────────────
// Used by transaction system to reference where a block lives.

export interface ContainerRef {
  type: 'root' | 'materi-section' | 'ftab' | 'children';
  id?: string;
  tabIndex?: number;
}

// ── Schema Operation ────────────────────────────────────────────
// Describes a single mutation step in a transaction.

export type SchemaOperation =
  | { type: 'insert-block'; block: import('./schema').SchemaBlock; container: ContainerRef; index?: number }
  | { type: 'remove-block'; blockId: string }
  | { type: 'move-block'; blockId: string; from: ContainerRef; to: ContainerRef; index?: number }
  | { type: 'update-block'; blockId: string; changes: Partial<import('./schema').SchemaBlock> }
  | { type: 'duplicate-block'; blockId: string; container?: ContainerRef }
  | { type: 'change-variant'; blockId: string; variant: BlockVariant }
  | { type: 'split-scene'; splitIndex: number }
  | { type: 'merge-scene'; sourcePageId: string };

// ── Transaction Result ──────────────────────────────────────────

export interface TransactionResult {
  success: boolean;
  schema: import('./schema').ScreenSchema;
  errors: string[];
  warnings: import('../validation').ValidationError[];
}
