// ═══════════════════════════════════════════════════════════════════
// PROPERTY SCHEMAS — Content block schemas
// ═══════════════════════════════════════════════════════════════════

import type { PropertySchema } from '../types';

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

// ── Gambar (Image) Schema ──────────────────────────────────────

export const GAMBAR_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'gambar',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    { key: 'url', type: 'text', label: 'URL Gambar', group: 'content', required: true },
    { key: 'caption', type: 'textarea', label: 'Keterangan', group: 'content', rows: 2 },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'c' },
  ],
};

// ── Timeline Schema ───────────────────────────────────────────

export const TIMELINE_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'timeline',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    {
      key: 'steps', type: 'array', label: 'Langkah', group: 'content',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '1️⃣' },
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'description', label: 'Deskripsi', type: 'textarea' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'c' },
  ],
};

// ── Compare Schema ────────────────────────────────────────────

export const COMPARE_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'compare',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'kiri', label: 'Sisi Kiri', icon: 'ArrowLeft' },
    { key: 'kanan', label: 'Sisi Kanan', icon: 'ArrowRight' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    { key: 'kiri.icon', type: 'icon', label: 'Icon Kiri', group: 'kiri', placeholder: '🔵' },
    { key: 'kiri.judul', type: 'text', label: 'Judul Kiri', group: 'kiri' },
    { key: 'kiri.isi', type: 'textarea', label: 'Isi Kiri', group: 'kiri', rows: 3 },
    { key: 'kanan.icon', type: 'icon', label: 'Icon Kanan', group: 'kanan', placeholder: '🔴' },
    { key: 'kanan.judul', type: 'text', label: 'Judul Kanan', group: 'kanan' },
    { key: 'kanan.isi', type: 'textarea', label: 'Isi Kanan', group: 'kanan', rows: 3 },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'c' },
  ],
};

// ── Tabel (Table) Schema ──────────────────────────────────────

export const TABEL_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'tabel',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    {
      key: 'headers', type: 'array', label: 'Header Kolom', group: 'content',
      fields: [
        { key: 'text', label: 'Header', type: 'text' },
      ],
    },
    {
      key: 'rows', type: 'json', label: 'Baris Data', group: 'content',
      helpText: 'Array of string arrays, contoh: [["A1","B1"],["A2","B2"]]',
    },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'c' },
  ],
};

// ── Statistik Schema ──────────────────────────────────────────

export const STATISTIK_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'statistik',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    {
      key: 'items', type: 'array', label: 'Angka', group: 'content',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '📊' },
        { key: 'angka', label: 'Angka', type: 'text' },
        { key: 'satuan', label: 'Satuan', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'warna', label: 'Warna', type: 'color' },
      ],
    },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'c' },
  ],
};

// ── Studi (Case Study) Schema ─────────────────────────────────

export const STUDI_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'studi',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content' },
    { key: 'karakter', type: 'icon', label: 'Karakter', group: 'content', placeholder: '🧑' },
    { key: 'situasi', type: 'textarea', label: 'Situasi', group: 'content', rows: 4, required: true },
    { key: 'pertanyaan', type: 'textarea', label: 'Pertanyaan', group: 'content', rows: 3 },
    { key: 'pesan', type: 'textarea', label: 'Pesan / Tips', group: 'content', rows: 2 },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'c' },
  ],
};

// ── MateriBlok (Internal) Schema ──────────────────────────────

export const MATERIBLOK_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'materi-blok',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'tipe', type: 'select', label: 'Tipe Konten', group: 'content',
      options: [
        { label: 'Paragraf', value: 'teks' },
        { label: 'Definisi', value: 'definisi' },
        { label: 'Poin', value: 'poin' },
        { label: 'Tabel', value: 'tabel' },
        { label: 'Kutipan', value: 'kutipan' },
        { label: 'Gambar', value: 'gambar' },
        { label: 'Timeline', value: 'timeline' },
        { label: 'Highlight', value: 'highlight' },
        { label: 'Perbandingan', value: 'compare' },
        { label: 'Info Box', value: 'infobox' },
        { label: 'Checklist', value: 'checklist' },
        { label: 'Statistik', value: 'statistik' },
        { label: 'Studi Kasus', value: 'studi' },
      ],
    },
    { key: 'judul', type: 'text', label: 'Judul', group: 'content' },
    { key: 'isi', type: 'textarea', label: 'Isi', group: 'content', rows: 4 },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'c' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// NOTE: The takeaways field in MATERISECTION_PROPERTY_SCHEMA uses a
// simplified schema with a single 'text' field. At runtime, the
// MateriSectionBlock.takeaways is a string[] — the array schema here
// drives the property panel UI. The createDefault() in
// BlockDefinitionRegistry produces the correct string[] shape.
// ═══════════════════════════════════════════════════════════════════
