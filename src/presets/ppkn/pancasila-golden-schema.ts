// ═══════════════════════════════════════════════════════════════════
// PPKn PANCASILA GOLDEN TEMPLATE — Handcrafted Learning Media v2.1
// ═══════════════════════════════════════════════════════════════════
// STANDAR UTAMA SILSE compliant:
//   - 1 page = 1 learning focus
//   - Quiz = 1 question per page
//   - TP max 4 items per page
//   - Max 3 active colors per page
//   - No placeholder text
//   - contractId = 'golden-pertemuan' on every page
//   - sectionLabel + sectionColor on every page
//   - body fontSize minimum 20px (enforced by contract)
//   - cover title minimum 48px (enforced by contract)
//
// "Misi Penjelajah Pancasila" — MPI for PPKn Kelas VII Bab 2
// 38 pages: 5 Intro + 25 Misi (5×5) + 8 Evaluasi & Penutup
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

export interface PancasilaGoldenMetadata {
  title?: string;
  guru?: string;
  sekolah?: string;
}

// ── Helpers ────────────────────────────────────────────────────

let _idCounter = 0;
function bid(): string {
  return `pancasila-golden-${++_idCounter}`;
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
  page.contractId = 'golden-pertemuan'; // STANDAR: One contract per full pertemuan

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
// PART A: INTRODUCTION (Pages 1–5)
// ═══════════════════════════════════════════════════════════════════

// ── PAGE 1 — COVER ─────────────────────────────────────────────
// STANDAR: Cover = page-level, only 1 block allowed, no other blocks

function createCoverPage(meta: PancasilaGoldenMetadata): SchemaCanvaPage {
  return makeSchemaPage('Cover', 'cover', [
    {
      type: 'cover',
      id: bid(),
      icon: '🧭',
      title: 'Misi Penjelajah Pancasila',
      subtitle: 'PPKn Kelas VII — Semester 1',
      badges: [
        { icon: '📚', text: 'Bab 2: Nilai-Nilai Pancasila', color: 'y' as const },
        { icon: '🏫', text: meta.sekolah || 'SMP Negeri 1 Indonesia', color: 'c' as const },
        { icon: '👨‍🏫', text: meta.guru || 'Guru PPKn', color: 'g' as const },
      ],
      meta: {
        durasi: '4 × 40 menit',
        fase: 'D',
        elemen: 'Pancasila',
      },
      cta: { label: 'Mulai Petualangan →', action: 'next' },
      layout: { position: 'absolute', x: 0, y: 0, width: 'auto', height: 'auto' },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Nilai-Nilai Pancasila', learningPhase: 'pendahuluan', importance: 1.0 },
    },
  ], 'intro', 'Cover', 'y');
}

// ── PAGE 2 — PETUNJUK ──────────────────────────────────────────

function createPetunjukPage(): SchemaCanvaPage {
  return makeSchemaPage('Petunjuk', 'petunjuk', [
    {
      type: 'petunjuk',
      id: bid(),
      title: 'Petunjuk',
      titleHighlight: 'Penjelajah Pancasila',
      items: [
        { icon: '🧭', title: 'Amati Peta', body: 'Pelajari peta misi dan pilih sila yang ingin kamu jelajahi.' },
        { icon: '🤔', title: 'Pilih Sikap', body: 'Di setiap misi, baca situasi dan pilih jalan sikap yang sesuai nilai Pancasila.' },
        { icon: '⭐', title: 'Kumpulkan Lencana', body: 'Selesaikan setiap misi untuk mendapatkan lencana penjelajah.' },
      ],
      tips: 'Gunakan tombol navigasi di bawah untuk berpindah antar halaman.',
      tipsColor: 'y',
      variant: 'A',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'pendahuluan', interactionType: 'read' },
    },
  ], 'intro', '📌 Petunjuk', 'c');
}

// ── PAGE 3 — MOTIVASI / APERSEPSI ─────────────────────────────

function createMotivasiPage(): SchemaCanvaPage {
  return makeSchemaPage('Motivasi', 'motivasi', [
    {
      type: 'motivasi',
      id: bid(),
      title: 'Motivasi / Apersepsi',
      bsnpRequired: true,
      hookQuestion: 'Seorang penjelajah tidak akan sampai ke tujuan tanpa peta. Begitu juga sebuah bangsa — tanpa pedoman, kehidupan dapat menjadi kacau. Indonesia memiliki Pancasila sebagai penuntun arah. Apakah kamu siap memulai petualangan?',
      visual: { emoji: '🧭', bgGradient: ['y', 'bg'] as [string, string] },
      connections: [
        { icon: '🗺️', label: 'Peta Misi', description: 'Lima misi menanti untuk mengenal nilai setiap Sila Pancasila', color: 'c' },
        { icon: '⭐', label: 'Lencana Penjelajah', description: 'Selesaikan misi dan kumpulkan lima lencana nilai Pancasila', color: 'g' },
      ],
      transition: 'Saatnya membuka Peta Misi Pancasila dan menjelajahi nilai-nilai dari Sila 1 sampai Sila 5!',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Nilai-Nilai Pancasila', learningPhase: 'pendahuluan', importance: 0.8 },
    },
  ], 'intro', '💡 Motivasi', 'y');
}

// ── PAGE 4 — TUJUAN PEMBELAJARAN ──────────────────────────────
// STANDAR: TP max 4 items per page

function createTujuanPage(): SchemaCanvaPage {
  return makeSchemaPage('Tujuan Pembelajaran', 'tujuan', [
    {
      type: 'tujuan-display',
      id: bid(),
      title: 'Tujuan Pembelajaran',
      bsnpRequired: true,
      objectives: [
        { icon: '🎯', text: 'Menjelaskan nilai-nilai setiap sila Pancasila sebagai pedoman bersikap', color: 'y' },
        { icon: '🎯', text: 'Mengidentifikasi contoh penerapan nilai Pancasila dalam kehidupan sehari-hari', color: 'c' },
        { icon: '🎯', text: 'Menganalisis hubungan antara pilihan sikap dan nilai Pancasila', color: 'p' },
        { icon: '🎯', text: 'Menerapkan nilai Pancasila dalam situasi nyata di lingkungan sekitar', color: 'g' },
      ],
      profil: 'Beriman & Bertakwa kepada Tuhan YME, Bernalar Kritis, Gotong Royong',
      profilColor: 'g',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Nilai-Nilai Pancasila', learningPhase: 'pendahuluan', importance: 0.9 },
    },
  ], 'intro', '🎯 Tujuan Pembelajaran', 'p');
}

// ── PAGE 5 — PETA MISI ────────────────────────────────────────

