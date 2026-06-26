// ═══════════════════════════════════════════════════════════════════
// PPKn NORMA GOLDEN TEMPLATE — Handcrafted Learning Media v2.1
// ═══════════════════════════════════════════════════════════════════
// STANDAR UTAMA SILSE compliant:
//   - 1 page = 1 learning focus
//   - Quiz = all questions in 1 page (BATCH-13B: was 1 soal per halaman)
//   - TP max 4 items per page
//   - Max 3 active colors per page
//   - No placeholder text
//   - contractId = 'modern-educator' on every page
//   - sectionLabel + sectionColor on every page
//   - body fontSize minimum 20px (enforced by contract)
//   - cover title minimum 48px (enforced by contract)
//
// JANGAN pakai createDefaultSchemaForTemplateType() untuk ini.
// Template ini pakai konten handcrafted, bukan default block.
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage, SchemaCanvaPage } from '@/components/canva/types';
import type { ScreenSchema, SchemaBlock } from '@/core/schema/types';
import type { SceneType } from '@/core/edu/education-scene-types';
import { createPage } from '@/store/canva/constants';
import { generateBlockId } from '@/core/schema/ensure-schema';

// ── Types ──────────────────────────────────────────────────────

export interface NormaGoldenMetadata {
  title?: string;
  guru?: string;
  sekolah?: string;
}

// ── Helpers ────────────────────────────────────────────────────

let _idCounter = 0;
function bid(): string {
  return `norma-golden-${++_idCounter}`;
}

