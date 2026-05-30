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
import { useLearningMediaStore } from '@/store/learning-media-store';
import { getSceneResolution, computeSafeArea, type SceneResolution, type SafeArea } from '@/core/scene/SceneLayoutEngine';
import { inferSceneType } from '@/core/edu/education-scene-types';
import type { SceneType } from '@/core/edu/education-scene-types';
import { isFullPageBlockType } from '@/core/schema/capability-registry';
import { resolveContractStyle, type ContractResolvedStyle } from '@/core/template/contract';
import { GoldenPageRenderer } from '@/core/renderer/GoldenPageRenderer';
import { getScreenAdapter, getScreenConfig } from '@/core/renderer/screens';

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

export type PageRendererMode = 'canvas' | 'preview' | 'export' | 'learn';

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
  /** Whether inline editing is enabled (teacher learning mode) */
  editable?: boolean;
  /** Learning edit context value for providing to screen adapters */
  editContext?: import('@/components/canva/LearningEditContext').LearningEditContextValue | null;
}

// Map PageRendererMode to the sub-component modes
const frameModeMap: Record<PageRendererMode, PageFrameMode> = {
  canvas: 'canvas',
  preview: 'preview',
  export: 'export',
  learn: 'preview',
};

const blockModeMap: Record<PageRendererMode, BlockRendererMode> = {
  canvas: 'canvas',
  preview: 'preview',
  export: 'export',
  learn: 'preview',
};

