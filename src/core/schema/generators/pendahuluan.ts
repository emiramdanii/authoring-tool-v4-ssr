// ═══════════════════════════════════════════════════════════════════
// PENDAHULUAN (Opening Phase) GENERATORS
// ═══════════════════════════════════════════════════════════════════
// Generates schema blocks for the opening / introduction phase:
//   cover, petunjuk, tp (tujuan pembelajaran), alur, motivasi, tujuan-display
// ═══════════════════════════════════════════════════════════════════

import type { ParseResult } from '@/components/authoring/auto-generate/types';
import type {
  CoverBlock,
  PetunjukBlock,
  TpBlock,
  AlurBlock,
  MotivasiBlock,
  TujuanDisplayBlock,
  CompressionHints,
  SemanticHints,
} from '../types';
import { generateBlockId } from '../ensure-schema';
import { BLOOM_VERBS, COLOR_PALETTE } from '@/components/authoring/auto-generate/constants';

// ═══════════════════════════════════════════════════════════════════
// COVER — Title page with metadata badges
// ═══════════════════════════════════════════════════════════════════

export function genCoverSchema(
  meta: { namaBab?: string; kelas?: string; mapel?: string; durasi?: string; ikon?: string; judulPertemuan?: string },
): CoverBlock {
  return {
    type: 'cover',
    id: generateBlockId(),
    icon: meta.ikon || '📚',
    title: meta.judulPertemuan || meta.namaBab || 'Materi Pembelajaran',
    subtitle: meta.mapel || '',
    badges: [
      ...(meta.namaBab ? [{ icon: '📚', text: `${meta.namaBab}${meta.kelas ? ` • Kelas ${meta.kelas}` : ''}`, color: 'y' as const }] : []),
      ...(meta.durasi ? [{ icon: '⏱️', text: meta.durasi, color: 'c' as const }] : []),
    ],
    meta: {
      durasi: meta.durasi || '',
      fase: 'VII',
      elemen: meta.mapel || '',
    },
    cta: { label: 'Mulai Belajar →', action: 'next' },
    compression: { priority: 'high', strategy: 'none' } satisfies CompressionHints,
    semantic: { topic: meta.namaBab, learningPhase: 'pendahuluan', importance: 1.0 } satisfies SemanticHints,
  };
}

// ═══════════════════════════════════════════════════════════════════
// PETUNJUK — How to use the media
// ═══════════════════════════════════════════════════════════════════

