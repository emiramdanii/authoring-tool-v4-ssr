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

// ── Preset map — Lazy-load presets to avoid bundling all lesson data
// Each entry maps a preset ID to a dynamic import function.
// New presets: add entry like `'id': () => import('@/presets/subject/...').then(m => m.EXPORT)

const PRESET_MAP: Record<string, () => Promise<LessonSchema>> = {
  // PPKn
  'hakikat-norma': () => import('@/presets/ppkn/hakikat-norma-schema').then(m => m.HAKIKAT_NORMA_LESSON),
  'macam-norma': () => import('@/presets/ppkn/macam-norma-schema').then(m => m.MACAM_NORMA_LESSON),
  'perilaku-patuh': () => import('@/presets/ppkn/perilaku-patuh-schema').then(m => m.PERILAKU_PATUH_LESSON),
  'nilai-pancasila': () => import('@/presets/ppkn/nilai-pancasila-schema').then(m => m.NILAI_PANCASILA_LESSON),
  'bhinneka-tunggal-ika': () => import('@/presets/ppkn/bhinneka-tunggal-ika-schema').then(m => m.BHINNEKA_TUNGAL_IKA_LESSON),
  'ham-hak-kewajiban': () => import('@/presets/ppkn/ham-hak-kewajiban-schema').then(m => m.HAM_HAK_KEWAJIBAN_LESSON),
  'demokrasi-pancasila': () => import('@/presets/ppkn/demokrasi-pancasila-schema').then(m => m.DEMOKRASI_PANCASILA_LESSON),
  'globalisasi': () => import('@/presets/ppkn/globalisasi-schema').then(m => m.GLOBALISASI_LESSON),
  'misi-penjelajah-pancasila': () => import('@/presets/ppkn/misi-penjelajah-pancasila-schema').then(m => m.MISI_PENJELAJAH_PANCASILA_LESSON),
  // IPA
  'sistem-pernapasan': () => import('@/presets/ipa/sistem-pernapasan-schema').then(m => m.SISTEM_PERNAPASAN_LESSON),
  // MTK
  'persamaan-linear': () => import('@/presets/mtk/persamaan-linear-schema').then(m => m.PERSAMAAN_LINEAR_LESSON),
  // PJOK
  'gerak-dasar-lokomotor': () => import('@/presets/pjok/gerak-dasar-lokomotor-schema').then(m => m.GERAK_DASAR_LOKOMOTOR_LESSON),
  'permainan-bola-besar': () => import('@/presets/pjok/permainan-bola-besar-schema').then(m => m.PERMAINAN_BOLA_BESAR_LESSON),
  'kebugaran-jasmani': () => import('@/presets/pjok/kebugaran-jasmani-schema').then(m => m.KEBUGARAN_JASMANI_LESSON),
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
