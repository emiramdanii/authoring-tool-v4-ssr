// ═══════════════════════════════════════════════════════════════════
// INTI (Core Phase) GENERATORS
// ═══════════════════════════════════════════════════════════════════
// Generates schema blocks for the core / main learning phase:
//   materi, skenario, kuis, flashcard, diskusi
// ═══════════════════════════════════════════════════════════════════

import type { ParseResult } from '@/components/authoring/auto-generate/types';
import type {
  SchemaBlock,
  SkenarioBlock,
  DefBoxBlock,
  NcGridBlock,
  FlashcardSetBlock,
  DiskusiBlock,
  KuisBlock,
  MateriSectionBlock,
  CompressionHints,
  SemanticHints,
} from '../types';
import { generateBlockId } from '../ensure-schema';
import { COLOR_PALETTE } from '@/components/authoring/auto-generate/constants';

// ═══════════════════════════════════════════════════════════════════
// HELPER: Assign stable IDs to all blocks
// ═══════════════════════════════════════════════════════════════════

function withIds<T extends SchemaBlock>(blocks: T[]): T[] {
  return blocks.map(b => ({ ...b, id: b.id || generateBlockId() }));
}

// ═══════════════════════════════════════════════════════════════════
// MATERI — Content blocks (def-box, nc-grid, flashcard-set, materi-section)
// ═══════════════════════════════════════════════════════════════════

export function genMateriSchema(
  parsed: ParseResult,
  meta: { judulPertemuan: string; namaBab: string },
): SchemaBlock[] {
  const { definitions, enumerations, functions, causes, topWords, sentences } = parsed;
  const blocks: SchemaBlock[] = [];

  // Materi section wrapper with BSNP badge
  const contentBlocks: SchemaBlock[] = [];

  // Intro text
  const introText = sentences.slice(0, 2).join(' ');
  if (introText) {
    contentBlocks.push({
      type: 'def-box',
      id: generateBlockId(),
      borderColor: 'c',
      content: introText,
      compression: { priority: 'high', strategy: 'accordion' } satisfies CompressionHints,
      semantic: { topic: meta.namaBab || topWords[0], learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
    } as DefBoxBlock);
  }

  // Definitions → def-box blocks
  for (const def of definitions) {
    contentBlocks.push({
      type: 'def-box',
      id: generateBlockId(),
      borderColor: 'y',
      content: `<strong>${def.term}</strong> — ${def.meaning}`,
      compression: { priority: 'high', strategy: 'accordion' } satisfies CompressionHints,
      semantic: { topic: meta.namaBab || topWords[0], learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
    } as DefBoxBlock);
  }

  // Enumerations → nc-grid blocks
  for (const en of enumerations) {
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
      semantic: { topic: meta.namaBab || topWords[0], learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
    } as NcGridBlock);
  }

  // Functions → def-box with highlight style
  for (const fn of functions) {
    contentBlocks.push({
      type: 'def-box',
      id: generateBlockId(),
      borderColor: 'c',
      content: `<strong>Fungsi ${fn.subject}</strong> — ${fn.desc}`,
      compression: { priority: 'high', strategy: 'accordion' } satisfies CompressionHints,
      semantic: { topic: meta.namaBab || topWords[0], learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
    } as DefBoxBlock);
  }

  // Causes → nc-grid with cause/effect
  for (const c of causes) {
    contentBlocks.push({
      type: 'nc-grid',
      id: generateBlockId(),
      cards: [
        { icon: '🔥', title: 'Sebab', body: c.cause, color: 'r' },
        { icon: '⚡', title: 'Akibat', body: c.effect, color: 'y' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' } satisfies CompressionHints,
      semantic: { topic: meta.namaBab || topWords[0], learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
    } as NcGridBlock);
  }

  // Wrap in materi-section if we have content blocks
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
      selfCheck: `Apa yang sudah kamu pelajari tentang ${topWords[0] || 'materi ini'}?`,
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
      semantic: { topic: meta.namaBab || topWords[0], learningPhase: 'inti', interactionType: 'read' } satisfies SemanticHints,
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
  const questions: Array<{ q: string; opts: string[]; ans: number; ex: string }> = [];

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

  // From definitions
  for (const def of definitions) {
    if (questions.length >= jumlah) break;
    const wrongs = makeWrongOpts(def.meaning, [def.term]);
    const { opts, ans } = shuffleInsert(def.meaning, wrongs);
    questions.push({ q: `${def.term} adalah ...`, opts, ans, ex: `${def.term} ${def.meaning}.` });
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
    });
  }

  return {
    type: 'kuis',
    id: generateBlockId(),
    title: 'Kuis Pilihan Ganda',
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

export function genDiskusiSchema(
  parsed: ParseResult,
  tp: Array<{ desc: string }>,
  meta: { judulPertemuan: string; namaBab: string },
): DiskusiBlock {
  const { definitions, enumerations } = parsed;
  const questions: Array<{ label: string; icon: string; teks: string; petunjuk: string; color?: string }> = [];
  const icons = ['💭', '🤔', '🗣️', '👥', '✋'];
  const colors = ['c', 'y', 'g', 'p', 'r'];

  for (const def of definitions) {
    if (questions.length >= 5) break;
    questions.push({
      label: `Pertanyaan ${questions.length + 1}`,
      icon: icons[questions.length % icons.length],
      teks: `Jelaskan apa yang dimaksud dengan ${def.term}! Berikan contoh dalam kehidupan sehari-hari.`,
      petunjuk: `Gunakan definisi ${def.term} sebagai dasar jawabanmu.`,
      color: colors[questions.length % colors.length],
    });
  }

  for (const en of enumerations) {
    if (questions.length >= 5) break;
    questions.push({
      label: `Pertanyaan ${questions.length + 1}`,
      icon: icons[questions.length % icons.length],
      teks: `Sebutkan dan diskusikan ${en.subject}! Mana yang paling relevan?`,
      petunjuk: `Pertimbangkan masing-masing poin dan pilih yang paling relevan.`,
      color: colors[questions.length % colors.length],
    });
  }

  for (const t of tp) {
    if (questions.length >= 5) break;
    questions.push({
      label: `Pertanyaan ${questions.length + 1}`,
      icon: icons[questions.length % icons.length],
      teks: `Bagaimana ${t.desc}? Diskusikan dengan teman sekelasmu!`,
      petunjuk: 'Hubungkan dengan pengalaman pribadimu.',
      color: colors[questions.length % colors.length],
    });
  }

  return {
    type: 'diskusi',
    id: generateBlockId(),
    title: `Diskusi ${meta.namaBab}`,
    intro: 'Diskusikan pertanyaan berikut dengan teman sekelompokmu!',
    questions,
    compression: { priority: 'high', strategy: 'scroll' } satisfies CompressionHints,
    semantic: { topic: meta.namaBab, learningPhase: 'inti', interactionType: 'discuss', importance: 0.85 } satisfies SemanticHints,
  };
}
