// ═══════════════════════════════════════════════════════════════════
// Generators — All gen* functions for auto-generating content
// ═══════════════════════════════════════════════════════════════════

import type { CpState, TpItem, AlurItem, KuisItem, MateriBlok, DiskusiData, DiskusiPertanyaan, RefleksiData, RefleksiPertanyaan } from '@/store/authoring-store';
import type {
  ParseResult,
  GenSettings,
  FlashcardItem,
  MatchingPair,
  TrueFalseItem,
  SkenarioChapter,
} from './types';
import { BLOOM_VERBS, COLOR_PALETTE } from './constants';

export function genCP(parsed: ParseResult, meta: { namaBab?: string; kelas?: string; mapel?: string }): CpState {
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

export function genTP(parsed: ParseResult, opts: GenSettings): TpItem[] {
  const { definitions, enumerations, functions, topWords, sentences } = parsed;
  const { pertemuan, bloomMax } = opts;
  const tps: TpItem[] = [];
  let idx = 0;

  // C1: Definitions → Menyebutkan / Mendefinisikan
  for (const def of definitions) {
    if (idx >= bloomMax) break;
    const verb = BLOOM_VERBS[1]![idx % BLOOM_VERBS[1]!.length]!;
    const pert = Math.min(Math.ceil((idx + 1) / 2), pertemuan);
    tps.push({
      verb,
      desc: `pengertian ${def.term.toLowerCase()} yaitu ${def.meaning.toLowerCase()}`,
      pertemuan: pert,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length]!,
    });
    idx++;
  }

  // C2: Enumerations → Menjelaskan / Mendeskripsikan
  if (2 <= bloomMax) {
    for (const en of enumerations) {
      if (idx >= bloomMax) break;
      const verb = BLOOM_VERBS[2]![idx % BLOOM_VERBS[2]!.length]!;
      const pert = Math.min(Math.ceil((idx + 1) / 2), pertemuan);
      tps.push({
        verb,
        desc: `${en.items.slice(0, 3).join(', ')} sebagai bagian dari ${en.subject.toLowerCase()}`,
        pertemuan: pert,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length]!,
      });
      idx++;
    }
  }

  // C3: Functions → Menerapkan / Menggunakan
  if (3 <= bloomMax) {
    for (const fn of functions) {
      if (idx >= bloomMax) break;
      const verb = BLOOM_VERBS[3]![idx % BLOOM_VERBS[3]!.length]!;
      const pert = Math.min(Math.ceil((idx + 1) / 2), pertemuan);
      tps.push({
        verb,
        desc: `${fn.desc.toLowerCase()} dalam konteks ${fn.subject.toLowerCase()}`,
        pertemuan: pert,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length]!,
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
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length]!,
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
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length]!,
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
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length]!,
    });
  }

  // Fallback: at least 3 TPs
  if (tps.length < 3 && sentences.length > 0) {
    while (tps.length < 3) {
      const s = sentences[tps.length % sentences.length]!;
      const pert = Math.min(tps.length + 1, pertemuan);
      tps.push({
        verb: BLOOM_VERBS[Math.min(tps.length + 1, 6)]![tps.length % 5]!,
        desc: s.slice(0, 120).toLowerCase(),
        pertemuan: pert,
        color: COLOR_PALETTE[tps.length % COLOR_PALETTE.length]!,
      });
    }
  }

  return tps;
}

export function genATP(tps: TpItem[], meta: { namaBab?: string; durasi?: string }, pertemuan: number) {
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
        ? `${group[0]!.verb} ${group[0]!.desc.split(' ').slice(0, 4).join(' ')}...`
        : `Pertemuan ${i}`,
      tp: tpText || `Pertemuan ${i}`,
      durasi: meta.durasi || '2×40 menit',
      kegiatan: kegiatanTemplates[(i - 1) % kegiatanTemplates.length]!,
      penilaian: i % 2 === 0 ? 'Kuis + Observasi' : 'Diskusi + Portofolio',
    });
  }

  return {
    namaBab: meta.namaBab || 'Bab',
    jumlahPertemuan: pertemuan,
    pertemuan: pertemuanList,
  };
}

