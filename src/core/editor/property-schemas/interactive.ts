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
