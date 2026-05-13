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
}

export function SchemaEngine({
  schema,
  screenIndex,
  mode,
  themeOverride,
  interactive = false,
}: SchemaEngineProps) {
  const tokens = new TokenResolver(themeOverride || schema.themeId);
  const screen = schema.screens[screenIndex];

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
    />
  );
}
