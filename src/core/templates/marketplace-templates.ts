// ═══════════════════════════════════════════════════════════════════
// MARKETPLACE TEMPLATES — FROZEN since SILSE v2.1
// ═══════════════════════════════════════════════════════════════════
// ❄️ STATUS: FROZEN — Semua 6 template di bawah ini TIDAK AKTIF
//    di pipeline utama. Hanya tersedia untuk backward compatibility.
//
// 🔄 PENGGANTI: Golden Flow — src/core/template/golden/interactive-lesson.ts
//    + Premium Presets — src/presets/ppkn/hakikat-norma-schema.ts
//
// ⚠️ JANGAN tambahkan template marketplace baru di sini.
//    Template baru harus melalui proses: define Visual DNA → build
//    1 golden experience → derive system. Lihat visual-dna.ts.
//
// Original Description:
//   Pre-built MPI lesson templates — gallery of templates organized
//   by subject for Indonesian SMP teachers. Each template has metadata
//   for the marketplace UI and a schemaFactory that produces a valid
//   LessonSchema with real Indonesian content.
// ═══════════════════════════════════════════════════════════════════

import type { LessonSchema, ScreenSchema, SchemaBlock } from '@/core/schema/types';
import { generatePageId, generateBlockId } from '@/core/schema/ensure-schema';

// ── Subject type ──────────────────────────────────────────────

export type MapelCategory =
  | 'Matematika'
  | 'IPA'
  | 'IPS'
  | 'Bahasa Indonesia'
  | 'PPKn'
  | 'Seni Budaya'
  | 'PJOK'
  | 'Informatika';

// ── Block type icon map ──────────────────────────────────────

const BLOCK_ICONS: Record<string, string> = {
  'cover': '🏠',
  'petunjuk': '📋',
  'tp': '🎯',
  'alur': '⏱️',
  'skenario': '🎭',
  'def-box': '📖',
  'nc-grid': '🔲',
  'flashcard-set': '🃏',
  'ftab': '📑',
  'nk-card': '🪪',
  'materi-section': '📚',
  'diskusi': '💬',
  'kuis': '❓',
  'sortir-game': '🔀',
  'roda-game': '🎡',
  'memory-game': '🧠',
  'matching-game': '🔗',
  'fill-blank-game': '✏️',
  'word-search-game': '🔍',
  'true-false-game': '✅',
  'drag-drop-game': '👆',
  'crossword-game': '🧩',
  'team-buzzer-game': '🔔',
  'hasil': '🏆',
  'refleksi': '📝',
  'penutup': '👋',
  'tujuan-display': '🎯',
  'motivasi': '💡',
  'rangkuman': '📊',
  'tabel-accord': '📋',
};

export function getBlockIcon(blockType: string): string {
  return BLOCK_ICONS[blockType] || '📦';
}

// ── Preview block descriptor ─────────────────────────────────

export interface PreviewBlockInfo {
  type: string;
  icon: string;
  label: string;
}

export interface PreviewScreenInfo {
  templateType: string;
  label: string;
  blocks: PreviewBlockInfo[];
}

// ── Marketplace Template definition ──────────────────────────

export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  subject: MapelCategory;
  grade: 7 | 8 | 9;
  icon: string;
  coverGradient: [string, string];
  blockTypes: string[];
  screens: number;
  bsnpCompliant: boolean;
  previewBlocks: PreviewScreenInfo[];
  schemaFactory: () => LessonSchema;
}

// ── Helper: create screens with generated IDs ────────────────

