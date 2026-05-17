// ═══════════════════════════════════════════════════════════════════
// SCHEMA-FIRST GENERATORS — Produce SchemaBlock[] directly from ParseResult
// ═══════════════════════════════════════════════════════════════════
// This is the CORRECT generation pipeline:
//   ParseResult → SchemaBlock[] → page.schema → Canvas Renderer
//
// Old pipeline (DEPRECATED):
//   ParseResult → MateriBlok[] → Authoring Store → TemplateAdapter → SchemaBlock[]
//
// The old generators in auto-generate/generators.ts still exist for
// backward compatibility with the Konten editor panel, but all NEW
// code should use these schema generators.
//
// DESIGN PRINCIPLES:
//   1. SchemaBlock is the PRIMARY output format
//   2. Authoring Store types are SECONDARY (mirrored for Konten editor compat)
//   3. No TemplateAdapter needed — schema is the source of truth
//   4. RegenerateButton updates page.schema directly
// ═══════════════════════════════════════════════════════════════════

import type { ParseResult } from '@/components/authoring/auto-generate/types';
import type {
  SchemaBlock,
  CoverBlock,
  PetunjukBlock,
  TpBlock,
  AlurBlock,
  SkenarioBlock,
  DefBoxBlock,
  NcGridBlock,
  FlashcardSetBlock,
  FtabBlock,
  TabelAccordionBlock,
  DiskusiBlock,
  KuisBlock,
  RefleksiBlock,
  PenutupBlock,
  HasilBlock,
  MotivasiBlock,
  RangkumanBlock,
  TujuanDisplayBlock,
  MateriSectionBlock,
  CompressionHints,
  SemanticHints,
} from './types';
import { generateBlockId } from './ensure-schema';
import { assertValidBlocks } from './validation';
import { BLOOM_VERBS, COLOR_PALETTE } from '@/components/authoring/auto-generate/constants';

// ═══════════════════════════════════════════════════════════════════
// HELPER: Assign stable IDs to all blocks
// ═══════════════════════════════════════════════════════════════════

function withIds<T extends SchemaBlock>(blocks: T[]): T[] {
  return blocks.map(b => ({ ...b, id: b.id || generateBlockId() }));
}

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
// MATERI — Content blocks (def-box, nc-grid, ftab, tabel-accord, materi-section)
// ═══════════════════════════════════════════════════════════════════
//
// GENERATOR DESIGN:
//   materi mentah → semantic parsing → block type selection → SchemaBlock[]
//
// Block type selection rules:
//   definitions  → def-box (yellow border)
//   enumerations → nc-grid (card grid) or tabel-accord (if items have details)
//   functions    → def-box (cyan border) or ftab (if 3+ functions)
//   causes       → nc-grid (sebab-akibat cards) or ftab (2-tab compare)
//   sentences    → def-box (intro text, blue border)
//
// The materi-section wrapper adds BSNP badge, takeaways, and self-check.

