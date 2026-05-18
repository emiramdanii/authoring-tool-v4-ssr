// ═══════════════════════════════════════════════════════════════════
// PROPERTY SCHEMAS — Per-block-type editable property definitions
// ═══════════════════════════════════════════════════════════════════
// Each block type defines its propertySchema, which drives:
//   1. Dynamic property panel — auto-generate form from schema
//   2. Type-aware editing — each block shows only relevant fields
//   3. AI editing — AI knows what properties to modify
//   4. Auto form generation — scalable without manual switch statements
//
// This replaces the giant switch statement in BlockTypeEditor.
// Adding a new block type = add its propertySchema here. No UI code change.
//
// ═══════════════════════════════════════════════════════════════════
// FASE 2: Single Source of Truth
// ═══════════════════════════════════════════════════════════════════
// Property schemas are DEFINED here but the SINGLE SOURCE OF TRUTH
// for looking them up is SCENE_REGISTRY in SceneRegistry.tsx.
//
// Each named schema (COVER_PROPERTY_SCHEMA, etc.) is imported by
// SceneRegistry and attached to its BlockDefinition.propertySchema.
//
// To look up a property schema, use:
//   getBlockPropertySchema(blockType) from '@/core/registry/SceneRegistry'
//
// The old PROPERTY_SCHEMAS record and getPropertySchema() function
// have been REMOVED to eliminate the dual-source drift risk.
// ═══════════════════════════════════════════════════════════════════

import type { PropertySchema } from './types';

// ═══════════════════════════════════════════════════════════════════
// BLOCK PROPERTY SCHEMAS
// ═══════════════════════════════════════════════════════════════════

export const COVER_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'cover',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'badges', label: 'Badge', icon: 'Award' },
    { key: 'cta', label: 'CTA', icon: 'MousePointerClick', collapsed: true },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'icon', type: 'icon', label: 'Icon', group: 'content', placeholder: '🏠' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    { key: 'subtitle', type: 'textarea', label: 'Subjudul', group: 'content', rows: 3 },
    {
      key: 'badges', type: 'array', label: 'Badge', group: 'badges',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '🏫' },
        { key: 'text', label: 'Teks', type: 'text' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'y' },
    { key: 'cta.label', type: 'text', label: 'CTA Label', group: 'cta', placeholder: 'Mulai →' },
    { key: 'meta.durasi', type: 'text', label: 'Durasi', group: 'content', placeholder: '2 x 45 menit' },
  ],
};

/** Hero uses the same data model as Cover but with its own blockType discriminator */
export const HERO_PROPERTY_SCHEMA: PropertySchema = {
  ...COVER_PROPERTY_SCHEMA,
  blockType: 'hero',
};

export const PETUNJUK_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'petunjuk',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'navigation', label: 'Navigasi', icon: 'Compass', collapsed: true },
    { key: 'objectives', label: 'Tujuan Pembelajaran', icon: 'Target', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    { key: 'titleHighlight', type: 'text', label: 'Highlight', group: 'content' },
    {
      key: 'items', type: 'array', label: 'Item Petunjuk', group: 'content',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '📌' },
        { key: 'title', label: 'Judul', type: 'text' },
        { key: 'body', label: 'Deskripsi', type: 'textarea' },
      ],
    },
    { key: 'tips', type: 'textarea', label: 'Tips', group: 'content', rows: 3 },
    {
      key: 'navigation', type: 'array', label: 'Navigasi', group: 'navigation',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '🔄' },
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'description', label: 'Deskripsi', type: 'textarea' },
      ],
    },
    {
      key: 'learningObjectives', type: 'array', label: 'Tujuan', group: 'objectives',
      fields: [
        { key: 'text', label: 'Tujuan', type: 'textarea' },
      ],
    },
  ],
};