function createPetaMisiPage(): SchemaCanvaPage {
  return makeSchemaPage('Peta Misi', 'materi', [
    {
      type: 'nc-grid',
      id: bid(),
      cards: [
        { icon: '⭐', title: 'Sila 1: Ketuhanan', body: 'Menghormati ibadah dan keyakinan orang lain', color: 'y' },
        { icon: '⛓️', title: 'Sila 2: Kemanusiaan', body: 'Memperlakukan setiap orang secara adil dan beradab', color: 'c' },
        { icon: '🌳', title: 'Sila 3: Persatuan', body: 'Menjaga kekompakan dan mengutamakan kepentingan bersama', color: 'g' },
        { icon: '🐂', title: 'Sila 4: Musyawarah', body: 'Mendengar pendapat dan menerima keputusan bersama', color: 'p' },
        { icon: '🌾', title: 'Sila 5: Keadilan', body: 'Bersikap adil dan peduli terhadap kesejahteraan bersama', color: 'y' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'pendahuluan', interactionType: 'read' },
    },
  ], 'concept', '🗺️ Peta Misi', 'c');
}

// ═══════════════════════════════════════════════════════════════════
// PART B: MISI 1 — Bintang Kerukunan (Sila 1) (Pages 6–10)
// ═══════════════════════════════════════════════════════════════════

// ── PAGE 6 — GERBANG MISI 1 ───────────────────────────────────

function createMisi1GerbangPage(): SchemaCanvaPage {
  return makeSchemaPage('Gerbang Misi 1', 'materi', [
    {
      type: 'nc-grid',
      id: bid(),
      cards: [
        { icon: '⭐', title: 'Lambang Bintang', body: 'Ketuhanan Yang Maha Esa', color: 'y' },
        { icon: '🧭', title: 'Tantangan Misi', body: 'Bagaimana menghormati teman yang sedang beribadah?', color: 'c' },
        { icon: '⭐', title: 'Lencana', body: 'Bintang Kerukunan — lencana untuk penjelajah yang menghargai perbedaan', color: 'g' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 1' },
    },
  ], 'intro', '🚪 Gerbang Misi 1', 'y');
}

// ── PAGE 7 — BEKAL PENJELAJAH 1 ───────────────────────────────

function createMisi1BekalPage(): SchemaCanvaPage {
  return makeSchemaPage('Bekal Penjelajah 1', 'materi', [
    {
      type: 'nc-grid',
      id: bid(),
      cards: [
        { icon: '⭐', title: 'Makna Sila', body: 'Bangsa Indonesia percaya kepada Tuhan Yang Maha Esa dan menghormati agama serta keyakinan setiap orang.', color: 'y' },
        { icon: '🤝', title: 'Nilai Utama', body: 'Keimanan, ketakwaan, toleransi, dan saling menghormati antarumat beragama.', color: 'c' },
        { icon: '🧭', title: 'Arah Sikap', body: 'Setiap orang perlu diberi kesempatan untuk menjalankan ibadah dengan tenang sesuai keyakinannya.', color: 'g' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 1' },
    },
  ], 'concept', '📖 Bekal Penjelajah', 'c');
}

// ── PAGE 8 — SKENARIO 1 ───────────────────────────────────────

function createMisi1SkenarioPage(): SchemaCanvaPage {
  return makeSchemaPage('Skenario 1', 'skenario', [
    {
      type: 'skenario',
      id: bid(),
      title: 'Skenario: Suasana di Sekolah',
      chapters: [
        {
          id: 'ch1',
          charEmoji: '🏫',
          title: 'Suasana di Sekolah',
          setup: [
            { speaker: 'Situasi', text: 'Saat jam istirahat, beberapa siswa sedang berada di ruang kelas.' },
            { speaker: 'Situasi', text: 'Ada teman yang ingin menjalankan ibadah sesuai keyakinannya.' },
            { speaker: 'Situasi', text: 'Namun, sebagian siswa berbicara keras dan bercanda di dekatnya. Suasana menjadi kurang nyaman.' },
          ],
          choicePrompt: 'Bagaimana sikapmu?',
          choices: [
            {
              icon: '❌',
              label: 'Diam Saja',
              detail: 'Menjauh dan membiarkan keadaan tetap ramai.',
              good: false,
              pts: 0,
              level: 'bad',
              resultTitle: 'Kurang Tepat',
              resultBody: 'Jika hanya diam, suasana tetap ramai dan teman yang beribadah belum merasa dihargai.',
              feedbackGood: '',
              feedbackBad: 'Sebaiknya kita mengingatkan teman agar lebih tenang.',
              norma: 'Ketuhanan',
              nextChapter: 1,
            },
            {
              icon: '✅',
              label: 'Ingatkan dengan Sopan',
              detail: 'Mengingatkan teman agar lebih tenang dan menghargai teman yang sedang beribadah.',
              good: true,
              pts: 10,
              level: 'good',
              resultTitle: 'Pilihan Bijak!',
              resultBody: 'Kamu menunjukkan sikap hormat dan peduli. Teman dapat beribadah dengan tenang, dan suasana kelas tetap rukun.',
              feedbackGood: 'Kamu sudah memahami nilai Sila Pertama!',
              feedbackBad: '',
              norma: 'Ketuhanan',
              nextChapter: 1,
            },
            {
              icon: '❌',
              label: 'Menyuruh Pindah',
              detail: 'Menyuruh teman yang beribadah pindah ke tempat lain.',
              good: false,
              pts: 0,
              level: 'bad',
              resultTitle: 'Kurang Tepat',
              resultBody: 'Menyuruh teman pindah bisa membuatnya merasa tidak dihargai. Kita perlu menjaga ketenangan bersama.',
              feedbackGood: '',
              feedbackBad: 'Kita perlu menjaga ketenangan bersama, bukan memindahkan yang beribadah.',
              norma: 'Ketuhanan',
              nextChapter: 1,
            },
          ],
        },
      ],
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Sila 1', learningPhase: 'inti', interactionType: 'choose', importance: 0.8 },
    },
  ], 'practice', '🎭 Skenario', 'p');
}

// ── PAGE 9 — KUNCI NILAI 1 ────────────────────────────────────

function createMisi1KunciPage(): SchemaCanvaPage {
  return makeSchemaPage('Kunci Nilai 1', 'materi', [
    {
      type: 'def-box',
      id: bid(),
      borderColor: 'g',
      content: '<strong>Kunci Misi 1:</strong> Menghormati ibadah orang lain adalah bagian dari pengamalan Sila Pertama.',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 1' },
    },
  ], 'concept', '🔑 Kunci Nilai', 'g');
}

// ── PAGE 10 — LENCANA MISI 1 ──────────────────────────────────

function createMisi1LencanaPage(): SchemaCanvaPage {
  return makeSchemaPage('Lencana Misi 1', 'rangkuman', [
    {
      type: 'rangkuman',
      id: bid(),
      title: 'Misi 1 Berhasil!',
      bsnpRequired: true,
      concepts: [
        { icon: '🙏', title: 'Beribadah sesuai agama', body: 'Menjalankan ibadah sesuai keyakinan masing-masing', color: 'y' },
        { icon: '🤫', title: 'Tidak mengganggu', body: 'Tidak mengganggu teman yang sedang beribadah', color: 'c' },
        { icon: '💬', title: 'Menjaga ucapan', body: 'Menjaga ucapan agar tidak menyinggung keyakinan orang lain', color: 'g' },
        { icon: '🤝', title: 'Hidup rukun', body: 'Hidup rukun dengan teman yang berbeda agama', color: 'p' },
      ],
      closingStatement: 'Sila Pertama mengajarkan kita untuk percaya kepada Tuhan Yang Maha Esa, menghormati perbedaan agama, dan menjaga kerukunan.',
      accentColor: 'g',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Sila 1', learningPhase: 'penutup', importance: 0.9 },
    },
  ], 'summary', '🏅 Lencana Misi 1', 'y');
}

// ═══════════════════════════════════════════════════════════════════
// PART C: MISI 2 — Rantai Kepedulian (Sila 2) (Pages 11–15)
// ═══════════════════════════════════════════════════════════════════

// ── PAGE 11 — GERBANG MISI 2 ──────────────────────────────────

function createMisi2GerbangPage(): SchemaCanvaPage {
  return makeSchemaPage('Gerbang Misi 2', 'materi', [
    {
      type: 'nc-grid',
      id: bid(),
      cards: [
        { icon: '⛓️', title: 'Lambang Rantai', body: 'Kemanusiaan yang Adil dan Beradab', color: 'y' },
        { icon: '🧭', title: 'Tantangan Misi', body: 'Bagaimana sikapmu ketika teman direndahkan di depan umum?', color: 'c' },
        { icon: '⭐', title: 'Lencana', body: 'Rantai Kepedulian — lencana untuk penjelajah yang adil dan beradab', color: 'g' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 2' },
    },
  ], 'intro', '🚪 Gerbang Misi 2', 'y');
}

// ── PAGE 12 — BEKAL PENJELAJAH 2 ──────────────────────────────

function createMisi2BekalPage(): SchemaCanvaPage {
  return makeSchemaPage('Bekal Penjelajah 2', 'materi', [
    {
      type: 'nc-grid',
      id: bid(),
      cards: [
        { icon: '⛓️', title: 'Makna Sila', body: 'Setiap manusia memiliki martabat yang sama dan harus diperlakukan secara adil serta beradab.', color: 'y' },
        { icon: '🤝', title: 'Nilai Utama', body: 'Kemanusiaan, keadilan, kepedulian, kesopanan, dan saling menghargai.', color: 'c' },
        { icon: '🧭', title: 'Arah Sikap', body: 'Kita tidak merendahkan orang lain, berani membela yang diperlakukan tidak adil, dan menjaga perasaan sesama.', color: 'g' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 2' },
    },
  ], 'concept', '📖 Bekal Penjelajah', 'c');
}

// ── PAGE 13 — SKENARIO 2 ──────────────────────────────────────

function createMisi2SkenarioPage(): SchemaCanvaPage {
  return makeSchemaPage('Skenario 2', 'skenario', [
    {
      type: 'skenario',
      id: bid(),
      title: 'Skenario: Teman yang Direndahkan',
      chapters: [
        {
          id: 'ch1',
          charEmoji: '🏫',
          title: 'Teman yang Direndahkan',
          setup: [
            { speaker: 'Situasi', text: 'Saat kerja kelompok, seorang teman menyampaikan pendapat.' },
            { speaker: 'Situasi', text: 'Namun, pendapatnya langsung ditertawakan oleh beberapa siswa.' },
            { speaker: 'Situasi', text: 'Ada yang berkata "Jawabanmu salah terus." Teman itu menjadi malu dan tidak berani berbicara lagi.' },
          ],
          choicePrompt: 'Bagaimana sikapmu?',
          choices: [
            {
              icon: '❌',
              label: 'Ikut Menertawakan',
              detail: 'Ikut tertawa agar dianggap kompak dengan teman lain.',
              good: false,
              pts: 0,
              level: 'bad',
              resultTitle: 'Kurang Tepat',
              resultBody: 'Ikut menertawakan justru merendahkan martabat teman. Sikap ini tidak sesuai dengan nilai kemanusiaan.',
              feedbackGood: '',
              feedbackBad: 'Sebaiknya kita membela teman dengan sopan.',
              norma: 'Kemanusiaan',
              nextChapter: 1,
            },
            {
              icon: '✅',
              label: 'Membela dengan Sopan',
              detail: 'Mengajak teman-teman berhenti mengejek dan memberi kesempatan teman itu menjelaskan pendapatnya.',
              good: true,
              pts: 10,
              level: 'good',
              resultTitle: 'Pilihan Bijak!',
              resultBody: 'Kamu menjaga martabat teman. Membela dengan sopan menunjukkan sikap peduli dan beradab.',
              feedbackGood: 'Kamu sudah memahami nilai kemanusiaan!',
              feedbackBad: '',
              norma: 'Kemanusiaan',
              nextChapter: 1,
            },
            {
              icon: '❌',
              label: 'Menghibur Diam-Diam',
              detail: 'Menunggu sampai selesai, lalu menghibur teman itu tanpa menegur siswa yang mengejek.',
              good: false,
              pts: 0,
              level: 'bad',
              resultTitle: 'Kurang Tepat',
              resultBody: 'Menghibur diam-diam tidak menghentikan perilaku tidak adil. Masalah bisa terulang.',
              feedbackGood: '',
              feedbackBad: 'Kita perlu berani membela teman yang diperlakukan tidak adil.',
              norma: 'Kemanusiaan',
              nextChapter: 1,
            },
          ],
        },
      ],
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Sila 2', learningPhase: 'inti', interactionType: 'choose', importance: 0.8 },
    },
  ], 'practice', '🎭 Skenario', 'p');
}

// ── PAGE 14 — KUNCI NILAI 2 ───────────────────────────────────

function createMisi2KunciPage(): SchemaCanvaPage {
  return makeSchemaPage('Kunci Nilai 2', 'materi', [
    {
      type: 'def-box',
      id: bid(),
      borderColor: 'g',
      content: '<strong>Kunci Misi 2:</strong> Menghargai manusia berarti tidak merendahkan, tidak menghina, dan tidak membiarkan orang lain diperlakukan tidak adil.',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 2' },
    },
  ], 'concept', '🔑 Kunci Nilai', 'g');
}

// ── PAGE 15 — LENCANA MISI 2 ──────────────────────────────────

function createMisi2LencanaPage(): SchemaCanvaPage {
  return makeSchemaPage('Lencana Misi 2', 'rangkuman', [
    {
      type: 'rangkuman',
      id: bid(),
      title: 'Misi 2 Berhasil!',
      bsnpRequired: true,
      concepts: [
        { icon: '🚫', title: 'Tidak mengejek', body: 'Tidak mengejek kekurangan orang lain', color: 'y' },
        { icon: '💬', title: 'Menghargai pendapat', body: 'Menghargai pendapat teman', color: 'c' },
        { icon: '🤝', title: 'Menolong', body: 'Menolong teman yang membutuhkan bantuan', color: 'g' },
        { icon: '🛡️', title: 'Membela', body: 'Membela teman yang diperlakukan tidak adil', color: 'p' },
      ],
      closingStatement: 'Sila Kedua mengajarkan kita untuk memperlakukan setiap orang secara adil, sopan, dan penuh kepedulian.',
      accentColor: 'g',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Sila 2', learningPhase: 'penutup', importance: 0.9 },
    },
  ], 'summary', '🏅 Lencana Misi 2', 'y');
}

// ═══════════════════════════════════════════════════════════════════
// PART D: MISI 3 — Pohon Persatuan (Sila 3) (Pages 16–20)
// ═══════════════════════════════════════════════════════════════════

// ── PAGE 16 — GERBANG MISI 3 ──────────────────────────────────

function createMisi3GerbangPage(): SchemaCanvaPage {
  return makeSchemaPage('Gerbang Misi 3', 'materi', [
    {
      type: 'nc-grid',
      id: bid(),
      cards: [
        { icon: '🌳', title: 'Lambang Pohon Beringin', body: 'Persatuan Indonesia', color: 'y' },
        { icon: '🧭', title: 'Tantangan Misi', body: 'Bagaimana sikapmu saat kelompok berbeda pendapat?', color: 'c' },
        { icon: '⭐', title: 'Lencana', body: 'Pohon Persatuan — lencana untuk penjelajah yang mampu menjaga persatuan', color: 'g' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 3' },
    },
  ], 'intro', '🚪 Gerbang Misi 3', 'y');
}

// ── PAGE 17 — BEKAL PENJELAJAH 3 ──────────────────────────────

function createMisi3BekalPage(): SchemaCanvaPage {
  return makeSchemaPage('Bekal Penjelajah 3', 'materi', [
    {
      type: 'nc-grid',
      id: bid(),
      cards: [
        { icon: '🌳', title: 'Makna Sila', body: 'Sila Ketiga mengajarkan pentingnya menjaga persatuan dan kesatuan bangsa di tengah perbedaan.', color: 'y' },
        { icon: '🤝', title: 'Nilai Utama', body: 'Persatuan, kesatuan, cinta tanah air, rela berkorban, dan mengutamakan kepentingan bersama.', color: 'c' },
        { icon: '🧭', title: 'Arah Sikap', body: 'Kita perlu menghargai perbedaan, bekerja sama, dan mengutamakan kepentingan bersama di atas kepentingan pribadi.', color: 'g' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 3' },
    },
  ], 'concept', '📖 Bekal Penjelajah', 'c');
}

// ── PAGE 18 — SKENARIO 3 ──────────────────────────────────────

function createMisi3SkenarioPage(): SchemaCanvaPage {
  return makeSchemaPage('Skenario 3', 'skenario', [
    {
      type: 'skenario',
      id: bid(),
      title: 'Skenario: Kelompok yang Berbeda Pendapat',
      chapters: [
        {
          id: 'ch1',
          charEmoji: '🏫',
          title: 'Kelompok yang Berbeda Pendapat',
          setup: [
            { speaker: 'Situasi', text: 'Saat kerja kelompok, anggota memiliki pendapat berbeda tentang cara mengerjakan tugas.' },
            { speaker: 'Situasi', text: 'Sebagian ingin cara cepat, sebagian ingin cara teliti.' },
            { speaker: 'Situasi', text: 'Suasana mulai tegang karena masing-masing mempertahankan pendapatnya.' },
          ],
          choicePrompt: 'Bagaimana sikapmu?',
          choices: [
            {
              icon: '❌',
              label: 'Memaksakan Pendapat',
              detail: 'Tetap memaksa agar kelompok mengikuti cara yang kamu inginkan.',
              good: false,
              pts: 0,
              level: 'bad',
              resultTitle: 'Kurang Tepat',
              resultBody: 'Memaksakan pendapat merusak persatuan kelompok. Keputusan sepihak tidak menyelesaikan masalah.',
              feedbackGood: '',
              feedbackBad: 'Kita perlu mengutamakan kepentingan bersama.',
              norma: 'Persatuan',
              nextChapter: 1,
            },
            {
              icon: '✅',
              label: 'Mengajak Kerja Sama',
              detail: 'Mengajak kelompok berdiskusi dan mencari cara yang disepakati bersama.',
              good: true,
              pts: 10,
              level: 'good',
              resultTitle: 'Pilihan Bijak!',
              resultBody: 'Kamu menjaga persatuan. Mengajak kerja sama membantu kelompok tetap rukun meskipun ada perbedaan pendapat.',
              feedbackGood: 'Kamu sudah memahami nilai persatuan!',
              feedbackBad: '',
              norma: 'Persatuan',
              nextChapter: 1,
            },
            {
              icon: '❌',
              label: 'Keluar dari Kelompok',
              detail: 'Meninggalkan kelompok karena tidak sepakat.',
              good: false,
              pts: 0,
              level: 'bad',
              resultTitle: 'Kurang Tepat',
              resultBody: 'Keluar dari kelompok justru memperlemah persatuan. Perbedaan pendapat adalah hal biasa.',
              feedbackGood: '',
              feedbackBad: 'Perbedaan pendapat bukan alasan untuk meninggalkan kelompok.',
              norma: 'Persatuan',
              nextChapter: 1,
            },
          ],
        },
      ],
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Sila 3', learningPhase: 'inti', interactionType: 'choose', importance: 0.8 },
    },
  ], 'practice', '🎭 Skenario', 'p');
}

// ── PAGE 19 — KUNCI NILAI 3 ───────────────────────────────────

function createMisi3KunciPage(): SchemaCanvaPage {
  return makeSchemaPage('Kunci Nilai 3', 'materi', [
    {
      type: 'def-box',
      id: bid(),
      borderColor: 'g',
      content: '<strong>Kunci Misi 3:</strong> Persatuan tumbuh saat kita mau bekerja sama dalam perbedaan dan mengutamakan kepentingan bersama.',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 3' },
    },
  ], 'concept', '🔑 Kunci Nilai', 'g');
}

// ── PAGE 20 — LENCANA MISI 3 ──────────────────────────────────

function createMisi3LencanaPage(): SchemaCanvaPage {
  return makeSchemaPage('Lencana Misi 3', 'rangkuman', [
    {
      type: 'rangkuman',
      id: bid(),
      title: 'Misi 3 Berhasil!',
      bsnpRequired: true,
      concepts: [
        { icon: '🤝', title: 'Bekerja sama', body: 'Bekerja sama meskipun berbeda pendapat', color: 'y' },
        { icon: '🇮🇩', title: 'Menghargai perbedaan', body: 'Menghargai perbedaan sebagai kekuatan', color: 'c' },
        { icon: '👥', title: 'Kepentingan bersama', body: 'Mengutamakan kepentingan bersama', color: 'g' },
        { icon: '💪', title: 'Teguh bersatu', body: 'Tetap teguh menjaga persatuan', color: 'p' },
      ],
      closingStatement: 'Sila Ketiga mengajarkan kita untuk menjaga persatuan dan mengutamakan kepentingan bersama di atas kepentingan pribadi.',
      accentColor: 'g',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Sila 3', learningPhase: 'penutup', importance: 0.9 },
    },
  ], 'summary', '🏅 Lencana Misi 3', 'y');
}

// ═══════════════════════════════════════════════════════════════════
// PART E: MISI 4 — Banteng Musyawarah (Sila 4) (Pages 21–25)
// ═══════════════════════════════════════════════════════════════════

// ── PAGE 21 — GERBANG MISI 4 ──────────────────────────────────

function createMisi4GerbangPage(): SchemaCanvaPage {
  return makeSchemaPage('Gerbang Misi 4', 'materi', [
    {
      type: 'nc-grid',
      id: bid(),
      cards: [
        { icon: '🐂', title: 'Lambang Kepala Banteng', body: 'Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan', color: 'y' },
        { icon: '🧭', title: 'Tantangan Misi', body: 'Bagaimana mengambil keputusan ketika rapat kelas berbeda pendapat?', color: 'c' },
        { icon: '⭐', title: 'Lencana', body: 'Banteng Musyawarah — lencana untuk penjelajah yang mampu bermusyawarah', color: 'g' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 4' },
    },
  ], 'intro', '🚪 Gerbang Misi 4', 'y');
}

// ── PAGE 22 — BEKAL PENJELAJAH 4 ──────────────────────────────

function createMisi4BekalPage(): SchemaCanvaPage {
  return makeSchemaPage('Bekal Penjelajah 4', 'materi', [
    {
      type: 'nc-grid',
      id: bid(),
      cards: [
        { icon: '🐂', title: 'Makna Sila', body: 'Sila Keempat mengajarkan bahwa keputusan bersama sebaiknya dibuat melalui musyawarah yang bijaksana.', color: 'y' },
        { icon: '🤝', title: 'Nilai Utama', body: 'Musyawarah, kebijaksanaan, menghargai pendapat, tanggung jawab, dan menerima keputusan bersama.', color: 'c' },
        { icon: '🧭', title: 'Arah Sikap', body: 'Kita perlu mendengarkan pendapat, tidak memaksakan kehendak, dan memilih keputusan yang baik untuk bersama.', color: 'g' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 4' },
    },
  ], 'concept', '📖 Bekal Penjelajah', 'c');
}

// ── PAGE 23 — SKENARIO 4 ──────────────────────────────────────

function createMisi4SkenarioPage(): SchemaCanvaPage {
  return makeSchemaPage('Skenario 4', 'skenario', [
    {
      type: 'skenario',
      id: bid(),
      title: 'Skenario: Rapat Kelas yang Berbeda Pendapat',
      chapters: [
        {
          id: 'ch1',
          charEmoji: '🏫',
          title: 'Rapat Kelas yang Berbeda Pendapat',
          setup: [
            { speaker: 'Situasi', text: 'Saat rapat kelas, siswa sedang menentukan kegiatan kebersihan lingkungan sekolah.' },
            { speaker: 'Situasi', text: 'Sebagian siswa ingin membersihkan kelas saja, sedangkan sebagian lainnya ingin membersihkan halaman sekolah.' },
            { speaker: 'Situasi', text: 'Suasana mulai ramai karena beberapa siswa memaksakan pendapatnya sendiri.' },
          ],
          choicePrompt: 'Bagaimana sikapmu?',
          choices: [
            {
              icon: '❌',
              label: 'Memaksakan Pendapat',
              detail: 'Tetap memaksa agar ide sendiri dipilih oleh semua teman.',
              good: false,
              pts: 0,
              level: 'bad',
              resultTitle: 'Kurang Tepat',
              resultBody: 'Memaksakan kehendak tidak sesuai dengan semangat musyawarah. Keputusan sepihak tidak bijaksana.',
              feedbackGood: '',
              feedbackBad: 'Musyawarah berarti mendengarkan semua pendapat.',
              norma: 'Musyawarah',
              nextChapter: 1,
            },
            {
              icon: '✅',
              label: 'Bermusyawarah',
              detail: 'Mengajak teman mendengarkan semua usulan, lalu memilih keputusan bersama.',
              good: true,
              pts: 10,
              level: 'good',
              resultTitle: 'Pilihan Bijak!',
              resultBody: 'Kamu menunjukkan sikap bijaksana. Musyawarah membuat keputusan lebih adil karena setiap pendapat didengar.',
              feedbackGood: 'Kamu sudah memahami nilai musyawarah!',
              feedbackBad: '',
              norma: 'Musyawarah',
              nextChapter: 1,
            },
            {
              icon: '❌',
              label: 'Mengikuti yang Paling Ramai',
              detail: 'Mengikuti pendapat kelompok yang paling banyak tanpa mempertimbangkan alasan.',
              good: false,
              pts: 0,
              level: 'bad',
              resultTitle: 'Kurang Tepat',
              resultBody: 'Mengikuti kelompok terbanyak tanpa pertimbangan bukan musyawarah sejati.',
              feedbackGood: '',
              feedbackBad: 'Musyawarah membutuhkan pertimbangan, bukan sekadar mengikuti yang paling ramai.',
              norma: 'Musyawarah',
              nextChapter: 1,
            },
          ],
        },
      ],
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Sila 4', learningPhase: 'inti', interactionType: 'choose', importance: 0.8 },
    },
  ], 'practice', '🎭 Skenario', 'p');
}

// ── PAGE 24 — KUNCI NILAI 4 ───────────────────────────────────

function createMisi4KunciPage(): SchemaCanvaPage {
  return makeSchemaPage('Kunci Nilai 4', 'materi', [
    {
      type: 'def-box',
      id: bid(),
      borderColor: 'g',
      content: '<strong>Kunci Misi 4:</strong> Musyawarah berarti berani menyampaikan pendapat, mau mendengarkan orang lain, dan menerima keputusan bersama.',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 4' },
    },
  ], 'concept', '🔑 Kunci Nilai', 'g');
}

// ── PAGE 25 — LENCANA MISI 4 ──────────────────────────────────

function createMisi4LencanaPage(): SchemaCanvaPage {
  return makeSchemaPage('Lencana Misi 4', 'rangkuman', [
    {
      type: 'rangkuman',
      id: bid(),
      title: 'Misi 4 Berhasil!',
      bsnpRequired: true,
      concepts: [
        { icon: '💬', title: 'Menyampaikan pendapat', body: 'Menyampaikan pendapat dengan sopan', color: 'y' },
        { icon: '👂', title: 'Mendengarkan', body: 'Mendengarkan usulan teman lain', color: 'c' },
        { icon: '🤝', title: 'Menerima keputusan', body: 'Menerima keputusan bersama', color: 'g' },
        { icon: '🧭', title: 'Melaksanakan', body: 'Melaksanakan hasil musyawarah dengan tanggung jawab', color: 'p' },
      ],
      closingStatement: 'Sila Keempat mengajarkan kita untuk mengambil keputusan melalui musyawarah, menghargai pendapat, dan menjalankan keputusan bersama dengan tanggung jawab.',
      accentColor: 'g',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Sila 4', learningPhase: 'penutup', importance: 0.9 },
    },
  ], 'summary', '🏅 Lencana Misi 4', 'y');
}

// ═══════════════════════════════════════════════════════════════════
// PART F: MISI 5 — Padi Kapas Keadilan (Sila 5) (Pages 26–30)
// ═══════════════════════════════════════════════════════════════════

// ── PAGE 26 — GERBANG MISI 5 ──────────────────────────────────

function createMisi5GerbangPage(): SchemaCanvaPage {
  return makeSchemaPage('Gerbang Misi 5', 'materi', [
    {
      type: 'nc-grid',
      id: bid(),
      cards: [
        { icon: '🌾', title: 'Lambang Padi dan Kapas', body: 'Keadilan Sosial bagi Seluruh Rakyat Indonesia', color: 'y' },
        { icon: '🧭', title: 'Tantangan Misi', body: 'Bagaimana sikapmu saat pembagian tugas tidak adil?', color: 'c' },
        { icon: '⭐', title: 'Lencana', body: 'Padi Kapas Keadilan — lencana untuk penjelajah yang mampu bersikap adil', color: 'g' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 5' },
    },
  ], 'intro', '🚪 Gerbang Misi 5', 'y');
}

// ── PAGE 27 — BEKAL PENJELAJAH 5 ──────────────────────────────

function createMisi5BekalPage(): SchemaCanvaPage {
  return makeSchemaPage('Bekal Penjelajah 5', 'materi', [
    {
      type: 'nc-grid',
      id: bid(),
      cards: [
        { icon: '🌾', title: 'Makna Sila', body: 'Sila Kelima mengajarkan bahwa setiap orang berhak mendapat perlakuan yang adil dan kesempatan yang seimbang.', color: 'y' },
        { icon: '🤝', title: 'Nilai Utama', body: 'Keadilan, kepedulian, keseimbangan hak dan kewajiban, kerja keras, dan gotong royong.', color: 'c' },
        { icon: '🧭', title: 'Arah Sikap', body: 'Kita perlu berbagi secara adil, tidak mengambil hak orang lain, dan peduli kepada yang membutuhkan.', color: 'g' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 5' },
    },
  ], 'concept', '📖 Bekal Penjelajah', 'c');
}

// ── PAGE 28 — SKENARIO 5 ──────────────────────────────────────

function createMisi5SkenarioPage(): SchemaCanvaPage {
  return makeSchemaPage('Skenario 5', 'skenario', [
    {
      type: 'skenario',
      id: bid(),
      title: 'Skenario: Pembagian Tugas yang Tidak Adil',
      chapters: [
        {
          id: 'ch1',
          charEmoji: '🏫',
          title: 'Pembagian Tugas yang Tidak Adil',
          setup: [
            { speaker: 'Situasi', text: 'Saat mengerjakan proyek kelas, kelompok harus membagi tugas membuat poster, mencari informasi, dan menyiapkan presentasi.' },
            { speaker: 'Situasi', text: 'Beberapa siswa ingin memilih tugas yang paling mudah, sementara tugas yang berat diberikan kepada teman yang pendiam.' },
            { speaker: 'Situasi', text: 'Teman yang pendiam terlihat keberatan, tetapi tidak berani menolak.' },
          ],
          choicePrompt: 'Bagaimana sikapmu?',
          choices: [
            {
              icon: '❌',
              label: 'Memilih yang Mudah',
              detail: 'Memilih tugas paling mudah dan membiarkan tugas berat dikerjakan teman lain.',
              good: false,
              pts: 0,
              level: 'bad',
              resultTitle: 'Kurang Tepat',
              resultBody: 'Mengambil yang mudah untuk diri sendiri tidak adil. Tugas berat dibebankan kepada orang lain.',
              feedbackGood: '',
              feedbackBad: 'Keadilan berarti berbagi tugas secara seimbang.',
              norma: 'Keadilan',
              nextChapter: 1,
            },
            {
              icon: '✅',
              label: 'Membagi Tugas dengan Adil',
              detail: 'Mengajak kelompok membagi tugas sesuai kemampuan dan memastikan semua mendapat bagian yang seimbang.',
              good: true,
              pts: 10,
              level: 'good',
              resultTitle: 'Pilihan Bijak!',
              resultBody: 'Kamu memilih sikap adil. Membagi tugas sesuai kemampuan menunjukkan keseimbangan hak dan kewajiban.',
              feedbackGood: 'Kamu sudah memahami nilai keadilan!',
              feedbackBad: '',
              norma: 'Keadilan',
              nextChapter: 1,
            },
            {
              icon: '❌',
              label: 'Diam Saja',
              detail: 'Diam saja karena tidak ingin membuat suasana kelompok menjadi tidak enak.',
              good: false,
              pts: 0,
              level: 'bad',
              resultTitle: 'Kurang Tepat',
              resultBody: 'Diam saja berarti membiarkan ketidakadilan terus terjadi. Teman yang pendiam tetap dirugikan.',
              feedbackGood: '',
              feedbackBad: 'Kita perlu berani mengusulkan pembagian yang adil.',
              norma: 'Keadilan',
              nextChapter: 1,
            },
          ],
        },
      ],
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Sila 5', learningPhase: 'inti', interactionType: 'choose', importance: 0.8 },
    },
  ], 'practice', '🎭 Skenario', 'p');
}

// ── PAGE 29 — KUNCI NILAI 5 ───────────────────────────────────

function createMisi5KunciPage(): SchemaCanvaPage {
  return makeSchemaPage('Kunci Nilai 5', 'materi', [
    {
      type: 'def-box',
      id: bid(),
      borderColor: 'g',
      content: '<strong>Kunci Misi 5:</strong> Keadilan berarti tidak mengambil keuntungan sendiri, tetapi memastikan setiap orang mendapat hak dan menjalankan kewajibannya.',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'inti', interactionType: 'read', topic: 'Sila 5' },
    },
  ], 'concept', '🔑 Kunci Nilai', 'g');
}

// ── PAGE 30 — LENCANA MISI 5 ──────────────────────────────────

function createMisi5LencanaPage(): SchemaCanvaPage {
  return makeSchemaPage('Lencana Misi 5', 'rangkuman', [
    {
      type: 'rangkuman',
      id: bid(),
      title: 'Misi 5 Berhasil!',
      bsnpRequired: true,
      concepts: [
        { icon: '⚖️', title: 'Membagi secara adil', body: 'Membagi tugas dan hak secara adil', color: 'y' },
        { icon: '🤝', title: 'Menolong', body: 'Menolong teman yang membutuhkan', color: 'c' },
        { icon: '🧭', title: 'Menjalankan kewajiban', body: 'Menjalankan kewajiban dengan tanggung jawab', color: 'g' },
        { icon: '🌾', title: 'Tidak serakah', body: 'Tidak mengambil keuntungan sendiri', color: 'p' },
      ],
      closingStatement: 'Sila Kelima mengajarkan kita untuk bersikap adil, menghargai hak orang lain, menjalankan kewajiban, dan peduli kepada kesejahteraan bersama.',
      accentColor: 'g',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Sila 5', learningPhase: 'penutup', importance: 0.9 },
    },
  ], 'summary', '🏅 Lencana Misi 5', 'y');
}

// ═══════════════════════════════════════════════════════════════════
// PART G: EVALUASI & REFLEKSI AKHIR (Pages 31–38)
// ═══════════════════════════════════════════════════════════════════

// ── PAGE 31 — EVALUASI INTRO ──────────────────────────────────

function createEvaluasiIntroPage(): SchemaCanvaPage {
  return makeSchemaPage('Evaluasi Intro', 'materi', [
    {
      type: 'nc-grid',
      id: bid(),
      cards: [
        { icon: '⭐', title: 'Sila 1: Ketuhanan', body: 'Menghormati ibadah dan keyakinan orang lain', color: 'y' },
        { icon: '⛓️', title: 'Sila 2: Kemanusiaan', body: 'Memperlakukan setiap orang secara adil dan beradab', color: 'c' },
        { icon: '🌳', title: 'Sila 3: Persatuan', body: 'Menjaga kekompakan dan mengutamakan kepentingan bersama', color: 'g' },
        { icon: '🐂', title: 'Sila 4: Musyawarah', body: 'Mendengar pendapat dan menerima keputusan bersama', color: 'p' },
        { icon: '🌾', title: 'Sila 5: Keadilan', body: 'Bersikap adil dan peduli terhadap kesejahteraan bersama', color: 'y' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'evaluasi', interactionType: 'read', topic: 'Nilai-Nilai Pancasila' },
    },
  ], 'intro', '🏁 Evaluasi', 'y');
}

// ── PAGES 32–36 — KUIS (1 pertanyaan per halaman) ─────────────
// STANDAR: Quiz = 1 question per page, max 4 options

const QUIZ_QUESTIONS = [
  {
    q: 'Teman sedang beribadah. Sikap terbaik adalah...',
    opts: ['Membiarkan teman lain mengganggu', 'Menjaga ketenangan dan menghormati', 'Mengejek cara ibadahnya'],
    ans: 1,
    ex: 'Sila Pertama mengajarkan kita untuk menghormati ibadah dan keyakinan orang lain.',
  },
  {
    q: 'Pendapat teman ditertawakan. Sikap terbaik adalah...',
    opts: ['Ikut menertawakan', 'Membela dengan sopan', 'Diam saja agar aman'],
    ans: 1,
    ex: 'Sila Kedua mengajarkan kita untuk memperlakukan setiap manusia secara adil, sopan, dan tidak merendahkan.',
  },
  {
    q: 'Saat kelompok berbeda pendapat, sikap terbaik adalah...',
    opts: ['Memaksakan pendapat sendiri', 'Mengajak kerja sama dan sepakat bersama', 'Keluar dari kelompok'],
    ans: 1,
    ex: 'Sila Ketiga mengajarkan kita menjaga persatuan, bukan memaksakan pendapat atau menghindari masalah.',
  },
  {
    q: 'Keputusan rapat kelas sebaiknya diambil dengan...',
    opts: ['Musyawarah dan saling mendengar', 'Teriak paling keras', 'Mengikuti teman dekat saja'],
    ans: 0,
    ex: 'Sila Keempat mengajarkan keputusan bersama dilakukan melalui musyawarah, bukan memaksa atau mengikuti teman dekat saja.',
  },
  {
    q: 'Pembagian tugas yang adil adalah...',
    opts: ['Mengambil tugas paling mudah sendiri', 'Membagi tugas sesuai kemampuan', 'Memberi semua tugas ke satu orang'],
    ans: 1,
    ex: 'Sila Kelima mengajarkan keadilan. Tugas tidak boleh dibebankan hanya kepada satu orang atau dipilih yang paling mudah untuk diri sendiri.',
  },
];

function createKuisPages(): SchemaCanvaPage[] {
  return QUIZ_QUESTIONS.map((q, i) => {
    return makeSchemaPage(
      `Kuis ${i + 1}`,
      'kuis',
      [{
        type: 'kuis',
        id: bid(),
        title: `Kuis: Misi Penjelajah Pancasila (${i + 1}/${QUIZ_QUESTIONS.length})`,
        questions: [q], // STANDAR: 1 question per page
        variant: 'A',
        compression: { priority: 'high', strategy: 'scroll', splittable: true },
        semantic: { topic: 'Nilai-Nilai Pancasila', learningPhase: 'evaluasi', interactionType: 'choose', importance: 0.9 },
      }],
      'assessment',
      `📝 Kuis ${i + 1}/${QUIZ_QUESTIONS.length}`,
      'g',
    );
  });
}

// ── PAGE 37 — REFLEKSI ────────────────────────────────────────
// STANDAR: max 2-3 questions per page

function createRefleksiPage(): SchemaCanvaPage {
  return makeSchemaPage('Refleksi', 'refleksi', [
    {
      type: 'refleksi',
      id: bid(),
      title: 'Refleksi dan Aksi Nyata',
      intro: 'Pancasila bukan hanya untuk dihafal, tetapi juga diterapkan. Renungkan pertanyaan berikut!',
      questions: [
        { teks: 'Hal baru apa yang kamu pelajari tentang nilai-nilai Pancasila?', petunjuk: 'Tuliskan minimal 2 hal baru yang kamu pelajari.', warna: 'c', icon: '🪞' },
        { teks: 'Nilai Pancasila mana yang paling sering kamu terapkan? Berikan contohnya!', petunjuk: 'Ceritakan pengalamanmu menerapkan nilai tersebut.', warna: 'g', icon: '💭' },
      ],
      penugasan: {
        judul: 'Janji Penjelajah Pancasila',
        isi: 'Pilih satu sikap Pancasila yang akan kamu latih mulai hari ini.',
        contoh: 'Saya berkomitmen untuk menghargai teman yang berbeda agama atau keyakinan.',
      },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Nilai-Nilai Pancasila', learningPhase: 'penutup', interactionType: 'reflect', importance: 0.8 },
    },
  ], 'reflection', '📝 Refleksi', 'p');
}

// ── PAGE 38 — LENCANA AKHIR (PENUTUP) ─────────────────────────

function createPenutupPage(): SchemaCanvaPage {
  return makeSchemaPage('Penutup', 'penutup', [
    {
      type: 'penutup',
      id: bid(),
      title: 'Penutup',
      subtitle: 'Petualangan Selesai!',
      preview: [
        { icon: '🧭', judul: 'Lima Misi', isi: 'Menjelajahi nilai setiap Sila Pancasila', warna: 'y' },
        { icon: '⭐', judul: 'Lencana Penjelajah', isi: 'Mendapatkan lima lencana nilai Pancasila', warna: 'c' },
        { icon: '🤝', judul: 'Sikap Nyata', isi: 'Menerapkan nilai Pancasila dalam kehidupan sehari-hari', warna: 'g' },
      ],
      layout: { position: 'absolute', x: 0, y: 0, width: 'auto', height: 'auto' },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Nilai-Nilai Pancasila', learningPhase: 'penutup', importance: 0.7 },
    },
  ], 'summary', '🏁 Penutup', 'y');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN: Create the Golden Project
// STANDAR UTAMA SILSE compliant — 38 pages
// ═══════════════════════════════════════════════════════════════════

export function createPpknPancasilaGoldenProject(metadata: PancasilaGoldenMetadata = {}): CanvaPage[] {
  // Reset ID counter for reproducibility
  _idCounter = 0;

  const pages: CanvaPage[] = [
    // ── PART A: Introduction (5 pages) ──
    createCoverPage(metadata),        // 1. Cover
    createPetunjukPage(),             // 2. Petunjuk
    createMotivasiPage(),             // 3. Motivasi / Apersepsi (2 connections)
    createTujuanPage(),               // 4. Tujuan Pembelajaran (4 items = max)
    createPetaMisiPage(),             // 5. Peta Misi (5 sila cards)

    // ── PART B: Misi 1 — Bintang Kerukunan / Sila 1 (5 pages) ──
    createMisi1GerbangPage(),         // 6. Gerbang Misi 1
    createMisi1BekalPage(),           // 7. Bekal Penjelajah 1
    createMisi1SkenarioPage(),        // 8. Skenario 1 (3 choices)
    createMisi1KunciPage(),           // 9. Kunci Nilai 1
    createMisi1LencanaPage(),         // 10. Lencana Misi 1 (4 concepts)

    // ── PART C: Misi 2 — Rantai Kepedulian / Sila 2 (5 pages) ──
    createMisi2GerbangPage(),         // 11. Gerbang Misi 2
    createMisi2BekalPage(),           // 12. Bekal Penjelajah 2
    createMisi2SkenarioPage(),        // 13. Skenario 2 (3 choices)
    createMisi2KunciPage(),           // 14. Kunci Nilai 2
    createMisi2LencanaPage(),         // 15. Lencana Misi 2 (4 concepts)

    // ── PART D: Misi 3 — Pohon Persatuan / Sila 3 (5 pages) ──
    createMisi3GerbangPage(),         // 16. Gerbang Misi 3
    createMisi3BekalPage(),           // 17. Bekal Penjelajah 3
    createMisi3SkenarioPage(),        // 18. Skenario 3 (3 choices)
    createMisi3KunciPage(),           // 19. Kunci Nilai 3
    createMisi3LencanaPage(),         // 20. Lencana Misi 3 (4 concepts)

    // ── PART E: Misi 4 — Banteng Musyawarah / Sila 4 (5 pages) ──
    createMisi4GerbangPage(),         // 21. Gerbang Misi 4
    createMisi4BekalPage(),           // 22. Bekal Penjelajah 4
    createMisi4SkenarioPage(),        // 23. Skenario 4 (3 choices)
    createMisi4KunciPage(),           // 24. Kunci Nilai 4
    createMisi4LencanaPage(),         // 25. Lencana Misi 4 (4 concepts)

    // ── PART F: Misi 5 — Padi Kapas Keadilan / Sila 5 (5 pages) ──
    createMisi5GerbangPage(),         // 26. Gerbang Misi 5
    createMisi5BekalPage(),           // 27. Bekal Penjelajah 5
    createMisi5SkenarioPage(),        // 28. Skenario 5 (3 choices)
    createMisi5KunciPage(),           // 29. Kunci Nilai 5
    createMisi5LencanaPage(),         // 30. Lencana Misi 5 (4 concepts)

    // ── PART G: Evaluasi & Refleksi Akhir (8 pages) ──
    createEvaluasiIntroPage(),        // 31. Evaluasi Intro (5 sila recap cards)
    ...createKuisPages(),             // 32-36. Kuis (1 question per page × 5)
    createRefleksiPage(),             // 37. Refleksi (2 questions + penugasan)
    createPenutupPage(),              // 38. Penutup
  ];

  return pages;
}
