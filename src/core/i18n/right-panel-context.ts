// ═══════════════════════════════════════════════════════════════════
// RIGHT PANEL CONTEXT — Teacher-friendly contextual header data
// ═══════════════════════════════════════════════════════════════════
// Sprint R2: Header Konteks Ganda
//
// This helper computes what the right panel header should display:
//   1. Title     — "Edit Kuis", "Edit Materi", "Edit Halaman"
//   2. Subtitle  — "Pilihan Ganda · 4 opsi", "Kotak Definisi"
//   3. Description — "Atur pertanyaan, pilihan jawaban, dan feedback."
//
// WHY A SEPARATE HELPER (not in guided-patch.ts)?
//   - guided-patch.ts is a write-path module (schema editing).
//   - Context computation is a read-only concern (UI display).
//   - teacherTerm() can't handle kebab-case block types.
//   - Keeping it separate avoids bloating guided-patch.ts.
//
// DATA SOURCES:
//   - GuidedEditorSchema.displayName for block name
//   - GuidedEditorSchema.description for description
//   - block runtime data for dynamic subtitle (opts count, tipe)
//   - getTemplateLabel() for page-level context
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock } from '@/core/schema/types';
import { getGuidedEditorSchema } from '@/core/schema/guided-patch';

// ── Types ──────────────────────────────────────────────────────

export interface RightPanelContext {
  /** Primary header line, e.g. "Edit Kuis", "Edit Halaman" */
  title: string;
  /** Contextual subtitle, e.g. "Pilihan Ganda · 4 opsi", "Kotak Definisi" */
  subtitle: string;
  /** Short description of what the teacher can edit here */
  description: string;
}

export interface RightPanelContextOptions {
  /** Selected block type (kebab-case), e.g. 'kuis', 'materi-blok' */
  blockType?: string | null;
  /** The actual block data for dynamic subtitle computation */
  block?: SchemaBlock | null;
  /** Whether teacher mode (sederhana) is active */
  isSederhana: boolean;
  /** Page template type for page-level context, e.g. 'materi', 'kuis' */
  pageTemplateType?: string;
}

// ── Materi-blok tipe labels ────────────────────────────────────

const MATERI_TIPE_LABELS: Record<string, string> = {
  teks: 'Paragraf',
  definisi: 'Kotak Definisi',
  poin: 'Materi Poin',
  checklist: 'Checklist',
  infobox: 'Info Box',
  highlight: 'Highlight',
  kutipan: 'Kutipan',
  gambar: 'Gambar',
};

// ── Block-level descriptions ───────────────────────────────────

const BLOCK_DESCRIPTIONS: Record<string, string> = {
  'kuis': 'Atur pertanyaan, pilihan jawaban, dan feedback.',
  'materi-blok': 'Ubah judul dan isi materi.',
  'def-box': 'Ubah teks definisi dan tampilan.',
  'diskusi': 'Atur pertanyaan untuk diskusi kelompok.',
  'refleksi': 'Atur pertanyaan refleksi dan petunjuk.',
  'cover': 'Ubah judul, subjudul, dan ikon.',
  'tp': 'Atur tujuan pembelajaran per pertemuan.',
  'alur': 'Atur langkah-langkah kegiatan pembelajaran.',
  'atp': 'Atur rencana pertemuan dan tujuan.',
  'nc-grid': 'Atur judul dan isi setiap kartu.',
  'tujuan-display': 'Atur tujuan pembelajaran dan profil.',
  'rangkuman': 'Atur konsep dan penjelasan ringkas.',
  'tab-icons': 'Atur konten per tab.',
  'motivasi': 'Atur pertanyaan pemantik dan koneksi.',
  'petunjuk': 'Atur langkah-langkah petunjuk.',
  'penutup': 'Ubah judul dan subjudul penutup.',
  'cp': 'Atur capaian pembelajaran dan profil pelajar.',
  'materi-section': 'Ubah judul bagian materi.',
};

// ── Block type → friendly short name for subtitle ──────────────

