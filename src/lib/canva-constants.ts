// ═══════════════════════════════════════════════════════════════
// CANVA CONSTANTS — Shared constants and helpers for canva store
// Renamed from canva-export-helpers.ts
// Legacy export HTML generation removed — now using Vite SSR Export
// ═══════════════════════════════════════════════════════════════

import type { CanvaPage, CanvaElement } from '@/components/canva/types';

// ── Shared constants (used by canva-store + components) ────────
export const GAME_TYPES = ['truefalse','memory','matching','roda','sorting','spinwheel','teambuzzer','wordsearch','flashcard','crossword','fillblank','dragdrop'] as const;
export const MATERI_MODULE_TYPES = ['materi','infografis','accordion','tab-icons','icon-explore','timeline'] as const;
export const MATERI_RAKIT_TYPES = ['materi','infografis','accordion','tab-icons','icon-explore','timeline','hero','kutipan','langkah','statistik','petunjuk','diskusi','review','refleksi','skenario','debat','studi-kasus','comparison','card-showcase','hotspot-image','polling','embed','video','flashcard'] as const;

// ── Helper: Get hero data from authoring store ─────────────────

export function getHeroData(authStore: { modules: Array<Record<string, unknown>>; meta: { judulPertemuan?: string; subjudul?: string; ikon?: string } }) {
  const heroModules = authStore.modules.filter((m: Record<string, unknown>) => m.type === 'hero');
  const heroData = heroModules[0] as Record<string, unknown> | undefined;
  return {
    title: (heroData?.title as string) || authStore.meta.judulPertemuan || 'Hero Banner',
    subtitle: (heroData?.subjudul as string) || authStore.meta.subjudul || '',
    icon: (heroData?.icon as string) || authStore.meta.ikon || '🚀',
    gradient: (heroData?.gradient as string) || 'sunset',
    cta: (heroData?.cta as string) || '',
  };
}

// ── Helper: Populate template elements for backward compat ────
// FASE 4: Now reads from page.schema first, falls back to templateData.
// This ensures schema-native pages still get placeholder elements
// for the export pipeline even without templateData.

export function populateTemplateElements(page: CanvaPage, createElId: () => string): CanvaElement[] {
  if (page.templateType === 'custom') return [];

  // FASE 4: Try to extract module/kuis IDs from page.schema blocks first
  // Schema-native pages may not have templateData populated
  const schema = page.schema;
  let moduleId: string | undefined;
  let kuisId: string | undefined;
  let kuisIds: string[] | undefined;

  if (schema?.blocks) {
    // Scan schema blocks for interactive block types that reference authoring modules
    for (const block of schema.blocks) {
      if (block.type === 'kuis' || block.type === 'roda-game' || block.type === 'sortir-game') {
        // These blocks reference kuis data — extract ID if available
        const blockId = block.id;
        if (block.type === 'kuis' && blockId) {
          kuisId = blockId; // Schema block ID serves as reference
        }
      }
    }
  }

  // Fallback to templateData for legacy pages
  const td = page.templateData || {};
  if (!moduleId || !kuisId) {
    if (page.templateType === 'kuis') {
      const kuisArr = td.kuis as Array<Record<string, unknown>> | undefined;
      if (kuisArr && kuisArr.length > 0) {
        if (!kuisId) kuisId = (kuisArr[0]._id as string) || undefined;
        kuisIds = kuisArr.map(k => k._id as string).filter(Boolean);
      }
    }

    if (page.templateType === 'game') {
      const gamesArr = td.games as Array<Record<string, unknown>> | undefined;
      if (gamesArr && gamesArr.length > 0 && gamesArr[0]._id) {
        if (!moduleId) moduleId = gamesArr[0]._id as string;
      }
    }

    if (page.templateType === 'materi') {
      const modulesArr = td.modules as Array<Record<string, unknown>> | undefined;
      if (modulesArr && modulesArr.length > 0 && modulesArr[0]._id) {
        if (!moduleId) moduleId = modulesArr[0]._id as string;
      }
    }
  }

  return [{
    id: createElId(),
    type: page.templateType === 'kuis' ? 'kuis' : page.templateType === 'game' ? 'game' : 'modul',
    icon: page.templateType === 'kuis' ? '❓' : page.templateType === 'game' ? '🎮' : '🧩',
    label: page.label,
    x: 0, y: 0, w: 100, h: 100,
    opacity: 100,
    dataIdx: -1,
    isPlaceholder: true, // Mark as placeholder — filtered out on unlock
    ...(moduleId ? { moduleId } : {}),
    ...(kuisId ? { kuisId } : {}),
    ...(kuisIds && kuisIds.length > 0 ? { kuisIds } : {}),
  }];
}