export const TP_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'tp',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
    { key: 'title', type: 'text', label: 'Judul', required: true },
    { key: 'titleHighlight', type: 'text', label: 'Highlight' },
    {
      key: 'items', type: 'array', label: 'Tujuan',
      fields: [
        { key: 'verb', label: 'Kata Kerja', type: 'text' },
        { key: 'desc', label: 'Deskripsi', type: 'textarea' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
    { key: 'profil', type: 'text', label: 'Profil' },
  ],
};

export const ALUR_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'alur',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
    { key: 'title', type: 'text', label: 'Judul', required: true },
    { key: 'totalDurasi', type: 'text', label: 'Total Durasi' },
    {
      key: 'steps', type: 'array', label: 'Langkah',
      fields: [
        { key: 'judul', label: 'Judul', type: 'text' },
        { key: 'deskripsi', label: 'Deskripsi', type: 'textarea' },
        { key: 'durasi', label: 'Durasi', type: 'text' },
      ],
    },
  ],
};

export const SKENARIO_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'skenario',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'chapters', label: 'Chapter', icon: 'BookOpen' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    {
      key: 'chapters', type: 'array', label: 'Chapter', group: 'chapters',
      fields: [
        { key: 'charEmoji', label: 'Karakter', type: 'icon', placeholder: '🎭' },
        { key: 'title', label: 'Judul Chapter', type: 'text' },
        { key: 'choicePrompt', label: 'Prompt Pilihan', type: 'textarea' },
      ],
    },
  ],
};

export const DEFBOX_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'def-box',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'style', label: 'Gaya', icon: 'Palette' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'content', type: 'textarea', label: 'Konten', group: 'content', rows: 4 },
    { key: 'borderColor', type: 'color', label: 'Border Warna', group: 'style', defaultValue: 'y' },
  ],
};

export const NCGRID_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'nc-grid',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    {
      key: 'cards', type: 'array', label: 'Kartu', group: 'content',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '📋' },
        { key: 'title', label: 'Judul', type: 'text' },
        { key: 'body', label: 'Isi', type: 'textarea' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
  ],
};

export const FLASHCARD_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'flashcard-set',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    {
      key: 'cards', type: 'array', label: 'Kartu Kilat', group: 'content',
      fields: [
        { key: 'q', label: 'Pertanyaan', type: 'textarea' },
        { key: 'a', label: 'Jawaban', type: 'textarea' },
      ],
    },
  ],
};

export const FTAB_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'ftab',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'tabs', label: 'Tab', icon: 'Columns' },
  { key: 'options', label: 'Opsi', icon: 'Settings', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    {
      key: 'tabs', type: 'array', label: 'Tab', group: 'tabs',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '📑' },
        { key: 'label', label: 'Label Tab', type: 'text' },
      ],
    },
    { key: 'showReadMarker', type: 'boolean', label: 'Read Marker', group: 'options', defaultValue: false },
    { key: 'showProgress', type: 'boolean', label: 'Progress Bar', group: 'options', defaultValue: false },
  ],
};

export const NKCARD_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'nk-card',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'detail', label: 'Detail', icon: 'FileText', collapsed: true },
    { key: 'sanksi', label: 'Sanksi', icon: 'ShieldAlert', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'normaType', type: 'select', label: 'Jenis Norma', group: 'content',
      options: [
        { label: 'Norma Agama', value: 'agama' },
        { label: 'Norma Kesopanan', value: 'kesopanan' },
        { label: 'Norma Kesusilaan', value: 'kesusilaan' },
        { label: 'Norma Hukum', value: 'hukum' },
      ],
    },
    { key: 'icon', type: 'icon', label: 'Icon', group: 'content', placeholder: '📜' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    { key: 'label', type: 'text', label: 'Label', group: 'content' },
    { key: 'definition', type: 'textarea', label: 'Definisi', group: 'content', rows: 4 },
    {
      key: 'characteristics', type: 'array', label: 'Karakteristik', group: 'detail',
      fields: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'value', label: 'Nilai', type: 'textarea' },
      ],
    },
    { key: 'contoh', type: 'textarea', label: 'Contoh', group: 'detail', rows: 3 },
    { key: 'sanksi.title', type: 'text', label: 'Judul Sanksi', group: 'sanksi', defaultValue: 'Sanksi' },
    {
      key: 'sanksi.items', type: 'array', label: 'Item Sanksi', group: 'sanksi',
      fields: [
        { key: 'dot', label: 'Warna', type: 'color' },
        { key: 'text', label: 'Teks', type: 'textarea' },
      ],
    },
  ],
};

