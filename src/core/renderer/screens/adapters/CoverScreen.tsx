'use client';

// ═══════════════════════════════════════════════════════════════════
// COVER SCREEN ADAPTER — Full bleed, no chrome
// ═══════════════════════════════════════════════════════════════════
// Cover screens are the entry point of a learning module.
// They fill the entire scene with no header/footer chrome.
// The cover block IS the entire screen — no scrolling, no extra blocks.
// Supports inline editing when editable=true (teacher mode).
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import type { CanvaPage } from '@/components/canva/types';
import type { ScreenConfig } from '../ScreenTypeRegistry';
import { ScreenShell } from '../ScreenShell';
import { SchemaScreenRenderer, type TokenResolver, type SchemaRenderMode } from '../../SchemaRenderer';
import type { ScreenSchema } from '@/core/schema/types';
import type { SceneResolution, SafeArea } from '@/core/scene/SceneLayoutEngine';
import { LearningEditProvider, type LearningEditContextValue } from '@/components/canva/LearningEditContext';

export interface CoverScreenProps {
  page: CanvaPage;
  schema: ScreenSchema;
  tokens: TokenResolver;
  mode: SchemaRenderMode;
  config: ScreenConfig;
  interactive: boolean;
  sceneResolution?: SceneResolution;
  safeArea?: SafeArea;
  ratioId?: string;
  showTopNav?: boolean;
  showBottomNav?: boolean;
  pageIndex?: number;
  sceneType?: import('@/core/edu/education-scene-types').SceneType;
  totalPages?: number;
  /** Whether inline editing is enabled (teacher mode) */
  editable?: boolean;
  /** Learning edit context value for providing to block renderers */
  editContext?: LearningEditContextValue | null;
}

export const CoverScreen = React.memo(function CoverScreen({
  page: _page,
  schema,
  tokens,
  mode,
  config,
  interactive,
  sceneResolution,
  safeArea,
  ratioId = '16:9',
  showTopNav = false,
  showBottomNav = false,
  pageIndex = 0,
  sceneType,
  totalPages = 1,
  editable = false,
  editContext = null,
}: CoverScreenProps) {
  const isCompact = mode === 'canvas';

  const screenContent = (
    <SchemaScreenRenderer
      screen={schema}
      mode={mode}
      tokens={tokens}
      interactive={interactive}
      sceneResolution={sceneResolution}
      safeArea={safeArea}
      ratioId={ratioId}
      showTopNav={showTopNav}
      showBottomNav={showBottomNav}
      pageIndex={pageIndex}
      sceneType={sceneType}
    />
  );

  const contentWithEditContext = editContext ? (
    <LearningEditProvider value={editContext}>
      {screenContent}
    </LearningEditProvider>
  ) : screenContent;

  // Cover screens: full-page layout → no chrome at all (or minimal edit indicator)
  return (
    <ScreenShell
      screenType="cover"
      screenConfig={config}
      tokens={tokens}
      sectionLabel={schema.sectionLabel}
      sectionColor={schema.sectionColor}
      isCompleted={true}
      isCompact={isCompact}
      pageIndex={pageIndex}
      totalPages={totalPages}
      editable={editable}
    >
      {contentWithEditContext}
    </ScreenShell>
  );
});