export function genMateriSchema(
  parsed: ParseResult,
  meta: { judulPertemuan: string; namaBab: string },
): SchemaBlock[] {
  const { definitions, enumerations, functions, causes, topWords, sentences } = parsed;
  const blocks: SchemaBlock[] = [];
  const contentBlocks: SchemaBlock[] = [];
  const topic = meta.namaBab || topWords[0] || 'materi';

  // ── Intro text from first sentences ──────────────────────────
  const introText = sentences.slice(0, 2).join(' ');
  if (introText) {
    contentBlocks.push({
      type: 'def-box',
      id: generateBlockId(),
      borderColor: 'c',
      content: introText,
      compression: { priority: 'high', strategy: 'accordion' } satisfies CompressionHints,
      semantic: { topic, learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
    } as DefBoxBlock);
  }

  // ── Definitions → def-box blocks (yellow = formal definition) ──
  for (const def of definitions) {
    contentBlocks.push({
      type: 'def-box',
      id: generateBlockId(),
      borderColor: 'y',
      content: `<strong>${def.term}</strong> — ${def.meaning}`,
      compression: { priority: 'high', strategy: 'accordion' } satisfies CompressionHints,
      semantic: { topic: def.term, learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
    } as DefBoxBlock);
  }

  // ── Enumerations → nc-grid or tabel-accord ──────────────────
  for (const en of enumerations) {
    if (en.items.length <= 3) {
      // Short enumeration → card grid
      contentBlocks.push({
        type: 'nc-grid',
        id: generateBlockId(),
        cards: en.items.slice(0, 6).map((item, i) => ({
          icon: ['📌', '📋', '🔑', '💡', '⭐', '📝'][i % 6],
          title: item,
          body: `Bagian dari ${en.subject}`,
          color: COLOR_PALETTE[i % COLOR_PALETTE.length],
        })),
        compression: { priority: 'medium', strategy: 'scroll' } satisfies CompressionHints,
        semantic: { topic: en.subject, learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
      } as NcGridBlock);
    } else {
      // Long enumeration → tabel-accordion (more structured)
      contentBlocks.push({
        type: 'tabel-accord',
        id: generateBlockId(),
        rows: en.items.slice(0, 8).map((item, i) => ({
          icon: ['📌', '📋', '🔑', '💡', '⭐', '📝', '🎯', '🏷️'][i % 8],
          title: item,
          color: COLOR_PALETTE[i % COLOR_PALETTE.length],
          details: [
            { label: 'Kategori', value: en.subject },
            { label: 'Nomor', value: `${i + 1} dari ${en.items.length}` },
          ],
        })),
        compression: { priority: 'medium', strategy: 'accordion' } satisfies CompressionHints,
        semantic: { topic: en.subject, learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
      } as TabelAccordionBlock);
    }
  }

  // ── Functions → ftab (if 3+) or def-box ─────────────────────
  if (functions.length >= 3) {
    // Group 3+ functions into tabbed view — compact and organized
    contentBlocks.push({
      type: 'ftab',
      id: generateBlockId(),
      tabs: functions.slice(0, 5).map((fn, i) => ({
        icon: ['⚙️', '🔧', '🔩', '🏭', '🏗️'][i % 5],
        label: fn.subject.length > 20 ? fn.subject.slice(0, 18) + '...' : fn.subject,
        content: [{
          type: 'def-box',
          id: generateBlockId(),
          borderColor: 'c',
          content: `<strong>Fungsi ${fn.subject}</strong> — ${fn.desc}`,
          compression: { priority: 'high', strategy: 'accordion' } satisfies CompressionHints,
          semantic: { topic: fn.subject, learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
        } as DefBoxBlock],
      })),
      compression: { priority: 'high', strategy: 'accordion' } satisfies CompressionHints,
      semantic: { topic, learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
    } as FtabBlock);
  } else {
    // 1-2 functions → simple def-box
    for (const fn of functions) {
      contentBlocks.push({
        type: 'def-box',
        id: generateBlockId(),
        borderColor: 'c',
        content: `<strong>Fungsi ${fn.subject}</strong> — ${fn.desc}`,
        compression: { priority: 'high', strategy: 'accordion' } satisfies CompressionHints,
        semantic: { topic: fn.subject, learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
      } as DefBoxBlock);
    }
  }

  // ── Causes → nc-grid sebab-akibat or ftab compare ────────────
  for (const c of causes) {
    contentBlocks.push({
      type: 'nc-grid',
      id: generateBlockId(),
      cards: [
        { icon: '🔥', title: 'Sebab', body: c.cause, color: 'r' },
        { icon: '⚡', title: 'Akibat', body: c.effect, color: 'y' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' } satisfies CompressionHints,
      semantic: { topic, learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
    } as NcGridBlock);
  }

  // ── Wrap in materi-section with BSNP badge ──────────────────
  if (contentBlocks.length > 0) {
    blocks.push({
      type: 'materi-section',
      id: generateBlockId(),
      title: meta.judulPertemuan || 'Materi Pembelajaran',
      subtitle: meta.namaBab || undefined,
      bsnpRequired: true,
      icon: '📖',
      accentColor: 'p',
      content: contentBlocks,
      takeaways: topWords.slice(0, 5),
      selfCheck: `Apa yang sudah kamu pelajari tentang ${topWords[0] || topic}?`,
      compression: { priority: 'high', strategy: 'accordion', splittable: true, minFragmentHeight: 200 } satisfies CompressionHints,
      semantic: { bsnpRelevant: true, learningPhase: 'inti', importance: 0.95, topic: meta.namaBab } satisfies SemanticHints,
    } as MateriSectionBlock);
  } else {
    // Fallback: single def-box
    blocks.push({
      type: 'def-box',
      id: generateBlockId(),
      borderColor: 'y',
      content: `Materi tentang ${meta.namaBab || topWords[0] || 'pembelajaran'}.`,
      compression: { priority: 'high', strategy: 'accordion' } satisfies CompressionHints,
      semantic: { topic: topWords[0] || 'materi', learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
    } as DefBoxBlock);
  }

  return withIds(blocks);
}

// ═══════════════════════════════════════════════════════════════════
// SKENARIO — Interactive story with choices
// ═══════════════════════════════════════════════════════════════════

export function genSkenarioSchema(
  parsed: ParseResult,
  meta: { namaBab?: string },
): SkenarioBlock {
  const { definitions, topWords } = parsed;
  const topic = meta.namaBab || topWords[0] || 'materi';

  return {
    type: 'skenario',
    id: generateBlockId(),
    title: `Skenario: ${topic}`,
    chapters: [
      {
        id: 'ch1',
        charEmoji: '🎭',
        title: `Mengenal ${topic}`,
        setup: [
          { speaker: 'Rizki', text: `Halo! Di sini kita punya banyak aturan tentang ${topic}.` },
          { speaker: 'Anda', text: 'Apa saja aturannya?' },
        ],
        choicePrompt: 'Apa yang akan kamu lakukan?',
        choices: [
          {
            icon: '✅',
            label: 'Mempelajari lebih lanjut',
            detail: 'Semangat belajar!',
            good: true,
            pts: 10,
            level: 'good',
            resultTitle: 'Pilihan Tepat!',
            resultBody: `Kamu menunjukkan minat untuk memahami ${topic}.`,
            feedbackGood: 'Bagus! Semangat belajar!',
            feedbackBad: '',
            norma: 'Kurator pengetahuan',
            nextChapter: 2,
          },
          {
            icon: '❌',
            label: 'Tidak peduli',
            detail: 'Menjuga norma itu penting.',
            good: false,
            pts: 0,
            level: 'bad',
            resultTitle: 'Kurang Tepat',
            resultBody: 'Menjaga norma penting untuk keharmonisan.',
            feedbackGood: '',
            feedbackBad: 'Menjaga norma itu penting.',
            norma: 'Kesopanan',
            nextChapter: 2,
          },
        ],
      },
      {
        id: 'ch2',
        charEmoji: '🤔',
        title: `Penerapan ${topic}`,
        setup: [
          { speaker: 'Sari', text: `Ada siswa yang melanggar aturan tentang ${topic}.` },
        ],
        choicePrompt: 'Apa yang sebaiknya kamu lakukan?',
        choices: [
          {
            icon: '✅',
            label: 'Mengingatkan dengan sopan',
            detail: 'Tindakan bijak!',
            good: true,
            pts: 10,
            level: 'good',
            resultTitle: 'Hebat!',
            resultBody: 'Mengingatkan secara baik adalah tindakan bijak.',
            feedbackGood: 'Tindakanmu sangat bijak!',
            feedbackBad: '',
            norma: 'Kesusilaan',
          },
          {
            icon: '❌',
            label: 'Pura-pura tidak melihat',
            detail: 'Ignoransi bisa memperburuk situasi.',
            good: false,
            pts: 0,
            level: 'bad',
            resultTitle: 'Kurang Tepat',
            resultBody: 'Ignoransi bisa memperburuk situasi.',
            feedbackGood: '',
            feedbackBad: 'Sebaiknya kita saling mengingatkan.',
            norma: 'Kesopanan',
          },
        ],
      },
    ],
    compression: { priority: 'high', strategy: 'none' } satisfies CompressionHints,
    semantic: { topic, learningPhase: 'inti', interactionType: 'choose', importance: 0.8 } satisfies SemanticHints,
  };
}

// ═══════════════════════════════════════════════════════════════════
// KUIS — Multiple choice quiz
// ═══════════════════════════════════════════════════════════════════

export function genKuisSchema(
  parsed: ParseResult,
  jumlah: number,
  jumlahPertemuan: number = 1,
): KuisBlock {
  const { definitions, enumerations, functions, causes, topWords, sentences } = parsed;
  const questions: Array<{ q: string; opts: string[]; ans: number; ex: string; pertemuan?: number }> = [];
  // Distribute soal evenly across pertemuan
  const soalPerPertemuan = Math.ceil(jumlah / jumlahPertemuan);

  const makeWrongOpts = (correct: string, exclude: string[] = []): string[] => {
    const pool = topWords.filter(
      w => !correct.toLowerCase().includes(w) && !exclude.some(e => e.toLowerCase().includes(w)),
    );
    const wrongs: string[] = [];
    for (const w of pool) {
      if (wrongs.length >= 3) break;
      const capitalised = w.charAt(0).toUpperCase() + w.slice(1);
      if (!wrongs.includes(capitalised)) wrongs.push(capitalised);
    }
    while (wrongs.length < 3) wrongs.push(`Pilihan ${wrongs.length + 1}`);
    return wrongs;
  };

  const shuffleInsert = (correct: string, wrongs: string[]): { opts: string[]; ans: number } => {
    const ans = Math.floor(Math.random() * 4);
    const opts = [...wrongs];
    opts.splice(ans, 0, correct);
    return { opts, ans };
  };

  /** Assign pertemuan tag based on question index */
  const tagPertemuan = (idx: number): number | undefined => {
    if (jumlahPertemuan <= 1) return undefined; // no tag needed for single pertemuan
    return Math.min(Math.floor(idx / soalPerPertemuan) + 1, jumlahPertemuan);
  };

  // From definitions
  for (const def of definitions) {
    if (questions.length >= jumlah) break;
    const wrongs = makeWrongOpts(def.meaning, [def.term]);
    const { opts, ans } = shuffleInsert(def.meaning, wrongs);
    questions.push({ q: `${def.term} adalah ...`, opts, ans, ex: `${def.term} ${def.meaning}.`, pertemuan: tagPertemuan(questions.length) });
  }

  // From enumerations
  for (const en of enumerations) {
    if (questions.length >= jumlah) break;
    const correctItem = en.items[0];
    const wrongs = makeWrongOpts(correctItem, en.items);
    const { opts, ans } = shuffleInsert(correctItem, wrongs);
    questions.push({
      q: `Berikut ini yang termasuk ${en.subject.toLowerCase()} adalah ...`,
      opts, ans,
      ex: `${en.subject} terdiri dari ${en.items.join(', ')}.`,
      pertemuan: tagPertemuan(questions.length),
    });
  }

  // From functions
  for (const fn of functions) {
    if (questions.length >= jumlah) break;
    const wrongs = makeWrongOpts(fn.desc, [fn.subject]);
    const { opts, ans } = shuffleInsert(fn.desc, wrongs);
    questions.push({
      q: `${fn.subject} berfungsi untuk ...`,
      opts, ans,
      ex: `${fn.subject} berfungsi ${fn.desc}.`,
      pertemuan: tagPertemuan(questions.length),
    });
  }

  // From causes
  for (const c of causes) {
    if (questions.length >= jumlah) break;
    const wrongs = makeWrongOpts(c.effect, [c.cause]);
    const { opts, ans } = shuffleInsert(c.effect, wrongs);
    questions.push({
      q: `Apa yang terjadi karena ${c.cause.toLowerCase().slice(0, 40)} ...`,
      opts, ans,
      ex: `${c.cause} menyebabkan ${c.effect}.`,
      pertemuan: tagPertemuan(questions.length),
    });
  }

  // Fill remaining with contextual questions
  for (const s of sentences) {
    if (questions.length >= jumlah) break;
    const keyWord = topWords.find(w => s.toLowerCase().includes(w));
    if (!keyWord) continue;
    const correct = s.slice(0, 80);
    const wrongs = makeWrongOpts(correct, [keyWord]);
    const { opts, ans } = shuffleInsert(correct, wrongs);
    questions.push({
      q: `Pernyataan yang benar mengenai ${keyWord} adalah ...`,
      opts, ans, ex: correct,
      pertemuan: tagPertemuan(questions.length),
    });
  }

  // General fallback
  while (questions.length < jumlah) {
    const topic = topWords[questions.length % topWords.length] || 'materi';
    const correct = `Pernyataan yang sesuai dengan konsep ${topic}`;
    const wrongs = makeWrongOpts(correct);
    const { opts, ans } = shuffleInsert(correct, wrongs);
    questions.push({
      q: `Manakah pernyataan berikut yang benar tentang ${topic}?`,
      opts, ans,
      ex: `Jawaban yang benar berkaitan dengan konsep ${topic}.`,
      pertemuan: tagPertemuan(questions.length),
    });
  }

  return {
    type: 'kuis',
    id: generateBlockId(),
    title: jumlahPertemuan > 1 ? `Kuis Pilihan Ganda (${jumlahPertemuan} Pertemuan)` : 'Kuis Pilihan Ganda',
    questions: questions.slice(0, jumlah),
    compression: { priority: 'high', strategy: 'scroll', splittable: true } satisfies CompressionHints,
    semantic: { topic: topWords[0], learningPhase: 'inti', interactionType: 'choose', importance: 0.9 } satisfies SemanticHints,
  };
}

// ═══════════════════════════════════════════════════════════════════
// FLASHCARD — Card set for review
// ═══════════════════════════════════════════════════════════════════

export function genFlashcardSchema(
  parsed: ParseResult,
): FlashcardSetBlock {
  const { definitions, enumerations, functions } = parsed;
  const cards: Array<{ q: string; a: string }> = [];

  for (const def of definitions) {
    cards.push({ q: `Apa yang dimaksud dengan ${def.term}?`, a: def.meaning });
  }
  for (const en of enumerations) {
    cards.push({ q: `Apa saja yang termasuk dalam ${en.subject}?`, a: en.items.join(', ') });
  }
  for (const fn of functions) {
    cards.push({ q: `Apa fungsi dari ${fn.subject}?`, a: fn.desc });
  }

  return {
    type: 'flashcard-set',
    id: generateBlockId(),
    cards,
    compression: { priority: 'medium', strategy: 'scroll' } satisfies CompressionHints,
    semantic: { learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
  };
}

// ═══════════════════════════════════════════════════════════════════
// DISKUSI — Discussion questions
// ═══════════════════════════════════════════════════════════════════
//
// Question generation patterns:
//   1. Definitions → "Jelaskan apa yang dimaksud..." (C2: Menjelaskan)
//   2. Enumerations → "Sebutkan dan diskusikan..." (C1: Menyebutkan)
//   3. Functions → "Mengapa X berfungsi untuk Y? Bagaimana jika..." (C4: Menganalisis)
//   4. Causes → "Apa yang terjadi jika...? Diskusikan sebab-akibat" (C4: Menganalisis)
//   5. TP → "Bagaimana [tujuan pembelajaran]?" (C3-C5: Menerapkan/Menganalisis)
//   6. Sentences → "Setuju atau tidak? Mengapa?" (C5: Mengevaluasi)
//
// Max 5 questions with diverse Bloom levels.

export function genDiskusiSchema(
  parsed: ParseResult,
  tp: Array<{ desc: string }>,
  meta: { judulPertemuan: string; namaBab: string },
): DiskusiBlock {
  const { definitions, enumerations, functions, causes, topWords, sentences } = parsed;
  const topic = meta.namaBab || topWords[0] || 'materi';
  const questions: Array<{ label: string; icon: string; teks: string; petunjuk: string; color?: string }> = [];
  const icons = ['💭', '🤔', '🗣️', '👥', '✋'];
  const colors = ['c', 'y', 'g', 'p', 'r'];

  // Pattern 1: From definitions (C2 — Menjelaskan)
  for (const def of definitions.slice(0, 2)) {
    if (questions.length >= 5) break;
    questions.push({
      label: `Pertanyaan ${questions.length + 1}`,
      icon: icons[questions.length % icons.length],
      teks: `Jelaskan apa yang dimaksud dengan ${def.term}! Berikan contoh penerapannya dalam kehidupan sehari-hari.`,
      petunjuk: `Gunakan definisi "${def.term}" sebagai dasar jawaban, lalu hubungkan dengan pengalamanmu sendiri.`,
      color: colors[questions.length % colors.length],
    });
  }

  // Pattern 2: From enumerations (C1 — Menyebutkan + C2 — Menjelaskan)
  for (const en of enumerations.slice(0, 1)) {
    if (questions.length >= 5) break;
    questions.push({
      label: `Pertanyaan ${questions.length + 1}`,
      icon: icons[questions.length % icons.length],
      teks: `Sebutkan dan diskusikan ${en.subject}! Mana yang paling relevan dengan kehidupan kalian? Mengapa?`,
      petunjuk: `Pertimbangkan masing-masing poin, pilih yang paling relevan, dan berikan alasan.`,
      color: colors[questions.length % colors.length],
    });
  }

  // Pattern 3: From functions (C4 — Menganalisis)
  for (const fn of functions.slice(0, 1)) {
    if (questions.length >= 5) break;
    questions.push({
      label: `Pertanyaan ${questions.length + 1}`,
      icon: icons[questions.length % icons.length],
      teks: `Mengapa ${fn.subject} berfungsi untuk ${fn.desc.toLowerCase()}? Apa yang terjadi jika fungsi tersebut tidak berjalan?`,
      petunjuk: `Analisis peran ${fn.subject} dan bayangkan konsekuensi tanpa fungsi tersebut.`,
      color: colors[questions.length % colors.length],
    });
  }

  // Pattern 4: From causes (C4 — Menganalisis sebab-akibat)
  for (const c of causes.slice(0, 1)) {
    if (questions.length >= 5) break;
    questions.push({
      label: `Pertanyaan ${questions.length + 1}`,
      icon: icons[questions.length % icons.length],
      teks: `Diskusikan hubungan sebab-akibat: "${c.cause}" menyebabkan "${c.effect}". Apa bisa terjadi sebaliknya?`,
      petunjuk: `Pikirkan apakah hubungan ini selalu satu arah, atau bisa berlaku dua arah.`,
      color: colors[questions.length % colors.length],
    });
  }

  // Pattern 5: From TP (C3-C5 — Menerapkan/Menganalisis/Mengevaluasi)
  for (const t of tp.slice(0, 1)) {
    if (questions.length >= 5) break;
    questions.push({
      label: `Pertanyaan ${questions.length + 1}`,
      icon: icons[questions.length % icons.length],
      teks: `Bagaimana ${t.desc}? Diskusikan dengan teman sekelasmu dan berikan contoh konkret!`,
      petunjuk: `Hubungkan dengan pengalaman pribadimu dan lingkungan sekitarmu.`,
      color: colors[questions.length % colors.length],
    });
  }

  // Pattern 6: Setuju/tidak from sentences (C5 — Mengevaluasi)
  if (questions.length < 5 && sentences.length > 0) {
    const keySentence = sentences.find(s => s.length > 30 && s.length < 120);
    if (keySentence) {
      questions.push({
        label: `Pertanyaan ${questions.length + 1}`,
        icon: icons[questions.length % icons.length],
        teks: `Setuju atau tidak dengan pernyataan berikut? Mengapa? "${keySentence}"`,
        petunjuk: `Berikan argumen yang logis untuk mendukung posisimu, baik setuju maupun tidak.`,
        color: colors[questions.length % colors.length],
      });
    }
  }

  // Fallback: at least 2 questions
  if (questions.length < 2) {
    questions.push({
      label: 'Pertanyaan 1',
      icon: '💭',
      teks: `Apa hal terpenting yang kamu ketahui tentang ${topic}? Diskusikan!`,
      petunjuk: `Tuliskan pemahamanmu dan bandingkan dengan teman.`,
      color: 'c',
    });
    questions.push({
      label: 'Pertanyaan 2',
      icon: '🤔',
      teks: `Mengapa ${topic} penting dalam kehidupan sehari-hari?`,
      petunjuk: `Hubungkan dengan contoh nyata dari lingkunganmu.`,
      color: 'y',
    });
  }

  return {
    type: 'diskusi',
    id: generateBlockId(),
    title: `Diskusi ${topic}`,
    intro: 'Diskusikan pertanyaan berikut dengan teman sekelompokmu!',
    questions,
    compression: { priority: 'high', strategy: 'scroll' } satisfies CompressionHints,
    semantic: { topic, learningPhase: 'inti', interactionType: 'discuss', importance: 0.85 } satisfies SemanticHints,
  };
}

// ═══════════════════════════════════════════════════════════════════
// REFLEKSI — Self-reflection questions (metacognition)
// ═══════════════════════════════════════════════════════════════════
//
// Metacognitive question patterns (Bloom C6 — Menciptakan + self-regulation):
//   1. "Hal baru apa yang kamu pelajari tentang X?" — Recall + awareness
//   2. "Bagaimana kamu akan menerapkan X?" — Transfer + application
//   3. "Tulis komitmen pribadimu..." — Commitment + agency
//   4. "Bagian mana yang paling menantang?" — Metacognitive monitoring
//   5. "Apa yang akan kamu lakukan berbeda?" — Self-regulation
//   6. "Jelaskan X kepada temanmu" — Teach-back (deepest understanding)
//
// Dynamic content: questions reference definitions, functions, and topWords
// from the parsed material, not just generic placeholders.

export function genRefleksiSchema(
  parsed: ParseResult,
  meta: { judulPertemuan: string; namaBab: string },
): RefleksiBlock {
  const { definitions, functions, causes, topWords } = parsed;
  const topic = topWords[0] || meta.namaBab || 'materi';
  const questions: Array<{ teks: string; petunjuk: string; warna?: string; icon?: string }> = [];

  // Q1: Recall + awareness — what did you learn?
  const defTerm = definitions[0]?.term || topic;
  questions.push({
    teks: `Hal baru apa yang kamu pelajari tentang ${defTerm}? Tuliskan minimal 2 hal yang paling berkesan.`,
    petunjuk: `Fokus pada pemahaman baru yang kamu dapat, bukan sekadar mengulang definisi.`,
    warna: 'c',
    icon: '🪞',
  });

  // Q2: Transfer + application — how will you apply it?
  const fnSubject = functions[0]?.subject || topic;
  questions.push({
    teks: `Bagaimana kamu akan menerapkan pemahaman tentang ${fnSubject} dalam kehidupan sehari-hari?`,
    petunjuk: `Berikan contoh konkret — di rumah, di sekolah, atau di masyarakat.`,
    warna: 'g',
    icon: '💭',
  });

  // Q3: Commitment + agency — personal pledge
  questions.push({
    teks: 'Tulis komitmen pribadimu untuk menerapkan nilai-nilai yang dipelajari!',
    petunjuk: 'Gunakan kalimat "Saya berkomitmen untuk..." dan tuliskan langkah nyata yang akan kamu lakukan.',
    warna: 'y',
    icon: '🎯',
  });

  // Q4: Metacognitive monitoring — what was challenging?
  const challengeTopic = definitions.length > 1 ? definitions[definitions.length > 2 ? 2 : 1].term : topic;
  questions.push({
    teks: `Bagian mana dari materi ${challengeTopic} yang paling menantang? Mengapa?`,
    petunjuk: `Jelaskan kesulitan yang kamu hadapi dan bagaimana kamu mengatasinya (atau rencananya).`,
    warna: 'p',
    icon: '📝',
  });

  // Q5: Self-regulation — what would you do differently? (only if content is rich enough)
  if (causes.length > 0 || functions.length > 1) {
    questions.push({
      teks: `Jika kamu bisa mempelajari materi ini lagi dari awal, apa yang akan kamu lakukan berbeda?`,
      petunjuk: `Pikirkan strategi belajar yang lebih efektif untuk pemahaman yang lebih dalam.`,
      warna: 'r',
      icon: '🔄',
    });
  }

  // Q6: Teach-back — explain to a friend (deepest Bloom level)
  if (definitions.length > 0) {
    const teachTerm = definitions[definitions.length > 1 ? 1 : 0].term;
    questions.push({
      teks: `Jelaskan ${teachTerm} dengan kata-katamu sendiri seolah-olah kamu mengajarkan kepada teman yang belum memahami!`,
      petunjuk: `Gunakan analogi, contoh, atau ilustrasi sederhana agar temanmu bisa memahami.`,
      warna: 'g',
      icon: '👩‍🏫',
    });
  }

  return {
    type: 'refleksi',
    id: generateBlockId(),
    title: `Refleksi ${topic}`,
    intro: 'Renungkan pertanyaan berikut untuk memperdalam pemahamanmu!',
    questions: questions.slice(0, 5), // cap at 5 for canvas space
    penugasan: {
      judul: 'Tugas Refleksi',
      isi: `Tulis refleksi pribadimu tentang ${topic} — apa yang kamu pelajari, mengapa penting, dan bagaimana kamu akan menerapkannya.`,
      contoh: `Saya belajar bahwa ${definitions[0]?.term || topic} adalah... Saya akan menerapkannya dengan...`,
    },
    compression: { priority: 'high', strategy: 'none' } satisfies CompressionHints,
    semantic: { topic: meta.namaBab, learningPhase: 'penutup', interactionType: 'reflect', importance: 0.8 } satisfies SemanticHints,
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

// ═══════════════════════════════════════════════════════════════════
// PER-PERTEMUAN LESSON — Generate schema blocks for ONE pertemuan
// ═══════════════════════════════════════════════════════════════════
// When a lesson has multiple pertemuan, each pertemuan gets its own
// set of pages: Materi + Diskusi + Kuis(filtered) + Refleksi.
// Shared pages (Cover, Petunjuk, TP, Alur) are generated once.
//
// This enables teachers to generate per-pertemuan, edit independently,
// and navigate by pertemuan in the canvas.

export interface PertemuanLessonSchema {
  /** Pertemuan number (1-based) */
  nomor: number;
  /** Materi blocks for this pertemuan */
  materi: SchemaBlock[];
  /** Diskusi block for this pertemuan */
  diskusi: DiskusiBlock;
  /** Kuis block — only questions tagged for this pertemuan (or untagged) */
  kuis: KuisBlock;
  /** Refleksi block for this pertemuan */
  refleksi: RefleksiBlock;
}

/**
 * Generate schema blocks for a specific pertemuan.
 * Kuis questions are filtered: only those tagged with this pertemuan
 * or untagged (pertemuan === undefined) are included.
 */
export function genPertemuanSchema(
  parsed: ParseResult,
  tp: Array<{ desc: string }>,
  meta: { judulPertemuan: string; namaBab: string },
  nomor: number,
  totalPertemuan: number,
  jumlahKuisPerPertemuan: number = 5,
): PertemuanLessonSchema {
  // Generate materi — same content for all pertemuan (teacher can customize later)
  const materi = genMateriSchema(parsed, {
    judulPertemuan: `Pertemuan ${nomor}: ${meta.judulPertemuan}`,
    namaBab: meta.namaBab,
  });

  // Generate diskusi — same questions for all pertemuan
  const diskusi = genDiskusiSchema(parsed, tp, {
    judulPertemuan: `Pertemuan ${nomor}: ${meta.judulPertemuan}`,
    namaBab: meta.namaBab,
  });

  // Generate kuis — full set then filter by pertemuan tag
  const fullKuis = genKuisSchema(parsed, jumlahKuisPerPertemuan * totalPertemuan, totalPertemuan);
  const filteredQuestions = fullKuis.questions.filter(
    q => q.pertemuan === nomor || q.pertemuan === undefined
  );
  const kuis: KuisBlock = {
    ...fullKuis,
    id: generateBlockId(),
    title: `Kuis Pertemuan ${nomor}`,
    questions: filteredQuestions.length > 0 ? filteredQuestions : fullKuis.questions.slice(0, jumlahKuisPerPertemuan),
  };

  // Generate refleksi — same for all pertemuan
  const refleksi = genRefleksiSchema(parsed, {
    judulPertemuan: `Pertemuan ${nomor}: ${meta.judulPertemuan}`,
    namaBab: meta.namaBab,
  });

  return { nomor, materi, diskusi, kuis, refleksi };
}

// ═══════════════════════════════════════════════════════════════════
// FULL LESSON — Generate all schema blocks for a complete lesson
// ═══════════════════════════════════════════════════════════════════

export interface FullLessonSchema {
  cover: CoverBlock;
  petunjuk?: PetunjukBlock;
  tp: TpBlock;
  alur?: AlurBlock;
  motivasi?: MotivasiBlock;
  tujuan?: TujuanDisplayBlock;
  materi: SchemaBlock[];
  skenario?: SkenarioBlock;
  kuis: KuisBlock;
  flashcard?: FlashcardSetBlock;
  diskusi: DiskusiBlock;
  refleksi: RefleksiBlock;
  rangkuman?: RangkumanBlock;
  hasil: HasilBlock;
  penutup: PenutupBlock;
}

export function genFullLessonSchema(
  parsed: ParseResult,
  meta: { namaBab?: string; kelas?: string; mapel?: string; durasi?: string; ikon?: string; judulPertemuan?: string },
  opts: { pertemuan: number; bloomMax: number; jumlahKuis: number },
  petunjukLangkah?: Array<{ icon: string; judul: string; isi: string }>,
  tp?: Array<{ desc: string }>,
): FullLessonSchema {
  const result: FullLessonSchema = {
    cover: genCoverSchema(meta),
    petunjuk: petunjukLangkah?.length ? genPetunjukSchema(petunjukLangkah) : undefined,
    tp: genTpSchema(parsed, opts),
    alur: genAlurSchema(parsed, opts, meta),
    motivasi: genMotivasiSchema(parsed, meta),
    tujuan: genTujuanDisplaySchema(parsed, opts),
    materi: genMateriSchema(parsed, { judulPertemuan: meta.judulPertemuan || '', namaBab: meta.namaBab || '' }),
    skenario: genSkenarioSchema(parsed, meta),
    kuis: genKuisSchema(parsed, opts.jumlahKuis, opts.pertemuan),
    flashcard: genFlashcardSchema(parsed),
    diskusi: genDiskusiSchema(parsed, tp || [], { judulPertemuan: meta.judulPertemuan || '', namaBab: meta.namaBab || '' }),
    refleksi: genRefleksiSchema(parsed, { judulPertemuan: meta.judulPertemuan || '', namaBab: meta.namaBab || '' }),
    rangkuman: genRangkumanSchema(parsed, meta),
    hasil: genHasilSchema(),
    penutup: genPenutupSchema(meta),
  };

  // Validate all generated blocks in dev mode
  // This catches generator bugs before they reach the canvas
  if (process.env.NODE_ENV !== 'production') {
    const allBlocks: SchemaBlock[] = [
      result.cover, result.petunjuk, result.tp, result.alur,
      result.motivasi, result.tujuan, ...result.materi,
      result.skenario, result.kuis, result.flashcard,
      result.diskusi, result.refleksi, result.rangkuman,
      result.hasil, result.penutup,
    ].filter(Boolean) as SchemaBlock[];
    assertValidBlocks(allBlocks, 'genFullLessonSchema');
  }

  return result;
}
