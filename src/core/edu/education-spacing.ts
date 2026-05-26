/**
 * EDUCATIONAL SPACING — Rhythm tokens for classroom readability
 *
 * Educational content needs MORE whitespace than consumer apps.
 * Students need visual breathing room to process information.
 * The spacing here enforces the 35% whitespace minimum.
 *
 * SCENE DENSITY RULES:
 *   High-intensity scenes (Practice: 0.8) → tighter gaps, urgency
 *   Low-intensity scenes (Reflection: 0.2) → generous whitespace, calm
 *   This is NOT arbitrary — intensity directly drives spacing density.
 */

import type { SceneType } from './education-scene-types';
import { SCENE_TYPES } from './education-scene-types';

// ═══════════════════════════════════════════════════════════════
// EDUCATIONAL SPACING SCALE
// ═══════════════════════════════════════════════════════════════

export const EDU_SPACING = {
  /** Component-level padding — card inner padding */
  component: {
    /** Compact mode */
    compact: { block: 12, inline: 16 },
    /** Standard mode */
    standard: { block: 18, inline: 22 },
    /** Generous — cover, hero */
    generous: { block: 24, inline: 28 },
  },

  /** Section-level padding — between sections in a scene */
  section: {
    compact: { block: 14, inline: 18 },
    standard: { block: 22, inline: 26 },
    generous: { block: 28, inline: 32 },
  },

  /** Gap between list items, objectives, cards */
  gap: {
    tight: 8,     // Same-type items (list of objectives)
    standard: 12,  // Between different items
    generous: 16,  // Between different components
    section: 24,   // Between major sections
  },

  /** Icon container sizes for educational components */
  icon: {
    sm: 28,   // Inline icons
    md: 36,   // Card header icons
    lg: 44,   // Section header icons
    xl: 56,   // Cover/hero icons
  },

  /** Accent stripe widths */
  stripe: {
    thin: 3,
    standard: 4,
    thick: 5,
  },

  /** Border radii — slightly larger for educational clarity */
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    full: 99,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// HELPER: Resolve spacing for compact/standard
// ═══════════════════════════════════════════════════════════════

export function eduComponentPadding(isCompact: boolean): Record<string, string> {
  const spec = isCompact ? EDU_SPACING.component.compact : EDU_SPACING.component.standard;
  return { padding: `${spec.block}px ${spec.inline}px` };
}

export function eduSectionPadding(isCompact: boolean): Record<string, string> {
  const spec = isCompact ? EDU_SPACING.section.compact : EDU_SPACING.section.standard;
  return { padding: `${spec.block}px ${spec.inline}px` };
}

export function eduNestedPadding(isCompact: boolean): Record<string, string> {
  const spec = isCompact
    ? { block: 8, inline: 12 }
    : { block: 12, inline: 16 };
  return { padding: `${spec.block}px ${spec.inline}px` };
}

// ═══════════════════════════════════════════════════════════════
// SCENE DENSITY RULES
// ═══════════════════════════════════════════════════════════════
// Scene intensity directly affects spacing density.
// High intensity = compact (urgency, active challenge)
// Low intensity = generous (calm, contemplative)
//
// This creates the "breathing rhythm" — Practice feels tight
// and focused, Reflection feels open and spacious.

/**
 * Scene density multiplier based on intensity.
 * intensity > 0.6  → compact (0.85x spacing)
 * intensity 0.4-0.6 → standard (1.0x spacing)
 * intensity < 0.4  → generous (1.15x spacing)
 */
export function getSceneDensityMultiplier(sceneType: SceneType): number {
  const intensity = SCENE_TYPES[sceneType].intensity;
  if (intensity >= 0.7) return 0.85;   // Compact — Practice (0.8), Intro (0.7)
  if (intensity >= 0.4) return 1.0;    // Standard — Concept (0.4), Example (0.5), Assessment (0.5), Summary (0.6)
  return 1.15;                          // Generous — Discussion (0.3), Reflection (0.2)
}

/**
 * Scene-aware component padding.
 * Adjusts padding based on scene intensity.
 */
export function eduSceneComponentPadding(isCompact: boolean, sceneType: SceneType): Record<string, string> {
  const density = getSceneDensityMultiplier(sceneType);
  const spec = isCompact ? EDU_SPACING.component.compact : EDU_SPACING.component.standard;
  const block = Math.round(spec.block * density);
  const inline = Math.round(spec.inline * density);
  return { padding: `${block}px ${inline}px` };
}

/**
 * Scene-aware section padding.
 */
export function eduSceneSectionPadding(isCompact: boolean, sceneType: SceneType): Record<string, string> {
  const density = getSceneDensityMultiplier(sceneType);
  const spec = isCompact ? EDU_SPACING.section.compact : EDU_SPACING.section.standard;
  const block = Math.round(spec.block * density);
  const inline = Math.round(spec.inline * density);
  return { padding: `${block}px ${inline}px` };
}

/**
 * Scene-aware gap between items.
 */
export function eduSceneGap(sceneType: SceneType, gapType: 'tight' | 'standard' | 'generous' | 'section' = 'standard'): number {
  const density = getSceneDensityMultiplier(sceneType);
  const base = EDU_SPACING.gap[gapType];
  return Math.round(base * density);
}

/**
 * Get the minimum whitespace ratio for a scene type.
 * High-intensity scenes can have less whitespace (0.30-0.40),
 * low-intensity scenes need more (0.40-0.50).
 */
export function getSceneWhitespaceRatio(sceneType: SceneType): number {
  return SCENE_TYPES[sceneType].minWhitespaceRatio;
}

/**
 * Get the maximum blocks budget for a scene type.
 * Prevents over-dense scenes that cause cognitive overload.
 */
export function getSceneMaxBlocks(sceneType: SceneType): number {
  return SCENE_TYPES[sceneType].maxBlocks;
}
