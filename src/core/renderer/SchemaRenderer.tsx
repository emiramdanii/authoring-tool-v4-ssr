// ═══════════════════════════════════════════════════════════════════
// SCHEMA RENDERER ENGINE — Converts JSON Schema → React UI
// ═══════════════════════════════════════════════════════════════════
// This is the core orchestrator. It reads ScreenSchema JSON
// and produces visual output using extracted per-block renderers.
//
// ARCHITECTURE (FASE 1C — Hybrid Bridge):
//   SchemaBlock → resolveSceneLayout() → ResolvedBlock → renderer
//
// The scene engine is the SINGLE layout authority.
// Browser only renders — it does NOT control position/size.
// Flex/grid is allowed INSIDE blocks, NOT for scene positioning.
//
// The principle: NEVER store HTML. Store schema. Renderer produces UI.
// The layout authority: Scene engine, NOT browser CSS.

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ── Stable noop callbacks — prevent re-renders from new function refs ──
// These are module-level constants so React.memo sees the same reference.
const NOOP_FN = () => {};
import type { SchemaBlock, ScreenSchema } from '../schema/types';
import {
  resolveSceneLayout,
  computeSafeArea,
  getSceneResolution,
  getBlockPositionStyle,
  type SceneResolution,
  type SafeArea,
  type ResolvedBlockPosition,
  DEFAULT_SAFE_AREA,
} from '../scene/SceneLayoutEngine';
import { MeasuredBlock } from '../layout/BlockMeasurer';
import { createMeasurementQueue, type MeasurementCommitQueue } from '../layout/MeasurementCommitQueue';
import { computeScenePlan, createDerivedSchema, type ScenePlan } from '../layout/SceneOverflowEngine';
import { SceneNavigator } from '../layout/SceneNavigator';
import { useCanvaStore } from '@/store/canva-store';
import { useCanvasBlockDrag } from '@/hooks/use-canvas-block-drag';

// Re-export from types.ts for backward compatibility
export type { SchemaRenderMode } from './types';
export { TokenResolver } from './types';
import type { SchemaRenderMode } from './types';
import type { TokenResolver } from './types';

// Import SceneRegistry — the SOLE dispatch mechanism
import { SCENE_REGISTRY, getBlockDefinition } from '../registry/SceneRegistry';

// Import BlockSelectionOverlay — reusable editing overlay
import { BlockSelectionOverlay } from '../editor/overlay/BlockSelectionOverlay';

// Import BlockErrorBoundary — per-block crash isolation
import { BlockErrorBoundary } from './BlockErrorBoundary';

// Import CompressionBoundary — universal compression fallback
import { CompressionBoundary } from '../layout/CompressionBoundary';

// ═══════════════════════════════════════════════════════════════════
// SCREEN RENDERER — Renders a single ScreenSchema
// ═══════════════════════════════════════════════════════════════════
//
// FASE 1C: Hybrid Bridge Architecture
//   - Scene engine provides layout authority (resolveSceneLayout)
//   - Cover/hero pages: full absolute positioning
//   - Flow pages: resolved positions from scene engine
//   - Safe area computed from navConfig, not CSS guess
//   - Overflow rules per block type
//
// The key change: flow blocks now get ABSOLUTE positions from
// resolveSceneLayout(), NOT flex/browser layout.
// This eliminates the "mixed layout authority" problem.

export interface ScreenRendererProps {
  screen: ScreenSchema;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
  /** Currently selected block ID (canvas mode only — for editing overlay) */
  selectedBlockId?: string | null;
  /** Multi-select: array of selected block IDs */
  selectedBlockIds?: string[];
  /** Currently hovered block ID (canvas mode only — for hover effects) */
  hoveredBlockId?: string | null;
  /** Currently editing block ID (canvas mode only — inline editing) */
  editingBlockId?: string | null;
  /** Callback when a block is clicked (canvas mode only) */
  onBlockSelect?: (blockId: string, blockType: string, addToSelection?: boolean) => void;
  /** Callback when a block is hovered (canvas mode only) */
  onBlockHover?: (blockId: string | null) => void;
  /** Callback when a block is double-clicked for inline editing (canvas mode only) */
  onBlockEdit?: (blockId: string, blockType: string) => void;
  /** Callback to delete a block */
  onBlockDelete?: (blockId: string) => void;
  /** Callback to move a block up in flow order */
  onBlockMoveUp?: (blockId: string) => void;
  /** Callback to move a block down in flow order */
  onBlockMoveDown?: (blockId: string) => void;
  /** Callback to duplicate a block */
  onBlockDuplicate?: (blockId: string) => void;
  /** Callback to reorder blocks by index (canvas drag-reorder) */
  onBlockReorder?: (fromIndex: number, toIndex: number) => void;
  /** Scene resolution — injected from PageRenderer for deterministic layout */
  sceneResolution?: SceneResolution;
  /** Safe area — injected from PageFrame for deterministic layout */
  safeArea?: SafeArea;
  /** Ratio ID for scene resolution lookup */
  ratioId?: string;
  /** Whether navbar is shown (affects safe area) */
  showTopNav?: boolean;
  /** Whether bottom navbar is shown (affects safe area) */
  showBottomNav?: boolean;
}

