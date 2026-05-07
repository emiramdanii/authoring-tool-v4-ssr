import type { M } from './types';

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

export function arr<T>(val: unknown): T[] {
  return Array.isArray(val) ? val : [];
}

export function str(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

export function num(val: unknown, fallback = 0): number {
  return typeof val === 'number' ? val : fallback;
}

export function obj(val: unknown): Record<string, unknown> {
  return val != null && typeof val === 'object' && !Array.isArray(val) ? val as Record<string, unknown> : {};
}

/** Count items in a module for fallback preview */
export function getItemCount(mod: M): number {
  const t = str(mod.type);
  const keys: Record<string, string> = {
    video: 'pertanyaan', flashcard: 'kartu',
    infografis: 'kartu', 'studi-kasus': 'pertanyaan', timeline: 'events',
    matching: 'pasangan', materi: 'blok', truefalse: 'soal',
    memory: 'pasangan', roda: 'opsi', hero: 'chips',
    kutipan: 'quote', langkah: 'steps', accordion: 'items',
    statistik: 'items', polling: 'opsi', embed: 'url',
    'tab-icons': 'tabs', 'icon-explore': 'items', comparison: 'baris',
    'card-showcase': 'cards', 'hotspot-image': 'hotspots',
    sorting: 'items', spinwheel: 'soal', teambuzzer: 'teams',
    wordsearch: 'kata', crossword: 'soal', fillblank: 'soal', dragdrop: 'pasangan',
    skenario: 'chapters', debat: 'pertanyaan',
    petunjuk: 'langkah', diskusi: 'pertanyaan', review: 'kartu', refleksi: 'pertanyaan',
  };
  const key = keys[t];
  if (!key) return 0;
  const v = mod[key];
  if (Array.isArray(v)) return v.length;
  if (typeof v === 'string' && v.length > 0) return 1;
  return 0;
}
