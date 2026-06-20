// ═══════════════════════════════════════════════════════════════════
// PROPERTY SCHEMAS — Interactive block schemas
// ═══════════════════════════════════════════════════════════════════

import type { PropertySchema } from '../types';

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
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'icon', label: 'Ikon', type: 'icon' },
        { key: 'teks', label: 'Pertanyaan', type: 'textarea' },
        { key: 'petunjuk', label: 'Petunjuk', type: 'textarea' },
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

// ── Reveal (Hidden Content) Schema ──────────────────────────────

export const REVEAL_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'reveal',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'cover', label: 'Sampul', icon: 'Eye' },
    { key: 'revealed', label: 'Konten Terbuka', icon: 'Lightbulb' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    { key: 'coverIcon', type: 'icon', label: 'Icon Sampul', group: 'cover', placeholder: '🎁' },
    { key: 'coverText', type: 'text', label: 'Teks Sampul', group: 'cover' },
    { key: 'revealIcon', type: 'icon', label: 'Icon Terbuka', group: 'revealed', placeholder: '💡' },
    { key: 'revealContent', type: 'textarea', label: 'Konten Terbuka', group: 'revealed', rows: 4 },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'p' },
  ],
};

// ── Checklist Schema ────────────────────────────────────────────

export const CHECKLIST_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'checklist',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    {
      key: 'items', type: 'array', label: 'Item', group: 'content',
      fields: [
        { key: 'text', label: 'Teks', type: 'text' },
        { key: 'checked', label: 'Tercentang', type: 'boolean' },
      ],
    },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'c' },
  ],
};

// Sprint 8.8B / 3B: Hotspot Image property schema
export const HOTSPOT_IMAGE_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'hotspot-image',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'style', label: 'Tampilan', icon: 'Palette' },
  ],
  properties: [
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    { key: 'image', type: 'json', label: 'Gambar (URL + Alt)', group: 'content' },
    {
      key: 'hotspots', type: 'array', label: 'Hotspot', group: 'content',
      fields: [
        { key: 'label', label: 'Label', type: 'text', placeholder: '1' },
        { key: 'title', label: 'Judul Kartu', type: 'text' },
        { key: 'body', label: 'Isi Kartu', type: 'textarea' },
        { key: 'icon', label: 'Ikon', type: 'icon' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'y' },
  ],
};
