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
// Sprint 8.2A — Style Consumer Wiring
// Canvas resolves page-level tokens through the shared Style Contract
// helper. The legacy TokenResolver continues to be used by block
// renderers (frozen boundary), but page-level concerns (background,
// overlay, navbar style, page accent) now flow through ResolvedStyleTokens.
//
// Sprint 8.2A-Patch (Senior Review):
//   P0-1 — applyResolvedStyleTokensToTokenResolver() bridges Style
//          Contract values into the TokenResolver so block renderers
//          see the chosen preset's colors / typography / spacing.
//   P0-2 — Auto-golden fallback now gated on `source === 'legacy-theme'`
//          AND shouldUseGoldenLegacyFallback(). Fresh new-preset
//          projects (mission-adventure, etc.) are no longer silently
//          overridden by Golden Pertemuan.
//   P0-3 — Schema-page background merged from resolved tokens before
//          passing to SchemaScreenRenderer (single authority).
import {
  resolvePageStyleTokens,
  type ResolvePageStyleTokensResult,
  applyResolvedStyleTokensToTokenResolver,
  type PageStyleSource,
} from '@/core/style';
import type { ResolvedBackground } from '@/core/style';

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
  /**
   * Sprint 8.2A — Optional pre-resolved page style tokens.
   *
   * When omitted, PageRenderer resolves them itself via
   * `resolvePageStyleTokens(page)`. Callers that already have the
   * resolved tokens (e.g. parity tests, future Present/Export wiring)
   * may pass them in to avoid double resolution.
   *
   * Canvas and Preview both produce these tokens through the SAME
   * helper — see `src/core/style/consumer.ts`. This guarantees
   * token parity between the two consumers.
   */
  pageStyleTokens?: ResolvePageStyleTokensResult;
}

// Map PageRendererMode to the sub-component modes
const frameModeMap: Record<PageRendererMode, PageFrameMode> = {
  canvas: 'canvas',
  preview: 'preview',
  export: 'export',
  learn: 'learn',  // Sprint 4: was 'preview' — now 'learn' so PageFrame can distinguish
};

// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2A-Patch — Golden legacy fallback gate (P0-2)
// ═══════════════════════════════════════════════════════════════════
// Before the patch, PageRenderer auto-applied the 'golden-pertemuan'
// contract to almost every pertemuan pageType. That silently overrode
// fresh projects created with the new preset picker (e.g. a page with
// themeId='mission-adventure' ended up rendering with Golden
// Pertemuan's gold accent instead of mission-adventure's earth tones).
//
// The fix: auto-golden is now gated on three conditions:
//   1. page.contractId is empty (explicit contract still wins)
//   2. pageStyleTokens.source === 'legacy-theme' (fresh 'new-preset'
//      pages are no longer auto-golden'd)
//   3. shouldUseGoldenLegacyFallback(legacyThemeId) — only legacy
//      themes that HISTORICALLY paired with the golden contract get
//      the fallback. Other legacy themes (neon, glass, warm-light,
//      colorful, ios-light, ios-warm, minimal, ocean-light) have
//      their own visual identity mapped to non-academic-clean presets
//      and never used the golden contract.
//
// The PPKn domain themes (hakikat-norma, macam-norma, etc.) all
// mapped to academic-clean which has `_legacyContractId='golden-pertemuan'`.
// Historically these were rendered WITH the golden contract because
// they shared the same default visual identity. We preserve that
// behavior for visual continuity on legacy projects.
const GOLDEN_LEGACY_THEMES = new Set<string>([
  'golden-presentation',
  'default',
  // PPKn domain themes — historically paired with golden contract
  // via academic-clean preset bridge.
  'hakikat-norma',
  'macam-norma',
  'nilai-pancasila',
  'bhinneka-tunggal-ika',
  'ham-hak-kewajiban',
  'demokrasi-pancasila',
  'globalisasi',
]);

function shouldUseGoldenLegacyFallback(legacyThemeId: string | undefined): boolean {
  return !!legacyThemeId && GOLDEN_LEGACY_THEMES.has(legacyThemeId);
}

/**
 * Merge a ResolvedBackground into a ScreenSchema.background shape.
 * Used by PageRenderer to feed resolved tokens into SchemaScreenRenderer
 * WITHOUT mutating page.schema (shallow clone).
 *
 * The merge is field-by-field: each resolved field overrides the
 * schema's field when present. Schema fields are kept as fallback
 * for any field the resolver didn't populate.
 */
