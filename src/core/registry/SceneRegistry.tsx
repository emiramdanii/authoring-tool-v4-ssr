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
import type { SchemaBlock } from '../schema/types';
import type { SchemaRenderMode, TokenResolver } from '../renderer/types';

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
  /** Renderer component — uses `any` because each renderer has specific block type props.
   *  The registry guarantees type-safe mapping: block.type → correct renderer.
   *  The generic BlockRendererProps is only used by RegistryBlockRenderer wrapper.
   */
  renderer: React.ComponentType<any>;
}

// ═══════════════════════════════════════════════════════════════════
// BLOCK RENDERER PROPS
// ═══════════════════════════════════════════════════════════════════

export interface BlockRendererProps {
  block: SchemaBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
  isCompact?: boolean;
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
    renderer: CoverRenderer,
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
    renderer: PetunjukRenderer,
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
    renderer: TpRenderer,
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
    renderer: AlurRenderer,
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
    renderer: SkenarioRenderer,
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
    renderer: DefBoxRenderer,
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
    renderer: NcGridRenderer,
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
    renderer: FlashcardRenderer,
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
    renderer: FtabRenderer,
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
    renderer: NormaKartuRenderer,
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
    renderer: DiskusiRenderer,
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
    renderer: KuisRenderer,
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
    renderer: SortirGameRenderer,
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
    renderer: RodaGameRenderer,
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
    renderer: HasilRenderer,
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
    renderer: RefleksiRenderer,
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
    renderer: PenutupRenderer,
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
    renderer: TabelAccordionRenderer,
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

/** Render a block using the registry */
export function RegistryBlockRenderer({ block, mode, tokens, interactive }: {
  block: SchemaBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
}) {
  const definition = SCENE_REGISTRY[block.type];

  if (!definition) {
    // Fallback: unknown block type
    return (
      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
        Unknown block type: {block.type}
      </div>
    );
  }

  const BlockComponent = definition.renderer;
  const isCompact = mode === 'canvas';

  return (
    <BlockComponent
      block={block}
      mode={mode}
      tokens={tokens}
      interactive={interactive}
      isCompact={isCompact}
    />
  );
}