const BLOCK_SUBTITLE_STATIC: Record<string, string> = {
  'kuis': 'Pilihan Ganda',
  'def-box': 'Kotak Definisi',
  'diskusi': 'Diskusi Kelompok',
  'refleksi': 'Refleksi Diri',
  'cover': 'Sampul',
  'tp': 'Tujuan Pembelajaran',
  'alur': 'Alur Kegiatan',
  'atp': 'Alur Tujuan Pembelajaran',
  'nc-grid': 'Kartu Info',
  'tujuan-display': 'Tujuan Pembelajaran',
  'rangkuman': 'Rangkuman',
  'tab-icons': 'Tab Interaktif',
  'motivasi': 'Motivasi / Apersepsi',
  'petunjuk': 'Petunjuk Penggunaan',
  'penutup': 'Penutup',
  'cp': 'Capaian Pembelajaran',
  'materi-section': 'Bagian Materi',
};

// ── Page template type → friendly label ────────────────────────

const TEMPLATE_LABELS: Record<string, string> = {
  cover: 'Halaman Sampul',
  petunjuk: 'Petunjuk',
  dokumen: 'Dokumen CP/TP/ATP',
  tujuan: 'Tujuan Pembelajaran',
  motivasi: 'Motivasi',
  materi: 'Materi Pembelajaran',
  diskusi: 'Diskusi',
  kuis: 'Kuis Interaktif',
  game: 'Game Interaktif',
  hasil: 'Hasil & Apresiasi',
  refleksi: 'Refleksi',
  rangkuman: 'Rangkuman',
  penutup: 'Penutup',
  hero: 'Hero Banner',
  skenario: 'Skenario Interaktif',
  custom: 'Halaman Custom',
};

// ── Helper: compute dynamic subtitle for a block ───────────────

function getBlockSubtitle(blockType: string, block: SchemaBlock | null | undefined): string {
  const b = block as unknown as Record<string, unknown>;

  // materi-blok: subtitle is based on tipe field
  if (blockType === 'materi-blok' && b) {
    const tipe = String(b.tipe ?? '');
    const label = MATERI_TIPE_LABELS[tipe];
    return label || 'Materi';
  }

  // kuis: show number of options in first question
  if (blockType === 'kuis' && b) {
    const questions = b.questions as Array<Record<string, unknown>> | undefined;
    const firstQ = questions?.[0];
    const opts = firstQ?.opts as unknown[] | undefined;
    const optCount = opts?.length ?? 0;
    const base = BLOCK_SUBTITLE_STATIC['kuis'];
    return optCount > 0 ? `${base} · ${optCount} opsi` : base;
  }

  // Static subtitle for other block types
  return BLOCK_SUBTITLE_STATIC[blockType] || '';
}

// ── Main helper ────────────────────────────────────────────────

/**
 * Compute contextual header data for the right panel.
 *
 * In teacher mode, the header displays 3 lines:
 *   1. Title     — "Edit Kuis", "Edit Materi", "Edit Halaman"
 *   2. Subtitle  — "Pilihan Ganda · 4 opsi", "Kotak Definisi"
 *   3. Description — "Atur pertanyaan, pilihan jawaban, dan feedback."
 *
 * In advanced mode, returns "Properties" with empty subtitle/description.
 */
export function getRightPanelContext(options: RightPanelContextOptions): RightPanelContext {
  const { blockType, block, isSederhana, pageTemplateType } = options;

  // Advanced mode: simple "Properties" header (unchanged)
  if (!isSederhana) {
    return { title: 'Properties', subtitle: '', description: '' };
  }

  // No block selected → page-level context
  if (!blockType) {
    const templateLabel = pageTemplateType
      ? (TEMPLATE_LABELS[pageTemplateType] || pageTemplateType)
      : 'Halaman';
    return {
      title: 'Edit Halaman',
      subtitle: templateLabel,
      description: 'Atur background, navigasi, dan pengaturan halaman.',
    };
  }

  // Block selected → compute context
  const guidedSchema = getGuidedEditorSchema(blockType);

  // Title: "Edit {friendly name}"
  // Prefer guidedSchema.displayName (already teacher-friendly),
  // then fall back to blockType with basic cleanup.
  const friendlyName = guidedSchema?.displayName
    ? guidedSchema.displayName.split('/')[0]?.trim() // "Kuis / Evaluasi" → "Kuis"
    : blockType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const title = `Edit ${friendlyName}`;

  // Subtitle: dynamic based on block data
  const subtitle = getBlockSubtitle(blockType, block);

  // Description: from BLOCK_DESCRIPTIONS, then guidedSchema.description, then empty
  const description = BLOCK_DESCRIPTIONS[blockType]
    || guidedSchema?.description
    || '';

  return { title, subtitle, description };
}
