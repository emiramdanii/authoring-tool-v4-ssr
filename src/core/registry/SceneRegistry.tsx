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
// BLOCK RENDERER IMPORTS — ALL LAZY
// ═══════════════════════════════════════════════════════════════════
// ALL block renderers are lazy-loaded via React.lazy() to minimize
// the initial bundle. SchemaBlockRenderer wraps each block in
// <React.Suspense>, so this is a drop-in optimization.
// ═══════════════════════════════════════════════════════════════════

// ── Content & structure renderers ────────────────────────────────
const CoverRenderer = React.lazy(() =>
  import('../renderer/blocks/CoverRenderer').then(m => ({ default: m.CoverRenderer }))
);
const HeroRenderer = React.lazy(() =>
  import('../renderer/blocks/HeroRenderer').then(m => ({ default: m.HeroRenderer }))
);
const PetunjukRenderer = React.lazy(() =>
  import('../renderer/blocks/PetunjukRenderer').then(m => ({ default: m.PetunjukRenderer }))
);
const TpRenderer = React.lazy(() =>
  import('../renderer/blocks/TpRenderer').then(m => ({ default: m.TpRenderer }))
);
const AlurRenderer = React.lazy(() =>
  import('../renderer/blocks/AlurRenderer').then(m => ({ default: m.AlurRenderer }))
);
const SkenarioRenderer = React.lazy(() =>
  import('../renderer/blocks/SkenarioRenderer').then(m => ({ default: m.SkenarioRenderer }))
);
const DefBoxRenderer = React.lazy(() =>
  import('../renderer/blocks/DefBoxRenderer').then(m => ({ default: m.DefBoxRenderer }))
);
const NcGridRenderer = React.lazy(() =>
  import('../renderer/blocks/NcGridRenderer').then(m => ({ default: m.NcGridRenderer }))
);
const FlashcardRenderer = React.lazy(() =>
  import('../renderer/blocks/FlashcardRenderer').then(m => ({ default: m.FlashcardRenderer }))
);
const FtabRenderer = React.lazy(() =>
  import('../renderer/blocks/FtabRenderer').then(m => ({ default: m.FtabRenderer }))
);
const NormaKartuRenderer = React.lazy(() =>
  import('../renderer/blocks/NormaKartuRenderer').then(m => ({ default: m.NormaKartuRenderer }))
);
const DiskusiRenderer = React.lazy(() =>
  import('../renderer/blocks/DiskusiRenderer').then(m => ({ default: m.DiskusiRenderer }))
);
const KuisRenderer = React.lazy(() =>
  import('../renderer/blocks/KuisRenderer').then(m => ({ default: m.KuisRenderer }))
);
const HasilRenderer = React.lazy(() =>
  import('../renderer/blocks/HasilRenderer').then(m => ({ default: m.HasilRenderer }))
);
const RefleksiRenderer = React.lazy(() =>
  import('../renderer/blocks/RefleksiRenderer').then(m => ({ default: m.RefleksiRenderer }))
);
const PenutupRenderer = React.lazy(() =>
  import('../renderer/blocks/PenutupRenderer').then(m => ({ default: m.PenutupRenderer }))
);
const TabelAccordionRenderer = React.lazy(() =>
  import('../renderer/blocks/TabelAccordionRenderer').then(m => ({ default: m.TabelAccordionRenderer }))
);
const MateriSectionRenderer = React.lazy(() =>
  import('../renderer/blocks/MateriSectionRenderer').then(m => ({ default: m.MateriSectionRenderer }))
);
const TujuanDisplayRenderer = React.lazy(() =>
  import('../renderer/blocks/TujuanDisplayRenderer').then(m => ({ default: m.TujuanDisplayRenderer }))
);
const MotivasiRenderer = React.lazy(() =>
  import('../renderer/blocks/MotivasiRenderer').then(m => ({ default: m.MotivasiRenderer }))
);
const RangkumanRenderer = React.lazy(() =>
  import('../renderer/blocks/RangkumanRenderer').then(m => ({ default: m.RangkumanRenderer }))
);
const MateriBlokRenderer = React.lazy(() =>
  import('../renderer/blocks/MateriBlokRenderer').then(m => ({ default: m.MateriBlokRenderer }))
);
const GambarRenderer = React.lazy(() =>
  import('../renderer/blocks/GambarRenderer').then(m => ({ default: m.GambarRenderer }))
);
const TimelineRenderer = React.lazy(() =>
  import('../renderer/blocks/TimelineRenderer').then(m => ({ default: m.TimelineRenderer }))
);
const CompareRenderer = React.lazy(() =>
  import('../renderer/blocks/CompareRenderer').then(m => ({ default: m.CompareRenderer }))
);
const RevealRenderer = React.lazy(() =>
  import('../renderer/blocks/RevealRenderer').then(m => ({ default: m.RevealRenderer }))
);
const TabelRenderer = React.lazy(() =>
  import('../renderer/blocks/TabelRenderer').then(m => ({ default: m.TabelRenderer }))
);
const ChecklistRenderer = React.lazy(() =>
  import('../renderer/blocks/ChecklistRenderer').then(m => ({ default: m.ChecklistRenderer }))
);
const StatistikRenderer = React.lazy(() =>
  import('../renderer/blocks/StatistikRenderer').then(m => ({ default: m.StatistikRenderer }))
);
const StudiRenderer = React.lazy(() =>
  import('../renderer/blocks/StudiRenderer').then(m => ({ default: m.StudiRenderer }))
);

