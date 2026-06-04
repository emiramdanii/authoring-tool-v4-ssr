// ═══════════════════════════════════════════════════════════════════
// LAZY RENDERER WRAPPER — Code-split renderer loading
// ═══════════════════════════════════════════════════════════════════
// Instead of importing ALL 30 renderers eagerly, this module provides
// lazy-loaded versions. Each renderer is only loaded when it's needed,
// reducing the initial JavaScript bundle size.
//
// Usage:
//   import { LazyRenderer } from './RendererLazy';
//   <LazyRenderer type="kuis" props={{ block, tokens, ... }} />
// ═══════════════════════════════════════════════════════════════════

import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';

// ── Lazy load each renderer ───────────────────────────────────────
// Using named export extraction because each file uses named exports

const LazyCoverRenderer = lazy(() => import('./blocks/CoverRenderer').then(m => ({ default: m.CoverRenderer })));
const LazyPetunjukRenderer = lazy(() => import('./blocks/PetunjukRenderer').then(m => ({ default: m.PetunjukRenderer })));
const LazyTpRenderer = lazy(() => import('./blocks/TpRenderer').then(m => ({ default: m.TpRenderer })));
const LazyAlurRenderer = lazy(() => import('./blocks/AlurRenderer').then(m => ({ default: m.AlurRenderer })));
const LazySkenarioRenderer = lazy(() => import('./blocks/SkenarioRenderer').then(m => ({ default: m.SkenarioRenderer })));
const LazyDefBoxRenderer = lazy(() => import('./blocks/DefBoxRenderer').then(m => ({ default: m.DefBoxRenderer })));
const LazyNcGridRenderer = lazy(() => import('./blocks/NcGridRenderer').then(m => ({ default: m.NcGridRenderer })));
const LazyFlashcardRenderer = lazy(() => import('./blocks/FlashcardRenderer').then(m => ({ default: m.FlashcardRenderer })));
const LazyFtabRenderer = lazy(() => import('./blocks/FtabRenderer').then(m => ({ default: m.FtabRenderer })));
const LazyNormaKartuRenderer = lazy(() => import('./blocks/NormaKartuRenderer').then(m => ({ default: m.NormaKartuRenderer })));
const LazyDiskusiRenderer = lazy(() => import('./blocks/DiskusiRenderer').then(m => ({ default: m.DiskusiRenderer })));
const LazyKuisRenderer = lazy(() => import('./blocks/KuisRenderer').then(m => ({ default: m.KuisRenderer })));
const LazySortirGameRenderer = lazy(() => import('./blocks/SortirGameRenderer').then(m => ({ default: m.SortirGameRenderer })));
const LazyRodaGameRenderer = lazy(() => import('./blocks/RodaGameRenderer').then(m => ({ default: m.RodaGameRenderer })));
const LazyHasilRenderer = lazy(() => import('./blocks/HasilRenderer').then(m => ({ default: m.HasilRenderer })));
const LazyRefleksiRenderer = lazy(() => import('./blocks/RefleksiRenderer').then(m => ({ default: m.RefleksiRenderer })));
const LazyPenutupRenderer = lazy(() => import('./blocks/PenutupRenderer').then(m => ({ default: m.PenutupRenderer })));
const LazyTabelAccordionRenderer = lazy(() => import('./blocks/TabelAccordionRenderer').then(m => ({ default: m.TabelAccordionRenderer })));
const LazyMateriSectionRenderer = lazy(() => import('./blocks/MateriSectionRenderer').then(m => ({ default: m.MateriSectionRenderer })));
const LazyTujuanDisplayRenderer = lazy(() => import('./blocks/TujuanDisplayRenderer').then(m => ({ default: m.TujuanDisplayRenderer })));
const LazyMotivasiRenderer = lazy(() => import('./blocks/MotivasiRenderer').then(m => ({ default: m.MotivasiRenderer })));
const LazyRangkumanRenderer = lazy(() => import('./blocks/RangkumanRenderer').then(m => ({ default: m.RangkumanRenderer })));
const LazyMemoryGameRenderer = lazy(() => import('./blocks/MemoryGameRenderer').then(m => ({ default: m.MemoryGameRenderer })));
const LazyMatchingGameRenderer = lazy(() => import('./blocks/MatchingGameRenderer').then(m => ({ default: m.MatchingGameRenderer })));
const LazyFillBlankGameRenderer = lazy(() => import('./blocks/FillBlankGameRenderer').then(m => ({ default: m.FillBlankGameRenderer })));
const LazyWordSearchGameRenderer = lazy(() => import('./blocks/WordSearchGameRenderer').then(m => ({ default: m.WordSearchGameRenderer })));
const LazyTrueFalseGameRenderer = lazy(() => import('./blocks/TrueFalseGameRenderer').then(m => ({ default: m.TrueFalseGameRenderer })));
const LazyDragDropGameRenderer = lazy(() => import('./blocks/DragDropGameRenderer').then(m => ({ default: m.DragDropGameRenderer })));
const LazyCrosswordGameRenderer = lazy(() => import('./blocks/CrosswordGameRenderer').then(m => ({ default: m.CrosswordGameRenderer })));
const LazyTeamBuzzerGameRenderer = lazy(() => import('./blocks/TeamBuzzerGameRenderer').then(m => ({ default: m.TeamBuzzerGameRenderer })));

