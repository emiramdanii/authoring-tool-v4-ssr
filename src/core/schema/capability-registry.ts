// ═══════════════════════════════════════════════════════════════════
// BLOCK CAPABILITY REGISTRY — Derived from Schema Hints
// ═══════════════════════════════════════════════════════════════════
// Before this module, block capabilities were hardcoded in two places:
//   1. BlockDefinitionRegistry.BlockCapabilities (editor-focused)
//   2. CompressionEngine.supportsCompression() (layout-focused)
//   3. Various if/else scattered in renderer components
//
// This module creates a SINGLE source of truth for block capabilities
// by DERIVING them from the schema's CompressionHints, SemanticHints,
// and the existing BlockDefinitionRegistry.
//
// WHY: As the schema becomes richer with hints, we should NOT need
// to hardcode "can this block do X?" in multiple places. Instead,
// ask the registry once — it reads from hints + definition.
//
// CAPABILITY FLAGS:
//   - compressionCapable       — Can this block be compressed? (strategy !== 'none')
//   - splittable               — Can this block be split across scenes?
//   - interactive              — Does this block handle user interaction?
//   - measurable               — Can we measure this block's rendered height?
//   - lazyRenderable           — Can this block be rendered lazily (offscreen)?
//   - rendererHandlesCompression — Does the renderer handle compression natively?
//
// DESIGN PRINCIPLE:
//   Capabilities are DERIVED, not stored. You should never need to
//   update this registry when adding a new block type — just set the
//   correct CompressionHints and SemanticHints in the schema generator.
//   The registry reads from hints first, falls back to definition.
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, CompressionHints, SemanticHints } from './types';
import { getBlockCapabilitiesMeta } from '../registry/BlockDefinitionRegistry';

// ── Derived Capability Types ────────────────────────────────────

export interface DerivedCapabilities {
  /** Can this block be compressed when space is tight? */
  compressionCapable: boolean;
  /** Can this block be split across scenes? */
  splittable: boolean;
  /** Does this block handle interactive user input? */
  interactive: boolean;
  /** Can we measure this block's rendered height for layout? */
  measurable: boolean;
  /** Can this block be lazily rendered (offscreen / virtualized)? */
  lazyRenderable: boolean;
  /**
   * Does the block's renderer handle compression natively?
   *
   * When true: the renderer component uses useBlockCompression() internally
   *   and manages its own compressed/expanded UI.
   * When false: CompressionBoundary wraps the block in CompressedBlockWrapper
   *   to provide generic compression UI.
   *
   * This is DERIVED from BlockDefinitionRegistry.handlesCompression.
   * It is a renderer-level concern, not a schema hint.
   */
  rendererHandlesCompression: boolean;
}

export interface BlockCapabilityInfo {
  /** Block type */
  type: string;
  /** Capabilities derived from schema hints */
  derived: DerivedCapabilities;
  /** Source of each capability: 'hint' | 'definition' | 'default' */
  sources: Record<keyof DerivedCapabilities, 'hint' | 'definition' | 'default'>;
}

// ── Default Capabilities ───────────────────────────────────────

const DEFAULT_CAPABILITIES: DerivedCapabilities = {
  compressionCapable: false,
  splittable: false,
  interactive: false,
  measurable: true,   // Most blocks are measurable by default
  lazyRenderable: true, // Most blocks can be lazily rendered
  rendererHandlesCompression: false, // Most renderers don't handle compression natively
};

// ── Registry ───────────────────────────────────────────────────

/**
 * Derive capabilities for a block from its schema hints.
 *
 * Priority:
 *   1. Schema hints (CompressionHints, SemanticHints) — highest authority
 *   2. BlockDefinitionRegistry capabilities — fallback for missing hints
 *   3. DEFAULT_CAPABILITIES — safe defaults
 *
 * This function is pure — no side effects, no caching.
 * Call it whenever you need to know a block's capabilities.
 */