function makeScreen(
  templateType: string,
  sectionLabel: string,
  sectionColor: string,
  blocks: SchemaBlock[],
  nav?: ScreenSchema['nav'],
  background?: ScreenSchema['background'],
): ScreenSchema {
  return {
    id: generatePageId(),
    templateType,
    sectionLabel,
    sectionColor,
    blocks: blocks.map(b => ({ ...b, id: b.id || generateBlockId() })),
    nav,
    background,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 1: Matematika — Persamaan Linear
// ═══════════════════════════════════════════════════════════════════

const matematikaPersamaanLinear: MarketplaceTemplate = {
  id: 'mat-persamaan-linear',
  name: 'Persamaan Linear',
  description: 'Pelajari konsep persamaan linear satu variabel melalui kuis interaktif, isian singkat, dan drag-drop. Cocok untuk kelas 7 semester 1 dengan pendekatan kontekstual.',
  subject: 'Matematika',
  grade: 7,
  icon: '📐',
  coverGradient: ['y', 'o'],
  blockTypes: ['kuis', 'fill-blank-game', 'drag-drop-game', 'flashcard-set', 'refleksi'],
  screens: 5,
  bsnpCompliant: true,
  previewBlocks: [
    { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
    { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Kartu Konsep' }, { type: 'flashcard-set', icon: '🃏', label: 'Flashcard' }] },
    { templateType: 'game', label: 'Latihan Interaktif', blocks: [{ type: 'fill-blank-game', icon: '✏️', label: 'Isian Singkat' }, { type: 'drag-drop-game', icon: '👆', label: 'Drag & Drop' }] },
    { templateType: 'game', label: 'Kuis', blocks: [{ type: 'kuis', icon: '❓', label: 'Kuis Pilihan Ganda' }] },
    { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'refleksi', icon: '📝', label: 'Refleksi Diri' }] },
  ],
  schemaFactory: () => ({
    id: 'mat-persamaan-linear',
    version: 1,
    title: 'Persamaan Linear Satu Variabel',
    mapel: 'Matematika',
    kelas: 'VII',
    themeId: 'default',
    navbar: {
      logoText: '📐 Persamaan Linear',
      logoColor: 'y',
      progressGradient: ['y', 'o'],
    },
    screens: [
      makeScreen('cover', '🏠 Cover', 'y', [
        {
          type: 'cover',
          icon: '📐',
          title: 'Persamaan Linear Satu Variabel',
          subtitle: 'Matematika Kelas VII — Semester 1',
          badges: [
            { icon: '📐', text: 'Aljabar', color: 'y' },
            { icon: '🎮', text: '3 Game', color: 'g' },
            { icon: '📝', text: 'Refleksi', color: 'p' },
          ],
          meta: { durasi: '40 Menit', fase: 'Fase D', elemen: 'Bernalar Kritis' },
          cta: { label: '▶ Mulai Belajar', action: '' },
          background: { type: 'gradient', color1: 'y', color2: 'o' },
        } as SchemaBlock,
      ], undefined, { type: 'radial', color1: 'y', color2: 'bg' }),
      makeScreen('materi', '📖 Materi · ±15 Menit', 'y', [
        {
          type: 'def-box',
          borderColor: 'y',
          content: '<strong>Persamaan Linear Satu Variabel (PLSV)</strong> adalah kalimat terbuka yang dihubungkan tanda sama dengan (=), memiliki satu variabel, dan pangkat tertinggi variabelnya adalah 1. Contoh: <strong>3x + 5 = 14</strong>',
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '🔤', title: 'Variabel', body: 'Simbol yang mewakili bilangan yang belum diketahui nilainya, biasanya x, y, atau z', color: 'y' },
            { icon: '⚖️', title: 'Konstanta', body: 'Bilangan tetap yang nilainya tidak berubah, misalnya 5 pada 3x + 5 = 14', color: 'c' },
            { icon: '#️⃣', title: 'Koefisien', body: 'Bilangan yang mengalikan variabel, misalnya 3 pada 3x + 5 = 14', color: 'g' },
            { icon: '=', title: 'Tanda Sama Dengan', body: 'Menunjukkan bahwa ruas kiri dan ruas kanan memiliki nilai yang sama', color: 'p' },
          ],
        },
        {
          type: 'flashcard-set',
          cards: [
            { q: 'Apa yang dimaksud PLSV?', a: 'Kalimat terbuka dengan satu variabel berpangkat 1, dihubungkan tanda sama dengan.' },
            { q: 'Identifikasi koefisien pada 5x - 3 = 12', a: 'Koefisiennya adalah 5 (bilangan yang mengalikan variabel x).' },
            { q: 'Identifikasi konstanta pada 2x + 7 = 15', a: 'Konstantanya adalah 7 dan 15 (bilangan tetap tanpa variabel).' },
            { q: 'Apakah x² + 3 = 7 merupakan PLSV?', a: 'Bukan, karena pangkat variabel x adalah 2, bukan 1.' },
          ],
        },
      ]),
      makeScreen('game', '🎮 Latihan Interaktif · ±10 Menit', 'g', [
        {
          type: 'fill-blank-game',
          title: 'Isian Singkat — PLSV',
          questions: [
            { text: 'Pada persamaan 4x = 20, nilai x = ___', answer: '5', hint: 'Bagi kedua ruas dengan 4' },
            { text: 'Pada persamaan x + 8 = 15, nilai x = ___', answer: '7', hint: 'Kurangi kedua ruas dengan 8' },
            { text: 'Pada persamaan 2x - 3 = 9, nilai x = ___', answer: '6', hint: 'Tambahkan 3, lalu bagi 2' },
            { text: 'Koefisien x pada 7x + 2 = 23 adalah ___', answer: '7' },
            { text: 'Konstanta pada persamaan 3x + 5 = 20 adalah ___', answer: '5' },
          ],
        },
        {
          type: 'drag-drop-game',
          title: 'Klasifikasi Komponen PLSV',
          items: [
            { text: '3x', target: 'koefisien-variabel' },
            { text: '5', target: 'konstanta' },
            { text: 'x', target: 'variabel' },
            { text: '7', target: 'konstanta' },
            { text: '2y', target: 'koefisien-variabel' },
            { text: 'z', target: 'variabel' },
          ],
          targets: [
            { id: 'koefisien-variabel', label: 'Koefisien + Variabel', color: 'y' },
            { id: 'konstanta', label: 'Konstanta', color: 'c' },
            { id: 'variabel', label: 'Variabel', color: 'g' },
          ],
        },
      ]),
      makeScreen('game', '❓ Kuis · ±10 Menit', 'o', [
        {
          type: 'kuis',
          title: 'Kuis Persamaan Linear',
          questions: [
            { q: 'Manakah yang merupakan PLSV?', opts: ['2x + 3 = 7', 'x² = 9', 'x + y = 5', '2x + 3y = 10'], ans: 0, ex: '2x + 3 = 7 memiliki satu variabel berpangkat 1 — sesuai definisi PLSV.' },
            { q: 'Penyelesaian dari 3x = 18 adalah...', opts: ['x = 3', 'x = 6', 'x = 9', 'x = 15'], ans: 1, ex: 'Kedua ruas dibagi 3, sehingga x = 18/3 = 6.' },
            { q: 'Jika x + 4 = 10, maka x = ...', opts: ['4', '6', '10', '14'], ans: 1, ex: 'x = 10 - 4 = 6.' },
            { q: 'Pada 5x - 2 = 13, langkah pertama yang benar adalah...', opts: ['Bagi kedua ruas dengan 5', 'Tambahkan 2 ke kedua ruas', 'Kurangi 13 dengan 5', 'Kalikan kedua ruas dengan 2'], ans: 1, ex: 'Tambahkan 2 ke kedua ruas: 5x = 15, lalu bagi 5: x = 3.' },
            { q: 'Nilai x yang memenuhi 2(x - 1) = 8 adalah...', opts: ['x = 3', 'x = 4', 'x = 5', 'x = 7'], ans: 2, ex: '2(x-1) = 8 → x-1 = 4 → x = 5.' },
          ],
        },
      ]),
      makeScreen('refleksi', '📝 Refleksi · ±5 Menit', 'p', [
        {
          type: 'refleksi',
          title: 'Refleksi Pembelajaran',
          intro: 'Jawab dengan jujur — tidak ada jawaban salah di sini.',
          questions: [
            { teks: 'Apa hal terpenting yang kamu pelajari tentang PLSV hari ini?', petunjuk: 'Tuliskan 1-2 poin yang paling berkesan…', warna: 'y', icon: '🌟' },
            { teks: 'Bagian mana yang masih terasa sulit? Mengapa?', petunjuk: 'Jelaskan bagian yang masih membingungkan…', warna: 'c', icon: '🤔' },
            { teks: 'Buat satu contoh PLSV dari kehidupan sehari-hari!', petunjuk: 'Contoh: Saya punya Rp15.000, beli 3 pulsa seharga x…', warna: 'g', icon: '💡' },
          ],
        },
      ]),
    ],
  }),
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 2: IPA — Sistem Tata Surya
// ═══════════════════════════════════════════════════════════════════

const ipaTataSurya: MarketplaceTemplate = {
  id: 'ipa-tata-surya',
  name: 'Sistem Tata Surya',
  description: 'Eksplorasi planet-planet dalam tata surya melalui media visual, word search, dan kuis benar-salah. Template interaktif untuk kelas 7 semester 2.',
  subject: 'IPA',
  grade: 7,
  icon: '🌍',
  coverGradient: ['c', 'p'],
  blockTypes: ['word-search-game', 'true-false-game', 'kuis', 'flashcard-set', 'refleksi'],
  screens: 5,
  bsnpCompliant: true,
  previewBlocks: [
    { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
    { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Planet-planet' }, { type: 'flashcard-set', icon: '🃏', label: 'Flashcard' }] },
    { templateType: 'game', label: 'Word Search', blocks: [{ type: 'word-search-game', icon: '🔍', label: 'Cari Kata' }] },
    { templateType: 'game', label: 'Kuis', blocks: [{ type: 'true-false-game', icon: '✅', label: 'Benar-Salah' }, { type: 'kuis', icon: '❓', label: 'Pilihan Ganda' }] },
    { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'refleksi', icon: '📝', label: 'Refleksi Diri' }] },
  ],
  schemaFactory: () => ({
    id: 'ipa-tata-surya',
    version: 1,
    title: 'Sistem Tata Surya',
    mapel: 'IPA',
    kelas: 'VII',
    themeId: 'default',
    navbar: {
      logoText: '🌍 Sistem Tata Surya',
      logoColor: 'c',
      progressGradient: ['c', 'p'],
    },
    screens: [
      makeScreen('cover', '🏠 Cover', 'c', [
        {
          type: 'cover',
          icon: '🌍',
          title: 'Sistem Tata Surya',
          subtitle: 'IPA Kelas VII — Semester 2',
          badges: [
            { icon: '🪐', text: '8 Planet', color: 'c' },
            { icon: '🔍', text: 'Word Search', color: 'g' },
            { icon: '✅', text: 'Benar-Salah', color: 'p' },
          ],
          meta: { durasi: '40 Menit', fase: 'Fase D', elemen: 'Bernalar Kritis' },
          cta: { label: '▶ Mulai Eksplorasi', action: '' },
          background: { type: 'gradient', color1: 'c', color2: 'p' },
        } as SchemaBlock,
      ], undefined, { type: 'radial', color1: 'c', color2: 'bg' }),
      makeScreen('materi', '📖 Materi · ±15 Menit', 'c', [
        {
          type: 'def-box',
          borderColor: 'c',
          content: '<strong>Sistem Tata Surya</strong> adalah susunan benda-benda langit yang terdiri dari Matahari sebagai pusat, planet-planet yang mengelilinginya, serta benda-benda langit lainnya seperti satelit, asteroid, dan komet.',
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '☀️', title: 'Matahari', body: 'Bintang pusat tata surya, suhu permukaan ~5.500°C, mengandung 99,86% massa tata surya', color: 'y' },
            { icon: '🌍', title: 'Planet Dalam', body: 'Merkurius, Venus, Bumi, Mars — planet berbatu yang letaknya dekat Matahari', color: 'c' },
            { icon: '🪐', title: 'Planet Luar', body: 'Jupiter, Saturnus, Uranus, Neptunus — planet gas raksasa yang jauh dari Matahari', color: 'p' },
            { icon: '🌑', title: 'Satelit', body: 'Benda langit yang mengorbit planet. Bumi memiliki 1 satelit: Bulan', color: 'g' },
          ],
        },
        {
          type: 'flashcard-set',
          cards: [
            { q: 'Planet terdekat dari Matahari?', a: 'Merkurius — jarak rata-rata 58 juta km dari Matahari.' },
            { q: 'Planet terbesar di tata surya?', a: 'Jupiter — diameternya 11 kali lebih besar dari Bumi.' },
            { q: 'Planet yang memiliki cincin terkenal?', a: 'Saturnus — cincinnya terdiri dari es dan batuan.' },
            { q: 'Planet terjauh dari Matahari?', a: 'Neptunus — jarak rata-rata 4,5 miliar km dari Matahari.' },
          ],
        },
      ]),
      makeScreen('game', '🔍 Cari Kata · ±8 Menit', 'g', [
        {
          type: 'word-search-game',
          title: 'Cari Kata — Planet & Benda Langit',
          words: ['Merkurius', 'Venus', 'Bumi', 'Mars', 'Jupiter', 'Saturnus', 'Uranus', 'Neptunus', 'Matahari', 'Bulan'],
          gridSize: 12,
        },
      ]),
      makeScreen('game', '❓ Kuis · ±12 Menit', 'o', [
        {
          type: 'true-false-game',
          title: 'Benar atau Salah?',
          questions: [
            { text: 'Matahari adalah planet terbesar di tata surya', correct: false, explanation: 'Matahari adalah bintang, bukan planet. Planet terbesar adalah Jupiter.' },
            { text: 'Bumi adalah planet ketiga dari Matahari', correct: true, explanation: 'Urutan: Merkurius, Venus, Bumi — jadi Bumi planet ketiga.' },
            { text: 'Semua planet memiliki cincin', correct: false, explanation: 'Hanya Jupiter, Saturnus, Uranus, dan Neptunus yang memiliki cincin.' },
            { text: 'Mars dijuluki Planet Merah', correct: true, explanation: 'Permukaan Mars kaya zat besi oksida yang berwarna merah.' },
          ],
        },
        {
          type: 'kuis',
          title: 'Kuis Sistem Tata Surya',
          questions: [
            { q: 'Planet mana yang memiliki air dalam bentuk cair?', opts: ['Mars', 'Venus', 'Bumi', 'Jupiter'], ans: 2, ex: 'Bumi adalah satu-satunya planet yang diketahui memiliki air cair di permukaannya.' },
            { q: 'Berapa jumlah planet di tata surya kita?', opts: ['7', '8', '9', '10'], ans: 1, ex: 'Sejak 2006, tata surya memiliki 8 planet setelah Pluto diklasifikasi ulang.' },
            { q: 'Asteroid belt terletak di antara planet...', opts: ['Venus dan Bumi', 'Bumi dan Mars', 'Mars dan Jupiter', 'Jupiter dan Saturnus'], ans: 2, ex: 'Asteroid belt berada di antara orbit Mars dan Jupiter.' },
          ],
        },
      ]),
      makeScreen('refleksi', '📝 Refleksi · ±5 Menit', 'p', [
        {
          type: 'refleksi',
          title: 'Refleksi Pembelajaran',
          questions: [
            { teks: 'Planet mana yang paling menarik perhatianmu? Mengapa?', petunjuk: 'Jelaskan alasanmu…', warna: 'c', icon: '🌍' },
            { teks: 'Apa fakta baru yang paling mengejutkanmu tentang tata surya?', petunjuk: 'Tuliskan hal yang paling mengherankan…', warna: 'g', icon: '💫' },
          ],
        },
      ]),
    ],
  }),
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 3: IPA — Ekosistem
// ═══════════════════════════════════════════════════════════════════

