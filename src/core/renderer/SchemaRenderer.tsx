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

import React, { useCallback } from 'react';
import type { SchemaBlock, ScreenSchema } from '../schema/types';

// Re-export from types.ts for backward compatibility
export type { SchemaRenderMode } from './types';
export { TokenResolver } from './types';
import type { SchemaRenderMode } from './types';
import type { TokenResolver } from './types';

// Import SceneRegistry — the SOLE dispatch mechanism
import { SCENE_REGISTRY, getBlockDefinition } from '../registry/SceneRegistry';

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
  /** Currently hovered block ID (canvas mode only — for hover effects) */
  hoveredBlockId?: string | null;
  /** Currently editing block ID (canvas mode only — inline editing) */
  editingBlockId?: string | null;
  /** Callback when a block is clicked (canvas mode only) */
  onBlockSelect?: (blockId: string, blockType: string) => void;
  /** Callback when a block is hovered (canvas mode only) */
  onBlockHover?: (blockId: string | null) => void;
  /** Callback when a block is double-clicked for inline editing (canvas mode only) */
  onBlockEdit?: (blockId: string, blockType: string) => void;
}

export function SchemaScreenRenderer({ screen, mode, tokens, interactive = false, selectedBlockId, hoveredBlockId, editingBlockId, onBlockSelect, onBlockHover, onBlockEdit }: ScreenRendererProps) {
  const hasCoverBlock = screen.blocks.length === 1 && screen.blocks[0].type === 'cover';

  // ═══ LAYOUT-AWARE BLOCK SPLIT (PRIORITAS 3) ═══════════════════
  // Separate blocks into flow (flexbox) and absolute (positioned).
  // Flow blocks stack vertically in the scrollable content area.
  // Absolute blocks render in an overlay layer with x/y/w/h/zIndex.

  const flowBlocks = screen.blocks.filter(b => !b.layout || b.layout.position === 'flow');
  const absoluteBlocks = screen.blocks.filter(b => b.layout?.position === 'absolute');

  const bgStyle: React.CSSProperties = {};
  if (screen.background && hasCoverBlock) {
    if (screen.background.type === 'radial') {
      bgStyle.background = `radial-gradient(ellipse 90% 60% at 50% 0%, ${tokens.colorAlpha(screen.background.color1 || 'y', 0.18)}, transparent 60%), linear-gradient(180deg, ${tokens.color(screen.background.color2 || 'bg')}, ${tokens.color('bg2')})`;
    } else if (screen.background.type === 'gradient') {
      bgStyle.background = `linear-gradient(180deg, ${tokens.color(screen.background.color1 || 'y')}, ${tokens.color(screen.background.color2 || 'bg')})`;
    }
  }

  return (
    <div className={hasCoverBlock ? 'absolute inset-0' : 'relative flex flex-col h-full'}
      style={{ fontFamily: tokens.fontFamily('body'), color: tokens.color('text'), ...bgStyle }}>
      {screen.sectionLabel && !hasCoverBlock && (
        <div className="px-4 pt-3">
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
      <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar ${hasCoverBlock ? '' : 'px-4 py-5'}`}
        style={hasCoverBlock ? undefined : { maxWidth: 860, margin: '0 auto', width: '100%' }}>
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
              isHovered={block.id ? block.id === hoveredBlockId : (block.type === hoveredBlockId)}
              isEditing={block.id ? block.id === editingBlockId : (block.type === editingBlockId)}
              onSelect={onBlockSelect}
              onHover={onBlockHover}
              onEdit={onBlockEdit}
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
                  isHovered={block.id ? block.id === hoveredBlockId : (block.type === hoveredBlockId)}
                  isEditing={block.id ? block.id === editingBlockId : (block.type === editingBlockId)}
                  onSelect={onBlockSelect}
                  onHover={onBlockHover}
                  onEdit={onBlockEdit}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  /** Whether this block is hovered in the canvas editor */
  isHovered?: boolean;
  /** Whether this block is in inline editing mode */
  isEditing?: boolean;
  /** Callback when this block is clicked (canvas mode) */
  onSelect?: (blockId: string, blockType: string) => void;
  /** Callback when this block is hovered (canvas mode) */
  onHover?: (blockId: string | null) => void;
  /** Callback when this block is double-clicked for inline editing */
  onEdit?: (blockId: string, blockType: string) => void;
}

export function SchemaBlockRenderer({ block, mode, tokens, interactive = false, isSelected = false, isHovered = false, isEditing = false, onSelect, onHover, onEdit }: BlockRenderProps) {
  const isCompact = mode === 'canvas';
  // ═══ STABLE BLOCK ID ═════════════════════════════════════════
  // CRITICAL: The block ID must be stable across re-renders.
  // If block.id is not set (legacy pages), use type as fallback.
  // The edit pipeline (updateSchemaBlock) finds blocks by ID, so
  // unstable IDs = edits lost after re-render = broken editing.
  const blockId = block.id || block.type;

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (mode !== 'canvas' || !onSelect) return;
    e.stopPropagation();
    onSelect(blockId, block.type);
  }, [mode, onSelect, blockId, block.type]);

  const handleMouseEnter = useCallback(() => {
    if (mode !== 'canvas' || !onHover) return;
    onHover(blockId);
  }, [mode, onHover, blockId]);

  const handleMouseLeave = useCallback(() => {
    if (mode !== 'canvas' || !onHover) return;
    onHover(null);
  }, [mode, onHover]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (mode !== 'canvas' || !onEdit) return;
    e.stopPropagation();
    onEdit(blockId, block.type);
  }, [mode, onEdit, blockId, block.type]);

  // ═══ REGISTRY DISPATCH ══════════════════════════════════════
  // SceneRegistry is the SOLE dispatch mechanism.
  // New block types only need to be registered — no code change here.
  const definition = SCENE_REGISTRY[block.type];
  if (definition?.renderer) {
    const BlockComponent = definition.renderer;
    return (
      <div
        data-block-id={blockId}
        data-block-type={block.type}
        className={`relative group ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent rounded-lg' : ''} ${isHovered && !isSelected ? 'ring-1 ring-blue-400/30 ring-offset-1 ring-offset-transparent rounded-lg' : ''} ${isCompact ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
      >
        <BlockComponent block={block} mode={mode} tokens={tokens} interactive={interactive} isCompact={isCompact} isEditing={isEditing} />
        {/* Selection label in canvas mode */}
        {isSelected && isCompact && (
          <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-blue-500 text-[8px] font-bold text-white whitespace-nowrap z-30 pointer-events-none">
            {definition.icon} {definition.name}
          </div>
        )}
        {/* Hover highlight in canvas mode — only when not selected */}
        {!isSelected && isCompact && (
          <div className="absolute inset-0 rounded-lg border border-transparent group-hover:border-blue-400/30 pointer-events-none transition-all" />
        )}
        {/* Editing indicator */}
        {isEditing && isCompact && (
          <div className="absolute -top-5 right-0 px-1.5 py-0.5 rounded bg-emerald-500 text-[8px] font-bold text-white whitespace-nowrap z-30 pointer-events-none">
            Editing
          </div>
        )}
      </div>
    );
  }

  // ═══ UNREGISTERED BLOCK TYPE ════════════════════════════════
  // If a block type is not in the registry, show a warning.
  // This should never happen for production blocks.
  return (
    <div
      data-block-id={blockId}
      data-block-type={block.type}
      className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      Unregistered block type: <strong>{block.type}</strong>
      <br />
      <span className="text-red-400/60">Register it in SceneRegistry.tsx</span>
    </div>
  );
}