// ── Presentation module renderers (Phase 5-G dedicated) ─────────
const TabIconsRenderer = React.lazy(() =>
  import('../renderer/blocks/TabIconsRenderer').then(m => ({ default: m.TabIconsRenderer }))
);
const AccordionRenderer = React.lazy(() =>
  import('../renderer/blocks/AccordionRenderer').then(m => ({ default: m.AccordionRenderer }))
);
const InfografisRenderer = React.lazy(() =>
  import('../renderer/blocks/InfografisRenderer').then(m => ({ default: m.InfografisRenderer }))
);

// ── Game renderers (heavy — lazy-loaded) ─────────────────────────
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

import { BLOCK_DEFINITIONS, DEFAULT_CAPABILITIES } from './BlockDefinitionRegistry';

// ═══════════════════════════════════════════════════════════════════
// RENDERER MAP — Maps block types to their React renderer components
// ═══════════════════════════════════════════════════════════════════

const RENDERER_MAP: Record<string, React.ComponentType<any>> = {
  'cover': CoverRenderer,
  'hero': HeroRenderer, // Hero has its own dedicated banner renderer
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
  'tabel': TabelRenderer,
  'checklist': ChecklistRenderer,
  'statistik': StatistikRenderer,
  'studi': StudiRenderer,
  'memory-game': MemoryGameRenderer,
  'matching-game': MatchingGameRenderer,
  'fill-blank-game': FillBlankGameRenderer,
  'word-search-game': WordSearchGameRenderer,
  'true-false-game': TrueFalseGameRenderer,
  'drag-drop-game': DragDropGameRenderer,
  'crossword-game': CrosswordGameRenderer,
  'team-buzzer-game': TeamBuzzerGameRenderer,
  'tab-icons': TabIconsRenderer,
  'accordion': AccordionRenderer,
  'infografis': InfografisRenderer,
  // Sprint 8.8B / 3B: Hotspot Image renderer
  'hotspot-image': React.lazy(() =>
    import('../renderer/blocks/HotspotImageRenderer').then(m => ({ default: m.HotspotImageRenderer }))
  ),
};

// ═══════════════════════════════════════════════════════════════════
// BLOCK REGISTRY — Composed from metadata + renderers
// ═══════════════════════════════════════════════════════════════════

// ── Unregistered Renderer Warning ────────────────────────────────
// When a block type is in BLOCK_DEFINITIONS but NOT in RENDERER_MAP,
// this component renders a dev-visible warning instead of silently
// rendering nothing (which was the old `() => null` behavior).
// In production, it renders nothing to avoid leaking internals.
function UnregisteredRenderer({ block }: { block: { type: string } }) {
  if (process.env.NODE_ENV === 'production') return null;
  return React.createElement('div', {
    className: 'p-2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-700 text-[10px] font-bold',
  }, `\u26A0 Renderer belum terdaftar untuk blok "${block.type}" — tambahkan ke RENDERER_MAP di SceneRegistry.tsx`);
}

export const SCENE_REGISTRY: Record<string, BlockDefinition> = Object.fromEntries(
  Object.entries(BLOCK_DEFINITIONS).map(([type, meta]) => [
    type,
    {
      ...meta,
      renderer: RENDERER_MAP[type] ?? ((props: { block: { type: string } }) => <UnregisteredRenderer block={props.block} />),
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
