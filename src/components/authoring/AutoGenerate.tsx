'use client';

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuthoringStore } from '@/store/authoring-store';
import type { CpState, TpItem, AlurItem, KuisItem } from '@/store/authoring-store';

// ═══════════════════════════════════════════════════════════════════
// Types & Interfaces
// ═══════════════════════════════════════════════════════════════════

interface ParseResult {
  sentences: string[];
  words: string[];
  topWords: string[];
  wordCount: number;
  definitions: { term: string; meaning: string }[];
  enumerations: { subject: string; items: string[] }[];
  functions: { subject: string; desc: string }[];
  causes: { cause: string; effect: string }[];
}

interface FlashcardItem {
  depan: string;
  belakang: string;
  hint: string;
}

interface MatchingPair {
  left: string;
  right: string;
}

interface TrueFalseItem {
  statement: string;
  answer: boolean;
  explanation: string;
}

interface SkenarioChapter {
  title: string;
  setup: string;
  dialog: { speaker: string; text: string }[];
  choices: { text: string; feedback: string; correct: boolean }[];
}

interface GenSettings {
  jumlahKuis: number;
  pertemuan: number;
  bloomMax: number;
}

type GenType = 'cp' | 'tp' | 'atp' | 'alur' | 'kuis' | 'flashcard' | 'skenario' | 'matching' | 'truefalse';

interface PreviewData {
  type: GenType;
  label: string;
  icon: string;
  data: unknown;
  count: number;
}

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════

const STOP_WORDS = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'dalam', 'untuk', 'dengan', 'pada',
  'adalah', 'merupakan', 'yaitu', 'ialah', 'sebuah', 'suatu', 'ini', 'itu',
  'atau', 'juga', 'tidak', 'sudah', 'belum', 'akan', 'dapat', 'bisa',
  'telah', 'oleh', 'sebagai', 'antara', 'baik', 'maupun', 'serta', 'namun',
  'tetapi', 'karena', 'seperti', 'jika', 'saat', 'setiap', 'seluruh',
  'lain', 'banyak', 'beberapa', 'semua', 'mereka', 'kita', 'kami', 'dia',
  'ia', 'beliau', 'kalian', 'anda', 'saya', 'aku', 'diri', 'sendiri',
  'tentang', 'secara', 'lebih', 'paling', 'sangat', 'hanya', 'bahkan',
  'lagi', 'pun', 'nya', 'si', 'kah', 'tah', 'loh', 'deh', 'dong', 'to',
  'setelah', 'sebelum', 'ketika', 'walaupun', 'meskipun', 'maka', 'agar',
  'supaya', 'hingga', 'sampai', 'sejak', 'selama', 'terhadap', 'melalui',
  'tanpa', 'kecuali', 'selain', 'tersebut', 'berikut', 'berdasarkan',
  'menurut', 'berkat', 'berdasar', 'guna', 'mengenai', 'perihal',
  'no', 'nomor', 'bab', 'pertemuan', 'hal', 'halaman', 'poin',
]);

const BLOOM_VERBS: Record<number, string[]> = {
  1: ['Menyebutkan', 'Mendefinisikan', 'Mengidentifikasi', 'Menyebut', 'Menuliskan'],
  2: ['Menjelaskan', 'Mendeskripsikan', 'Menguraikan', 'Merangkum', 'Menyimpulkan'],
  3: ['Menerapkan', 'Menggunakan', 'Mengklasifikasikan', 'Mencontohkan', 'Melaksanakan'],
  4: ['Menganalisis', 'Membandingkan', 'Membedakan', 'Mengorganisasi', 'Menghubungkan'],
  5: ['Mengevaluasi', 'Mengkritik', 'Menilai', 'Membenarkan', 'Menguji'],
  6: ['Menciptakan', 'Merancang', 'Merumuskan', 'Menyusun', 'Mengembangkan'],
};

const COLOR_PALETTE = ['#f9c82e', '#3ecfcf', '#a78bfa', '#34d399', '#ff6b6b', '#fb923c', '#60a5fa', '#f472b6'];

const GEN_BUTTONS: { type: GenType; icon: string; label: string; color: string }[] = [
  { type: 'cp', icon: '📋', label: 'CP (Capaian Pembelajaran)', color: 'amber' },
  { type: 'tp', icon: '🎯', label: 'TP (Tujuan Pembelajaran)', color: 'cyan' },
  { type: 'atp', icon: '📅', label: 'ATP (Alur Tujuan Pembelajaran)', color: 'purple' },
  { type: 'alur', icon: '🗺️', label: 'Alur Kegiatan', color: 'purple' },
  { type: 'kuis', icon: '❓', label: 'Kuis Pilihan Ganda', color: 'cyan' },
  { type: 'flashcard', icon: '🃏', label: 'Flashcard', color: 'amber' },
  { type: 'skenario', icon: '🎭', label: 'Skenario', color: 'purple' },
  { type: 'matching', icon: '🔀', label: 'Game Matching', color: 'cyan' },
  { type: 'truefalse', icon: '✅', label: 'Game Benar/Salah', color: 'amber' },
];

// ═══════════════════════════════════════════════════════════════════
// Parser
// ═══════════════════════════════════════════════════════════════════