const ipaEkosistem: MarketplaceTemplate = {
  id: 'ipa-ekosistem',
  name: 'Ekosistem',
  description: 'Pahami interaksi makhluk hidup dengan lingkungan melalui memory game, matching game, dan crossword. Template seru untuk kelas 7 semester 1.',
  subject: 'IPA',
  grade: 7,
  icon: '🌿',
  coverGradient: ['g', 'c'],
  blockTypes: ['memory-game', 'matching-game', 'crossword-game', 'kuis', 'refleksi'],
  screens: 5,
  bsnpCompliant: true,
  previewBlocks: [
    { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
    { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Komponen' }] },
    { templateType: 'game', label: 'Memory Game', blocks: [{ type: 'memory-game', icon: '🧠', label: 'Memory' }] },
    { templateType: 'game', label: 'Matching & Crossword', blocks: [{ type: 'matching-game', icon: '🔗', label: 'Matching' }, { type: 'crossword-game', icon: '🧩', label: 'Crossword' }] },
    { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'refleksi', icon: '📝', label: 'Refleksi Diri' }] },
  ],
  schemaFactory: () => ({
    id: 'ipa-ekosistem',
    version: 1,
    title: 'Ekosistem',
    mapel: 'IPA',
    kelas: 'VII',
    themeId: 'default',
    navbar: {
      logoText: '🌿 Ekosistem',
      logoColor: 'g',
      progressGradient: ['g', 'c'],
    },
    screens: [
      makeScreen('cover', '🏠 Cover', 'g', [
        {
          type: 'cover',
          icon: '🌿',
          title: 'Ekosistem',
          subtitle: 'IPA Kelas VII — Semester 1',
          badges: [
            { icon: '🧠', text: 'Memory Game', color: 'g' },
            { icon: '🔗', text: 'Matching', color: 'c' },
            { icon: '🧩', text: 'Crossword', color: 'p' },
          ],
          meta: { durasi: '40 Menit', fase: 'Fase D', elemen: 'Bernalar Kritis' },
          cta: { label: '▶ Mulai Belajar', action: '' },
          background: { type: 'gradient', color1: 'g', color2: 'c' },
        } as SchemaBlock,
      ], undefined, { type: 'radial', color1: 'g', color2: 'bg' }),
      makeScreen('materi', '📖 Materi · ±12 Menit', 'g', [
        {
          type: 'def-box',
          borderColor: 'g',
          content: '<strong>Ekosistem</strong> adalah suatu sistem ekologi yang terbentuk dari interaksi antara makhluk hidup (<em>biotik</em>) dengan lingkungan tak hidupnya (<em>abiotik</em>). Interaksi ini menciptakan keseimbangan alam.',
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '🌱', title: 'Produsen', body: 'Makhluk hidup yang menghasilkan makanan sendiri melalui fotosintesis, misalnya tumbuhan hijau', color: 'g' },
            { icon: '🐇', title: 'Konsumen', body: 'Makhluk hidup yang tidak bisa membuat makanan sendiri, terdiri dari konsumen I, II, dan III', color: 'y' },
            { icon: '🍄', title: 'Dekomposer', body: 'Mikroorganisme pengurai bahan organik menjadi anorganik, misalnya jamur dan bakteri', color: 'p' },
            { icon: '☀️', title: 'Komponen Abiotik', body: 'Faktor tak hidup: cahaya, suhu, air, udara, tanah, dan kelembapan', color: 'c' },
          ],
        },
      ]),
      makeScreen('game', '🧠 Memory Game · ±8 Menit', 'g', [
        {
          type: 'memory-game',
          title: 'Memory — Komponen Ekosistem',
          pairs: [
            { left: 'Produsen', right: 'Tumbuhan Hijau' },
            { left: 'Konsumen I', right: 'Herbivora' },
            { left: 'Konsumen II', right: 'Karnivora Kecil' },
            { left: 'Konsumen III', right: 'Karnivora Puncak' },
            { left: 'Dekomposer', right: 'Jamur & Bakteri' },
            { left: 'Abiotik', right: 'Air & Cahaya' },
          ],
        },
      ]),
      makeScreen('game', '🎮 Matching & Crossword · ±12 Menit', 'o', [
        {
          type: 'matching-game',
          title: 'Cocokkan — Istilah Ekosistem',
          pairs: [
            { left: 'Fotosintesis', right: 'Proses pembuatan makanan oleh tumbuhan' },
            { left: 'Rantai Makanan', right: 'Perpindahan energi dari produsen ke konsumen' },
            { left: 'Simbiosis', right: 'Interaksi antar makhluk hidup yang hidup bersama' },
            { left: 'Habitat', right: 'Tempat tinggal organisme' },
            { left: 'Niche', right: 'Peran organisme dalam ekosistem' },
          ],
        },
        {
          type: 'crossword-game',
          title: 'Teka-Teki Silang — Ekosistem',
          words: [
            { teks: 'Ekosistem', hint: 'Sistem interaksi biotik dan abiotik' },
            { teks: 'Produsen', hint: 'Penghasil makanan melalui fotosintesis' },
            { teks: 'Dekomposer', hint: 'Pengurai bahan organik' },
            { teks: 'Habitat', hint: 'Tempat tinggal organisme' },
            { teks: 'Biotik', hint: 'Komponen makhluk hidup' },
            { teks: 'Abiotik', hint: 'Komponen tak hidup' },
          ],
          gridSize: 12,
        },
      ]),
      makeScreen('refleksi', '📝 Refleksi · ±8 Menit', 'p', [
        {
          type: 'refleksi',
          title: 'Refleksi Pembelajaran',
          questions: [
            { teks: 'Sebutkan contoh interaksi biotik dan abiotik di sekitarmu!', petunjuk: 'Perhatikan lingkungan sekitarmu…', warna: 'g', icon: '🌿' },
            { teks: 'Mengapa dekomposer penting bagi ekosistem?', petunjuk: 'Bayangkan jika tidak ada pengurai…', warna: 'c', icon: '🍄' },
          ],
        },
      ]),
    ],
  }),
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 4: IPS — Sejarah Indonesia
// ═══════════════════════════════════════════════════════════════════

const ipsSejarah: MarketplaceTemplate = {
  id: 'ips-sejarah-indonesia',
  name: 'Sejarah Indonesia',
  description: 'Pelajari peristiwa penting sejarah Indonesia melalui skenario interaktif, kuis, dan team buzzer. Template menarik untuk kelas 8 semester 1.',
  subject: 'IPS',
  grade: 8,
  icon: '🏛️',
  coverGradient: ['r', 'o'],
  blockTypes: ['skenario', 'kuis', 'team-buzzer-game', 'diskusi', 'refleksi'],
  screens: 5,
  bsnpCompliant: true,
  previewBlocks: [
    { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
    { templateType: 'skenario', label: 'Skenario', blocks: [{ type: 'skenario', icon: '🎭', label: 'Skenario Interaktif' }] },
    { templateType: 'game', label: 'Kuis', blocks: [{ type: 'kuis', icon: '❓', label: 'Pilihan Ganda' }] },
    { templateType: 'game', label: 'Team Buzzer', blocks: [{ type: 'team-buzzer-game', icon: '🔔', label: 'Team Buzzer' }] },
    { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'diskusi', icon: '💬', label: 'Diskusi' }, { type: 'refleksi', icon: '📝', label: 'Refleksi' }] },
  ],
  schemaFactory: () => ({
    id: 'ips-sejarah-indonesia',
    version: 1,
    title: 'Sejarah Indonesia',
    mapel: 'IPS',
    kelas: 'VIII',
    themeId: 'default',
    navbar: {
      logoText: '🏛️ Sejarah Indonesia',
      logoColor: 'r',
      progressGradient: ['r', 'o'],
    },
    screens: [
      makeScreen('cover', '🏠 Cover', 'r', [
        {
          type: 'cover',
          icon: '🏛️',
          title: 'Peristiwa Penting Sejarah Indonesia',
          subtitle: 'IPS Kelas VIII — Semester 1',
          badges: [
            { icon: '🎭', text: 'Skenario', color: 'r' },
            { icon: '🔔', text: 'Team Buzzer', color: 'o' },
            { icon: '💬', text: 'Diskusi', color: 'c' },
          ],
          meta: { durasi: '40 Menit', fase: 'Fase D', elemen: 'Berkebinekaan Global' },
          cta: { label: '▶ Mulai Perjalanan', action: '' },
          background: { type: 'gradient', color1: 'r', color2: 'o' },
        } as SchemaBlock,
      ], undefined, { type: 'radial', color1: 'r', color2: 'bg' }),
      makeScreen('skenario', '🎭 Skenario · ±12 Menit', 'p', [
        {
          type: 'skenario',
          title: 'Di Persimpangan Sejarah',
          chapters: [
            {
              id: 'ch1',
              charEmoji: '😤',
              title: '🗞️ Sumpah Pemuda 1928',
              setup: [
                { speaker: 'NARRATOR', text: 'Kamu adalah seorang pemuda tahun 1928. Indonesia masih dijajah Belanda. Perhimpunan-perhimpunan daerah bersaing dan tidak bersatu.' },
                { speaker: 'NARRATOR', text: 'Kongres Pemuda II sedang berlangsung. Kamu diminta menyampaikan pendapat tentang masa depan bangsa.' },
              ],
              choicePrompt: 'Apa yang akan kamu usulkan?',
              choices: [
                { icon: '🤝', label: 'Bersatulah dalam satu bangsa!', detail: 'Usulkan agar semua perhimpunan melebur menjadi satu', good: true, pts: 20, level: 'good', resultTitle: 'Pilihan Tepat! 🌟', resultBody: 'Semangat persatuan inilah yang melahirkan Sumpah Pemuda — titik balik sejarah Indonesia.', norma: 'Persatuan dan Kesatuan', consequences: [{ icon: '✅', text: 'Pergerakan nasional menjadi lebih kuat' }, { icon: '✅', text: 'Identitas Indonesia mulai terbentuk' }], nextChapter: 1 },
                { icon: '🏘️', label: 'Pertahankan perhimpunan daerah', detail: 'Setiap daerah punya kebutuhan sendiri', good: false, pts: 5, level: 'mid', resultTitle: 'Kurang Tepat 🤔', resultBody: 'Tanpa persatuan, penjajah akan terus membagi dan menguasai.', consequences: [{ icon: '⚠️', text: 'Penjajah mudah menerapkan divide et impera' }, { icon: '💡', text: 'Persatuan jauh lebih kuat dari perpecahan' }], nextChapter: 1 },
              ],
            },
          ],
        },
      ]),
      makeScreen('game', '❓ Kuis · ±10 Menit', 'y', [
        {
          type: 'kuis',
          title: 'Kuis Sejarah Indonesia',
          questions: [
            { q: 'Kapan Sumpah Pemuda diikrarkan?', opts: ['17 Agustus 1945', '28 Oktober 1928', '20 Mei 1908', '10 November 1945'], ans: 1, ex: 'Sumpah Pemuda diikrarkan pada 28 Oktober 1928 dalam Kongres Pemuda II.' },
            { q: 'Siapa proklamator kemerdekaan Indonesia?', opts: ['Sukarno-Hatta', 'Mohammad Hatta-Ahmad Soebardjo', 'Sukarno-Mohammad Hatta', 'Sutan Sjahrir-Amir Sjarifuddin'], ans: 2, ex: 'Sukarno dan Mohammad Hatta memproklamasikan kemerdekaan RI pada 17 Agustus 1945.' },
            { q: 'Budi Utomo didirikan pada tanggal...', opts: ['20 Mei 1908', '17 Agustus 1945', '28 Oktober 1928', '1 Juni 1945'], ans: 0, ex: 'Budi Utomo didirikan Dr. Sutomo pada 20 Mei 1908 — awal kebangkitan nasional.' },
          ],
        },
      ]),
      makeScreen('game', '🔔 Team Buzzer · ±10 Menit', 'o', [
        {
          type: 'team-buzzer-game',
          title: 'Lomba Cepat — Sejarah Indonesia',
          teamA: 'Tim Merah',
          teamB: 'Tim Putih',
          questions: [
            { teks: 'Siapa yang menciptakan lagu Indonesia Raya?', poin: 10 },
            { teks: 'Tahun berapa VOC dibubarkan?', poin: 10 },
            { teks: 'Apa ibu kota Indonesia saat proklamasi?', poin: 10 },
            { teks: 'Siapa pahlawan dari Pertempuran Surabaya?', poin: 15 },
            { teks: 'Apa isi pertama dari Sumpah Pemuda?', poin: 15 },
          ],
        },
      ]),
      makeScreen('refleksi', '📝 Refleksi · ±8 Menit', 'c', [
        {
          type: 'diskusi',
          title: 'Diskusi Sejarah',
          questions: [
            { label: 'Diskusi Kelas', icon: '💬', teks: 'Mengapa persatuan sangat penting dalam perjuangan kemerdekaan Indonesia?', petunjuk: 'Hubungkan dengan semangat Sumpah Pemuda…', color: 'r' },
          ],
        },
        {
          type: 'refleksi',
          title: 'Refleksi',
          questions: [
            { teks: 'Peristiwa sejarah mana yang paling menginspirasimu? Mengapa?', petunjuk: 'Tuliskan pendapatmu…', warna: 'o', icon: '💡' },
          ],
        },
      ]),
    ],
  }),
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 5: Bahasa Indonesia — Teks Narasi
// ═══════════════════════════════════════════════════════════════════