/** STANDAR: Every page gets contractId + sectionLabel + sectionColor */
function makeSchemaPage(
  label: string,
  templateType: string,
  blocks: SchemaBlock[],
  sceneType?: SceneType,
  sectionLabel?: string,
  sectionColor?: string,
): SchemaCanvaPage {
  const page = createPage(label, templateType as CanvaPage['templateType']);
  page.label = label;
  page.templateVariant = 'A';
  page.contractId = 'modern-educator'; // STANDAR: One contract per full pertemuan

  const schema: ScreenSchema = {
    id: `screen-${bid()}`,
    templateType,
    blocks,
    ...(sceneType ? { sceneType } : {}),
    ...(sectionLabel ? { sectionLabel } : {}),
    ...(sectionColor ? { sectionColor } : {}),
  };

  page.schema = schema;
  page.elements = [];
  page.pageMode = 'schema';
  return page as SchemaCanvaPage;
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 1 — COVER
// STANDAR: Cover = page-level, only 1 block allowed, no other blocks
// ═══════════════════════════════════════════════════════════════════

function createCoverPage(meta: NormaGoldenMetadata): SchemaCanvaPage {
  return makeSchemaPage('Cover', 'cover', [
    {
      type: 'cover',
      id: bid(),
      icon: '⚖️',
      title: 'Macam-Macam Norma',
      subtitle: 'PPKn Kelas VII — Semester 1',
      badges: [
        { icon: '📚', text: meta.title || 'Bab 1: Norma dan Keadilan', color: 'y' as const },
        { icon: '🏫', text: meta.sekolah || 'SMP Negeri 1 Indonesia', color: 'c' as const },
        { icon: '👨‍🏫', text: meta.guru || 'Guru PPKn', color: 'g' as const },
      ],
      meta: {
        durasi: '2 × 40 menit',
        fase: 'D',
        elemen: 'Pancasila',
      },
      cta: { label: 'Mulai Belajar →', action: 'next' },
      layout: { position: 'absolute', x: 0, y: 0, width: 'auto', height: 'auto' },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Macam-Macam Norma', learningPhase: 'pendahuluan', importance: 1.0 },
    },
  ], 'intro', 'Cover', 'y');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 2 — PETUNJUK
// ═══════════════════════════════════════════════════════════════════

function createPetunjukPage(): SchemaCanvaPage {
  return makeSchemaPage('Petunjuk', 'petunjuk', [
    {
      type: 'petunjuk',
      id: bid(),
      title: 'Petunjuk',
      titleHighlight: 'Penggunaan',
      items: [
        { icon: '📖', title: 'Baca Materi', body: 'Pelajari penjelasan tentang macam-macam norma di setiap halaman materi dengan seksama.' },
        { icon: '🤔', title: 'Pikirkan', body: 'Refleksikan contoh-contoh norma yang ada di kehidupan sehari-hari dan hubungkan dengan teori.' },
        { icon: '✍️', title: 'Kerjakan', body: 'Jawab pertanyaan refleksi dan kerjakan kuis di akhir pembelajaran untuk mengukur pemahamanmu.' },
      ],
      tips: 'Gunakan tombol navigasi di bawah untuk berpindah antar halaman.',
      tipsColor: 'y',
      variant: 'A',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'pendahuluan', interactionType: 'read' },
    },
  ], 'intro', '📌 Petunjuk', 'c');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 3 — TUJUAN PEMBELAJARAN
// STANDAR: TP max 4 items per page
// ═══════════════════════════════════════════════════════════════════

function createTujuanPage(): SchemaCanvaPage {
  return makeSchemaPage('Tujuan Pembelajaran', 'tujuan', [
    {
      type: 'tujuan-display',
      id: bid(),
      title: 'Tujuan Pembelajaran',
      bsnpRequired: true,
      objectives: [
        { icon: '🎯', text: 'Menjelaskan pengertian norma sebagai peraturan yang mengatur kehidupan bermasyarakat', color: 'y' },
        { icon: '🎯', text: 'Mengidentifikasi macam-macam norma: agama, kesusilaan, kesopanan, dan hukum', color: 'c' },
        { icon: '🎯', text: 'Membedakan ciri-ciri setiap jenis norma berdasarkan sumber, sanksi, dan contohnya', color: 'p' },
        { icon: '🎯', text: 'Menganalisis penerapan macam-macam norma dalam kehidupan sehari-hari', color: 'g' },
      ],
      profil: 'Beriman & Bertakwa kepada Tuhan YME, Bernalar Kritis, Gotong Royong',
      profilColor: 'g',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Macam-Macam Norma', learningPhase: 'pendahuluan', importance: 0.9 },
    },
  ], 'intro', '🎯 Tujuan Pembelajaran', 'p');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 4 — MOTIVASI / APERSEPSI
// ═══════════════════════════════════════════════════════════════════

function createMotivasiPage(): SchemaCanvaPage {
  return makeSchemaPage('Motivasi', 'motivasi', [
    {
      type: 'motivasi',
      id: bid(),
      title: 'Motivasi / Apersepsi',
      bsnpRequired: true,
      hookQuestion: 'Pernahkah kamu melihat seseorang ditegur karena makan sambil berbicara di meja makan? Atau dihukum karena mencuri? Apa yang membedakan keduanya?',
      visual: { emoji: '💡', bgGradient: ['y', 'bg'] as [string, string] },
      connections: [
        { icon: '🔗', label: 'Norma Kesopanan', description: 'Makan sambil bicara dianggap tidak sopan — teguran dari masyarakat', color: 'c' },
        { icon: '⚖️', label: 'Norma Hukum', description: 'Mencuri diancam pidana — hukuman dari negara', color: 'p' },
      ],
      transition: 'Semua aturan itu disebut NORMA. Mari kita pelajari macam-macamnya!',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Macam-Macam Norma', learningPhase: 'pendahuluan', importance: 0.8 },
    },
  ], 'intro', '💡 Motivasi', 'y');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 5 — SKENARIO INTERAKTIF
// ═══════════════════════════════════════════════════════════════════

function createSkenarioPage(): SchemaCanvaPage {
  return makeSchemaPage('Skenario', 'skenario', [
    {
      type: 'skenario',
      id: bid(),
      title: 'Skenario: Norma di Sekitar Kita',
      chapters: [
        {
          id: 'ch1',
          charEmoji: '🏫',
          title: 'Situasi di Sekolah',
          setup: [
            { speaker: 'Rizki', text: 'Hari ini ada siswa baru yang tidak memakai seragam lengkap.' },
            { speaker: 'Anda', text: 'Apa yang sebaiknya dilakukan?' },
          ],
          choicePrompt: 'Bagaimana sikapmu?',
          choices: [
            {
              icon: '✅',
              label: 'Mengingatkan dengan sopan',
              detail: 'Itu contoh penerapan norma kesopanan!',
              good: true,
              pts: 10,
              level: 'good',
              resultTitle: 'Pilihan Bijak!',
              resultBody: 'Mengingatkan dengan sopan adalah penerapan norma kesopanan dan norma kesusilaan.',
              feedbackGood: 'Kamu sudah memahami norma kesopanan!',
              feedbackBad: '',
              norma: 'Kesopanan',
              nextChapter: 1,
            },
            {
              icon: '❌',
              label: 'Menghakimi di depan umum',
              detail: 'Menghakimi bukan cara yang baik.',
              good: false,
              pts: 0,
              level: 'bad',
              resultTitle: 'Kurang Tepat',
              resultBody: 'Menghakimi orang lain di depan umum justru melanggar norma kesopanan.',
              feedbackGood: '',
              feedbackBad: 'Sebaiknya kita mengingatkan dengan cara yang sopan.',
              norma: 'Kesopanan',
              nextChapter: 1,
            },
          ],
        },
      ],
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Macam-Macam Norma', learningPhase: 'inti', interactionType: 'choose', importance: 0.8 },
    },
  ], 'practice', '🎭 Skenario', 'p');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 6 — MATERI 1: Pengertian Norma
// ═══════════════════════════════════════════════════════════════════

function createMateri1Page(): SchemaCanvaPage {
  return makeSchemaPage('Materi 1: Pengertian Norma', 'materi', [
    {
      type: 'def-box',
      id: bid(),
      borderColor: 'y',
      content: '<strong>Norma</strong> adalah peraturan atau ketentuan yang mengatur tingkah laku manusia dalam kehidupan bermasyarakat. Norma bersifat mengikat dan pelanggarannya akan mendapatkan sanksi.',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'inti', interactionType: 'read' },
    },
    {
      type: 'nc-grid',
      id: bid(),
      cards: [
        { icon: '📜', title: 'Bersifat Mengikat', body: 'Setiap anggota masyarakat wajib mematuhi norma yang berlaku', color: 'y' },
        { icon: '⚖️', title: 'Ada Sanksi', body: 'Pelanggaran norma akan dikenakan sanksi sesuai jenis normanya', color: 'c' },
        { icon: '👥', title: 'Disepakati Bersama', body: 'Norma lahir dari kesepakatan masyarakat dan berlaku secara universal', color: 'g' },
        { icon: '🔄', title: 'Ditaati Sadar', body: 'Norma ditaati karena kesadaran, bukan semata-mata karena paksaan', color: 'p' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read' },
    },
  ], 'concept', '📖 Materi 1', 'y');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 7 — MATERI 2: Macam-Macam Norma
// STANDAR: max 4 cards per nc-grid — we have exactly 4
// ═══════════════════════════════════════════════════════════════════

function createMateri2Page(): SchemaCanvaPage {
  return makeSchemaPage('Materi 2: 4 Jenis Norma', 'materi', [
    {
      type: 'nc-grid',
      id: bid(),
      cards: [
        { icon: '🙏', title: '1. Norma Agama', body: 'Peraturan yang berasal dari Tuhan YME. Sanksinya berupa dosa. Contoh: beribadah, jujur, tidak mencuri.', color: 'y' },
        { icon: '❤️', title: '2. Norma Kesusilaan', body: 'Peraturan yang berasal dari hati nurani. Sanksinya berupa rasa bersalah. Contoh: tidak berbohong, tidak berzina.', color: 'c' },
        { icon: '🤝', title: '3. Norma Kesopanan', body: 'Peraturan yang berasal dari masyarakat. Sanksinya berupa teguran. Contoh: makan tidak bersuara, menghormati yang lebih tua.', color: 'g' },
        { icon: '⚖️', title: '4. Norma Hukum', body: 'Peraturan yang dibuat oleh negara. Sanksinya berupa pidana/denda. Contoh: tidak mencuri, taat lampu merah.', color: 'p' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read' },
    },
  ], 'concept', '📖 Materi 2', 'c');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 8 — MATERI 3: Perbedaan Utama
// STANDAR: Split from original materi3 which had 4 def-box blocks
// This page focuses on the KEY DISTINCTION between norms
// ═══════════════════════════════════════════════════════════════════

function createMateri3Page(): SchemaCanvaPage {
  return makeSchemaPage('Materi 3: Sumber & Sanksi', 'materi', [
    {
      type: 'def-box',
      id: bid(),
      borderColor: 'g',
      content: '<strong>Perbedaan Utama:</strong> Sumber norma menentukan sanksinya. Norma agama dari Tuhan (dosa), norma kesusilaan dari nurani (rasa bersalah), norma kesopanan dari masyarakat (teguran), norma hukum dari negara (pidana/denda).',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'inti', interactionType: 'read' },
    },
  ], 'concept', '📖 Materi 3', 'g');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 9 — DISKUSI
// STANDAR: max 2 questions per page, split if more
// ═══════════════════════════════════════════════════════════════════

function createDiskusiPage(): SchemaCanvaPage {
  return makeSchemaPage('Diskusi', 'diskusi', [
    {
      type: 'diskusi',
      id: bid(),
      title: 'Diskusi: Norma di Sekitar Kita',
      intro: 'Diskusikan pertanyaan berikut dengan teman sekelompokmu!',
      questions: [
        { label: 'Pertanyaan 1', icon: '💭', teks: 'Mengapa norma agama dan norma kesusilaan disebut norma yang bersifat internal? Jelaskan!', petunjuk: 'Pikirkan dari mana sanksi kedua norma itu berasal.', color: 'y' },
        { label: 'Pertanyaan 2', icon: '🤔', teks: 'Apakah semua pelanggaran norma kesopanan bisa menjadi pelanggaran norma hukum? Berikan contohnya!', petunjuk: 'Pertimbangkan hubungan antara kesopanan dan hukum.', color: 'c' },
      ],
      variant: 'A',
      compression: { priority: 'high', strategy: 'scroll' },
      semantic: { topic: 'Macam-Macam Norma', learningPhase: 'inti', interactionType: 'discuss', importance: 0.85 },
    },
  ], 'discussion', '💬 Diskusi', 'c');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 10 — KUIS (semua soal dalam 1 halaman)
// BATCH-13B: Changed from 5 kuis pages (1 soal per halaman) to 1 page with all 5 questions.
// QuizWidget already supports multi-question step-reveal (Q1→Q2→...→Result).
// This fixes the "PowerPoint web" problem — quiz now has internal state.
// ═══════════════════════════════════════════════════════════════════

const QUIZ_QUESTIONS = [
  {
    q: 'Norma yang sanksinya berupa dosa disebut norma...',
    opts: ['Norma Agama', 'Norma Kesusilaan', 'Norma Kesopanan', 'Norma Hukum'],
    ans: 0,
    ex: 'Norma agama berasal dari Tuhan YME dan sanksinya berupa dosa.',
  },
  {
    q: 'Seseorang merasa bersalah karena berbohong. Ini contoh penerapan norma...',
    opts: ['Norma Hukum', 'Norma Kesopanan', 'Norma Kesusilaan', 'Norma Agama'],
    ans: 2,
    ex: 'Rasa bersalah berasal dari hati nurani, itu ciri norma kesusilaan.',
  },
  {
    q: 'Pelanggaran lampu merah termasuk pelanggaran norma...',
    opts: ['Norma Kesopanan', 'Norma Kesusilaan', 'Norma Agama', 'Norma Hukum'],
    ans: 3,
    ex: 'Lampu merah diatur dalam UU Lalu Lintas — norma hukum dengan sanksi tilang.',
  },
  {
    q: 'Norma yang sumbernya berasal dari masyarakat dan sanksinya berupa teguran adalah...',
    opts: ['Norma Agama', 'Norma Kesusilaan', 'Norma Kesopanan', 'Norma Hukum'],
    ans: 2,
    ex: 'Norma kesopanan lahir dari kesepakatan masyarakat, sanksinya berupa teguran sosial.',
  },
  {
    q: 'Manakah yang BUKAN merupakan ciri-ciri norma hukum?',
    opts: ['Dibuat oleh negara', 'Sanksinya berupa pidana/denda', 'Bersifat mengikat seluruh warga negara', 'Sanksinya berupa dosa'],
    ans: 3,
    ex: 'Sanksi berupa dosa adalah ciri norma agama, bukan norma hukum.',
  },
];

function createKuisPage(): SchemaCanvaPage {
  return makeSchemaPage(
    'Kuis',
    'kuis',
    [{
      type: 'kuis',
      id: bid(),
      title: 'Kuis: Macam-Macam Norma',
      questions: QUIZ_QUESTIONS, // BATCH-13B: All questions in 1 block
      variant: 'A',
      compression: { priority: 'high', strategy: 'scroll', splittable: true },
      semantic: { topic: 'Macam-Macam Norma', learningPhase: 'inti', interactionType: 'choose', importance: 0.9 },
    }],
    'assessment',
    '📝 Kuis',
    'g',
  );
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 15 — REFLEKSI
// STANDAR: max 2-3 questions per page
// ═══════════════════════════════════════════════════════════════════

function createRefleksiPage(): SchemaCanvaPage {
  return makeSchemaPage('Refleksi', 'refleksi', [
    {
      type: 'refleksi',
      id: bid(),
      title: 'Refleksi Macam-Macam Norma',
      intro: 'Renungkan pertanyaan berikut untuk memperdalam pemahamanmu!',
      questions: [
        { teks: 'Hal baru apa yang kamu pelajari tentang macam-macam norma?', petunjuk: 'Tuliskan minimal 2 hal baru yang kamu pelajari.', warna: 'c', icon: '🪞' },
        { teks: 'Norma mana yang paling sering kamu terapkan dalam kehidupan sehari-hari? Berikan contohnya!', petunjuk: 'Ceritakan pengalamanmu menerapkan norma tersebut.', warna: 'g', icon: '💭' },
      ],
      penugasan: {
        judul: 'Komitmen Pribadi',
        isi: 'Tulis satu komitmen nyata yang akan kamu lakukan minggu ini sebagai wujud menghargai norma.',
        contoh: 'Saya berkomitmen untuk selalu mengantre dengan tertib di kantin sekolah.',
      },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Macam-Macam Norma', learningPhase: 'penutup', interactionType: 'reflect', importance: 0.8 },
    },
  ], 'reflection', '📝 Refleksi', 'p');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 16 — RANGKUMAN
// ═══════════════════════════════════════════════════════════════════

function createRangkumanPage(): SchemaCanvaPage {
  return makeSchemaPage('Rangkuman', 'rangkuman', [
    {
      type: 'rangkuman',
      id: bid(),
      title: 'Rangkuman',
      bsnpRequired: true,
      concepts: [
        { icon: '📖', title: 'Norma', body: 'Peraturan yang mengatur tingkah laku manusia dalam bermasyarakat. Bersifat mengikat dan pelanggarannya mendapat sanksi.', color: 'y' },
        { icon: '🙏', title: 'Norma Agama', body: 'Berasal dari Tuhan YME. Sanksi: dosa.', color: 'y' },
        { icon: '🤝', title: 'Norma Kesopanan', body: 'Berasal dari masyarakat. Sanksi: teguran.', color: 'c' },
        { icon: '⚖️', title: 'Norma Hukum', body: 'Berasal dari negara. Sanksi: pidana/denda.', color: 'p' },
      ],
      closingStatement: 'Keempat norma saling melengkapi dalam mengatur kehidupan bermasyarakat.',
      accentColor: 'g',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Macam-Macam Norma', learningPhase: 'penutup', importance: 0.9 },
    },
  ], 'summary', '📋 Rangkuman', 'y');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 17 — PENUTUP
// ═══════════════════════════════════════════════════════════════════

function createPenutupPage(): SchemaCanvaPage {
  return makeSchemaPage('Penutup', 'penutup', [
    {
      type: 'penutup',
      id: bid(),
      title: 'Penutup',
      subtitle: 'Pertemuan Selesai',
      preview: [
        { icon: '📚', judul: 'Materi', isi: 'Macam-macam norma: agama, kesusilaan, kesopanan, hukum', warna: 'y' },
        { icon: '🎯', judul: 'Tujuan', isi: 'Mengidentifikasi dan membedakan 4 jenis norma', warna: 'c' },
      ],
      layout: { position: 'absolute', x: 0, y: 0, width: 'auto', height: 'auto' },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Macam-Macam Norma', learningPhase: 'penutup', importance: 0.7 },
    },
  ], 'summary', '🏁 Penutup', 'y');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN: Create the Golden Project
// BATCH-13B: 13 pages (was 17 — collapsed 5 kuis pages into 1)
// ═══════════════════════════════════════════════════════════════════

export function createPpknNormaGoldenProject(metadata: NormaGoldenMetadata = {}): CanvaPage[] {
  // Reset ID counter for reproducibility
  _idCounter = 0;

  const pages: CanvaPage[] = [
    createCoverPage(metadata),       // 1. Cover
    createPetunjukPage(),            // 2. Petunjuk
    createTujuanPage(),              // 3. Tujuan Pembelajaran (4 items = max)
    createMotivasiPage(),            // 4. Motivasi / Apersepsi (2 connections)
    createSkenarioPage(),            // 5. Skenario Interaktif (1 chapter)
    createMateri1Page(),             // 6. Materi 1: Pengertian Norma
    createMateri2Page(),             // 7. Materi 2: 4 Jenis Norma (4 cards = max)
    createMateri3Page(),             // 8. Materi 3: Sumber & Sanksi
    createDiskusiPage(),             // 9. Diskusi (2 questions)
    createKuisPage(),                // 10. Kuis (5 questions in 1 page — BATCH-13B)
    createRefleksiPage(),            // 11. Refleksi (2 questions + penugasan)
    createRangkumanPage(),           // 12. Rangkuman (4 concepts = max)
    createPenutupPage(),             // 13. Penutup
  ];

  return pages;
}
