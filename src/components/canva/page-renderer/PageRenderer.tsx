'use client';

import React from 'react';
import type { CanvaPage, CanvaElement } from '../types';
import { PageFrame, type PageFrameMode } from './PageFrame';
import { BlockRenderer, type BlockRendererMode } from './BlockRenderer';
import { SchemaScreenRenderer, TokenResolver, type SchemaRenderMode } from '@/core/renderer/SchemaRenderer';
import type { ScreenSchema } from '@/core/schema/types';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { paletteToTokenOverrides } from '@/core/engine/TemplateAdapter';
import { useCanvaStore } from '@/store/canva-store';

// ═══════════════════════════════════════════════════════════════
// PAGE RENDERER — Unified page renderer for all contexts
//
// SINGLE RENDERING PIPELINE:
//   ALL template pages go through SchemaScreenRenderer.
//   Legacy pages are converted to ScreenSchema via TemplateAdapter.
//
// Usage:
//   <PageRenderer mode="canvas" page={page} currentPageIndex={0} totalPages={5} />
//   <PageRenderer mode="preview" page={page} currentPageIndex={0} totalPages={5} />
//   <PageRenderer mode="export" page={page} currentPageIndex={0} totalPages={5} />
// ═══════════════════════════════════════════════════════════════

export type PageRendererMode = 'canvas' | 'preview' | 'export';

export interface PageRendererProps {
  /** Which render context */
  mode: PageRendererMode;
  /** The page data to render */
  page: CanvaPage;
  /** Current page index (0-based) */
  currentPageIndex: number;
  /** Total pages */
  totalPages: number;
  /** Whether template is selected in canvas (for editable fields) */
  isTemplateSelected?: boolean;
  /** Edit field callback (canvas mode only) */
  onEditField?: (key: string, value: string) => void;
}

// Map PageRendererMode to the sub-component modes
const frameModeMap: Record<PageRendererMode, PageFrameMode> = {
  canvas: 'canvas',
  preview: 'preview',
  export: 'export',
};

const blockModeMap: Record<PageRendererMode, BlockRendererMode> = {
  canvas: 'canvas',
  preview: 'preview',
  export: 'export',
};

