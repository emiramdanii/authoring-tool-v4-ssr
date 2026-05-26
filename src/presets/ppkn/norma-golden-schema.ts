// ═══════════════════════════════════════════════════════════════════
// PPKn NORMA GOLDEN TEMPLATE — Handcrafted Learning Media
// ═══════════════════════════════════════════════════════════════════
// This is the ONE golden template that produces media pembelajaran
// yang benar-benar JADI — bukan placeholder, bukan generik.
//
// Berdasarkan HTML referensi: mpi-ppkn-norma-final
// Konten: PPKn Kelas VII — Macam-Macam Norma
//
// Pipeline:
//   createProjectFromTemplate('ppkn-norma-golden')
//   → createPpknNormaGoldenProject(metadata)
//   → CanvaPage[] lengkap dengan konten nyata
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

function makeSchemaPage(
  label: string,
  templateType: string,
  blocks: SchemaBlock[],
  sceneType?: SceneType,
): SchemaCanvaPage {
  const page = createPage(label, templateType as CanvaPage['templateType']);
  page.label = label;
  page.templateVariant = 'A';

  const schema: ScreenSchema = {
    id: `screen-${bid()}`,
    templateType,
    blocks,
    ...(sceneType ? { sceneType } : {}),
  };

  page.schema = schema;
  page.elements = [];
  page.pageMode = 'schema';
  return page as SchemaCanvaPage;
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 1 — COVER
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
  ], 'intro');
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
        { icon: '💬', title: 'Diskusikan', body: 'Berbagilah pendapat dengan teman kelompokmu tentang penerapan norma di masyarakat.' },
      ],
      tips: 'Gunakan tombol navigasi di bawah untuk berpindah antar halaman. Klik "Selanjutnya" untuk melanjutkan.',
      tipsColor: 'y',
      variant: 'A',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'pendahuluan', interactionType: 'read' },
    },
  ], 'intro');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 3 — TUJUAN PEMBELAJARAN
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
  ], 'intro');
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
        { icon: '🙏', label: 'Norma Agama', description: 'Berbohong dilarang agama — dosa sebagai sanksi', color: 'y' },
      ],
      transition: 'Semua aturan itu disebut NORMA. Mari kita pelajari macam-macamnya!',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Macam-Macam Norma', learningPhase: 'pendahuluan', importance: 0.8 },
    },
  ], 'intro');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 5 — SKENARIO INTERAKTIF
// ═══════════════════════════════════════════════════════════════════

function createSkenarioPage(): SchemaCanvaPage {
  return makeSchemaPage('Skenario', 'skenario', [
    {
      type: 'skenario',
      id: bid(),
      title: 'Skenario: Norma di Sekolah',
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
              nextChapter: 2,
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
              nextChapter: 2,
            },
          ],
        },
        {
          id: 'ch2',
          charEmoji: '🚦',
          title: 'Situasi di Jalan',
          setup: [
            { speaker: 'Sari', text: 'Ada pengendara motor yang menerjang lampu merah!' },
          ],
          choicePrompt: 'Norma apa yang dilanggar?',
          choices: [
            {
              icon: '✅',
              label: 'Norma Hukum',
              detail: 'Benar! Melanggar lampu merah adalah pelanggaran hukum.',
              good: true,
              pts: 10,
              level: 'good',
              resultTitle: 'Hebat!',
              resultBody: 'Melanggar lampu merah melanggar UU No. 22/2009 tentang Lalu Lintas — itu norma hukum!',
              feedbackGood: 'Kamu memahami norma hukum!',
              feedbackBad: '',
              norma: 'Hukum',
            },
            {
              icon: '❌',
              label: 'Norma Kesopanan',
              detail: 'Bukan kesopanan, tapi hukum yang dilanggar.',
              good: false,
              pts: 0,
              level: 'bad',
              resultTitle: 'Kurang Tepat',
              resultBody: 'Pelanggaran lampu merah bukan sekadar tidak sopan — ini melanggar hukum yang diatur dalam undang-undang.',
              feedbackGood: '',
              feedbackBad: 'Pelanggaran lampu merah termasuk norma hukum, bukan kesopanan.',
              norma: 'Hukum',
            },
          ],
        },
      ],
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Macam-Macam Norma', learningPhase: 'inti', interactionType: 'choose', importance: 0.8 },
    },
  ], 'practice');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 6 — MATERI 1: Pengertian Norma
