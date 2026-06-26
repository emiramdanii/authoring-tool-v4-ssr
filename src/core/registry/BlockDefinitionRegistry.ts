// ═══════════════════════════════════════════════════════════════════
// BLOCK DEFINITION REGISTRY — Metadata-only block definitions
// ═══════════════════════════════════════════════════════════════════
// This is a lightweight, RENDERER-FREE version of the SceneRegistry.
// It contains ONLY block metadata (type, name, icon, capabilities,
// defaultLayout, createDefault, propertySchema) without importing
// any React renderer components.
//
// WHY: The full SceneRegistry imports all renderer components, which
// in turn import from @/store/canva-store (via BlockSelectionOverlay,
// InlineTextEditor, etc.). This creates a circular dependency:
//
//   canva-store → ui-slice → SceneRegistry → renderers → canva-store
//
// By splitting the metadata into a separate module, ui-slice can
// import block definitions WITHOUT pulling in the renderer graph.
// The SceneRegistry.tsx then extends these definitions with renderers.
//
// Rule: This file MUST NOT import any React components or stores.

import type { PropertySchema } from '../editor/types';

// ═══════════════════════════════════════════════════════════════════
// BLOCK PERSONALITY — Pedagogical intent grouping
// ═══════════════════════════════════════════════════════════════════
// Instead of grouping blocks by technical category (layout, content, etc.),
// we group them by their pedagogical purpose — what role they play
// in the learning experience.

export type BlockPersonality = 'understanding' | 'discussion' | 'reflection' | 'assessment' | 'activation' | 'structure';

export const PERSONALITY_CONFIG: Record<BlockPersonality, {
  label: string;
  icon: string;
  color: string;
  colorClass: string;
  bgColorClass: string;
  borderColorClass: string;
  order: number;
  description: string;
}> = {
  understanding: {
    label: 'Membangun Pemahaman',
    icon: '📖',
    color: '#3B82F6',
    colorClass: 'text-blue-400',
    bgColorClass: 'bg-blue-500/10',
    borderColorClass: 'border-blue-500/20',
    order: 0,
    description: 'Siswa perlu memahami konsep ini',
  },
  discussion: {
    label: 'Mengembangkan Diskusi',
    icon: '💬',
    color: '#22C55E',
    colorClass: 'text-green-400',
    bgColorClass: 'bg-green-500/10',
    borderColorClass: 'border-green-500/20',
    order: 1,
    description: 'Siswa perlu berdiskusi dan berkolaborasi',
  },
  reflection: {
    label: 'Mendalami Refleksi',
    icon: '🪞',
    color: '#EAB308',
    colorClass: 'text-yellow-400',
    bgColorClass: 'bg-yellow-500/10',
    borderColorClass: 'border-yellow-500/20',
    order: 2,
    description: 'Siswa perlu merenung dan merefleksi',
  },
  assessment: {
    label: 'Mengukur Pemahaman',
    icon: '❓',
    color: '#EF4444',
    colorClass: 'text-red-400',
    bgColorClass: 'bg-red-500/10',
    borderColorClass: 'border-red-500/20',
    order: 3,
    description: 'Siswa perlu diuji pemahamannya',
  },
  activation: {
    label: 'Menghidupkan Kelas',
    icon: '⚡',
    color: '#A855F7',
    colorClass: 'text-purple-400',
    bgColorClass: 'bg-purple-500/10',
    borderColorClass: 'border-purple-500/20',
    order: 4,
    description: 'Siswa perlu aktivitas menyenangkan',
  },
  structure: {
    label: 'Struktur & Navigasi',
    icon: '🏗️',
    color: '#6B7280',
    colorClass: 'text-gray-400',
    bgColorClass: 'bg-gray-500/10',
    borderColorClass: 'border-gray-500/20',
    order: 5,
    description: 'Kerangka presentasi',
  },
};

