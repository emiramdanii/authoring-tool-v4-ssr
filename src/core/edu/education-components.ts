/**
 * EDUCATIONAL COMPONENTS — Fixed identity for 8 pedagogical roles
 *
 * Each pedagogical role has a FIXED visual identity:
 *   1. Color — from EDU_COLOR_IDENTITY
 *   2. Icon  — Lucide icon, consistent across all renderers
 *   3. Shape — Border radius, border style, shadow
 *   4. Heading — Typography level + prefix pattern
 *
 * Teachers should INSTANTLY recognize what a component does
 * just by glancing at it. No learning curve.
 *
 * This replaces the ad-hoc visual styling where each renderer
 * picked its own icon/color/shape independently.
 *
 * SCENE TYPE MAPPING:
 *   Each SceneType maps to a primary component identity.
 *   This enables scene-aware rendering where the "voice" of the
 *   scene matches its pedagogical purpose.
 */

import { Target, BookOpen, Lightbulb, Hand, MessageCircle, Brain, CheckCircle2, ClipboardList } from 'lucide-react';
import type { EduSemanticColor } from './education-colors';
import type { EduTypographyKey } from './education-typography';
import type { SceneType } from './education-scene-types';
import { SCENE_ATMOSPHERES } from './education-scene-atmosphere';

// ═══════════════════════════════════════════════════════════════
// COMPONENT IDENTITY DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type EduComponentRole = EduSemanticColor;

export interface EduComponentIdentity {
  /** Semantic color key */
  color: EduSemanticColor;
  /** Lucide icon component */
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  /** Icon display name for fallback */
  iconLabel: string;
  /** Typography level for the heading */
  headingLevel: EduTypographyKey;
  /** Heading prefix pattern — e.g. "Tujuan Pembelajaran:" */
  headingPrefix: string;
  /** Shape — border radius key */
  radiusKey: 'sm' | 'md' | 'lg' | 'xl';
  /** Has accent stripe on left? */
  hasStripe: boolean;
  /** Stripe width */
  stripeWidth: number;
  /** Shadow level */
  shadow: 'none' | 'card' | 'elevated';
  /** Minimum whitespace ratio (0-1) */
  minWhitespaceRatio: number;
  /** Maximum words per component before splitting */
  maxWords: number;
}

