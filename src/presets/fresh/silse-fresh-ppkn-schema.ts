// ═══════════════════════════════════════════════════════════════════
// SILSE FRESH PPKn TEMPLATE — V5 TEMPLATE REINSTALL (Batch 11)
// ═══════════════════════════════════════════════════════════════════
// Senior decision (Batch 11 — V5-TEMPLATE-REINSTALL-01):
//   Old PPKn template (legacy, quarantined) was "OS rusak" — mixed
//   old content + style + contract + cover-dark + fallback chaos.
//   We do NOT repair it. We install a FRESH template from scratch.
//
// Fresh template principles:
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
// No dark navy, no legacy dark contract inheritance.
// ═══════════════════════════════════════════════════════════════════

function createFreshCoverPage(meta: SilseFreshMetadata): SchemaCanvaPage {
  return makeFreshPage('Cover', 'cover', [
    {
      type: 'cover',
      id: fbid(),
      icon: '🌱',
      title: meta.title || 'Belajar Bersama SILSE',
      subtitle: 'Media Pembelajaran Interaktif',
      badges: [
        { icon: '📚', text: meta.title || 'Modul Pembelajaran', color: 't' },
        { icon: '🏫', text: meta.sekolah || 'Sekolah Indonesia', color: 'b' },
        { icon: '👨\u200d🏫', text: meta.guru || 'Guru Pengampu', color: 'a' },
      ],
      meta: {
        durasi: '2 × 40 menit',
        fase: 'D',
        elemen: 'Pembelajaran Aktif',
      },
      cta: { label: 'Mulai Belajar', action: 'next' },
      layout: { position: 'absolute', x: 0, y: 0, width: 'auto', height: 'auto' },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Pembelajaran SILSE', learningPhase: 'pendahuluan', importance: 1.0 },
    },
  ], 'intro', '🌱 Cover', 't');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 2 — PETUNJUK
// ═══════════════════════════════════════════════════════════════════

function createFreshPetunjukPage(): SchemaCanvaPage {
  return makeFreshPage('Petunjuk', 'petunjuk', [
    {
      type: 'petunjuk',
      id: fbid(),
      title: 'Petunjuk',
      titleHighlight: 'Penggunaan',
      items: [
        { icon: '📖', title: 'Pelajari Materi', body: 'Baca penjelasan di setiap halaman materi dengan saksama.' },
        { icon: '🎮', title: 'Coba Aktivitas', body: 'Selesaikan game sortir dan kuis untuk menguji pemahamanmu.' },
        { icon: '🪞', title: 'Refleksi', body: 'Renungkan pertanyaan refleksi di akhir pembelajaran.' },
      ],
      tips: 'Gunakan tombol navigasi di bawah untuk berpindah halaman.',
      tipsColor: 't',
      variant: 'A',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'pendahuluan', interactionType: 'read' },
    },
  ], 'intro', '📌 Petunjuk', 'b');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 3 — TUJUAN PEMBELAJARAN
// STANDAR: max 4 tujuan per halaman
// ═══════════════════════════════════════════════════════════════════

function createFreshTujuanPage(): SchemaCanvaPage {
  return makeFreshPage('Tujuan Pembelajaran', 'tujuan', [
    {
      type: 'tujuan-display',
      id: fbid(),
      title: 'Tujuan Pembelajaran',
      bsnpRequired: true,
      objectives: [
        { icon: '🎯', text: 'Memahami konsep utama yang akan dipelajari', color: 't' },
        { icon: '🎯', text: 'Menerapkan konsep melalui aktivitas interaktif', color: 'b' },
        { icon: '🎯', text: 'Menganalisis penerapan konsep dalam kehidupan sehari-hari', color: 'a' },
        { icon: '🎯', text: 'Merefleksikan pembelajaran untuk pengembangan diri', color: 't' },
      ],
      profil: 'Bernalar Kritis, Kreatif, Mandiri',
      profilColor: 't',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Tujuan Pembelajaran', learningPhase: 'pendahuluan', importance: 0.9 },
    },
  ], 'intro', '🎯 Tujuan', 'b');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 4 — MATERI
// Fresh materi: def-box + nc-grid, clean content
// ═══════════════════════════════════════════════════════════════════

function createFreshMateriPage(): SchemaCanvaPage {
  return makeFreshPage('Materi Pembelajaran', 'materi', [
    {
      type: 'def-box',
      id: fbid(),
      borderColor: 't',
      content: '<strong>Materi Pembelajaran</strong> adalah inti dari modul ini. Pelajari konsep berikut dengan saksama, lalu hubungkan dengan contoh-contoh pada kartu di bawah.',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'inti', interactionType: 'read' },
    },
    {
      type: 'nc-grid',
      id: fbid(),
      cards: [
        { icon: '💡', title: 'Konsep Inti', body: 'Pahami definisi dan ruang lingkup konsep utama yang dipelajari', color: 't' },
        { icon: '🔍', title: 'Ciri-Ciri', body: 'Identifikasi karakteristik khas yang membedakan konsep ini dari yang lain', color: 'b' },
        { icon: '📊', title: 'Contoh Penerapan', body: 'Pelajari contoh penerapan konsep dalam situasi nyata', color: 'a' },
        { icon: '🤝', title: 'Relevansi', body: 'Hubungkan konsep dengan kehidupan sehari-hari dan profil pelajar Pancasila', color: 't' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read' },
    },
  ], 'concept', '📖 Materi', 't');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 5 — GAME SORTIR
// Fresh sortir game: 4 pool items + 4 kolom (matches BlockDefinitionRegistry
// Batch 13E enrichment)
// ═══════════════════════════════════════════════════════════════════

function createFreshSortirGamePage(): SchemaCanvaPage {
  return makeFreshPage('Aktivitas Sortir', 'game', [
    {
      type: 'sortir-game',
      id: fbid(),
      title: 'Aktivitas Sortir',
      pool: [
        { id: 'fp1', text: 'Kartu Pertama', category: 'fk1' },
        { id: 'fp2', text: 'Kartu Kedua', category: 'fk2' },
        { id: 'fp3', text: 'Kartu Ketiga', category: 'fk3' },
        { id: 'fp4', text: 'Kartu Keempat', category: 'fk4' },
      ],
      kolom: [
        { id: 'fk1', label: 'Kolom A', color: 't' },
        { id: 'fk2', label: 'Kolom B', color: 'b' },
        { id: 'fk3', label: 'Kolom C', color: 'a' },
        { id: 'fk4', label: 'Kolom D', color: 't' },
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
// Fresh kuis: 3 pertanyaan multi-choice (1 page, multi-question — STANDAR)
// ═══════════════════════════════════════════════════════════════════

function createFreshKuisPage(): SchemaCanvaPage {
  return makeFreshPage('Kuis', 'kuis', [
    {
      type: 'kuis',
      id: fbid(),
      title: 'Kuis: Pemahaman Materi',
      questions: [
        {
          q: 'Apa tujuan utama dari mempelajari materi ini?',
          opts: ['Untuk lulus ujian', 'Untuk memahami dan menerapkan konsep', 'Untuk menghafal definisi', 'Untuk mendapat nilai tinggi'],
          ans: 1,
          ex: 'Pembelajaran bertujuan memahami konsep dan menerapkannya, bukan sekadar menghafal.',
        },
        {
          q: 'Aktivitas mana yang paling efektif untuk menguji pemahaman?',
          opts: ['Membaca ulang materi', 'Menonton video', 'Mengerjakan kuis dan game interaktif', 'Mendengarkan penjelasan guru'],
          ans: 2,
          ex: 'Kuis dan game interaktif melatih penerapan konsep secara aktif.',
        },
        {
          q: 'Apa langkah terakhir dalam tahapan pembelajaran modul ini?',
          opts: ['Membaca materi', 'Mengerjakan kuis', 'Refleksi pembelajaran', 'Menutup aplikasi'],
          ans: 2,
          ex: 'Refleksi membantu menginternalisasi pembelajaran untuk pengembangan diri.',
        },
      ],
      variant: 'A',
      compression: { priority: 'high', strategy: 'scroll', splittable: true },
      semantic: { topic: 'Kuis Pemahaman', learningPhase: 'inti', interactionType: 'choose', importance: 0.9 },
    },
  ], 'assessment', '📝 Kuis', 'b');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 7 — REFLEKSI
// Fresh refleksi: 2 pertanyaan + penugasan
// ═══════════════════════════════════════════════════════════════════

function createFreshRefleksiPage(): SchemaCanvaPage {
  return makeFreshPage('Refleksi', 'refleksi', [
    {
      type: 'refleksi',
      id: fbid(),
      title: 'Refleksi Pembelajaran',
      intro: 'Renungkan pertanyaan berikut untuk memperdalam pemahamanmu.',
      questions: [
        { teks: 'Hal baru apa yang kamu pelajari dari modul ini?', petunjuk: 'Tuliskan minimal 2 hal baru yang kamu pelajari.', warna: 'b', icon: '🪞' },
        { teks: 'Bagaimana kamu akan menerapkan pembelajaran ini dalam kehidupan sehari-hari?', petunjuk: 'Ceritakan satu contoh penerapan nyata.', warna: 't', icon: '💭' },
      ],
      penugasan: {
        judul: 'Komitmen Pribadi',
        isi: 'Tulis satu komitmen nyata yang akan kamu lakukan berdasarkan pembelajaran ini.',
        contoh: 'Saya berkomitmen untuk lebih aktif bertanya saat tidak memahami materi.',
      },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Refleksi', learningPhase: 'penutup', interactionType: 'reflect', importance: 0.8 },
    },
  ], 'reflection', '🪞 Refleksi', 't');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 8 — PENUTUP
// Fresh penutup: 2 preview items, clean closing
// ═══════════════════════════════════════════════════════════════════

function createFreshPenutupPage(): SchemaCanvaPage {
  return makeFreshPage('Penutup', 'penutup', [
    {
      type: 'penutup',
      id: fbid(),
      title: 'Penutup',
      subtitle: 'Pembelajaran Selesai',
      preview: [
        { icon: '📚', judul: 'Materi', isi: 'Konsep inti yang telah dipelajari', warna: 't' },
        { icon: '🎯', judul: 'Tujuan', isi: 'Memahami dan menerapkan konsep pembelajaran', warna: 'b' },
      ],
      layout: { position: 'absolute', x: 0, y: 0, width: 'auto', height: 'auto' },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Penutup', learningPhase: 'penutup', importance: 0.7 },
    },
  ], 'summary', '🏁 Penutup', 'a');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ENTRY — createSilseFreshPpknProject
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a fresh PPKn-style project from scratch.
 *
 * This is the V5 fresh template — installed from a clean slate,
 * with no inheritance from any legacy template generator.
 *
 * Returns 8 pages:
 *   1. Cover
 *   2. Petunjuk
 *   3. Tujuan Pembelajaran
 *   4. Materi
 *   5. Aktivitas Sortir (game)
 *   6. Kuis
 *   7. Refleksi
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
  name: 'SILSE Fresh — Modul Pembelajaran',
  description: 'Template fresh V5 — install ulang dari nol. Light cream background, deep teal accent. 8 halaman lengkap: cover, petunjuk, tujuan, materi, game sortir, kuis, refleksi, penutup.',
  icon: '🌱',
  subject: 'PPKn',
  grade: '*',
  semester: '*',
  theme: 'default',
  contractId: 'silse-fresh',
  status: 'active' as const,
  author: 'SILSE',
  version: '1.0.0',
  pageCount: 8,
} as const;