// ── Map of lazy renderers ─────────────────────────────────────────
// Key = block type string, Value = lazy-loaded component

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Each renderer has specific block-type props; the map guarantees type-safe dispatch at runtime.
export const LAZY_RENDERER_MAP: Record<string, React.LazyExoticComponent<ComponentType<any>>> = {
  'cover': LazyCoverRenderer,
  'petunjuk': LazyPetunjukRenderer,
  'tp': LazyTpRenderer,
  'alur': LazyAlurRenderer,
  'skenario': LazySkenarioRenderer,
  'def-box': LazyDefBoxRenderer,
  'nc-grid': LazyNcGridRenderer,
  'flashcard-set': LazyFlashcardRenderer,
  'ftab': LazyFtabRenderer,
  'nk-card': LazyNormaKartuRenderer,
  'diskusi': LazyDiskusiRenderer,
  'kuis': LazyKuisRenderer,
  'sortir-game': LazySortirGameRenderer,
  'roda-game': LazyRodaGameRenderer,
  'hasil': LazyHasilRenderer,
  'refleksi': LazyRefleksiRenderer,
  'penutup': LazyPenutupRenderer,
  'tabel-accord': LazyTabelAccordionRenderer,
  'materi-section': LazyMateriSectionRenderer,
  'tujuan-display': LazyTujuanDisplayRenderer,
  'motivasi': LazyMotivasiRenderer,
  'rangkuman': LazyRangkumanRenderer,
  'memory-game': LazyMemoryGameRenderer,
  'matching-game': LazyMatchingGameRenderer,
  'fill-blank-game': LazyFillBlankGameRenderer,
  'word-search-game': LazyWordSearchGameRenderer,
  'true-false-game': LazyTrueFalseGameRenderer,
  'drag-drop-game': LazyDragDropGameRenderer,
  'crossword-game': LazyCrosswordGameRenderer,
  'team-buzzer-game': LazyTeamBuzzerGameRenderer,
};

// ── Fallback component while loading ──────────────────────────────

function RendererFallback() {
  return <div className="animate-pulse bg-app-surface/10 h-20 rounded-lg" />;
}

// ── Wrapper component ─────────────────────────────────────────────

export function LazyRenderer({ type, props }: { type: string; props: Record<string, unknown> }) {
  const LazyComponent = LAZY_RENDERER_MAP[type];
  if (!LazyComponent) return null;
  return (
    <Suspense fallback={<RendererFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}