export const DISKUSI_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'diskusi',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'kelompok', label: 'Kelompok', icon: 'Users', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    { key: 'intro', type: 'textarea', label: 'Intro', group: 'content', rows: 3 },
    {
      key: 'questions', type: 'array', label: 'Pertanyaan', group: 'content',
      fields: [
        { key: 'teks', label: 'Pertanyaan', type: 'textarea' },
        { key: 'petunjuk', label: 'Petunjuk', type: 'text' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
    {
      key: 'kelompok', type: 'array', label: 'Kelompok Diskusi', group: 'kelompok',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '👥' },
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'judul', label: 'Judul', type: 'text' },
        { key: 'isi', label: 'Isi', type: 'textarea' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
  ],
};

export const KUIS_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'kuis',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'questions', label: 'Pertanyaan', icon: 'HelpCircle' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    {
      key: 'questions', type: 'array', label: 'Pertanyaan', group: 'questions',
      fields: [
        { key: 'q', label: 'Pertanyaan', type: 'textarea' },
        { key: 'opts', label: 'Pilihan (JSON)', type: 'json', helpText: 'Array string, contoh: ["A","B","C"]' },
        { key: 'ans', label: 'Jawaban (index)', type: 'number', min: 0 },
        { key: 'ex', label: 'Penjelasan', type: 'textarea' },
      ],
    },
  ],
};

export const SORTIRGAME_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'sortir-game',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'pool', label: 'Kartu', icon: 'Layers' },
    { key: 'kolom', label: 'Kolom', icon: 'Columns' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    {
      key: 'pool', type: 'array', label: 'Kartu Sortir', group: 'pool',
      fields: [
        { key: 'text', label: 'Teks Kartu', type: 'text' },
        { key: 'category', label: 'Kategori', type: 'text', helpText: 'ID kolom tujuan' },
      ],
    },
    {
      key: 'kolom', type: 'array', label: 'Kolom', group: 'kolom',
      fields: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
  ],
};

export const RODAGAME_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'roda-game',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'questions', label: 'Pertanyaan', icon: 'HelpCircle' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    {
      key: 'questions', type: 'array', label: 'Pertanyaan', group: 'questions',
      fields: [
        { key: 'q', label: 'Pertanyaan', type: 'textarea' },
        { key: 'diskusiHint', label: 'Hint Diskusi', type: 'text' },
        {
          key: 'opts', label: 'Pilihan Jawaban', type: 'array',
          fields: [
            { key: 'text', label: 'Teks Jawaban', type: 'text' },
            { key: 'correct', label: 'Jawaban Benar', type: 'boolean' },
          ],
        },
        { key: 'feedbackCorrect', label: 'Feedback Benar', type: 'text' },
        { key: 'feedbackWrong', label: 'Feedback Salah', type: 'text' },
      ],
    },
  ],
};

export const HASIL_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'hasil',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    { key: 'subtitle', type: 'text', label: 'Subjudul', group: 'content' },
  ],
};

export const REFLEKSI_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'refleksi',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'penugasan', label: 'Penugasan', icon: 'ClipboardList', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    { key: 'intro', type: 'textarea', label: 'Intro', group: 'content', rows: 3 },
    {
      key: 'questions', type: 'array', label: 'Refleksi', group: 'content',
      fields: [
        { key: 'teks', label: 'Pertanyaan', type: 'textarea' },
        { key: 'petunjuk', label: 'Petunjuk', type: 'text' },
      ],
    },
    { key: 'penugasan.judul', type: 'text', label: 'Judul Penugasan', group: 'penugasan' },
    { key: 'penugasan.isi', type: 'textarea', label: 'Isi Penugasan', group: 'penugasan', rows: 3 },
  ],
};

