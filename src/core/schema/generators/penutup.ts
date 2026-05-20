// ═══════════════════════════════════════════════════════════════════
// PENUTUP (Closing Phase) GENERATORS
// ═══════════════════════════════════════════════════════════════════
// Generates schema blocks for the closing / conclusion phase:
//   refleksi, rangkuman, hasil, penutup
// ═══════════════════════════════════════════════════════════════════

import type { ParseResult } from '@/components/authoring/auto-generate/types';
import type {
  RefleksiBlock,
  RangkumanBlock,
  HasilBlock,
  PenutupBlock,
  CompressionHints,
  SemanticHints,
} from '../types';
import { generateBlockId } from '../ensure-schema';
import { COLOR_PALETTE } from '@/components/authoring/auto-generate/constants';

// ═══════════════════════════════════════════════════════════════════
// REFLEKSI — Self-reflection questions
// ═══════════════════════════════════════════════════════════════════

export function genRefleksiSchema(
  parsed: ParseResult,
  meta: { judulPertemuan: string; namaBab: string },
): RefleksiBlock {
  const { topWords } = parsed;
  const topic = topWords[0] || meta.namaBab || 'materi';
  const questions: Array<{ teks: string; petunjuk: string; warna?: string; icon?: string }> = [];

  questions.push({
    teks: `Hal baru apa yang kamu pelajari tentang ${topic}?`,
    petunjuk: 'Tuliskan minimal 2 hal baru yang kamu pelajari.',
    warna: 'c',
    icon: '🪞',
  });

  questions.push({
    teks: `Bagaimana kamu akan menerapkan pemahaman tentang ${topic} dalam kehidupan sehari-hari?`,
    petunjuk: 'Berikan contoh konkret penerapannya.',
    warna: 'g',
    icon: '💭',
  });

  questions.push({
    teks: 'Tulis komitmen pribadimu untuk menerapkan nilai-nilai yang dipelajari!',
    petunjuk: 'Gunakan kalimat "Saya berkomitmen untuk..."',
    warna: 'y',
    icon: '🎯',
  });

  questions.push({
    teks: 'Bagian mana dari materi ini yang paling menantang? Mengapa?',
    petunjuk: 'Jelaskan kesulitan yang kamu hadapi dan bagaimana mengatasinya.',
    warna: 'p',
    icon: '📝',
  });

  return {
    type: 'refleksi',
    id: generateBlockId(),
    title: `Refleksi ${meta.namaBab}`,
    intro: 'Renungkan pertanyaan berikut untuk memperdalam pemahamanmu!',
    questions,
    penugasan: {
      judul: 'Tugas Refleksi',
      isi: 'Tulis refleksi pribadimu tentang materi yang baru dipelajari.',
      contoh: 'Saya belajar bahwa norma... Saya akan menerapkannya dengan...',
    },
    compression: { priority: 'high', strategy: 'none' } satisfies CompressionHints,
    semantic: { topic: meta.namaBab, learningPhase: 'penutup', interactionType: 'reflect', importance: 0.8 } satisfies SemanticHints,
  };
}

// ═══════════════════════════════════════════════════════════════════
// RANGKUMAN — Summary / reinforcement (BSNP)
// ═══════════════════════════════════════════════════════════════════

export function genRangkumanSchema(
  parsed: ParseResult,
  meta: { namaBab?: string },
): RangkumanBlock {
  const { definitions, enumerations, topWords } = parsed;
  const concepts: Array<{ icon: string; title: string; body: string; color: string }> = [];

  for (const def of definitions.slice(0, 4)) {
    concepts.push({
      icon: '📌',
      title: def.term,
      body: def.meaning.slice(0, 100),
      color: COLOR_PALETTE[concepts.length % COLOR_PALETTE.length],
    });
  }

  for (const en of enumerations.slice(0, 2)) {
    concepts.push({
      icon: '📋',
      title: en.subject,
      body: en.items.slice(0, 3).join(', '),
      color: COLOR_PALETTE[concepts.length % COLOR_PALETTE.length],
    });
  }

  if (concepts.length === 0) {
    concepts.push({
      icon: '📌',
      title: topWords[0] || 'Materi',
      body: `Poin penting tentang ${meta.namaBab || 'pembelajaran ini'}.`,
      color: 'y',
    });
  }

  return {
    type: 'rangkuman',
    id: generateBlockId(),
    title: 'Rangkuman',
    bsnpRequired: true,
    concepts,
    closingStatement: `Pahami konsep-konsep di atas dan hubungkan dengan kehidupan sehari-hari.`,
    accentColor: 'g',
    compression: { priority: 'high', strategy: 'none' } satisfies CompressionHints,
    semantic: { bsnpRelevant: true, topic: meta.namaBab, learningPhase: 'penutup', importance: 0.9 } satisfies SemanticHints,
  };
}

// ═══════════════════════════════════════════════════════════════════
// HASIL — Score / results page
// ═══════════════════════════════════════════════════════════════════

export function genHasilSchema(): HasilBlock {
  return {
    type: 'hasil',
    id: generateBlockId(),
    title: 'Hasil',
    subtitle: 'Lihat skor dan capaianmu!',
    compression: { priority: 'high', strategy: 'none' } satisfies CompressionHints,
    semantic: { learningPhase: 'penutup' } satisfies SemanticHints,
  };
}

// ═══════════════════════════════════════════════════════════════════
// PENUTUP — Closing page
// ═══════════════════════════════════════════════════════════════════

export function genPenutupSchema(
  meta: { judulPertemuan?: string; namaBab?: string },
): PenutupBlock {
  return {
    type: 'penutup',
    id: generateBlockId(),
    title: 'Penutup',
    subtitle: meta.judulPertemuan || meta.namaBab || 'Pertemuan Selesai',
    preview: [
      { icon: '📚', judul: 'Materi', isi: `Ringkasan ${meta.namaBab || 'pembelajaran'}`, warna: 'y' },
      { icon: '🎯', judul: 'Tujuan', isi: 'Capaian pembelajaran hari ini', warna: 'c' },
      { icon: '📝', judul: 'Tugas', isi: 'Refleksi dan penugasan', warna: 'g' },
    ],
    compression: { priority: 'high', strategy: 'none' } satisfies CompressionHints,
    semantic: { topic: meta.namaBab, learningPhase: 'penutup', importance: 0.7 } satisfies SemanticHints,
  };
}
