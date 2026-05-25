/**
 * EDUCATIONAL SCENE ATMOSPHERE — Visual mood per scene type
 *
 * Setiap Scene Type punya "atmosphere" yang berbeda — bukan mengubah
 * warna, tapi mengatur OPACITY dan PROMINENCE.
 *
 * Contoh masalah yang dipecahkan:
 *   Di Reflection Scene, warna utama = teal (refleksi) + purple (diskusi internal)
 *   Tapi jika ada materi block, warna cyan-nya TIDAK boleh se-intense di scene lain.
 *   Solution: accentProminence = { materi: 'muted' }
 *
 * Ini bukan "mengganti warna" — warna tetap konsisten.
 * Ini "mengatur volume" — warna mana yang dominan, mana yang subtle.
 *
 * Reference: SILSE Educational Visual Philosophy v2.1
 */

import type { SceneType } from './education-scene-types';
import type { EduSemanticColor } from './education-colors';

// ═══════════════════════════════════════════════════════════════
// ACCENT PROMINENCE — How "vocal" each color is in a scene
// ═══════════════════════════════════════════════════════════════

export type AccentProminence =
  | 'full'     // Normal opacity — warna penuh
  | 'muted'    // Reduced opacity — warna lebih halus
  | 'minimal'; // Very subtle — hanya hint warna

// ═══════════════════════════════════════════════════════════════
// SCENE ATMOSPHERE
// ═══════════════════════════════════════════════════════════════

export interface SceneAtmosphere {
  /** Scene type this atmosphere is for */
  sceneType: SceneType;
  /** Primary accent color for this scene — used for progress bars, highlights */
  primary: EduSemanticColor;
  /** Secondary accent colors — used for supporting elements */
  secondary: EduSemanticColor[];
  /** How "vocal" each semantic color is in this scene context */
  accentProminence: Partial<Record<EduSemanticColor, AccentProminence>>;
  /**
   * Background tint — very subtle, barely visible.
   * NOT a colored background — just a hint of atmosphere.
   * Format: CSS color string (e.g., 'rgba(13,148,136,0.02)')
   */
  bgTint: string;
  /**
   * Card treatment in this scene.
   * 'elevated'  — card with shadow (Intro, Summary — important scenes)
   * 'flat'      — card with border only (Concept — content-dominant)
   * 'subtle'    — card with barely-there border (Reflection — calm)
   */
  cardTreatment: 'elevated' | 'flat' | 'subtle';
  /**
   * Stripe prominence — how visible the left accent stripe should be.
   * 'bold'    — thick, prominent (Intro, Practice — action scenes)
   * 'normal'  — standard (Concept, Example)
   * 'gentle'  — thin, soft (Reflection, Discussion — contemplative)
   */
  stripeProminence: 'bold' | 'normal' | 'gentle';
  /**
   * Header treatment — how the component header should feel.
   * 'accented'  — colored background + icon (Intro, Practice)
   * 'outlined'  — border + icon, no fill (Concept, Example)
   * 'minimal'   — text only, no border (Reflection, Discussion)
   */
  headerTreatment: 'accented' | 'outlined' | 'minimal';
}

// ═══════════════════════════════════════════════════════════════
// PROMINENCE → OPACITY MAPPING
// ═══════════════════════════════════════════════════════════════

export const PROMINENCE_OPACITY: Record<AccentProminence, { bg: number; border: number; text: number }> = {
  full: { bg: 1.0, border: 1.0, text: 1.0 },
  muted: { bg: 0.5, border: 0.6, text: 0.75 },
  minimal: { bg: 0.25, border: 0.3, text: 0.5 },
};

// ═══════════════════════════════════════════════════════════════
// STRIPE PROMINENCE → WIDTH MAPPING
// ═══════════════════════════════════════════════════════════════

export const STRIPE_WIDTH: Record<'bold' | 'normal' | 'gentle', number> = {
  bold: 5,
  normal: 3,
  gentle: 2,
};

// ═══════════════════════════════════════════════════════════════
// 8 SCENE ATMOSPHERES
// ═══════════════════════════════════════════════════════════════

