// ═══════════════════════════════════════════════════════════════════
// SILSE FRESH PPKn TEMPLATE — V5 TEMPLATE REINSTALL (Batch 11 + 11A)
// ═══════════════════════════════════════════════════════════════════
// Batch 11 — V5-TEMPLATE-REINSTALL-01:
//   Senior decision: install ulang template content layer. Old PPKn
//   template (norma-golden-schema.ts) was "OS rusak". NOT repaired.
//   Reinstalled fresh from scratch.
//
// Batch 11A — V5-DEFAULT-PAGE-TEMPLATE-PURGE-01:
//   Senior follow-up: fresh PPKn must be REAL PPKn content, not
//   generic placeholder. Rewrote with curriculum content:
//     Title: "Hidup Tertib dengan Norma"
//     Materi: pengertian norma, fungsi norma, contoh di sekolah/rumah/masyarakat
//     Game sortir: contoh perilaku tertib vs tidak tertib
//     Kuis: 5 soal PPKn nyata
//     Refleksi: penerapan norma di kelas
//
// Fresh template principles (preserved from Batch 11):
//   1. NO inheritance from any legacy template generator
//   2. NO legacy dark contract (legacy is quarantined)
//   3. NO legacy academic theme as default
//   4. NO elements[] legacy
//   5. Schema-first — every page has schema.blocks[]
//   6. contractId = 'silse-fresh' on EVERY page
//   7. Light, calm, educator-friendly design
//   8. 8 pages: cover, petunjuk, tujuan, materi, sortir-game, kuis,
//      refleksi, penutup
//
// Tool / renderer / editor / store / ExportApp: UNCHANGED.
// Only the template content layer is reinstalled.
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage, SchemaCanvaPage } from '@/components/canva/types';
import type { ScreenSchema, SchemaBlock } from '@/core/schema/types';
import type { SceneType } from '@/core/edu/education-scene-types';
import { createPage } from '@/store/canva/constants';

// ── Types ──────────────────────────────────────────────────────

export interface SilseFreshMetadata {
  /** Override the default title shown on cover */
  title?: string;
  /** Override the default guru name shown on cover badge */
  guru?: string;
  /** Override the default sekolah name shown on cover badge */
  sekolah?: string;
}

// ── Helpers ────────────────────────────────────────────────────

let _freshIdCounter = 0;
function fbid(): string {
  return `silse-fresh-${++_freshIdCounter}`;
}

/**
 * Build a fresh schema-first page.
 *
 * STANDAR UTAMA SILSE (fresh edition):
 *   - Every page gets contractId = 'silse-fresh'
 *   - Every page has schema.blocks[]
 *   - Every page has sceneType (scene-aware rendering)
 *   - Every page has sectionLabel + sectionColor
 *   - elements[] is always EMPTY (no legacy element mode)
 *   - pageMode is always 'schema'
 */