const bahasaNarasi: MarketplaceTemplate = {
  id: 'bindo-teks-narasi',
  name: 'Teks Narasi',
  description: 'Kuasai struktur teks narasi melalui flashcard, fill-blank game, dan refleksi. Template cocok untuk kelas 8 semester 1 dengan fokus pada menulis kreatif.',
  subject: 'Bahasa Indonesia',
  grade: 8,
  icon: '📖',
  coverGradient: ['p', 'c'],
  blockTypes: ['flashcard-set', 'fill-blank-game', 'kuis', 'diskusi', 'refleksi'],
  screens: 5,
  bsnpCompliant: true,
  previewBlocks: [
    { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
    { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Struktur' }, { type: 'flashcard-set', icon: '🃏', label: 'Flashcard' }] },
    { templateType: 'game', label: 'Latihan', blocks: [{ type: 'fill-blank-game', icon: '✏️', label: 'Isian' }] },
    { templateType: 'game', label: 'Kuis', blocks: [{ type: 'kuis', icon: '❓', label: 'Pilihan Ganda' }] },
    { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'diskusi', icon: '💬', label: 'Diskusi' }, { type: 'refleksi', icon: '📝', label: 'Refleksi' }] },
  ],
  schemaFactory: () => ({
    id: 'bindo-teks-narasi',
    version: 1,
    title: 'Teks Narasi',
    mapel: 'Bahasa Indonesia',
    kelas: 'VIII',
    themeId: 'default',
    navbar: {
      logoText: '📖 Teks Narasi',
      logoColor: 'p',
      progressGradient: ['p', 'c'],
    },
    screens: [
      makeScreen('cover', '🏠 Cover', 'p', [
        {
          type: 'cover',
          icon: '📖',
          title: 'Teks Narasi',
          subtitle: 'Bahasa Indonesia Kelas VIII — Semester 1',
          badges: [
            { icon: '🃏', text: 'Flashcard', color: 'p' },
            { icon: '✏️', text: 'Isian', color: 'c' },
            { icon: '💬', text: 'Diskusi', color: 'g' },
          ],
          meta: { durasi: '40 Menit', fase: 'Fase D', elemen: 'Bernalar Kritis' },
          cta: { label: '▶ Mulai Belajar', action: '' },
          background: { type: 'gradient', color1: 'p', color2: 'c' },
        } as SchemaBlock,
      ], undefined, { type: 'radial', color1: 'p', color2: 'bg' }),
      makeScreen('materi', '📖 Materi · ±15 Menit', 'p', [
        {
          type: 'def-box',
          borderColor: 'p',
          content: '<strong>Teks Narasi</strong> adalah teks yang menceritakan kembali suatu peristiwa atau kejadian yang dialami seseorang secara berurutan. Teks narasi memiliki struktur: <strong>Orientasi → Komplikasi → Resolusi</strong>.',
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '🌅', title: 'Orientasi', body: 'Pengenalan tokoh, latar tempat dan waktu cerita. Bagian awal yang menyiapkan pembaca', color: 'p' },
            { icon: '⚡', title: 'Komplikasi', body: 'Masalah atau konflik yang dialami tokoh. Bagian paling menegangkan dalam cerita', color: 'r' },
            { icon: '✅', title: 'Resolusi', body: 'Penyelesaian masalah. Konflik berakhir dan tokoh menemukan jalan keluar', color: 'g' },
            { icon: '💡', title: 'Koda', body: 'Pesannya atau amanat yang bisa dipetik dari cerita (opsional)', color: 'y' },
          ],
        },
        {
          type: 'flashcard-set',
          cards: [
            { q: 'Apa struktur teks narasi?', a: 'Orientasi → Komplikasi → Resolusi (dan Koda sebagai opsional).' },
            { q: 'Apa perbedaan narasi fiksi dan nonfiksi?', a: 'Narasi fiksi berdasarkan imajinasi, narasi nonfiksi berdasarkan fakta/peristiwa nyata.' },
            { q: 'Apa itu komplikasi dalam teks narasi?', a: 'Bagian puncak konflik di mana tokoh menghadapi masalah yang harus diselesaikan.' },
          ],
        },
      ]),
      makeScreen('game', '✏️ Latihan · ±8 Menit', 'c', [
        {
          type: 'fill-blank-game',
          title: 'Isian Singkat — Teks Narasi',
          questions: [
            { text: 'Bagian awal teks narasi yang memperkenalkan tokoh dan latar disebut ___', answer: 'Orientasi', hint: 'Berawal dari huruf O' },
            { text: 'Konflik atau masalah dalam narasi terdapat pada bagian ___', answer: 'Komplikasi', hint: 'Bagian yang paling menegangkan' },
            { text: 'Penyelesaian masalah dalam narasi disebut ___', answer: 'Resolusi', hint: 'Masalah berakhir di sini' },
            { text: 'Pesanan atau amanat dalam narasi disebut ___', answer: 'Koda', hint: 'Pelajaran dari cerita' },
          ],
        },
      ]),
      makeScreen('game', '❓ Kuis · ±10 Menit', 'o', [
        {
          type: 'kuis',
          title: 'Kuis Teks Narasi',
          questions: [
            { q: 'Urutan struktur teks narasi yang benar adalah...', opts: ['Orientasi-Resolusi-Komplikasi', 'Orientasi-Komplikasi-Resolusi', 'Komplikasi-Orientasi-Resolusi', 'Resolusi-Komplikasi-Orientasi'], ans: 1, ex: 'Struktur yang benar: Orientasi → Komplikasi → Resolusi.' },
            { q: 'Cerita Rakyat termasuk jenis narasi...', opts: ['Fiksi', 'Nonfiksi', 'Dokumenter', 'Eksposisi'], ans: 0, ex: 'Cerita Rakyat adalah narasi fiksi karena mengandung unsur imajinasi.' },
            { q: 'Yang BUKAN ciri-ciri teks narasi adalah...', opts: ['Berdasarkan urutan waktu', 'Mengandung konflik', 'Memaparkan langkah-langkah', 'Memiliki tokoh'], ans: 2, ex: 'Memaparkan langkah-langkah adalah ciri teks prosedur, bukan narasi.' },
          ],
        },
      ]),
      makeScreen('refleksi', '📝 Refleksi · ±7 Menit', 'c', [
        {
          type: 'diskusi',
          title: 'Diskusi Menulis',
          questions: [
            { label: 'Tugas Menulis', icon: '✍️', teks: 'Buatlah kerangka teks narasi singkat (orientasi, komplikasi, resolusi) berdasarkan pengalamanmu sendiri!', petunjuk: 'Tuliskan kerangka di sini…', color: 'p' },
          ],
        },
        {
          type: 'refleksi',
          title: 'Refleksi',
          questions: [
            { teks: 'Apa yang paling kamu pahami tentang teks narasi setelah pelajaran ini?', petunjuk: 'Tuliskan pemahamanmu…', warna: 'c', icon: '💡' },
          ],
        },
      ]),
    ],
  }),
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 6: PPKn — Norma dalam Masyarakat
// ═══════════════════════════════════════════════════════════════════

