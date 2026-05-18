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
//
// ═══════════════════════════════════════════════════════════════════
// ARCHITECTURE NOTE (Circular Dependency Fix):
// Block metadata (type, name, icon, capabilities, etc.) is defined
// in BlockDefinitionRegistry.ts — a RENDERER-FREE module that is
// safe to import from store modules. This file adds the React
// renderer components on top. DO NOT import this file from store
// modules — use BlockDefinitionRegistry instead.
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import type { PropertySchema } from '../editor/types';

// Re-export types and metadata from the renderer-free registry
export {
  BLOCK_DEFINITIONS,
  DEFAULT_CAPABILITIES,
  PERSONALITY_CONFIG,
  getBlockMeta,
  getBlocksByCategoryMeta,
  getBlocksByPersonalityMeta,
  getBlocksForTemplateTypeMeta,
  isBlockRegisteredMeta,
  getBlockCapabilitiesMeta,
  getBlockPropertySchemaMeta,
  getAllBlockMeta,
} from './BlockDefinitionRegistry';
export type {
  BlockCapabilities,
  SceneBlockLayout,
  BlockDefinitionMeta,
  BlockPersonality,
} from './BlockDefinitionRegistry';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

import type { BlockDefinitionMeta, BlockCapabilities } from './BlockDefinitionRegistry';

export interface BlockDefinition extends BlockDefinitionMeta {
  /** Renderer component — uses `any` because each renderer has specific block type props.
   *  The registry guarantees type-safe mapping: block.type → correct renderer.
   */
  renderer: React.ComponentType<any>;
}

// ═══════════════════════════════════════════════════════════════════
// BLOCK RENDERER IMPORTS
// ═══════════════════════════════════════════════════════════════════
// Each renderer is now in its own file under ../renderer/blocks/
// The registry maps block types directly to these renderers.
//
// PERFORMANCE: Heavy game renderers are lazy-loaded via React.lazy()
// to reduce initial bundle size. Light renderers are eagerly imported.
// ═══════════════════════════════════════════════════════════════════

// ── Eager imports (lightweight, frequently used) ─────────────────
import {
  CoverRenderer,
  PetunjukRenderer,
  TpRenderer,
  AlurRenderer,
  DefBoxRenderer,
  NcGridRenderer,
  FlashcardRenderer,
  FtabRenderer,
  NormaKartuRenderer,
  DiskusiRenderer,
  KuisRenderer,
  HasilRenderer,
  RefleksiRenderer,
  PenutupRenderer,
  TabelAccordionRenderer,
  TujuanDisplayRenderer,
  MotivasiRenderer,
  RangkumanRenderer,
  MateriBlokRenderer,
  GambarRenderer,
  TimelineRenderer,
  CompareRenderer,
  RevealRenderer,
} from '../renderer/blocks';

