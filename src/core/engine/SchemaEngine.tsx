// ═══════════════════════════════════════════════════════════════════
// SCHEMA ENGINE — Orchestrates LessonSchema → Screen rendering
// ═══════════════════════════════════════════════════════════════════
// This is the main entry point. It:
// 1. Loads a LessonSchema preset
// 2. Resolves design tokens based on theme
// 3. Renders screens using the SchemaScreenRenderer
//
// NOTE: Utility functions (loadPreset, schemaToCanvaPages, etc.)
// are in SchemaEngine.utils.ts — a renderer-free module that is
// safe to import from store modules. DO NOT import this file from
// store modules to avoid circular dependencies.

'use client';

import React from 'react';
import type { LessonSchema } from '../schema/types';
import type { SchemaRenderMode } from '../renderer/SchemaRenderer';
import { SchemaScreenRenderer, TokenResolver } from '../renderer/SchemaRenderer';
import { getSceneResolution, computeSafeArea, type SceneResolution, type SafeArea } from '../scene/SceneLayoutEngine';

// Re-export utility functions from the renderer-free module
export { loadPreset, getAvailablePresets, schemaToCanvaPages } from './SchemaEngine.utils';

// ── Schema Engine Component ────────────────────────────────────

export interface SchemaEngineProps {
  /** The loaded lesson schema */
  schema: LessonSchema;
  /** Current screen index (0-based) */
  screenIndex: number;
  /** Render mode */
  mode: SchemaRenderMode;
  /** Override theme ID */
  themeOverride?: string;
  /** Whether widgets are interactive */
  interactive?: boolean;
  /** Ratio ID for scene resolution (default: '16:9') */
  ratioId?: string;
  /** Whether top navbar is shown (affects safe area) */
  showTopNav?: boolean;
  /** Whether bottom navbar is shown (affects safe area) */
  showBottomNav?: boolean;
}

export function SchemaEngine({
  schema,
  screenIndex,
  mode,
  themeOverride,
  interactive = false,
  ratioId = '16:9',
  showTopNav = false,
  showBottomNav = false,
}: SchemaEngineProps) {
  const tokens = new TokenResolver(themeOverride || schema.themeId);
  const screen = schema.screens[screenIndex];

  // ═══ Scene engine props — same as PageRenderer ═══════════════
  // SchemaEngine must pass these so SchemaScreenRenderer uses the
  // correct scene dimensions and safe area, matching the canvas path.
  const isCompact = mode === 'canvas';
  const hasCoverBlock = schema.screens[0]?.blocks.length === 1 &&
    (schema.screens[0].blocks[0].type === 'cover' || schema.screens[0].blocks[0].type === 'hero');
  const isCoverScreen = screen?.blocks.length === 1 &&
    (screen.blocks[0].type === 'cover' || screen.blocks[0].type === 'hero');
  const sceneResolution = getSceneResolution(ratioId);
  const safeArea = computeSafeArea({
    showTopNav,
    showBottomNav,
    isCompact,
    // FIX: Use pagePadding: 16 for non-cover pages to match PageRenderer.
    // Previously hardcoded 0, causing blocks to start at x=0 with no
    // horizontal padding — visual mismatch between SchemaEngine and PageRenderer.
    pagePadding: isCoverScreen ? 0 : 16,
  });

  if (!screen) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
        Layar tidak ditemukan
      </div>
    );
  }

  return (
    <SchemaScreenRenderer
      screen={screen}
      mode={mode}
      tokens={tokens}
      interactive={interactive}
      sceneResolution={sceneResolution}
      safeArea={safeArea}
      ratioId={ratioId}
      showTopNav={showTopNav}
      showBottomNav={showBottomNav}
    />
  );
}