function makeFreshPage(
  label: string,
  templateType: string,
  blocks: SchemaBlock[],
  sceneType: SceneType,
  sectionLabel: string,
  sectionColor: string,
): SchemaCanvaPage {
  const page = createPage(label, templateType as CanvaPage['templateType']);
  page.label = label;
  page.templateVariant = 'A';
  // Fresh contract — NOT legacy dark, NOT modern-educator
  page.contractId = 'silse-fresh';

  const schema: ScreenSchema = {
    id: `screen-${fbid()}`,
    templateType,
    blocks,
    sceneType,
    sectionLabel,
    sectionColor,
  };

  page.schema = schema;
  // Fresh template is schema-first — no legacy elements[]
  page.elements = [];
  page.pageMode = 'schema';
  return page as SchemaCanvaPage;
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 1 — COVER
// Fresh cover: light cream bg, deep teal accent, single CTA.
// Title: "Hidup Tertib dengan Norma" — real PPKn curriculum topic.
// ═══════════════════════════════════════════════════════════════════

function createFreshCoverPage(meta: SilseFreshMetadata): SchemaCanvaPage {
  return makeFreshPage('Cover', 'cover', [
    {
      type: 'cover',
      id: fbid(),
      icon: '⚖️',
      title: meta.title || 'Hidup Tertib dengan Norma',
      subtitle: 'PPKn Kelas VII — Memahami Norma dalam Kehidupan Sehari-hari',
      badges: [
        { icon: '📚', text: meta.title || 'Bab: Norma dan Kehidupan Tertib', color: 't' },
        { icon: '🏫', text: meta.sekolah || 'SMP Negeri 1 Indonesia', color: 'b' },
        { icon: '👨\u200d🏫', text: meta.guru || 'Guru PPKn', color: 'a' },
      ],
      meta: {
        durasi: '2 × 40 menit',
        fase: 'D',
        elemen: 'Pancasila',
      },
      cta: { label: 'Mulai Belajar', action: 'next' },
      layout: { position: 'absolute', x: 0, y: 0, width: 'auto', height: 'auto' },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Hidup Tertib dengan Norma', learningPhase: 'pendahuluan', importance: 1.0 },
    },
  ], 'intro', '🌱 Cover', 't');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 2 — PETUNJUK
// PPKn-specific petunjuk — references norma, tertib, refleksi.
// ═══════════════════════════════════════════════════════════════════

function createFreshPetunjukPage(): SchemaCanvaPage {
  return makeFreshPage('Petunjuk', 'petunjuk', [
    {
      type: 'petunjuk',
      id: fbid(),
      title: 'Petunjuk',
      titleHighlight: 'Penggunaan',
      items: [
        { icon: '📖', title: 'Pelajari Materi', body: 'Baca penjelasan tentang pengertian, fungsi, dan macam-macam norma di halaman materi.' },
        { icon: '🎮', title: 'Coba Aktivitas Sortir', body: 'Pindahkan contoh perilaku ke kolom yang sesuai: tertib atau tidak tertib.' },
        { icon: '📝', title: 'Kerjakan Kuis', body: 'Jawab 5 soal kuis untuk menguji pemahamanmu tentang norma dalam kehidupan sehari-hari.' },
        { icon: '🪞', title: 'Refleksi', body: 'Renungkan bagaimana kamu menerapkan norma di kelas, di rumah, dan di masyarakat.' },
      ],
      tips: 'Gunakan tombol navigasi di bawah untuk berpindah halaman. Setiap halaman saling terkait.',
      tipsColor: 't',
      variant: 'A',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'pendahuluan', interactionType: 'read' },
    },
  ], 'intro', '📌 Petunjuk', 'b');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 3 — TUJUAN PEMBELAJARAN
// STANDAR: max 4 tujuan per halaman. PPKn-specific objectives.
// ═══════════════════════════════════════════════════════════════════

function createFreshTujuanPage(): SchemaCanvaPage {
  return makeFreshPage('Tujuan Pembelajaran', 'tujuan', [
    {
      type: 'tujuan-display',
      id: fbid(),
      title: 'Tujuan Pembelajaran',
      bsnpRequired: true,
      objectives: [
        { icon: '🎯', text: 'Menjelaskan pengertian norma sebagai aturan hidup bermasyarakat', color: 't' },
        { icon: '🎯', text: 'Mengidentifikasi fungsi norma dalam menjaga ketertiban', color: 'b' },
        { icon: '🎯', text: 'Menganalisis contoh penerapan norma di sekolah, rumah, dan masyarakat', color: 'a' },
        { icon: '🎯', text: 'Menunjukkan sikap tertib dalam kehidupan sehari-hari sebagai wujud pengamalan norma', color: 't' },
      ],
      profil: 'Beriman & Bertakwa kepada Tuhan YME, Bernalar Kritis, Gotong Royong',
      profilColor: 't',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Hidup Tertib dengan Norma', learningPhase: 'pendahuluan', importance: 0.9 },
    },
  ], 'intro', '🎯 Tujuan', 'b');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 4 — MATERI
// Real PPKn materi: pengertian norma + fungsi norma + contoh penerapan.
// ═══════════════════════════════════════════════════════════════════

function createFreshMateriPage(): SchemaCanvaPage {
  return makeFreshPage('Materi: Pengertian dan Fungsi Norma', 'materi', [
    {
      type: 'def-box',
      id: fbid(),
      borderColor: 't',
      content: '<strong>Norma</strong> adalah aturan atau ketentuan yang mengatur tingkah laku manusia dalam kehidupan bermasyarakat. Norma berfungsi menjaga ketertiban, menciptakan keharmonisan, dan memberikan panduan tentang apa yang boleh dan tidak boleh dilakukan. Tanpa norma, kehidupan bersama akan kacau karena setiap orang bertindak sesuka hati.',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'inti', interactionType: 'read' },
    },
    {
      type: 'nc-grid',
      id: fbid(),
      cards: [
        { icon: '⚖️', title: 'Di Sekolah', body: 'Mematuhi tata tertib sekolah: datang tepat waktu, mengenakan seragam, menghormati guru, dan mengerjakan tugas.', color: 't' },
        { icon: '🏠', title: 'Di Rumah', body: 'Menghormati orang tua, membantu pekerjaan rumah, dan menjaga kebersihan kamar serta ruang bersama.', color: 'b' },
        { icon: '👥', title: 'Di Masyarakat', body: 'Mengantre dengan tertib, tidak membuang sampah sembarangan, dan ikut menjaga keamanan lingkungan.', color: 'a' },
        { icon: '🤝', title: 'Fungsi Norma', body: 'Norma menciptakan ketertiban, keadilan, dan rasa aman. Norma juga membentuk karakter pribadi yang bertanggung jawab.', color: 't' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read' },
    },
  ], 'concept', '📖 Materi', 't');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 5 — GAME SORTIR
// Fresh sortir: contoh perilaku TERTIB vs TIDAK TERTIB.
// Real PPKn examples that connect to the materi.
// ═══════════════════════════════════════════════════════════════════

function createFreshSortirGamePage(): SchemaCanvaPage {
  return makeFreshPage('Aktivitas: Tertib atau Tidak Tertib?', 'game', [
    {
      type: 'sortir-game',
      id: fbid(),
      title: 'Sortir: Perilaku Tertib vs Tidak Tertib',
      pool: [
        { id: 'fp1', text: 'Mengantre dengan tertib di kantin', category: 'fk1' },     // tertib
        { id: 'fp2', text: 'Membuang sampah di tempat sampah', category: 'fk1' },     // tertib
        { id: 'fp3', text: 'Memotong antrean teman', category: 'fk2' },               // tidak tertib
        { id: 'fp4', text: 'Bermain HP saat guru menjelaskan', category: 'fk2' },     // tidak tertib
      ],
      kolom: [
        { id: 'fk1', label: 'Perilaku Tertib', color: 't' },
        { id: 'fk2', label: 'Perilaku Tidak Tertib', color: 'a' },
      ],
      accentColor: 'a',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { learningPhase: 'inti', interactionType: 'drag', importance: 0.85 },
    },
  ], 'assessment', '🎮 Aktivitas', 'a');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 6 — KUIS
// Fresh kuis: 5 soal PPKn nyata tentang norma dalam kehidupan sehari-hari.
// (Senior Scope C: minimal 5 soal PPKn.)
// ═══════════════════════════════════════════════════════════════════

function createFreshKuisPage(): SchemaCanvaPage {
  return makeFreshPage('Kuis: Pemahaman tentang Norma', 'kuis', [
    {
      type: 'kuis',
      id: fbid(),
      title: 'Kuis: Norma dalam Kehidupan Sehari-hari',
      questions: [
        {
          q: 'Apa pengertian norma?',
          opts: [
            'Aturan yang mengatur tingkah laku manusia dalam bermasyarakat',
            'Lembaga yang membuat undang-undang',
            'Hukuman bagi pelanggar aturan',
            'Tradisi turun-temurun dari nenek moyang',
          ],
          ans: 0,
          ex: 'Norma adalah aturan/ketentuan yang mengatur tingkah laku manusia dalam kehidupan bermasyarakat.',
        },
        {
          q: 'Berikut ini yang merupakan contoh penerapan norma di sekolah adalah...',
          opts: [
            'Bermain game sampai larut malam',
            'Datang tepat waktu dan mengenakan seragam lengkap',
            'Memesan makanan lewat ojek online',
            'Menonton film di bioskop bersama teman',
          ],
          ans: 1,
          ex: 'Datang tepat waktu dan mengenakan seragam adalah penerapan tata tertib sekolah (norma).',
        },
        {
          q: 'Apa fungsi utama norma dalam kehidupan bermasyarakat?',
          opts: [
            'Memperkaya diri sendiri',
            'Membuat orang takut kepada penguasa',
            'Menjaga ketertiban dan keharmonisan',
            'Menghambat perkembangan zaman',
          ],
          ans: 2,
          ex: 'Norma berfungsi menjaga ketertiban, keharmonisan, dan memberi panduan tingkah laku.',
        },
        {
          q: 'Mengantre di kantin sekolah merupakan contoh penerapan norma...',
          opts: [
            'Norma Hukum',
            'Norma Kesopanan',
            'Norma Agama',
            'Norma Kesusilaan',
          ],
          ans: 1,
          ex: 'Mengantre adalah kesepakatan masyarakat untuk tertib — ciri norma kesopanan.',
        },
        {
          q: 'Jika tidak ada norma dalam masyarakat, apa yang akan terjadi?',
          opts: [
            'Masyarakat menjadi lebih sejahtera',
            'Kehidupan menjadi kacau karena setiap orang bertindak sesuka hati',
            'Pemerintah menjadi lebih berkuasa',
            'Tidak ada perubahan apa pun',
          ],
          ans: 1,
          ex: 'Tanpa norma, tidak ada aturan yang mengikat — masyarakat akan kacau dan tidak tertib.',
        },
      ],
      variant: 'A',
      compression: { priority: 'high', strategy: 'scroll', splittable: true },
      semantic: { topic: 'Kuis Norma', learningPhase: 'inti', interactionType: 'choose', importance: 0.9 },
    },
  ], 'assessment', '📝 Kuis', 'b');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 7 — REFLEKSI
// PPKn-specific refleksi: penerapan norma di kelas + komitmen pribadi.
// ═══════════════════════════════════════════════════════════════════

function createFreshRefleksiPage(): SchemaCanvaPage {
  return makeFreshPage('Refleksi: Norma dalam Hidupku', 'refleksi', [
    {
      type: 'refleksi',
      id: fbid(),
      title: 'Refleksi: Penerapan Norma dalam Kehidupanku',
      intro: 'Renungkan pertanyaan berikut untuk mengaitkan pembelajaran dengan pengalamanmu sendiri.',
      questions: [
        { teks: 'Contoh perilaku tertib apa yang sudah kamu lakukan di kelas minggu ini?', petunjuk: 'Sebutkan minimal 2 contoh nyata.', warna: 'b', icon: '🪞' },
        { teks: 'Pernahkah kamu melihat teman melanggar norma? Bagaimana reaksimu?', petunjuk: 'Ceritakan situasinya dan apa yang kamu lakukan.', warna: 't', icon: '💭' },
      ],
      penugasan: {
        judul: 'Komitmen Tertib di Kelas',
        isi: 'Tulis satu komitmen nyata yang akan kamu lakukan untuk menerapkan norma di kelas mulai minggu ini.',
        contoh: 'Saya berkomitmen untuk selalu mengangkat tangan sebelum bertanya dan tidak memotong pembicaraan guru.',
      },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Refleksi Norma', learningPhase: 'penutup', interactionType: 'reflect', importance: 0.8 },
    },
  ], 'reflection', '🪞 Refleksi', 't');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 8 — PENUTUP
// Fresh penutup: PPKn-specific summary.
// ═══════════════════════════════════════════════════════════════════

function createFreshPenutupPage(): SchemaCanvaPage {
  return makeFreshPage('Penutup', 'penutup', [
    {
      type: 'penutup',
      id: fbid(),
      title: 'Penutup',
      subtitle: 'Pembelajaran Selesai',
      preview: [
        { icon: '📚', judul: 'Materi', isi: 'Norma = aturan hidup bermasyarakat. Fungsi: ketertiban, keharmonisan, panduan tingkah laku.', warna: 't' },
        { icon: '🎯', judul: 'Tujuan', isi: 'Memahami norma dan menerapkannya di sekolah, rumah, dan masyarakat.', warna: 'b' },
        { icon: '🌱', judul: 'Komitmen', isi: 'Jadilah pribadi tertib sebagai wujud pengamalan norma dalam kehidupan sehari-hari.', warna: 'a' },
      ],
      layout: { position: 'absolute', x: 0, y: 0, width: 'auto', height: 'auto' },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Penutup Norma', learningPhase: 'penutup', importance: 0.7 },
    },
  ], 'summary', '🏁 Penutup', 'a');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ENTRY — createSilseFreshPpknProject
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a fresh PPKn project from scratch.
 *
 * This is the V5 fresh template — installed from a clean slate,
 * with no inheritance from any legacy template generator.
 *
 * Title: "Hidup Tertib dengan Norma" — real PPKn curriculum topic
 * for Kelas VII about norma in everyday life.
 *
 * Returns 8 pages:
 *   1. Cover
 *   2. Petunjuk
 *   3. Tujuan Pembelajaran
 *   4. Materi (Pengertian + Fungsi Norma + Contoh Penerapan)
 *   5. Aktivitas Sortir (Perilaku Tertib vs Tidak Tertib)
 *   6. Kuis (5 soal PPKn nyata)
 *   7. Refleksi (Penerapan Norma dalam Kehidupanku)
 *   8. Penutup
 *
 * Every page has:
 *   - contractId = 'silse-fresh'
 *   - schema.blocks[] (schema-first)
 *   - elements = [] (no legacy element mode)
 *   - pageMode = 'schema'
 */
export function createSilseFreshPpknProject(metadata: SilseFreshMetadata = {}): CanvaPage[] {
  // Reset ID counter for reproducibility
  _freshIdCounter = 0;

  const pages: CanvaPage[] = [
    createFreshCoverPage(metadata),       // 1. Cover
    createFreshPetunjukPage(),            // 2. Petunjuk
    createFreshTujuanPage(),              // 3. Tujuan Pembelajaran
    createFreshMateriPage(),              // 4. Materi
    createFreshSortirGamePage(),          // 5. Game Sortir
    createFreshKuisPage(),                // 6. Kuis
    createFreshRefleksiPage(),            // 7. Refleksi
    createFreshPenutupPage(),             // 8. Penutup
  ];

  return pages;
}

// ═══════════════════════════════════════════════════════════════════
// FRESH TEMPLATE METADATA
// ═══════════════════════════════════════════════════════════════════

export const SILSE_FRESH_TEMPLATE_META = {
  id: 'silse-fresh-ppkn',
  name: 'SILSE Fresh — Hidup Tertib dengan Norma',
  description: 'Template PPKn fresh V5. Materi: pengertian, fungsi, dan contoh penerapan norma. Game sortir perilaku tertib/tidak tertib. Kuis 5 soal PPKn nyata. Light cream background, deep teal accent.',
  icon: '🌱',
  subject: 'PPKn',
  grade: '*',
  semester: '*',
  theme: 'default',
  contractId: 'silse-fresh',
  status: 'active' as const,
  author: 'SILSE',
  version: '1.1.0',  // Bumped in 11A — content rewrite with real PPKn
  pageCount: 8,
} as const;