import {
  COVER_PROPERTY_SCHEMA,
  HERO_PROPERTY_SCHEMA,
  PETUNJUK_PROPERTY_SCHEMA,
  TP_PROPERTY_SCHEMA,
  ALUR_PROPERTY_SCHEMA,
  SKENARIO_PROPERTY_SCHEMA,
  DEFBOX_PROPERTY_SCHEMA,
  NCGRID_PROPERTY_SCHEMA,
  FLASHCARD_PROPERTY_SCHEMA,
  FTAB_PROPERTY_SCHEMA,
  NKCARD_PROPERTY_SCHEMA,
  DISKUSI_PROPERTY_SCHEMA,
  KUIS_PROPERTY_SCHEMA,
  SORTIRGAME_PROPERTY_SCHEMA,
  RODAGAME_PROPERTY_SCHEMA,
  MEMORYGAME_PROPERTY_SCHEMA,
  MATCHINGGAME_PROPERTY_SCHEMA,
  FILLBLANKGAME_PROPERTY_SCHEMA,
  WORDSEARCHGAME_PROPERTY_SCHEMA,
  TRUEFALSEGAME_PROPERTY_SCHEMA,
  DRAGDROPGAME_PROPERTY_SCHEMA,
  CROSSWORDGAME_PROPERTY_SCHEMA,
  TEAMBUZZERGAME_PROPERTY_SCHEMA,
  HASIL_PROPERTY_SCHEMA,
  REFLEKSI_PROPERTY_SCHEMA,
  PENUTUP_PROPERTY_SCHEMA,
  TABELACCORD_PROPERTY_SCHEMA,
  MATERISECTION_PROPERTY_SCHEMA,
  TUJUANDISPLAY_PROPERTY_SCHEMA,
  MOTIVASI_PROPERTY_SCHEMA,
  RANGKUMAN_PROPERTY_SCHEMA,
} from '../editor/property-schemas';

// ═══════════════════════════════════════════════════════════════════
// TYPES (re-exported for consumers)
// ═══════════════════════════════════════════════════════════════════

export interface BlockCapabilities {
  editable: boolean;
  resizable: boolean;
  movable: boolean;
  backgroundCustom: boolean;
  interactive: boolean;
  autoGeneratable: boolean;
  composite: boolean;
  variants: ('A' | 'B' | 'C')[];
  /** Whether the renderer handles compression natively via useBlockCompression.
   *  If false, CompressionBoundary will wrap the block in CompressedBlockWrapper. */
  handlesCompression: boolean;
}

export const DEFAULT_CAPABILITIES: BlockCapabilities = {
  editable: true,
  resizable: false,
  movable: false,
  backgroundCustom: false,
  interactive: false,
  autoGeneratable: true,
  composite: false,
  variants: ['A'],
  handlesCompression: false,
};

export interface SceneBlockLayout {
  position: 'flow' | 'absolute';
  defaultWidth?: number;
  defaultHeight?: number;
  defaultX?: number;
  defaultY?: number;
  zIndex?: number;
}

/**
 * Block definition WITHOUT renderer.
 * This is safe to import from store modules — no React dependency.
 */
