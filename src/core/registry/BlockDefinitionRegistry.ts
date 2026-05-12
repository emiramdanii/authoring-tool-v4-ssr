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

import {
  COVER_PROPERTY_SCHEMA,
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
  HASIL_PROPERTY_SCHEMA,
  REFLEKSI_PROPERTY_SCHEMA,
  PENUTUP_PROPERTY_SCHEMA,
  TABELACCORD_PROPERTY_SCHEMA,
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
  description: string;
  capabilities: BlockCapabilities;
  defaultLayout: SceneBlockLayout;
  usedInTemplates: string[];
  propertySchema: PropertySchema;
  createDefault: () => Record<string, unknown>;
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
    description: 'Halaman judul dengan icon, title, badges, dan CTA',
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A', 'B', 'C'], movable: false, resizable: false },
    defaultLayout: { position: 'absolute', defaultX: 0, defaultY: 0, defaultWidth: 100, defaultHeight: 100, zIndex: 0 },
    usedInTemplates: ['cover'],
    propertySchema: COVER_PROPERTY_SCHEMA,
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
  'petunjuk': {
    type: 'petunjuk',
    name: 'Petunjuk',
    icon: '📌',
    category: 'content',
    description: 'Petunjuk penggunaan dengan grid item dan tips',
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['petunjuk'],
    propertySchema: PETUNJUK_PROPERTY_SCHEMA,
    createDefault: () => ({
      title: 'Petunjuk',
      titleHighlight: 'Penggunaan',
      items: [{ icon: '📌', title: 'Item 1', body: 'Deskripsi item' }],
    }),
  },
  'tp': {
    type: 'tp',
    name: 'Tujuan Pembelajaran',
    icon: '🎯',
    category: 'content',
    description: 'Daftar tujuan pembelajaran dengan nomor dan profil',
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['dokumen'],
    propertySchema: TP_PROPERTY_SCHEMA,
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
    description: 'Timeline vertikal kegiatan pembelajaran',
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['dokumen'],
    propertySchema: ALUR_PROPERTY_SCHEMA,
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
    description: 'Cerita interaktif dengan pilihan dan konsekuensi',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['skenario'],
    propertySchema: SKENARIO_PROPERTY_SCHEMA,
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
    description: 'Kotak definisi dengan border accent',
    capabilities: { ...DEFAULT_CAPABILITIES, backgroundCustom: true, resizable: true, movable: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi'],
    propertySchema: DEFBOX_PROPERTY_SCHEMA,
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
    description: 'Grid kartu dengan icon, title, body',
    capabilities: { ...DEFAULT_CAPABILITIES, resizable: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi', 'diskusi'],
    propertySchema: NCGRID_PROPERTY_SCHEMA,
    createDefault: () => ({
      cards: [{ icon: '📋', title: 'Kartu 1', body: 'Deskripsi kartu', color: 'y' }],
    }),
  },
  'flashcard-set': {
    type: 'flashcard-set',
    name: 'Kartu Kilat',
    icon: '🃏',
    category: 'interactive',
    description: 'Set kartu kilat flip dengan navigasi',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi'],
    propertySchema: FLASHCARD_PROPERTY_SCHEMA,
    createDefault: () => ({
      cards: [{ q: 'Pertanyaan?', a: 'Jawaban' }],
    }),
  },
  'ftab': {
    type: 'ftab',
    name: 'Tab Fungsi',
    icon: '📑',
    category: 'navigation',
    description: 'Tab konten dengan read marker dan progress',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, composite: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi'],
    propertySchema: FTAB_PROPERTY_SCHEMA,
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
    description: 'Kartu detail jenis norma dengan sanksi dan contoh',
    capabilities: { ...DEFAULT_CAPABILITIES, backgroundCustom: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi'],
    propertySchema: NKCARD_PROPERTY_SCHEMA,
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
    description: 'Pertanyaan diskusi dengan area jawaban',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A', 'B'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['diskusi'],
    propertySchema: DISKUSI_PROPERTY_SCHEMA,
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
    description: 'Kuis pilihan ganda dengan feedback',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['kuis'],
    propertySchema: KUIS_PROPERTY_SCHEMA,
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
    description: 'Game mengelompokkan kartu ke kolom',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['game'],
    propertySchema: SORTIRGAME_PROPERTY_SCHEMA,
    createDefault: () => ({
      title: 'Game Sortir',
      pool: [{ id: 's1', text: 'Item 1', category: 'kolom-1' }],
      kolom: [{ id: 'kolom-1', label: 'Kolom 1', color: 'y' }],
      interactive: true,
    }),
  },
  'roda-game': {
    type: 'roda-game',
    name: 'Game Roda',
    icon: '🎡',
    category: 'interactive',
    description: 'Game roda putar dengan pertanyaan',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['game'],
    propertySchema: RODAGAME_PROPERTY_SCHEMA,
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
    description: 'Tampilan skor dan apresiasi',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['hasil'],
    propertySchema: HASIL_PROPERTY_SCHEMA,
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
    description: 'Refleksi diri dengan pertanyaan dan penugasan',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['refleksi'],
    propertySchema: REFLEKSI_PROPERTY_SCHEMA,
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
    description: 'Penutup dengan preview pertemuan berikutnya',
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['penutup'],
    propertySchema: PENUTUP_PROPERTY_SCHEMA,
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
    description: 'Tabel accordion dengan expandable rows',
    capabilities: { ...DEFAULT_CAPABILITIES, interactive: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi'],
    propertySchema: TABELACCORD_PROPERTY_SCHEMA,
    createDefault: () => ({
      rows: [{ icon: '📊', title: 'Baris 1', color: 'y', details: [{ label: 'Label', value: 'Nilai' }] }],
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
