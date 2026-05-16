// ═══════════════════════════════════════════════════════════════════
// TEMPLATE FRAGMENTS — Pre-built block patterns for quick insertion
// ═══════════════════════════════════════════════════════════════════
// Instead of adding blocks one-by-one, teachers can insert a
// "fragment" — a group of related blocks that form a common
// pedagogical pattern:
//
//   - "Definisi + Contoh" → def-box + nc-grid
//   - "5 Soal Kuis" → kuis block with 5 questions
//   - "Diskusi 3 Pertanyaan" → diskusi block
//   - "Refleksi Diri" → refleksi block
//   - "Motivasi + Koneksi" → motivasi block
//   - "Rangkuman Konsep" → rangkuman block
//
// Each fragment is just metadata — the actual block creation uses
// the existing schema generators, keeping the system DRY.
// ═══════════════════════════════════════════════════════════════════

import type { PageTemplateType } from '@/components/canva/types';

export interface TemplateFragment {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  /** Which page type this fragment fits best */
  bestFitPageType: PageTemplateType;
  /** Block types included in this fragment */
  blockTypes: string[];
  /** Estimated block count */
  blockCount: number;
  /** Category for grouping */
  category: 'konten' | 'interaktif' | 'evaluasi' | 'penutup';
}

/** Category type alias for fragment grouping */
export type TemplateFragmentCategory = TemplateFragment['category'];

export const TEMPLATE_FRAGMENTS: TemplateFragment[] = [
  // ── Konten ──
  {
    id: 'definisi-contoh',
    title: 'Definisi + Contoh',
    description: 'Kotak definisi + kartu contoh penerapan',
    icon: '📦',
    color: 'sky',
    bestFitPageType: 'materi',
    blockTypes: ['def-box', 'nc-grid'],
    blockCount: 2,
    category: 'konten',
  },
  {
    id: 'istilah-kunci',
    title: 'Istilah Kunci',
    description: 'Kartu grid istilah dan definisi penting',
    icon: '🔑',
    color: 'amber',
    bestFitPageType: 'materi',
    blockTypes: ['nc-grid'],
    blockCount: 1,
    category: 'konten',
  },
  {
    id: 'materi-lengkap',
    title: 'Materi Lengkap',
    description: 'Section materi dengan definisi, contoh, dan poin penting',
    icon: '📖',
    color: 'emerald',
    bestFitPageType: 'materi',
    blockTypes: ['materi-section'],
    blockCount: 1,
    category: 'konten',
  },
  {
    id: 'flashcard-review',
    title: 'Flashcard Review',
    description: 'Set kartu untuk mengulang materi',
    icon: '🃏',
    color: 'violet',
    bestFitPageType: 'materi',
    blockTypes: ['flashcard-set'],
    blockCount: 1,
    category: 'konten',
  },

  // ── Interaktif ──
  {
    id: 'diskusi-3p',
    title: 'Diskusi 3 Pertanyaan',
    description: 'Block diskusi dengan 3 pertanyaan reflektif',
    icon: '💬',
    color: 'violet',
    bestFitPageType: 'diskusi',
    blockTypes: ['diskusi'],
    blockCount: 1,
    category: 'interaktif',
  },
  {
    id: 'skenario-pilihan',
    title: 'Skenario Pilihan',
    description: 'Cerita interaktif dengan pilihan dan konsekuensi',
    icon: '🎭',
    color: 'amber',
    bestFitPageType: 'skenario',
    blockTypes: ['skenario'],
    blockCount: 1,
    category: 'interaktif',
  },
  {
    id: 'tab-konten',
    title: 'Tab Konten',
    description: 'Konten terorganisir dalam tab-tab',
    icon: '📑',
    color: 'sky',
    bestFitPageType: 'materi',
    blockTypes: ['ftab'],
    blockCount: 1,
    category: 'interaktif',
  },

  // ── Evaluasi ──
  {
    id: 'kuis-5soal',
    title: 'Kuis 5 Soal',
    description: 'Pilihan ganda dengan 5 soal dan penjelasan',
    icon: '📝',
    color: 'yellow',
    bestFitPageType: 'kuis',
    blockTypes: ['kuis'],
    blockCount: 1,
    category: 'evaluasi',
  },
  {
    id: 'cocokkan-istilah',
    title: 'Cocokkan Istilah',
    description: 'Game mencocokkan istilah dengan definisi',
    icon: '🔗',
    color: 'cyan',
    bestFitPageType: 'kuis',
    blockTypes: ['matching-game'],
    blockCount: 1,
    category: 'evaluasi',
  },
  {
    id: 'benar-salah',
    title: 'Benar / Salah',
    description: 'Pernyataan benar-salah dengan penjelasan',
    icon: '✅',
    color: 'emerald',
    bestFitPageType: 'kuis',
    blockTypes: ['true-false-game'],
    blockCount: 1,
    category: 'evaluasi',
  },
  {
    id: 'isian-singkat',
    title: 'Isian Singkat',
    description: 'Soal isian dengan petunjuk opsional',
    icon: '✏️',
    color: 'sky',
    bestFitPageType: 'kuis',
    blockTypes: ['fill-blank-game'],
    blockCount: 1,
    category: 'evaluasi',
  },
  {
    id: 'cari-kata',
    title: 'Cari Kata',
    description: 'Kata tersembunyi dalam grid huruf',
    icon: '🔍',
    color: 'pink',
    bestFitPageType: 'kuis',
    blockTypes: ['word-search-game'],
    blockCount: 1,
    category: 'evaluasi',
  },
  {
    id: 'kelompokkan',
    title: 'Kelompokkan Item',
    description: 'Drag & drop ke kategori yang benar',
    icon: '📦',
    color: 'orange',
    bestFitPageType: 'kuis',
    blockTypes: ['drag-drop-game'],
    blockCount: 1,
    category: 'evaluasi',
  },

  // ── Penutup ──
  {
    id: 'refleksi-diri',
    title: 'Refleksi Diri',
    description: 'Pertanyaan refleksi dan komitmen penerapan',
    icon: '🪞',
    color: 'violet',
    bestFitPageType: 'refleksi',
    blockTypes: ['refleksi'],
    blockCount: 1,
    category: 'penutup',
  },
  {
    id: 'rangkuman-konsep',
    title: 'Rangkuman Konsep',
    description: 'Konsep kunci dengan closing statement',
    icon: '📌',
    color: 'emerald',
    bestFitPageType: 'rangkuman',
    blockTypes: ['rangkuman'],
    blockCount: 1,
    category: 'penutup',
  },
];