export const PageRenderer = React.memo(function PageRenderer({
  mode,
  page,
  currentPageIndex,
  totalPages,
  isTemplateSelected = false,
  editable = false,
  editContext = null,
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

  // Educational display mode — controls font sizes for different viewing contexts
  const displayMode = useCanvaStore((s) => s.displayMode);

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
    return ensurePageSchema(page);
  }, [page.schema, page.templateData, page.pageMode, isTemplate, templateType]);

  // Resolve tokens, applying palette overrides for legacy pages
  // ═══ TEMPLATE THEME CONTRACT ENFORCEMENT ══════════════════
  // Resolve the contract for this page and apply it to the TokenResolver.
  // When a contract is active (e.g., golden-pertemuan), its values OVERRIDE
  // all theme/scene/block defaults — enforcing visual consistency across ALL
  // pages in a full pertemuan template.
  //
  // Priority: TemplateThemeContract > Scene Style > Block Default
  const contractStyle = React.useMemo<ContractResolvedStyle | null>(() => {
    // Priority 1: Use page's stored contractId (persists through save/load)
    const cid = page.contractId;
    if (cid) {
      return resolveContractStyle(cid, page.templateType || 'custom', page.templateVariant || 'A');
    }
    // Priority 2: Auto-apply golden contract for known pertemuan page types
    // (fallback for pages created before contractId was added)
    const tt = page.templateType || 'custom';
    const pertemuanPageTypes = ['cover', 'petunjuk', 'dokumen', 'tujuan', 'motivasi', 'materi', 'skenario', 'diskusi', 'kuis', 'game', 'hasil', 'refleksi', 'rangkuman', 'penutup'];
    if (!pertemuanPageTypes.includes(tt)) return null;
    return resolveContractStyle('golden-pertemuan', tt, page.templateVariant || 'A');
  }, [page.contractId, page.templateType, page.templateVariant]);

  const tokens = React.useMemo(() => {
    // If schema has a theme ID, use it (but still apply contract override)
    if (schemaThemeId) {
      const resolver = new TokenResolver(schemaThemeId, displayMode);
      // ═══ CONTRACT ENFORCEMENT — contract WINS even over explicit themeId ═══
      if (contractStyle) resolver.applyContract(contractStyle);
      return resolver;
    }

    // For legacy pages, apply palette color overrides on top of default tokens
    const overrides = paletteToTokenOverrides(page.colorPalette);
    if (!overrides) {
      const resolver = new TokenResolver(undefined, displayMode);
      // ═══ CONTRACT ENFORCEMENT — applied BEFORE first render ═══
      // Apply contract immediately so there's no flash of wrong styles.
      if (contractStyle) resolver.applyContract(contractStyle);
      return resolver;
    }

    // Create TokenResolver with overridden colors
    const resolver = new TokenResolver(undefined, displayMode);
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
    // ═══ CONTRACT ENFORCEMENT — applied AFTER palette, contract WINS ═══
    if (contractStyle) resolver.applyContract(contractStyle);
    return resolver;
  }, [schemaThemeId, page.colorPalette, displayMode, contractStyle]);

  // Decide rendering strategy — unified for ALL template pages
  const useSchemaRenderer = !!adaptedSchema;

  // Map PageRendererMode to SchemaRenderMode
  const schemaModeMap: Record<PageRendererMode, SchemaRenderMode> = {
    canvas: 'canvas',
    preview: 'preview',
    export: 'export',
    learn: 'learn',
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
  // Learn mode select: does NOT call selectBlock (which clears editingBlockId).
  // In learn mode, clicking a block should NOT disrupt the editing flow.
  // Instead, if a block is being edited, clicking another block just stops editing.
  const handleBlockLearnSelect = React.useCallback((blockId: string, blockType: string) => {
    const currentEditing = useCanvaStore.getState().editingBlockId;
    if (currentEditing && currentEditing !== blockId) {
      // Clicking a different block while editing → stop editing (save happens via blur)
      useCanvaStore.getState().stopEditing();
    }
    // Do NOT call selectBlock — it resets editingBlockId and opens right panel
  }, []);
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
  // FIX: Use block-content-based detection (same as SchemaRenderer) instead of
  // just templateType. This ensures consistency: a "cover" page with mixed blocks
  // (cover + flow) gets normal padding, while a pure cover page (single block) gets zero.
  const isPureCoverPage = adaptedSchema
    ? adaptedSchema.blocks.length === 1 && isFullPageBlockType(adaptedSchema.blocks[0]!.type)
    : page.templateType === 'cover';
  const isCoverTemplate = page.templateType === 'cover';
  const showNavbar = navConfig?.showNavbar !== false;
  const showTopNav = showNavbar && !isCoverTemplate;
  const showBottomNav = showNavbar && !isCoverTemplate;
  const safeArea = React.useMemo(() => computeSafeArea({
    showTopNav,
    showBottomNav,
    isCompact,
    pagePadding: isPureCoverPage ? 0 : 16,
  }), [showTopNav, showBottomNav, isCompact, isPureCoverPage]);

  // ═══ SCENE TYPE ════════════════════════════════════════════════
  // Derive the Learning Scene Type from the page's template type.
  // This is the KEY that unlocks the entire scene-aware design system:
  //   - Typography hierarchy per scene (hero/title/body)
  //   - Accent prominence (which colors are "vocal" vs "muted")
  //   - Emotional profile (progress/discovery/reward triggers)
  //   - Reveal strategy (all-visible/progressive/on-interaction)
  //   - Spacing density (intensity-driven rhythm)
  //   - Card/header treatment (elevated/flat/subtle)
  const sceneType = React.useMemo<SceneType | undefined>(() => {
    // Priority 1: Explicit sceneType override on the schema (teacher-set)
    if (adaptedSchema?.sceneType) return adaptedSchema.sceneType;
    // Priority 2: Inferred from templateType
    if (!page.templateType) return undefined;
    return inferSceneType(undefined, page.templateType, undefined);
  }, [adaptedSchema?.sceneType, page.templateType]);

  // ═══ FIX 3: Detect if golden contract is active for this page ═══
  const isGoldenContract = !!contractStyle;

  // Learn mode: pass editing state so blocks can be inline-edited
  // BUT only if learnSubMode === 'edit'. In 'play' mode, no editing at all.
  const isLearnMode = mode === 'learn';
  const learnSubMode = useLearningMediaStore(s => s.learnSubMode);
  const isLearnEditMode = isLearnMode && learnSubMode === 'edit';
  const isLearnPlayMode = isLearnMode && learnSubMode === 'play';

  const schemaContent = useSchemaRenderer && adaptedSchema ? (
    <SchemaScreenRenderer
      screen={adaptedSchema}
      mode={schemaModeMap[mode]}
      tokens={tokens}
      interactive={interactive}
      selectedBlockId={mode === 'canvas' ? selectedBlockId : undefined}
      selectedBlockIds={mode === 'canvas' ? selectedBlockIds : undefined}
      hoveredBlockId={mode === 'canvas' ? hoveredBlockId : undefined}
      editingBlockId={mode === 'canvas' || isLearnEditMode ? editingBlockId : undefined}
      onBlockSelect={mode === 'canvas' ? handleBlockSelect : isLearnEditMode ? handleBlockLearnSelect : undefined}
      onBlockHover={mode === 'canvas' ? handleBlockHover : undefined}
      onBlockEdit={mode === 'canvas' ? handleBlockEdit : isLearnEditMode ? handleBlockEdit : undefined}
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
      sceneType={sceneType}
    />
  ) : null;

  // ═══ SCREEN ADAPTER SYSTEM ═════════════════════════════════
  // In preview/export modes (student-facing), use the screen adapter
  // system instead of raw SchemaScreenRenderer. Each page gets its
  // ScreenAdapter from getScreenAdapter(sceneType), which wraps
  // SchemaScreenRenderer with ScreenShell for consistent chrome.
  // This ensures 1 screen = 1 page with proper structure.
  //
  // In canvas mode (teacher-facing), continue using the raw
  // SchemaScreenRenderer with editing overlay functionality.
  const useScreenAdapter = useSchemaRenderer && adaptedSchema && mode !== 'canvas';

  // Resolve the screen adapter component and config for this page type
  const ScreenAdapter = useScreenAdapter ? getScreenAdapter(templateType) : null;
  const screenConfig = useScreenAdapter ? getScreenConfig(templateType) : null;

  // ═══ SCREEN ADAPTER CONTENT — for preview/export modes ═══════
  const screenAdapterContent = useScreenAdapter && ScreenAdapter && screenConfig && adaptedSchema ? (
    <ScreenAdapter
      page={page}
      schema={adaptedSchema}
      tokens={tokens}
      mode={schemaModeMap[mode]}
      config={screenConfig}
      interactive={interactive}
      sceneResolution={sceneResolution}
      safeArea={safeArea}
      ratioId={ratioId}
      showTopNav={showTopNav}
      showBottomNav={showBottomNav}
      pageIndex={currentPageIndex}
      sceneType={sceneType}
      totalPages={totalPages}
      editable={editable}
      editContext={editContext}
    />
  ) : null;

  const content = (
    <>
      {/* ═══ SCREEN ADAPTER PATH — preview/export mode ══════════════ */}
      {/* When NOT in canvas mode, use the screen adapter system which
          wraps SchemaScreenRenderer with ScreenShell for consistent chrome.
          This enforces 1 screen = 1 page with proper structure. */}
      {useScreenAdapter ? (
        screenAdapterContent
      ) : (
        <>
          {/* ═══ FIX 3: Golden Page Renderer — structural chrome ════════ */}
          {/* When the golden contract is active in canvas mode, wrap the
              schema output with GoldenPageRenderer to add progress bar,
              phase badge, nav dots. Cover pages get NO chrome (full bleed). */}
          {useSchemaRenderer && adaptedSchema && isGoldenContract && contractStyle ? (
            <GoldenPageRenderer
              contractStyle={contractStyle}
              tokens={tokens}
              sceneType={sceneType || 'concept'}
              pageType={templateType}
              pageIndex={currentPageIndex}
              totalPages={totalPages}
              isCoverPage={isPureCoverPage}
            >
              {schemaContent}
            </GoldenPageRenderer>
          ) : (
            schemaContent
          )}
        </>
      )}

      {/* Empty schema page hint — when page has schema but 0 blocks (canvas mode only) */}
      {useSchemaRenderer && adaptedSchema && adaptedSchema.blocks.length === 0 && mode === 'canvas' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: 30 }}>
          <div className="text-center px-6 py-4 rounded-xl bg-app-surface/80 backdrop-blur-sm border border-dashed border-app-accent/20 max-w-[240px]">
            <div className="text-lg mb-1 opacity-60">📝</div>
            <div className="text-[10px] font-medium text-app-primary/70 mb-1">Halaman ini kosong</div>
            <div className="text-[8px] text-app-muted leading-relaxed">Tambah konten dari panel kiri — klik tab Tambah Konten</div>
          </div>
        </div>
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
});
