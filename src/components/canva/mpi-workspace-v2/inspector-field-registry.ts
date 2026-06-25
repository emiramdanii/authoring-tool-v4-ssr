// ═══════════════════════════════════════════════════════════════
// INSPECTOR FIELD REGISTRY — Schema-driven field definitions
// ═══════════════════════════════════════════════════════════════
// V3-PHASE-1: Replaces hardcoded HAS_TITLE/HAS_SUBTITLE/HAS_CONTENT
// with a registry-driven approach. Each block type declares which
// fields are editable in the inspector.
//
// New block types just register their fields here — no need to
// modify the Inspector component.
//
// BATCH-07A INTERACTION-EDITOR-01: Added 'questions' field type for
// editing kuis block questions inline in the V5 inspector.
//
// BATCH-07B INTERACTION-EDITOR-CLOSEOUT: Added 3 more field types:
//   - 'sortItems' for sortir-game (pool + kolom editor)
//   - 'discussionQuestions' for diskusi (label/icon/teks/petunjuk)
//   - 'reflectionQuestions' for refleksi (teks/petunjuk/warna/icon)
// Each has its own editor component because the question shapes
// differ between block types (kuis has opts/ans/ex, diskusi has
// label/icon, refleksi has warna/icon).

export type FieldType =
  | 'text'
  | 'textarea'
  | 'icon'
  | 'color'
  | 'select'
  | 'questions'               // BATCH-07A: kuis
  | 'sortItems'               // BATCH-07B: sortir-game
  | 'discussionQuestions'     // BATCH-07B: diskusi
  | 'reflectionQuestions';    // BATCH-07B: refleksi

export interface FieldDefinition {
  /** Schema field key (e.g., 'title', 'subtitle', 'content', 'icon') */
  key: string;
  /** Display label in Indonesian */
  label: string;
  /** Field type */
  type: FieldType;
  /** Placeholder text */
  placeholder?: string;
  /** Help text shown below the field */
  helpText?: string;
}

export interface BlockFieldConfig {
  /** Block type (e.g., 'cover', 'materi-section', 'kuis') */
  blockType: string;
  /** Friendly name for display */
  displayName: string;
  /** Editable fields */
  fields: FieldDefinition[];
}

// ── Registry ──────────────────────────────────────────────────

const REGISTRY: Map<string, BlockFieldConfig> = new Map();

export function registerBlockFields(config: BlockFieldConfig): void {
  REGISTRY.set(config.blockType, config);
}

export function getBlockFields(blockType: string): BlockFieldConfig | null {
  return REGISTRY.get(blockType) ?? null;
}

export function getAllRegisteredBlockTypes(): string[] {
  return Array.from(REGISTRY.keys());
}

// ── Common field definitions ──────────────────────────────────

const TITLE_FIELD: FieldDefinition = {
  key: 'title',
  label: 'Judul',
  type: 'text',
  placeholder: 'Judul bagian',
};

const SUBTITLE_FIELD: FieldDefinition = {
  key: 'subtitle',
  label: 'Subjudul',
  type: 'text',
  placeholder: 'Subjudul',
};

const ICON_FIELD: FieldDefinition = {
  key: 'icon',
  label: 'Ikon',
  type: 'icon',
  placeholder: '📄',
  helpText: 'Emoji atau teks singkat',
};

const CONTENT_FIELD: FieldDefinition = {
  key: 'content',
  label: 'Konten',
  type: 'textarea',
  placeholder: 'Isi konten',
};

const INTRO_FIELD: FieldDefinition = {
  key: 'intro',
  label: 'Pengantar',
  type: 'textarea',
  placeholder: 'Teks pengantar',
};

const HOOK_QUESTION_FIELD: FieldDefinition = {
  key: 'hookQuestion',
  label: 'Pertanyaan Pemicu',
  type: 'textarea',
  placeholder: 'Pertanyaan yang memicu rasa ingin tahu',
};

// BATCH-07A: Questions field for kuis block.
// The inspector renders an inline editor: add/remove question,
// edit q/opts[4]/ans/ex per question.
const QUESTIONS_FIELD: FieldDefinition = {
  key: 'questions',
  label: 'Pertanyaan Kuis',
  type: 'questions',
  helpText: 'Klik "Tambah Pertanyaan" untuk menambah. Setiap pertanyaan punya 4 opsi (A-D); pilih opsi yang benar.',
};

