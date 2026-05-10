// ═══════════════════════════════════════════════════════════════════
// SCHEMA RENDERER ENGINE — Converts JSON Schema → React UI
// ═══════════════════════════════════════════════════════════════════
// This is the core orchestrator. It reads LessonSchema/ScreenSchema JSON
// and produces visual output using extracted per-block renderers.
//
// Block renderers have been extracted to ./blocks/ for maintainability.
// This file only contains:
//   - Re-exports (TokenResolver, SchemaRenderMode) from ./types
//   - SchemaScreenRenderer (screen-level layout)
//   - SchemaBlockRenderer (dispatcher → registry or switch fallback)
//
// The principle: NEVER store HTML. Store schema. Renderer produces UI.

'use client';

import React from 'react';
import type { SchemaBlock, ScreenSchema, LessonSchema } from '../schema/types';

// Re-export from types.ts for backward compatibility
export type { SchemaRenderMode } from './types';
export { TokenResolver } from './types';
import type { SchemaRenderMode } from './types';
import type { TokenResolver } from './types';

// Import SceneRegistry for primary dispatch (PRIORITAS 2: ACTIVE)
import { SCENE_REGISTRY } from '../registry/SceneRegistry';

// Import extracted block renderers for switch fallback (dead-code safety net)
import {
  CoverRenderer,
  PetunjukRenderer,
  TpRenderer,
  AlurRenderer,
  SkenarioRenderer,
  DefBoxRenderer,
  NcGridRenderer,
  FlashcardRenderer,
  FtabRenderer,
  NormaKartuRenderer,
  DiskusiRenderer,
  KuisRenderer,
  SortirGameRenderer,
  RodaGameRenderer,
  HasilRenderer,
  RefleksiRenderer,
  PenutupRenderer,
  TabelAccordionRenderer,
} from './blocks';

// Import block types for type casting in switch fallback
import type {
  CoverBlock,
  PetunjukBlock,
  TpBlock,
  AlurBlock,
  SkenarioBlock,
  DefBoxBlock,
  NcGridBlock,
  FlashcardSetBlock,
  FtabBlock,
  NormaKartuBlock,
  DiskusiBlock,
  KuisBlock,
  SortirGameBlock,
  RodaGameBlock,
  HasilBlock,
  RefleksiBlock,
  PenutupBlock,
  TabelAccordionBlock,
} from '../schema/types';

// Keep SchemaRendererProps for legacy compat
export interface SchemaRendererProps {
  schema: LessonSchema;
  screenIndex: number;
  mode: SchemaRenderMode;
  themeOverride?: string;
  interactive?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN RENDERER — Renders a single ScreenSchema
// ═══════════════════════════════════════════════════════════════════

export interface ScreenRendererProps {
  screen: ScreenSchema;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
}

export function SchemaScreenRenderer({ screen, mode, tokens, interactive = false }: ScreenRendererProps) {
  const isCompact = mode === 'canvas';
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
        {flowBlocks.map((block, i) => (
          <SchemaBlockRenderer
            key={block.id || `flow-${i}`}
            block={block}
            mode={mode}
            tokens={tokens}
            interactive={interactive}
          />
        ))}
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
            return (
              <div key={block.id || `abs-${i}`} style={absStyle}>
                <SchemaBlockRenderer
                  block={block}
                  mode={mode}
                  tokens={tokens}
                  interactive={interactive}
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
// BLOCK RENDERER — Dispatches to type-specific renderers
// ═══════════════════════════════════════════════════════════════════

export interface BlockRenderProps {
  block: SchemaBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
}

export function SchemaBlockRenderer({ block, mode, tokens, interactive = false }: BlockRenderProps) {
  const isCompact = mode === 'canvas';

  // ═══ REGISTRY-FIRST DISPATCH (PRIORITAS 2: ACTIVE) ══════════
  // SceneRegistry is now the PRIMARY dispatch mechanism.
  // New block types only need to be registered — no switch edit needed.
  // The switch below is a DEAD-CODE safety net (only fires for unregistered types).
  const definition = SCENE_REGISTRY[block.type];
  if (definition?.renderer) {
    const BlockComponent = definition.renderer;
    return <BlockComponent block={block} mode={mode} tokens={tokens} interactive={interactive} isCompact={isCompact} />;
  }

  // ═══ DEAD-CODE SAFETY NET ═══════════════════════════════════
  // Only fires if a block type is NOT in SCENE_REGISTRY.
  // All 18 standard block types are registered, so this should
  // never be reached. Keeping it as a defensive fallback.
  switch (block.type) {
    case 'cover':
      return <CoverRenderer block={block as CoverBlock} tokens={tokens} interactive={interactive} />;
    case 'petunjuk':
      return <PetunjukRenderer block={block as PetunjukBlock} tokens={tokens} isCompact={isCompact} />;
    case 'tp':
      return <TpRenderer block={block as TpBlock} tokens={tokens} isCompact={isCompact} />;
    case 'alur':
      return <AlurRenderer block={block as AlurBlock} tokens={tokens} isCompact={isCompact} />;
    case 'skenario':
      return <SkenarioRenderer block={block as SkenarioBlock} tokens={tokens} interactive={interactive} />;
    case 'def-box':
      return <DefBoxRenderer block={block as DefBoxBlock} tokens={tokens} isCompact={isCompact} />;
    case 'nc-grid':
      return <NcGridRenderer block={block as NcGridBlock} tokens={tokens} isCompact={isCompact} />;
    case 'flashcard-set':
      return <FlashcardRenderer block={block as FlashcardSetBlock} tokens={tokens} isCompact={isCompact} />;
    case 'ftab':
      return <FtabRenderer block={block as FtabBlock} mode={mode} tokens={tokens} />;
    case 'nk-card':
      return <NormaKartuRenderer block={block as NormaKartuBlock} tokens={tokens} isCompact={isCompact} />;
    case 'diskusi':
      return <DiskusiRenderer block={block as DiskusiBlock} tokens={tokens} interactive={interactive} isCompact={isCompact} />;
    case 'kuis':
      return <KuisRenderer block={block as KuisBlock} tokens={tokens} interactive={interactive} isCompact={isCompact} />;
    case 'sortir-game':
      return <SortirGameRenderer block={block as SortirGameBlock} tokens={tokens} interactive={interactive} isCompact={isCompact} />;
    case 'roda-game':
      return <RodaGameRenderer block={block as RodaGameBlock} tokens={tokens} interactive={interactive} isCompact={isCompact} />;
    case 'hasil':
      return <HasilRenderer block={block as HasilBlock} tokens={tokens} />;
    case 'refleksi':
      return <RefleksiRenderer block={block as RefleksiBlock} tokens={tokens} interactive={interactive} isCompact={isCompact} />;
    case 'penutup':
      return <PenutupRenderer block={block as PenutupBlock} tokens={tokens} isCompact={isCompact} />;
    case 'tabel-accord':
      return <TabelAccordionRenderer block={block as TabelAccordionBlock} tokens={tokens} isCompact={isCompact} />;
    default:
      return null;
  }
}