export const EDU_COMPONENTS: Record<EduComponentRole, EduComponentIdentity> = {
  tujuan: {
    color: 'tujuan',
    icon: Target,
    iconLabel: 'Target',
    headingLevel: 'section',
    headingPrefix: 'Tujuan Pembelajaran',
    radiusKey: 'xl',
    hasStripe: true,
    stripeWidth: 4,
    shadow: 'elevated',
    minWhitespaceRatio: 0.35,
    maxWords: 80,
  },
  materi: {
    color: 'materi',
    icon: BookOpen,
    iconLabel: 'BookOpen',
    headingLevel: 'section',
    headingPrefix: 'Materi',
    radiusKey: 'lg',
    hasStripe: true,
    stripeWidth: 3,
    shadow: 'card',
    minWhitespaceRatio: 0.3,
    maxWords: 120,
  },
  contoh: {
    color: 'contoh',
    icon: Lightbulb,
    iconLabel: 'Lightbulb',
    headingLevel: 'section',
    headingPrefix: 'Contoh',
    radiusKey: 'lg',
    hasStripe: true,
    stripeWidth: 3,
    shadow: 'card',
    minWhitespaceRatio: 0.3,
    maxWords: 100,
  },
  aktivitas: {
    color: 'aktivitas',
    icon: Hand,
    iconLabel: 'Hand',
    headingLevel: 'section',
    headingPrefix: 'Aktivitas',
    radiusKey: 'xl',
    hasStripe: true,
    stripeWidth: 4,
    shadow: 'elevated',
    minWhitespaceRatio: 0.35,
    maxWords: 80,
  },
  diskusi: {
    color: 'diskusi',
    icon: MessageCircle,
    iconLabel: 'MessageCircle',
    headingLevel: 'section',
    headingPrefix: 'Diskusi',
    radiusKey: 'lg',
    hasStripe: true,
    stripeWidth: 3,
    shadow: 'card',
    minWhitespaceRatio: 0.35,
    maxWords: 60,
  },
  refleksi: {
    color: 'refleksi',
    icon: Brain,
    iconLabel: 'Brain',
    headingLevel: 'section',
    headingPrefix: 'Refleksi',
    radiusKey: 'lg',
    hasStripe: true,
    stripeWidth: 3,
    shadow: 'card',
    minWhitespaceRatio: 0.4,
    maxWords: 40,
  },
  quiz: {
    color: 'quiz',
    icon: CheckCircle2,
    iconLabel: 'CheckCircle2',
    headingLevel: 'section',
    headingPrefix: 'Kuis',
    radiusKey: 'xl',
    hasStripe: true,
    stripeWidth: 4,
    shadow: 'elevated',
    minWhitespaceRatio: 0.4,
    maxWords: 60,
  },
  rangkuman: {
    color: 'rangkuman',
    icon: ClipboardList,
    iconLabel: 'ClipboardList',
    headingLevel: 'section',
    headingPrefix: 'Rangkuman',
    radiusKey: 'lg',
    hasStripe: true,
    stripeWidth: 3,
    shadow: 'card',
    minWhitespaceRatio: 0.35,
    maxWords: 80,
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Get component identity for a block type
// ═══════════════════════════════════════════════════════════════

import { blockTypeToSemanticColor } from './education-colors';

export function getEduComponentForBlock(blockType: string): EduComponentIdentity {
  const semanticColor = blockTypeToSemanticColor(blockType);
  return EDU_COMPONENTS[semanticColor];
}

// ═══════════════════════════════════════════════════════════════
// SCENE TYPE → COMPONENT IDENTITY MAPPING
// ═══════════════════════════════════════════════════════════════
// Each SceneType has a primary component identity that determines
// the visual "voice" of the scene. When a scene renders, it uses
// the primary component identity for the scene's dominant blocks.
//
// This mapping connects the 8 Scene Types to the 8 Component Roles.
// The connection goes through SCENE_ATMOSPHERES.primary → EduSemanticColor.

/**
 * Map SceneType → primary EduSemanticColor for that scene.
 * Derived from SCENE_ATMOSPHERES.primary field.
 */
export const SCENE_PRIMARY_COLOR: Record<SceneType, EduSemanticColor> = {
  intro: 'tujuan',
  concept: 'materi',
  example: 'contoh',
  practice: 'aktivitas',
  discussion: 'diskusi',
  reflection: 'refleksi',
  assessment: 'quiz',
  summary: 'rangkuman',
};

/**
 * Get the primary component identity for a SceneType.
 * This is the "voice" of the scene — what it looks and feels like.
 */
export function getEduComponentForScene(sceneType: SceneType): EduComponentIdentity {
  const primaryColor = SCENE_PRIMARY_COLOR[sceneType];
  return EDU_COMPONENTS[primaryColor];
}

/**
 * Get the scene-aware card treatment for a SceneType.
 * Returns the card style that matches the scene's atmosphere.
 */
export function getSceneCardTreatment(sceneType: SceneType): 'elevated' | 'flat' | 'subtle' {
  return SCENE_ATMOSPHERES[sceneType].cardTreatment;
}

/**
 * Get the scene-aware header treatment for a SceneType.
 * Returns the header style that matches the scene's atmosphere.
 */
export function getSceneHeaderTreatment(sceneType: SceneType): 'accented' | 'outlined' | 'minimal' {
  return SCENE_ATMOSPHERES[sceneType].headerTreatment;
}

/**
 * Get the scene-aware stripe width for a SceneType.
 * Returns the accent stripe width in pixels.
 */
export function getSceneStripeWidth(sceneType: SceneType): number {
  const prominence = SCENE_ATMOSPHERES[sceneType].stripeProminence;
  const widths: Record<string, number> = { bold: 5, normal: 3, gentle: 2 };
  return widths[prominence] ?? 3;
}
