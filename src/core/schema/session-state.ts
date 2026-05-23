// ═══════════════════════════════════════════════════════════════════
// SESSION STATE — Document vs Interaction State Isolation
// ═══════════════════════════════════════════════════════════════════
// The canonical schema tree is now STABLE — it's the single source of
// truth for document content. But runtime interaction state (selection,
// hover, focus, editing, resize) must NOT leak into the schema.
//
// THIS MODULE FORMALIZES THE BOUNDARY:
//
//   DocumentState  =  ScreenSchema  (pure, serializable, exportable)
//                     ↕ NEVER MIX ↕
//   SessionState   =  UI interactions (ephemeral, per-session, discardable)
//
// WHY THIS MATTERS:
//   1. Analytics — document state can be analyzed without session noise
//   2. Multiplayer — session state is per-user, document is shared
//   3. Undo/Redo — undo reverses document mutations, not UI interactions
//   4. Replay — you can replay document mutations without replaying UI
//   5. Export purity — exported content must NEVER contain selection state
//
// SCHEMA BLOAT PREVENTION:
//   The following are FORBIDDEN in SchemaBlock / ScreenSchema:
//     ❌ DOM refs (elementRef, containerRef)
//     ❌ Runtime cache (measuredHeight, cachedLayout)
//     ❌ Selection state (isSelected, selectedBlockId)
//     ❌ Hover state (isHovered, hoverBlockId)
//     ❌ Resize state (isResizing, resizeHandle)
//     ❌ Focus state (isFocused, focusBlockId)
//     ❌ Edit state (isEditing, editingBlockId)
//     ❌ Drag state (isDragging, dragSourceId)
//     ❌ Animation state (isAnimating, animationProgress)
//
//   Schema MUST remain: pure serializable document tree
//   All runtime state goes into SessionInteractionState
// ═══════════════════════════════════════════════════════════════════

import type { ScreenSchema, SchemaBlock } from './types';
import { validateSchema, type ValidationResult } from './validation';
import { isCompositeBlockType, getCompositeContainerDescriptor } from './capability-registry';
import { logger } from '@/core/utils/logger';

// ── Purity Violation ───────────────────────────────────────────

export interface PurityViolation {
  blockId: string;
  blockType: string;
  fieldName: string;
  fieldValue: unknown;
}

// ── Document State ─────────────────────────────────────────────

/**
 * DocumentState is a thin wrapper around ScreenSchema that
 * explicitly marks it as "the document" — pure, serializable,
 * exportable, shareable, undoable.
 *
 * Use this type when you need to emphasize that you're working
 * with the DOCUMENT, not the UI session.
 *
 * The document is:
 *   - Serializable to JSON (no functions, no refs)
 *   - Deterministic (same input → same output)
 *   - Exportable (can be rendered without React)
 *   - Shareable (can be sent to other users)
 *   - Versionable (has a version number for migration)
 */
export type DocumentState = ScreenSchema;

/**
 * Derive a DocumentState from a ScreenSchema.
 * This is an identity function — it's just for type clarity.
 *
 * Use it at API boundaries to signal: "from here on, this is a document".
 */
export function deriveDocumentState(schema: ScreenSchema): DocumentState {
  return schema;
}

// ── Session Interaction State ──────────────────────────────────

/**
 * Session state for user interactions.
 * This is PER-SESSION, PER-USER, EPHEMERAL.
 *
 * It is NEVER:
 *   - Serialized to JSON
 *   - Sent to other users
 *   - Included in exports
 *   - Part of undo/redo history
 *
 * It IS:
 *   - Used by the editor UI to track what the user is doing
 *   - Reset when the user navigates away
 *   - Discarded on page reload
 */
export interface SessionInteractionState {
  /** Currently selected block ID (null = no selection) */
  selectedBlockId: string | null;
  /** Currently hovered block ID (null = no hover) */
  hoveredBlockId: string | null;
  /** Currently focused block ID (null = no focus) */
  focusedBlockId: string | null;
  /** Block currently being edited inline (null = not editing) */
  editingBlockId: string | null;
  /** Block currently being resized (null = not resizing) */
  resizingBlockId: string | null;
  /** Block currently being dragged (null = not dragging) */
  draggingBlockId: string | null;
  /** Current active scene index (for multi-scene pages) */
  activeSceneIndex: number;
  /** Whether the canvas is in editing mode vs preview mode */
  editMode: boolean;
  /** Whether any block is currently animating */
  isAnimating: boolean;
  /** Measurement cache — block ID → rendered height in px */
  measuredHeights: Map<string, number>;
  /** Layout cache — derived scene plan for current schema */
  layoutCache: unknown | null;
  /** Timestamp of last user interaction (for auto-save debounce) */
  lastInteractionAt: number;
  /**
   * Compressed height cache — block ID → compressed height in px.
   * Written by SceneTransaction.rebalanceSchema() instead of writing
   * directly to the schema (which would leak derived data into localStorage).
   * This cache is per-session and is NEVER persisted.
   */
  compressedHeightCache: Map<string, number>;
}