function parse(text: string): ParseResult {
  // Split into sentences
  const raw = text.replace(/\n+/g, ' ').trim();
  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  // Extract words
  const allWords = raw
    .toLowerCase()
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Word frequencies
  const freq = new Map<string, number>();
  for (const w of allWords) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  const topWords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([w]) => w);

  // Definitions: "X adalah/merupakan/yaitu/ialah Y"
  const defRegex = /([A-Z][^\s,.:;]{1,40})\s+(?:adalah|merupakan|yaitu|ialah)\s+([^.]+)/g;
  const definitions: { term: string; meaning: string }[] = [];
  let m;
  while ((m = defRegex.exec(raw)) !== null) {
    definitions.push({ term: m[1].trim(), meaning: m[2].trim() });
  }

  // Enumerations: "terdiri dari/meliputi/antara lain X, Y, Z"
  const enumRegex = /([^.]+?)\s+(?:terdiri dari|meliputi|antara lain)\s+([^.]+)/gi;
  const enumerations: { subject: string; items: string[] }[] = [];
  while ((m = enumRegex.exec(raw)) !== null) {
    const items = m[2]
      .split(/[,;]\s*/)
      .map((s) => s.replace(/^(?:yaitu|yakni|ialah)\s+/i, '').trim())
      .filter(Boolean);
    if (items.length >= 2) {
      enumerations.push({ subject: m[1].trim(), items });
    }
  }

  // Functions: "berfungsi/berperan/berguna/bertujuan untuk X"
  const funcRegex = /([^.]+?)\s+(?:berfungsi|berperan|berguna|bertujuan)\s+(?:sebagai|untuk|dalam)?\s*([^.]+)/gi;
  const functions: { subject: string; desc: string }[] = [];
  while ((m = funcRegex.exec(raw)) !== null) {
    functions.push({ subject: m[1].trim(), desc: m[2].trim() });
  }

  // Causes: "karena/sehingga/akibat/menyebabkan X"
  const causeRegex = /([^.]*?(?:karena|akibat|menyebabkan|sehingga)[^.]+)/gi;
  const causes: { cause: string; effect: string }[] = [];
  while ((m = causeRegex.exec(raw)) !== null) {
    const clause = m[1].trim();
    const sep = clause.match(/(?:karena|akibat|menyebabkan|sehingga)/i);
    if (sep) {
      const idx = clause.toLowerCase().indexOf(sep[0].toLowerCase());
      causes.push({
        cause: clause.slice(0, idx).trim(),
        effect: clause.slice(idx + sep[0].length).trim(),
      });
    }
  }

  return {
    sentences,
    words: allWords,
    topWords,
    wordCount: allWords.length,
    definitions,
    enumerations,
    functions,
    causes,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Generators
// ═══════════════════════════════════════════════════════════════════

function genCP(parsed: ParseResult, meta: { namaBab?: string; kelas?: string; mapel?: string }): CpState {
  const { definitions, enumerations, topWords } = parsed;
  const topic = meta.namaBab || topWords[0] || 'materi';
  const parts: string[] = [];

  if (definitions.length > 0) {
    parts.push(
      `Peserta didik mampu memahami ${definitions.map((d) => d.term.toLowerCase()).join(', ')}`,
    );
  }

  if (enumerations.length > 0) {
    const enumItems = enumerations.flatMap((e) => e.items.slice(0, 3));
    parts.push(`mengidentifikasi ${enumItems.join(', ')}`);
  }

  if (parts.length === 0) {
    parts.push(`mampu memahami konsep-konsep dasar ${topic}`);
  }

  parts.push(
    `serta menunjukkan sikap patuh terhadap norma dalam kehidupan bermasyarakat.`,
  );

  return {
    elemen: meta.mapel || 'Pancasila',
    subElemen: topWords.slice(0, 3).join(', ') || 'Pemahaman materi',
    capaianFase: parts.join(' ') + '.',
    profil: ['Beriman & Bertakwa kepada Tuhan YME', 'Bernalar Kritis', 'Gotong Royong'],
    fase: 'D',
    kelas: meta.kelas || 'VII',
  };
}

function genTP(parsed: ParseResult, opts: GenSettings): TpItem[] {
  const { definitions, enumerations, functions, topWords, sentences } = parsed;
  const { pertemuan, bloomMax } = opts;
  const tps: TpItem[] = [];
  let idx = 0;

  // C1: Definitions → Menyebutkan / Mendefinisikan
  for (const def of definitions) {
    if (idx >= bloomMax) break;
    const verb = BLOOM_VERBS[1][idx % BLOOM_VERBS[1].length];
    const pert = Math.min(Math.ceil((idx + 1) / 2), pertemuan);
    tps.push({
      verb,
      desc: `pengertian ${def.term.toLowerCase()} yaitu ${def.meaning.toLowerCase()}`,
      pertemuan: pert,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    });
    idx++;
  }

  // C2: Enumerations → Menjelaskan / Mendeskripsikan
  if (2 <= bloomMax) {
    for (const en of enumerations) {
      if (idx >= bloomMax) break;
      const verb = BLOOM_VERBS[2][idx % BLOOM_VERBS[2].length];
      const pert = Math.min(Math.ceil((idx + 1) / 2), pertemuan);
      tps.push({
        verb,
        desc: `${en.items.slice(0, 3).join(', ')} sebagai bagian dari ${en.subject.toLowerCase()}`,
        pertemuan: pert,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      });
      idx++;
    }
  }

  // C3: Functions → Menerapkan / Menggunakan
  if (3 <= bloomMax) {
    for (const fn of functions) {
      if (idx >= bloomMax) break;
      const verb = BLOOM_VERBS[3][idx % BLOOM_VERBS[3].length];
      const pert = Math.min(Math.ceil((idx + 1) / 2), pertemuan);
      tps.push({
        verb,
        desc: `${fn.desc.toLowerCase()} dalam konteks ${fn.subject.toLowerCase()}`,
        pertemuan: pert,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      });
      idx++;
    }
  }

  // C4: Analysis → Menganalisis
  if (4 <= bloomMax) {
    const topic = topWords[0] || 'materi';
    const pert = Math.min(Math.ceil((idx + 1) / 2), pertemuan);
    tps.push({
      verb: 'Menganalisis',
      desc: `pentingnya ${topic} dalam kehidupan sehari-hari`,
      pertemuan: pert,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    });
    idx++;
  }

  // C5: Evaluate
  if (5 <= bloomMax) {
    const topic = topWords[0] || 'materi';
    const pert = Math.min(idx + 1, pertemuan);
    tps.push({
      verb: 'Mengevaluasi',
      desc: `penerapan ${topic} di lingkungan sekitar`,
      pertemuan: pert,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    });
    idx++;
  }

  // C6: Create
  if (6 <= bloomMax) {
    const topic = topWords[0] || 'materi';
    const pert = Math.min(idx + 1, pertemuan);
    tps.push({
      verb: 'Menyusun',
      desc: `rangkuman tentang ${topic} berdasarkan hasil pembelajaran`,
      pertemuan: pert,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    });
  }

  // Fallback: at least 3 TPs
  if (tps.length < 3 && sentences.length > 0) {
    while (tps.length < 3) {
      const s = sentences[tps.length % sentences.length];
      const pert = Math.min(tps.length + 1, pertemuan);
      tps.push({
        verb: BLOOM_VERBS[Math.min(tps.length + 1, 6)][tps.length % 5],
        desc: s.slice(0, 120).toLowerCase(),
        pertemuan: pert,
        color: COLOR_PALETTE[tps.length % COLOR_PALETTE.length],
      });
    }
  }

  return tps;
}

function genATP(tps: TpItem[], meta: { namaBab?: string; durasi?: string }, pertemuan: number) {
  const grouped: Map<number, TpItem[]> = new Map();
  for (const tp of tps) {
    const p = tp.pertemuan || 1;
    if (!grouped.has(p)) grouped.set(p, []);
    grouped.get(p)!.push(tp);
  }

  const pertemuanList: Array<{ judul: string; tp: string; durasi: string; kegiatan: string; penilaian: string }> = [];
  const kegiatanTemplates = [
    'Apersepsi → Eksplorasi konsep → Diskusi kelompok → Presentasi',
    'Tanya jawab → Pemaparan materi → Latihan soal → Refleksi',
    'Studi kasus → Analisis kelompok → Game edukatif → Penilaian',
    'Ceramah interaktif → Demonstrasi → Praktik → Evaluasi',
  ];

  for (let i = 1; i <= pertemuan; i++) {
    const group = grouped.get(i) || [];
    const tpText = group.map((tp, idx) => `TP ${idx + 1}: ${tp.verb} ${tp.desc}`).join(' | ');

    pertemuanList.push({
      judul: group.length > 0
        ? `${group[0].verb} ${group[0].desc.split(' ').slice(0, 4).join(' ')}...`
        : `Pertemuan ${i}`,
      tp: tpText || `Pertemuan ${i}`,
      durasi: meta.durasi || '2×40 menit',
      kegiatan: kegiatanTemplates[(i - 1) % kegiatanTemplates.length],
      penilaian: i % 2 === 0 ? 'Kuis + Observasi' : 'Diskusi + Portofolio',
    });
  }

  return {
    namaBab: meta.namaBab || 'Bab',
    jumlahPertemuan: pertemuan,
    pertemuan: pertemuanList,
  };
}

function genAlur(tps: TpItem[], meta: { durasi?: string }, totalMinutes = 80): AlurItem[] {
  const steps: AlurItem[] = [];

  // Pendahuluan: 10-15 min
  steps.push({
    fase: 'Pendahuluan',
    durasi: '10 menit',
    judul: 'Apersepsi & Motivasi',
    deskripsi: `Guru menyapa peserta didik, memeriksa kesiapan belajar, dan mengajukan pertanyaan pemantik terkait ${tps.length > 0 ? tps[0].desc.slice(0, 60) : 'materi'}.`,
  });

  // Inti steps: distribute time among TPs
  const intiMinutes = totalMinutes - 10 - 10; // minus pendahuluan & penutup
  const intiTpCount = Math.max(tps.length, 2);
  const minutesPerStep = Math.floor(intiMinutes / intiTpCount);

  if (tps.length > 0) {
    tps.slice(0, intiTpCount).forEach((tp, i) => {
      steps.push({
        fase: 'Inti',
        durasi: `${minutesPerStep} menit`,
        judul: `${tp.verb} ${tp.desc.split(' ').slice(0, 5).join(' ')}`,
        deskripsi: `Peserta didik ${tp.verb.toLowerCase()} ${tp.desc}. Kegiatan dilakukan melalui diskusi dan eksplorasi mandiri.`,
      });
    });
  } else {
    // Default inti steps
    steps.push({
      fase: 'Inti',
      durasi: `${Math.floor(intiMinutes / 2)} menit`,
      judul: 'Eksplorasi Materi',
      deskripsi: 'Peserta didik mengeksplorasi materi melalui diskusi kelompok dan sumber belajar.',
    });
    steps.push({
      fase: 'Inti',
      durasi: `${Math.ceil(intiMinutes / 2)} menit`,
      judul: 'Latihan & Refleksi',
      deskripsi: 'Peserta didik mengerjakan latihan soal dan refleksi pembelajaran.',
    });
  }

  // Penutup: 10 min
  steps.push({
    fase: 'Penutup',
    durasi: '10 menit',
    judul: 'Kesimpulan & Evaluasi',
    deskripsi: 'Guru bersama peserta didik menyimpulkan materi pembelajaran. Peserta didik mengerjakan kuis singkat dan mengisi refleksi akhir.',
  });

  return steps;
}

function genKuis(parsed: ParseResult, jumlah: number): KuisItem[] {
  const { definitions, enumerations, functions, causes, topWords, sentences } = parsed;
  const kuis: KuisItem[] = [];

  const makeWrongOpts = (correct: string, exclude: string[] = []): string[] => {
    const pool = topWords.filter(
      (w) => !correct.toLowerCase().includes(w) && !exclude.some((e) => e.toLowerCase().includes(w)),
    );
    const wrongs: string[] = [];
    for (const w of pool) {
      if (wrongs.length >= 3) break;
      const capitalised = w.charAt(0).toUpperCase() + w.slice(1);
      if (!wrongs.includes(capitalised)) {
        wrongs.push(capitalised);
      }
    }
    while (wrongs.length < 3) {
      wrongs.push(`Pilihan ${wrongs.length + 1}`);
    }
    return wrongs;
  };

  const shuffleInsert = (correct: string, wrongs: string[]): { opts: string[]; ans: number } => {
    const ans = Math.floor(Math.random() * 4);
    const opts = [...wrongs];
    opts.splice(ans, 0, correct);
    return { opts, ans };
  };

  // Pattern 1: From definitions
  for (const def of definitions) {
    if (kuis.length >= jumlah) break;
    const wrongs = makeWrongOpts(def.meaning, [def.term]);
    const { opts, ans } = shuffleInsert(def.meaning, wrongs);
    kuis.push({
      q: `${def.term} adalah ...`,
      opts,
      ans,
      ex: `${def.term} ${def.meaning}.`,
    });
  }

  // Pattern 2: From enumerations
  for (const en of enumerations) {
    if (kuis.length >= jumlah) break;
    const correctItem = en.items[0];
    const wrongs = makeWrongOpts(correctItem, en.items);
    const { opts, ans } = shuffleInsert(correctItem, wrongs);
    kuis.push({
      q: `Berikut ini yang termasuk ${en.subject.toLowerCase()} adalah ...`,
      opts,
      ans,
      ex: `${en.subject} terdiri dari ${en.items.join(', ')}.`,
    });
  }

  // Pattern 3: From functions
  for (const fn of functions) {
    if (kuis.length >= jumlah) break;
    const wrongs = makeWrongOpts(fn.desc, [fn.subject]);
    const { opts, ans } = shuffleInsert(fn.desc, wrongs);
    kuis.push({
      q: `${fn.subject} berfungsi untuk ...`,
      opts,
      ans,
      ex: `${fn.subject} berfungsi ${fn.desc}.`,
    });
  }

  // Pattern 4: From causes
  for (const c of causes) {
    if (kuis.length >= jumlah) break;
    const wrongs = makeWrongOpts(c.effect, [c.cause]);
    const { opts, ans } = shuffleInsert(c.effect, wrongs);
    kuis.push({
      q: `Apa yang terjadi ${c.cause ? `karena ${c.cause.toLowerCase().slice(0, 40)}` : 'dalam materi berikut'} ...`,
      opts,
      ans,
      ex: `${c.cause} menyebabkan ${c.effect}.`,
    });
  }

  // Pattern 5: Contextual from sentences
  for (const s of sentences) {
    if (kuis.length >= jumlah) break;
    const keyWord = topWords.find((w) => s.toLowerCase().includes(w));
    if (!keyWord) continue;
    const correct = s.slice(0, 80);
    const wrongs = makeWrongOpts(correct, [keyWord]);
    const { opts, ans } = shuffleInsert(correct, wrongs);
    kuis.push({
      q: `Pernyataan yang benar mengenai ${keyWord} adalah ...`,
      opts,
      ans,
      ex: correct,
    });
  }

  // Pattern 6: General
  while (kuis.length < jumlah) {
    const topic = topWords[kuis.length % topWords.length] || 'materi';
    const correct = `Pernyataan yang sesuai dengan konsep ${topic}`;
    const wrongs = makeWrongOpts(correct);
    const { opts, ans } = shuffleInsert(correct, wrongs);
    kuis.push({
      q: `Manakah pernyataan berikut yang benar tentang ${topic}?`,
      opts,
      ans,
      ex: `Jawaban yang benar berkaitan dengan konsep ${topic}.`,
    });
  }

  return kuis.slice(0, jumlah);
}

function genFlashcard(parsed: ParseResult): FlashcardItem[] {
  const { definitions, enumerations, functions } = parsed;
  const cards: FlashcardItem[] = [];

  // From definitions
  for (const def of definitions) {
    cards.push({
      depan: `Apa yang dimaksud dengan ${def.term}?`,
      belakang: def.meaning,
      hint: `Definisi ${def.term}`,
    });
  }

  // From enumerations
  for (const en of enumerations) {
    cards.push({
      depan: `Apa saja yang termasuk dalam ${en.subject}?`,
      belakang: en.items.join(', '),
      hint: `Enumerasi dari ${en.subject}`,
    });
  }

  // From functions
  for (const fn of functions) {
    cards.push({
      depan: `Apa fungsi dari ${fn.subject}?`,
      belakang: fn.desc,
      hint: `Fungsi ${fn.subject}`,
    });
  }

  return cards;
}

function genSkenario(parsed: ParseResult, meta: { namaBab?: string }): SkenarioChapter[] {
  const { definitions, topWords } = parsed;
  const topic = meta.namaBab || topWords[0] || 'materi';

  const chapters: SkenarioChapter[] = [
    {
      title: `Bab 1: Mengenal ${topic}`,
      setup: `Anda adalah seorang siswa kelas VII yang baru saja pindah ke sebuah sekolah baru. Di sekolah tersebut, terdapat berbagai aturan dan norma yang berlaku. Suatu hari, teman baru Anda mengajak untuk melakukan sesuatu yang bertentangan dengan aturan.`,
      dialog: [
        { speaker: 'Rizki', text: `Halo! Selamat datang di sekolah ini. Kamu harus tahu, di sini kita punya banyak aturan tentang ${topic}.` },
        { speaker: 'Anda', text: `Oh, begitu ya? Apa saja aturannya?` },
        { speaker: 'Rizki', text: `${definitions.length > 0 ? definitions[0].meaning : `Di sekolah ini, semua siswa wajib memahami ${topic.toLowerCase()}.`}` },
      ],
      choices: [
        { text: 'Saya ingin mempelajari lebih lanjut tentang aturan ini', feedback: `Bagus! Semangat belajar ${topic}!`, correct: true },
        { text: 'Saya tidak peduli dengan aturan sekolah', feedback: 'Menjaga norma itu penting untuk keharmonisan bersama.', correct: false },
        { text: 'Saya akan mengikuti apa saja yang teman saya katakan', feedback: 'Penting untuk memahami sendiri, bukan hanya mengikuti orang lain.', correct: false },
      ],
    },
    {
      title: `Bab 2: Penerapan ${topic}`,
      setup: `Beberapa hari kemudian, Anda melihat seorang siswa melanggar norma yang berlaku di sekolah. Anda harus memutuskan apa yang akan Anda lakukan.`,
      dialog: [
        { speaker: 'Sari', text: `Kamu lihat tidak? Ada siswa yang melanggar aturan tentang ${topic}.` },
        { speaker: 'Anda', text: `Ya, saya melihatnya. Apa yang sebaiknya kita lakukan?` },
        { speaker: 'Sari', text: `${definitions.length > 1 ? definitions[1].meaning : `Sebaiknya kita ingatkan dengan baik. Setiap tindakan ada konsekuensinya.`}` },
      ],
      choices: [
        { text: 'Mengingatkan siswa tersebut dengan sopan', feedback: 'Mengingatkan secara baik adalah tindakan yang bijak!', correct: true },
        { text: 'Pura-pura tidak melihat', feedback: 'Ignoransi bisa memperburuk situasi.', correct: false },
        { text: 'Melaporkan langsung kepada guru tanpa mengingatkan', feedback: 'Sebaiknya ingatkan terlebih dahulu sebelum melapor.', correct: false },
      ],
    },
  ];

  return chapters;
}

function genMatching(parsed: ParseResult): MatchingPair[] {
  const { definitions, enumerations } = parsed;
  const pairs: MatchingPair[] = [];

  for (const def of definitions) {
    pairs.push({
      left: def.term,
      right: def.meaning.slice(0, 60) + (def.meaning.length > 60 ? '...' : ''),
    });
  }

  for (const en of enumerations) {
    pairs.push({
      left: en.subject.slice(0, 40),
      right: en.items.slice(0, 3).join(', '),
    });
  }

  return pairs.slice(0, 8);
}

function genTrueFalse(parsed: ParseResult): TrueFalseItem[] {
  const { definitions, functions, topWords } = parsed;
  const items: TrueFalseItem[] = [];

  // True statements from definitions
  for (const def of definitions) {
    items.push({
      statement: `${def.term} adalah ${def.meaning}.`,
      answer: true,
      explanation: `Benar, ${def.term} ${def.meaning}.`,
    });
  }

  // True statements from functions
  for (const fn of functions) {
    items.push({
      statement: `${fn.subject} berfungsi untuk ${fn.desc}.`,
      answer: true,
      explanation: `Benar, ${fn.subject} berfungsi ${fn.desc}.`,
    });
  }

  // False statements (negate definitions)
  for (let i = 0; i < definitions.length && items.length < definitions.length * 2; i++) {
    const def = definitions[i];
    const wrongWord = topWords.find(
      (w) => !def.meaning.toLowerCase().includes(w) && w !== def.term.toLowerCase(),
    );
    if (wrongWord) {
      items.push({
        statement: `${def.term} adalah ${wrongWord}.`,
        answer: false,
        explanation: `Salah, ${def.term} adalah ${def.meaning}.`,
      });
    }
  }

  return items;
}

// ═══════════════════════════════════════════════════════════════════
// Spinner Component
// ═══════════════════════════════════════════════════════════════════

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin h-4 w-4 text-amber-400 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════

export default function AutoGenerate() {
  const store = useAuthoringStore;
  const meta = useAuthoringStore((s) => s.meta);

  // ── Local state ─────────────────────────────────────────────
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [settings, setSettings] = useState<GenSettings>({
    jumlahKuis: 10,
    pertemuan: 3,
    bloomMax: 6,
  });
  const [loading, setLoading] = useState<Set<GenType>>(new Set());
  const [previews, setPreviews] = useState<PreviewData[]>([]);
  const [activePreview, setActivePreview] = useState<PreviewData | null>(null);

  // ── Parse handler ───────────────────────────────────────────
  const handleParse = useCallback(() => {
    if (text.trim().length < 50) {
      toast.error('Teks terlalu pendek. Paste minimal 50 karakter materi.');
      return;
    }
    const result = parse(text);
    setParsed(result);
    setPreviews([]);
    setActivePreview(null);
    toast.success(`✅ Teks diparsing: ${result.wordCount} kata, ${result.definitions.length} definisi ditemukan`);
  }, [text]);

  // ── Generate single type ────────────────────────────────────
  const handleGenerate = useCallback(
    (type: GenType) => {
      if (!parsed) {
        toast.error('Parse teks terlebih dahulu sebelum generate.');
        return;
      }

      setLoading((prev) => new Set(prev).add(type));

      // Simulate async for UX
      setTimeout(() => {
        try {
          let data: unknown;
          let count = 0;
          let label = '';
          let icon = '';

          switch (type) {
            case 'cp': {
              data = genCP(parsed, meta);
              count = 1;
              label = 'Capaian Pembelajaran';
              icon = '📋';
              break;
            }
            case 'tp': {
              data = genTP(parsed, settings);
              count = (data as TpItem[]).length;
              label = 'Tujuan Pembelajaran';
              icon = '🎯';
              break;
            }
            case 'atp': {
              const tps = genTP(parsed, settings);
              data = genATP(tps, meta, settings.pertemuan);
              count = (data as { pertemuan: unknown[] }).pertemuan.length;
              label = 'Alur Tujuan Pembelajaran';
              icon = '📅';
              break;
            }
            case 'alur': {
              const tps = genTP(parsed, settings);
              data = genAlur(tps, meta);
              count = (data as AlurItem[]).length;
              label = 'Alur Kegiatan';
              icon = '🗺️';
              break;
            }
            case 'kuis': {
              data = genKuis(parsed, settings.jumlahKuis);
              count = (data as KuisItem[]).length;
              label = 'Kuis Pilihan Ganda';
              icon = '❓';
              break;
            }
            case 'flashcard': {
              data = genFlashcard(parsed);
              count = (data as FlashcardItem[]).length;
              label = 'Flashcard';
              icon = '🃏';
              break;
            }
            case 'skenario': {
              data = genSkenario(parsed, meta);
              count = (data as SkenarioChapter[]).length;
              label = 'Skenario';
              icon = '🎭';
              break;
            }
            case 'matching': {
              data = genMatching(parsed);
              count = (data as MatchingPair[]).length;
              label = 'Game Matching';
              icon = '🔀';
              break;
            }
            case 'truefalse': {
              data = genTrueFalse(parsed);
              count = (data as TrueFalseItem[]).length;
              label = 'Game Benar/Salah';
              icon = '✅';
              break;
            }
          }

          const preview: PreviewData = { type, label, icon, data, count };
          setPreviews((prev) => {
            const filtered = prev.filter((p) => p.type !== type);
            return [...filtered, preview];
          });
          setActivePreview(preview);
          toast.success(`${icon} ${label} berhasil digenerate (${count} item)`);
        } catch (err) {
          toast.error(`Gagal generate: ${(err as Error).message}`);
        } finally {
          setLoading((prev) => {
            const next = new Set(prev);
            next.delete(type);
            return next;
          });
        }
      }, 300 + Math.random() * 400);
    },
    [parsed, meta, settings],
  );

  // ── Apply to store ──────────────────────────────────────────
  const handleApply = useCallback(
    (preview: PreviewData) => {
      switch (preview.type) {
        case 'cp': {
          const cpData = preview.data as CpState;
          store.getState().updateCp('elemen', cpData.elemen);
          store.getState().updateCp('subElemen', cpData.subElemen);
          store.getState().updateCp('capaianFase', cpData.capaianFase);
          store.getState().updateCp('fase', cpData.fase);
          store.getState().updateCp('kelas', cpData.kelas);
          // Clear and set profil
          const currentState = store.getState().cp;
          for (let i = currentState.profil.length - 1; i >= 0; i--) {
            store.getState().removeProfil(i);
          }
          for (const p of cpData.profil) {
            store.getState().addProfil(p);
          }
          toast.success('📋 CP diterapkan ke Dokumen');
          break;
        }
        case 'tp': {
          const tpData = preview.data as TpItem[];
          // Replace all TPs via setState
          store.setState({ tp: tpData, dirty: true });
          toast.success(`🎯 ${tpData.length} TP diterapkan`);
          break;
        }
        case 'atp': {
          const atpData = preview.data as { namaBab: string; jumlahPertemuan: number; pertemuan: unknown[] };
          store.setState({
            atp: {
              namaBab: atpData.namaBab,
              jumlahPertemuan: atpData.jumlahPertemuan,
              pertemuan: atpData.pertemuan as import('@/store/authoring-store').AtpPertemuan[],
            },
            dirty: true,
          });
          toast.success(`📅 ATP ${atpData.jumlahPertemuan} pertemuan diterapkan`);
          break;
        }
        case 'alur': {
          const alurData = preview.data as AlurItem[];
          store.setState({ alur: alurData, dirty: true });
          toast.success(`🗺️ ${alurData.length} langkah alur diterapkan`);
          break;
        }
        case 'kuis': {
          const kuisData = preview.data as KuisItem[];
          store.setState({ kuis: kuisData, dirty: true });
          toast.success(`❓ ${kuisData.length} soal kuis diterapkan`);
          break;
        }
        case 'skenario': {
          const skenarioData = preview.data as SkenarioChapter[];
          store.getState().setSkenario(skenarioData as unknown as Array<Record<string, unknown>>);
          toast.success(`🎭 ${skenarioData.length} bab skenario diterapkan`);
          break;
        }
        case 'flashcard': {
          const flashData = preview.data as FlashcardItem[];
          const currentGames = store.getState().games;
          const updated = currentGames.filter((g) => (g as Record<string, unknown>).type !== 'flashcard');
          updated.push({ type: 'flashcard', data: flashData });
          store.setState({ games: updated, dirty: true });
          toast.success(`🃏 ${flashData.length} flashcard diterapkan`);
          break;
        }
        case 'matching': {
          const matchData = preview.data as MatchingPair[];
          const currentGames = store.getState().games;
          const updated = currentGames.filter((g) => (g as Record<string, unknown>).type !== 'matching');
          updated.push({ type: 'matching', data: matchData });
          store.setState({ games: updated, dirty: true });
          toast.success(`🔀 ${matchData.length} pasangan matching diterapkan`);
          break;
        }
        case 'truefalse': {
          const tfData = preview.data as TrueFalseItem[];
          const currentGames = store.getState().games;
          const updated = currentGames.filter((g) => (g as Record<string, unknown>).type !== 'truefalse');
          updated.push({ type: 'truefalse', data: tfData });
          store.setState({ games: updated, dirty: true });
          toast.success(`✅ ${tfData.length} soal benar/salah diterapkan`);
          break;
        }
      }
    },
    [],
  );

  // ── Generate all ────────────────────────────────────────────
  const handleGenerateAll = useCallback(async () => {
    if (!parsed) {
      toast.error('Parse teks terlebih dahulu sebelum generate.');
      return;
    }

    const types: GenType[] = ['cp', 'tp', 'atp', 'alur', 'kuis', 'flashcard', 'skenario', 'matching', 'truefalse'];
    setLoading(new Set(types));
    toast.info('⚡ Generating semua konten...');

    const allPreviews: PreviewData[] = [];
    let delay = 0;

    for (const type of types) {
      setTimeout(() => {
        try {
          let data: unknown;
          let count = 0;
          let label = '';
          let icon = '';

          switch (type) {
            case 'cp':
              data = genCP(parsed, meta); count = 1; label = 'Capaian Pembelajaran'; icon = '📋'; break;
            case 'tp':
              data = genTP(parsed, settings); count = (data as TpItem[]).length; label = 'Tujuan Pembelajaran'; icon = '🎯'; break;
            case 'atp': {
              const tps = genTP(parsed, settings);
              data = genATP(tps, meta, settings.pertemuan);
              count = (data as { pertemuan: unknown[] }).pertemuan.length;
              label = 'Alur Tujuan Pembelajaran'; icon = '📅'; break;
            }
            case 'alur': {
              const tps = genTP(parsed, settings);
              data = genAlur(tps, meta);
              count = (data as AlurItem[]).length;
              label = 'Alur Kegiatan'; icon = '🗺️'; break;
            }
            case 'kuis':
              data = genKuis(parsed, settings.jumlahKuis); count = (data as KuisItem[]).length; label = 'Kuis Pilihan Ganda'; icon = '❓'; break;
            case 'flashcard':
              data = genFlashcard(parsed); count = (data as FlashcardItem[]).length; label = 'Flashcard'; icon = '🃏'; break;
            case 'skenario':
              data = genSkenario(parsed, meta); count = (data as SkenarioChapter[]).length; label = 'Skenario'; icon = '🎭'; break;
            case 'matching':
              data = genMatching(parsed); count = (data as MatchingPair[]).length; label = 'Game Matching'; icon = '🔀'; break;
            case 'truefalse':
              data = genTrueFalse(parsed); count = (data as TrueFalseItem[]).length; label = 'Game Benar/Salah'; icon = '✅'; break;
          }

          allPreviews.push({ type, label, icon, data, count });

          if (allPreviews.length === types.length) {
            setPreviews(allPreviews);
            setActivePreview(allPreviews[0]);
            setLoading(new Set());
            toast.success(`⚡ Semua ${allPreviews.length} konten berhasil digenerate!`);
          }
        } catch (err) {
          console.error(`Error generating ${type}:`, err);
          if (allPreviews.length === types.length - 1) {
            setPreviews(allPreviews);
            setLoading(new Set());
          }
        }
      }, delay);
      delay += 200 + Math.random() * 200;
    }
  }, [parsed, meta, settings]);

  // ── Apply all ───────────────────────────────────────────────
  const handleApplyAll = useCallback(() => {
    if (previews.length === 0) {
      toast.error('Belum ada konten yang di-generate.');
      return;
    }
    for (const p of previews) {
      handleApply(p);
    }
    toast.success('⚡ Semua konten berhasil diterapkan ke proyek!');
  }, [previews, handleApply]);

  // ── Parsed stats ────────────────────────────────────────────
  const parsedStats = useMemo(() => {
    if (!parsed) return null;
    return [
      { label: 'Kata', value: parsed.wordCount, icon: '📝' },
      { label: 'Kalimat', value: parsed.sentences.length, icon: '📄' },
      { label: 'Definisi', value: parsed.definitions.length, icon: '📖' },
      { label: 'Enumerasi', value: parsed.enumerations.length, icon: '📋' },
      { label: 'Fungsi', value: parsed.functions.length, icon: '⚙️' },
      { label: 'Sebab-Akibat', value: parsed.causes.length, icon: '🔗' },
      { label: 'Kata Utama', value: parsed.topWords.length, icon: '🔑' },
    ];
  }, [parsed]);

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <span>⚡</span> Auto-Generate
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Paste teks materi sekali → generate bertahap per section.
        </p>
      </div>

      {/* ── Step 1: Text Input ──────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">1</span>
            Paste Materi
          </h3>
          <span className="text-xs text-zinc-500">
            {text.length > 0 ? `${text.split(/\s+/).filter(Boolean).length} kata` : 'Belum ada teks'}
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Paste teks materi PPKn di sini...\n\nContoh:\nNorma adalah aturan atau pedoman tingkah laku dalam kehidupan bermasyarakat. Norma berfungsi untuk menciptakan ketertiban dan ketenteraman dalam masyarakat. Norma terdiri dari empat jenis, yaitu norma agama, norma kesusilaan, norma kesopanan, dan norma hukum. Norma agama bersumber dari keyakinan tentang perintah dan larangan Tuhan. Norma hukum memiliki sanksi yang paling tegas karena diberlakukan oleh negara.`}
          rows={8}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-y min-h-[160px]"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleParse}
            disabled={text.trim().length < 50}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            🔍 Parse Teks
          </button>
          <button
            onClick={() => {
              setText('');
              setParsed(null);
              setPreviews([]);
              setActivePreview(null);
            }}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded-lg transition-colors"
          >
            🗑️ Bersihkan
          </button>
          <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
            {text.trim().length < 50 && text.length > 0 && (
              <span>Minimal 50 karakter (saat ini: {text.trim().length})</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Step 2: Settings ────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">2</span>
          Pengaturan Generate
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Jumlah Kuis */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Jumlah Soal Kuis</label>
            <select
              value={settings.jumlahKuis}
              onChange={(e) => setSettings((s) => ({ ...s, jumlahKuis: parseInt(e.target.value) }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
            >
              {[5, 10, 15, 20, 25, 30].map((n) => (
                <option key={n} value={n}>{n} soal</option>
              ))}
            </select>
          </div>
          {/* Pertemuan */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Jumlah Pertemuan</label>
            <select
              value={settings.pertemuan}
              onChange={(e) => setSettings((s) => ({ ...s, pertemuan: parseInt(e.target.value) }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n} pertemuan</option>
              ))}
            </select>
          </div>
          {/* Bloom Level */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Level Bloom Maksimal</label>
            <select
              value={settings.bloomMax}
              onChange={(e) => setSettings((s) => ({ ...s, bloomMax: parseInt(e.target.value) }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
            >
              <option value={1}>C1 – Mengingat</option>
              <option value={2}>C2 – Memahami</option>
              <option value={3}>C3 – Menerapkan</option>
              <option value={4}>C4 – Menganalisis</option>
              <option value={5}>C5 – Mengevaluasi</option>
              <option value={6}>C6 – Menciptakan</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Parsed Stats ────────────────────────────────────── */}
      {parsedStats && parsed && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center font-bold">✓</span>
            Hasil Parse
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {parsedStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 text-center"
              >
                <div className="text-lg mb-1">{stat.icon}</div>
                <div className="text-lg font-bold text-zinc-100">{stat.value}</div>
                <div className="text-[0.65rem] text-zinc-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
          {/* Top words */}
          {parsed.topWords.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">Kata kunci terdeteksi:</p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.topWords.slice(0, 15).map((w, i) => (
                  <span
                    key={w + i}
                    className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-md text-xs text-zinc-300"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Definitions preview */}
          {parsed.definitions.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">Definisi terdeteksi:</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {parsed.definitions.map((d, i) => (
                  <div key={i} className="text-xs text-zinc-300 bg-zinc-800/50 rounded-lg px-3 py-2">
                    <span className="font-semibold text-amber-400">{d.term}</span>
                    {' → '}
                    <span className="text-zinc-400">{d.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Generate Buttons ────────────────────────── */}
      {parsed && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">3</span>
              Generate Konten
            </h3>
            <button
              onClick={handleGenerateAll}
              disabled={loading.size > 0}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              {loading.size > 0 ? <Spinner /> : '⚡'}
              {loading.size > 0 ? `Generating ${loading.size}...` : 'Generate Semua'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {GEN_BUTTONS.map((btn) => {
              const isLoading = loading.has(btn.type);
              const preview = previews.find((p) => p.type === btn.type);
              const isActive = activePreview?.type === btn.type;

              return (
                <button
                  key={btn.type}
                  onClick={() => {
                    if (!preview) {
                      handleGenerate(btn.type);
                    } else {
                      setActivePreview(preview);
                    }
                  }}
                  disabled={isLoading}
                  className={`relative bg-zinc-800 border rounded-xl p-4 text-left transition-all hover:border-zinc-600 hover:bg-zinc-800/80 disabled:opacity-50 ${
                    isActive
                      ? 'border-amber-500/50 ring-1 ring-amber-500/30'
                      : 'border-zinc-700/50'
                  } ${preview ? 'ring-1 ring-green-500/20 border-green-500/30' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xl">{btn.icon}</span>
                    {preview && (
                      <span className="text-[0.6rem] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-semibold">
                        ✓ {preview.count}
                      </span>
                    )}
                    {isLoading && <Spinner />}
                  </div>
                  <p className="text-xs font-medium text-zinc-200 mt-2.5 leading-tight">
                    {btn.label}
                  </p>
                  {!preview && !isLoading && (
                    <p className="text-[0.6rem] text-zinc-500 mt-1">Klik untuk generate</p>
                  )}
                  {preview && !isLoading && (
                    <p className="text-[0.6rem] text-green-400 mt-1">Klik untuk lihat preview</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Preview Panel ───────────────────────────────────── */}
      {activePreview && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <span>{activePreview.icon}</span>
              Preview: {activePreview.label}
              <span className="text-xs text-zinc-500 font-normal">({activePreview.count} item)</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApply(activePreview)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                ✅ Terapkan ke Proyek
              </button>
              {previews.length > 1 && (
                <button
                  onClick={handleApplyAll}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition-colors"
                >
                  ⚡ Terapkan Semua ({previews.length})
                </button>
              )}
            </div>
          </div>

          {/* Preview tabs */}
          {previews.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {previews.map((p) => (
                <button
                  key={p.type}
                  onClick={() => setActivePreview(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                    activePreview.type === p.type
                      ? 'bg-amber-500/15 text-amber-400 font-semibold'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Preview content */}
          <div className="max-h-[480px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {renderPreviewContent(activePreview)}
          </div>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────── */}
      {!parsed && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">Paste materi untuk memulai</h3>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto">
            Salin teks materi PPKn dari buku atau sumber lain, lalu paste di kolom di atas.
            Sistem akan otomatis mem-parsing dan meng-generate berbagai jenis konten pembelajaran.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded">📝 Paste</span>
            <span className="text-zinc-600">→</span>
            <span className="inline-flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded">🔍 Parse</span>
            <span className="text-zinc-600">→</span>
            <span className="inline-flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded">⚡ Generate</span>
            <span className="text-zinc-600">→</span>
            <span className="inline-flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded">✅ Terapkan</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Preview Renderer
// ═══════════════════════════════════════════════════════════════════

function renderPreviewContent(preview: PreviewData) {
  switch (preview.type) {
    case 'cp':
      return <CpPreview data={preview.data as CpState} />;
    case 'tp':
      return <TpPreview data={preview.data as TpItem[]} />;
    case 'atp':
      return <AtpPreview data={preview.data as import('@/store/authoring-store').AtpState} />;
    case 'alur':
      return <AlurPreview data={preview.data as AlurItem[]} />;
    case 'kuis':
      return <KuisPreview data={preview.data as KuisItem[]} />;
    case 'flashcard':
      return <FlashcardPreview data={preview.data as FlashcardItem[]} />;
    case 'skenario':
      return <SkenarioPreview data={preview.data as SkenarioChapter[]} />;
    case 'matching':
      return <MatchingPreview data={preview.data as MatchingPair[]} />;
    case 'truefalse':
      return <TrueFalsePreview data={preview.data as TrueFalseItem[]} />;
    default:
      return <p className="text-sm text-zinc-400">Preview tidak tersedia</p>;
  }
}

// ── Individual Preview Components ─────────────────────────────────

function CpPreview({ data }: { data: CpState }) {
  return (
    <div className="space-y-3">
      <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Elemen</p>
            <p className="text-sm text-zinc-200">{data.elemen || '-'}</p>
          </div>
          <div>
            <p className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Sub Elemen</p>
            <p className="text-sm text-zinc-200">{data.subElemen || '-'}</p>
          </div>
          <div>
            <p className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Fase</p>
            <p className="text-sm text-zinc-200">Fase {data.fase}</p>
          </div>
          <div>
            <p className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Kelas</p>
            <p className="text-sm text-zinc-200">{data.kelas || '-'}</p>
          </div>
        </div>
      </div>
      <div className="bg-zinc-800/50 rounded-lg p-4">
        <p className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-2">Capaian Fase</p>
        <p className="text-sm text-zinc-200 leading-relaxed">{data.capaianFase}</p>
      </div>
      <div className="bg-zinc-800/50 rounded-lg p-4">
        <p className="text-[0.65rem] text-zinc-500 uppercase tracking-wider mb-2">Profil Pelajar Pancasila</p>
        <div className="flex flex-wrap gap-1.5">
          {data.profil.map((p, i) => (
            <span key={i} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TpPreview({ data }: { data: TpItem[] }) {
  return (
    <div className="space-y-2">
      {data.map((tp, i) => (
        <div key={i} className="bg-zinc-800/50 rounded-lg p-3 flex items-start gap-3">
          <span
            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
            style={{ backgroundColor: tp.color }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: tp.color + '20',
                  color: tp.color,
                }}
              >
                TP {i + 1}
              </span>
              <span className="text-xs text-zinc-400 bg-zinc-700/50 px-1.5 py-0.5 rounded">
                Pertemuan {tp.pertemuan}
              </span>
            </div>
            <p className="text-sm text-zinc-200 mt-1">
              <span className="font-semibold text-amber-400">{tp.verb}</span>{' '}
              {tp.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AtpPreview({ data }: { data: import('@/store/authoring-store').AtpState }) {
  return (
    <div className="space-y-3">
      <div className="bg-zinc-800/50 rounded-lg p-3">
        <p className="text-xs text-zinc-500">Nama Bab</p>
        <p className="text-sm font-medium text-zinc-200">{data.namaBab || '-'}</p>
      </div>
      {data.pertemuan.map((p, i) => (
        <div key={i} className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded">
              Pertemuan {i + 1}
            </span>
            <span className="text-xs text-zinc-500">{p.durasi}</span>
          </div>
          <p className="text-sm font-semibold text-zinc-200">{p.judul}</p>
          <div className="space-y-1">
            <p className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Tujuan Pembelajaran</p>
            <p className="text-xs text-zinc-300">{p.tp}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Kegiatan</p>
            <p className="text-xs text-zinc-300">{p.kegiatan}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Penilaian</p>
            <p className="text-xs text-zinc-300">{p.penilaian}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AlurPreview({ data }: { data: AlurItem[] }) {
  const faseColors: Record<string, string> = {
    Pendahuluan: 'text-green-400',
    Inti: 'text-purple-400',
    Penutup: 'text-amber-400',
  };
  return (
    <div className="space-y-2">
      {data.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center mt-1">
            <div className={`w-3 h-3 rounded-full ${step.fase === 'Pendahuluan' ? 'bg-green-500' : step.fase === 'Inti' ? 'bg-purple-500' : 'bg-amber-500'}`} />
            {i < data.length - 1 && <div className="w-px h-full min-h-[40px] bg-zinc-700" />}
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold ${faseColors[step.fase] || 'text-zinc-400'}`}>
                {step.fase}
              </span>
              <span className="text-xs text-zinc-500">• {step.durasi}</span>
            </div>
            <p className="text-sm font-medium text-zinc-200 mt-1">{step.judul}</p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{step.deskripsi}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function KuisPreview({ data }: { data: KuisItem[] }) {
  return (
    <div className="space-y-4">
      {data.map((k, i) => (
        <div key={i} className="bg-zinc-800/50 rounded-lg p-4 space-y-2.5">
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded flex-shrink-0">
              {i + 1}
            </span>
            <p className="text-sm font-medium text-zinc-200">{k.q}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-8">
            {k.opts.map((opt, oi) => (
              <div
                key={oi}
                className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                  oi === k.ans
                    ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                    : 'bg-zinc-700/30 text-zinc-400'
                }`}
              >
                <span className="font-mono text-[0.6rem]">{String.fromCharCode(65 + oi)}.</span>
                {opt}
                {oi === k.ans && <span className="ml-auto text-green-400">✓</span>}
              </div>
            ))}
          </div>
          {k.ex && (
            <p className="text-xs text-zinc-500 ml-8 italic">💡 {k.ex}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function FlashcardPreview({ data }: { data: FlashcardItem[] }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {data.slice(0, 12).map((card, i) => (
        <button
          key={i}
          onClick={() =>
            setFlipped((prev) => {
              const next = new Set(prev);
              if (next.has(i)) next.delete(i);
              else next.add(i);
              return next;
            })
          }
          className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 text-left hover:border-zinc-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.6rem] text-zinc-500 uppercase tracking-wider">
              {flipped.has(i) ? 'Belakang' : 'Depan'}
            </span>
            <span className="text-[0.6rem] text-zinc-600">{card.hint}</span>
          </div>
          <p className="text-sm text-zinc-200">
            {flipped.has(i) ? card.belakang : card.depan}
          </p>
        </button>
      ))}
      {data.length > 12 && (
        <div className="text-xs text-zinc-500 col-span-full text-center py-2">
          +{data.length - 12} flashcard lainnya...
        </div>
      )}
    </div>
  );
}

function SkenarioPreview({ data }: { data: SkenarioChapter[] }) {
  return (
    <div className="space-y-4">
      {data.map((chapter, ci) => (
        <div key={ci} className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-zinc-200">{chapter.title}</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">{chapter.setup}</p>

          {/* Dialog */}
          <div className="space-y-1.5">
            <p className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Dialog</p>
            {chapter.dialog.map((d, di) => (
              <div key={di} className="flex items-start gap-2">
                <span className="text-xs font-semibold text-amber-400 flex-shrink-0 min-w-[60px]">
                  {d.speaker}:
                </span>
                <p className="text-xs text-zinc-300">&ldquo;{d.text}&rdquo;</p>
              </div>
            ))}
          </div>

          {/* Choices */}
          <div className="space-y-1.5">
            <p className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Pilihan</p>
            {chapter.choices.map((c, chi) => (
              <div
                key={chi}
                className={`text-xs px-3 py-2 rounded-lg ${
                  c.correct
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-zinc-700/30'
                }`}
              >
                <p className={`font-medium ${c.correct ? 'text-green-300' : 'text-zinc-400'}`}>
                  {c.correct ? '✅ ' : '⬜ '}{c.text}
                </p>
                <p className="text-zinc-500 mt-0.5 italic">{c.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchingPreview({ data }: { data: MatchingPair[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">
        {data.length} pasangan yang akan dicocokkan. Siswa mencocokkan kolom kiri dengan kolom kanan.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Kolom Kiri</p>
          {data.map((p, i) => (
            <div key={i} className="bg-zinc-800/50 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-zinc-200">
              {p.left}
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <p className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Kolom Kanan (Acak)</p>
          {[...data].sort(() => Math.random() - 0.5).map((p, i) => (
            <div key={i} className="bg-zinc-800/50 border border-cyan-500/20 rounded-lg px-3 py-2 text-xs text-zinc-200">
              {p.right}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrueFalsePreview({ data }: { data: TrueFalseItem[] }) {
  return (
    <div className="space-y-2">
      {data.slice(0, 12).map((item, i) => (
        <div
          key={i}
          className={`bg-zinc-800/50 border rounded-lg p-3 flex items-start gap-3 ${
            item.answer
              ? 'border-green-500/20'
              : 'border-red-500/20'
          }`}
        >
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${
              item.answer
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {item.answer ? 'BENAR' : 'SALAH'}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-zinc-200">{item.statement}</p>
            <p className="text-xs text-zinc-500 mt-1 italic">💡 {item.explanation}</p>
          </div>
        </div>
      ))}
      {data.length > 12 && (
        <div className="text-xs text-zinc-500 text-center py-2">
          +{data.length - 12} soal lainnya...
        </div>
      )}
    </div>
  );
}