// BATCH-07B: Sort items field for sortir-game block.
// Editor: kolom (categories) + pool (items with category assignment).
// Each item is sorted to its category at runtime.
const SORT_ITEMS_FIELD: FieldDefinition = {
  key: 'sortItems',
  label: 'Item & Kategori Sortir',
  type: 'sortItems',
  helpText: 'Tambah kategori (kolom) lalu tambah item. Setiap item punya teks dan kategori tujuan. Siswa menyortir item ke kategori yang benar.',
};

// BATCH-07B: Discussion questions field for diskusi block.
// Editor: questions with label/icon/teks/petunjuk.
const DISCUSSION_QUESTIONS_FIELD: FieldDefinition = {
  key: 'questions',
  label: 'Pertanyaan Diskusi',
  type: 'discussionQuestions',
  helpText: 'Setiap pertanyaan punya label (A/B/C), ikon, teks, dan petunjuk untuk siswa.',
};

// BATCH-07B: Reflection questions field for refleksi block.
// Editor: questions with teks/petunjuk/warna/icon.
const REFLECTION_QUESTIONS_FIELD: FieldDefinition = {
  key: 'questions',
  label: 'Pertanyaan Refleksi',
  type: 'reflectionQuestions',
  helpText: 'Setiap pertanyaan punya teks, petunjuk, warna (token: y/c/g/p/o/r), dan ikon.',
};

// ── Block registrations ───────────────────────────────────────

registerBlockFields({
  blockType: 'cover',
  displayName: 'Cover',
  fields: [ICON_FIELD, TITLE_FIELD, SUBTITLE_FIELD],
});

registerBlockFields({
  blockType: 'hero',
  displayName: 'Hero',
  fields: [ICON_FIELD, TITLE_FIELD, SUBTITLE_FIELD],
});

registerBlockFields({
  blockType: 'petunjuk',
  displayName: 'Petunjuk',
  fields: [ICON_FIELD, TITLE_FIELD],
});

registerBlockFields({
  blockType: 'tujuan-display',
  displayName: 'Tujuan Pembelajaran',
  fields: [TITLE_FIELD],
});

registerBlockFields({
  blockType: 'motivasi',
  displayName: 'Motivasi',
  fields: [TITLE_FIELD, HOOK_QUESTION_FIELD],
});

registerBlockFields({
  blockType: 'materi-section',
  displayName: 'Bagian Materi',
  fields: [ICON_FIELD, TITLE_FIELD, SUBTITLE_FIELD],
});

registerBlockFields({
  blockType: 'def-box',
  displayName: 'Definisi',
  fields: [CONTENT_FIELD],
});

registerBlockFields({
  blockType: 'materi-blok',
  displayName: 'Materi',
  fields: [ICON_FIELD, TITLE_FIELD, CONTENT_FIELD],
});

registerBlockFields({
  blockType: 'diskusi',
  displayName: 'Diskusi',
  fields: [TITLE_FIELD, INTRO_FIELD, DISCUSSION_QUESTIONS_FIELD],
});

// BATCH-07A: Kuis block now has questions field (inline editor).
// Title still editable, plus full question bank inline.
registerBlockFields({
  blockType: 'kuis',
  displayName: 'Kuis',
  fields: [TITLE_FIELD, QUESTIONS_FIELD],
});

// BATCH-07B: Sortir game block now has sortItems field (pool + kolom).
registerBlockFields({
  blockType: 'sortir-game',
  displayName: 'Game Sortir',
  fields: [TITLE_FIELD, SORT_ITEMS_FIELD],
});

registerBlockFields({
  blockType: 'refleksi',
  displayName: 'Refleksi',
  fields: [TITLE_FIELD, INTRO_FIELD, REFLECTION_QUESTIONS_FIELD],
});

registerBlockFields({
  blockType: 'rangkuman',
  displayName: 'Rangkuman',
  fields: [TITLE_FIELD],
});

registerBlockFields({
  blockType: 'penutup',
  displayName: 'Penutup',
  fields: [TITLE_FIELD],
});

registerBlockFields({
  blockType: 'tabel-accord',
  displayName: 'Tabel Akordion',
  fields: [TITLE_FIELD],
});

registerBlockFields({
  blockType: 'hasil',
  displayName: 'Hasil',
  fields: [TITLE_FIELD],
});

// Fallback for unregistered block types
export const FALLBACK_FIELDS: BlockFieldConfig = {
  blockType: '_fallback',
  displayName: 'Bagian',
  fields: [TITLE_FIELD],
};
