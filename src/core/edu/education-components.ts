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
 */

import { Target, BookOpen, Lightbulb, Hand, MessageCircle, Brain, CheckCircle2, ClipboardList } from 'lucide-react';
import type { EduSemanticColor } from './education-colors';
import type { EduTypographyKey } from './education-typography';

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