export function genPetunjukSchema(
  langkah: Array<{ icon: string; judul: string; isi: string }>,
  tips?: string,
): PetunjukBlock {
  return {
    type: 'petunjuk',
    id: generateBlockId(),
    title: 'Petunjuk',
    titleHighlight: 'Penggunaan',
    items: langkah.map(l => ({ icon: l.icon, title: l.judul, body: l.isi })),
    tips: tips || undefined,
    tipsColor: 'y',
    compression: { priority: 'high', strategy: 'accordion' } satisfies CompressionHints,
    semantic: { learningPhase: 'pendahuluan', interactionType: 'read' } satisfies SemanticHints,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TP (Tujuan Pembelajaran) — Learning objectives
// ═══════════════════════════════════════════════════════════════════

export function genTpSchema(
  parsed: ParseResult,
  opts: { pertemuan: number; bloomMax: number },
): TpBlock {
  const { definitions, enumerations, functions, topWords, sentences } = parsed;
  const { pertemuan, bloomMax } = opts;
  const items: Array<{ num: number; verb: string; desc: string; color: string }> = [];
  let idx = 0;

  // C1: Definitions → Menyebutkan / Mendefinisikan
  for (const def of definitions) {
    if (idx >= bloomMax) break;
    const verb = BLOOM_VERBS[1][idx % BLOOM_VERBS[1].length];
    items.push({
      num: idx + 1,
      verb,
      desc: `pengertian ${def.term.toLowerCase()} yaitu ${def.meaning.toLowerCase()}`,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    });
    idx++;
  }

  // C2: Enumerations → Menjelaskan
  if (2 <= bloomMax) {
    for (const en of enumerations) {
      if (idx >= bloomMax) break;
      const verb = BLOOM_VERBS[2][idx % BLOOM_VERBS[2].length];
      items.push({
        num: idx + 1,
        verb,
        desc: `${en.items.slice(0, 3).join(', ')} sebagai bagian dari ${en.subject.toLowerCase()}`,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      });
      idx++;
    }
  }

  // C3: Functions → Menerapkan
  if (3 <= bloomMax) {
    for (const fn of functions) {
      if (idx >= bloomMax) break;
      const verb = BLOOM_VERBS[3][idx % BLOOM_VERBS[3].length];
      items.push({
        num: idx + 1,
        verb,
        desc: `${fn.desc.toLowerCase()} dalam konteks ${fn.subject.toLowerCase()}`,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      });
      idx++;
    }
  }

  // C4-C6: Analysis, Evaluate, Create
  if (4 <= bloomMax && idx < bloomMax) {
    const topic = topWords[0] || 'materi';
    items.push({
      num: idx + 1,
      verb: 'Menganalisis',
      desc: `pentingnya ${topic} dalam kehidupan sehari-hari`,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    });
    idx++;
  }
  if (5 <= bloomMax && idx < bloomMax) {
    const topic = topWords[0] || 'materi';
    items.push({
      num: idx + 1,
      verb: 'Mengevaluasi',
      desc: `penerapan ${topic} di lingkungan sekitar`,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    });
    idx++;
  }
  if (6 <= bloomMax && idx < bloomMax) {
    const topic = topWords[0] || 'materi';
    items.push({
      num: idx + 1,
      verb: 'Menyusun',
      desc: `rangkuman tentang ${topic} berdasarkan hasil pembelajaran`,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    });
  }

  // Fallback: at least 3 TPs
  if (items.length < 3 && sentences.length > 0) {
    while (items.length < 3) {
      const s = sentences[items.length % sentences.length];
      items.push({
        num: items.length + 1,
        verb: BLOOM_VERBS[Math.min(items.length + 1, 6)][items.length % 5],
        desc: s.slice(0, 120).toLowerCase(),
        color: COLOR_PALETTE[items.length % COLOR_PALETTE.length],
      });
    }
  }

  return {
    type: 'tp',
    id: generateBlockId(),
    title: 'Tujuan Pembelajaran',
    titleHighlight: 'Tujuan',
    items,
    profil: 'Beriman & Bertakwa kepada Tuhan YME, Bernalar Kritis, Gotong Royong',
    profilColor: 'g',
    compression: { priority: 'high', strategy: 'none' } satisfies CompressionHints,
    semantic: { bsnpRelevant: true, learningPhase: 'pendahuluan', importance: 0.9, topic: topWords[0] } satisfies SemanticHints,
  };
}

// ═══════════════════════════════════════════════════════════════════
// ALUR — Activity timeline
// ═══════════════════════════════════════════════════════════════════

export function genAlurSchema(
  parsed: ParseResult,
  opts: { pertemuan: number; bloomMax: number },
  meta: { durasi?: string; namaBab?: string },
  totalMinutes = 80,
): AlurBlock {
  const { topWords } = parsed;
  const steps: Array<{ dot: string; durasi: string; judul: string; deskripsi: string }> = [];

  // Pendahuluan
  steps.push({
    dot: 'y',
    durasi: '10 menit',
    judul: 'Apersepsi & Motivasi',
    deskripsi: `Guru menyapa peserta didik, memeriksa kesiapan belajar, dan mengajukan pertanyaan pemantik terkait ${topWords[0] || 'materi'}.`,
  });

  // Inti
  const intiMinutes = totalMinutes - 20;
  steps.push({
    dot: 'c',
    durasi: `${Math.floor(intiMinutes / 2)} menit`,
    judul: 'Eksplorasi Materi',
    deskripsi: 'Peserta didik mengeksplorasi materi melalui diskusi kelompok dan sumber belajar.',
  });
  steps.push({
    dot: 'p',
    durasi: `${Math.ceil(intiMinutes / 2)} menit`,
    judul: 'Latihan & Refleksi',
    deskripsi: 'Peserta didik mengerjakan latihan soal dan refleksi pembelajaran.',
  });

  // Penutup
  steps.push({
    dot: 'g',
    durasi: '10 menit',
    judul: 'Kesimpulan & Evaluasi',
    deskripsi: 'Guru bersama peserta didik menyimpulkan materi pembelajaran.',
  });

  return {
    type: 'alur',
    id: generateBlockId(),
    title: 'Alur Kegiatan',
    totalDurasi: meta.durasi || `${totalMinutes} menit`,
    steps,
    compression: { priority: 'medium', strategy: 'scroll' } satisfies CompressionHints,
    semantic: { topic: meta.namaBab || topWords[0], learningPhase: 'pendahuluan' } satisfies SemanticHints,
  };
}

// ═══════════════════════════════════════════════════════════════════
// MOTIVASI — Apersepsi / motivation hook (BSNP)
// ═══════════════════════════════════════════════════════════════════

export function genMotivasiSchema(
  parsed: ParseResult,
  meta: { namaBab?: string },
): MotivasiBlock {
  const { topWords, definitions } = parsed;
  const topic = meta.namaBab || topWords[0] || 'materi';

  return {
    type: 'motivasi',
    id: generateBlockId(),
    title: 'Motivasi / Apersepsi',
    bsnpRequired: true,
    hookQuestion: `Pernahkah kamu berpikir mengapa ${topic} penting dalam kehidupan sehari-hari?`,
    visual: { emoji: '💡', bgGradient: ['y', 'bg'] },
    connections: definitions.slice(0, 3).map((def, i) => ({
      icon: ['🔗', '🎯', '💡'][i % 3],
      label: def.term,
      description: def.meaning.slice(0, 80),
      color: COLOR_PALETTE[i % COLOR_PALETTE.length],
    })),
    transition: `Mari kita pelajari lebih dalam tentang ${topic}.`,
    compression: { priority: 'high', strategy: 'none' } satisfies CompressionHints,
    semantic: { bsnpRelevant: true, topic, learningPhase: 'pendahuluan', importance: 0.8 } satisfies SemanticHints,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TUJUAN DISPLAY — Student-facing TP (BSNP)
// ═══════════════════════════════════════════════════════════════════

export function genTujuanDisplaySchema(
  parsed: ParseResult,
  opts: { pertemuan: number; bloomMax: number },
): TujuanDisplayBlock {
  const tp = genTpSchema(parsed, opts);
  return {
    type: 'tujuan-display',
    id: generateBlockId(),
    title: 'Tujuan Pembelajaran',
    bsnpRequired: true,
    objectives: tp.items.map(item => ({
      icon: '🎯',
      text: `${item.verb} ${item.desc}`,
      color: item.color,
    })),
    profil: tp.profil,
    profilColor: tp.profilColor,
    compression: { priority: 'high', strategy: 'none' } satisfies CompressionHints,
    semantic: { bsnpRelevant: true, topic: parsed.topWords?.[0], learningPhase: 'pendahuluan' } satisfies SemanticHints,
  };
}
