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

export function populateTemplateElements(page: CanvaPage, createElId: () => string): CanvaElement[] {
  if (page.templateType === 'custom') return [];

  const td = page.templateData || {};
  let moduleId: string | undefined;
  let kuisId: string | undefined;
  let kuisIds: string[] | undefined;

  if (page.templateType === 'kuis') {
    const kuisArr = td.kuis as Array<Record<string, unknown>> | undefined;
    if (kuisArr && kuisArr.length > 0) {
      kuisId = (kuisArr[0]._id as string) || undefined;
      kuisIds = kuisArr.map(k => k._id as string).filter(Boolean);
    }
  }

  if (page.templateType === 'game') {
    const gamesArr = td.games as Array<Record<string, unknown>> | undefined;
    if (gamesArr && gamesArr.length > 0 && gamesArr[0]._id) {
      moduleId = gamesArr[0]._id as string;
    }
  }

  if (page.templateType === 'materi') {
    const modulesArr = td.modules as Array<Record<string, unknown>> | undefined;
    if (modulesArr && modulesArr.length > 0 && modulesArr[0]._id) {
      moduleId = modulesArr[0]._id as string;
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
    ...(moduleId ? { moduleId } : {}),
    ...(kuisId ? { kuisId } : {}),
    ...(kuisIds && kuisIds.length > 0 ? { kuisIds } : {}),
  }];
}
