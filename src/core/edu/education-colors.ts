/**
 * EDUCATIONAL COLORS — Semantic color naming for pedagogical roles
 *
 * Instead of abstract color keys (y, c, p), educational content
 * uses semantic names tied to the pedagogical purpose:
 *   tujuan   → What students will learn (Yellow)
 *   materi   → Core content (Cyan/Blue)
 *   contoh   → Examples (Green)
 *   aktivitas → Student activities (Orange)
 *   diskusi  → Discussion prompts (Purple)
 *   refleksi → Self-reflection (Teal)
 *   quiz     → Assessment (Red)
 *   rangkuman → Summary (Blue)
 *
 * Each component has a FIXED color identity — teachers should
 * instantly recognize the pedagogical role from color alone.
 *
 * SCENE-AWARE ACCENT PROMINENCE:
 *   In a Reflection scene, quiz red should be barely visible.
 *   In a Practice scene, tujuan yellow should be subtle.
 *   This is NOT "changing colors" — it's "adjusting volume."
 *   See education-scene-atmosphere.ts for the full system.
 */

import type { EduDisplayMode } from './education-typography';
import type { SceneType } from './education-scene-types';
import { getAccentOpacity, getAccentProminence, type AccentProminence } from './education-scene-atmosphere';

// ═══════════════════════════════════════════════════════════════
// SEMANTIC COLOR KEYS
// ═══════════════════════════════════════════════════════════════

export type EduSemanticColor =
  | 'tujuan'
  | 'materi'
  | 'contoh'
  | 'aktivitas'
  | 'diskusi'
  | 'refleksi'
  | 'quiz'
  | 'rangkuman';

// ═══════════════════════════════════════════════════════════════
// COLOR IDENTITY — Fixed mapping: semantic role → base color key
// ═══════════════════════════════════════════════════════════════
// These map to the existing theme color keys (y, c, g, etc.)
// so they work with ANY theme preset, not just one specific theme.

export const EDU_COLOR_IDENTITY: Record<EduSemanticColor, {
  /** Base color key in the theme token system */
  tokenKey: string;
  /** Human-readable label for UI */
  label: string;
  /** Default hex for light themes */
  lightHex: string;
  /** Default hex for dark themes */
  darkHex: string;
  /** WCAG AAA safe background opacity */
  bgOpacity: number;
  /** WCAG AAA safe border opacity */
  borderOpacity: number;
}> = {
  tujuan: {
    tokenKey: 'y',
    label: 'Tujuan Pembelajaran',
    lightHex: '#ca8a04',
    darkHex: '#f9c12e',
    bgOpacity: 0.1,
    borderOpacity: 0.25,
  },
  materi: {
    tokenKey: 'c',
    label: 'Materi',
    lightHex: '#0891b2',
    darkHex: '#22d3ee',
    bgOpacity: 0.08,
    borderOpacity: 0.2,
  },
  contoh: {
    tokenKey: 'g',
    label: 'Contoh',
    lightHex: '#15803d',
    darkHex: '#34d399',
    bgOpacity: 0.08,
    borderOpacity: 0.2,
  },
  aktivitas: {
    tokenKey: 'o',
    label: 'Aktivitas',
    lightHex: '#c2410c',
    darkHex: '#fb923c',
    bgOpacity: 0.08,
    borderOpacity: 0.2,
  },
  diskusi: {
    tokenKey: 'p',
    label: 'Diskusi',
    lightHex: '#7c3aed',
    darkHex: '#a78bfa',
    bgOpacity: 0.08,
    borderOpacity: 0.2,
  },
  refleksi: {
    tokenKey: 'c',
    label: 'Refleksi',
    lightHex: '#0d9488',
    darkHex: '#2dd4bf',
    bgOpacity: 0.06,
    borderOpacity: 0.15,
  },
  quiz: {
    tokenKey: 'r',
    label: 'Kuis',
    lightHex: '#dc2626',
    darkHex: '#f87171',
    bgOpacity: 0.08,
    borderOpacity: 0.2,
  },
  rangkuman: {
    tokenKey: 'c',
    label: 'Rangkuman',
    lightHex: '#0284c7',
    darkHex: '#38bdf8',
    bgOpacity: 0.06,
    borderOpacity: 0.15,
  },
};

// ═══════════════════════════════════════════════════════════════
// DISPLAY MODE BACKGROUNDS
// ═══════════════════════════════════════════════════════════════

