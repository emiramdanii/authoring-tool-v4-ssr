// ═══════════════════════════════════════════════════════════════════
// TEACHER TERMINOLOGY — Maps technical jargon to teacher-friendly terms
// ═══════════════════════════════════════════════════════════════════
// When teacherMode === 'sederhana', UI labels are translated from
// developer-centric terms (Schema, Block, Compression) to concepts
// teachers naturally use (Halaman, Isi, Tata Letak Otomatis).
//
// Usage:
//   import { teacherTerm } from '@/core/i18n/teacher-terminology';
//   const label = teacherTerm('Schema', mode); // → 'Halaman' or 'Schema'
// ═══════════════════════════════════════════════════════════════════

export type TeacherMode = 'lengkap' | 'sederhana';

/** Technical → Teacher-friendly term mapping */
export const TEACHER_TERMS: Record<string, string> = {
  // Core concepts
  'Schema': 'Tampilan',
  'SchemaBlock': 'Isi',
  'Schema Block': 'Isi',
  'Block': 'Isi',
  'Template Type': 'Jenis Halaman',
  'Template': 'Template',
  'Compression': 'Kompak',
  'Rebalance': 'Optimalkan',
  'Transaction': 'Perubahan',
  'Scene': 'Halaman',
  'Page': 'Halaman',
  'Element': 'Elemen',
  'Canvas': 'Area Kerja',
  'Variant': 'Gaya Tampilan',
  'Flow Layout': 'Tata Letak Otomatis',
  'Absolute Position': 'Posisi Bebas',
  'Safe Area': 'Area Aman',
  'Scene Overflow': 'Halaman Penuh',
  'Split Scene': 'Pisah Halaman',
  'Merge Scene': 'Gabung Halaman',
  'Composite Block': 'Isi Gabungan',
  'Container': 'Wadah',
  'Projection': 'Data',
  'BSNP Compliance': 'Kesesuaian BSNP',
  'Capability': 'Kemampuan',

  // Block type display names
  'Materi Section': 'Bagian Materi',
  'Ftab': 'Tab',
  'NcGrid': 'Kisi Norma',
  'Def Box': 'Kotak Definisi',
  'DefBox': 'Kotak Definisi',
  'Tujuan Display': 'Tujuan Pembelajaran',
  'Norma Kartu': 'Kartu Norma',
  'NK Card': 'Kartu Norma',
  'Tabel Accord': 'Tabel Accord',
  'Rangkuman': 'Rangkuman',
  'Motivasi': 'Motivasi',
  'Hero': 'Judul Besar',
  'Cover': 'Sampul',
  'Petunjuk': 'Petunjuk',
  'Alur': 'Alur Kegiatan',
  'Skenario': 'Skenario',
  'Hasil': 'Hasil Belajar',
  'Refleksi': 'Refleksi',
  'Penutup': 'Penutup',

  // Game types — teacher-friendly names
  'Sortir': 'Game Urutkan',
  'Roda': 'Roda Putar',
  'Memory': 'Game Memori',
  'Matching': 'Game Cocokkan',
  'FillBlank': 'Isi Titik-Titik',
  'WordSearch': 'Tebak Kata',
  'TrueFalse': 'Benar Salah',
  'DragDrop': 'Seret & Letakkan',
  'Crossword': 'Teka-Teki Silang',
  'TeamBuzzer': 'Buzzer Tim',
  'Diskusi': 'Diskusi Kelompok',
};

/**
 * Translate a technical term based on the current teacher mode.
 *
 * Accepts either:
 *   - TeacherMode string ('lengkap' | 'sederhana')
 *   - boolean (true = sederhana/simple, false = lengkap/full)
 *
 * In 'lengkap' mode (or false), returns the original term unchanged.
 * In 'sederhana' mode (or true), returns the teacher-friendly equivalent
 * (or the original if no mapping exists).
 */
