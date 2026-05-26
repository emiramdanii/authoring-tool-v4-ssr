/**
 * EDUCATIONAL DESIGN SYSTEM — Public API
 *
 * This module provides the educational design token layer that
 * replaces the iOS visual contract for CANVAS CONTENT.
 * The iOS VC is still used for app shell/chrome UI.
 *
 * Architecture: 6-Layer System
 *   Layer 1: Educational Foundation  (typography, color, readability)
 *   Layer 2: Spatial System          (rhythm, density, whitespace)
 *   Layer 3: Component Grammar       (card, header, body, footer per scene)
 *   Layer 4: Interaction Language    (hover, click, reveal, feedback)
 *   Layer 5: Emotional Interaction   (progress, discovery, reward)
 *   Layer 6: Gamification            (optional — FASE 3)
 *
 * Usage:
 *   import { createEduContext } from '@/core/edu';
 *   const edu = createEduContext(tokens, block.type, isCompact);
 *   edu.heading()  → { fontSize: '28px', fontWeight: 700, ... }
 *   edu.accent()   → '#f9c12e'
 *
 * Scene-aware (FASE 2):
 *   import { inferSceneType } from '@/core/edu';
 *   const sceneType = inferSceneType(undefined, page.templateType, block.type);
 *   const edu = createEduContext(tokens, block.type, isCompact, mode, sceneType);
 */

// ── Layer 1: Educational Foundation ─────────────────────────
export { EDU_TYPOGRAPHY, resolveEduTypography, resolveEduTypographyCompact, type EduTypographyKey, type EduDisplayMode } from './education-typography';
export { EDU_COLOR_IDENTITY, EDU_MODE_BG, blockTypeToSemanticColor, type EduSemanticColor } from './education-colors';

// ── Layer 2: Spatial System ─────────────────────────────────
export { EDU_SPACING, eduComponentPadding, eduSectionPadding, eduNestedPadding } from './education-spacing';
export { EDU_DENSITY, EDU_GRAMMAR, EDU_PRINT_SAFE } from './education-layout-rules';

// ── Layer 3: Component Grammar ──────────────────────────────
export { EDU_COMPONENTS, getEduComponentForBlock, type EduComponentRole, type EduComponentIdentity } from './education-components';
export { EduRenderingContext, createEduContext } from './EduRenderingContext';
export { EduComponentShell, EduInlineSection, type EduComponentShellProps, type EduInlineSectionProps } from './EduComponentShell';

// ── Layer 4: Interaction Language ───────────────────────────
export { EDU_MOTION, eduTransitionStyle, eduEntranceStyle } from './education-motion';

// ── Layer 5: Emotional Interaction Layer ────────────────────
export {
  SCENE_TYPES, TEMPLATE_TO_SCENE, BLOCK_SCENE_HINT,
  inferSceneType, getSceneDefinition, getSceneIntensityCurve, validateNarrativeArc,
  type SceneType, type SceneTypeDefinition, type NarrativePosition, type RevealStrategy,
} from './education-scene-types';
export {
  SCENE_ATMOSPHERES, PROMINENCE_OPACITY, STRIPE_WIDTH,
  getSceneAtmosphere, getAccentProminence, getAccentOpacity, getSceneStripeWidth,
  type SceneAtmosphere, type AccentProminence,
} from './education-scene-atmosphere';
export {
  SCENE_EMOTIONAL_PROFILES, EMOTIONAL_MOTION, EMOTIONAL_KEYFRAMES, EMOTIONAL_VS_DECORATIVE,
  getSceneEmotionalProfile, emotionalRewardStyle, emotionalDiscoveryStyle, emotionalProgressStyle,
  type EmotionalDriver, type EmotionalTrigger, type EmotionalReward, type EmotionalMotionConfig,
  type SceneEmotionalProfile,
} from './education-emotional-layer';