export function getBlockCapabilities(block: SchemaBlock): BlockCapabilityInfo {
  const type = block.type as string;
  const compression = block.compression;
  const semantic = block.semantic;
  const definitionCaps = getBlockCapabilitiesMeta(type);

  const derived: DerivedCapabilities = { ...DEFAULT_CAPABILITIES };
  const sources: Record<keyof DerivedCapabilities, 'hint' | 'definition' | 'default'> = {
    compressionCapable: 'default',
    splittable: 'default',
    interactive: 'default',
    measurable: 'default',
    lazyRenderable: 'default',
    rendererHandlesCompression: 'default',
  };

  // ── Derive from CompressionHints ──
  if (compression) {
    derived.compressionCapable = compression.strategy !== 'none';
    sources.compressionCapable = 'hint';

    derived.splittable = compression.splittable ?? false;
    sources.splittable = 'hint';
  }

  // ── Derive from SemanticHints ──
  if (semantic) {
    const interactiveTypes = new Set(['write', 'choose', 'drag', 'discuss']);
    if (semantic.interactionType && interactiveTypes.has(semantic.interactionType)) {
      derived.interactive = true;
      sources.interactive = 'hint';
    }
  }

  // ── Fallback: BlockDefinitionRegistry ──
  // Only override if we haven't already derived from hints
  if (sources.compressionCapable === 'default' && definitionCaps.handlesCompression) {
    derived.compressionCapable = true;
    sources.compressionCapable = 'definition';
  }
  if (sources.interactive === 'default' && definitionCaps.interactive) {
    derived.interactive = true;
    sources.interactive = 'definition';
  }

  // ── Renderer capability: handlesCompression ──
  // This is always derived from the definition (not from schema hints)
  // because it's a RENDERER property, not a schema property.
  if (definitionCaps.handlesCompression) {
    derived.rendererHandlesCompression = true;
    sources.rendererHandlesCompression = 'definition';
  }

  // ── Special rules based on block type ──
  // These are type-level inferences that are always true regardless of hints.
  // We keep this minimal — prefer hints over hardcoded rules.

  // Cover/hero blocks fill entire scene — never split, never lazy render
  if (type === 'cover' || type === 'hero') {
    derived.splittable = false;
    derived.lazyRenderable = false;
    derived.compressionCapable = false;
    derived.measurable = false; // Fixed scene, no measurement needed
    derived.rendererHandlesCompression = false; // No compression for full-page blocks
    sources.splittable = 'definition';
    sources.lazyRenderable = 'definition';
    sources.compressionCapable = 'definition';
    sources.measurable = 'definition';
    sources.rendererHandlesCompression = 'definition';
  }

  // Game blocks are always interactive and not splittable
  if (type.endsWith('-game')) {
    derived.interactive = true;
    derived.splittable = false;
    derived.lazyRenderable = false;
    derived.rendererHandlesCompression = false; // Games don't compress
    sources.interactive = 'definition';
    sources.splittable = 'definition';
    sources.lazyRenderable = 'definition';
    sources.rendererHandlesCompression = 'definition';
  }

  // Composite blocks (materi-section, ftab) are measurable and splittable
  // Uses COMPOSITE_BLOCK_TYPES as the single source of truth
  if (isCompositeBlockType(type)) {
    derived.splittable = compression?.splittable ?? true;
    derived.lazyRenderable = false; // Complex blocks need eager rendering
    // Composite renderers (FtabRenderer, MateriSectionRenderer) handle
    // compression natively — they use useBlockCompression() internally.
    derived.rendererHandlesCompression = true;
    sources.splittable = compression?.splittable != null ? 'hint' : 'definition';
    sources.lazyRenderable = 'definition';
    sources.rendererHandlesCompression = 'definition';
  }

  return { type, derived, sources };
}

// ── Instance Convenience Functions (requires SchemaBlock) ────────

/** Check if a block is compression-capable */
export function isBlockCompressionCapable(block: SchemaBlock): boolean {
  return getBlockCapabilities(block).derived.compressionCapable;
}

/** Check if a block is splittable across scenes */
export function isBlockSplittable(block: SchemaBlock): boolean {
  return getBlockCapabilities(block).derived.splittable;
}

/** Check if a block is interactive */
export function isBlockInteractive(block: SchemaBlock): boolean {
  return getBlockCapabilities(block).derived.interactive;
}

/** Check if a block is measurable (height can be determined) */
export function isBlockMeasurable(block: SchemaBlock): boolean {
  return getBlockCapabilities(block).derived.measurable;
}

/** Check if a block can be lazy-rendered */
export function isBlockLazyRenderable(block: SchemaBlock): boolean {
  return getBlockCapabilities(block).derived.lazyRenderable;
}

/** Check if a block's renderer handles compression natively */
export function isBlockRendererHandlesCompression(block: SchemaBlock): boolean {
  return getBlockCapabilities(block).derived.rendererHandlesCompression;
}

// ── Type-string Convenience Functions (no SchemaBlock needed) ───
// These use the cached BlockCapabilityRegistry internally,
// so they're O(1) after the first call per type.

/** Check if a block TYPE fills the entire scene (cover, hero, etc.) */
export function isFullPageBlockType(type: string): boolean {
  return !BlockCapabilityRegistry.get(type).derived.measurable;
}

/** Check if a block TYPE is interactive */
export function isBlockTypeInteractive(type: string): boolean {
  return BlockCapabilityRegistry.get(type).derived.interactive;
}