const ppknNorma: MarketplaceTemplate = {
  id: 'ppkn-norma-masyarakat',
  name: 'Norma dalam Masyarakat',
  description: 'Kenali berbagai norma yang berlaku di masyarakat melalui sortir game, roda game, dan kuis. Template interaktif untuk kelas 7 semester 1.',
  subject: 'PPKn',
  grade: 7,
  icon: '⚖️',
  coverGradient: ['y', 'g'],
  blockTypes: ['sortir-game', 'roda-game', 'kuis', 'diskusi', 'refleksi'],
  screens: 5,
  bsnpCompliant: true,
  previewBlocks: [
    { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
    { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Jenis Norma' }] },
    { templateType: 'game', label: 'Sortir Game', blocks: [{ type: 'sortir-game', icon: '🔀', label: 'Klasifikasi Norma' }] },
    { templateType: 'game', label: 'Roda Game', blocks: [{ type: 'roda-game', icon: '🎡', label: 'Roda Pertanyaan' }, { type: 'kuis', icon: '❓', label: 'Kuis' }] },
    { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'refleksi', icon: '📝', label: 'Refleksi' }] },
  ],
  schemaFactory: () => ({
    id: 'ppkn-norma-masyarakat',
    version: 1,
    title: 'Norma dalam Masyarakat',
    mapel: 'PPKn',
    kelas: 'VII',
    themeId: 'hakikat-norma',
    navbar: {
      logoText: '⚖️ Norma dalam Masyarakat',
      logoColor: 'y',
      progressGradient: ['y', 'g'],
    },
    screens: [
      makeScreen('cover', '🏠 Cover', 'y', [
        {
          type: 'cover',
          icon: '⚖️',
          title: 'Norma dalam Masyarakat',
          subtitle: 'PPKn Kelas VII — Semester 1',
          badges: [
            { icon: '🔀', text: 'Sortir Game', color: 'y' },
            { icon: '🎡', text: 'Roda Game', color: 'g' },
            { icon: '❓', text: 'Kuis', color: 'c' },
          ],
          meta: { durasi: '40 Menit', fase: 'Fase D', elemen: 'Beriman & Bertakwa' },
          cta: { label: '▶ Mulai Belajar', action: '' },
          background: { type: 'gradient', color1: 'y', color2: 'g' },
        } as SchemaBlock,
      ], undefined, { type: 'radial', color1: 'y', color2: 'bg' }),
      makeScreen('materi', '📖 Materi · ±12 Menit', 'y', [
        {
          type: 'def-box',
          borderColor: 'y',
          content: '<strong>Norma</strong> adalah aturan atau ketentuan yang mengikat warga masyarakat. Terdapat 4 jenis norma utama: <strong>Norma Agama, Norma Kesusilaan, Norma Kesopanan, dan Norma Hukum</strong>.',
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '🙏', title: 'Norma Agama', body: 'Aturan yang berasal dari Tuhan dan diwahyukan melalui kitab suci. Sanksinya dosa', color: 'y' },
            { icon: '❤️', title: 'Norma Kesusilaan', body: 'Aturan yang berasal dari hati nurani manusia. Sanksinya rasa bersalah', color: 'r' },
            { icon: '🤝', title: 'Norma Kesopanan', body: 'Aturan yang berasal dari pergaulan masyarakat. Sanksinya dikucilkan', color: 'c' },
            { icon: '⚖️', title: 'Norma Hukum', body: 'Aturan dari lembaga negara yang mengikat dan memaksa. Sanksinya hukuman resmi', color: 'p' },
          ],
        },
      ]),
      makeScreen('game', '🔀 Sortir Game · ±10 Menit', 'g', [
        {
          type: 'sortir-game',
          title: 'Klasifikasi Jenis Norma',
          pool: [
            { id: 's1', text: 'Beribadah sesuai agama', category: 'agama' },
            { id: 's2', text: 'Tidak mencuri milik orang lain', category: 'kesusilaan' },
            { id: 's3', text: 'Mengucapkan salam saat bertemu', category: 'kesopanan' },
            { id: 's4', text: 'Membayar pajak tepat waktu', category: 'hukum' },
            { id: 's5', text: 'Berpuasa di bulan Ramadan', category: 'agama' },
            { id: 's6', text: 'Tidak berbohong', category: 'kesusilaan' },
            { id: 's7', text: 'Mengantre dengan tertib', category: 'kesopanan' },
            { id: 's8', text: 'Mematuhi rambu lalu lintas', category: 'hukum' },
          ],
          kolom: [
            { id: 'agama', label: 'Norma Agama', color: 'y' },
            { id: 'kesusilaan', label: 'Norma Kesusilaan', color: 'r' },
            { id: 'kesopanan', label: 'Norma Kesopanan', color: 'c' },
            { id: 'hukum', label: 'Norma Hukum', color: 'p' },
          ],
        },
      ]),
      makeScreen('game', '🎡 Roda & Kuis · ±12 Menit', 'o', [
        {
          type: 'roda-game',
          title: 'Roda Pertanyaan — Norma',
          questions: [
            { q: 'Norma yang sanksinya berupa dosa adalah norma...', opts: [{ text: 'Agama', correct: true }, { text: 'Kesopanan', correct: false }, { text: 'Hukum', correct: false }], feedbackCorrect: 'Benar! Norma agama bersumber dari Tuhan.', feedbackWrong: 'Norma agama bersumber dari Tuhan, sanksinya dosa.' },
            { q: 'Mengantre tertib termasuk norma...', opts: [{ text: 'Kesusilaan', correct: false }, { text: 'Kesopanan', correct: true }, { text: 'Hukum', correct: false }], feedbackCorrect: 'Benar! Mengantre adalah norma kesopanan.', feedbackWrong: 'Mengantre termasuk norma kesopanan — aturan pergaulan.' },
            { q: 'Norma yang memaksa dan mengikat secara resmi adalah...', opts: [{ text: 'Kesopanan', correct: false }, { text: 'Agama', correct: false }, { text: 'Hukum', correct: true }], feedbackCorrect: 'Benar! Norma hukum bersifat memaksa.', feedbackWrong: 'Hanya norma hukum yang bersifat memaksa dan mengikat resmi.' },
          ],
        },
        {
          type: 'kuis',
          title: 'Kuis Norma',
          questions: [
            { q: 'Sanksi melanggar norma hukum adalah...', opts: ['Dosa', 'Dikucilkan', 'Hukuman resmi', 'Rasa bersalah'], ans: 2, ex: 'Norma hukum memiliki sanksi tegas berupa hukuman resmi dari negara.' },
            { q: 'Norma yang bersumber dari hati nurani disebut...', opts: ['Norma Agama', 'Norma Kesusilaan', 'Norma Kesopanan', 'Norma Hukum'], ans: 1, ex: 'Norma kesusilaan berasal dari suara hati nurani manusia.' },
            { q: 'Berikut yang BUKAN ciri norma hukum adalah...', opts: ['Memaksa', 'Mengikat', 'Berasal dari masyarakat', 'Dibuat oleh lembaga negara'], ans: 2, ex: 'Norma hukum dibuat oleh lembaga negara, bukan masyarakat secara langsung.' },
          ],
        },
      ]),
      makeScreen('refleksi', '📝 Refleksi · ±6 Menit', 'p', [
        {
          type: 'refleksi',
          title: 'Refleksi',
          questions: [
            { teks: 'Norma mana yang paling sering kamu terapkan di kehidupan sehari-hari?', petunjuk: 'Berikan contoh nyata…', warna: 'y', icon: '⚖️' },
            { teks: 'Apa yang terjadi jika tidak ada norma dalam masyarakat?', petunjuk: 'Bayangkan kehidupan tanpa aturan…', warna: 'r', icon: '🤔' },
          ],
        },
      ]),
    ],
  }),
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 7: PPKn — Hak dan Kewajiban
// ═══════════════════════════════════════════════════════════════════

const ppknHakKewajiban: MarketplaceTemplate = {
  id: 'ppkn-hak-kewajiban',
  name: 'Hak dan Kewajiban',
  description: 'Pahami hak dan kewajiban warga negara melalui matching game, benar-salah, dan diskusi. Template bermakna untuk kelas 8 semester 2.',
  subject: 'PPKn',
  grade: 8,
  icon: '🛡️',
  coverGradient: ['p', 'g'],
  blockTypes: ['matching-game', 'true-false-game', 'kuis', 'diskusi', 'refleksi'],
  screens: 5,
  bsnpCompliant: true,
  previewBlocks: [
    { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
    { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Hak & Kewajiban' }] },
    { templateType: 'game', label: 'Matching', blocks: [{ type: 'matching-game', icon: '🔗', label: 'Cocokkan' }] },
    { templateType: 'game', label: 'Benar-Salah', blocks: [{ type: 'true-false-game', icon: '✅', label: 'Benar-Salah' }, { type: 'kuis', icon: '❓', label: 'Kuis' }] },
    { templateType: 'refleksi', label: 'Diskusi & Refleksi', blocks: [{ type: 'diskusi', icon: '💬', label: 'Diskusi' }, { type: 'refleksi', icon: '📝', label: 'Refleksi' }] },
  ],
  schemaFactory: () => ({
    id: 'ppkn-hak-kewajiban',
    version: 1,
    title: 'Hak dan Kewajiban Warga Negara',
    mapel: 'PPKn',
    kelas: 'VIII',
    themeId: 'ham-hak-kewajiban',
    navbar: {
      logoText: '🛡️ Hak & Kewajiban',
      logoColor: 'p',
      progressGradient: ['p', 'g'],
    },
    screens: [
      makeScreen('cover', '🏠 Cover', 'p', [
        {
          type: 'cover',
          icon: '🛡️',
          title: 'Hak dan Kewajiban Warga Negara',
          subtitle: 'PPKn Kelas VIII — Semester 2',
          badges: [
            { icon: '🔗', text: 'Matching', color: 'p' },
            { icon: '✅', text: 'Benar-Salah', color: 'g' },
            { icon: '💬', text: 'Diskusi', color: 'c' },
          ],
          meta: { durasi: '40 Menit', fase: 'Fase D', elemen: 'Beriman & Bertakwa' },
          cta: { label: '▶ Mulai Belajar', action: '' },
          background: { type: 'gradient', color1: 'p', color2: 'g' },
        } as SchemaBlock,
      ], undefined, { type: 'radial', color1: 'p', color2: 'bg' }),
      makeScreen('materi', '📖 Materi · ±12 Menit', 'p', [
        {
          type: 'def-box',
          borderColor: 'p',
          content: '<strong>Hak</strong> adalah sesuatu yang mutlak menjadi milik kita dan tidak bisa diganggu gugat. <strong>Kewajiban</strong> adalah sesuatu yang harus dilakukan dengan penuh tanggung jawab. Hak dan kewajiban saling berkaitan — tidak bisa dipisahkan.',
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '📚', title: 'Hak Pendidikan', body: 'Setiap warga negara berhak mendapat pendidikan (UUD 1945 Pasal 31)', color: 'y' },
            { icon: '🗳️', title: 'Hak Memilih', body: 'Warga negara berhak memilih dan dipilih dalam pemilu (Pasal 22E)', color: 'c' },
            { icon: '💰', title: 'Kewajiban Pajak', body: 'Warga negara wajib membayar pajak untuk pembangunan (Pasal 23A)', color: 'g' },
            { icon: '🛡️', title: 'Kewajiban Bela Negara', body: 'Setiap warga negara wajib ikut serta dalam usaha pertahanan (Pasal 30)', color: 'p' },
          ],
        },
      ]),
      makeScreen('game', '🔗 Matching · ±8 Menit', 'c', [
        {
          type: 'matching-game',
          title: 'Cocokkan — Hak & Kewajiban',
          pairs: [
            { left: 'Hak atas pendidikan', right: 'Pasal 31 UUD 1945' },
            { left: 'Kewajiban membayar pajak', right: 'Pasal 23A UUD 1945' },
            { left: 'Hak memilih dalam pemilu', right: 'Pasal 22E UUD 1945' },
            { left: 'Kewajiban bela negara', right: 'Pasal 30 UUD 1945' },
            { left: 'Hak atas pekerjaan', right: 'Pasal 27 Ayat 2' },
          ],
        },
      ]),
      makeScreen('game', '✅ Benar-Salah & Kuis · ±12 Menit', 'o', [
        {
          type: 'true-false-game',
          title: 'Benar atau Salah?',
          questions: [
            { text: 'Hak dan kewajiban bisa dipisahkan', correct: false, explanation: 'Hak dan kewajiban saling berkaitan dan tidak bisa dipisahkan.' },
            { text: 'Membayar pajak adalah kewajiban warga negara', correct: true, explanation: 'Diatur dalam Pasal 23A UUD 1945.' },
            { text: 'Hanya orang kaya yang berhak mendapat pendidikan', correct: false, explanation: 'Setiap warga negara berhak mendapat pendidikan tanpa diskriminasi.' },
            { text: 'Bela negara hanya bisa dilakukan dengan menjadi tentara', correct: false, explanation: 'Bela negara bisa dilakukan banyak cara: menjaga kebersihan, mematuhi hukum, dll.' },
          ],
        },
        {
          type: 'kuis',
          title: 'Kuis Hak & Kewajiban',
          questions: [
            { q: 'Pasal berapakah yang mengatur hak atas pendidikan?', opts: ['Pasal 27', 'Pasal 28', 'Pasal 30', 'Pasal 31'], ans: 3, ex: 'Pasal 31 UUD 1945 mengatur hak setiap warga negara atas pendidikan.' },
            { q: 'Contoh kewajiban warga negara di sekolah adalah...', opts: ['Mendapat buku gratis', 'Memilih ketua kelas', 'Mematuhi tata tertib', 'Mengikuti ekskul'], ans: 2, ex: 'Mematuhi tata tertib sekolah adalah kewajiban sebagai siswa.' },
          ],
        },
      ]),
      makeScreen('refleksi', '📝 Diskusi & Refleksi · ±8 Menit', 'g', [
        {
          type: 'diskusi',
          title: 'Diskusi Kelas',
          questions: [
            { label: 'Diskusi', icon: '💬', teks: 'Mengapa hak dan kewajiban harus seimbang? Apa yang terjadi jika hanya menuntut hak tanpa menjalankan kewajiban?', petunjuk: 'Berikan pendapatmu…', color: 'p' },
          ],
        },
        {
          type: 'refleksi',
          title: 'Refleksi',
          questions: [
            { teks: 'Apa kewajiban yang sudah kamu lakukan dengan baik sebagai warga negara?', petunjuk: 'Jujurlah pada diri sendiri…', warna: 'g', icon: '🛡️' },
          ],
        },
      ]),
    ],
  }),
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 8: Seni Budaya — Seni Rupa
// ═══════════════════════════════════════════════════════════════════

const seniRupa: MarketplaceTemplate = {
  id: 'seni-seni-rupa',
  name: 'Seni Rupa',
  description: 'Eksplorasi dunia seni rupa Nusantara melalui gambar, flashcard, dan drag-drop. Template kreatif untuk kelas 8 semester 1.',
  subject: 'Seni Budaya',
  grade: 8,
  icon: '🎨',
  coverGradient: ['o', 'r'],
  blockTypes: ['flashcard-set', 'drag-drop-game', 'kuis', 'diskusi', 'refleksi'],
  screens: 5,
  bsnpCompliant: true,
  previewBlocks: [
    { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
    { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Unsur Seni Rupa' }, { type: 'flashcard-set', icon: '🃏', label: 'Flashcard' }] },
    { templateType: 'game', label: 'Drag-Drop', blocks: [{ type: 'drag-drop-game', icon: '👆', label: 'Klasifikasi' }] },
    { templateType: 'game', label: 'Kuis', blocks: [{ type: 'kuis', icon: '❓', label: 'Kuis' }] },
    { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'diskusi', icon: '💬', label: 'Diskusi' }, { type: 'refleksi', icon: '📝', label: 'Refleksi' }] },
  ],
  schemaFactory: () => ({
    id: 'seni-seni-rupa',
    version: 1,
    title: 'Seni Rupa Nusantara',
    mapel: 'Seni Budaya',
    kelas: 'VIII',
    themeId: 'colorful',
    navbar: {
      logoText: '🎨 Seni Rupa',
      logoColor: 'o',
      progressGradient: ['o', 'r'],
    },
    screens: [
      makeScreen('cover', '🏠 Cover', 'o', [
        {
          type: 'cover',
          icon: '🎨',
          title: 'Seni Rupa Nusantara',
          subtitle: 'Seni Budaya Kelas VIII — Semester 1',
          badges: [
            { icon: '🃏', text: 'Flashcard', color: 'o' },
            { icon: '👆', text: 'Drag-Drop', color: 'r' },
            { icon: '💬', text: 'Diskusi', color: 'c' },
          ],
          meta: { durasi: '40 Menit', fase: 'Fase D', elemen: 'Kreatif' },
          cta: { label: '▶ Mulai Berkarya', action: '' },
          background: { type: 'gradient', color1: 'o', color2: 'r' },
        } as SchemaBlock,
      ], undefined, { type: 'radial', color1: 'o', color2: 'bg' }),
      makeScreen('materi', '📖 Materi · ±12 Menit', 'o', [
        {
          type: 'def-box',
          borderColor: 'o',
          content: '<strong>Seni rupa</strong> adalah cabang seni yang membentuk karya seni dengan media yang bisa ditangkap mata dan diraba. Karya seni rupa Nusantara sangat beragam, dari batik hingga ukiran.',
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '📏', title: 'Garis', body: 'Unsur dasar seni rupa. Bisa lurus, melengkung, zigzag, dll', color: 'o' },
            { icon: '⬜', title: 'Bentuk', body: 'Bentuk dasar: segitiga, lingkaran, persegi. Bentuk figuratif & abstrak', color: 'r' },
            { icon: '🎨', title: 'Warna', body: 'Primer (merah, kuning, biru), sekunder, tersier. Memberi nuansa karya', color: 'y' },
            { icon: '🧵', title: 'Tekstur', body: 'Kualitas permukaan: halus, kasar, berkilau, kusam. Tactile & visual', color: 'g' },
          ],
        },
        {
          type: 'flashcard-set',
          cards: [
            { q: 'Sebutkan 3 warna primer!', a: 'Merah, Kuning, Biru — warna dasar yang tidak bisa dibuat dari campuran warna lain.' },
            { q: 'Apa perbedaan seni rupa 2D dan 3D?', a: '2D: memiliki panjang dan lebar (lukisan). 3D: memiliki panjang, lebar, dan kedalaman (patung).' },
            { q: 'Apa yang dimaksud tekstur visual?', a: 'Tekstur yang terlihat dari pandangan mata tetapi tidak bisa diraba secara nyata.' },
          ],
        },
      ]),
      makeScreen('game', '👆 Drag-Drop · ±10 Menit', 'r', [
        {
          type: 'drag-drop-game',
          title: 'Klasifikasi Seni Rupa',
          items: [
            { text: 'Lukisan', target: '2d' },
            { text: 'Patung', target: '3d' },
            { text: 'Batik', target: '2d' },
            { text: 'Ukiran kayu', target: '3d' },
            { text: 'Poster', target: '2d' },
            { text: 'Keramik', target: '3d' },
          ],
          targets: [
            { id: '2d', label: 'Seni Rupa 2 Dimensi', color: 'o' },
            { id: '3d', label: 'Seni Rupa 3 Dimensi', color: 'r' },
          ],
        },
      ]),
      makeScreen('game', '❓ Kuis · ±10 Menit', 'y', [
        {
          type: 'kuis',
          title: 'Kuis Seni Rupa',
          questions: [
            { q: 'Unsur seni rupa yang paling dasar adalah...', opts: ['Warna', 'Garis', 'Bentuk', 'Tekstur'], ans: 1, ex: 'Garis adalah unsur paling dasar karena semua bentuk dimulai dari garis.' },
            { q: 'Batik termasuk karya seni rupa...', opts: ['3 Dimensi', '2 Dimensi', '4 Dimensi', '1 Dimensi'], ans: 1, ex: 'Batik memiliki panjang dan lebar — termasuk seni rupa 2 dimensi.' },
            { q: 'Campuran merah + kuning menghasilkan warna...', opts: ['Hijau', 'Ungu', 'Oranye', 'Coklat'], ans: 2, ex: 'Merah + Kuning = Oranye (warna sekunder).' },
          ],
        },
      ]),
      makeScreen('refleksi', '📝 Refleksi · ±8 Menit', 'c', [
        {
          type: 'diskusi',
          title: 'Diskusi Seni',
          questions: [
            { label: 'Diskusi', icon: '🎨', teks: 'Karya seni rupa daerahmu yang mana yang paling terkenal? Jelaskan!', petunjuk: 'Ceritakan karya seni dari daerahmu…', color: 'o' },
          ],
        },
        {
          type: 'refleksi',
          title: 'Refleksi',
          questions: [
            { teks: 'Jika kamu bisa membuat karya seni rupa, apa yang akan kamu buat?', petunjuk: 'Gambaran karyamu…', warna: 'o', icon: '🎨' },
          ],
        },
      ]),
    ],
  }),
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 9: PJOK — Olahraga dan Kesehatan
// ═══════════════════════════════════════════════════════════════════