// ═══════════════════════════════════════════════════════════════════

function createMateri1Page(): SchemaCanvaPage {
  return makeSchemaPage('Materi 1: Pengertian Norma', 'materi', [
    {
      type: 'materi-section',
      id: bid(),
      title: 'Apa Itu Norma?',
      subtitle: 'Pengertian Norma dalam Kehidupan Bermasyarakat',
      bsnpRequired: true,
      icon: '📖',
      accentColor: 'p',
      content: [
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
      ],
      takeaways: ['Norma mengatur tingkah laku', 'Norma bersifat mengikat', 'Pelanggaran ada sanksinya', 'Norma disepakati bersama'],
      selfCheck: 'Apa yang membedakan norma dengan kebiasaan biasa?',
      variant: 'A',
      compression: { priority: 'high', strategy: 'accordion', splittable: true, minFragmentHeight: 200 },
      semantic: { bsnpRelevant: true, learningPhase: 'inti', importance: 0.95, topic: 'Macam-Macam Norma' },
    },
  ], 'concept');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 7 — MATERI 2: Macam-Macam Norma
// ═══════════════════════════════════════════════════════════════════

function createMateri2Page(): SchemaCanvaPage {
  return makeSchemaPage('Materi 2: 4 Jenis Norma', 'materi', [
    {
      type: 'materi-section',
      id: bid(),
      title: 'Macam-Macam Norma',
      subtitle: '4 Jenis Norma dalam Masyarakat Indonesia',
      bsnpRequired: true,
      icon: '⚖️',
      accentColor: 'p',
      content: [
        {
          type: 'nc-grid',
          id: bid(),
          cards: [
            { icon: '🙏', title: '1. Norma Agama', body: 'Peraturan yang berasal dari Tuhan YME. Sanksinya berupa dosa. Contoh: beribadah, jujur, tidak mencuri.', color: 'y' },
            { icon: '❤️', title: '2. Norma Kesusilaan', body: 'Peraturan yang berasal dari hati nurani. Sanksinya berupa rasa bersalah. Contoh: tidak berbohong, tidak berzina.', color: 'r' },
            { icon: '🤝', title: '3. Norma Kesopanan', body: 'Peraturan yang berasal dari masyarakat. Sanksinya berupa teguran. Contoh: makan tidak bersuara, menghormati yang lebih tua.', color: 'c' },
            { icon: '⚖️', title: '4. Norma Hukum', body: 'Peraturan yang dibuat oleh negara. Sanksinya berupa hukuman pidana/denda. Contoh: tidak mencuri, taat lampu merah.', color: 'p' },
          ],
          compression: { priority: 'medium', strategy: 'scroll' },
          semantic: { learningPhase: 'inti', interactionType: 'read' },
        },
        {
          type: 'def-box',
          id: bid(),
          borderColor: 'g',
          content: '<strong>Perbedaan Utama:</strong> Sumber norma menentukan sanksinya. Norma agama dari Tuhan (dosa), norma kesusilaan dari nurani (rasa bersalah), norma kesopanan dari masyarakat (teguran), norma hukum dari negara (pidana/denda).',
          compression: { priority: 'high', strategy: 'accordion' },
          semantic: { learningPhase: 'inti', interactionType: 'read' },
        },
      ],
      takeaways: ['4 jenis norma', 'Sumber berbeda → sanksi berbeda', 'Norma agama = dosa', 'Norma hukum = pidana'],
      selfCheck: 'Mengapa sanksi norma hukum paling tegas dibanding norma lainnya?',
      variant: 'A',
      compression: { priority: 'high', strategy: 'accordion', splittable: true, minFragmentHeight: 200 },
      semantic: { bsnpRelevant: true, learningPhase: 'inti', importance: 0.95, topic: 'Macam-Macam Norma' },
    },
  ], 'concept');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 8 — MATERI 3: Contoh Penerapan
// ═══════════════════════════════════════════════════════════════════

function createMateri3Page(): SchemaCanvaPage {
  return makeSchemaPage('Materi 3: Penerapan Norma', 'materi', [
    {
      type: 'materi-section',
      id: bid(),
      title: 'Penerapan Norma dalam Kehidupan',
      subtitle: 'Contoh Nyata 4 Jenis Norma',
      bsnpRequired: true,
      icon: '🏠',
      accentColor: 'p',
      content: [
        {
          type: 'def-box',
          id: bid(),
          borderColor: 'y',
          content: '<strong>Contoh Norma Agama:</strong> Seorang Muslim melaksanakan salat lima waktu, seorang Kristen beribadah di gereja pada hari Minggu, seorang Hindu bersembahyang di pura. Semua itu penerapan norma agama yang sanksinya berupa dosa jika ditinggalkan.',
          compression: { priority: 'high', strategy: 'accordion' },
          semantic: { learningPhase: 'inti', interactionType: 'read' },
        },
        {
          type: 'def-box',
          id: bid(),
          borderColor: 'r',
          content: '<strong>Contoh Norma Kesusilaan:</strong> Seseorang merasa bersalah setelah berbohong kepada orang tua. Rasa bersalah itu muncul dari nurani, bukan dari hukum atau teguran — itulah sanksi norma kesusilaan.',
          compression: { priority: 'high', strategy: 'accordion' },
          semantic: { learningPhase: 'inti', interactionType: 'read' },
        },
        {
          type: 'def-box',
          id: bid(),
          borderColor: 'c',
          content: '<strong>Contoh Norma Kesopanan:</strong> Seorang siswa berpakaian rapi ke sekolah, mengucapkan salam kepada guru, dan makan dengan tangan kanan. Jika melanggar, mendapat teguran dari orang sekitar.',
          compression: { priority: 'high', strategy: 'accordion' },
          semantic: { learningPhase: 'inti', interactionType: 'read' },
        },
        {
          type: 'def-box',
          id: bid(),
          borderColor: 'p',
          content: '<strong>Contoh Norma Hukum:</strong> Pengendara yang melanggar lampu merah dikenakan tilang sesuai UU No. 22/2009. Pencuri dihukum penjara sesuai KUHP. Sanksinya tegas karena dijamin oleh negara.',
          compression: { priority: 'high', strategy: 'accordion' },
          semantic: { learningPhase: 'inti', interactionType: 'read' },
        },
      ],
      takeaways: ['Norma agama: ibadah, dosa', 'Norma kesusilaan: nurani, rasa bersalah', 'Norma kesopanan: masyarakat, teguran', 'Norma hukum: negara, pidana'],
      selfCheck: 'Berikan 1 contoh penerapan masing-masing norma yang kamu temui di lingkunganmu!',
      variant: 'A',
      compression: { priority: 'high', strategy: 'accordion', splittable: true, minFragmentHeight: 200 },
      semantic: { bsnpRelevant: true, learningPhase: 'inti', importance: 0.95, topic: 'Macam-Macam Norma' },
    },
  ], 'concept');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 9 — DISKUSI
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
        { label: 'Pertanyaan 3', icon: '🗣️', teks: 'Bagaimana jika masyarakat tidak memiliki norma? Ceritakan apa yang akan terjadi!', petunjuk: 'Bayangkan kehidupan tanpa aturan.', color: 'g' },
        { label: 'Pertanyaan 4', icon: '👥', teks: 'Contoh mana yang menunjukkan norma kesopanan berubah menjadi norma hukum? Jelaskan alasanmu!', petunjuk: 'Pikirkan tentang aturan tertulis vs tidak tertulis.', color: 'p' },
      ],
      variant: 'A',
      compression: { priority: 'high', strategy: 'scroll' },
      semantic: { topic: 'Macam-Macam Norma', learningPhase: 'inti', interactionType: 'discuss', importance: 0.85 },
    },
  ], 'discussion');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 10 — KUIS