export const PENUTUP_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'penutup',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'preview', label: 'Preview', icon: 'Eye', collapsed: true },
    { key: 'nextPertemuan', label: 'Pertemuan Berikutnya', icon: 'Calendar', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    { key: 'subtitle', type: 'text', label: 'Subjudul', group: 'content' },
    {
      key: 'preview', type: 'array', label: 'Preview Pertemuan', group: 'preview',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '📖' },
        { key: 'judul', label: 'Judul', type: 'text' },
        { key: 'isi', label: 'Isi', type: 'textarea' },
        { key: 'warna', label: 'Warna', type: 'color' },
      ],
    },
    { key: 'nextPertemuan.judul', type: 'text', label: 'Judul Pertemuan', group: 'nextPertemuan' },
    { key: 'nextPertemuan.deskripsi', type: 'textarea', label: 'Deskripsi', group: 'nextPertemuan', rows: 2 },
  ],
};

export const MATERISECTION_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'materi-section',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'takeaways', label: 'Poin Penting', icon: 'Star', collapsed: true },
    { key: 'selfcheck', label: 'Evaluasi Diri', icon: 'Brain', collapsed: true },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'icon', type: 'icon', label: 'Icon', group: 'content', placeholder: '📚' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    { key: 'subtitle', type: 'text', label: 'Subjudul', group: 'content' },
    { key: 'bsnpRequired', type: 'boolean', label: 'WAJIB BSNP', group: 'style', defaultValue: false },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'c' },
    {
      key: 'takeaways', type: 'array', label: 'Poin Penting', group: 'takeaways',
      fields: [
        { key: 'text', label: 'Poin', type: 'textarea' },
      ],
    },
    { key: 'selfCheck', type: 'textarea', label: 'Evaluasi Diri', group: 'selfcheck', rows: 3 },
  ],
};

export const TABELACCORD_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'tabel-accord',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    {
      key: 'rows', type: 'array', label: 'Baris', group: 'content',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '📊' },
        { key: 'title', label: 'Judul', type: 'text' },
        { key: 'color', label: 'Warna', type: 'color' },
        {
          key: 'details', label: 'Detail', type: 'json',
          helpText: 'Array {label, value}, contoh: [{"label":"Asal","value":"Jawa"}]',
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// BSNP TEMPLATE BLOCK PROPERTY SCHEMAS (Phase 4+)
// ═══════════════════════════════════════════════════════════════════

export const TUJUANDISPLAY_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'tujuan-display',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'objectives', label: 'Tujuan', icon: 'Target' },
    { key: 'profil', label: 'Profil', icon: 'Link', collapsed: true },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    { key: 'subtitle', type: 'text', label: 'Subjudul', group: 'content' },
    { key: 'bsnpRequired', type: 'boolean', label: 'WAJIB BSNP', group: 'style', defaultValue: true },
    {
      key: 'objectives', type: 'array', label: 'Tujuan Pembelajaran', group: 'objectives',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '🎯' },
        { key: 'text', label: 'Tujuan', type: 'textarea' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
    { key: 'profil', type: 'textarea', label: 'Profil Pelajar Pancasila', group: 'profil', rows: 3 },
    { key: 'profilColor', type: 'color', label: 'Warna Profil', group: 'profil', defaultValue: 'g' },
  ],
};

export const MOTIVASI_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'motivasi',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'connections', label: 'Koneksi', icon: 'Link' },
    { key: 'visual', label: 'Visual', icon: 'Image', collapsed: true },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    { key: 'bsnpRequired', type: 'boolean', label: 'WAJIB BSNP', group: 'style', defaultValue: false },
    { key: 'hookQuestion', type: 'textarea', label: 'Pertanyaan Pemicu', group: 'content', rows: 3, required: true },
    { key: 'visual.emoji', type: 'icon', label: 'Emoji Visual', group: 'visual', placeholder: '🤔' },
    {
      key: 'connections', type: 'array', label: 'Koneksi Pengetahuan', group: 'connections',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '💡' },
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'description', label: 'Deskripsi', type: 'textarea' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
    { key: 'transition', type: 'textarea', label: 'Transisi ke Materi', group: 'content', rows: 2 },
  ],
};

