'use client';

import React from 'react';
import type { CanvaPage, CanvaElement } from '../types';
import { PageFrame, type PageFrameMode } from './PageFrame';
import { BlockRenderer, type BlockRendererMode } from './BlockRenderer';
import { PageTemplate } from '../page-template/PageTemplate';
import { SchemaScreenRenderer, TokenResolver, type SchemaRenderMode } from '@/core/renderer/SchemaRenderer';
import type { ScreenSchema } from '@/core/schema/types';

// ═══════════════════════════════════════════════════════════════
// PAGE RENDERER — Unified page renderer for all contexts
//
// Usage:
//   <PageRenderer mode="canvas" page={page} currentPageIndex={0} totalPages={5} />
//   <PageRenderer mode="preview" page={page} currentPageIndex={0} totalPages={5} />
//   <PageRenderer mode="export" page={page} currentPageIndex={0} totalPages={5} />
//
// Internally handles:
//   1. PageFrame (background, navbar, content area)
//   2. Template vs Custom rendering logic
//   3. BlockRenderer for individual elements
//   4. Locked vs Unlocked template mode
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

  // In canvas mode, templates show design preview (NOT interactive — no nav buttons, no playable widgets)
  // In preview/export mode, templates are interactive (playable with score tracking)
  // This was previously `mode !== 'canvas' || isLocked` which incorrectly made locked templates
  // interactive in canvas mode, showing nav buttons & full quiz/game widgets.
  const interactive = mode !== 'canvas';

  // Canvas mode: isSelected enables editable fields
  const isSelected = mode === 'canvas' && isTemplateSelected;

  // ═══ Content rendering ════════════════════════════════════
  // - Schema-driven: if templateData has schemaScreen, use SchemaScreenRenderer
  // - Locked template (no schema): render PageTemplate (interactive)
  // - Unlocked template (no schema): render frozen PageTemplate
  // - Custom mode: no template, only elements

  // Check if this page has schema data (from preset loading)
  const schemaScreen = page.templateData?.schemaScreen as ScreenSchema | undefined;
  const schemaThemeId = page.templateData?.schemaThemeId as string | undefined;
  const useSchemaRenderer = !!schemaScreen;

  // Map PageRendererMode to SchemaRenderMode
  const schemaModeMap: Record<PageRendererMode, SchemaRenderMode> = {
    canvas: 'canvas',
    preview: 'preview',
    export: 'export',
  };

  const content = (
    <>
      {/* ══ Schema-driven rendering (from preset) ════════════ */}
      {useSchemaRenderer && (
        <SchemaScreenRenderer
          screen={schemaScreen!}
          mode={schemaModeMap[mode]}
          tokens={React.useMemo(() => new TokenResolver(schemaThemeId), [schemaThemeId])}
          interactive={interactive}
        />
      )}

      {/* ══ Legacy template rendering (no schema) ════════════ */}
      {!useSchemaRenderer && isLocked && (
        <PageTemplate
          key={page.id}
          page={page}
          isSelected={isSelected}
          onEditField={onEditField}
          interactive={interactive}
        />
      )}

      {/* Unlocked Template: frozen template background */}
      {!useSchemaRenderer && isUnlocked && (
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
  const overlayElements = !useSchemaRenderer && isLocked && mode !== 'canvas' && (page.overlayElements || []).length > 0 ? (
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
  const extraElements = !useSchemaRenderer && (isUnlocked || !isTemplate) && mode !== 'canvas' ? (
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
      isSchemaDriven={useSchemaRenderer}
      overlayElements={overlayElements}
      extraElements={extraElements}
    >
      {content}
    </PageFrame>
  );
}