/**
 * Create a fresh session state.
 * Called when a page is opened or when the user switches context.
 */
export function createSessionState(): SessionInteractionState {
  return {
    selectedBlockId: null,
    hoveredBlockId: null,
    focusedBlockId: null,
    editingBlockId: null,
    resizingBlockId: null,
    draggingBlockId: null,
    activeSceneIndex: 0,
    editMode: true,
    isAnimating: false,
    measuredHeights: new Map(),
    layoutCache: null,
    lastInteractionAt: Date.now(),
    compressedHeightCache: new Map(),
  };
}

// ── Purity Guard ───────────────────────────────────────────────

/**
 * Check if a DocumentState is pure — contains no runtime state leakage.
 *
 * This goes beyond standard validation (which checks structure) and
 * specifically looks for fields that should NOT be in the document:
 *   - Any field matching known runtime state patterns
 *   - Any non-serializable value (functions, DOM refs, class instances)
 *
 * Returns true if the document is pure.
 */
export function isDocumentPure(doc: DocumentState): { pure: boolean; violations: PurityViolation[]; violationStrings: string[] } {
  const violations: PurityViolation[] = [];
  const violationStrings: string[] = [];

  // Standard validation (pure serializable check)
  const result: ValidationResult = validateSchema(doc);
  if (!result.valid) {
    for (const e of result.errors) {
      violationStrings.push(`${e.path}: ${e.message}`);
    }
  }

  // Check for known runtime state field names in blocks
  const RUNTIME_STATE_FIELDS = new Set([
    'isSelected', 'isHovered', 'isFocused', 'isEditing', 'isResizing',
    'isDragging', 'isAnimating', 'animationProgress',
    'selectedBlockId', 'hoveredBlockId', 'focusedBlockId',
    'editingBlockId', 'resizingBlockId', 'draggingBlockId',
    'elementRef', 'containerRef', 'domNode',
    'measuredHeight', 'cachedLayout', 'renderCache',
    '_compressedHeight', // Derived by rebalance transaction — must NOT persist
  ]);

  function checkBlock(block: SchemaBlock, path: string): void {
    const blockKeys = Object.keys(block);

    for (const key of blockKeys) {
      if (RUNTIME_STATE_FIELDS.has(key)) {
        violations.push({
          blockId: block.id ?? '',
          blockType: block.type,
          fieldName: key,
          fieldValue: (block as Record<string, unknown>)[key],
        });
        violationStrings.push(`${path}.${key}: Runtime state field "${key}" must NOT be in document schema`);
      }
    }

    // Check nested runtime fields inside compression object
    if (block.compression && typeof block.compression === 'object') {
      for (const compKey of Object.keys(block.compression)) {
        if (RUNTIME_STATE_FIELDS.has(compKey)) {
          violations.push({
            blockId: block.id ?? '',
            blockType: block.type,
            fieldName: `compression.${compKey}`,
            fieldValue: (block.compression as unknown as Record<string, unknown>)[compKey],
          });
          violationStrings.push(`${path}.compression.${compKey}: Runtime state field "${compKey}" must NOT be in document schema`);
        }
      }
    }

    // Check nested blocks in composite blocks using container descriptor
    if (isCompositeBlockType(block.type)) {
      const descriptor = getCompositeContainerDescriptor(block.type);
      if (descriptor) {
        if (descriptor.structure === 'direct') {
          const children = (block as Record<string, unknown>)[descriptor.accessor] as SchemaBlock[] | undefined;
          for (let j = 0; j < (children?.length || 0); j++) {
            checkBlock!(children![j], `${path}.${descriptor.accessor}[${j}]`);
          }
        }
        if (descriptor.structure === 'tabular' && descriptor.tabContentKey) {
          const tabs = (block as Record<string, unknown>)[descriptor.accessor] as Array<Record<string, unknown>> | undefined;
          for (let t = 0; t < (tabs?.length || 0); t++) {
            const tab = tabs![t];
            const content = tab![descriptor.tabContentKey!] as SchemaBlock[] | undefined;
            for (let j = 0; j < (content?.length || 0); j++) {
              checkBlock!(content![j], `${path}.${descriptor.accessor}[${t}].${descriptor.tabContentKey}[${j}]`);
            }
          }
        }
      }
    }

    // Check children
    if (block.children) {
      for (let j = 0; j < block.children.length; j++) {
        checkBlock!(block.children[j], `${path}.children[${j}]`);
      }
    }
  }

  for (let i = 0; i < doc.blocks.length; i++) {
    checkBlock!(doc.blocks[i], `blocks[${i}]!`);
  }

  return { pure: violations.length === 0, violations, violationStrings };
}

