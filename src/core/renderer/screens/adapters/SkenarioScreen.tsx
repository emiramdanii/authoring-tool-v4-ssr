'use client';

// ═══════════════════════════════════════════════════════════════════
// SKENARIO SCREEN ADAPTER — Interactive, choice-based navigation
// ═══════════════════════════════════════════════════════════════════
// Skenario screens are interactive scenario-based screens that:
//   - Present a situation with character dialogue
//   - Require the user to make a choice before advancing
//   - Track completion via the interactive store
//   - Show feedback based on the choice made
//   - Support branching narrative paths
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import type { CanvaPage } from '@/components/canva/types';
import type { ScreenConfig } from '../ScreenTypeRegistry';
import { ScreenShell } from '../ScreenShell';
import { SchemaScreenRenderer, type TokenResolver, type SchemaRenderMode } from '../../SchemaRenderer';
import type { ScreenSchema } from '@/core/schema/types';
import type { SceneResolution, SafeArea } from '@/core/scene/SceneLayoutEngine';
import { useInteractiveStore } from '@/store/interactive-store';

export interface SkenarioScreenProps {
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

export const SkenarioScreen = React.memo(function SkenarioScreen({
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
}: SkenarioScreenProps) {
  const isCompact = mode === 'canvas';

  // Check completion state from interactive store
  const isPageComplete = useInteractiveStore(s => s.isPageComplete);
  const completed = interactive ? isPageComplete(pageIndex) : true;

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
      screenType="skenario"
      screenConfig={config}
      tokens={tokens}
      sectionLabel={schema.sectionLabel}
      sectionColor={schema.sectionColor}
      isCompleted={completed}
      isCompact={isCompact}
      pageIndex={pageIndex}
      totalPages={totalPages}
    >
      {screenContent}
    </ScreenShell>
  );
});
