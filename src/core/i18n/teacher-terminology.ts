// ═══════════════════════════════════════════════════════════════════
// TEACHER TERMINOLOGY — Maps technical jargon to teacher-friendly terms
// ═══════════════════════════════════════════════════════════════════
// When teacherMode === 'sederhana', UI labels are translated from
// developer-centric terms (Schema, Block, Compression) to concepts
// teachers naturally use (Halaman, Konten, Tata Letak Otomatis).
//
// Usage:
//   import { teacherTerm } from '@/core/i18n/teacher-terminology';
//   const label = teacherTerm('Schema', mode); // → 'Halaman' or 'Schema'
// ═══════════════════════════════════════════════════════════════════

export type TeacherMode = 'lengkap' | 'sederhana';

/** Technical → Teacher-friendly term mapping */
export const TEACHER_TERMS: Record<string, string> = {
  // Core concepts
  'Schema': 'Halaman',
  'SchemaBlock': 'Konten',
  'Block': 'Konten',
  'Template Type': 'Jenis Halaman',
  'Template': 'Template',
  'Compression': 'Tata Letak Otomatis',
  'Scene': 'Layar',
  'Page': 'Halaman',
  'Element': 'Elemen',
  'Canvas': 'Area Kerja',

  // Block type display names
  'Materi Section': 'Bagian Materi',
  'Ftab': 'Tab Interaktif',
  'NcGrid': 'Tabel Norma',
  'DefBox': 'Kotak Definisi',
  'Tujuan Display': 'Tujuan Pembelajaran',
  'Norma Kartu': 'Kartu Norma',
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
 * In 'lengkap' mode, returns the original term unchanged.
 * In 'sederhana' mode, returns the teacher-friendly equivalent
 * (or the original if no mapping exists).
 */
export function teacherTerm(technical: string, mode: TeacherMode): string {
  if (mode === 'lengkap') return technical;
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
    label: 'Informasi & Materi',
    icon: '\uD83D\uDCD6',
    desc: 'Menampilkan teks dan informasi',
    colorClass: 'text-blue-400',
    bgColorClass: 'bg-blue-500/10',
    borderColorClass: 'border-blue-500/20',
    order: 0,
  },
  interaktif: {
    key: 'interaktif',
    label: 'Aktivitas Interaktif',
    icon: '\uD83C\uDFAE',
    desc: 'Kuis, game, dan latihan',
    colorClass: 'text-emerald-400',
    bgColorClass: 'bg-emerald-500/10',
    borderColorClass: 'border-emerald-500/20',
    order: 1,
  },
  struktur: {
    key: 'struktur',
    label: 'Struktur Halaman',
    icon: '\uD83D\uDCCB',
    desc: 'Judul, petunjuk, penutup',
    colorClass: 'text-gray-400',
    bgColorClass: 'bg-gray-500/10',
    borderColorClass: 'border-gray-500/20',
    order: 2,
  },
};

/**
 * Maps a BlockPersonality to a simplified group key.
 * In sederhana mode, blocks are grouped by these simpler categories.
 *
 * Personality → Simplified group mapping:
 *   understanding → informasi
 *   discussion    → interaktif
 *   reflection    → interaktif
 *   assessment    → interaktif
 *   activation    → interaktif
 *   structure     → struktur
 */
export function personalityToSimplifiedGroup(personality: string): string {
  switch (personality) {
    case 'understanding':
      return 'informasi';
    case 'discussion':
    case 'reflection':
    case 'assessment':
    case 'activation':
      return 'interaktif';
    case 'structure':
      return 'struktur';
    default:
      return 'informasi';
  }
}