export const RANGKUMAN_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'rangkuman',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'concepts', label: 'Konsep', icon: 'Lightbulb' },
    { key: 'closing', label: 'Penutup', icon: 'CheckCircle', collapsed: true },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    { key: 'bsnpRequired', type: 'boolean', label: 'WAJIB BSNP', group: 'style', defaultValue: false },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'c' },
    {
      key: 'concepts', type: 'array', label: 'Konsep Kunci', group: 'concepts',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '📌' },
        { key: 'title', label: 'Judul', type: 'text' },
        { key: 'body', label: 'Isi', type: 'textarea' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
    { key: 'closingStatement', type: 'textarea', label: 'Pernyataan Penutup', group: 'closing', rows: 3 },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// NEW GAME BLOCK PROPERTY SCHEMAS (Phase 5)
// ═══════════════════════════════════════════════════════════════════

export const MEMORYGAME_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'memory-game',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'pairs', label: 'Pasangan', icon: 'Layers' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    {
      key: 'pairs', type: 'array', label: 'Pasangan Kartu', group: 'pairs',
      fields: [
        { key: 'left', label: 'Kartu Kiri', type: 'text' },
        { key: 'right', label: 'Kartu Kanan', type: 'text' },
      ],
    },
  ],
};

export const MATCHINGGAME_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'matching-game',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'pairs', label: 'Pasangan', icon: 'Layers' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    {
      key: 'pairs', type: 'array', label: 'Pasangan', group: 'pairs',
      fields: [
        { key: 'left', label: 'Kolom Kiri', type: 'text' },
        { key: 'right', label: 'Kolom Kanan', type: 'text' },
      ],
    },
  ],
};

export const FILLBLANKGAME_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'fill-blank-game',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'questions', label: 'Soal', icon: 'HelpCircle' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    {
      key: 'questions', type: 'array', label: 'Soal Isian', group: 'questions',
      fields: [
        { key: 'text', label: 'Teks Soal', type: 'textarea', helpText: 'Gunakan ___ untuk menandai tempat jawaban' },
        { key: 'answer', label: 'Jawaban', type: 'text', helpText: 'Gunakan / untuk beberapa jawaban yang diterima' },
        { key: 'hint', label: 'Petunjuk', type: 'text' },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// NEW GAME BLOCK PROPERTY SCHEMAS (Phase 6)
// ═══════════════════════════════════════════════════════════════════

export const WORDSEARCHGAME_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'word-search-game',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'words', label: 'Kata', icon: 'List' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    {
      key: 'words', type: 'array', label: 'Daftar Kata', group: 'words',
      fields: [
        { key: 'text', label: 'Kata', type: 'text' },
      ],
    },
    { key: 'gridSize', type: 'number', label: 'Ukuran Grid', group: 'content', min: 6, max: 15, defaultValue: 10 },
  ],
};

export const TRUEFALSEGAME_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'true-false-game',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'questions', label: 'Soal', icon: 'HelpCircle' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    {
      key: 'questions', type: 'array', label: 'Pernyataan', group: 'questions',
      fields: [
        { key: 'text', label: 'Pernyataan', type: 'textarea' },
        { key: 'correct', label: 'Benar', type: 'boolean' },
        { key: 'explanation', label: 'Penjelasan', type: 'text' },
      ],
    },
  ],
};

