// ═══════════════════════════════════════════════════════════════════
// SILSE STUDIO — Fresh Editable MPI Template (Batch 11C)
// ═══════════════════════════════════════════════════════════════════
// Senior feedback: "bentuk content masih jelek, buat 1 set MPI yang
// bisa di-edit dari nol, jangan remake, jangan sentuh legacy"
//
// This template is INTENTIONALLY MINIMAL in content but MAXIMAL in
// layout polish. Teachers can edit every field inline — the goal is
// "ready-to-fill premium canvas" not "pre-filled generic content".
//
// Design principles (Batch 11C):
//   1. Minimal content: 1-2 short placeholder strings per block
//      (NOT long paragraphs of generic PPKn text)
//   2. Maximum layout: every block uses its premium variant + tight
//      spacing + clean visual hierarchy
//   3. All text inline-editable (teachers click to edit)
//   4. No legacy inheritance (NOT using createPpknNormaGoldenProject)
//   5. contractId = 'silse-fresh' (light cream + deep teal)
//   6. Schema-first, elements = [], pageMode = 'schema'
//   7. 8 pages: cover, petunjuk, tujuan, materi, game, kuis, refleksi, penutup
//
// The visual polish comes from:
//   - Cover variant B (Sinematik) — bottom-anchored, watermark icon
//   - Tujuan: 3 objectives (not 4 — less clutter)
//   - Materi: 1 def-box + 3 nc-grid cards (not 4)
//   - Game: 3 pool + 2 kolom (not 4+4 — tighter)
//   - Kuis: 3 questions (not 5 — easier to edit, less clutter)
//   - Refleksi: 1 question + 1 penugasan (not 2+1)
//   - Penutup: 2 preview items (not 3)
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage, SchemaCanvaPage } from '@/components/canva/types';
import type { ScreenSchema, SchemaBlock } from '@/core/schema/types';
import type { SceneType } from '@/core/edu/education-scene-types';
import { createPage } from '@/store/canva/constants';

// ── Types ──────────────────────────────────────────────────────

export interface SilseStudioMetadata {
  /** Override cover title */
  title?: string;
  /** Override cover subtitle */
  subtitle?: string;
  /** Override guru name */
  guru?: string;
  /** Override sekolah name */
  sekolah?: string;
}

// ── Helpers ────────────────────────────────────────────────────

let _studioIdCounter = 0;
function sbid(): string {
  return `silse-studio-${++_studioIdCounter}`;
}

