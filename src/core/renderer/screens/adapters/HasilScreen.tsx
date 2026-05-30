'use client';

// ═══════════════════════════════════════════════════════════════════
// HASIL SCREEN ADAPTER — Score display, results summary
// ═══════════════════════════════════════════════════════════════════
// Hasil screens are results/achievement screens that:
//   - Display the student's score and results summary
//   - Show appreciation/encouragement based on performance
//   - Are NOT interactive (read-only results)
//   - Use the section label "Hasil"
//   - Support tier-based visual treatment (gold/silver/bronze)
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import type { CanvaPage } from '@/components/canva/types';
import type { ScreenConfig } from '../ScreenTypeRegistry';
import { ScreenShell } from '../ScreenShell';
import { SchemaScreenRenderer, type TokenResolver, type SchemaRenderMode } from '../../SchemaRenderer';
import type { ScreenSchema } from '@/core/schema/types';
import type { SceneResolution, SafeArea } from '@/core/scene/SceneLayoutEngine';

export interface HasilScreenProps {
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
}

export const HasilScreen = React.memo(function HasilScreen({
  page: _page,
  schema,
  tokens,
  mode,
  config,
  interactive,
  sceneResolution,
  safeArea,
  ratioId = '16:9',
  showTopNav,
  showBottomNav,
  pageIndex = 0,
  sceneType,
  totalPages = 1,
}: HasilScreenProps) {
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

  return (
    <ScreenShell
      screenType="hasil"
      screenConfig={config}
      tokens={tokens}
      sectionLabel={schema.sectionLabel}
      sectionColor={schema.sectionColor}
      isCompleted={true}
      isCompact={isCompact}
      pageIndex={pageIndex}
      totalPages={totalPages}
    >
      {screenContent}
    </ScreenShell>
  );
});