export const SCENE_ATMOSPHERES: Record<SceneType, SceneAtmosphere> = {
  // ── INTRO — Curiosity, energy, opening ─────────────────────
  intro: {
    sceneType: 'intro',
    primary: 'tujuan',
    secondary: ['aktivitas'],
    accentProminence: {
      tujuan: 'full',
      aktivitas: 'full',
      materi: 'muted',
      contoh: 'muted',
      quiz: 'minimal',
      diskusi: 'minimal',
      refleksi: 'minimal',
      rangkuman: 'minimal',
    },
    bgTint: 'rgba(202,138,4,0.03)',    // Warm hint of yellow
    cardTreatment: 'elevated',
    stripeProminence: 'bold',
    headerTreatment: 'accented',
  },

  // ── CONCEPT — Focused absorption, structured ───────────────
  concept: {
    sceneType: 'concept',
    primary: 'materi',
    secondary: ['contoh'],
    accentProminence: {
      materi: 'full',
      contoh: 'full',
      tujuan: 'muted',
      aktivitas: 'muted',
      quiz: 'minimal',
      diskusi: 'muted',
      refleksi: 'minimal',
      rangkuman: 'muted',
    },
    bgTint: 'rgba(8,145,178,0.02)',    // Cool hint of cyan
    cardTreatment: 'flat',
    stripeProminence: 'normal',
    headerTreatment: 'outlined',
  },

  // ── EXAMPLE — Discovery, insight ───────────────────────────
  example: {
    sceneType: 'example',
    primary: 'contoh',
    secondary: ['materi'],
    accentProminence: {
      contoh: 'full',
      materi: 'full',
      tujuan: 'minimal',
      aktivitas: 'muted',
      quiz: 'minimal',
      diskusi: 'muted',
      refleksi: 'minimal',
      rangkuman: 'muted',
    },
    bgTint: 'rgba(21,128,61,0.02)',     // Hint of green
    cardTreatment: 'flat',
    stripeProminence: 'normal',
    headerTreatment: 'outlined',
  },

  // ── PRACTICE — Active challenge, high energy ───────────────
  practice: {
    sceneType: 'practice',
    primary: 'aktivitas',
    secondary: ['quiz'],
    accentProminence: {
      aktivitas: 'full',
      quiz: 'full',
      materi: 'muted',
      contoh: 'muted',
      tujuan: 'minimal',
      diskusi: 'minimal',
      refleksi: 'minimal',
      rangkuman: 'minimal',
    },
    bgTint: 'rgba(194,65,12,0.03)',     // Warm hint of orange
    cardTreatment: 'elevated',
    stripeProminence: 'bold',
    headerTreatment: 'accented',
  },

  // ── DISCUSSION — Open exploration, contemplative ────────────
  discussion: {
    sceneType: 'discussion',
    primary: 'diskusi',
    secondary: ['refleksi'],
    accentProminence: {
      diskusi: 'full',
      refleksi: 'muted',
      materi: 'muted',
      contoh: 'muted',
      tujuan: 'minimal',
      aktivitas: 'minimal',
      quiz: 'minimal',
      rangkuman: 'minimal',
    },
    bgTint: 'rgba(124,58,237,0.02)',    // Hint of purple
    cardTreatment: 'subtle',
    stripeProminence: 'gentle',
    headerTreatment: 'minimal',
  },

  // ── REFLECTION — Very calm, introspective ──────────────────
  reflection: {
    sceneType: 'reflection',
    primary: 'refleksi',
    secondary: ['diskusi'],
    accentProminence: {
      refleksi: 'full',
      diskusi: 'muted',
      materi: 'minimal',
      contoh: 'minimal',
      tujuan: 'minimal',
      aktivitas: 'minimal',
      quiz: 'minimal',
      rangkuman: 'minimal',
    },
    bgTint: 'rgba(13,148,136,0.02)',    // Hint of teal
    cardTreatment: 'subtle',
    stripeProminence: 'gentle',
    headerTreatment: 'minimal',
  },

  // ── ASSESSMENT — Focused, formal, precise ──────────────────
  assessment: {
    sceneType: 'assessment',
    primary: 'quiz',
    secondary: ['aktivitas'],
    accentProminence: {
      quiz: 'full',
      aktivitas: 'muted',
      materi: 'muted',
      contoh: 'minimal',
      tujuan: 'minimal',
      diskusi: 'minimal',
      refleksi: 'minimal',
      rangkuman: 'minimal',
    },
    bgTint: 'rgba(220,38,38,0.02)',     // Hint of red
    cardTreatment: 'elevated',
    stripeProminence: 'bold',
    headerTreatment: 'accented',
  },

  // ── SUMMARY — Achievement, closure ─────────────────────────
  summary: {
    sceneType: 'summary',
    primary: 'rangkuman',
    secondary: ['tujuan'],
    accentProminence: {
      rangkuman: 'full',
      tujuan: 'muted',
      materi: 'muted',
      contoh: 'muted',
      aktivitas: 'minimal',
      quiz: 'minimal',
      diskusi: 'minimal',
      refleksi: 'minimal',
    },
    bgTint: 'rgba(2,132,199,0.02)',     // Hint of blue
    cardTreatment: 'elevated',
    stripeProminence: 'normal',
    headerTreatment: 'outlined',
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Get atmosphere for a scene
// ═══════════════════════════════════════════════════════════════

export function getSceneAtmosphere(sceneType: SceneType): SceneAtmosphere {
  return SCENE_ATMOSPHERES[sceneType];
}

/**
 * Get the accent prominence for a specific semantic color in a scene context.
 * Returns 'full' if not explicitly set (default).
 */
export function getAccentProminence(
  sceneType: SceneType,
  semanticColor: EduSemanticColor,
): AccentProminence {
  const atmosphere = SCENE_ATMOSPHERES[sceneType];
  return atmosphere.accentProminence[semanticColor] ?? 'full';
}

/**
 * Get the opacity multiplier for a semantic color in a scene context.
 * Use this to adjust EDU_COLOR_IDENTITY opacity values.
 */
export function getAccentOpacity(
  sceneType: SceneType,
  semanticColor: EduSemanticColor,
  opacityType: 'bg' | 'border' | 'text',
): number {
  const prominence = getAccentProminence(sceneType, semanticColor);
  return PROMINENCE_OPACITY[prominence][opacityType];
}

/**
 * Get the stripe width for a scene context.
 */
export function getSceneStripeWidth(sceneType: SceneType): number {
  const atmosphere = SCENE_ATMOSPHERES[sceneType];
  return STRIPE_WIDTH[atmosphere.stripeProminence];
}
