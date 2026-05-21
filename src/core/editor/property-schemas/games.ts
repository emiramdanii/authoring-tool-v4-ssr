// ═══════════════════════════════════════════════════════════════════
// PROPERTY SCHEMAS — Game block schemas
// ═══════════════════════════════════════════════════════════════════

import type { PropertySchema } from '../types';

// ── Phase 5 Games ──────────────────────────────────────────────────

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

// ── Phase 6 Games ──────────────────────────────────────────────────

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

// ── Phase 7 Games ──────────────────────────────────────────────────

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
