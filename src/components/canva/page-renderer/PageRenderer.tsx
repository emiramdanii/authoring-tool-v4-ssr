'use client';

import React from 'react';
import type { CanvaPage, CanvaElement } from '../types';
import { PageFrame, type PageFrameMode } from './PageFrame';
import { BlockRenderer, type BlockRendererMode } from './BlockRenderer';
import { SchemaScreenRenderer, TokenResolver, type SchemaRenderMode } from '@/core/renderer/SchemaRenderer';
import type { ScreenSchema } from '@/core/schema/types';
import { ensurePageSchema, validateCanvaPageInvariant } from '@/core/schema/ensure-schema';
import { paletteToTokenOverrides } from '@/core/engine/TemplateAdapter';
import { useCanvaStore } from '@/store/canva-store';
import { getSceneResolution, computeSafeArea, type SceneResolution, type SafeArea } from '@/core/scene/SceneLayoutEngine';

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
}: PageRendererProps) {
  // ═══ DUAL-RENDER INVARIANT (dev mode) ════════════════════════
  // Catch dual-data bug early in development.
  // This is a no-op in production (tree-shaken).
  React.useEffect(() => {
    validateCanvaPageInvariant(page, 'PageRenderer');
  }, [page]);

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

  // ═══ ENSURE PAGE SCHEMA — PURE, no writeback during render ════
  // ensurePageSchema() is now PURE during render — it only READS
  // and returns the schema. Migration writeback is handled at
  // load/hydration time by migrateAllPages() in persistence-slice,
  // NOT during the render cycle.
  //
  // REMOVED: queueMicrotask writeback that caused:
  //   - Rerender cascade (store write → re-render → write → ...)
  //   - Stale schema references
  //   - Layout invalidation loops
  //   - Hydration mismatch
  //
  // If migration is needed, it happens at load time, not render time.
  const adaptedSchema = React.useMemo<ScreenSchema | null>(() => {
    const schema = ensurePageSchema(page);

    // ── DIAGNOSTIC: Log schema blocks for debugging visibility ──
    if (schema && process.env.NODE_ENV !== 'production') {
      console.log(
        '[PageRenderer] SCHEMA BLOCKS:',
        schema.blocks.length,
        schema.blocks.map(b => ({ type: b.type, id: b.id }))
      );
    }

    return schema;
  }, [page.schema, page.templateData, page.pageMode, isTemplate, templateType]);

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

  // ── Canvas drag-reorder handler ──────────────────────────────────
  const reorderSchemaBlocks = useCanvaStore(s => s.reorderSchemaBlocks);
  const handleBlockReorder = React.useCallback((fromIndex: number, toIndex: number) => {
    reorderSchemaBlocks(fromIndex, toIndex);
  }, [reorderSchemaBlocks]);

  // ═══ SCENE ENGINE PROPS ════════════════════════════════════
  // FASE 1C: Pass scene resolution + safe area to SchemaScreenRenderer.
  // This establishes scene engine as the SINGLE layout authority.
  const ratioId = useCanvaStore(s => s.ratioId);
  const sceneResolution = React.useMemo(() => getSceneResolution(ratioId), [ratioId]);
  const navConfig = page.navConfig;
  const isCompact = mode === 'canvas';
  const isCoverPage = page.templateType === 'cover';
  const showNavbar = navConfig?.showNavbar !== false;
  const showTopNav = showNavbar && !isCoverPage;
  const showBottomNav = showNavbar && !isCoverPage;
  const safeArea = React.useMemo(() => computeSafeArea({
    showTopNav,
    showBottomNav,
    isCompact,
    pagePadding: isCoverPage ? 0 : 16,
  }), [showTopNav, showBottomNav, isCompact, isCoverPage]);

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
          onBlockReorder={mode === 'canvas' ? handleBlockReorder : undefined}
          sceneResolution={sceneResolution}
          safeArea={safeArea}
          ratioId={ratioId}
          showTopNav={showTopNav}
          showBottomNav={showBottomNav}
          pageIndex={currentPageIndex}
        />
      )}

      {/* Template without schema data — user-friendly placeholder */}
      {isTemplate && !useSchemaRenderer && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 text-sm">
          <div className="text-2xl mb-2">📄</div>
          <div>Template: {templateType}</div>
          <div className="text-[10px] mt-1">Template ini belum didukung sepenuhnya</div>
        </div>
      )}
    </>
  );

  // v4: Legacy elements overlay for preview/export mode.
  // FIX: Only render elements[] if schema renderer is NOT active.
  // When a page has schema (useSchemaRenderer=true), SchemaScreenRenderer
  // is the single source of truth — elements[] must NOT overlay on top.
  // This prevents the dual-render bug where content appeared twice.
  const extraElements = mode !== 'canvas' && !useSchemaRenderer && page.elements.length > 0 ? (
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