export interface BlockDefinitionMeta {
  type: string;
  name: string;
  icon: string;
  category: 'layout' | 'content' | 'interactive' | 'navigation' | 'feedback' | 'decoration';
  /** Pedagogical intent — groups blocks by learning purpose */
  personality: BlockPersonality;
  description: string;
  capabilities: BlockCapabilities;
  defaultLayout: SceneBlockLayout;
  usedInTemplates: string[];
  propertySchema: PropertySchema;
  createDefault: () => Record<string, unknown>;
  /** Estimated rendered height in px (used by overflow detection system) */
  estimatedHeight: Record<'A' | 'B' | 'C', number>;
  /** Whether this block can be added from the Add Block UI panel.
   *  Internal blocks (like materi-blok) should set this to false.
   *  Defaults to true when not specified. */
  addable?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// BLOCK DEFINITIONS (renderer-free)
// ═══════════════════════════════════════════════════════════════════

export const BLOCK_DEFINITIONS: Record<string, BlockDefinitionMeta> = {
  'cover': {
    type: 'cover',
    name: 'Cover',
    icon: '🏠',
    category: 'layout',
    personality: 'structure',
    description: 'Halaman judul dengan icon, title, badges, dan CTA',
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A', 'B', 'C'], movable: false, resizable: false },
    defaultLayout: { position: 'absolute', defaultX: 0, defaultY: 0, defaultWidth: 100, defaultHeight: 100, zIndex: 0 },
    usedInTemplates: ['cover'],
    propertySchema: COVER_PROPERTY_SCHEMA,
    estimatedHeight: { A: 600, B: 550, C: 500 },
    createDefault: () => ({
      icon: '📄',
      title: 'Judul Baru',
      subtitle: 'Subtitle',
      badges: [],
      meta: { durasi: '', fase: 'VII', elemen: '' },
      cta: { label: 'Mulai →', action: 'next' },
      accentColor: 'y',
    }),
  },
  'hero': {
    type: 'hero',
    name: 'Hero Banner',
    icon: '🖼️',
    category: 'layout',
    personality: 'structure',
    description: 'Banner hero dengan gradient, title, dan CTA — mirip Cover tapi untuk konten',
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A', 'B', 'C'], movable: false, resizable: false },
    defaultLayout: { position: 'absolute', defaultX: 0, defaultY: 0, defaultWidth: 100, defaultHeight: 100, zIndex: 0 },
    usedInTemplates: ['hero'],
    propertySchema: HERO_PROPERTY_SCHEMA,
    estimatedHeight: { A: 550, B: 500, C: 450 },
    createDefault: () => ({
      icon: '🚀',
      title: 'Hero Banner',
      subtitle: 'Subtitle hero',
      badges: [],
      meta: { durasi: '', fase: '', elemen: '' },
      cta: { label: 'Mulai →', action: 'next' },
      accentColor: 'c',
    }),
  },
  'petunjuk': {
    type: 'petunjuk',
    name: 'Petunjuk',
    icon: '📌',
    category: 'content',
    personality: 'structure',
    description: 'Petunjuk penggunaan dengan grid item dan tips',
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['petunjuk'],
    propertySchema: PETUNJUK_PROPERTY_SCHEMA,
    estimatedHeight: { A: 450, B: 450, C: 450 },
    createDefault: () => ({
      title: 'Petunjuk',
      titleHighlight: 'Penggunaan',
      items: [
        { icon: '📌', title: 'Baca Petunjuk', body: 'Baca petunjuk ini sebelum memulai.' },
        { icon: '🖱️', title: 'Klik Navigasi', body: 'Gunakan tombol navigasi untuk berpindah halaman.' },
        { icon: '✅', title: 'Jawab Soal', body: 'Kerjakan soal evaluasi di akhir pembelajaran.' },
        { icon: '🔄', title: 'Ulangi Materi', body: 'Anda bisa mengulang materi kapan saja.' },
      ],
      navigation: [
        { icon: '⬅️', label: 'Sebelumnya', description: 'Kembali ke halaman sebelumnya' },
        { icon: '➡️', label: 'Selanjutnya', description: 'Lanjut ke halaman berikutnya' },
        { icon: '🏠', label: 'Beranda', description: 'Kembali ke halaman utama' },
      ],
      learningObjectives: [
        { num: 1, text: 'Peserta didik mampu memahami materi pembelajaran' },
      ],
    }),
  },
  'tp': {
    type: 'tp',
    name: 'Tujuan Pembelajaran',
    icon: '🎯',
    category: 'content',
    personality: 'structure',
    description: 'Daftar tujuan pembelajaran dengan nomor dan profil',
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['dokumen'],
    propertySchema: TP_PROPERTY_SCHEMA,
    estimatedHeight: { A: 350, B: 350, C: 350 },
    createDefault: () => ({
      title: 'Tujuan Pembelajaran',
      titleHighlight: '',
      items: [{ num: 1, verb: 'Memahami', desc: 'Deskripsi tujuan', color: 'y' }],
      profilColor: 'g',
    }),
  },
  'alur': {
    type: 'alur',
    name: 'Alur Kegiatan',
    icon: '⏱️',
    category: 'navigation',
    personality: 'structure',
    description: 'Timeline vertikal kegiatan pembelajaran',
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['dokumen'],
    propertySchema: ALUR_PROPERTY_SCHEMA,
    estimatedHeight: { A: 300, B: 300, C: 300 },
    createDefault: () => ({
      title: 'Alur Kegiatan',
      steps: [{ dot: 'y', durasi: '5 menit', judul: 'Langkah 1', deskripsi: 'Deskripsi langkah' }],
    }),
  },
  'skenario': {
    type: 'skenario',
    name: 'Skenario',
    icon: '🎭',
    category: 'interactive',
    personality: 'discussion',
    description: 'Cerita interaktif dengan pilihan dan konsekuensi',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['skenario'],
    propertySchema: SKENARIO_PROPERTY_SCHEMA,
    estimatedHeight: { A: 500, B: 500, C: 500 },
    createDefault: () => ({
      title: 'Skenario',
      chapters: [{
        id: 'ch1',
        charEmoji: '🎭',
        title: 'Bab 1',
        choices: [{
          icon: '👉', label: 'Pilihan 1', detail: '', good: true, pts: 10,
          level: 'good' as const,
        }],
      }],
    }),
  },
  'def-box': {
    type: 'def-box',
    name: 'Definisi',
    icon: '📖',
    category: 'content',
    personality: 'understanding',
    description: 'Kotak definisi dengan border accent',
    capabilities: { ...DEFAULT_CAPABILITIES, backgroundCustom: true, resizable: true, movable: true, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi'],
    propertySchema: DEFBOX_PROPERTY_SCHEMA,
    estimatedHeight: { A: 120, B: 120, C: 120 },
    createDefault: () => ({
      content: 'Definisi baru',
      borderColor: 'y',
    }),
  },
  'nc-grid': {
    type: 'nc-grid',
    name: 'Kartu Norma',
    icon: '📋',
    category: 'content',
    personality: 'understanding',
    description: 'Grid kartu dengan icon, title, body',
    capabilities: { ...DEFAULT_CAPABILITIES, resizable: true, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi', 'diskusi'],
    propertySchema: NCGRID_PROPERTY_SCHEMA,
    estimatedHeight: { A: 250, B: 250, C: 250 },
    createDefault: () => ({
      cards: [{ icon: '📋', title: 'Kartu 1', body: 'Deskripsi kartu', color: 'y' }],
    }),
  },
  'flashcard-set': {
    type: 'flashcard-set',
    name: 'Kartu Kilat',
    icon: '🃏',
    category: 'interactive',
    personality: 'activation',
    description: 'Set kartu kilat flip dengan navigasi',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi'],
    propertySchema: FLASHCARD_PROPERTY_SCHEMA,
    estimatedHeight: { A: 300, B: 300, C: 300 },
    createDefault: () => ({
      cards: [{ q: 'Pertanyaan?', a: 'Jawaban' }],
    }),
  },
  'ftab': {
    type: 'ftab',
    name: 'Tab Fungsi',
    icon: '📑',
    category: 'navigation',
    personality: 'understanding',
    description: 'Tab konten dengan read marker dan progress',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, composite: true, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi'],
    propertySchema: FTAB_PROPERTY_SCHEMA,
    estimatedHeight: { A: 400, B: 400, C: 400 },
    createDefault: () => ({
      tabs: [{ icon: '📑', label: 'Tab 1', content: [] }],
      showReadMarker: false,
      showProgress: false,
    }),
  },
  'nk-card': {
    type: 'nk-card',
    name: 'Kartu Norma Detail',
    icon: '📜',
    category: 'content',
    personality: 'understanding',
    description: 'Kartu detail jenis norma dengan sanksi dan contoh',
    capabilities: { ...DEFAULT_CAPABILITIES, backgroundCustom: true, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi'],
    propertySchema: NKCARD_PROPERTY_SCHEMA,
    estimatedHeight: { A: 350, B: 350, C: 350 },
    createDefault: () => ({
      normaType: '',
      icon: '📜',
      title: 'Kartu Norma',
      label: '',
      definition: '',
      characteristics: [],
      sanksi: { title: 'Sanksi', items: [] },
      contoh: '',
    }),
  },
  'diskusi': {
    type: 'diskusi',
    name: 'Diskusi',
    icon: '💬',
    category: 'interactive',
    personality: 'discussion',
    description: 'Pertanyaan diskusi dengan area jawaban',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A', 'B'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['diskusi'],
    propertySchema: DISKUSI_PROPERTY_SCHEMA,
    estimatedHeight: { A: 300, B: 280, C: 280 },
    createDefault: () => ({
      title: 'Diskusi',
      questions: [{ label: '1', icon: '💬', teks: 'Pertanyaan diskusi?', petunjuk: 'Petunjuk jawaban', color: 'c' }],
    }),
  },
  'kuis': {
    type: 'kuis',
    name: 'Kuis',
    icon: '❓',
    category: 'interactive',
    personality: 'assessment',
    description: 'Kuis pilihan ganda dengan feedback',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['kuis'],
    propertySchema: KUIS_PROPERTY_SCHEMA,
    estimatedHeight: { A: 400, B: 380, C: 360 },
    createDefault: () => ({
      title: 'Kuis',
      questions: [{ q: 'Pertanyaan?', opts: ['A', 'B', 'C'], ans: 0, ex: 'Penjelasan' }],
      interactive: true,
    }),
  },
  'sortir-game': {
    type: 'sortir-game',
    name: 'Game Sortir',
    icon: '🎮',
    category: 'interactive',
    personality: 'assessment',
    description: 'Game mengelompokkan kartu ke kolom',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['game'],
    propertySchema: SORTIRGAME_PROPERTY_SCHEMA,
    estimatedHeight: { A: 400, B: 400, C: 400 },
    createDefault: () => ({
      title: 'Game Sortir',
      // BATCH-13E: Default sortir-game now has multiple items + multiple kolom
      // (was 1 item + 1 kolom — not useful as a game)
      pool: [
        { id: 's1', text: 'Beribadah', category: 'kolom-1' },
        { id: 's2', text: 'Antri tertib', category: 'kolom-2' },
        { id: 's3', text: 'Tidak berbohong', category: 'kolom-3' },
        { id: 's4', text: 'Patuh aturan lalu lintas', category: 'kolom-4' },
      ],
      kolom: [
        { id: 'kolom-1', label: 'Norma Agama', color: 'y' },
        { id: 'kolom-2', label: 'Norma Kesopanan', color: 'c' },
        { id: 'kolom-3', label: 'Norma Kesusilaan', color: 'g' },
        { id: 'kolom-4', label: 'Norma Hukum', color: 'r' },
      ],
      interactive: true,
    }),
  },
  'roda-game': {
    type: 'roda-game',
    name: 'Game Roda',
    icon: '🎡',
    category: 'interactive',
    personality: 'activation',
    description: 'Game roda putar dengan pertanyaan',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['game'],
    propertySchema: RODAGAME_PROPERTY_SCHEMA,
    estimatedHeight: { A: 450, B: 450, C: 450 },
    createDefault: () => ({
      title: 'Game Roda',
      questions: [{
        q: 'Pertanyaan?',
        opts: [{ text: 'Jawaban A', correct: true }, { text: 'Jawaban B', correct: false }],
        feedbackCorrect: 'Benar!',
        feedbackWrong: 'Coba lagi',
      }],
      interactive: true,
    }),
  },
  'hasil': {
    type: 'hasil',
    name: 'Hasil',
    icon: '🏆',
    category: 'feedback',
    personality: 'structure',
    description: 'Tampilan skor dan apresiasi',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['hasil'],
    propertySchema: HASIL_PROPERTY_SCHEMA,
    estimatedHeight: { A: 350, B: 330, C: 320 },
    createDefault: () => ({
      title: 'Hasil',
      subtitle: 'Subtitle hasil',
      interactive: true,
    }),
  },
  'refleksi': {
    type: 'refleksi',
    name: 'Refleksi',
    icon: '📝',
    category: 'interactive',
    personality: 'reflection',
    description: 'Refleksi diri dengan pertanyaan dan penugasan',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['refleksi'],
    propertySchema: REFLEKSI_PROPERTY_SCHEMA,
    estimatedHeight: { A: 350, B: 350, C: 350 },
    createDefault: () => ({
      title: 'Refleksi',
      questions: [{ teks: 'Pertanyaan refleksi?', petunjuk: 'Petunjuk refleksi' }],
      interactive: true,
    }),
  },
  'penutup': {
    type: 'penutup',
    name: 'Penutup',
    icon: '🎊',
    category: 'feedback',
    personality: 'structure',
    description: 'Penutup dengan preview pertemuan berikutnya',
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['penutup'],
    propertySchema: PENUTUP_PROPERTY_SCHEMA,
    estimatedHeight: { A: 300, B: 300, C: 300 },
    createDefault: () => ({
      title: 'Penutup',
      subtitle: 'Terima kasih',
      preview: [],
    }),
  },
  'tabel-accord': {
    type: 'tabel-accord',
    name: 'Tabel Accordion',
    icon: '📊',
    category: 'content',
    personality: 'understanding',
    description: 'Tabel accordion dengan expandable rows',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi'],
    propertySchema: TABELACCORD_PROPERTY_SCHEMA,
    estimatedHeight: { A: 300, B: 300, C: 300 },
    createDefault: () => ({
      rows: [{ icon: '📊', title: 'Baris 1', color: 'y', details: [{ label: 'Label', value: 'Nilai' }] }],
      interactive: true,
    }),
  },
  'materi-section': {
    type: 'materi-section',
    name: 'Bagian Materi',
    icon: '📚',
    category: 'content',
    personality: 'understanding',
    description: 'Bagian materi BSNP dengan header, konten, poin penting, dan evaluasi diri',
    capabilities: { ...DEFAULT_CAPABILITIES, composite: true, backgroundCustom: true, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi'],
    propertySchema: MATERISECTION_PROPERTY_SCHEMA,
    estimatedHeight: { A: 500, B: 500, C: 500 },
    createDefault: () => ({
      title: 'Bagian Materi',
      subtitle: '',
      bsnpRequired: true,
      icon: '📚',
      accentColor: 'c',
      content: [],
      takeaways: ['Poin penting pertama'],
      selfCheck: 'Coba jelaskan kembali apa yang baru saja kamu pelajari!',
    }),
  },
  'tujuan-display': {
    type: 'tujuan-display',
    name: 'Tujuan (Tampilan)',
    icon: '🎯',
    category: 'content',
    personality: 'understanding',
    description: 'Tampilan tujuan pembelajaran untuk siswa — BSNP wajib',
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['tp', 'dokumen', 'materi'],
    propertySchema: TUJUANDISPLAY_PROPERTY_SCHEMA,
    estimatedHeight: { A: 300, B: 300, C: 300 },
    createDefault: () => ({
      title: 'Tujuan Pembelajaran',
      subtitle: 'Setelah mempelajari materi ini, kamu diharapkan mampu:',
      bsnpRequired: true,
      objectives: [
        { icon: '🎯', text: 'Memahami konsep yang dipelajari', color: 'y' },
      ],
      profil: 'Bernalar Kritis, Gotong Royong',
      profilColor: 'g',
    }),
  },
  'motivasi': {
    type: 'motivasi',
    name: 'Motivasi / Apersepsi',
    icon: '💡',
    category: 'content',
    personality: 'reflection',
    description: 'Pertanyaan pemicu dan koneksi pengetahuan awal — BSNP apersepsi',
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi', 'dokumen'],
    propertySchema: MOTIVASI_PROPERTY_SCHEMA,
    estimatedHeight: { A: 280, B: 280, C: 280 },
    createDefault: () => ({
      title: 'Apersepsi',
      bsnpRequired: false,
      hookQuestion: 'Pernahkah kamu mengalami situasi seperti ini?',
      visual: { emoji: '🤔', bgGradient: ['y', 'c'] },
      connections: [
        { icon: '💡', label: 'Pengetahuan Awal', description: 'Apa yang sudah kamu ketahui tentang topik ini?', color: 'c' },
      ],
      transition: 'Mari kita pelajari lebih dalam!',
    }),
  },
  'rangkuman': {
    type: 'rangkuman',
    name: 'Rangkuman',
    icon: '📝',
    category: 'content',
    personality: 'reflection',
    description: 'Rangkuman konsep kunci di akhir materi — BSNP penguatan',
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A', 'B', 'C'], handlesCompression: true },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi', 'hasil'],
    propertySchema: RANGKUMAN_PROPERTY_SCHEMA,
    estimatedHeight: { A: 350, B: 350, C: 350 },
    createDefault: () => ({
      title: 'Rangkuman',
      bsnpRequired: false,
      accentColor: 'c',
      concepts: [
        { icon: '📌', title: 'Konsep Kunci', body: 'Ringkasan konsep penting yang telah dipelajari.', color: 'c' },
      ],
      closingStatement: 'Dengan memahami konsep-konsep di atas, kamu siap melanjutkan ke evaluasi!',
    }),
  },
  'memory-game': {
    type: 'memory-game',
    name: 'Game Memory',
    icon: '🧠',
    category: 'interactive',
    personality: 'activation',
    description: 'Game mencocokkan kartu tersembunyi berpasangan',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['game', 'evaluasi'],
    propertySchema: MEMORYGAME_PROPERTY_SCHEMA,
    estimatedHeight: { A: 400, B: 400, C: 400 },
    createDefault: () => ({
      title: 'Game Memory',
      pairs: [
        { left: 'Norma Agama', right: 'Aturan dari Tuhan' },
        { left: 'Norma Kesopanan', right: 'Aturan sopan santun' },
        { left: 'Norma Hukum', right: 'Aturan negara' },
      ],
      interactive: true,
    }),
  },
  'matching-game': {
    type: 'matching-game',
    name: 'Game Pasangkan',
    icon: '🔀',
    category: 'interactive',
    personality: 'assessment',
    description: 'Game mencocokkan kolom kiri dengan kolom kanan',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['game', 'evaluasi'],
    propertySchema: MATCHINGGAME_PROPERTY_SCHEMA,
    estimatedHeight: { A: 400, B: 400, C: 400 },
    createDefault: () => ({
      title: 'Game Pasangkan',
      pairs: [
        { left: 'Norma Agama', right: 'Sanksi dosa' },
        { left: 'Norma Kesopanan', right: 'Sanksi teguran' },
        { left: 'Norma Hukum', right: 'Sanksi hukuman' },
      ],
      interactive: true,
    }),
  },
  'fill-blank-game': {
    type: 'fill-blank-game',
    name: 'Game Isian',
    icon: '✏️',
    category: 'interactive',
    personality: 'assessment',
    description: 'Game mengisi jawaban singkat pada teks rumpang',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['game', 'evaluasi'],
    propertySchema: FILLBLANKGAME_PROPERTY_SCHEMA,
    estimatedHeight: { A: 350, B: 350, C: 350 },
    createDefault: () => ({
      title: 'Game Isian',
      questions: [
        { text: 'Norma yang bersumber dari Tuhan disebut norma ___', answer: 'agama', hint: 'Berkaitan dengan kepercayaan' },
        { text: 'Pelanggaran norma hukum mendapat sanksi berupa ___', answer: 'hukuman/pidana', hint: 'Diberikan oleh negara' },
      ],
      interactive: true,
    }),
  },
  'word-search-game': {
    type: 'word-search-game',
    name: 'Teka-Teki Kata',
    icon: '🔍',
    category: 'interactive',
    personality: 'assessment',
    description: 'Game mencari kata tersembunyi dalam grid huruf',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['game', 'evaluasi'],
    propertySchema: WORDSEARCHGAME_PROPERTY_SCHEMA,
    estimatedHeight: { A: 400, B: 400, C: 400 },
    createDefault: () => ({
      title: 'Teka-Teki Kata',
      words: ['NORMA', 'AGAMA', 'HUKUM', 'SOPAN', 'SUSILA'],
      gridSize: 10,
      interactive: true,
    }),
  },
  'true-false-game': {
    type: 'true-false-game',
    name: 'Benar-Salah',
    icon: '✅',
    category: 'interactive',
    personality: 'assessment',
    description: 'Game menentukan pernyataan benar atau salah',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['game', 'evaluasi'],
    propertySchema: TRUEFALSEGAME_PROPERTY_SCHEMA,
    estimatedHeight: { A: 350, B: 350, C: 350 },
    createDefault: () => ({
      title: 'Benar atau Salah?',
      questions: [
        { text: 'Norma agama bersumber dari Tuhan Yang Maha Esa', correct: true, explanation: 'Norma agama memang bersumber dari Tuhan' },
        { text: 'Pelanggaran norma kesopanan mendapat sanksi hukum', correct: false, explanation: 'Sanksi norma kesopanan berupa teguran sosial, bukan hukum' },
      ],
      interactive: true,
    }),
  },
  'drag-drop-game': {
    type: 'drag-drop-game',
    name: 'Seret & Letakkan',
    icon: '🖐️',
    category: 'interactive',
    personality: 'assessment',
    description: 'Game menempatkan item ke area target yang tepat',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['game', 'evaluasi'],
    propertySchema: DRAGDROPGAME_PROPERTY_SCHEMA,
    estimatedHeight: { A: 400, B: 400, C: 400 },
    createDefault: () => ({
      title: 'Seret & Letakkan',
      items: [
        { text: 'Sholat', target: 'agama' },
        { text: 'Teguran', target: 'sopan' },
        { text: 'Penjara', target: 'hukum' },
      ],
      targets: [
        { id: 'agama', label: 'Norma Agama', color: 'y' },
        { id: 'sopan', label: 'Norma Kesopanan', color: 'c' },
        { id: 'hukum', label: 'Norma Hukum', color: 'r' },
      ],
      interactive: true,
    }),
  },
  'crossword-game': {
    type: 'crossword-game',
    name: 'Teka Silang',
    icon: '🔤',
    category: 'interactive',
    personality: 'assessment',
    description: 'Game teka silang dengan petunjuk dan grid huruf',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['game', 'evaluasi'],
    propertySchema: CROSSWORDGAME_PROPERTY_SCHEMA,
    estimatedHeight: { A: 450, B: 450, C: 450 },
    createDefault: () => ({
      title: 'Teka Silang',
      words: [
        { teks: 'NORMA', hint: 'Aturan yang mengatur kehidupan' },
        { teks: 'AGAMA', hint: 'Norma dari Tuhan' },
        { teks: 'HUKUM', hint: 'Norma dari negara' },
      ],
      gridSize: 12,
      interactive: true,
    }),
  },
  'team-buzzer-game': {
    type: 'team-buzzer-game',
    name: 'Kuis Tim',
    icon: '🏆',
    category: 'interactive',
    personality: 'assessment',
    description: 'Game kuis berbasis tim dengan sistem buzzer',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['game', 'evaluasi'],
    propertySchema: TEAMBUZZERGAME_PROPERTY_SCHEMA,
    estimatedHeight: { A: 400, B: 400, C: 400 },
    createDefault: () => ({
      title: 'Kuis Tim',
      teamA: 'Tim Merah',
      teamB: 'Tim Biru',
      questions: [
        { teks: 'Apa yang dimaksud dengan norma agama?', poin: 10 },
        { teks: 'Sebutkan sanksi pelanggaran norma hukum!', poin: 10 },
      ],
      interactive: true,
    }),
  },
};

// ═══════════════════════════════════════════════════════════════════
// METADATA API (safe for store imports — no renderer dependency)
// ═══════════════════════════════════════════════════════════════════

/** Get block metadata by type (no renderer) */
export function getBlockMeta(type: string): BlockDefinitionMeta | undefined {
  return BLOCK_DEFINITIONS[type];
}

/** Get all block types in a category */
export function getBlocksByCategoryMeta(category: string): BlockDefinitionMeta[] {
  return Object.values(BLOCK_DEFINITIONS).filter(b => b.category === category);
}

/** Get all block types with a given personality */
export function getBlocksByPersonalityMeta(personality: BlockPersonality): BlockDefinitionMeta[] {
  return Object.values(BLOCK_DEFINITIONS).filter(b => b.personality === personality);
}

/** Get all block types used in a template */
export function getBlocksForTemplateTypeMeta(templateType: string): BlockDefinitionMeta[] {
  return Object.values(BLOCK_DEFINITIONS).filter(b =>
    b.usedInTemplates.includes(templateType) || b.usedInTemplates.includes('all')
  );
}

/** Check if a block type is registered */
export function isBlockRegisteredMeta(type: string): boolean {
  return type in BLOCK_DEFINITIONS;
}

/** Get capabilities for a block type */
export function getBlockCapabilitiesMeta(type: string): BlockCapabilities {
  return BLOCK_DEFINITIONS[type]?.capabilities ?? DEFAULT_CAPABILITIES;
}

/** Get property schema for a block type */
export function getBlockPropertySchemaMeta(type: string): PropertySchema | undefined {
  return BLOCK_DEFINITIONS[type]?.propertySchema;
}

/** Get all registered block metadata */
export function getAllBlockMeta(): BlockDefinitionMeta[] {
  return Object.values(BLOCK_DEFINITIONS);
}