/**
 * Assert that a document is pure.
 * Throws in dev mode if any runtime state is found in the document.
 * Logs in production.
 * Returns the purity check result so callers can inspect violations.
 */
export function assertDocumentPurity(doc: DocumentState, source?: string): { pure: boolean; violations: PurityViolation[]; violationStrings: string[] } {
  const result = isDocumentPure(doc);
  if (!result.pure) {
    const src = source ? ` (${source})` : '';
    const msg = `Document purity violation${src}:\n  ${result.violationStrings.join('\n  ')}`;

    if (process.env.NODE_ENV === 'production') {
      logger.error('DOCUMENT-PURITY', msg);
    } else {
      throw new Error(msg);
    }
  }
  return result;
}

// ── Compressed Height Cache ────────────────────────────────────
// MODULE-LEVEL SINGLETON — same pattern as BlockMeasurer.measurementCache.
//
// WHY MODULE-LEVEL:
//   1. Compressed heights persist across component re-renders
//   2. Can be read synchronously by SceneOverflowEngine / SceneLayoutEngine
//   3. No React state (avoids re-render loops)
//   4. Per-session, NEVER persisted to localStorage
//
// LIFECYCLE:
//   Written by: SceneTransaction.commit() → commitSceneTransaction() → writeCompressedHeights()
//   Read by:   SceneOverflowEngine.computeScenePlan(), SceneLayoutEngine
//   Cleared:   On page change, project change, or explicit invalidation
//
// This cache is the RUNTIME counterpart of the immutable compression
// hints on SchemaBlock. The hints declare the STRATEGY (accordion,
// reveal-set, etc.), while this cache stores the DERIVED RESULT
// (block X should render at 280px instead of 350px).
// ═══════════════════════════════════════════════════════════════════

const _compressedHeightCache = new Map<string, number>();

/**
 * Get the compressed height for a block from the runtime cache.
 * Returns undefined if no compressed height has been computed.
 *
 * Use this in layout engines instead of reading _compressedHeight
 * from the schema (which was removed — that would leak derived data
 * into localStorage).
 */
export function getCompressedHeight(blockId: string): number | undefined {
  return _compressedHeightCache.get(blockId);
}

/**
 * Check if a block has a cached compressed height.
 */
export function hasCompressedHeight(blockId: string): boolean {
  return _compressedHeightCache.has(blockId);
}

/**
 * Store a compressed height for a block.
 * Called by commitSceneTransaction() after a successful transaction.
 */
export function setCompressedHeight(blockId: string, height: number): void {
  _compressedHeightCache.set(blockId, Math.round(height));
}

/**
 * Write a batch of compressed heights from a transaction result.
 * This is the PRIMARY integration point — after every successful
 * transaction that produces compressedHeights, call this to make
 * them available to layout engines.
 *
 * @param heights - The compressedHeights Map from TransactionResult
 */
export function writeCompressedHeights(heights: Map<string, number>): void {
  for (const [blockId, height] of heights) {
    _compressedHeightCache.set(blockId, Math.round(height));
  }
}

/**
 * Remove a single block's compressed height (e.g., when block is deleted).
 */
export function removeCompressedHeight(blockId: string): void {
  _compressedHeightCache.delete(blockId);
}

/**
 * Clear all cached compressed heights.
 * Call when the project changes or the user navigates away.
 */
export function clearCompressedHeightCache(): void {
  _compressedHeightCache.clear();
}

/**
 * Get all compressed heights as a readonly map (for debugging).
 */
export function getAllCompressedHeights(): ReadonlyMap<string, number> {
  return _compressedHeightCache;
}
