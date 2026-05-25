/**
 * EDUCATIONAL DESIGN SYSTEM — Public API
 *
 * This module provides the educational design token layer that
 * replaces the iOS visual contract for CANVAS CONTENT.
 * The iOS VC is still used for app shell/chrome UI.
 *
 * Usage:
 *   import { createEduContext } from '@/core/edu';
 *   const edu = createEduContext(tokens, block.type, isCompact);
 *   edu.heading()  → { fontSize: '28px', fontWeight: 700, ... }
 *   edu.accent()   → '#f9c12e'
 */

export { EDU_TYPOGRAPHY, resolveEduTypography, resolveEduTypographyCompact, type EduTypographyKey, type EduDisplayMode } from './education-typography';
export { EDU_COLOR_IDENTITY, EDU_MODE_BG, blockTypeToSemanticColor, type EduSemanticColor } from './education-colors';
export { EDU_SPACING, eduComponentPadding, eduSectionPadding, eduNestedPadding } from './education-spacing';
export { EDU_COMPONENTS, getEduComponentForBlock, type EduComponentRole, type EduComponentIdentity } from './education-components';
export { EDU_DENSITY, EDU_GRAMMAR, EDU_PRINT_SAFE } from './education-layout-rules';
export { EDU_MOTION, eduTransitionStyle, eduEntranceStyle } from './education-motion';
export { EduRenderingContext, createEduContext } from './EduRenderingContext';
export { EduComponentShell, EduInlineSection, type EduComponentShellProps, type EduInlineSectionProps } from './EduComponentShell';