/** Check if a block TYPE is compression-capable */
export function isBlockTypeCompressionCapable(type: string): boolean {
  return BlockCapabilityRegistry.get(type).derived.compressionCapable;
}

/** Check if a block TYPE is splittable across scenes */
export function isBlockTypeSplittable(type: string): boolean {
  return BlockCapabilityRegistry.get(type).derived.splittable;
}

/** Check if a block TYPE is measurable (height can be determined) */
export function isBlockTypeMeasurable(type: string): boolean {
  return BlockCapabilityRegistry.get(type).derived.measurable;
}

/** Check if a block TYPE's renderer handles compression natively */
export function isBlockTypeRendererHandlesCompression(type: string): boolean {
  return BlockCapabilityRegistry.get(type).derived.rendererHandlesCompression;
}

// ── Composite Block Detection ──────────────────────────────────
// Composite blocks have nested children (ftab.tabs[].content, materi-section.content).
// This is the SINGLE SOURCE OF TRUTH for which block types are composite.
// All code that checks `block.type === 'ftab' || block.type === 'materi-section'`
// should use this function instead.

/** Known composite block types (contain nested SchemaBlock children) */
const COMPOSITE_BLOCK_TYPES = new Set([
  'ftab',           // tabs[].content → SchemaBlock[]
  'materi-section', // content → SchemaBlock[]
]);

/**
 * Check if a block TYPE is a known composite (contains nested blocks).
 *
 * Composite blocks are special because:
 *   1. Their children participate in the scene layout engine
 *   2. They need composite-aware traversal (SchemaTraversal)
 *   3. They affect immutable operations (updateBlockInSchema, deepClone, etc.)
 *   4. They have special compression rules (not lazy-renderable)
 *
 * IMPORTANT: This only checks the TYPE level. For runtime instance checks
 * where ANY block might have a `children` array, use:
 *   `isCompositeBlockType(type) || (block.children && block.children.length > 0)`
 *
 * Adding a new composite block type? Just add it to COMPOSITE_BLOCK_TYPES above.
 * No other code needs to change.
 */
export function isCompositeBlockType(type: string): boolean {
  return COMPOSITE_BLOCK_TYPES.has(type);
}

// ── Registry Cache (for block types, not instances) ────────────

/**
 * BlockCapabilityRegistry provides cached lookups for block TYPE capabilities.
 *
 * Use this when you need to know capabilities for a block TYPE (without
 * an instance). For block INSTANCE capabilities (which may have custom hints),
 * use getBlockCapabilities(block) directly.
 *
 * The registry caches results by block type — calling get() multiple times
 * for the same type is O(1) after the first call.
 */
class BlockCapabilityRegistryClass {
  private cache = new Map<string, BlockCapabilityInfo>();

  /** Get capabilities for a block type (cached) */
  get(type: string): BlockCapabilityInfo {
    const cached = this.cache.get(type);
    if (cached) return cached;

    // Create a minimal block to derive capabilities
    const minimalBlock = { type } as SchemaBlock;
    const info = getBlockCapabilities(minimalBlock);
    this.cache.set(type, info);
    return info;
  }

  /** Invalidate cache for a specific type (rarely needed) */
  invalidate(type: string): void {
    this.cache.delete(type);
  }

  /** Invalidate entire cache (e.g., after hint schema changes) */
  invalidateAll(): void {
    this.cache.clear();
  }

  /** Get all registered block type capabilities */
  getAll(): Map<string, BlockCapabilityInfo> {
    const types = [
      'cover', 'hero', 'petunjuk', 'tp', 'alur', 'skenario',
      'def-box', 'nc-grid', 'flashcard-set', 'ftab', 'nk-card',
      'materi-section', 'diskusi', 'kuis',
      'sortir-game', 'roda-game', 'memory-game', 'matching-game',
      'fill-blank-game', 'word-search-game', 'true-false-game',
      'drag-drop-game', 'crossword-game', 'team-buzzer-game',
      'hasil', 'refleksi', 'penutup', 'tabel-accord',
      'tujuan-display', 'motivasi', 'rangkuman',
    ];

    for (const type of types) {
      this.get(type); // Populates cache
    }

    return new Map(this.cache);
  }

  /** Filter block types by capability */
  filterByCapability(capability: keyof DerivedCapabilities, value: boolean = true): string[] {
    const all = this.getAll();
    return Array.from(all.entries())
      .filter(([, info]) => info.derived[capability] === value)
      .map(([type]) => type);
  }
}

/** Singleton registry instance */
export const BlockCapabilityRegistry = new BlockCapabilityRegistryClass();