// ── Lookup helpers ──

const _fragmentMap = new Map<string, TemplateFragment>();
for (const f of TEMPLATE_FRAGMENTS) {
  _fragmentMap.set(f.id, f);
}

export function getFragment(id: string): TemplateFragment | undefined {
  return _fragmentMap.get(id);
}

export function getAllFragments(): TemplateFragment[] {
  return [...TEMPLATE_FRAGMENTS];
}

export function getFragmentsByCategory(category: TemplateFragment['category']): TemplateFragment[] {
  return TEMPLATE_FRAGMENTS.filter(f => f.category === category);
}

// ═══════════════════════════════════════════════════════════════════
// SMART FRAGMENT SUGGESTIONS — Context-aware recommendations
// ═══════════════════════════════════════════════════════════════════
// Given the current page type and existing blocks, recommend which
// fragments would complement the page best. The logic avoids
// suggesting fragments that would duplicate existing block types.

export interface FragmentSuggestion {
  fragment: TemplateFragment;
  /** Why this fragment is recommended */
  reason: 'page-match' | 'complement' | 'missing-type';
  /** Priority score (higher = more relevant) */
  score: number;
}

export function getSmartSuggestions(
  pageType: PageTemplateType,
  existingBlockTypes: string[],
): FragmentSuggestion[] {
  const suggestions: FragmentSuggestion[] = [];
  const existingSet = new Set(existingBlockTypes);

  for (const fragment of TEMPLATE_FRAGMENTS) {
    // Skip fragments whose blocks are already present
    const allBlocksPresent = fragment.blockTypes.every(bt => existingSet.has(bt));
    if (allBlocksPresent) continue;

    let reason: FragmentSuggestion['reason'];
    let score: number;

    if (fragment.bestFitPageType === pageType) {
      // Best fit: page type matches exactly
      reason = 'page-match';
      score = 100;
    } else if (isComplementaryCategory(fragment.category, pageType)) {
      // Complementary: fragment category complements page type
      reason = 'complement';
      score = 60;
    } else {
      // Missing type: page doesn't have this kind of content yet
      reason = 'missing-type';
      score = 30;
    }

    // Boost score if some blocks in the fragment are missing
    const missingCount = fragment.blockTypes.filter(bt => !existingSet.has(bt)).length;
    score += missingCount * 10;

    suggestions.push({ fragment, reason, score });
  }

  // Sort by score descending
  suggestions.sort((a, b) => b.score - a.score);

  return suggestions;
}

/** Check if a fragment category naturally complements a page type */
function isComplementaryCategory(
  category: TemplateFragment['category'],
  pageType: PageTemplateType,
): boolean {
  const COMPLEMENT_MAP: Partial<Record<PageTemplateType, TemplateFragment['category'][]>> = {
    materi: ['konten', 'interaktif'],
    kuis: ['evaluasi'],
    diskusi: ['interaktif', 'konten'],
    skenario: ['interaktif'],
    refleksi: ['penutup'],
    rangkuman: ['penutup', 'konten'],
    cover: ['konten'],
    tujuan: ['konten'],
    motivasi: ['interaktif', 'konten'],
    penutup: ['penutup'],
  };

  return COMPLEMENT_MAP[pageType]?.includes(category) ?? false;
}

// ── Fragment category config ──

export const FRAGMENT_CATEGORIES: Record<TemplateFragment['category'], {
  id: TemplateFragment['category'];
  label: string;
  icon: string;
  color: string;
  desc: string;
}> = {
  konten: {
    id: 'konten',
    label: 'Konten & Materi',
    icon: '📖',
    color: 'sky',
    desc: 'Definisi, contoh, dan penjelasan materi',
  },
  interaktif: {
    id: 'interaktif',
    label: 'Aktivitas Interaktif',
    icon: '🎮',
    color: 'violet',
    desc: 'Diskusi, skenario, dan tab konten',
  },
  evaluasi: {
    id: 'evaluasi',
    label: 'Evaluasi & Game',
    icon: '📝',
    color: 'amber',
    desc: 'Kuis, game, dan soal evaluasi',
  },
  penutup: {
    id: 'penutup',
    label: 'Refleksi & Rangkuman',
    icon: '🎬',
    color: 'emerald',
    desc: 'Refleksi, rangkuman, dan penutup',
  },
};