const pjokOlahraga: MarketplaceTemplate = {
  id: 'pjok-olahraga-kesehatan',
  name: 'Olahraga dan Kesehatan',
  description: 'Kuasai konsep kebugaran dan kesehatan melalui team buzzer, kuis, dan refleksi. Template aktif untuk kelas 8 semester 2.',
  subject: 'PJOK',
  grade: 8,
  icon: '🏃',
  coverGradient: ['g', 'y'],
  blockTypes: ['team-buzzer-game', 'kuis', 'refleksi', 'diskusi'],
  screens: 4,
  bsnpCompliant: true,
  previewBlocks: [
    { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
    { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Komponen Kebugaran' }] },
    { templateType: 'game', label: 'Team Buzzer', blocks: [{ type: 'team-buzzer-game', icon: '🔔', label: 'Team Buzzer' }] },
    { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'kuis', icon: '❓', label: 'Kuis' }, { type: 'refleksi', icon: '📝', label: 'Refleksi' }] },
  ],
  schemaFactory: () => ({
    id: 'pjok-olahraga-kesehatan',
    version: 1,
    title: 'Olahraga dan Kesehatan',
    mapel: 'PJOK',
    kelas: 'VIII',
    themeId: 'default',
    navbar: {
      logoText: '🏃 Olahraga & Kesehatan',
      logoColor: 'g',
      progressGradient: ['g', 'y'],
    },
    screens: [
      makeScreen('cover', '🏠 Cover', 'g', [
        {
          type: 'cover',
          icon: '🏃',
          title: 'Olahraga dan Kesehatan',
          subtitle: 'PJOK Kelas VIII — Semester 2',
          badges: [
            { icon: '🔔', text: 'Team Buzzer', color: 'g' },
            { icon: '❓', text: 'Kuis', color: 'y' },
            { icon: '📝', text: 'Refleksi', color: 'c' },
          ],
          meta: { durasi: '40 Menit', fase: 'Fase D', elemen: 'Gotong Royong' },
          cta: { label: '▶ Mulai Bergerak', action: '' },
          background: { type: 'gradient', color1: 'g', color2: 'y' },
        } as SchemaBlock,
      ], undefined, { type: 'radial', color1: 'g', color2: 'bg' }),
      makeScreen('materi', '📖 Materi · ±12 Menit', 'g', [
        {
          type: 'def-box',
          borderColor: 'g',
          content: '<strong>Kebugaran jasmani</strong> adalah kemampuan seseorang untuk melakukan tugas sehari-hari secara efisien tanpa kelelahan berlebihan. Kebugaran terdiri dari komponen-komponen yang bisa dilatih.',
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '💪', title: 'Kekuatan', body: 'Kemampuan otot untuk menghasilkan tenaga. Dilatih dengan angkat beban, push-up', color: 'r' },
            { icon: '⚡', title: 'Kecepatan', body: 'Kemampuan berpindah dalam waktu singkat. Dilatih dengan lari sprint', color: 'y' },
            { icon: '🔄', title: 'Ketahanan', body: 'Kemampuan melakukan aktivitas lama tanpa lelah. Dilatih dengan lari jarak jauh', color: 'g' },
            { icon: '🤸', title: 'Kelenturan', body: 'Kemampuan sendi bergerak secara maksimal. Dilatih dengan stretching, yoga', color: 'c' },
          ],
        },
      ]),
      makeScreen('game', '🔔 Team Buzzer · ±12 Menit', 'o', [
        {
          type: 'team-buzzer-game',
          title: 'Lomba Cepat — Kebugaran',
          teamA: 'Tim Merah',
          teamB: 'Tim Biru',
          questions: [
            { teks: 'Sebutkan 4 komponen kebugaran jasmani!', poin: 10 },
            { teks: 'Latihan apa yang baik untuk kekuatan otot lengan?', poin: 10 },
            { teks: 'Berapa menit waktu olahraga yang dianjurkan per hari?', poin: 10 },
            { teks: 'Apa manfaat stretching sebelum olahraga?', poin: 15 },
            { teks: 'Sebutkan 3 contoh olahraga kardiovaskular!', poin: 15 },
          ],
        },
      ]),
      makeScreen('refleksi', '📝 Kuis & Refleksi · ±16 Menit', 'c', [
        {
          type: 'kuis',
          title: 'Kuis Kebugaran',
          questions: [
            { q: 'Latihan lari jarak jauh melatih komponen...', opts: ['Kekuatan', 'Kecepatan', 'Ketahanan', 'Kelenturan'], ans: 2, ex: 'Lari jarak jauh melatih daya tahan jantung dan paru-paru (ketahanan).' },
            { q: 'Push-up melatih komponen kebugaran...', opts: ['Kelenturan', 'Kekuatan', 'Kecepatan', 'Keseimbangan'], ans: 1, ex: 'Push-up melatih kekuatan otot lengan dan dada.' },
            { q: 'Berapa durasi olahraga yang disarankan WHO untuk remaja?', opts: ['30 menit/hari', '60 menit/hari', '15 menit/hari', '90 menit/hari'], ans: 1, ex: 'WHO merekomendasikan 60 menit aktivitas fisik sedang setiap hari untuk remaja.' },
          ],
        },
        {
          type: 'refleksi',
          title: 'Refleksi',
          questions: [
            { teks: 'Komponen kebugaran mana yang paling perlu kamu tingkatkan? Mengapa?', petunjuk: 'Evaluasi dirimu…', warna: 'g', icon: '💪' },
            { teks: 'Buat rencana olahraga mingguan untuk dirimu!', petunjuk: 'Tentukan jenis, durasi, dan frekuensi…', warna: 'y', icon: '📋' },
          ],
        },
      ]),
    ],
  }),
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 10: Informatika — Algoritma
// ═══════════════════════════════════════════════════════════════════

