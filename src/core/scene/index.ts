// ═══════════════════════════════════════════════════════════════════
// SCENE ENGINE — Public API
// ═══════════════════════════════════════════════════════════════════
// The scene engine is the SINGLE LAYOUT AUTHORITY for the authoring tool.
// Browser only renders — it does NOT control position/size.
//
// Pipeline: SchemaBlock → resolveSceneLayout() → ResolvedBlock → renderer
//
// Usage:
//   import { resolveSceneLayout, computeSafeArea, getSceneResolution } from '@/core/scene';
// ═══════════════════════════════════════════════════════════════════

export {
  // Scene Resolution
  type SceneResolution,
  SCENE_RESOLUTIONS,
  getSceneResolution,

  // Safe Area System
  type SafeArea,
  DEFAULT_SAFE_AREA,
  computeSafeArea,

  // Overflow Rules
  type OverflowRule,
  BLOCK_OVERFLOW_RULES,
  getOverflowRule,

  // Spacing Tokens
  SPACING,
  BLOCK_GAP,
  type SpacingKey,

  // Layout Resolution
  type ResolvedBlockPosition,
  resolveSceneLayout,
  estimateBlockHeight,

  // Scale Computation
  computeSceneScale,

  // Style Helpers
  getSceneContainerStyle,
  getBlockPositionStyle,
} from './SceneLayoutEngine';
