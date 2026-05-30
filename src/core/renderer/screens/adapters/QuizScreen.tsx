'use client';

// ═══════════════════════════════════════════════════════════════════
// QUIZ SCREEN ADAPTER — Interactive, requires completion, score tracking
// ═══════════════════════════════════════════════════════════════════
// Kuis screens are interactive assessment screens that:
//   - Require the user to answer before advancing
//   - Track scores via the interactive store
//   - Show a "Selesaikan dulu" badge when incomplete
//   - Display score feedback upon completion
//   - Support inline editing when editable=true (teacher mode)
// STANDAR: 1 question per page, max 4 options
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import type { CanvaPage } from '@/components/canva/types';
import type { ScreenConfig } from '../ScreenTypeRegistry';
import { ScreenShell } from '../ScreenShell';
import { SchemaScreenRenderer, type TokenResolver, type SchemaRenderMode } from '../../SchemaRenderer';
import type { ScreenSchema } from '@/core/schema/types';
import type { SceneResolution, SafeArea } from '@/core/scene/SceneLayoutEngine';
import { useInteractiveStore } from '@/store/interactive-store';
import { LearningEditProvider, type LearningEditContextValue } from '@/components/canva/LearningEditContext';

export interface QuizScreenProps {
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

export const QuizScreen = React.memo(function QuizScreen({
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
  editable = false,
  editContext = null,
}: QuizScreenProps) {
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

  const contentWithEditContext = editContext ? (
    <LearningEditProvider value={editContext}>
      {screenContent}
    </LearningEditProvider>
  ) : screenContent;

  return (
    <ScreenShell
      screenType="kuis"
      screenConfig={config}
      tokens={tokens}
      sectionLabel={schema.sectionLabel}
      sectionColor={schema.sectionColor}
      isCompleted={completed}
      isCompact={isCompact}
      pageIndex={pageIndex}
      totalPages={totalPages}
      editable={editable}
    >
      {contentWithEditContext}
    </ScreenShell>
  );
});