export function genAlur(tps: TpItem[], meta: { durasi?: string }, totalMinutes = 80): AlurItem[] {
  const steps: AlurItem[] = [];

  // Pendahuluan: 10-15 min
  steps.push({
    fase: 'Pendahuluan',
    durasi: '10 menit',
    judul: 'Apersepsi & Motivasi',
    deskripsi: `Guru menyapa peserta didik, memeriksa kesiapan belajar, dan mengajukan pertanyaan pemantik terkait ${tps.length > 0 ? tps[0]!.desc.slice(0, 60) : 'materi'}.`,
  });

  // Inti steps: distribute time among TPs
  const intiMinutes = totalMinutes - 10 - 10; // minus pendahuluan & penutup
  const intiTpCount = Math.max(tps.length, 2);
  const minutesPerStep = Math.floor(intiMinutes / intiTpCount);

  if (tps.length > 0) {
    tps.slice(0, intiTpCount).forEach((tp) => {
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

export function genKuis(parsed: ParseResult, jumlah: number, jumlahPertemuan: number = 1): KuisItem[] {
  const { definitions, enumerations, functions, causes, topWords, sentences } = parsed;
  const kuis: KuisItem[] = [];
  // Distribute soal evenly across pertemuan
  const soalPerPertemuan = Math.ceil(jumlah / jumlahPertemuan);

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
    const idx = kuis.length;
    kuis.push({
      q: `${def.term} adalah ...`,
      opts,
      ans,
      ex: `${def.term} ${def.meaning}.`,
      pertemuan: Math.min(Math.floor(idx / soalPerPertemuan) + 1, jumlahPertemuan),
    });
  }

  // Pattern 2: From enumerations
  for (const en of enumerations) {
    if (kuis.length >= jumlah) break;
    const correctItem = en.items[0] ?? '';
    const wrongs = makeWrongOpts(correctItem, en.items);
    const { opts, ans } = shuffleInsert(correctItem, wrongs);
    const idx = kuis.length;
    kuis.push({
      q: `Berikut ini yang termasuk ${en.subject.toLowerCase()} adalah ...`,
      opts,
      ans,
      ex: `${en.subject} terdiri dari ${en.items.join(', ')}.`,
      pertemuan: Math.min(Math.floor(idx / soalPerPertemuan) + 1, jumlahPertemuan),
    });
  }

  // Pattern 3: From functions
  for (const fn of functions) {
    if (kuis.length >= jumlah) break;
    const wrongs = makeWrongOpts(fn.desc, [fn.subject]);
    const { opts, ans } = shuffleInsert(fn.desc, wrongs);
    const idx = kuis.length;
    kuis.push({
      q: `${fn.subject} berfungsi untuk ...`,
      opts,
      ans,
      ex: `${fn.subject} berfungsi ${fn.desc}.`,
      pertemuan: Math.min(Math.floor(idx / soalPerPertemuan) + 1, jumlahPertemuan),
    });
  }

  // Pattern 4: From causes
  for (const c of causes) {
    if (kuis.length >= jumlah) break;
    const wrongs = makeWrongOpts(c.effect, [c.cause]);
    const { opts, ans } = shuffleInsert(c.effect, wrongs);
    const idx = kuis.length;
    kuis.push({
      q: `Apa yang terjadi ${c.cause ? `karena ${c.cause.toLowerCase().slice(0, 40)}` : 'dalam materi berikut'} ...`,
      opts,
      ans,
      ex: `${c.cause} menyebabkan ${c.effect}.`,
      pertemuan: Math.min(Math.floor(idx / soalPerPertemuan) + 1, jumlahPertemuan),
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
    const idx = kuis.length;
    kuis.push({
      q: `Pernyataan yang benar mengenai ${keyWord} adalah ...`,
      opts,
      ans,
      ex: correct,
      pertemuan: Math.min(Math.floor(idx / soalPerPertemuan) + 1, jumlahPertemuan),
    });
  }

  // Pattern 6: General
  while (kuis.length < jumlah) {
    const topic = topWords[kuis.length % topWords.length] || 'materi';
    const correct = `Pernyataan yang sesuai dengan konsep ${topic}`;
    const wrongs = makeWrongOpts(correct);
    const { opts, ans } = shuffleInsert(correct, wrongs);
    const idx = kuis.length;
    kuis.push({
      q: `Manakah pernyataan berikut yang benar tentang ${topic}?`,
      opts,
      ans,
      ex: `Jawaban yang benar berkaitan dengan konsep ${topic}.`,
      pertemuan: Math.min(Math.floor(idx / soalPerPertemuan) + 1, jumlahPertemuan),
    });
  }

  return kuis.slice(0, jumlah);
}

export function genFlashcard(parsed: ParseResult): FlashcardItem[] {
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

export function genSkenario(parsed: ParseResult, meta: { namaBab?: string }): SkenarioChapter[] {
  const { definitions, topWords } = parsed;
  const topic = meta.namaBab || topWords[0] || 'materi';

  const chapters: SkenarioChapter[] = [
    {
      title: `Bab 1: Mengenal ${topic}`,
      setup: `Anda adalah seorang siswa kelas VII yang baru saja pindah ke sebuah sekolah baru. Di sekolah tersebut, terdapat berbagai aturan dan norma yang berlaku. Suatu hari, teman baru Anda mengajak untuk melakukan sesuatu yang bertentangan dengan aturan.`,
      dialog: [
        { speaker: 'Rizki', text: `Halo! Selamat datang di sekolah ini. Kamu harus tahu, di sini kita punya banyak aturan tentang ${topic}.` },
        { speaker: 'Anda', text: `Oh, begitu ya? Apa saja aturannya?` },
        { speaker: 'Rizki', text: `${definitions.length > 0 ? definitions[0]!.meaning : `Di sekolah ini, semua siswa wajib memahami ${topic.toLowerCase()}.`}` },
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
        { speaker: 'Sari', text: `${definitions.length > 1 ? definitions[1]!.meaning : `Sebaiknya kita ingatkan dengan baik. Setiap tindakan ada konsekuensinya.`}` },
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

export function genMatching(parsed: ParseResult): MatchingPair[] {
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

export function genTrueFalse(parsed: ParseResult): TrueFalseItem[] {
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
    const def = definitions[i]!;
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

export function genMateri(parsed: ParseResult, meta: { judulPertemuan: string; namaBab: string }): MateriBlok[] {
  const { definitions, enumerations, functions, causes, topWords, sentences } = parsed;
  const bloks: MateriBlok[] = [];

  // Intro block from first 2 sentences of text
  const introText = sentences.slice(0, 2).join(' ');
  bloks.push({
    tipe: 'teks',
    judul: meta.judulPertemuan || 'Materi Pembelajaran',
    isi: introText || `Materi tentang ${meta.namaBab || topWords[0] || 'pembelajaran'}.`,
  });

  // Definitions → definisi blocks
  for (const def of definitions) {
    bloks.push({
      tipe: 'definisi',
      judul: def.term,
      isi: def.meaning,
    });
  }

  // Enumerations → poin blocks
  for (const en of enumerations) {
    bloks.push({
      tipe: 'poin',
      judul: en.subject,
      butir: en.items,
    });
  }

  // Functions → highlight blocks
  for (const fn of functions) {
    bloks.push({
      tipe: 'highlight',
      judul: fn.subject,
      isi: fn.desc,
      warna: 'blue',
    });
  }

  // Causes → compare blocks
  for (const c of causes) {
    bloks.push({
      tipe: 'compare',
      judul: 'Sebab-Akibat',
      kiri: { isi: c.cause },
      kanan: { isi: c.effect },
    });
  }

  // Summary infobox
  const summaryWords = topWords.slice(0, 5).join(', ');
  bloks.push({
    tipe: 'infobox',
    judul: 'Ringkasan',
    isi: `Poin penting dari materi ini: ${summaryWords}. Pahami konsep-konsep tersebut dan hubungkan dengan kehidupan sehari-hari.`,
  });

  return bloks;
}

export function genDiskusi(parsed: ParseResult, tp: { desc: string }[], meta: { judulPertemuan: string; namaBab: string }): DiskusiData {
  const { definitions, enumerations, functions, causes, topWords, sentences } = parsed;
  const pertanyaan: DiskusiPertanyaan[] = [];
  const labels = ['Pertanyaan 1', 'Pertanyaan 2', 'Pertanyaan 3', 'Pertanyaan 4', 'Pertanyaan 5'];
  const icons = ['💭', '🤔', '🗣️', '👥', '✋'];
  const topic = meta.namaBab || topWords[0] || 'materi';

  // Pattern 1: From definitions (C2 — Menjelaskan)
  for (const def of definitions.slice(0, 2)) {
    if (pertanyaan.length >= 5) break;
    pertanyaan.push({
      label: labels[pertanyaan.length] ?? '',
      icon: icons[pertanyaan.length] ?? '',
      teks: `Jelaskan apa yang dimaksud dengan ${def.term}! Berikan contoh penerapannya dalam kehidupan sehari-hari.`,
      petunjuk: `Gunakan definisi "${def.term}" sebagai dasar jawaban, lalu hubungkan dengan pengalamanmu sendiri.`,
    });
  }

  // Pattern 2: From enumerations (C1 + C2)
  for (const en of enumerations.slice(0, 1)) {
    if (pertanyaan.length >= 5) break;
    pertanyaan.push({
      label: labels[pertanyaan.length] ?? '',
      icon: icons[pertanyaan.length] ?? '',
      teks: `Sebutkan dan diskusikan ${en.subject}! Mana yang paling relevan dengan kehidupan kalian? Mengapa?`,
      petunjuk: `Pertimbangkan masing-masing poin, pilih yang paling relevan, dan berikan alasan.`,
    });
  }

  // Pattern 3: From functions (C4 — Menganalisis)
  for (const fn of functions.slice(0, 1)) {
    if (pertanyaan.length >= 5) break;
    pertanyaan.push({
      label: labels[pertanyaan.length] ?? '',
      icon: icons[pertanyaan.length] ?? '',
      teks: `Mengapa ${fn.subject} berfungsi untuk ${fn.desc.toLowerCase()}? Apa yang terjadi jika fungsi tersebut tidak berjalan?`,
      petunjuk: `Analisis peran ${fn.subject} dan bayangkan konsekuensi tanpa fungsi tersebut.`,
    });
  }

  // Pattern 4: From causes (C4 — Menganalisis sebab-akibat)
  for (const c of causes.slice(0, 1)) {
    if (pertanyaan.length >= 5) break;
    pertanyaan.push({
      label: labels[pertanyaan.length] ?? '',
      icon: icons[pertanyaan.length] ?? '',
      teks: `Diskusikan hubungan sebab-akibat: "${c.cause}" menyebabkan "${c.effect}". Apa bisa terjadi sebaliknya?`,
      petunjuk: `Pikirkan apakah hubungan ini selalu satu arah, atau bisa berlaku dua arah.`,
    });
  }

  // Pattern 5: From TP
  for (const t of tp.slice(0, 1)) {
    if (pertanyaan.length >= 5) break;
    pertanyaan.push({
      label: labels[pertanyaan.length] ?? '',
      icon: icons[pertanyaan.length] ?? '',
      teks: `Bagaimana ${t.desc}? Diskusikan dengan teman sekelasmu dan berikan contoh konkret!`,
      petunjuk: `Hubungkan dengan pengalaman pribadimu dan lingkungan sekitarmu.`,
    });
  }

  // Pattern 6: Setuju/tidak (C5 — Mengevaluasi)
  if (pertanyaan.length < 5 && sentences.length > 0) {
    const keySentence = sentences.find(s => s.length > 30 && s.length < 120);
    if (keySentence) {
      pertanyaan.push({
        label: labels[pertanyaan.length] ?? '',
        icon: icons[pertanyaan.length] ?? '',
        teks: `Setuju atau tidak dengan pernyataan berikut? Mengapa? "${keySentence}"`,
        petunjuk: `Berikan argumen yang logis untuk mendukung posisimu, baik setuju maupun tidak.`,
      });
    }
  }

  // Fallback
  if (pertanyaan.length < 2) {
    pertanyaan.push({
      label: 'Pertanyaan 1',
      icon: '💭',
      teks: `Apa hal terpenting yang kamu ketahui tentang ${topic}? Diskusikan!`,
      petunjuk: `Tuliskan pemahamanmu dan bandingkan dengan teman.`,
    });
    pertanyaan.push({
      label: 'Pertanyaan 2',
      icon: '🤔',
      teks: `Mengapa ${topic} penting dalam kehidupan sehari-hari?`,
      petunjuk: `Hubungkan dengan contoh nyata dari lingkunganmu.`,
    });
  }

  return {
    title: `Diskusi ${topic}`,
    intro: 'Diskusikan pertanyaan berikut dengan teman sekelompokmu!',
    pertanyaan,
  };
}

export function genRefleksi(parsed: ParseResult, meta: { judulPertemuan: string; namaBab: string }): RefleksiData {
  const { definitions, functions, causes, topWords } = parsed;
  const pertanyaan: RefleksiPertanyaan[] = [];
  const colors = ['blue', 'green', 'amber', 'purple', 'red'];
  const icons = ['🪞', '💭', '🎯', '📝', '🔄'];
  const topic = topWords[0] || meta.namaBab || 'materi';

  // Q1: Recall + awareness
  const defTerm = definitions[0]?.term || topic;
  pertanyaan.push({
    teks: `Hal baru apa yang kamu pelajari tentang ${defTerm}? Tuliskan minimal 2 hal yang paling berkesan.`,
    petunjuk: `Fokus pada pemahaman baru yang kamu dapat, bukan sekadar mengulang definisi.`,
    warna: colors[0] ?? 'blue',
    icon: icons[0] ?? '',
  });

  // Q2: Transfer + application
  const fnSubject = functions[0]?.subject || topic;
  pertanyaan.push({
    teks: `Bagaimana kamu akan menerapkan pemahaman tentang ${fnSubject} dalam kehidupan sehari-hari?`,
    petunjuk: `Berikan contoh konkret — di rumah, di sekolah, atau di masyarakat.`,
    warna: colors[1] ?? 'green',
    icon: icons[1] ?? '',
  });

  // Q3: Commitment + agency
  pertanyaan.push({
    teks: 'Tulis komitmen pribadimu untuk menerapkan nilai-nilai yang dipelajari!',
    petunjuk: 'Gunakan kalimat "Saya berkomitmen untuk..." dan tuliskan langkah nyata yang akan kamu lakukan.',
    warna: colors[2] ?? 'amber',
    icon: icons[2] ?? '',
  });

  // Q4: Metacognitive monitoring — what was challenging?
  const challengeTopic = definitions.length > 1 ? definitions[1]!.term : topic;
  pertanyaan.push({
    teks: `Bagian mana dari materi ${challengeTopic} yang paling menantang? Mengapa?`,
    petunjuk: `Jelaskan kesulitan yang kamu hadapi dan bagaimana kamu mengatasinya.`,
    warna: colors[3] ?? 'purple',
    icon: icons[3] ?? '',
  });

  // Q5: Self-regulation (if content is rich)
  if (causes.length > 0 || functions.length > 1) {
    pertanyaan.push({
      teks: 'Jika kamu bisa mempelajari materi ini lagi dari awal, apa yang akan kamu lakukan berbeda?',
      petunjuk: 'Pikirkan strategi belajar yang lebih efektif untuk pemahaman yang lebih dalam.',
      warna: colors[4] ?? 'red',
      icon: icons[4] ?? '',
    });
  }

  return {
    title: `Refleksi ${topic}`,
    intro: 'Renungkan pertanyaan berikut untuk memperdalam pemahamanmu!',
    pertanyaan,
    penugasan: {
      judul: 'Tugas Refleksi',
      isi: `Tulis refleksi pribadimu tentang ${topic} — apa yang kamu pelajari, mengapa penting, dan bagaimana kamu akan menerapkannya.`,
      contoh: `Saya belajar bahwa ${definitions[0]?.term ?? topic} adalah... Saya akan menerapkannya dengan...`,
    },
  };
}
