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

import type { PropertySchema } from './types';

// ═══════════════════════════════════════════════════════════════════
// BLOCK PROPERTY SCHEMAS
// ═══════════════════════════════════════════════════════════════════

export const COVER_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'cover',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'badges', label: 'Badge', icon: 'Award' },
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
  ],
};

export const PETUNJUK_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'petunjuk',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
    { key: 'title', type: 'text', label: 'Judul', required: true },
    { key: 'titleHighlight', type: 'text', label: 'Highlight' },
    {
      key: 'items', type: 'array', label: 'Item',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '📌' },
        { key: 'title', label: 'Judul', type: 'text' },
        { key: 'body', label: 'Deskripsi', type: 'textarea' },
      ],
    },
    { key: 'tips', type: 'textarea', label: 'Tips', rows: 3 },
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
  redirectToAuthoring: true,
  redirectNote: 'Skenario memiliki editor khusus — edit chapter via authoring panel',
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
    { key: 'title', type: 'text', label: 'Judul' },
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
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
    {
      key: 'cards', type: 'array', label: 'Kartu',
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
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
    {
      key: 'cards', type: 'array', label: 'Kartu Kilat',
      fields: [
        { key: 'q', label: 'Pertanyaan', type: 'textarea' },
        { key: 'a', label: 'Jawaban', type: 'textarea' },
      ],
    },
  ],
};

export const FTAB_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'ftab',
  redirectToAuthoring: true,
  redirectNote: 'Tab memiliki editor khusus — edit via authoring panel',
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
  ],
};

export const NKCARD_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'nk-card',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'detail', label: 'Detail', icon: 'FileText', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
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
  ],
};

export const DISKUSI_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'diskusi',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
    { key: 'title', type: 'text', label: 'Judul', required: true },
    { key: 'intro', type: 'textarea', label: 'Intro', rows: 3 },
    {
      key: 'questions', type: 'array', label: 'Pertanyaan',
      fields: [
        { key: 'teks', label: 'Pertanyaan', type: 'textarea' },
        { key: 'petunjuk', label: 'Petunjuk', type: 'text' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
  ],
};

export const KUIS_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'kuis',
  redirectToAuthoring: true,
  redirectNote: 'Pertanyaan kuis memiliki editor khusus — edit via authoring panel',
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
    { key: 'title', type: 'text', label: 'Judul' },
  ],
};

export const SORTIRGAME_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'sortir-game',
  redirectToAuthoring: true,
  redirectNote: 'Game memiliki editor khusus — edit via authoring panel',
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
    { key: 'title', type: 'text', label: 'Judul' },
  ],
};

export const RODAGAME_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'roda-game',
  redirectToAuthoring: true,
  redirectNote: 'Game memiliki editor khusus — edit via authoring panel',
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
    { key: 'title', type: 'text', label: 'Judul' },
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
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    { key: 'intro', type: 'textarea', label: 'Intro', group: 'content', rows: 3 },
    {
      key: 'questions', type: 'array', label: 'Refleksi', group: 'content',
      fields: [
        { key: 'teks', label: 'Pertanyaan', type: 'textarea' },
        { key: 'petunjuk', label: 'Petunjuk', type: 'text' },
      ],
    },
  ],
};

export const PENUTUP_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'penutup',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'preview', label: 'Preview', icon: 'Eye', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
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
  ],
};

export const TABELACCORD_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'tabel-accord',
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian' },
    {
      key: 'rows', type: 'array', label: 'Baris',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '📊' },
        { key: 'title', label: 'Judul', type: 'text' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// PROPERTY SCHEMA REGISTRY
// ═══════════════════════════════════════════════════════════════════
// Maps block type → its property schema.
// The dynamic property panel reads from this to auto-generate forms.

const PROPERTY_SCHEMAS: Record<string, PropertySchema> = {
  'cover': COVER_PROPERTY_SCHEMA,
  'petunjuk': PETUNJUK_PROPERTY_SCHEMA,
  'tp': TP_PROPERTY_SCHEMA,
  'alur': ALUR_PROPERTY_SCHEMA,
  'skenario': SKENARIO_PROPERTY_SCHEMA,
  'def-box': DEFBOX_PROPERTY_SCHEMA,
  'nc-grid': NCGRID_PROPERTY_SCHEMA,
  'flashcard-set': FLASHCARD_PROPERTY_SCHEMA,
  'ftab': FTAB_PROPERTY_SCHEMA,
  'nk-card': NKCARD_PROPERTY_SCHEMA,
  'diskusi': DISKUSI_PROPERTY_SCHEMA,
  'kuis': KUIS_PROPERTY_SCHEMA,
  'sortir-game': SORTIRGAME_PROPERTY_SCHEMA,
  'roda-game': RODAGAME_PROPERTY_SCHEMA,
  'hasil': HASIL_PROPERTY_SCHEMA,
  'refleksi': REFLEKSI_PROPERTY_SCHEMA,
  'penutup': PENUTUP_PROPERTY_SCHEMA,
  'tabel-accord': TABELACCORD_PROPERTY_SCHEMA,
};

/**
 * Get the property schema for a block type.
 * Returns a minimal generic schema for unregistered types.
 */
export function getPropertySchema(blockType: string): PropertySchema {
  return PROPERTY_SCHEMAS[blockType] ?? {
    blockType,
    properties: [
      { key: 'variant', type: 'variant', label: 'Varian' },
    ],
    redirectToAuthoring: true,
    redirectNote: `Block type "${blockType}" — editor belum tersedia`,
  };
}

/**
 * Get all registered property schemas.
 */
export function getAllPropertySchemas(): Record<string, PropertySchema> {
  return PROPERTY_SCHEMAS;
}
