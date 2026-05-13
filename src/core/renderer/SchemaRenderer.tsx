// ═══════════════════════════════════════════════════════════════════
// SCHEMA RENDERER ENGINE — Converts JSON Schema → React UI
// ═══════════════════════════════════════════════════════════════════
// This is the core orchestrator. It reads LessonSchema/ScreenSchema JSON
// and produces visual output using extracted per-block renderers.
//
// Block renderers have been extracted to ./blocks/ for maintainability.
// Dispatch is handled EXCLUSIVELY by SceneRegistry — no switch fallback.
//
// The principle: NEVER store HTML. Store schema. Renderer produces UI.

'use client';

import React, { useCallback, useMemo } from 'react';
import type { SchemaBlock, ScreenSchema } from '../schema/types';

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

// ═══════════════════════════════════════════════════════════════════
// SCREEN RENDERER — Renders a single ScreenSchema
// ═══════════════════════════════════════════════════════════════════

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
}

export const SchemaScreenRenderer = React.memo(function SchemaScreenRenderer({ screen, mode, tokens, interactive = false, selectedBlockId, selectedBlockIds, hoveredBlockId, editingBlockId, onBlockSelect, onBlockHover, onBlockEdit, onBlockDelete, onBlockMoveUp, onBlockMoveDown, onBlockDuplicate }: ScreenRendererProps) {
  const hasCoverBlock = screen.blocks.length === 1 && (screen.blocks[0].type === 'cover' || screen.blocks[0].type === 'hero');

  // ═══ LAYOUT-AWARE BLOCK SPLIT (PRIORITAS 3) ═══════════════════
  // Memoize the block split to avoid re-computing on every render
  const { flowBlocks, absoluteBlocks } = useMemo(() => {
    const flow = screen.blocks.filter(b => !b.layout || b.layout.position === 'flow');
    const absolute = screen.blocks.filter(b => b.layout?.position === 'absolute');
    return { flowBlocks: flow, absoluteBlocks: absolute };
  }, [screen.blocks]);

  // ═══ BACKGROUND STYLE — applies to ALL screen types ═══════════
  // Previously only rendered for cover pages. Now every screen can
  // have a background: solid color, gradient, radial, or image URL.
  const bg = screen.background;
  const bgStyle: React.CSSProperties = {};

  if (bg) {
    // ── Color/gradient background ───────────────────────────────
    if (bg.type === 'radial') {
      bgStyle.background = `radial-gradient(ellipse 90% 60% at 50% 0%, ${tokens.colorAlpha(bg.color1 || 'y', 0.18)}, transparent 60%), linear-gradient(180deg, ${tokens.color(bg.color2 || 'bg')}, ${tokens.color('bg2')})`;
    } else if (bg.type === 'gradient') {
      bgStyle.background = `linear-gradient(180deg, ${tokens.color(bg.color1 || 'y')}, ${tokens.color(bg.color2 || 'bg')})`;
    } else if (bg.type === 'solid') {
      bgStyle.background = tokens.color(bg.color1 || 'bg');
    }
  }

  // If no background defined, default to base bg for non-cover pages
  if (!bg && !hasCoverBlock) {
    bgStyle.background = tokens.color('bg');
  }

  return (
    <div className={hasCoverBlock ? 'absolute inset-0' : 'relative flex flex-col h-full'}
      style={{ fontFamily: tokens.fontFamily('body'), color: tokens.color('text'), ...bgStyle }}>

      {/* ══ BACKGROUND IMAGE LAYER — rendered behind content ════ */}
      {bg?.imageUrl && (
        <>
          <img
            src={bg.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          />
          {/* Dark overlay for text readability on image backgrounds */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 0,
              background: `rgba(0,0,0,${(bg.overlay ?? 30) / 100})`,
            }}
          />
        </>
      )}

      {screen.sectionLabel && !hasCoverBlock && (
        <div className="px-4 pt-3" style={{ position: 'relative', zIndex: 1 }}>
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

      {/* ══ FLOW BLOCKS: vertical stack, scrollable ══════════════ */}
      {/* Flow blocks container — maxWidth scales proportionally for any ratio.
          Using percentage ensures responsive fit across all canvas sizes.
          overflow-y-auto allows scrolling when content exceeds viewport height,
          while overflow-x:hidden prevents horizontal bleed. */}
      <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar ${hasCoverBlock ? '' : 'px-4 py-4'}`}
        style={{ ...(hasCoverBlock ? {} : { maxWidth: '95%', margin: '0 auto', width: '100%' }), position: 'relative', zIndex: 1, wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
        {flowBlocks.map((block, i) => {
          const blockKey = block.id || `flow-${block.type}-${i}`;
          return (
            <SchemaBlockRenderer
              key={blockKey}
              block={block}
              mode={mode}
              tokens={tokens}
              interactive={interactive}
              isSelected={block.id ? block.id === selectedBlockId : (block.type === selectedBlockId)}
              isMultiSelected={block.id ? (selectedBlockIds ?? []).includes(block.id) && (selectedBlockIds ?? []).length > 1 : false}
              isHovered={block.id ? block.id === hoveredBlockId : (block.type === hoveredBlockId)}
              isEditing={block.id ? block.id === editingBlockId : (block.type === editingBlockId)}
              onSelect={onBlockSelect}
              onHover={onBlockHover}
              onEdit={onBlockEdit}
              onDelete={onBlockDelete}
              onMoveUp={onBlockMoveUp}
              onMoveDown={onBlockMoveDown}
              onDuplicate={onBlockDuplicate}
            />
          );
        })}
      </div>

      {/* ══ ABSOLUTE BLOCKS: positioned overlay layer ════════════ */}
      {absoluteBlocks.length > 0 && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          {absoluteBlocks.map((block, i) => {
            const layout = block.layout!;
            const absStyle: React.CSSProperties = {
              position: 'absolute',
              pointerEvents: block.interactive ? 'auto' : 'none',
              left: layout.x != null ? `${layout.x}%` : undefined,
              top: layout.y != null ? `${layout.y}%` : undefined,
              width: layout.width != null && layout.width !== 'auto' ? `${layout.width}%` : layout.width === 'auto' ? undefined : undefined,
              height: layout.height != null && layout.height !== 'auto' ? `${layout.height}%` : layout.height === 'auto' ? undefined : undefined,
              zIndex: layout.zIndex,
              transform: layout.rotation ? `rotate(${layout.rotation}deg)` : undefined,
            };
            const blockKey = block.id || `abs-${block.type}-${i}`;
            return (
              <div key={blockKey} style={absStyle}>
                <SchemaBlockRenderer
                  block={block}
                  mode={mode}
                  tokens={tokens}
                  interactive={interactive}
                  isSelected={block.id ? block.id === selectedBlockId : (block.type === selectedBlockId)}
                  isMultiSelected={block.id ? (selectedBlockIds ?? []).includes(block.id) && (selectedBlockIds ?? []).length > 1 : false}
                  isHovered={block.id ? block.id === hoveredBlockId : (block.type === hoveredBlockId)}
                  isEditing={block.id ? block.id === editingBlockId : (block.type === editingBlockId)}
                  onSelect={onBlockSelect}
                  onHover={onBlockHover}
                  onEdit={onBlockEdit}
                  onDelete={onBlockDelete}
                  onMoveUp={onBlockMoveUp}
                  onMoveDown={onBlockMoveDown}
                  onDuplicate={onBlockDuplicate}
                />
              </div>
            );
          })}
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
}

export const SchemaBlockRenderer = React.memo(function SchemaBlockRenderer({ block, mode, tokens, interactive = false, isSelected = false, isMultiSelected = false, isHovered = false, isEditing = false, onSelect, onHover, onEdit, onDelete, onMoveUp, onMoveDown, onDuplicate }: BlockRenderProps) {
  const isCompact = mode === 'canvas';
  // ═══ STABLE BLOCK ID ═════════════════════════════════════════
  // CRITICAL: The block ID must be stable across re-renders.
  // If block.id is not set (legacy pages), use type as fallback.
  // The edit pipeline (updateSchemaBlock) finds blocks by ID, so
  // unstable IDs = edits lost after re-render = broken editing.
  const blockId = block.id || block.type;

  // ═══ REGISTRY DISPATCH ══════════════════════════════════════
  // SceneRegistry is the SOLE dispatch mechanism.
  // New block types only need to be registered — no code change here.
  // Memoize the definition lookup to avoid repeated object access.
  const BlockComponent = useMemo(() => {
    const definition = SCENE_REGISTRY[block.type];
    return definition?.renderer ?? null;
  }, [block.type]);

  // Unregistered block type — show warning
  if (!BlockComponent) {
    return (
      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
        Unregistered block type: <strong>{block.type}</strong>
        <br />
        <span className="text-red-400/60">Register it in SceneRegistry.tsx</span>
      </div>
    );
  }

  // In non-canvas mode, render without overlay (pure rendering)
  if (!isCompact) {
    return (
      <BlockErrorBoundary blockType={block.type} blockId={blockId}>
        <React.Suspense fallback={<div className="p-3 rounded-lg animate-pulse" style={{ background: tokens.subtleBg(0.06) }} />}>
          <BlockComponent block={block} mode={mode} tokens={tokens} interactive={interactive} isCompact={false} isEditing={false} />
        </React.Suspense>
      </BlockErrorBoundary>
    );
  }

  // In canvas mode, wrap with BlockSelectionOverlay for editing interaction
  return (
    <BlockSelectionOverlay
      blockId={blockId}
      blockType={block.type}
      isSelected={isSelected}
      isMultiSelected={isMultiSelected}
      isHovered={isHovered}
      isEditing={isEditing}
      isCompact={isCompact}
      onSelect={onSelect ?? (() => {})}
      onHover={onHover ?? (() => {})}
      onEdit={onEdit ?? (() => {})}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onDuplicate={onDuplicate}
    >
      <BlockErrorBoundary blockType={block.type} blockId={blockId}>
        <React.Suspense fallback={<div className="p-3 rounded-lg animate-pulse" style={{ background: tokens.subtleBg(0.06) }} />}>
          <BlockComponent block={block} mode={mode} tokens={tokens} interactive={interactive} isCompact={isCompact} isEditing={isEditing} />
        </React.Suspense>
      </BlockErrorBoundary>
    </BlockSelectionOverlay>
  );
});
