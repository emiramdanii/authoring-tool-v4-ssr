// ═══════════════════════════════════════════════════════════════════
// PROPERTY SCHEMAS — BSNP pedagogical schemas
// ═══════════════════════════════════════════════════════════════════

import type { PropertySchema } from '../types';

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
