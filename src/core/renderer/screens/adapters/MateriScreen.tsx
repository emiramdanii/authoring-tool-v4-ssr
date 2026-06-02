'use client';

// ═══════════════════════════════════════════════════════════════════
// MATERI SCREEN ADAPTER — Content area with safe padding
// ═══════════════════════════════════════════════════════════════════
// Materi screens display main learning content with safe padding.
// They allow up to 4 blocks (definitions, grids, tables, etc.)
// and use the section label "Materi Pembelajaran".
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

export interface MateriScreenProps {
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
  /** ID of the block currently being edited */
  editingBlockId?: string | null;
  /** Callback when a block edit is requested */
  onBlockEdit?: (blockId: string, blockType: string) => void;
  /** Callback when a block is selected */
  onBlockSelect?: (blockId: string, blockType: string, addToSelection?: boolean) => void;
}

export const MateriScreen = React.memo(function MateriScreen({
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
  editingBlockId,
  onBlockEdit,
  onBlockSelect,
}: MateriScreenProps) {
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
      editingBlockId={editingBlockId}
      onBlockEdit={onBlockEdit}
      onBlockSelect={onBlockSelect}
    />
  );

  const contentWithEditContext = editContext ? (
    <LearningEditProvider value={editContext}>
      {screenContent}
    </LearningEditProvider>
  ) : screenContent;

  return (
    <ScreenShell
      screenType="materi"
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