export const SchemaScreenRenderer = React.memo(function SchemaScreenRenderer({
  screen,
  mode,
  tokens,
  interactive = false,
  selectedBlockId,
  selectedBlockIds,
  hoveredBlockId,
  editingBlockId,
  onBlockSelect,
  onBlockHover,
  onBlockEdit,
  onBlockDelete,
  onBlockMoveUp,
  onBlockMoveDown,
  onBlockDuplicate,
  onBlockReorder,
  sceneResolution: externalSceneRes,
  safeArea: externalSafeArea,
  ratioId = '16:9',
  showTopNav = false,
  showBottomNav = false,
}: ScreenRendererProps) {
  const isCompact = mode === 'canvas';
  const hasCoverBlock = screen.blocks.length === 1 && (screen.blocks[0].type === 'cover' || screen.blocks[0].type === 'hero');

  // ═══ MEASUREMENT COMMIT QUEUE ═════════════════════════════════
  // Instead of re-rendering on every single measurement, we batch
  // measurements and commit once after they settle.
  // This eliminates layout jitter (N measurements → 1 re-render).
  // Pipeline: Render (estimated) → Measure (batch) → Commit → Re-render (measured)
  const [measurementVersion, setMeasurementVersion] = useState(0);

  const commitQueue = useMemo<MeasurementCommitQueue>(() => {
    return createMeasurementQueue((_measurements) => {
      // Batch commit — single setState for all pending measurements
      setMeasurementVersion(v => v + 1);
    });
  }, []);

  // Dispose queue on unmount
  useEffect(() => {
    return () => commitQueue.dispose();
  }, [commitQueue]);

  const handleBlockMeasured = useCallback((blockId: string, height: number) => {
    // Queue measurement — commit is deferred (batched)
    commitQueue.add(blockId, height);
  }, [commitQueue]);

  // ═══ SCENE PLAN — Auto scene distribution ════════════════════
  // When content overflows a single scene, SceneOverflowEngine
  // computes a distribution plan: which blocks go in which scene.
  // SOURCE SCHEMA IS IMMUTABLE — plan is derived, never mutates.
  //
  // Scene state lives in the canva store so that:
  //   - Keyboard shortcuts (Ctrl+Arrow) can navigate scenes
  //   - StatusBar can display "Scene X/Y"
  //   - SceneNavigator can work without its own keydown listener
  const sceneIndex = useCanvaStore(s => s.sceneIndex);
  const sceneTotal = useCanvaStore(s => s.sceneTotal);
  const setSceneState = useCanvaStore(s => s.setSceneState);

  const sceneRes = externalSceneRes || getSceneResolution(ratioId);
  const safeArea = externalSafeArea || computeSafeArea({
    showTopNav,
    showBottomNav,
    isCompact,
    pagePadding: hasCoverBlock ? 0 : 16,
  });

  // Compute scene plan from measurements
  const scenePlan = useMemo<ScenePlan>(() => {
    const effectiveSafeArea = hasCoverBlock ? DEFAULT_SAFE_AREA : safeArea;
    return computeScenePlan(screen, sceneRes, effectiveSafeArea, { isCompact });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen.blocks, screen.id, sceneRes, safeArea, hasCoverBlock, isCompact, measurementVersion]);

  // Sync scene state to store whenever scene plan changes
  useEffect(() => {
    const totalScenes = scenePlan.totalScenes;
    const clampedIndex = Math.min(sceneIndex, Math.max(0, totalScenes - 1));
    setSceneState(clampedIndex, totalScenes);
  }, [scenePlan.totalScenes, sceneIndex, setSceneState]);

  // Get the derived schema for the current scene
  const effectiveSchema = useMemo(() => {
    if (scenePlan.isSingleScene) return screen;
    const currentScene = Math.min(sceneIndex, scenePlan.totalScenes - 1);
    return createDerivedSchema(screen, scenePlan.scenes[currentScene] || scenePlan.scenes[0]);
  }, [screen, scenePlan, sceneIndex]);

  // ═══ SCENE LAYOUT RESOLUTION — SINGLE LAYOUT AUTHORITY ═══
  // resolveSceneLayout() is the ONLY source of block positions.
  // Browser flex/grid is NO LONGER the layout authority.
  // This eliminates the "mixed layout authority" problem.
  //
  // measurementVersion forces re-resolution when BlockMeasurer
  // reports new heights. This is the "Commit" step of:
  //   Render → Measure → Decide → Commit
  const resolvedBlocks = useMemo(() => {
    // Cover/hero pages: safe area is 0 (they fill the entire scene)
    const effectiveSafeArea = hasCoverBlock ? DEFAULT_SAFE_AREA : safeArea;
    // Use effectiveSchema (derived for current scene) instead of full screen
    return resolveSceneLayout(effectiveSchema.blocks, sceneRes, effectiveSafeArea, { isCompact });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSchema, sceneRes, safeArea, hasCoverBlock, isCompact, measurementVersion]);

  // ═══ CANVAS BLOCK DRAG REORDER ═══════════════════════════════
  // Only enable drag-reorder in canvas mode when onBlockReorder is provided.
  // Build a stable callback so the hook doesn't reinitialize on every render.
  const handleBlockReorder = useCallback((fromIndex: number, toIndex: number) => {
    onBlockReorder?.(fromIndex, toIndex);
  }, [onBlockReorder]);

  // Map each resolved block to its index in the ORIGINAL screen.blocks
  // (effectiveSchema may be a derived subset for multi-scene pages)
  const resolvedToSchemaIndex = useMemo(() => {
    return resolvedBlocks.map(rb => {
      const bid = rb.block.id;
      if (!bid) return -1;
      return screen.blocks.findIndex(b => b.id === bid);
    });
  }, [resolvedBlocks, screen.blocks]);

  // Count top-level blocks for the drag hook
  const topLevelBlockCount = screen.blocks.length;

  const { dragState, dragHandlers } = useCanvasBlockDrag(
    handleBlockReorder,
    topLevelBlockCount,
  );

  // Scene container ref for drag coordinate calculations
  const sceneContainerRef = useRef<HTMLDivElement>(null);

  // ═══ DROP INDICATOR COMPUTATION ════════════════════════════════
  // Compute where to show the drop indicator line during drag.
  // The line appears between two blocks at the drop target position.
  const dropIndicatorInfo = useMemo<{ y: number; height: number } | null>(() => {
    if (!dragState.isDragging || dragState.dragIndex === null || dragState.dropIndex === null) {
      return null;
    }
    // Find the Y position of the drop target boundary
    // The drop line goes BEFORE the block at dropIndex
    const targetResolvedIdx = resolvedToSchemaIndex.indexOf(dragState.dropIndex);
    if (targetResolvedIdx === -1) {
      // Block not in current scene — no indicator
      return null;
    }
    const targetResolved = resolvedBlocks[targetResolvedIdx];
    if (!targetResolved) return null;

    // Show the line just above the target block
    return {
      y: targetResolved.y - 2,
      height: 4,
    };
  }, [dragState, resolvedBlocks, resolvedToSchemaIndex]);

  // ═══ GHOST BADGE POSITION ═════════════════════════════════════
  // Show a small badge at the cursor during drag with the block name
  const ghostInfo = useMemo<{ x: number; y: number; name: string } | null>(() => {
    if (!dragState.isDragging || dragState.cursorX === null || dragState.cursorY === null || dragState.dragIndex === null) {
      return null;
    }
    const block = screen.blocks[dragState.dragIndex];
    if (!block) return null;
    const definition = getBlockDefinition(block.type);
    const name = definition?.name || block.type;
    return {
      x: dragState.cursorX,
      y: dragState.cursorY - 16, // offset above cursor
      name,
    };
  }, [dragState, screen.blocks]);

  // ═══ BACKGROUND STYLE — applies to ALL screen types ═══
  const bg = screen.background;
  const bgStyle = useMemo<React.CSSProperties>(() => {
    const style: React.CSSProperties = {};
    if (bg) {
      if (bg.type === 'radial') {
        style.background = `radial-gradient(ellipse 90% 60% at 50% 0%, ${tokens.colorAlpha(bg.color1 || 'y', 0.18)}, transparent 60%), linear-gradient(180deg, ${tokens.color(bg.color2 || 'bg')}, ${tokens.color('bg2')})`;
      } else if (bg.type === 'gradient') {
        style.background = `linear-gradient(180deg, ${tokens.color(bg.color1 || 'y')}, ${tokens.color(bg.color2 || 'bg')})`;
      } else if (bg.type === 'solid') {
        style.background = tokens.color(bg.color1 || 'bg');
      }
    }
    if (!bg && !hasCoverBlock) {
      style.background = tokens.color('bg');
    }
    return style;
  }, [bg, tokens, hasCoverBlock]);

  // ═══ RENDER: Scene-driven absolute positioning ═══
  // Cover/hero: absolute inset-0 (fills entire scene)
  // Flow pages: absolute positioning for ALL blocks (from resolveSceneLayout)
  // NO MORE flex-1 min-h-0 overflow-y-auto for the scene root.
  // That was the "mixed layout authority" problem.
  // Combine scene container ref with drag handler ref
  const setSceneRefCombined = useCallback((el: HTMLDivElement | null) => {
    sceneContainerRef.current = el;
    dragHandlers.setSceneRef(el);
  }, [dragHandlers]);

  return (
    <div
      ref={setSceneRefCombined}
      className={hasCoverBlock ? 'absolute inset-0' : 'relative h-full w-full'}
      style={{
        fontFamily: tokens.fontFamily('body'),
        color: tokens.color('text'),
        ...bgStyle,
        overflow: 'hidden', // Scene clips at boundary — no content escapes
      }}
    >
      {/* ══ BACKGROUND IMAGE LAYER — rendered behind content ════ */}
      {bg?.imageUrl && (
        <>
          <img
            src={bg.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 0,
              background: `rgba(0,0,0,${(bg.overlay ?? 30) / 100})`,
            }}
          />
        </>
      )}

      {/* ══ SECTION LABEL (if present) ═══════════════════════ */}
      {screen.sectionLabel && !hasCoverBlock && (
        <div style={{ position: 'absolute', left: safeArea.left, top: safeArea.top, zIndex: 2 }}>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-extrabold text-[10px] uppercase"
            style={{
              background: tokens.colorAlpha(screen.sectionColor || 'y', 0.15),
              color: tokens.color(screen.sectionColor || 'y'),
              letterSpacing: '0.08em',
            }}
          >
            {screen.sectionLabel}
          </span>
        </div>
      )}

      {/* ══ RESOLVED BLOCKS — Scene-driven absolute positioning ════ */}
      {/* Each block gets its position from resolveSceneLayout(). */}
      {/* Browser only renders — it does NOT control layout. */}
      {/* INTERNAL block layout (flex/grid) is allowed. */}
      {/* SCENE layout (position, size) is controlled by the engine. */}
      {/* BlockMeasurer wraps each block to report real DOM heights. */}
      {resolvedBlocks.map((resolved, resolvedIdx) => {
        const positionStyle = getBlockPositionStyle(resolved);
        // For cover/hero blocks that need pointer-events
        const pointerEvents = resolved.block.interactive ? 'auto' : undefined;
        const blockId = resolved.block.id || resolved.key;

        // Map this resolved block back to its index in screen.blocks (original schema)
        const schemaBlockIndex = resolvedToSchemaIndex[resolvedIdx] ?? -1;

        // Drag state for this block
        const isBeingDragged = schemaBlockIndex >= 0 && dragHandlers.isBlockDragged(schemaBlockIndex);

        return (
          <div
            key={resolved.key}
            ref={(el: HTMLDivElement | null) => {
              if (schemaBlockIndex >= 0) {
                dragHandlers.registerBlockRef(schemaBlockIndex, el);
              }
            }}
            style={{
              ...positionStyle,
              pointerEvents,
              transition: isBeingDragged ? 'none' : undefined,
            }}
          >
            {/* Overflow indicator for debugging (canvas mode only) */}
            {resolved.isOverflowing && isCompact && (
              <div
                className="absolute -top-0.5 right-1 text-[7px] font-bold px-1 rounded-b bg-amber-500/80 text-black"
                style={{ zIndex: 100 }}
              >
                overflow
              </div>
            )}
            {/* Compression indicator (canvas mode only) */}
            {resolved.compression && isCompact && (
              <div
                className="absolute -top-0.5 left-1 text-[7px] font-bold px-1.5 rounded-b flex items-center gap-0.5"
                style={{ zIndex: 100, background: 'rgba(52, 211, 153, 0.8)', color: '#000' }}
              >
                {resolved.compression.strategy === 'accordion' ? '⊞' : resolved.compression.strategy === 'reveal-set' ? '⋯' : resolved.compression.strategy === 'step-reveal' ? '▸' : '▾'}
                {' '}{resolved.compression.strategy}
              </div>
            )}
            <MeasuredBlock
              blockId={blockId}
              onMeasured={handleBlockMeasured}
            >
              <SchemaBlockRenderer
                block={resolved.block}
                mode={mode}
                tokens={tokens}
                interactive={interactive}
                compression={resolved.compression}
                blockIndex={schemaBlockIndex}
                isBeingDragged={isBeingDragged}
                isSelected={resolved.block.id ? resolved.block.id === selectedBlockId : (resolved.block.type === selectedBlockId)}
                isMultiSelected={resolved.block.id ? Array.isArray(selectedBlockIds) && selectedBlockIds.includes(resolved.block.id) && selectedBlockIds.length > 1 : false}
                isHovered={resolved.block.id ? resolved.block.id === hoveredBlockId : (resolved.block.type === hoveredBlockId)}
                isEditing={resolved.block.id ? resolved.block.id === editingBlockId : (resolved.block.type === editingBlockId)}
                onSelect={onBlockSelect}
                onHover={onBlockHover}
                onEdit={onBlockEdit}
                onDelete={onBlockDelete}
                onMoveUp={onBlockMoveUp}
                onMoveDown={onBlockMoveDown}
                onDuplicate={onBlockDuplicate}
                onDragHandleDown={isCompact && onBlockReorder ? dragHandlers.onDragStart : undefined}
              />
            </MeasuredBlock>
          </div>
        );
      })}

      {/* ══ DROP INDICATOR LINE — shown during canvas drag ════════ */}
      {dropIndicatorInfo && isCompact && (
        <div
          className="absolute left-4 right-4 pointer-events-none"
          style={{
            top: dropIndicatorInfo.y,
            height: dropIndicatorInfo.height,
            zIndex: 999,
          }}
        >
          <div className="w-full h-full rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
        </div>
      )}

      {/* ══ GHOST BADGE — follows cursor during canvas drag ═════ */}
      {ghostInfo && isCompact && (
        <div
          className="absolute pointer-events-none px-2 py-0.5 rounded bg-blue-500/90 text-white text-[9px] font-bold whitespace-nowrap shadow-lg z-[1000]"
          style={{
            left: ghostInfo.x,
            top: ghostInfo.y,
          }}
        >
          ⠿ {ghostInfo.name}
        </div>
      )}

      {/* ══ SCENE NAVIGATOR — for multi-scene pages ══════════════ */}
      {/* Shows prev/next + dots when content overflows into multiple scenes */}
      <SceneNavigator
        currentScene={sceneIndex}
        totalScenes={scenePlan.totalScenes}
        onSceneChange={(idx) => setSceneState(idx, scenePlan.totalScenes)}
        isCompact={isCompact}
        position="bottom"
      />

      {/* ══ MULTI-SCENE INDICATOR — dev info ══════════════════════ */}
      {scenePlan.totalScenes > 1 && isCompact && (
        <div
          className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/80 text-black z-50"
        >
          Scene {sceneIndex + 1}/{scenePlan.totalScenes}
        </div>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════
// BLOCK RENDERER — Dispatches to type-specific renderers via Registry
// ═══════════════════════════════════════════════════════════════════
// The SceneRegistry is the SOLE dispatch mechanism.
// No switch/case fallback — all block types must be registered.
// Editing overlay: data-block-id + click handler + visual selection ring.

export interface BlockRenderProps {
  block: SchemaBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
  /** Compression decision from the layout engine */
  compression?: import('../layout/CompressionEngine').CompressionDecision;
  /** Block index in screen.blocks (for canvas drag-reorder) */
  blockIndex?: number;
  /** Whether this block is currently being drag-reordered on canvas */
  isBeingDragged?: boolean;
  /** Whether this block is selected in the canvas editor */
  isSelected?: boolean;
  /** Whether this block is in multi-select (not the primary selection) */
  isMultiSelected?: boolean;
  /** Whether this block is hovered in the canvas editor */
  isHovered?: boolean;
  /** Whether this block is in inline editing mode */
  isEditing?: boolean;
  /** Callback when this block is clicked (canvas mode) */
  onSelect?: (blockId: string, blockType: string, addToSelection?: boolean) => void;
  /** Callback when this block is hovered (canvas mode) */
  onHover?: (blockId: string | null) => void;
  /** Callback when this block is double-clicked for inline editing */
  onEdit?: (blockId: string, blockType: string) => void;
  /** Callback to delete this block */
  onDelete?: (blockId: string) => void;
  /** Callback to move block up in flow order */
  onMoveUp?: (blockId: string) => void;
  /** Callback to move block down in flow order */
  onMoveDown?: (blockId: string) => void;
  /** Callback to duplicate this block */
  onDuplicate?: (blockId: string) => void;
  /** Callback: drag grip handle pointerdown (initiates canvas drag-reorder) */
  onDragHandleDown?: (e: React.PointerEvent, blockIndex: number) => void;
}

export const SchemaBlockRenderer = React.memo(function SchemaBlockRenderer({ block, mode, tokens, interactive = false, compression, blockIndex, isBeingDragged, isSelected = false, isMultiSelected = false, isHovered = false, isEditing = false, onSelect, onHover, onEdit, onDelete, onMoveUp, onMoveDown, onDuplicate, onDragHandleDown }: BlockRenderProps) {
  const isCompact = mode === 'canvas';
  const blockId = block.id || block.type;

  const { BlockComponent, handlesCompression } = useMemo(() => {
    const definition = SCENE_REGISTRY[block.type];
    return {
      BlockComponent: definition?.renderer ?? null,
      handlesCompression: definition?.capabilities?.handlesCompression ?? false,
    };
  }, [block.type]);

  // Derive block title for compression wrapper header
  const blockTitle = useMemo(() => {
    const b = block as Record<string, unknown>;
    return (b.title as string) || (b.label as string) || block.type;
  }, [block]);

  if (!BlockComponent) {
    return (
      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
        Unregistered block type: <strong>{block.type}</strong>
        <br />
        <span className="text-red-400/60">Register it in SceneRegistry.tsx</span>
      </div>
    );
  }

  // The block renderer output — always wrapped in error boundary + suspense
  const blockContent = (
    <BlockErrorBoundary blockType={block.type} blockId={blockId}>
      <React.Suspense fallback={<div className="p-3 rounded-lg animate-pulse" style={{ background: tokens.subtleBg(0.06) }} />}>
        <BlockComponent block={block} mode={mode} tokens={tokens} interactive={interactive} isCompact={isCompact} isEditing={isEditing} compression={compression} />
      </React.Suspense>
    </BlockErrorBoundary>
  );

  // Wrap in CompressionBoundary for blocks that don't handle compression natively.
  // Blocks with handlesCompression:true manage their own compression via useBlockCompression.
  // Blocks with handlesCompression:false get automatic compression UI via CompressedBlockWrapper.
  const compressedContent = (
    <CompressionBoundary
      handlesCompression={handlesCompression}
      compression={compression}
      title={blockTitle}
      isCompact={isCompact}
    >
      {blockContent}
    </CompressionBoundary>
  );

  if (!isCompact) {
    // Preview/export mode — no selection overlay, but compression still applies
    return compressedContent;
  }

  return (
    <BlockSelectionOverlay
      blockId={blockId}
      blockType={block.type}
      blockIndex={blockIndex}
      isSelected={isSelected}
      isMultiSelected={isMultiSelected}
      isHovered={isHovered}
      isEditing={isEditing}
      isCompact={isCompact}
      isBeingDragged={isBeingDragged}
      onSelect={onSelect ?? NOOP_FN}
      onHover={onHover ?? NOOP_FN}
      onEdit={onEdit ?? NOOP_FN}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onDuplicate={onDuplicate}
      onDragHandleDown={onDragHandleDown}
    >
      {compressedContent}
    </BlockSelectionOverlay>
  );
});
