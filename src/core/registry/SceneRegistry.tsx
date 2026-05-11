// ═══════════════════════════════════════════════════════════════════
// SCENE REGISTRY — Block type definitions with renderers & capabilities
// ═══════════════════════════════════════════════════════════════════
// This replaces the hardcoded switch(block.type) in SchemaBlockRenderer.
// Each block type is registered with:
//   - renderer: the React component that renders it
//   - capabilities: what the editor can do with this block
//   - defaultLayout: positioning defaults
//   - category: for grouping in the editor UI
//
// New block types can be added by simply registering them here.
// No need to modify SchemaBlockRenderer anymore.

import React from 'react';
// Note: SchemaBlock & TokenResolver types available from sibling modules if needed
import type { PropertySchema } from '../editor/types';

// ═══════════════════════════════════════════════════════════════════
// BLOCK CAPABILITIES
// ═══════════════════════════════════════════════════════════════════

export interface BlockCapabilities {
  /** Can this block be edited in the canvas? */
  editable: boolean;
  /** Can this block be resized? */
  resizable: boolean;
  /** Can this block be repositioned? */
  movable: boolean;
  /** Can this block have a custom background? */
  backgroundCustom: boolean;
  /** Is this block interactive (has state/score tracking)? */
  interactive: boolean;
  /** Can this block be auto-generated? */
  autoGeneratable: boolean;
  /** Does this block support children (composite)? */
  composite: boolean;
  /** Supported variants */
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

// ═══════════════════════════════════════════════════════════════════
// BLOCK LAYOUT DEFAULTS
// ═══════════════════════════════════════════════════════════════════

export interface SceneBlockLayout {
  /** Layout strategy: flow (flexbox) or absolute (coordinate-based) */
  position: 'flow' | 'absolute';
  /** Default width in % (only for absolute) */
  defaultWidth?: number;
  /** Default height in % (only for absolute) */
  defaultHeight?: number;
  /** Default x position in % (only for absolute) */
  defaultX?: number;
  /** Default y position in % (only for absolute) */
  defaultY?: number;
  /** Z-index layer */
  zIndex?: number;
}

// ═══════════════════════════════════════════════════════════════════
// BLOCK DEFINITION
// ═══════════════════════════════════════════════════════════════════

export interface BlockDefinition {
  /** Block type identifier (matches SchemaBlock.type) */
  type: string;
  /** Human-readable name */
  name: string;
  /** Icon for the editor UI */
  icon: string;
  /** Category for grouping */
  category: 'layout' | 'content' | 'interactive' | 'navigation' | 'feedback' | 'decoration';
  /** Description */
  description: string;
  /** What this block can do */
  capabilities: BlockCapabilities;
  /** Default layout */
  defaultLayout: SceneBlockLayout;
  /** Which template types commonly use this block */
  usedInTemplates: string[];
  /** Property schema for dynamic editing — auto-generates the property panel form */
  propertySchema: PropertySchema;
  /** Renderer component — uses `any` because each renderer has specific block type props.
   *  The registry guarantees type-safe mapping: block.type → correct renderer.
   */
  renderer: React.ComponentType<any>;
  /** Factory function that creates default content for a new block of this type.
   *  Returns a partial block object (without `id`, `type`, `variant`, `layout`
   *  which are added by addSchemaBlock).
   */
  createDefault: () => Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════
// BLOCK RENDERER IMPORTS
// ═══════════════════════════════════════════════════════════════════
// Each renderer is now in its own file under ../renderer/blocks/
// The registry maps block types directly to these renderers.

import {
  CoverRenderer,
  PetunjukRenderer,
  TpRenderer,
  AlurRenderer,
  SkenarioRenderer,
  DefBoxRenderer,
  NcGridRenderer,
  FlashcardRenderer,
  FtabRenderer,
  NormaKartuRenderer,
  DiskusiRenderer,
  KuisRenderer,
  SortirGameRenderer,
  RodaGameRenderer,
  HasilRenderer,
  RefleksiRenderer,
  PenutupRenderer,
  TabelAccordionRenderer,
} from '../renderer/blocks';

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
// BLOCK REGISTRY
// ═══════════════════════════════════════════════════════════════════

export const SCENE_REGISTRY: Record<string, BlockDefinition> = {
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
    renderer: CoverRenderer,
    createDefault: () => ({
      icon: '📄',
      title: 'Judul Baru',
      subtitle: 'Subtitle',
      badges: [],
      cta: { label: 'Mulai →', action: 'next' },
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
    renderer: PetunjukRenderer,
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
    renderer: TpRenderer,
    createDefault: () => ({
      title: 'Tujuan Pembelajaran',
      titleHighlight: '',
      items: [{ num: 1, verb: 'Memahami', desc: 'Deskripsi tujuan', color: 'y' }],
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
    renderer: AlurRenderer,
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
    renderer: SkenarioRenderer,
    createDefault: () => ({
      title: 'Skenario',
      chapters: [{ id: 'ch1', charEmoji: '🎭', title: 'Bab 1', choices: [] }],
    }),
  },
  'def-box': {
    type: 'def-box',
    name: 'Definisi',
    icon: '📖',
    category: 'content',
    description: 'Kotak definisi dengan border accent',
    capabilities: { ...DEFAULT_CAPABILITIES, backgroundCustom: true, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi'],
    propertySchema: DEFBOX_PROPERTY_SCHEMA,
    renderer: DefBoxRenderer,
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
    capabilities: { ...DEFAULT_CAPABILITIES, variants: ['A'] },
    defaultLayout: { position: 'flow' },
    usedInTemplates: ['materi', 'diskusi'],
    propertySchema: NCGRID_PROPERTY_SCHEMA,
    renderer: NcGridRenderer,
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
    renderer: FlashcardRenderer,
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
    renderer: FtabRenderer,
    createDefault: () => ({
      tabs: [{ icon: '📑', label: 'Tab 1', content: [] }],
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
    renderer: NormaKartuRenderer,
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
    renderer: DiskusiRenderer,
    createDefault: () => ({
      title: 'Diskusi',
      questions: [{ label: '1', icon: '💬', teks: 'Pertanyaan diskusi?', petunjuk: 'Petunjuk jawaban' }],
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
    renderer: KuisRenderer,
    createDefault: () => ({
      title: 'Kuis',
      questions: [{ q: 'Pertanyaan?', opts: ['A', 'B', 'C'], ans: 0, ex: 'Penjelasan' }],
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
    renderer: SortirGameRenderer,
    createDefault: () => ({
      title: 'Game Sortir',
      pool: [],
      kolom: [],
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
    renderer: RodaGameRenderer,
    createDefault: () => ({
      title: 'Game Roda',
      questions: [],
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
    renderer: HasilRenderer,
    createDefault: () => ({
      title: 'Hasil',
      subtitle: 'Subtitle hasil',
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
    renderer: RefleksiRenderer,
    createDefault: () => ({
      title: 'Refleksi',
      questions: [{ teks: 'Pertanyaan refleksi?', petunjuk: 'Petunjuk refleksi' }],
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
    renderer: PenutupRenderer,
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
    renderer: TabelAccordionRenderer,
    createDefault: () => ({
      rows: [{ icon: '📊', title: 'Baris 1', color: 'y', details: [] }],
    }),
  },
};

// ═══════════════════════════════════════════════════════════════════
// REGISTRY API
// ═══════════════════════════════════════════════════════════════════

/** Get block definition by type */
export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return SCENE_REGISTRY[type];
}

/** Get all block types in a category */
export function getBlocksByCategory(category: string): BlockDefinition[] {
  return Object.values(SCENE_REGISTRY).filter(b => b.category === category);
}

/** Get all block types used in a template */
export function getBlocksForTemplateType(templateType: string): BlockDefinition[] {
  return Object.values(SCENE_REGISTRY).filter(b =>
    b.usedInTemplates.includes(templateType) || b.usedInTemplates.includes('all')
  );
}

/** Check if a block type is registered */
export function isBlockRegistered(type: string): boolean {
  return type in SCENE_REGISTRY;
}

/** Get capabilities for a block type */
export function getBlockCapabilities(type: string): BlockCapabilities {
  return SCENE_REGISTRY[type]?.capabilities ?? DEFAULT_CAPABILITIES;
}

/** Get property schema for a block type (for dynamic editing).
 *  Returns undefined only if the block type is not registered at all. */
export function getBlockPropertySchema(type: string): PropertySchema | undefined {
  return SCENE_REGISTRY[type]?.propertySchema;
}

/** Get all registered block definitions */
export function getAllBlockDefinitions(): BlockDefinition[] {
  return Object.values(SCENE_REGISTRY);
}