export const DRAGDROPGAME_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'drag-drop-game',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'items', label: 'Item', icon: 'Layers' },
    { key: 'targets', label: 'Target', icon: 'Columns' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    {
      key: 'items', type: 'array', label: 'Item Seret', group: 'items',
      fields: [
        { key: 'text', label: 'Teks Item', type: 'text' },
        { key: 'target', label: 'Target ID', type: 'text', helpText: 'ID target tujuan' },
      ],
    },
    {
      key: 'targets', type: 'array', label: 'Area Target', group: 'targets',
      fields: [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// NEW GAME BLOCK PROPERTY SCHEMAS (Phase 7)
// ═══════════════════════════════════════════════════════════════════

export const CROSSWORDGAME_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'crossword-game',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'words', label: 'Kata', icon: 'List' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    {
      key: 'words', type: 'array', label: 'Daftar Kata', group: 'words',
      fields: [
        { key: 'teks', label: 'Kata', type: 'text' },
        { key: 'hint', label: 'Petunjuk', type: 'text' },
        { key: 'arah', label: 'Arah', type: 'select', options: [
          { label: 'Mendatar', value: 'across' },
          { label: 'Menurun', value: 'down' },
        ]},
      ],
    },
    { key: 'gridSize', type: 'number', label: 'Ukuran Grid', group: 'content', min: 8, max: 15, defaultValue: 12 },
  ],
};

export const TEAMBUZZERGAME_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'team-buzzer-game',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'teams', label: 'Tim', icon: 'Users' },
    { key: 'questions', label: 'Soal', icon: 'HelpCircle' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'content' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    { key: 'teamA', type: 'text', label: 'Nama Tim A', group: 'teams', defaultValue: 'Tim Merah' },
    { key: 'teamB', type: 'text', label: 'Nama Tim B', group: 'teams', defaultValue: 'Tim Biru' },
    {
      key: 'questions', type: 'array', label: 'Soal', group: 'questions',
      fields: [
        { key: 'teks', label: 'Pertanyaan', type: 'textarea' },
        { key: 'poin', label: 'Poin', type: 'number', min: 1, max: 100 },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// MATERI BLOK PROPERTY SCHEMA — 13 tipe content patterns
// ═══════════════════════════════════════════════════════════════════

export const MATERIBLOK_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'materi-blok',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'tipe', type: 'select', label: 'Tipe Konten', group: 'content', required: true,
      options: [
        { label: '📝 Paragraf Teks', value: 'teks' },
        { label: '📌 Kotak Definisi', value: 'definisi' },
        { label: '• Poin-Poin', value: 'poin' },
        { label: '📊 Tabel', value: 'tabel' },
        { label: '💬 Kutipan / Quote', value: 'kutipan' },
        { label: '🖼️ Gambar dari URL', value: 'gambar' },
        { label: '🔄 Timeline / Alur', value: 'timeline' },
        { label: '⚡ Highlight Card', value: 'highlight' },
        { label: '⚖️ Perbandingan', value: 'compare' },
        { label: '💡 Info / Tips Box', value: 'infobox' },
        { label: '✅ Checklist', value: 'checklist' },
        { label: '📈 Statistik Angka', value: 'statistik' },
        { label: '📖 Studi Kasus', value: 'studi' },
      ],
    },
    { key: 'judul', type: 'text', label: 'Judul', group: 'content' },
    { key: 'isi', type: 'textarea', label: 'Isi', group: 'content', rows: 4 },
    { key: 'icon', type: 'icon', label: 'Icon', group: 'style' },
    { key: 'warna', type: 'color', label: 'Warna', group: 'style' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// NOTE: The takeaways field in MATERISECTION_PROPERTY_SCHEMA uses a
// simplified schema with a single 'text' field. At runtime, the
// MateriSectionBlock.takeaways is a string[] — the array schema here
// drives the property panel UI. The createDefault() in
// BlockDefinitionRegistry produces the correct string[] shape.
// ═══════════════════════════════════════════════════════════════════

// ── Materi Content Block Property Schemas (Phase 18.1) ──────────

export const TABEL_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'tabel',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'style', label: 'Gaya', icon: 'Palette' },
  ],
  properties: [
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    { key: 'headers', type: 'array', label: 'Header', group: 'content', fields: [
      { key: 'text', label: 'Kolom', type: 'text' },
    ]},
    { key: 'rows', type: 'array', label: 'Baris', group: 'content', fields: [
      { key: 'cells', label: 'Sel', type: 'array', fields: [
        { key: 'text', label: 'Isi', type: 'text' },
      ]},
    ]},
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'c' },
  ],
};

export const GAMBAR_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'gambar',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
  ],
  properties: [
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    { key: 'url', type: 'text', label: 'URL Gambar', group: 'content', required: true },
    { key: 'caption', type: 'text', label: 'Keterangan', group: 'content' },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'content', defaultValue: 'c' },
  ],
};

