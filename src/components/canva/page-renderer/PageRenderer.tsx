'use client';

import React from 'react';
import type { CanvaPage, CanvaElement } from '../types';
import { PageFrame, type PageFrameMode } from './PageFrame';
import { BlockRenderer, type BlockRendererMode } from './BlockRenderer';
import { PageTemplate } from '../page-template/PageTemplate';
import { SchemaScreenRenderer, TokenResolver, type SchemaRenderMode } from '@/core/renderer/SchemaRenderer';
import type { ScreenSchema } from '@/core/schema/types';
import { convertToSchema, paletteToTokenOverrides } from '@/core/engine/TemplateAdapter';
import type { DesignTokens } from '@/core/themes/tokens';
import { DEFAULT_TOKENS } from '@/core/themes/tokens';

// ═══════════════════════════════════════════════════════════════
// PAGE RENDERER — Unified page renderer for all contexts
//
// UNIFIED RENDERING PIPELINE:
//   All pages now go through SchemaScreenRenderer.
//   Legacy pages are converted to ScreenSchema via TemplateAdapter.
//   This ensures visual consistency across all modes.
//
// Usage:
//   <PageRenderer mode="canvas" page={page} currentPageIndex={0} totalPages={5} />
//   <PageRenderer mode="preview" page={page} currentPageIndex={0} totalPages={5} />
//   <PageRenderer mode="export" page={page} currentPageIndex={0} totalPages={5} />
//
// Internally handles:
//   1. PageFrame (background, navbar, content area)
//   2. Schema-driven rendering (unified — both preset & legacy)
//   3. Legacy fallback (PageTemplate) only if conversion fails
//   4. BlockRenderer for individual elements
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
  const isLocked = isTemplate && page.locked !== false;
  const isUnlocked = isTemplate && page.locked === false;

  // In canvas mode, templates show design preview (NOT interactive)
  // In preview/export mode, templates are interactive (playable with score tracking)
  const interactive = mode !== 'canvas';

  // Canvas mode: isSelected enables editable fields
  const isSelected = mode === 'canvas' && isTemplateSelected;

  // ═══ UNIFIED RENDERING PIPELINE ════════════════════════════
  // Step 1: Check if page already has schema data (from preset loading)
  // Step 2: If not, try to convert legacy templateData → ScreenSchema
  // Step 3: If conversion succeeds, use SchemaScreenRenderer (UNIFIED)
  // Step 4: If conversion fails, fall back to PageTemplate (LEGACY)

  const schemaScreen = page.templateData?.schemaScreen as ScreenSchema | undefined;
  const schemaThemeId = page.templateData?.schemaThemeId as string | undefined;

  // Try to convert legacy page to schema on-the-fly
  const adaptedSchema = React.useMemo<ScreenSchema | null>(() => {
    // Already has schema from preset? Use it directly.
    if (schemaScreen) return schemaScreen;
    // Legacy template page? Convert it.
    if (isTemplate && isLocked && templateType !== 'custom') {
      return convertToSchema(page);
    }
    return null;
  }, [schemaScreen, isTemplate, isLocked, templateType, page]);

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

  // Decide rendering strategy
  const useUnifiedRenderer = !!adaptedSchema;

  // Map PageRendererMode to SchemaRenderMode
  const schemaModeMap: Record<PageRendererMode, SchemaRenderMode> = {
    canvas: 'canvas',
    preview: 'preview',
    export: 'export',
  };

  const content = (
    <>
      {/* ══ UNIFIED: Schema-driven rendering ══════════════════ */}
      {/* Both preset pages AND legacy pages now go through this path */}
      {useUnifiedRenderer && adaptedSchema && (
        <SchemaScreenRenderer
          screen={adaptedSchema}
          mode={schemaModeMap[mode]}
          tokens={tokens}
          interactive={interactive}
        />
      )}

      {/* ══ LEGACY FALLBACK: PageTemplate ═════════════════════ */}
      {/* Only used if convertToSchema() fails for some reason */}
      {!useUnifiedRenderer && isLocked && (
        <PageTemplate
          key={page.id}
          page={page}
          isSelected={isSelected}
          onEditField={onEditField}
          interactive={interactive}
        />
      )}

      {/* Unlocked Template: frozen template background */}
      {!useUnifiedRenderer && isUnlocked && (
        <PageTemplate
          key={page.id}
          page={page}
          isSelected={false}
          onEditField={undefined}
          interactive={false}
        />
      )}

      {/* Custom mode: no template content */}
      {!isTemplate && null}
    </>
  );

  // ═══ Overlay elements (on top of locked templates) ════════
  // Schema-driven pages render their own content — no overlay elements needed
  // In canvas mode, Stage.tsx renders its own StageElement overlays,
  // so we skip BlockRenderer here to avoid double rendering.
  const overlayElements = !useUnifiedRenderer && isLocked && mode !== 'canvas' && (page.overlayElements || []).length > 0 ? (
    <div className="absolute inset-0" style={{ zIndex: 10 }}>
      {(page.overlayElements || []).filter(el => !el.hidden).map(el => (
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

  // ═══ Extra elements (unlocked template / custom mode) ═════
  // Schema-driven pages don't use extra elements — content is in schema
  // In canvas mode, Stage.tsx renders its own StageElement overlays,
  // so we skip BlockRenderer here to avoid double rendering.
  const extraElements = !useUnifiedRenderer && (isUnlocked || !isTemplate) && mode !== 'canvas' ? (
    <div className="absolute inset-0" style={isUnlocked ? { zIndex: 20 } : undefined}>
      {page.elements.filter(el => !el.hidden && !el.isPlaceholder).map(el => (
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
          <div className="text-slate-400 text-sm mb-2">
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
      isLocked={isLocked}
      isSchemaDriven={useUnifiedRenderer}
      overlayElements={overlayElements}
      extraElements={extraElements}
    >
      {content}
    </PageFrame>
  );
}
