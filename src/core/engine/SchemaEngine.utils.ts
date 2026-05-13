// ═══════════════════════════════════════════════════════════════════
// SCHEMA ENGINE — Utility functions (renderer-free)
// ═══════════════════════════════════════════════════════════════════
// Split from SchemaEngine.tsx to break circular dependencies.
// This file contains ONLY the non-React utility functions that are
// needed by store modules (loadPreset, schemaToCanvaPages, etc.).
// It does NOT import any React components or renderers.
//
// DO NOT import React components or renderer modules here — this
// file is imported by canva store slices, and importing renderers
// would create circular dependencies:
//   canva-store → schema-preset-slice → SchemaEngine → renderers → canva-store

import type { LessonSchema } from '../schema/types';
import { resolveTokens } from '../themes/tokens';

// ── Preset Registry ────────────────────────────────────────────
// Lazy-load presets to avoid bundling all lesson data

const PRESET_MAP: Record<string, () => Promise<LessonSchema>> = {
  'hakikat-norma': () => import('@/presets/ppkn/hakikat-norma-schema').then(m => m.HAKIKAT_NORMA_LESSON),
  'macam-norma': () => import('@/presets/ppkn/macam-norma-schema').then(m => m.MACAM_NORMA_LESSON),
  'perilaku-patuh': () => import('@/presets/ppkn/perilaku-patuh-schema').then(m => m.PERILAKU_PATUH_LESSON),
  'nilai-pancasila': () => import('@/presets/ppkn/nilai-pancasila-schema').then(m => m.NILAI_PANCASILA_LESSON),
  'bhinneka-tunggal-ika': () => import('@/presets/ppkn/bhinneka-tunggal-ika-schema').then(m => m.BHINNEKA_TUNGAL_IKA_LESSON),
  'ham-hak-kewajiban': () => import('@/presets/ppkn/ham-hak-kewajiban-schema').then(m => m.HAM_HAK_KEWAJIBAN_LESSON),
  'demokrasi-pancasila': () => import('@/presets/ppkn/demokrasi-pancasila-schema').then(m => m.DEMOKRASI_PANCASILA_LESSON),
  'globalisasi': () => import('@/presets/ppkn/globalisasi-schema').then(m => m.GLOBALISASI_LESSON),
};

export function getAvailablePresets(): string[] {
  return Object.keys(PRESET_MAP);
}

export async function loadPreset(id: string): Promise<LessonSchema | null> {
  const loader = PRESET_MAP[id];
  if (!loader) return null;
  return loader();
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

  return schema.screens.map((screen, i) => {
    // Ensure every block has a stable ID for the edit pipeline
    const stabilizedBlocks = screen.blocks.map((block, bIdx) => ({
      ...block,
      id: block.id || `${screen.templateType}-${block.type}-${bIdx}`,
    }));

    return {
      id: `schema-${schema.id}-${screen.id}`,
      label: screen.sectionLabel || `Layar ${i + 1}`,
      templateType: screen.templateType,
      bgColor: tokens.colors.bg,
      // Store the full ScreenSchema in templateData so PageRenderer
      // can detect it and use SchemaScreenRenderer instead of PageTemplate.
      // Also store schemaThemeId so TokenResolver uses the correct theme.
      templateData: {
        schemaScreen: { ...screen, blocks: stabilizedBlocks },
        schemaThemeId: schema.themeId,
      },
    };
  });
}
