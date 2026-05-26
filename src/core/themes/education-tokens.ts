// ═══════════════════════════════════════════════════════════════════
// EDUCATIONAL DESIGN TOKENS — Central aggregator
// ═══════════════════════════════════════════════════════════════════
// Single import point for all educational design system tokens.
// Renderers import from here instead of individual files.
//
// Usage:
//   import { EDU_TOKENS } from '@/core/themes/education-tokens';
//   EDU_TOKENS.colors.getComponent('tujuan') → { accent, accentSoft, border, text, icon }
//   EDU_TOKENS.typography.getStyle('sectionTitle') → { fontSize, fontWeight, lineHeight, ... }
//   EDU_TOKENS.spacing.rhythm.titleToContent → 32
//   EDU_TOKENS.density.validate('materi', { words: 95 }) → { passes: true }
// ═══════════════════════════════════════════════════════════════════

export { EDU_SURFACES, EDU_TEXT, EDU_COMPONENT_COLORS, EDU_FEEDBACK, EDU_PRINT_ACCENTS, getEduComponentStyle, validateEduContrast, contrastRatio, relativeLuminance } from './education-colors';
export type { EduViewingMode, EduSurfaceColors, EduTextColors, EduComponentRole, EduComponentColorSet, EduFeedbackColors } from './education-colors';

export { EDU_TYPOGRAPHY, EDU_FONT_WEIGHTS, EDU_FONT_FAMILIES, EDU_FONT_MAP, EDU_TEXT_WIDTH, EDU_PROJECTOR_MINIMUMS, eduTypographyStyle, meetsProjectorMinimum } from './education-typography';
export type { EduTypographyLevel, EduTypographySpec, EduFontWeight } from './education-typography';

export { EDU_RHYTHM, EDU_SAFE_MARGINS, EDU_CONTENT_WIDTH, EDU_DENSITY_BUDGETS, EDU_COGNITIVE_LOAD_RULES, validateDensity } from './education-spacing';
export type { EduDensityBudget, CognitiveLoadRule, DensityValidationResult } from './education-spacing';

export { EDU_LAYOUT_RULES, SECTION_TO_LAYOUT, EDU_LAYOUT_FORBIDDEN } from './education-layout-rules';
export type { EduLayoutPattern, EduLayoutRule } from './education-layout-rules';

export { EDU_COMPONENTS, PEDAGOGICAL_SEQUENCE, TEMPLATE_SEQUENCES, validatePedagogicalSequence } from './education-components';
export type { EduComponentDefinition, EduComponentStyle, EduComponentGrammar } from './education-components';

export { EDU_MOTION, EDU_MOTION_FORBIDDEN, EDU_INTERACTION_TW } from './education-motion';

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE AGGREGATOR — EDU_TOKENS namespace
// ═══════════════════════════════════════════════════════════════════

import { EDU_SURFACES, EDU_TEXT, EDU_COMPONENT_COLORS, getEduComponentStyle, type EduViewingMode, type EduComponentRole } from './education-colors';
import { EDU_TYPOGRAPHY, EDU_FONT_FAMILIES, EDU_FONT_MAP, EDU_TEXT_WIDTH, EDU_PROJECTOR_MINIMUMS, eduTypographyStyle, type EduTypographyLevel } from './education-typography';
import { EDU_RHYTHM, EDU_SAFE_MARGINS, EDU_CONTENT_WIDTH, EDU_DENSITY_BUDGETS, validateDensity } from './education-spacing';
import { EDU_LAYOUT_RULES, SECTION_TO_LAYOUT } from './education-layout-rules';
import { EDU_COMPONENTS, PEDAGOGICAL_SEQUENCE, TEMPLATE_SEQUENCES, validatePedagogicalSequence } from './education-components';
import { EDU_MOTION, EDU_INTERACTION_TW } from './education-motion';

export const EDU_TOKENS = {
  // ── Layer 0: Color System ──
  colors: {
    surfaces: EDU_SURFACES,
    text: EDU_TEXT,
    components: EDU_COMPONENT_COLORS,
    getComponent: getEduComponentStyle,
  },

  // ── Layer 1: Typography System ──
  typography: {
    scale: EDU_TYPOGRAPHY,
    families: EDU_FONT_FAMILIES,
    fontMap: EDU_FONT_MAP,
    widths: EDU_TEXT_WIDTH,
    projectorMinimums: EDU_PROJECTOR_MINIMUMS,
    getStyle: eduTypographyStyle,
  },

  // ── Layer 2: Spacing + Density ──
  spacing: {
    rhythm: EDU_RHYTHM,
    safeMargins: EDU_SAFE_MARGINS,
    contentWidth: EDU_CONTENT_WIDTH,
    density: {
      budgets: EDU_DENSITY_BUDGETS,
      validate: validateDensity,
    },
  },

  // ── Layer 3: Layout Grammar ──
  layout: {
    rules: EDU_LAYOUT_RULES,
    sectionMap: SECTION_TO_LAYOUT,
  },

  // ── Layer 4: Components ──
  components: {
    definitions: EDU_COMPONENTS,
    sequence: PEDAGOGICAL_SEQUENCE,
    templates: TEMPLATE_SEQUENCES,
    validateSequence: validatePedagogicalSequence,
  },

  // ── Layer 5: Motion ──
  motion: EDU_MOTION,
  interaction: EDU_INTERACTION_TW,
} as const;
