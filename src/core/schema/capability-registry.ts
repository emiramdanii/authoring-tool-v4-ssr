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
  // Each rule uses a Set lookup instead of hardcoded string checks,
  // making it easy to add new types without editing conditionals.

  // Full-page blocks (cover, hero) fill entire scene — never split/compress
  if (FULL_PAGE_BLOCK_TYPES.has(type)) {
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

  // Game blocks are always interactive, not measurable, not splittable
  // Games have fixed visual layout — they don't participate in height
  // measurement and their content is clipped, not resized or scrolled.
  if (GAME_BLOCK_TYPES.has(type)) {
    derived.interactive = true;
    derived.measurable = false;    // Games have fixed visual layout
    derived.splittable = false;
    derived.lazyRenderable = false;
    derived.compressionCapable = false; // Games don't compress
    derived.rendererHandlesCompression = false;
    sources.interactive = 'definition';
    sources.measurable = 'definition';
    sources.splittable = 'definition';
    sources.lazyRenderable = 'definition';
    sources.compressionCapable = 'definition';
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

// ── Overflow Rule Derivation ──────────────────────────────────
// Overflow rules determine how a block handles content that exceeds
// its allocated height. Previously, BLOCK_OVERFLOW_RULES in
// SceneLayoutEngine hardcoded every block type's overflow behavior.
//
// Now, the DEFAULT overflow rule is DERIVED from capabilities:
//   - Not measurable → 'clip'    (full-page blocks: cover, hero, games)
//   - Interactive    → 'internalScroll' (kuis, games with scrollable content)
//   - Otherwise      → 'autoResize'    (content blocks that expand)
//
// BLOCK_OVERFLOW_RULES remains as an EXPLICIT OVERRIDE map — when a
// block type's overflow behavior differs from the capability-derived
// default (e.g., ftab needs internalScroll even though it's not
// technically "interactive"), it gets an explicit entry.
//
// This means: when adding a new block type, you ONLY need to update
// the capability registry. The overflow rule will be correct by default.
// Only add an override if the derived rule is wrong for your block.

export type OverflowRule =
  | 'clip'           // Hard clip — content is cut off (overflow-hidden)
  | 'autoResize'     // Expand block height to fit content (up to maxHeight)
  | 'internalScroll' // Keep block size, add internal scroll (overflow-y: auto)
  | 'scaleDown';     // Scale content to fit within block (font-size reduction)

/**
 * Derive the default overflow rule for a block type from its capabilities.
 *
 * This is the CAPABILITY-DRIVEN default. SceneLayoutEngine.getOverflowRule()
 * checks BLOCK_OVERFLOW_RULES first (explicit overrides), then falls back
 * to this derivation. New block types get the right default automatically.
 *
 * Derivation logic (intentionally simple):
 *   1. Not measurable (cover, hero, games) → 'clip'
 *      These blocks have fixed visual layout — content that doesn't fit
 *      is clipped. No scroll, no resize.
 *   2. Default (measurable) → 'autoResize'
 *      Content blocks expand to fit their content. The layout engine
 *      respects their natural height, then applies compression if needed.
 *
 * WHY NOT derive 'internalScroll' from capabilities?
 *   The 'interactive' capability does NOT imply 'internalScroll'.
 *   Many blocks are interactive (diskusi, refleksi, tabel-accord) but
 *   should still auto-resize. The 'internalScroll' rule is needed only
 *   when a block has its own scroll/navigation UI (kuis, ftab, skenario).
 *   This distinction is NOT derivable from capabilities alone, so
 *   'internalScroll' is always an explicit override in BLOCK_OVERFLOW_RULES.
 */
export function deriveOverflowRule(blockType: string): OverflowRule {
  const caps = BlockCapabilityRegistry.get(blockType).derived;

  // Full-page / fixed-layout blocks: cover, hero, games
  // They don't participate in height measurement — content is clipped
  if (!caps.measurable) return 'clip';

  // All other blocks: content blocks, interactive content, composites
  // They expand to fit content, then compression kicks in if needed
  return 'autoResize';
}

// ── Full-Page Block Detection ─────────────────────────────────
// Full-page blocks fill the entire scene height and never participate
// in normal flow layout (no splitting, no compression, no lazy render).
// This is the SINGLE SOURCE OF TRUTH for which block types are full-page.
// All code that checks `type === 'cover' || type === 'hero'` should use
// isFullPageBlockType() or this set instead.

/** Known full-page block types (fill entire scene, never split/compress) */
const FULL_PAGE_BLOCK_TYPES = new Set([
  'cover',  // Cover page — always fills 1280×720
  'hero',   // Hero banner — always fills 1280×720
]);

// ── Game Block Detection ───────────────────────────────────────
// Game blocks are always interactive, not measurable, not splittable.
// This replaces the old `type.endsWith('-game')` convention.
//
// WHY a set instead of string matching:
//   - `endsWith('-game')` is fragile — a block named 'my-game' that
//     isn't a game would get wrong capabilities
//   - A set is explicit and auditable — you can see every game type
//   - New game types MUST be added here (and to BlockDefinitionRegistry)
//
// Adding a new game type? Add it to this set AND to BlockDefinitionRegistry.
// The capability registry will automatically derive the right capabilities.

/** Known game block types (always interactive, fixed layout, not measurable) */
const GAME_BLOCK_TYPES = new Set([
  'sortir-game',
  'roda-game',
  'memory-game',
  'matching-game',
  'fill-blank-game',
  'word-search-game',
  'true-false-game',
  'drag-drop-game',
  'crossword-game',
  'team-buzzer-game',
]);

/** Check if a block TYPE is a known full-page block */
export function isFullPageBlockTypeExplicit(type: string): boolean {
  return FULL_PAGE_BLOCK_TYPES.has(type);
}

/** Check if a block TYPE is a known game block */
export function isGameBlockType(type: string): boolean {
  return GAME_BLOCK_TYPES.has(type);
}

/** Get all known game block types (for iteration/mapping) */
export function getGameBlockTypes(): ReadonlySet<string> {
  return GAME_BLOCK_TYPES;
}

/** Get all known full-page block types (for iteration/mapping) */
export function getFullPageBlockTypes(): ReadonlySet<string> {
  return FULL_PAGE_BLOCK_TYPES;
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
 * Adding a new composite block type? Just add it to COMPOSITE_BLOCK_TYPES above
 * AND add a CompositeContainerDescriptor to COMPOSITE_CONTAINER_DESCRIPTORS below.
 * No other code needs to change.
 */
export function isCompositeBlockType(type: string): boolean {
  return COMPOSITE_BLOCK_TYPES.has(type);
}

// ── Composite Container Descriptor ────────────────────────────
// Describes HOW to access child blocks in each composite type.
// This is the SINGLE SOURCE OF TRUTH for container structure.
//
// When a new composite block type is added, add a descriptor here.
// All consuming code (SchemaTraversal, immutable.ts, ui-slice.ts, etc.)
// will automatically support the new type via the descriptor.
//
// WHY: Before this, every file that needed to access composite children
// had its own `if (block.type === 'ftab') { ... tabs ... }` and
// `if (block.type === 'materi-section') { ... content ... }` blocks.
// This was:
//   1. Duplicated across 6+ files (20+ total occurrences)
//   2. Error-prone (easy to miss a file when adding a new type)
//   3. Inconsistent (some files checked 'content' in block, others didn't)
//
// Now, the descriptor drives all composite access patterns from one place.

export interface CompositeContainerDescriptor {
  /** Block type this descriptor applies to */
  blockType: string;
  /** How this container appears in BlockPath.container */
  containerType: 'ftab-tab' | 'materi-content' | 'children';
  /** Key on the block object that holds the container data */
  accessor: string;
  /**
   * Container structure type:
   * - 'direct': accessor directly gives SchemaBlock[]
   *     Example: materi-section.content → SchemaBlock[]
   * - 'tabular': accessor gives an array of tab objects,
   *     each with a tabContentKey holding SchemaBlock[]
   *     Example: ftab.tabs → Array<{ content: SchemaBlock[] }>
   */
  structure: 'direct' | 'tabular';
  /** For tabular structure: the key inside each tab object that holds SchemaBlock[] */
  tabContentKey?: string;
}

/**
 * Registry of all composite container descriptors.
 * Add new composite types here — consuming code reads from this automatically.
 */
const COMPOSITE_CONTAINER_DESCRIPTORS: CompositeContainerDescriptor[] = [
  {
    blockType: 'ftab',
    containerType: 'ftab-tab',
    accessor: 'tabs',
    structure: 'tabular',
    tabContentKey: 'content',
  },
  {
    blockType: 'materi-section',
    containerType: 'materi-content',
    accessor: 'content',
    structure: 'direct',
  },
];

const CONTAINER_DESCRIPTOR_MAP = new Map(
  COMPOSITE_CONTAINER_DESCRIPTORS.map(d => [d.blockType, d])
);

/**
 * Get the container descriptor for a composite block type.
 * Returns null if the type is not a known composite.
 *
 * Use this instead of hardcoding `block.type === 'ftab'` / `'materi-section'`
 * to determine how to access a composite block's children.
 *
 * Example:
 *   const desc = getCompositeContainerDescriptor(block.type);
 *   if (desc?.structure === 'direct') {
 *     const children = (block as any)[desc.accessor]; // SchemaBlock[]
 *   }
 *   if (desc?.structure === 'tabular') {
 *     const tabs = (block as any)[desc.accessor]; // Array<Record<string, SchemaBlock[]>>
 *     for (const tab of tabs) {
 *       const children = tab[desc.tabContentKey!]; // SchemaBlock[]
 *     }
 *   }
 */
export function getCompositeContainerDescriptor(type: string): CompositeContainerDescriptor | null {
  return CONTAINER_DESCRIPTOR_MAP.get(type) ?? null;
}

// ── CanvaElement Interactive Bridge ────────────────────────────
// CanvaElement is the legacy editor element model. Its type space
// differs from SchemaBlock:
//   CanvaElement: 'kuis' | 'game' | 'materi' | 'modul' | 'teks' | 'shape'
//   SchemaBlock:  'kuis' | 'sortir-game' | 'roda-game' | ...
//
// The 'game' type in CanvaElement is a catch-all for all *-game
// SchemaBlock types. This function bridges the gap so that
// CanvaElement-based components can use the capability registry
// as the single source of truth for interactivity.

/**
 * Check if a CanvaElement type represents an interactive block.
 *
 * This bridges the legacy CanvaElement type space to the schema
 * capability registry. Use this in canvas editor components that
 * work with CanvaElement instead of SchemaBlock.
 *
 * @param type - CanvaElement type string ('kuis', 'game', etc.)
 * @returns true if the element type is interactive
 */
export function isInteractiveElementType(type: string): boolean {
  // 'game' is a CanvaElement catch-all for all *-game SchemaBlock types
  if (type === 'game') return true;
  // For all other types, delegate to the schema capability registry
  return isBlockTypeInteractive(type);
}

/**
 * Check if a CanvaElement type shows a preview widget on the canvas stage.
 *
 * In the canvas editor, some element types show a rich preview widget
 * (QuizWidget, GameWidget, ModuleBlock/CanvasElementPreview) while
 * others render inline (teks, shape, image). This function centralizes
 * the decision so that adding new element types doesn't require
 * updating scattered if/else chains in StageElement.tsx.
 *
 * Previewable types:
 *   - Interactive elements (kuis, game) — show their widget
 *   - Module elements (materi, modul) — show PresetModuleCard preview
 *
 * @param type - CanvaElement type string ('kuis', 'game', 'materi', 'modul', etc.)
 * @returns true if the element should render a preview widget on canvas
 */
// ── CanvaElement Previewable Types ───────────────────────────
// Centralized set of CanvaElement types that show a preview widget
// on the canvas stage. This replaces scattered `type === 'materi' || type === 'modul'`
// checks and makes it easy to add new previewable types.

const PREVIEWABLE_ELEMENT_TYPES = new Set([
  'materi',  // Shows PresetModuleCard preview
  'modul',   // Shows PresetModuleCard preview
]);

export function isCanvaElementPreviewable(type: string): boolean {
  // Interactive elements always show a preview widget
  if (isInteractiveElementType(type)) return true;
  // Module/materi types show PresetModuleCard preview
  if (PREVIEWABLE_ELEMENT_TYPES.has(type)) return true;
  return false;
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
      'gambar', 'timeline', 'compare', 'reveal',
      'tabel', 'checklist', 'statistik', 'studi', 'materi-blok',
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