const informatikaAlgoritma: MarketplaceTemplate = {
  id: 'info-algoritma',
  name: 'Algoritma',
  description: 'Pelajari dasar algoritma dan pseudocode melalui sortir game, fill-blank, dan kuis. Template logis untuk kelas 9 semester 1.',
  subject: 'Informatika',
  grade: 9,
  icon: '💻',
  coverGradient: ['c', 'g'],
  blockTypes: ['sortir-game', 'fill-blank-game', 'kuis', 'refleksi'],
  screens: 5,
  bsnpCompliant: true,
  previewBlocks: [
    { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
    { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Konsep' }] },
    { templateType: 'game', label: 'Sortir', blocks: [{ type: 'sortir-game', icon: '🔀', label: 'Urutkan Algoritma' }] },
    { templateType: 'game', label: 'Latihan', blocks: [{ type: 'fill-blank-game', icon: '✏️', label: 'Isian' }, { type: 'kuis', icon: '❓', label: 'Kuis' }] },
    { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'refleksi', icon: '📝', label: 'Refleksi' }] },
  ],
  schemaFactory: () => ({
    id: 'info-algoritma',
    version: 1,
    title: 'Dasar Algoritma',
    mapel: 'Informatika',
    kelas: 'IX',
    themeId: 'default',
    navbar: {
      logoText: '💻 Algoritma',
      logoColor: 'c',
      progressGradient: ['c', 'g'],
    },
    screens: [
      makeScreen('cover', '🏠 Cover', 'c', [
        {
          type: 'cover',
          icon: '💻',
          title: 'Dasar Algoritma',
          subtitle: 'Informatika Kelas IX — Semester 1',
          badges: [
            { icon: '🔀', text: 'Sortir', color: 'c' },
            { icon: '✏️', text: 'Isian', color: 'g' },
            { icon: '❓', text: 'Kuis', color: 'y' },
          ],
          meta: { durasi: '40 Menit', fase: 'Fase D', elemen: 'Bernalar Kritis' },
          cta: { label: '▶ Mulai Belajar', action: '' },
          background: { type: 'gradient', color1: 'c', color2: 'g' },
        } as SchemaBlock,
      ], undefined, { type: 'radial', color1: 'c', color2: 'bg' }),
      makeScreen('materi', '📖 Materi · ±12 Menit', 'c', [
        {
          type: 'def-box',
          borderColor: 'c',
          content: '<strong>Algoritma</strong> adalah urutan langkah-langkah logis untuk menyelesaikan suatu masalah. Algoritma harus jelas, terbatas, dan menghasilkan output. Ditulis dalam <strong>pseudocode</strong> atau <strong>flowchart</strong>.',
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '📋', title: 'Sekuensial', body: 'Langkah dijalankan satu per satu secara berurutan dari awal sampai akhir', color: 'c' },
            { icon: '🔀', title: 'Percabangan', body: 'Pemilihan langkah berdasarkan kondisi: IF-THEN-ELSE', color: 'y' },
            { icon: '🔄', title: 'Perulangan', body: 'Langkah diulang beberapa kali: FOR, WHILE, DO-WHILE', color: 'g' },
            { icon: '📊', title: 'Flowchart', body: 'Diagram alir yang menggambarkan algoritma secara visual dengan simbol-simbol', color: 'p' },
          ],
        },
      ]),
      makeScreen('game', '🔀 Sortir · ±8 Menit', 'g', [
        {
          type: 'sortir-game',
          title: 'Urutkan Langkah Algoritma',
          pool: [
            { id: 's1', text: 'Identifikasi masalah', category: 'langkah-1' },
            { id: 's2', text: 'Tentukan input & output', category: 'langkah-2' },
            { id: 's3', text: 'Tulis algoritma', category: 'langkah-3' },
            { id: 's4', text: 'Uji algoritma', category: 'langkah-4' },
            { id: 's5', text: 'Perbaiki jika ada kesalahan', category: 'langkah-5' },
            { id: 's6', text: 'Implementasi ke program', category: 'langkah-6' },
          ],
          kolom: [
            { id: 'langkah-1', label: '1 — Mulai', color: 'c' },
            { id: 'langkah-2', label: '2 — Analisis', color: 'y' },
            { id: 'langkah-3', label: '3 — Desain', color: 'g' },
            { id: 'langkah-4', label: '4 — Verifikasi', color: 'o' },
            { id: 'langkah-5', label: '5 — Koreksi', color: 'r' },
            { id: 'langkah-6', label: '6 — Implementasi', color: 'p' },
          ],
        },
      ]),
      makeScreen('game', '✏️ Latihan · ±12 Menit', 'o', [
        {
          type: 'fill-blank-game',
          title: 'Isian Singkat — Algoritma',
          questions: [
            { text: 'Struktur yang menjalankan langkah berdasarkan kondisi disebut ___', answer: 'Percabangan', hint: 'IF-THEN-ELSE' },
            { text: 'Struktur yang mengulang langkah disebut ___', answer: 'Perulangan', hint: 'FOR, WHILE' },
            { text: 'Diagram alir visual untuk algoritma disebut ___', answer: 'Flowchart', hint: 'Menggunakan simbol-simbol' },
            { text: 'Langkah berurutan tanpa percabangan disebut ___', answer: 'Sekuensial', hint: 'Satu per satu dari atas ke bawah' },
          ],
        },
        {
          type: 'kuis',
          title: 'Kuis Algoritma',
          questions: [
            { q: 'Simbol berlian (diamond) dalam flowchart berarti...', opts: ['Proses', 'Keputusan', 'Input/Output', 'Awal/Akhir'], ans: 1, ex: 'Simbol berlian menunjukkan percabangan/keputusan (decision).' },
            { q: 'Apa output dari: x = 5, IF x > 3 THEN tampilkan "Besar"?', opts: ['"Kecil"', '"Besar"', 'Tidak ada output', 'Error'], ans: 1, ex: 'Karena 5 > 3 bernilai True, maka outputnya "Besar".' },
            { q: 'FOR i = 1 TO 3: tampilkan i. Berapa kali tampil?', opts: ['1', '2', '3', '4'], ans: 2, ex: 'Perulangan dari 1 sampai 3 menghasilkan 3 iterasi.' },
          ],
        },
      ]),
      makeScreen('refleksi', '📝 Refleksi · ±8 Menit', 'p', [
        {
          type: 'refleksi',
          title: 'Refleksi',
          questions: [
            { teks: 'Buat pseudocode sederhana untuk menentukan apakah suatu bilangan genap atau ganjil!', petunjuk: 'Gunakan IF-THEN-ELSE…', warna: 'c', icon: '💻' },
            { teks: 'Apa perbedaan utama antara FOR dan WHILE?', petunjuk: 'Fokus pada kondisi perulangan…', warna: 'g', icon: '🔄' },
          ],
        },
      ]),
    ],
  }),
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 11: Matematika — Geometri
// ═══════════════════════════════════════════════════════════════════

