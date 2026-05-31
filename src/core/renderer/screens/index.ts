// ═══════════════════════════════════════════════════════════════════
// SCREEN-BASED RENDERER — Barrel Export
// ═══════════════════════════════════════════════════════════════════
// This module provides the screen-based rendering system that enforces
// the 1 screen = 1 page principle with no overlap and no free stacking.
//
// Usage:
//   import { getScreenAdapter, getScreenConfig } from '@/core/renderer/screens';
//
// Architecture:
//   PageRenderer (mode=learn)
//     → getScreenAdapter(page.templateType)
//       → ScreenAdapter (e.g., QuizScreen)
//         → ScreenShell (consistent chrome)
//           → SchemaScreenRenderer (block layout + rendering)
// ═══════════════════════════════════════════════════════════════════

// ── Registry ─────────────────────────────────────────────────────
export { SCREEN_CONFIGS } from './ScreenTypeRegistry';
export type { ScreenConfig } from './ScreenTypeRegistry';
export {
  getScreenConfig,
  isFullPageScreen,
  requiresScreenCompletion,
  isScreenInteractive,
  getScreenMaxBlocks,
  getAllScreenTypes,
} from './ScreenTypeRegistry';

// ── Shell ────────────────────────────────────────────────────────
export { ScreenShell } from './ScreenShell';
export type { ScreenShellProps } from './ScreenShell';

// ── Shared Props ─────────────────────────────────────────────────
export type { ScreenAdapterProps } from './ScreenAdapterProps';

// ── Screen Adapters ──────────────────────────────────────────────
export { CoverScreen } from './adapters/CoverScreen';
export type { CoverScreenProps } from './adapters/CoverScreen';

export { PetunjukScreen } from './adapters/PetunjukScreen';
export type { PetunjukScreenProps } from './adapters/PetunjukScreen';

export { TujuanScreen } from './adapters/TujuanScreen';
export type { TujuanScreenProps } from './adapters/TujuanScreen';

export { MotivasiScreen } from './adapters/MotivasiScreen';
export type { MotivasiScreenProps } from './adapters/MotivasiScreen';

export { MateriScreen } from './adapters/MateriScreen';
export type { MateriScreenProps } from './adapters/MateriScreen';

export { DiskusiScreen } from './adapters/DiskusiScreen';
export type { DiskusiScreenProps } from './adapters/DiskusiScreen';

export { QuizScreen } from './adapters/QuizScreen';
export type { QuizScreenProps } from './adapters/QuizScreen';

export { GameScreen } from './adapters/GameScreen';
export type { GameScreenProps } from './adapters/GameScreen';

export { RefleksiScreen } from './adapters/RefleksiScreen';
export type { RefleksiScreenProps } from './adapters/RefleksiScreen';

export { RangkumanScreen } from './adapters/RangkumanScreen';
export type { RangkumanScreenProps } from './adapters/RangkumanScreen';

export { PenutupScreen } from './adapters/PenutupScreen';
export type { PenutupScreenProps } from './adapters/PenutupScreen';

export { SkenarioScreen } from './adapters/SkenarioScreen';
export type { SkenarioScreenProps } from './adapters/SkenarioScreen';

export { HasilScreen } from './adapters/HasilScreen';
export type { HasilScreenProps } from './adapters/HasilScreen';

// ═══════════════════════════════════════════════════════════════════
// SCREEN ADAPTER RESOLVER
// ═══════════════════════════════════════════════════════════════════
// Maps sceneType/templateType → screen adapter component.
// This is the SINGLE dispatch mechanism for screen-based rendering.

import React from 'react';
import type { ScreenAdapterProps } from './ScreenAdapterProps';
import type { ScreenConfig } from './ScreenTypeRegistry';
import { getScreenConfig } from './ScreenTypeRegistry';

import { CoverScreen } from './adapters/CoverScreen';
import { PetunjukScreen } from './adapters/PetunjukScreen';
import { TujuanScreen } from './adapters/TujuanScreen';
import { MotivasiScreen } from './adapters/MotivasiScreen';
import { MateriScreen } from './adapters/MateriScreen';
import { DiskusiScreen } from './adapters/DiskusiScreen';
import { QuizScreen } from './adapters/QuizScreen';
import { GameScreen } from './adapters/GameScreen';
import { RefleksiScreen } from './adapters/RefleksiScreen';
import { RangkumanScreen } from './adapters/RangkumanScreen';
import { PenutupScreen } from './adapters/PenutupScreen';
import { SkenarioScreen } from './adapters/SkenarioScreen';
import { HasilScreen } from './adapters/HasilScreen';

// ── Adapter Component Type ───────────────────────────────────────
type ScreenAdapterComponent = React.ComponentType<ScreenAdapterProps>;

// ── Adapter Registry ─────────────────────────────────────────────

const ADAPTER_REGISTRY: Record<string, ScreenAdapterComponent> = {
  cover: CoverScreen,
  petunjuk: PetunjukScreen,
  tujuan: TujuanScreen,
  motivasi: MotivasiScreen,
  materi: MateriScreen,
  diskusi: DiskusiScreen,
  kuis: QuizScreen,
  game: GameScreen,
  refleksi: RefleksiScreen,
  rangkuman: RangkumanScreen,
  penutup: PenutupScreen,
  skenario: SkenarioScreen,
  hasil: HasilScreen,
};

/**
 * Get the screen adapter component for a given scene type.
 * Falls back to MateriScreen for unknown types (generic content display).
 *
 * @param sceneType - The page's template type (cover, petunjuk, kuis, etc.)
 * @returns The screen adapter component
 */
export function getScreenAdapter(sceneType: string): ScreenAdapterComponent {
  return ADAPTER_REGISTRY[sceneType] ?? MateriScreen;
}

/**
 * Get the screen config for a given scene type.
 * Convenience re-export for consumers that need both adapter and config.
 */
export function getScreenConfigForType(sceneType: string): ScreenConfig {
  return getScreenConfig(sceneType);
}