export const TIMELINE_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'timeline',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
  ],
  properties: [
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    { key: 'steps', type: 'array', label: 'Langkah', group: 'content', fields: [
      { key: 'icon', label: 'Icon', type: 'icon', placeholder: '📌' },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'color', label: 'Warna', type: 'color' },
    ]},
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'content', defaultValue: 'c' },
  ],
};

export const CHECKLIST_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'checklist',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
  ],
  properties: [
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    { key: 'items', type: 'array', label: 'Item', group: 'content', fields: [
      { key: 'text', label: 'Teks', type: 'text' },
      { key: 'checked', label: 'Tercentang', type: 'boolean' },
    ]},
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'content', defaultValue: 'g' },
  ],
};

export const STATISTIK_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'statistik',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
  ],
  properties: [
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    { key: 'items', type: 'array', label: 'Statistik', group: 'content', fields: [
      { key: 'angka', label: 'Angka', type: 'text' },
      { key: 'satuan', label: 'Satuan', type: 'text' },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'warna', label: 'Warna', type: 'color' },
    ]},
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'content', defaultValue: 'c' },
  ],
};

export const STUDI_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'studi',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
  ],
  properties: [
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    { key: 'karakter', type: 'text', label: 'Karakter', group: 'content' },
    { key: 'situasi', type: 'textarea', label: 'Situasi', group: 'content', rows: 3 },
    { key: 'pertanyaan', type: 'textarea', label: 'Pertanyaan', group: 'content', rows: 2 },
    { key: 'pesan', type: 'textarea', label: 'Pesan', group: 'content', rows: 2 },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'content', defaultValue: 'y' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// NEW BLOCK PROPERTY SCHEMAS (Phase 23)
// ═══════════════════════════════════════════════════════════════════

export const COMPARE_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'compare',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'kiri', label: 'Sisi Kiri', icon: 'ArrowLeft' },
    { key: 'kanan', label: 'Sisi Kanan', icon: 'ArrowRight' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    { key: 'kiri.icon', type: 'icon', label: 'Icon', group: 'kiri', placeholder: '🔵' },
    { key: 'kiri.judul', type: 'text', label: 'Judul', group: 'kiri', required: true },
    { key: 'kiri.isi', type: 'textarea', label: 'Isi', group: 'kiri', rows: 3 },
    { key: 'kanan.icon', type: 'icon', label: 'Icon', group: 'kanan', placeholder: '🔴' },
    { key: 'kanan.judul', type: 'text', label: 'Judul', group: 'kanan', required: true },
    { key: 'kanan.isi', type: 'textarea', label: 'Isi', group: 'kanan', rows: 3 },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'c' },
  ],
};

export const REVEAL_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'reveal',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'cover', label: 'Sampul', icon: 'Eye' },
    { key: 'reveal', label: 'Konten Tersembunyi', icon: 'Gift' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    { key: 'coverIcon', type: 'icon', label: 'Icon Sampul', group: 'cover', placeholder: '🎁' },
    { key: 'coverText', type: 'text', label: 'Teks Sampul', group: 'cover', placeholder: 'Ketuk untuk membuka!' },
    { key: 'revealIcon', type: 'icon', label: 'Icon Konten', group: 'reveal', placeholder: '💡' },
    { key: 'revealContent', type: 'textarea', label: 'Konten Tersembunyi', group: 'reveal', rows: 4, required: true },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'p' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// PROPERTY SCHEMA LOOKUP — DELEGATED TO SCENE REGISTRY
// ═══════════════════════════════════════════════════════════════════
// FASE 2: The PROPERTY_SCHEMAS record has been REMOVED.
// The single source of truth for property schema lookup is now:
//
//   getBlockPropertySchema(type) from '@/core/registry/SceneRegistry'
//
// That function returns `PropertySchema | undefined`.
// For a fallback schema for unregistered types, consumers should
// create a minimal schema inline (same pattern as the old fallback).
//
// The named exports (COVER_PROPERTY_SCHEMA, etc.) remain for
// SceneRegistry to import and attach to BlockDefinition.propertySchema.