function makeStudioPage(
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
  // BATCH-11D: Studio uses its OWN contract (silse-studio) — warm sunset
  // palette (orange + amber + rose). Visually DISTINCT from silse-fresh
  // (teal). This is the fix for senior feedback: "Warna sama bentuk sama
  // semua sama dengan legacy apanya yang baru".
  page.contractId = 'silse-studio';

  const schema: ScreenSchema = {
    id: `screen-${sbid()}`,
    templateType,
    blocks,
    sceneType,
    sectionLabel,
    sectionColor,
  };

  page.schema = schema;
  page.elements = [];
  page.pageMode = 'schema';
  return page as SchemaCanvaPage;
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 1 — COVER (variant B "Sinematik" for premium look)
// ═══════════════════════════════════════════════════════════════════

function createStudioCoverPage(meta: SilseStudioMetadata): SchemaCanvaPage {
  return makeStudioPage('Cover', 'cover', [
    {
      type: 'cover',
      id: sbid(),
      icon: '✨',
      title: meta.title || 'Judul Media Pembelajaran',
      subtitle: meta.subtitle || 'Klik untuk edit subtitle',
      badges: [
        { icon: '🏫', text: meta.sekolah || 'Nama Sekolah', color: 'o' },
        { icon: '👨\u200d🏫', text: meta.guru || 'Nama Guru', color: 'a' },
      ],
      meta: {
        durasi: '2 × 40 menit',
        fase: 'D',
        elemen: 'Pembelajaran',
      },
      cta: { label: 'Mulai Belajar', action: 'next' },
      layout: { position: 'absolute', x: 0, y: 0, width: 'auto', height: 'auto' },
      variant: 'B',  // Sinematik — bottom-anchored, watermark icon, premium feel
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Media Pembelajaran', learningPhase: 'pendahuluan', importance: 1.0 },
    },
  ], 'intro', '✨ Cover', 'o');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 2 — PETUNJUK (3 short items — minimal, not 4)
// ═══════════════════════════════════════════════════════════════════

function createStudioPetunjukPage(): SchemaCanvaPage {
  return makeStudioPage('Petunjuk', 'petunjuk', [
    {
      type: 'petunjuk',
      id: sbid(),
      title: 'Petunjuk',
      titleHighlight: 'Penggunaan',
      items: [
        { icon: '📖', title: 'Pelajari', body: 'Baca materi di setiap halaman.' },
        { icon: '🎮', title: 'Coba', body: 'Selesaikan aktivitas interaktif.' },
        { icon: '🪞', title: 'Refleksi', body: 'Renungkan pertanyaan akhir.' },
      ],
      tips: 'Gunakan tombol navigasi di bawah untuk berpindah halaman.',
      tipsColor: 'o',
      variant: 'A',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'pendahuluan', interactionType: 'read' },
    },
  ], 'intro', '📌 Petunjuk', 'a');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 3 — TUJUAN (3 objectives — not 4, less clutter)
// ═══════════════════════════════════════════════════════════════════

function createStudioTujuanPage(): SchemaCanvaPage {
  return makeStudioPage('Tujuan Pembelajaran', 'tujuan', [
    {
      type: 'tujuan-display',
      id: sbid(),
      title: 'Tujuan Pembelajaran',
      bsnpRequired: true,
      objectives: [
        { icon: '🎯', text: 'Memahami konsep utama yang dipelajari', color: 'o' },
        { icon: '🎯', text: 'Menerapkan konsep melalui aktivitas interaktif', color: 'a' },
        { icon: '🎯', text: 'Merefleksikan pembelajaran untuk pengembangan diri', color: 'r' },
      ],
      profil: 'Bernalar Kritis, Kreatif, Mandiri',
      profilColor: 'o',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { bsnpRelevant: true, topic: 'Tujuan Pembelajaran', learningPhase: 'pendahuluan', importance: 0.9 },
    },
  ], 'intro', '🎯 Tujuan', 'a');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 4 — MATERI (1 def-box + 3 nc-grid cards — tighter)
// ═══════════════════════════════════════════════════════════════════

function createStudioMateriPage(): SchemaCanvaPage {
  return makeStudioPage('Materi Pembelajaran', 'materi', [
    {
      type: 'def-box',
      id: sbid(),
      borderColor: 'o',
      content: '<strong>Konsep Utama.</strong> Klik untuk edit penjelasan singkat tentang konsep yang akan dipelajari.',
      compression: { priority: 'high', strategy: 'accordion' },
      semantic: { learningPhase: 'inti', interactionType: 'read' },
    },
    {
      type: 'nc-grid',
      id: sbid(),
      cards: [
        { icon: '💡', title: 'Poin Pertama', body: 'Klik untuk edit. Jelaskan poin utama pertama.', color: 'o' },
        { icon: '🔍', title: 'Poin Kedua', body: 'Klik untuk edit. Jelaskan poin utama kedua.', color: 'a' },
        { icon: '📊', title: 'Poin Ketiga', body: 'Klik untuk edit. Jelaskan poin utama ketiga.', color: 'r' },
      ],
      compression: { priority: 'medium', strategy: 'scroll' },
      semantic: { learningPhase: 'inti', interactionType: 'read' },
    },
  ], 'concept', '📖 Materi', 'o');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 5 — GAME SORTIR (3 pool + 2 kolom — tighter)
// ═══════════════════════════════════════════════════════════════════

function createStudioGamePage(): SchemaCanvaPage {
  return makeStudioPage('Aktivitas Sortir', 'game', [
    {
      type: 'sortir-game',
      id: sbid(),
      title: 'Aktivitas Sortir',
      pool: [
        { id: 'sp1', text: 'Item Pertama', category: 'sk1' },
        { id: 'sp2', text: 'Item Kedua', category: 'sk1' },
        { id: 'sp3', text: 'Item Ketiga', category: 'sk2' },
      ],
      kolom: [
        { id: 'sk1', label: 'Kolom A', color: 'o' },
        { id: 'sk2', label: 'Kolom B', color: 'r' },
      ],
      accentColor: 'r',
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { learningPhase: 'inti', interactionType: 'drag', importance: 0.85 },
    },
  ], 'assessment', '🎮 Aktivitas', 'r');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 6 — KUIS (3 questions — easier to edit, less clutter)
// ═══════════════════════════════════════════════════════════════════

function createStudioKuisPage(): SchemaCanvaPage {
  return makeStudioPage('Kuis', 'kuis', [
    {
      type: 'kuis',
      id: sbid(),
      title: 'Kuis Pemahaman',
      questions: [
        {
          q: 'Pertanyaan pertama — klik untuk edit?',
          opts: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
          ans: 0,
          ex: 'Penjelasan jawaban benar — klik untuk edit.',
        },
        {
          q: 'Pertanyaan kedua — klik untuk edit?',
          opts: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
          ans: 1,
          ex: 'Penjelasan jawaban benar — klik untuk edit.',
        },
        {
          q: 'Pertanyaan ketiga — klik untuk edit?',
          opts: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
          ans: 2,
          ex: 'Penjelasan jawaban benar — klik untuk edit.',
        },
      ],
      variant: 'A',
      compression: { priority: 'high', strategy: 'scroll', splittable: true },
      semantic: { topic: 'Kuis Pemahaman', learningPhase: 'inti', interactionType: 'choose', importance: 0.9 },
    },
  ], 'assessment', '📝 Kuis', 'a');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 7 — REFLEKSI (1 question + 1 penugasan — minimal)
// ═══════════════════════════════════════════════════════════════════

function createStudioRefleksiPage(): SchemaCanvaPage {
  return makeStudioPage('Refleksi', 'refleksi', [
    {
      type: 'refleksi',
      id: sbid(),
      title: 'Refleksi Pembelajaran',
      intro: 'Renungkan pertanyaan berikut.',
      questions: [
        { teks: 'Hal baru apa yang kamu pelajari?', petunjuk: 'Tuliskan 2 hal baru.', warna: 'a', icon: '🪞' },
      ],
      penugasan: {
        judul: 'Komitmen Pribadi',
        isi: 'Tulis satu komitmen yang akan kamu lakukan.',
        contoh: 'Contoh: Saya berkomitmen untuk lebih aktif bertanya.',
      },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Refleksi', learningPhase: 'penutup', interactionType: 'reflect', importance: 0.8 },
    },
  ], 'reflection', '🪞 Refleksi', 'o');
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 8 — PENUTUP (2 preview items — not 3)
// ═══════════════════════════════════════════════════════════════════

function createStudioPenutupPage(): SchemaCanvaPage {
  return makeStudioPage('Penutup', 'penutup', [
    {
      type: 'penutup',
      id: sbid(),
      title: 'Penutup',
      subtitle: 'Pembelajaran Selesai',
      preview: [
        { icon: '📚', judul: 'Materi', isi: 'Konsep utama yang telah dipelajari', warna: 'o' },
        { icon: '🎯', judul: 'Tujuan', isi: 'Memahami dan menerapkan konsep', warna: 'a' },
      ],
      layout: { position: 'absolute', x: 0, y: 0, width: 'auto', height: 'auto' },
      variant: 'A',
      compression: { priority: 'high', strategy: 'none' },
      semantic: { topic: 'Penutup', learningPhase: 'penutup', importance: 0.7 },
    },
  ], 'summary', '🏁 Penutup', 'r');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ENTRY — createSilseStudioProject
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a fresh "SILSE Studio" project — minimal content, premium layout.
 *
 * Senior feedback Batch 11C: "bentuk content masih jelek, buat 1 set
 * MPI yang bisa di-edit dari nol". This template is INTENTIONALLY
 * minimal — every field is a short placeholder that teachers can
 * click to edit inline. The visual polish comes from:
 *   - Cover variant B (Sinematik — bottom-anchored, watermark icon)
 *   - 3 objectives (not 4), 3 cards (not 4), 3 pool items (not 4)
 *   - 3 quiz questions (not 5), 1 refleksi question (not 2)
 *   - 2 penutup preview items (not 3)
 *
 * Returns 8 pages:
 *   1. Cover (variant B — premium Sinematik)
 *   2. Petunjuk (3 short items)
 *   3. Tujuan (3 objectives)
 *   4. Materi (1 def-box + 3 cards)
 *   5. Game Sortir (3 pool + 2 kolom)
 *   6. Kuis (3 questions)
 *   7. Refleksi (1 question + 1 penugasan)
 *   8. Penutup (2 preview items)
 */
export function createSilseStudioProject(metadata: SilseStudioMetadata = {}): CanvaPage[] {
  _studioIdCounter = 0;

  return [
    createStudioCoverPage(metadata),
    createStudioPetunjukPage(),
    createStudioTujuanPage(),
    createStudioMateriPage(),
    createStudioGamePage(),
    createStudioKuisPage(),
    createStudioRefleksiPage(),
    createStudioPenutupPage(),
  ];
}

// ═══════════════════════════════════════════════════════════════════
// STUDIO TEMPLATE METADATA
// ═══════════════════════════════════════════════════════════════════

export const SILSE_STUDIO_TEMPLATE_META = {
  id: 'silse-studio',
  name: 'SILSE Studio — Media Siap Edit',
  description: 'Template kosong premium dengan layout rapi + palet Warm Sunset (orange + cream). Klik setiap teks untuk edit langsung. 8 halaman: cover, petunjuk, tujuan, materi, game, kuis, refleksi, penutup. Tanpa konten panjang — siap diisi guru.',
  icon: '🎨',
  subject: '*',
  grade: '*',
  semester: '*',
  theme: 'default',
  contractId: 'silse-studio',  // BATCH-11D: warm sunset palette (orange + amber + rose)
  status: 'active' as const,
  author: 'SILSE',
  version: '1.1.0',  // Bumped in 11D — new contract with distinct palette
  pageCount: 8,
} as const;
