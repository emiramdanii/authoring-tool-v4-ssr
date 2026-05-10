// ═══════════════════════════════════════════════════════════════════
// SCHEMA ENGINE — Orchestrates LessonSchema → Screen rendering
// ═══════════════════════════════════════════════════════════════════
// This is the main entry point. It:
// 1. Loads a LessonSchema preset
// 2. Resolves design tokens based on theme
// 3. Renders screens using the SchemaScreenRenderer

'use client';

import React from 'react';
import type { LessonSchema, ScreenSchema } from '../schema/types';
import type { SchemaRenderMode } from '../renderer/SchemaRenderer';
import { SchemaScreenRenderer, TokenResolver } from '../renderer/SchemaRenderer';
import { resolveTokens } from '../themes/tokens';

// ── Preset Registry ────────────────────────────────────────────
// Lazy-load presets to avoid bundling all lesson data

const PRESET_MAP: Record<string, () => Promise<LessonSchema>> = {
  'hakikat-norma': () => import('@/presets/ppkn/hakikat-norma-schema').then(m => m.HAKIKAT_NORMA_LESSON),
  'macam-norma': () => import('@/presets/ppkn/macam-norma-schema').then(m => m.MACAM_NORMA_LESSON),
};

export function getAvailablePresets(): string[] {
  return Object.keys(PRESET_MAP);
}

export async function loadPreset(id: string): Promise<LessonSchema | null> {
  const loader = PRESET_MAP[id];
  if (!loader) return null;
  return loader();
}

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

// ── Utility: Convert LessonSchema → CanvaPages ─────────────────
// This bridges the schema system with the existing canva store,
// allowing schema presets to populate the canvas editor.

export function schemaToCanvaPages(schema: LessonSchema): Array<{
  id: string;
  label: string;
  templateType: string;
  bgColor: string;
  templateData: Record<string, unknown>;
}> {
  const tokens = resolveTokens(schema.themeId);

  return schema.screens.map((screen, i) => ({
    id: `schema-${schema.id}-${screen.id}`,
    label: screen.sectionLabel || `Layar ${i + 1}`,
    templateType: screen.templateType,
    bgColor: tokens.colors.bg,
    // Store the full ScreenSchema in templateData so PageRenderer
    // can detect it and use SchemaScreenRenderer instead of PageTemplate.
    // Also store schemaThemeId so TokenResolver uses the correct theme.
    templateData: {
      schemaScreen: screen,
      schemaThemeId: schema.themeId,
    },
  }));
}