export function teacherTerm(technical: string, mode: TeacherMode | boolean): string {
  const isSimple = typeof mode === 'boolean' ? mode : mode === 'sederhana';
  if (!isSimple) return technical;
  return TEACHER_TERMS[technical] || technical;
}

// ═══════════════════════════════════════════════════════════════════
// SIMPLIFIED GROUPS — Intuitive categorization for sederhana mode
// ═══════════════════════════════════════════════════════════════════
// Instead of "personality" groups (which are pedagogical but still
// somewhat technical), show more intuitive groupings that teachers
// immediately understand.

export interface SimplifiedGroup {
  key: string;
  label: string;
  icon: string;
  desc: string;
  colorClass: string;
  bgColorClass: string;
  borderColorClass: string;
  order: number;
}

export const SIMPLIFIED_GROUPS: Record<string, SimplifiedGroup> = {
  informasi: {
    key: 'informasi',
    label: 'Isi & Materi',
    icon: '\uD83D\uDCD6',
    desc: 'Teks, definisi, dan materi pembelajaran',
    colorClass: 'text-blue-400',
    bgColorClass: 'bg-blue-500/10',
    borderColorClass: 'border-blue-500/20',
    order: 0,
  },
  interaktif: {
    key: 'interaktif',
    label: 'Interaktif',
    icon: '\uD83C\uDFAE',
    desc: 'Kuis, diskusi, game, dan latihan',
    colorClass: 'text-emerald-400',
    bgColorClass: 'bg-emerald-500/10',
    borderColorClass: 'border-emerald-500/20',
    order: 1,
  },
  navigasi: {
    key: 'navigasi',
    label: 'Navigasi',
    icon: '\uD83D\uDD17',
    desc: 'Tab, langkah, dan navigasi halaman',
    colorClass: 'text-cyan-400',
    bgColorClass: 'bg-cyan-500/10',
    borderColorClass: 'border-cyan-500/20',
    order: 2,
  },
  struktur: {
    key: 'struktur',
    label: 'Struktur Halaman',
    icon: '\uD83D\uDCCB',
    desc: 'Sampul, petunjuk, penutup',
    colorClass: 'text-gray-400',
    bgColorClass: 'bg-gray-500/10',
    borderColorClass: 'border-gray-500/20',
    order: 3,
  },
  lainnya: {
    key: 'lainnya',
    label: 'Lainnya',
    icon: '\u2728',
    desc: 'Isi lainnya',
    colorClass: 'text-purple-400',
    bgColorClass: 'bg-purple-500/10',
    borderColorClass: 'border-purple-500/20',
    order: 4,
  },
};

/**
 * Maps a BlockPersonality to a simplified group key.
 * In sederhana mode, blocks are grouped by these simpler categories.
 *
 * Personality → Simplified group mapping:
 *   understanding → informasi (Konten & Materi)
 *   discussion    → interaktif (Interaktif)
 *   reflection    → interaktif (Interaktif)
 *   assessment    → interaktif (Interaktif)
 *   activation    → interaktif (Interaktif)
 *   structure     → navigasi (for nav blocks like ftab) or struktur (for page structure)
 *   default       → lainnya
 *
 * @param personality The block's personality from the registry
 * @param blockType Optional block type for finer-grained categorization
 */
export function personalityToSimplifiedGroup(personality: string, blockType?: string): string {
  switch (personality) {
    case 'understanding':
      return 'informasi';
    case 'discussion':
    case 'reflection':
    case 'assessment':
    case 'activation':
      return 'interaktif';
    case 'structure': {
      // Navigational blocks go to 'navigasi', structural blocks go to 'struktur'
      const navigasiTypes = ['ftab', 'step-navigator', 'tab-navigator'];
      if (blockType && navigasiTypes.includes(blockType)) {
        return 'navigasi';
      }
      return 'struktur';
    }
    default:
      return 'lainnya';
  }
}