export function PageRenderer({
  mode,
  page,
  currentPageIndex,
  totalPages,
  isTemplateSelected = false,
  onEditField,
}: PageRendererProps) {
  const templateType = page.templateType || 'custom';
  const isTemplate = templateType !== 'custom';

  // In canvas mode, templates show design preview (NOT interactive)
  // In preview/export mode, templates are interactive (playable with score tracking)
  const interactive = mode !== 'canvas';

  // Canvas mode: isSelected enables editable fields
  const isSelected = mode === 'canvas' && isTemplateSelected;

  // ═══ SCHEMA-FIRST RENDERING PIPELINE ══════════════════════
  // FASE 1: Schema as Canonical State
  // Priority: page.schema > templateData.schemaScreen > TemplateAdapter
  // ensurePageSchema() handles lazy migration automatically.
  // After migration, page.schema is the single source of truth.

  // FASE 3: Read theme ID from page.schema (not templateData)
  // templateData.schemaThemeId is the legacy path — schema is now canonical
  const schemaThemeId = page.schema?.background?.type
    ? undefined // Schema pages use token system, not theme IDs
    : (page.templateData?.schemaThemeId as string | undefined);

  // Use ensurePageSchema() — the schema-first gateway
  // This lazily migrates legacy pages on first read.
  // After save, migrated pages become native schema pages.
  const adaptedSchema = React.useMemo<ScreenSchema | null>(() => {
    // Schema-first: page.schema is the canonical source
    const schema = ensurePageSchema(page);
    if (schema) return schema;
    // Custom pages have no schema — return null
    return null;
  }, [page.schema, page.templateData, isTemplate, templateType, page]);

  // Resolve tokens, applying palette overrides for legacy pages
  const tokens = React.useMemo(() => {
    // If schema has a theme ID, use it
    if (schemaThemeId) return new TokenResolver(schemaThemeId);

    // For legacy pages, apply palette color overrides on top of default tokens
    const overrides = paletteToTokenOverrides(page.colorPalette);
    if (!overrides) return new TokenResolver();

    // Create TokenResolver with overridden colors
    const resolver = new TokenResolver();
    // Patch the token colors with palette overrides
    const raw = resolver.raw;
    (raw.colors as Record<string, string>)[
      'y'
    ] = overrides.y || raw.colors.y;
    (raw.colors as Record<string, string>)[
      'c'
    ] = overrides.c || raw.colors.c;
    (raw.colors as Record<string, string>)[
      'g'
    ] = overrides.g || raw.colors.g;
    (raw.colors as Record<string, string>)[
      'r'
    ] = overrides.r || raw.colors.r;
    if (overrides.bg) (raw.colors as Record<string, string>)['bg'] = overrides.bg;
    if (overrides.card) (raw.colors as Record<string, string>)['card'] = overrides.card;
    return resolver;
  }, [schemaThemeId, page.colorPalette]);

  // Decide rendering strategy — unified for ALL template pages
  const useSchemaRenderer = !!adaptedSchema;

  // Map PageRendererMode to SchemaRenderMode
  const schemaModeMap: Record<PageRendererMode, SchemaRenderMode> = {
    canvas: 'canvas',
    preview: 'preview',
    export: 'export',
  };

  // Block selection handler for canvas editing overlay
  const selectBlock = useCanvaStore(s => s.selectBlock);
  const hoverBlock = useCanvaStore(s => s.hoverBlock);
  const startEditing = useCanvaStore(s => s.startEditing);
  const deleteBlock = useCanvaStore(s => s.deleteBlock);
  const moveBlockUp = useCanvaStore(s => s.moveBlockUp);
  const moveBlockDown = useCanvaStore(s => s.moveBlockDown);
  const duplicateBlock = useCanvaStore(s => s.duplicateBlock);
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const selectedBlockIds = useCanvaStore(s => s.selectedBlockIds);
  const hoveredBlockId = useCanvaStore(s => s.hoveredBlockId);
  const editingBlockId = useCanvaStore(s => s.editingBlockId);
  const handleBlockSelect = React.useCallback((blockId: string, blockType: string, addToSelection?: boolean) => {
    selectBlock(blockId, blockType, addToSelection);
  }, [selectBlock]);
  const handleBlockHover = React.useCallback((blockId: string | null) => {
    hoverBlock(blockId);
  }, [hoverBlock]);
  const handleBlockEdit = React.useCallback((blockId: string, blockType: string) => {
    startEditing(blockId);
  }, [startEditing]);
  const handleBlockDelete = React.useCallback((blockId: string) => {
    deleteBlock(blockId);
  }, [deleteBlock]);
  const handleBlockMoveUp = React.useCallback((blockId: string) => {
    moveBlockUp(blockId);
  }, [moveBlockUp]);
  const handleBlockMoveDown = React.useCallback((blockId: string) => {
    moveBlockDown(blockId);
  }, [moveBlockDown]);
  const handleBlockDuplicate = React.useCallback((blockId: string) => {
    duplicateBlock(blockId);
  }, [duplicateBlock]);

  const content = (
    <>
      {/* Schema-driven rendering for ALL template pages */}
      {useSchemaRenderer && adaptedSchema && (
        <SchemaScreenRenderer
          screen={adaptedSchema}
          mode={schemaModeMap[mode]}
          tokens={tokens}
          interactive={interactive}
          selectedBlockId={mode === 'canvas' ? selectedBlockId : undefined}
          selectedBlockIds={mode === 'canvas' ? selectedBlockIds : undefined}
          hoveredBlockId={mode === 'canvas' ? hoveredBlockId : undefined}
          editingBlockId={mode === 'canvas' ? editingBlockId : undefined}
          onBlockSelect={mode === 'canvas' ? handleBlockSelect : undefined}
          onBlockHover={mode === 'canvas' ? handleBlockHover : undefined}
          onBlockEdit={mode === 'canvas' ? handleBlockEdit : undefined}
          onBlockDelete={mode === 'canvas' ? handleBlockDelete : undefined}
          onBlockMoveUp={mode === 'canvas' ? handleBlockMoveUp : undefined}
          onBlockMoveDown={mode === 'canvas' ? handleBlockMoveDown : undefined}
          onBlockDuplicate={mode === 'canvas' ? handleBlockDuplicate : undefined}
        />
      )}

      {/* Template without schema data — minimal placeholder */}
      {isTemplate && !useSchemaRenderer && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 text-sm">
          <div className="text-2xl mb-2">📄</div>
          <div>Template: {templateType}</div>
          <div className="text-[10px] mt-1">Schema adapter needed</div>
        </div>
      )}
    </>
  );

  // v4: All elements render on top for preview/export mode
  // (overlayElements was merged into elements[] on load — no separate overlay layer)
  const extraElements = mode !== 'canvas' && page.elements.length > 0 ? (
    <div className="absolute inset-0" style={{ zIndex: 20 }}>
      {page.elements.filter(el => !el.hidden).map(el => (
        <BlockRenderer
          key={el.id}
          element={el}
          mode={blockModeMap[mode]}
          pageIndex={currentPageIndex}
          interactive={interactive}
          compact={false}
        />
      ))}
      {/* Empty state for custom pages */}
      {!isTemplate && page.elements.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-app-secondary text-sm mb-2">
            Halaman kosong
          </div>
        </div>
      )}
    </div>
  ) : undefined;

  return (
    <PageFrame
      mode={frameModeMap[mode]}
      page={page}
      currentPageIndex={currentPageIndex}
      totalPages={totalPages}
      isSchemaDriven={useSchemaRenderer}
      extraElements={extraElements}
      tokens={tokens}
    >
      {content}
    </PageFrame>
  );
}