// ── Lazy imports (heavy game renderers — all games are lazy-loaded) ──
const SortirGameRenderer = React.lazy(() =>
  import('../renderer/blocks/SortirGameRenderer').then(m => ({ default: m.SortirGameRenderer }))
);
const RodaGameRenderer = React.lazy(() =>
  import('../renderer/blocks/RodaGameRenderer').then(m => ({ default: m.RodaGameRenderer }))
);
const MemoryGameRenderer = React.lazy(() =>
  import('../renderer/blocks/MemoryGameRenderer').then(m => ({ default: m.MemoryGameRenderer }))
);
const MatchingGameRenderer = React.lazy(() =>
  import('../renderer/blocks/MatchingGameRenderer').then(m => ({ default: m.MatchingGameRenderer }))
);
const FillBlankGameRenderer = React.lazy(() =>
  import('../renderer/blocks/FillBlankGameRenderer').then(m => ({ default: m.FillBlankGameRenderer }))
);
const WordSearchGameRenderer = React.lazy(() =>
  import('../renderer/blocks/WordSearchGameRenderer').then(m => ({ default: m.WordSearchGameRenderer }))
);
const TrueFalseGameRenderer = React.lazy(() =>
  import('../renderer/blocks/TrueFalseGameRenderer').then(m => ({ default: m.TrueFalseGameRenderer }))
);
const DragDropGameRenderer = React.lazy(() =>
  import('../renderer/blocks/DragDropGameRenderer').then(m => ({ default: m.DragDropGameRenderer }))
);
const CrosswordGameRenderer = React.lazy(() =>
  import('../renderer/blocks/CrosswordGameRenderer').then(m => ({ default: m.CrosswordGameRenderer }))
);
const TeamBuzzerGameRenderer = React.lazy(() =>
  import('../renderer/blocks/TeamBuzzerGameRenderer').then(m => ({ default: m.TeamBuzzerGameRenderer }))
);
const MateriSectionRenderer = React.lazy(() =>
  import('../renderer/blocks/MateriSectionRenderer').then(m => ({ default: m.MateriSectionRenderer }))
);
const SkenarioRenderer = React.lazy(() =>
  import('../renderer/blocks/SkenarioRenderer').then(m => ({ default: m.SkenarioRenderer }))
);

import { BLOCK_DEFINITIONS, DEFAULT_CAPABILITIES } from './BlockDefinitionRegistry';

// ═══════════════════════════════════════════════════════════════════
// RENDERER MAP — Maps block types to their React renderer components
// ═══════════════════════════════════════════════════════════════════

const RENDERER_MAP: Record<string, React.ComponentType<any>> = {
  'cover': CoverRenderer,
  'hero': CoverRenderer, // Hero shares Cover's data model & renderer
  'petunjuk': PetunjukRenderer,
  'tp': TpRenderer,
  'alur': AlurRenderer,
  'skenario': SkenarioRenderer,
  'def-box': DefBoxRenderer,
  'nc-grid': NcGridRenderer,
  'flashcard-set': FlashcardRenderer,
  'ftab': FtabRenderer,
  'nk-card': NormaKartuRenderer,
  'diskusi': DiskusiRenderer,
  'kuis': KuisRenderer,
  'sortir-game': SortirGameRenderer,
  'roda-game': RodaGameRenderer,
  'hasil': HasilRenderer,
  'refleksi': RefleksiRenderer,
  'penutup': PenutupRenderer,
  'tabel-accord': TabelAccordionRenderer,
  'materi-section': MateriSectionRenderer,
  'tujuan-display': TujuanDisplayRenderer,
  'motivasi': MotivasiRenderer,
  'rangkuman': RangkumanRenderer,
  'materi-blok': MateriBlokRenderer,
  'gambar': GambarRenderer,
  'timeline': TimelineRenderer,
  'compare': CompareRenderer,
  'reveal': RevealRenderer,
  'memory-game': MemoryGameRenderer,
  'matching-game': MatchingGameRenderer,
  'fill-blank-game': FillBlankGameRenderer,
  'word-search-game': WordSearchGameRenderer,
  'true-false-game': TrueFalseGameRenderer,
  'drag-drop-game': DragDropGameRenderer,
  'crossword-game': CrosswordGameRenderer,
  'team-buzzer-game': TeamBuzzerGameRenderer,
};

// ═══════════════════════════════════════════════════════════════════
// BLOCK REGISTRY — Composed from metadata + renderers
// ═══════════════════════════════════════════════════════════════════

export const SCENE_REGISTRY: Record<string, BlockDefinition> = Object.fromEntries(
  Object.entries(BLOCK_DEFINITIONS).map(([type, meta]) => [
    type,
    {
      ...meta,
      renderer: RENDERER_MAP[type] ?? (() => null), // Fallback: render nothing
    },
  ])
);

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

/** Get all block types with a given personality */
export function getBlocksByPersonality(personality: string): BlockDefinition[] {
  return Object.values(SCENE_REGISTRY).filter(b => b.personality === personality);
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
