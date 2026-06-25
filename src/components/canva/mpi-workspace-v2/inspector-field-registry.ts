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
// BATCH-07 INTERACTION-EDITOR-01: Added 'questions' field type for
// editing kuis block questions inline in the V5 inspector. Each
// question has: q (text), opts[] (4 options), ans (index 0-3), ex
// (explanation). The inspector renders an add/remove + per-question
// editor UI for this field type.

export type FieldType = 'text' | 'textarea' | 'icon' | 'color' | 'select' | 'questions';

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

// BATCH-07: Questions field for kuis block.
// The inspector renders an inline editor: add/remove question,
// edit q/opts[4]/ans/ex per question.
const QUESTIONS_FIELD: FieldDefinition = {
  key: 'questions',
  label: 'Pertanyaan Kuis',
  type: 'questions',
  helpText: 'Klik "Tambah Pertanyaan" untuk menambah. Setiap pertanyaan punya 4 opsi (A-D); pilih opsi yang benar.',
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
  fields: [TITLE_FIELD, INTRO_FIELD],
});

// BATCH-07: Kuis block now has questions field (inline editor).
// Title still editable, plus full question bank inline.
registerBlockFields({
  blockType: 'kuis',
  displayName: 'Kuis',
  fields: [TITLE_FIELD, QUESTIONS_FIELD],
});

registerBlockFields({
  blockType: 'sortir-game',
  displayName: 'Game Sortir',
  fields: [TITLE_FIELD],
});

registerBlockFields({
  blockType: 'refleksi',
  displayName: 'Refleksi',
  fields: [TITLE_FIELD, INTRO_FIELD],
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