export const EDU_MODE_BG: Record<EduDisplayMode, { bg: string; bg2: string; card: string }> = {
  classroom: {
    bg: '#FFFFFF',
    bg2: '#F8FAFC',
    card: '#FFFFFF',
  },
  projector: {
    bg: '#FFFBF0',
    bg2: '#FFF8E8',
    card: '#FFFDF7',
  },
  print: {
    bg: '#FFFFFF',
    bg2: '#FFFFFF',
    card: '#FFFFFF',
  },
  student: {
    bg: '#F1F5F9',
    bg2: '#E2E8F0',
    card: '#FFFFFF',
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Map block type to semantic color
// ═══════════════════════════════════════════════════════════════

export function blockTypeToSemanticColor(blockType: string): EduSemanticColor {
  const mapping: Record<string, EduSemanticColor> = {
    'tujuan-display': 'tujuan',
    'tp': 'tujuan',
    'materi-section': 'materi',
    'materi-blok': 'materi',
    'def-box': 'materi',
    'nc-grid': 'materi',
    'flashcard-set': 'contoh',
    'diskusi': 'diskusi',
    'kuis': 'quiz',
    'refleksi': 'refleksi',
    'rangkuman': 'rangkuman',
    'penutup': 'rangkuman',
    'aktivitas': 'aktivitas',
    'alur': 'aktivitas',
    'petunjuk': 'tujuan',
    'gambar': 'materi',
    'tabel': 'materi',
    'timeline': 'materi',
    'compare': 'materi',
    'checklist': 'contoh',
    'statistik': 'materi',
    'studi': 'contoh',
    'cover': 'tujuan',
    'hero': 'tujuan',
    'motivasi': 'aktivitas',
    'nk-card': 'materi',
    'reveal': 'contoh',
    'ftab': 'materi',
    'skenario': 'aktivitas',
    'hasil': 'quiz',
    // Game blocks
    'sortir-game': 'quiz',
    'roda-game': 'quiz',
    'memory-game': 'quiz',
    'drag-drop-game': 'quiz',
    'fill-blank-game': 'quiz',
    'matching-game': 'quiz',
    'true-false-game': 'quiz',
    'crossword-game': 'quiz',
    'word-search-game': 'quiz',
    'team-buzzer-game': 'quiz',
  };
  return mapping[blockType] ?? 'materi';
}

// ═══════════════════════════════════════════════════════════════
// SCENE-AWARE COLOR HELPERS
// ═══════════════════════════════════════════════════════════════
// These functions adjust color opacity based on the scene's
// accent prominence rules. Same color, different "volume."

/**
 * Get scene-aware background color for a semantic color in a scene context.
 * Applies accent prominence: if this color is 'minimal' in this scene,
 * the bg opacity will be very low.
 */
export function getSceneAwareBgOpacity(
  sceneType: SceneType,
  semanticColor: EduSemanticColor,
): number {
  const identity = EDU_COLOR_IDENTITY[semanticColor];
  const multiplier = getAccentOpacity(sceneType, semanticColor, 'bg');
  return identity.bgOpacity * multiplier;
}

/**
 * Get scene-aware border color for a semantic color in a scene context.
 */
export function getSceneAwareBorderOpacity(
  sceneType: SceneType,
  semanticColor: EduSemanticColor,
): number {
  const identity = EDU_COLOR_IDENTITY[semanticColor];
  const multiplier = getAccentOpacity(sceneType, semanticColor, 'border');
  return identity.borderOpacity * multiplier;
}

/**
 * Get scene-aware text opacity for a semantic color in a scene context.
 * Useful for muted labels that should be barely visible in non-relevant scenes.
 */
export function getSceneAwareTextOpacity(
  sceneType: SceneType,
  semanticColor: EduSemanticColor,
): number {
  return getAccentOpacity(sceneType, semanticColor, 'text');
}

/**
 * Get the accent prominence level for a semantic color in a scene context.
 * Returns 'full' | 'muted' | 'minimal'.
 * Useful for conditional rendering (e.g., hide a badge in 'minimal' scenes).
 */
export function getColorProminence(
  sceneType: SceneType,
  semanticColor: EduSemanticColor,
): AccentProminence {
  return getAccentProminence(sceneType, semanticColor);
}

/**
 * Check if a semantic color is "prominent" (full) in a scene context.
 * Useful for deciding whether to show/hide accent decorations.
 */
export function isColorProminent(
  sceneType: SceneType,
  semanticColor: EduSemanticColor,
): boolean {
  return getAccentProminence(sceneType, semanticColor) === 'full';
}

/**
 * Get scene-aware RGBA color string for a semantic color.
 * Combines the base hex color with scene-adjusted opacity.
 */
export function getSceneAwareColor(
  sceneType: SceneType,
  semanticColor: EduSemanticColor,
  colorType: 'bg' | 'border' | 'text',
): string {
  const identity = EDU_COLOR_IDENTITY[semanticColor];
  const opacity = getAccentOpacity(sceneType, semanticColor, colorType);
  const baseOpacity = colorType === 'bg'
    ? identity.bgOpacity
    : colorType === 'border'
      ? identity.borderOpacity
      : 1;
  const finalOpacity = baseOpacity * opacity;
  // Convert hex to RGB for rgba()
  const hex = identity.lightHex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${finalOpacity.toFixed(2)})`;
}