const matematikaGeometri: MarketplaceTemplate = {
  id: 'mat-geometri',
  name: 'Geometri',
  description: 'Pahami bangun ruang sisi datar melalui matching game, word search, dan kuis. Template visual untuk kelas 9 semester 1.',
  subject: 'Matematika',
  grade: 9,
  icon: '📐',
  coverGradient: ['y', 'c'],
  blockTypes: ['matching-game', 'word-search-game', 'kuis', 'flashcard-set', 'refleksi'],
  screens: 5,
  bsnpCompliant: true,
  previewBlocks: [
    { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
    { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'flashcard-set', icon: '🃏', label: 'Flashcard' }] },
    { templateType: 'game', label: 'Matching', blocks: [{ type: 'matching-game', icon: '🔗', label: 'Cocokkan' }] },
    { templateType: 'game', label: 'Word Search & Kuis', blocks: [{ type: 'word-search-game', icon: '🔍', label: 'Cari Kata' }, { type: 'kuis', icon: '❓', label: 'Kuis' }] },
    { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'refleksi', icon: '📝', label: 'Refleksi' }] },
  ],
  schemaFactory: () => ({
    id: 'mat-geometri',
    version: 1,
    title: 'Bangun Ruang Sisi Datar',
    mapel: 'Matematika',
    kelas: 'IX',
    themeId: 'default',
    navbar: {
      logoText: '📐 Geometri',
      logoColor: 'y',
      progressGradient: ['y', 'c'],
    },
    screens: [
      makeScreen('cover', '🏠 Cover', 'y', [
        {
          type: 'cover',
          icon: '📐',
          title: 'Bangun Ruang Sisi Datar',
          subtitle: 'Matematika Kelas IX — Semester 1',
          badges: [
            { icon: '🔗', text: 'Matching', color: 'y' },
            { icon: '🔍', text: 'Word Search', color: 'c' },
            { icon: '❓', text: 'Kuis', color: 'g' },
          ],
          meta: { durasi: '40 Menit', fase: 'Fase D', elemen: 'Bernalar Kritis' },
          cta: { label: '▶ Mulai Belajar', action: '' },
          background: { type: 'gradient', color1: 'y', color2: 'c' },
        } as SchemaBlock,
      ], undefined, { type: 'radial', color1: 'y', color2: 'bg' }),
      makeScreen('materi', '📖 Materi · ±12 Menit', 'y', [
        {
          type: 'def-box',
          borderColor: 'y',
          content: '<strong>Bangun ruang sisi datar</strong> adalah bangun ruang yang seluruh sisinya berbentuk datar. Terdiri dari kubus, balok, prisma, dan limas.',
        },
        {
          type: 'flashcard-set',
          cards: [
            { q: 'Rumus volume kubus?', a: 'V = s³ (sisi pangkat 3). Contoh: kubus sisi 5 cm → V = 125 cm³' },
            { q: 'Rumus luas permukaan balok?', a: 'L = 2(pl + pt + lt). p=panjang, l=lebar, t=tinggi' },
            { q: 'Rumus volume prisma segitiga?', a: 'V = Lalas × t. Lalas = ½ × alas × tinggi segitiga' },
            { q: 'Rumus volume limas?', a: 'V = ⅓ × Lalas × t. Volume limas = ⅓ volume prisma dengan alas sama' },
          ],
        },
      ]),
      makeScreen('game', '🔗 Matching · ±8 Menit', 'c', [
        {
          type: 'matching-game',
          title: 'Cocokkan — Bangun Ruang',
          pairs: [
            { left: 'Kubus', right: '6 sisi persegi, 12 rusuk sama' },
            { left: 'Balok', right: '6 sisi persegi panjang' },
            { left: 'Prisma Segitiga', right: '2 segitiga + 3 persegi panjang' },
            { left: 'Limas Segi Empat', right: '1 persegi + 4 segitiga' },
            { left: 'V = s³', right: 'Volume Kubus' },
          ],
        },
      ]),
      makeScreen('game', '🔍 Kuis & Cari Kata · ±14 Menit', 'g', [
        {
          type: 'word-search-game',
          title: 'Cari Kata — Geometri',
          words: ['Kubus', 'Balok', 'Prisma', 'Limas', 'Rusuk', 'Sisi', 'Diagonal', 'Volume'],
          gridSize: 10,
        },
        {
          type: 'kuis',
          title: 'Kuis Geometri',
          questions: [
            { q: 'Volume kubus dengan sisi 4 cm adalah...', opts: ['16 cm³', '32 cm³', '64 cm³', '48 cm³'], ans: 2, ex: 'V = s³ = 4³ = 64 cm³.' },
            { q: 'Berapa jumlah rusuk kubus?', opts: ['6', '8', '10', '12'], ans: 3, ex: 'Kubus memiliki 12 rusuk.' },
            { q: 'Volume limas dengan alas persegi 6 cm dan tinggi 10 cm adalah...', opts: ['360 cm³', '120 cm³', '60 cm³', '180 cm³'], ans: 1, ex: 'V = ⅓ × 6² × 10 = ⅓ × 360 = 120 cm³.' },
          ],
        },
      ]),
      makeScreen('refleksi', '📝 Refleksi · ±6 Menit', 'p', [
        {
          type: 'refleksi',
          title: 'Refleksi',
          questions: [
            { teks: 'Bangun ruang mana yang paling sering kamu temui di kehidupan sehari-hari?', petunjuk: 'Perhatikan benda-benda di sekitarmu…', warna: 'y', icon: '📐' },
            { teks: 'Mengapa penting memahami volume bangun ruang?', petunjuk: 'Hubungkan dengan kehidupan nyata…', warna: 'c', icon: '💡' },
          ],
        },
      ]),
    ],
  }),
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 12: IPS — Geografi Indonesia
// ═══════════════════════════════════════════════════════════════════

const ipsGeografi: MarketplaceTemplate = {
  id: 'ips-geografi-indonesia',
  name: 'Geografi Indonesia',
  description: 'Jelajahi kekayaan geografis Indonesia melalui crossword, benar-salah, dan diskusi. Template eksploratif untuk kelas 9 semester 2.',
  subject: 'IPS',
  grade: 9,
  icon: '🗺️',
  coverGradient: ['g', 'p'],
  blockTypes: ['crossword-game', 'true-false-game', 'kuis', 'diskusi', 'refleksi'],
  screens: 5,
  bsnpCompliant: true,
  previewBlocks: [
    { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
    { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Fakta Geografi' }] },
    { templateType: 'game', label: 'Crossword', blocks: [{ type: 'crossword-game', icon: '🧩', label: 'Teka-Teki Silang' }] },
    { templateType: 'game', label: 'Kuis', blocks: [{ type: 'true-false-game', icon: '✅', label: 'Benar-Salah' }, { type: 'kuis', icon: '❓', label: 'Kuis' }] },
    { templateType: 'refleksi', label: 'Diskusi & Refleksi', blocks: [{ type: 'diskusi', icon: '💬', label: 'Diskusi' }, { type: 'refleksi', icon: '📝', label: 'Refleksi' }] },
  ],
  schemaFactory: () => ({
    id: 'ips-geografi-indonesia',
    version: 1,
    title: 'Geografi Indonesia',
    mapel: 'IPS',
    kelas: 'IX',
    themeId: 'default',
    navbar: {
      logoText: '🗺️ Geografi Indonesia',
      logoColor: 'g',
      progressGradient: ['g', 'p'],
    },
    screens: [
      makeScreen('cover', '🏠 Cover', 'g', [
        {
          type: 'cover',
          icon: '🗺️',
          title: 'Geografi Indonesia',
          subtitle: 'IPS Kelas IX — Semester 2',
          badges: [
            { icon: '🧩', text: 'Crossword', color: 'g' },
            { icon: '✅', text: 'Benar-Salah', color: 'c' },
            { icon: '💬', text: 'Diskusi', color: 'p' },
          ],
          meta: { durasi: '40 Menit', fase: 'Fase D', elemen: 'Berkebinekaan Global' },
          cta: { label: '▶ Mulai Eksplorasi', action: '' },
          background: { type: 'gradient', color1: 'g', color2: 'p' },
        } as SchemaBlock,
      ], undefined, { type: 'radial', color1: 'g', color2: 'bg' }),
      makeScreen('materi', '📖 Materi · ±12 Menit', 'g', [
        {
          type: 'def-box',
          borderColor: 'g',
          content: '<strong>Indonesia</strong> adalah negara kepulauan terbesar di dunia dengan <strong>17.504 pulau</strong>, terletak di antara dua benua (Asia dan Australia) dan dua samudra (Hindia dan Pasifik). Posisi ini memberikan keuntungan strategis.',
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '🌏', title: 'Letak Astronomis', body: '6°LU – 11°LS, 95°BT – 141°BT. Berada di zona tropis', color: 'g' },
            { icon: '📍', title: 'Letak Geografis', body: 'Terletak di persilangan jalur perdagangan dunia antara Asia dan Australia', color: 'c' },
            { icon: '🌋', title: 'Ring of Fire', body: 'Terletak di sabuk gempa dan gunung berapi Pasifik, rawan bencana tapi tanah subur', color: 'r' },
            { icon: '🏝️', title: 'Kepulauan', body: '17.504 pulau, 5 pulau besar: Jawa, Sumatera, Kalimantan, Sulawesi, Papua', color: 'y' },
          ],
        },
      ]),
      makeScreen('game', '🧩 Crossword · ±10 Menit', 'c', [
        {
          type: 'crossword-game',
          title: 'Teka-Teki Silang — Geografi Indonesia',
          words: [
            { teks: 'Indonesia', hint: 'Negara kepulauan terbesar di dunia' },
            { teks: 'Tropis', hint: 'Iklim yang dimiliki Indonesia' },
            { teks: 'Papua', hint: 'Pulau paling timur di Indonesia' },
            { teks: 'Sumatera', hint: 'Pulau terbesar kedua di Indonesia' },
            { teks: 'Krakatau', hint: 'Gunung berapi terkenal di Selat Sunda' },
            { teks: 'Borobudur', hint: 'Candi Buddha terbesar di dunia, ada di Jawa Tengah' },
          ],
          gridSize: 12,
        },
      ]),
      makeScreen('game', '✅ Kuis · ±12 Menit', 'o', [
        {
          type: 'true-false-game',
          title: 'Benar atau Salah?',
          questions: [
            { text: 'Indonesia memiliki lebih dari 17.000 pulau', correct: true, explanation: 'Tepat! Indonesia memiliki 17.504 pulau.' },
            { text: 'Indonesia terletak di benua Eropa', correct: false, explanation: 'Indonesia terletak di benua Asia (bagian tenggara).' },
            { text: 'Jawa adalah pulau terbesar di Indonesia', correct: false, explanation: 'Pulau terbesar adalah Kalimantan, bukan Jawa.' },
            { text: 'Indonesia dilalui garis khatulistiwa', correct: true, explanation: 'Benar! Garis khatulistiwa melintasi Indonesia.' },
          ],
        },
        {
          type: 'kuis',
          title: 'Kuis Geografi',
          questions: [
            { q: 'Samudra yang berbatasan dengan Indonesia di sebelah selatan adalah...', opts: ['Samudra Pasifik', 'Samudra Hindia', 'Samudra Atlantik', 'Samudra Arktik'], ans: 1, ex: 'Samudra Hindia terletak di sebelah selatan Indonesia.' },
            { q: 'Pulau terbesar di Indonesia adalah...', opts: ['Jawa', 'Sumatera', 'Kalimantan', 'Papua'], ans: 2, ex: 'Kalimantan adalah pulau terbesar di Indonesia.' },
            { q: 'Indonesia terletak di sabuk gempa yang disebut...', opts: ['Pacific Ring', 'Ring of Fire', 'Fire Belt', 'Earthquake Zone'], ans: 1, ex: 'Ring of Fire adalah sabuk gempa dan gunung berapi Pasifik.' },
          ],
        },
      ]),
      makeScreen('refleksi', '📝 Diskusi & Refleksi · ±6 Menit', 'p', [
        {
          type: 'diskusi',
          title: 'Diskusi',
          questions: [
            { label: 'Diskusi Kelas', icon: '🗺️', teks: 'Apa keuntungan dan tantangan Indonesia sebagai negara kepulauan?', petunjuk: 'Pikirkan dari sisi ekonomi, sosial, dan lingkungan…', color: 'g' },
          ],
        },
        {
          type: 'refleksi',
          title: 'Refleksi',
          questions: [
            { teks: 'Tempat mana di Indonesia yang paling ingin kamu kunjungi? Mengapa?', petunjuk: 'Ceritakan alasanmu…', warna: 'g', icon: '🗺️' },
          ],
        },
      ]),
    ],
  }),
};

// ═══════════════════════════════════════════════════════════════════
// EXPORTS — All marketplace templates
// ═══════════════════════════════════════════════════════════════════

export const MARKETPLACE_TEMPLATES: MarketplaceTemplate[] = [
  matematikaPersamaanLinear,
  ipaTataSurya,
  ipaEkosistem,
  ipsSejarah,
  bahasaNarasi,
  ppknNorma,
  ppknHakKewajiban,
  seniRupa,
  pjokOlahraga,
  informatikaAlgoritma,
  matematikaGeometri,
  ipsGeografi,
];

/** Get all unique subjects from the template list */
export function getSubjectList(): MapelCategory[] {
  const subjects = new Set(MARKETPLACE_TEMPLATES.map(t => t.subject));
  return Array.from(subjects) as MapelCategory[];
}

/** Find a template by ID */
export function getTemplateById(id: string): MarketplaceTemplate | undefined {
  return MARKETPLACE_TEMPLATES.find(t => t.id === id);
}