// ═══════════════════════════════════════════════════════════════════

function createKuisPage(): SchemaCanvaPage {
  return makeSchemaPage('Kuis', 'kuis', [
    {
      type: 'kuis',
      id: bid(),
      title: 'Kuis: Macam-Macam Norma',
      questions: [
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
      ],
      variant: 'A',
      compression: { priority: 'high', strategy: 'scroll', splittable: true },
      semantic: { topic: 'Macam-Macam Norma', learningPhase: 'inti', interactionType: 'choose', importance: 0.9 },
    },
  ], 'assessment');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 11 — REFLEKSI
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
        { teks: 'Tulis komitmen pribadimu untuk lebih baik dalam menerapkan norma di lingkunganmu!', petunjuk: 'Gunakan kalimat "Saya berkomitmen untuk..."', warna: 'y', icon: '🎯' },
      ],
      penugasan: {
        judul: 'Tugas Refleksi',
        isi: 'Tulis refleksi pribadimu tentang macam-macam norma yang kamu pelajari hari ini.',
        contoh: 'Saya belajar bahwa ada 4 jenis norma... Saya akan menerapkannya dengan...',
      },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Macam-Macam Norma', learningPhase: 'penutup', interactionType: 'reflect', importance: 0.8 },
    },
  ], 'reflection');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 12 — RANGKUMAN
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
        { icon: '🙏', title: 'Norma Agama', body: 'Berasal dari Tuhan YME. Sanksi: dosa. Contoh: salat, tidak mencuri, jujur.', color: 'y' },
        { icon: '❤️', title: 'Norma Kesusilaan', body: 'Berasal dari hati nurani. Sanksi: rasa bersalah. Contoh: tidak berbohong, tidak berzina.', color: 'r' },
        { icon: '🤝', title: 'Norma Kesopanan', body: 'Berasal dari masyarakat. Sanksi: teguran. Contoh: sopan santun, menghormati yang lebih tua.', color: 'c' },
        { icon: '⚖️', title: 'Norma Hukum', body: 'Berasal dari negara. Sanksi: pidana/denda. Contoh: taat lampu merah, UUD.', color: 'p' },
      ],
      closingStatement: 'Keempat norma saling melengkapi dalam mengatur kehidupan bermasyarakat. Tanpa norma, kehidupan akan kacau karena tidak ada aturan yang mengikat.',
      accentColor: 'g',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Macam-Macam Norma', learningPhase: 'penutup', importance: 0.9 },
    },
  ], 'summary');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 13 — PENUTUP
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
        { icon: '📝', judul: 'Tugas', isi: 'Refleksi penerapan norma di lingkunganmu', warna: 'g' },
      ],
      layout: { position: 'absolute', x: 0, y: 0, width: 'auto', height: 'auto' },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Macam-Macam Norma', learningPhase: 'penutup', importance: 0.7 },
    },
  ], 'summary');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN: Create the Golden Project
// ═══════════════════════════════════════════════════════════════════

export function createPpknNormaGoldenProject(metadata: NormaGoldenMetadata = {}): CanvaPage[] {
  // Reset ID counter for reproducibility
  _idCounter = 0;

  const pages: CanvaPage[] = [
    createCoverPage(metadata),       // 1. Cover
    createPetunjukPage(),            // 2. Petunjuk
    createTujuanPage(),              // 3. Tujuan Pembelajaran
    createMotivasiPage(),            // 4. Motivasi / Apersepsi
    createSkenarioPage(),            // 5. Skenario Interaktif
    createMateri1Page(),             // 6. Materi 1: Pengertian Norma
    createMateri2Page(),             // 7. Materi 2: 4 Jenis Norma
    createMateri3Page(),             // 8. Materi 3: Penerapan Norma
    createDiskusiPage(),             // 9. Diskusi
    createKuisPage(),                // 10. Kuis
    createRefleksiPage(),            // 11. Refleksi
    createRangkumanPage(),           // 12. Rangkuman
    createPenutupPage(),             // 13. Penutup
  ];

  return pages;
}