function mergeResolvedBackgroundIntoSchema(
  schemaBg: ScreenSchema['background'],
  resolved: ResolvedBackground,
): NonNullable<ScreenSchema['background']> {
  const base = schemaBg ?? { type: 'solid' as const };
  return {
    type: (resolved.type || base.type) as 'solid' | 'gradient' | 'radial',
    color1: resolved.color1 || base.color1,
    color2: resolved.color2 || base.color2,
    imageUrl: resolved.imageUrl || base.imageUrl,
    overlay: typeof resolved.overlay === 'number' ? resolved.overlay : base.overlay,
    overlayType: resolved.overlayType || base.overlayType,
    imageFit: resolved.imageFit || base.imageFit,
    imageOpacity: typeof resolved.imageOpacity === 'number' ? resolved.imageOpacity : base.imageOpacity,
    imageBlur: typeof resolved.imageBlur === 'number' ? resolved.imageBlur : base.imageBlur,
  };
}

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
  pageStyleTokens: pageStyleTokensProp,
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

  // ═══ Sprint 8.2A — Page Style Tokens (Canvas + Preview parity) ═══
  // Resolve page-level style tokens through the shared helper. Both
  // Canvas and Preview call resolvePageStyleTokens() — the parity
  // test enforces that no consumer implements its own resolution.
  //
  // These tokens carry:
  //   - colors (background, surface, text, accent, border, ...)
  //   - typography (heading/body family + scale)
  //   - shape (radius, borderWidth, shadow)
  //   - spacing (density → pagePadding/cardPadding/blockGap)
  //   - navigation.style ('colorful'|'minimal'|'glass')
  //   - page.background (color1/color2/imageUrl/overlay/overlayType/...)
  //   - block (presetId/variant/emphasis/accent)
  //   - _legacyThemeId (for Sprint 8.2B branch on original identity)
  //
  // Priority: page.contractId (authority) → legacyThemeId → preset.
  // When page.contractId is set, the TemplateThemeContract pipeline
  // (contractStyle below) REMAINS the authority for visual enforcement.
  // The ResolvedStyleTokens are still consulted for background image
  // layer, overlay, and navbar style — fields the contract doesn't
  // override.
  const pageStyleTokens = React.useMemo<ResolvePageStyleTokensResult>(
    () => pageStyleTokensProp ?? resolvePageStyleTokens(page),
    [page, pageStyleTokensProp],
  );

  // Educational display mode — controls font sizes for different viewing contexts
  const displayMode = useCanvaStore((s) => s.displayMode);

  // ═══ ENSURE PAGE SCHEMA — PURE, no writeback during render ════
  // ensurePageSchema() is now PURE during render — it only READS
  // and returns the schema. Migration writeback is handled at
  // load/hydration time by migrateAllPages() in persistence-slice,
  // NOT during the render cycle.
  //
  // Sprint 8.2A-Patch P0-3: merge resolved background into the schema
  // (shallow clone — page.schema is NOT mutated). This makes
  // SchemaScreenRenderer read from a SINGLE authority (the resolved
  // Style Contract tokens) instead of from a parallel screen.background
  // that could disagree with the chosen preset.
  const adaptedSchema = React.useMemo<ScreenSchema | null>(() => {
    const base = ensurePageSchema(page);
    if (!base) return null;

    // Merge resolved background into the schema's background.
    // The resolver produces a fully-normalized background that
    // already incorporates the preset's default color when the page
    // doesn't set one. SchemaScreenRenderer will read this merged
    // background instead of falling back to its own defaults.
    const resolvedBg = pageStyleTokens.tokens.page.background;
    if (!resolvedBg) return base;

    return {
      ...base,
      background: mergeResolvedBackgroundIntoSchema(base.background, resolvedBg),
    };
  }, [page.schema, page.templateData, page.pageMode, isTemplate, templateType, pageStyleTokens]);

  // ═══ Sprint 8.2A-Patch P0-2 — Auto-golden fallback gate ═════════
  // Before the patch, this block auto-applied 'golden-pertemuan' to
  // almost every pertemuan pageType — silently overriding fresh
  // new-preset projects. Now it's gated:
  //   1. page.contractId empty (explicit contract still wins)
  //   2. source === 'legacy-theme' (fresh new-preset no longer overridden)
  //   3. shouldUseGoldenLegacyFallback(legacyThemeId) (only themes that
  //      historically paired with golden)
  //
  // Priority: TemplateThemeContract > Scene Style > Block Default
  const contractStyle = React.useMemo<ContractResolvedStyle | null>(() => {
    // Priority 1: Use page's stored contractId (persists through save/load)
    const cid = page.contractId;
    if (cid) {
      return resolveContractStyle(cid, page.templateType || 'custom', page.templateVariant || 'A');
    }

    // P0-2: Only apply golden auto-fallback for legacy-theme pages that
    // historically used the golden contract. Fresh new-preset pages
    // must NOT be silently overridden.
    if (pageStyleTokens.source !== 'legacy-theme') return null;
    if (!shouldUseGoldenLegacyFallback(pageStyleTokens.legacyThemeId)) return null;

    const tt = page.templateType || 'custom';
    const pertemuanPageTypes = ['cover', 'petunjuk', 'dokumen', 'tujuan', 'motivasi', 'materi', 'skenario', 'diskusi', 'kuis', 'game', 'hasil', 'refleksi', 'rangkuman', 'penutup'];
    if (!pertemuanPageTypes.includes(tt)) return null;
    return resolveContractStyle('golden-pertemuan', tt, page.templateVariant || 'A');
  }, [page.contractId, page.templateType, page.templateVariant, pageStyleTokens.source, pageStyleTokens.legacyThemeId]);

  // ═══ Sprint 8.2A-Patch P0-1 — Token resolver bridge ═════════════
  // Construct the base TokenResolver using the Style Contract's chosen
  // presetId as the themeId (so legacy theme defaults match the
  // resolved preset). Then bridge ResolvedStyleTokens into the
  // resolver so block renderers see Style Contract values. Finally
  // apply the explicit TemplateThemeContract LAST so it wins for
  // fields it overrides.
  //
  // Bridge order (Senior Review P0-1):
  //   1. base legacy TokenResolver
  //   2. applyResolvedStyleTokensToTokenResolver(resolver, tokens)
  //   3. resolver.applyContract(contractStyle) — explicit contract wins
  const tokens = React.useMemo(() => {
    // Use the Style Contract's presetId as the themeId for the base
    // resolver. When the page has a real legacy schemaThemeId that
    // differs from the presetId, we prefer the legacy id so theme-
    // specific token defaults still load (the bridge will then patch
    // Style Contract values on top).
    const legacyThemeId = pageStyleTokens.legacyThemeId;
    const schemaThemeId = page.schema?.themeId || (page.templateData?.schemaThemeId as string | undefined);
    const baseThemeId = legacyThemeId ?? schemaThemeId ?? pageStyleTokens.presetId;

    // For legacy pages, apply palette color overrides on top of default tokens
    const overrides = paletteToTokenOverrides(page.colorPalette);
    const resolver = new TokenResolver(baseThemeId, displayMode);

    // ── P0-1 bridge: patch Style Contract values into the resolver ──
    // This MUST happen BEFORE applyContract so the contract's overrides
    // win for fields it patches (accent token map, page/card padding,
    // typography scale, card shadow).
    applyResolvedStyleTokensToTokenResolver(resolver, pageStyleTokens.tokens);

    // ── Legacy palette overrides ──
    // Applied AFTER the Style Contract bridge so palette extraction
    // (from bg image) still works for legacy element-mode pages.
    if (overrides) {
      const raw = resolver.raw;
      (raw.colors as Record<string, string>)['y'] = overrides.y || raw.colors.y;
      (raw.colors as Record<string, string>)['c'] = overrides.c || raw.colors.c;
      (raw.colors as Record<string, string>)['g'] = overrides.g || raw.colors.g;
      (raw.colors as Record<string, string>)['r'] = overrides.r || raw.colors.r;
      if (overrides.bg) (raw.colors as Record<string, string>)['bg'] = overrides.bg;
      if (overrides.card) (raw.colors as Record<string, string>)['card'] = overrides.card;
    }

    // ── Explicit TemplateThemeContract — applied LAST (wins) ──
    // Contract enforcement: contract WINS even over Style Contract
    // tokens for the fields it patches.
    if (contractStyle) resolver.applyContract(contractStyle);

    return resolver;
  }, [page.schema, page.templateData, page.colorPalette, displayMode, contractStyle, pageStyleTokens]);

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
  // Sprint 6.1: When mode is export/learn/preview, PageFrame hides its navbars
  // (externalNavigation) because the export shell provides its own navigation.
  // Without this gate, computeSafeArea reserves 44+80px for phantom navbar space.
  const externalNavigation = !!adaptedSchema && (mode === 'learn' || mode === 'preview' || mode === 'export');
  const showNavbar = navConfig?.showNavbar !== false;
  const showTopNav = showNavbar && !isCoverTemplate && !externalNavigation;
  const showBottomNav = showNavbar && !isCoverTemplate && !externalNavigation;
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

  // ═══ SCREEN ADAPTER CONTENT — for preview/export/learn modes ═══════
  // Sprint 4 (Engine): Forward editing state through ScreenAdapter path
  // so that learn/edit mode can trigger inline editing via SchemaScreenRenderer.
  // Without this, clicking blocks in learn/edit sub-mode does nothing because
  // the editing props never reach SchemaBlockRenderer's onClick handler.
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
      editingBlockId={isLearnEditMode ? editingBlockId : undefined}
      onBlockEdit={isLearnEditMode ? handleBlockEdit : undefined}
      onBlockSelect={isLearnEditMode ? handleBlockLearnSelect : undefined}
    />
  ) : null;

  const content = (
    <>
      {/* ═══ SCREEN ADAPTER PATH — preview/export/learn mode ════════════ */}
      {/* When NOT in canvas mode, use the screen adapter system which
          wraps SchemaScreenRenderer with ScreenShell for consistent chrome.
          This enforces 1 screen = 1 page with proper structure.
          Sprint 4: Editing props are now forwarded for learn/edit sub-mode. */}
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

      {/* Empty schema page hint — REMOVED: Stage already shows a better empty state with action buttons.
          The duplicate empty state here was causing visual overlap with Stage's overlay.
          Stage's empty state (in stage/index.tsx) is now the single source for empty state UI. */}

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
      pageStyleTokens={pageStyleTokens}
    >
      {content}
    </PageFrame>
  );
});
