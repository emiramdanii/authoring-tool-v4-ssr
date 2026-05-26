// ═══════════════════════════════════════════════════════════════════
// EDUCATIONAL RENDERING CONTEXT — Viewing mode + contract selection
// ═══════════════════════════════════════════════════════════════════
// "Tool membuat slide" → "Instructional design operating system"
//
// This context bridges the Educational Design System tokens with
// the actual rendering pipeline. It provides:
//   1. Viewing mode (classroom/projector/print/student-screen)
//   2. Visual contract selection (iOS for chrome, Edu for canvas)
//   3. Block type → Edu component role mapping
//   4. Density validation helpers
//
// Architecture:
//   - Canvas content uses Edu contract (teacher-first, projector-optimized)
//   - App chrome (sidebar, toolbar) uses iOS contract (compact, phone-style)
//   - Viewing mode is propagated from schema/user preference
//   - Each block renderer can query its edu role for semantic styling
// ═══════════════════════════════════════════════════════════════════

'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { EduViewingMode, EduComponentRole } from '../themes/education-colors';
import { EDU_COMPONENT_COLORS, EDU_SURFACES, EDU_TEXT, getEduComponentStyle, EDU_PRINT_ACCENTS } from '../themes/education-colors';
import { EDU_TYPOGRAPHY, EDU_FONT_FAMILIES, EDU_FONT_MAP, type EduTypographyLevel } from '../themes/education-typography';
import { EDU_RHYTHM, EDU_CONTENT_WIDTH, EDU_SAFE_MARGINS, EDU_DENSITY_BUDGETS, validateDensity } from '../themes/education-spacing';
import { EDU_MOTION, EDU_INTERACTION_TW, EDU_MOTION_FORBIDDEN } from '../themes/education-motion';
import { EDU_COMPONENTS, PEDAGOGICAL_SEQUENCE, validatePedagogicalSequence } from '../themes/education-components';
import { EDU_LAYOUT_RULES, SECTION_TO_LAYOUT } from '../themes/education-layout-rules';

// ═══════════════════════════════════════════════════════════════════
// BLOCK TYPE → EDU ROLE MAPPING
// ═══════════════════════════════════════════════════════════════════
// Maps VCS block types to educational component roles.
// This is how the renderer knows which semantic colors/icons to use
// for each block type, regardless of the theme's color palette.
// ═══════════════════════════════════════════════════════════════════

export const BLOCK_TYPE_TO_EDU_ROLE: Record<string, EduComponentRole> = {
  // Core pedagogical blocks
  'tujuan-display': 'tujuan',
  'materi-section': 'materi',
  'materi-blok': 'materi',
  'def-box': 'contoh',
  'nc-grid': 'contoh',
  'diskusi': 'diskusi',
  'refleksi': 'refleksi',
  'kuis': 'quiz',
  'rangkuman': 'rangkuman',
  'penutup': 'rangkuman',

  // Supporting blocks
  'cover': 'tujuan',
  'hero': 'tujuan',
  'motivasi': 'tujuan',
  'petunjuk': 'aktivitas',
  'skenario': 'aktivitas',
  'alur': 'aktivitas',
  'tp': 'tujuan',

  // Assessment/game blocks
  'game-roda': 'quiz',
  'game-crossword': 'quiz',
  'game-fill-blank': 'quiz',
  'game-drag-drop': 'aktivitas',
  'game-match': 'quiz',
  'game-memory': 'aktivitas',
  'game-sortir': 'aktivitas',
  'game-true-false': 'quiz',
  'game-word-search': 'quiz',
  'game-team-buzzer': 'aktivitas',

  // Content blocks
  'tabel': 'materi',
  'tabel-accordion': 'materi',
  'gambar': 'materi',
  'compare': 'contoh',
  'timeline': 'materi',
  'checklist': 'tujuan',
  'reveal': 'contoh',
  'flashcard-set': 'contoh',
  'ftab': 'materi',
  'studi': 'materi',
  'statistik': 'materi',
  'norma-kartu': 'contoh',
  'hasil': 'rangkuman',
};

/**
 * Get the educational component role for a given block type.
 * Falls back to 'materi' for unknown block types.
 */
export function getEduRoleForBlockType(blockType: string): EduComponentRole {
  return BLOCK_TYPE_TO_EDU_ROLE[blockType] ?? 'materi';
}

// ═══════════════════════════════════════════════════════════════════
// EDU RENDERING CONTEXT
// ═══════════════════════════════════════════════════════════════════

export interface EduRenderingContextValue {
  /** Current viewing mode — affects colors, spacing, and contrast */
  viewingMode: EduViewingMode;
  /** Whether to use educational visual contract (true for canvas content) */
  useEduContract: boolean;
  /** Get the edu component role for a block type */
  getEduRole: (blockType: string) => EduComponentRole;
  /** Get complete component style for a pedagogical role */
  getComponentStyle: (role: EduComponentRole) => {
    colors: ReturnType<typeof getEduComponentStyle>;
    typography: {
      heading: Record<string, string | number | undefined>;
      body: Record<string, string | number>;
      caption: Record<string, string | number>;
    };
    spacing: {
      cardPadding: number;
      cardPaddingCompact: number;
      nestedPadding: number;
      sectionGap: number;
      listItemGap: number;
    };
    layout: {
      contentWidth: number;
      alignment: 'left' | 'center';
      borderStyle: string;
      stripeWidth: number;
      backgroundTint: boolean;
    };
    motion: {
      hover: typeof EDU_MOTION.hover;
      entrance: typeof EDU_MOTION.entrance;
      transition: typeof EDU_MOTION.scene;
    };
    icon: {
      name: string;
      size: number;
      position: 'left' | 'above' | 'inline';
    };
  };
  /** Validate content density for a slide type */
  validateSlideDensity: (slideType: string, counts: {
    bullets?: number; paragraphs?: number; words?: number;
    colors?: number; mediaElements?: number; sections?: number;
  }) => { passes: boolean; warnings: { metric: string; current: number; max: number }[] };
  /** Get surface colors for current viewing mode */
  surfaces: typeof EDU_SURFACES[EduViewingMode];
  /** Get text colors for current viewing mode */
  textColors: typeof EDU_TEXT[EduViewingMode];
}

const EduRendererContext = createContext<EduRenderingContextValue | null>(null);

// ═══════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════

export interface EduRendererProviderProps {
  /** Viewing mode — defaults to 'classroom' */
  viewingMode?: EduViewingMode;
  /** Whether to use educational contract — defaults to true for canvas */
  useEduContract?: boolean;
  children: React.ReactNode;
}

export function EduRendererProvider({
  viewingMode = 'classroom',
  useEduContract = true,
  children,
}: EduRendererProviderProps) {
  const value = useMemo<EduRenderingContextValue>(() => {
    const surfaces = EDU_SURFACES[viewingMode];
    const textColors = EDU_TEXT[viewingMode];

    const getComponentStyle: EduRenderingContextValue['getComponentStyle'] = (role) => {
      const colors = getEduComponentStyle(role, viewingMode);
      const comp = EDU_COMPONENTS[role];
      const isPrint = viewingMode === 'print';

      return {
        colors,
        typography: {
          heading: {
            fontSize: isPrint ? EDU_TYPOGRAPHY.sectionTitle.size : EDU_TYPOGRAPHY.sectionTitle.size,
            fontWeight: EDU_TYPOGRAPHY.sectionTitle.weight,
            lineHeight: EDU_TYPOGRAPHY.sectionTitle.lineHeight,
            letterSpacing: `${EDU_TYPOGRAPHY.sectionTitle.letterSpacing}em`,
            fontFamily: EDU_FONT_FAMILIES[EDU_FONT_MAP.sectionTitle],
            color: comp.style.headingPattern === 'uppercase-small'
              ? colors.accent
              : textColors.primary,
            textTransform: comp.style.headingPattern === 'uppercase-small'
              ? 'uppercase' as string | number
              : undefined as string | number | undefined,
          },
          body: {
            fontSize: EDU_TYPOGRAPHY.body.size,
            fontWeight: EDU_TYPOGRAPHY.body.weight,
            lineHeight: EDU_TYPOGRAPHY.body.lineHeight,
            letterSpacing: `${EDU_TYPOGRAPHY.body.letterSpacing}em`,
            fontFamily: EDU_FONT_FAMILIES[EDU_FONT_MAP.body],
            color: textColors.body,
          },
          caption: {
            fontSize: EDU_TYPOGRAPHY.caption.size,
            fontWeight: EDU_TYPOGRAPHY.caption.weight,
            lineHeight: EDU_TYPOGRAPHY.caption.lineHeight,
            letterSpacing: `${EDU_TYPOGRAPHY.caption.letterSpacing}em`,
            fontFamily: EDU_FONT_FAMILIES[EDU_FONT_MAP.caption],
            color: textColors.caption,
          },
        },
        spacing: {
          cardPadding: EDU_RHYTHM.cardPadding,
          cardPaddingCompact: EDU_RHYTHM.cardPaddingCompact,
          nestedPadding: EDU_RHYTHM.nestedPadding,
          sectionGap: EDU_RHYTHM.sectionToSection,
          listItemGap: EDU_RHYTHM.listItem,
        },
        layout: {
          contentWidth: EDU_CONTENT_WIDTH[comp.style.alignment === 'center' ? 'narrow' : 'standard'],
          alignment: comp.style.alignment,
          borderStyle: comp.style.borderStyle,
          stripeWidth: comp.style.stripeWidth,
          backgroundTint: comp.style.backgroundTint && !isPrint,
        },
        motion: {
          hover: EDU_MOTION.hover,
          entrance: EDU_MOTION.entrance,
          transition: EDU_MOTION.scene,
        },
        icon: {
          name: comp.icon,
          size: 18,
          position: comp.style.iconPosition,
        },
      };
    };

    return {
      viewingMode,
      useEduContract,
      getEduRole: getEduRoleForBlockType,
      getComponentStyle,
      validateSlideDensity: validateDensity,
      surfaces,
      textColors,
    };
  }, [viewingMode, useEduContract]);

  return (
    <EduRendererContext.Provider value={value}>
      {children}
    </EduRendererContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

/**
 * Access the educational rendering context.
 * Returns null if no provider is found (e.g., in app chrome).
 */
export function useEduContext(): EduRenderingContextValue | null {
  return useContext(EduRendererContext);
}

/**
 * Access the educational rendering context.
 * Throws if no provider is found (use in canvas renderers only).
 */
export function useEduContextRequired(): EduRenderingContextValue {
  const ctx = useContext(EduRendererContext);
  if (!ctx) {
    throw new Error('useEduContextRequired() must be used within an <EduRendererProvider>');
  }
  return ctx;
}

/**
 * Get the educational component role for a block type.
 * Works outside of React context — can be used in any context.
 */
export function useEduRoleForBlock(blockType: string): EduComponentRole {
  const ctx = useEduContext();
  if (ctx) return ctx.getEduRole(blockType);
  return getEduRoleForBlockType(blockType);
}

// ═══════════════════════════════════════════════════════════════════
// RENDER EDUCATIONAL COMPONENT — Bridge utility
// ═══════════════════════════════════════════════════════════════════
// This is the central bridge between the edu token system and
// actual renderers. It generates complete component style objects
// based on pedagogical role, viewing mode, and density rules.
//
// Usage in block renderers:
//   const edu = renderEducationalComponent('tujuan', tokens, { compact: isCompact });
//   <div style={edu.containerStyle}>
//     <div style={edu.headerStyle}>
//       <Icon name={edu.icon.name} size={edu.icon.size} color={edu.colors.accent} />
//       <span style={edu.headingStyle}>TUJUAN PEMBELAJARAN</span>
//     </div>
//     <div style={edu.contentStyle}>{children}</div>
//   </div>
// ═══════════════════════════════════════════════════════════════════

export interface EduComponentRenderResult {
  /** Complete container style — bg, border, padding, border-radius */
  containerStyle: Record<string, string | number>;
  /** Header section style — for the component title/icon row */
  headerStyle: Record<string, string | number>;
  /** Heading text style — component title text */
  headingStyle: Record<string, string | number>;
  /** Content area style — for body text below the header */
  contentStyle: Record<string, string | number>;
  /** Individual item style — for list items within the component */
  itemStyle: (index: number, colorOverride?: string) => Record<string, string | number>;
  /** Semantic color set for the component role */
  colors: {
    accent: string;
    accentSoft: string;
    border: string;
    text: string;
    icon: string;
    bg: string;
    cardBg: string;
  };
  /** Icon metadata */
  icon: {
    name: string;
    size: number;
    color: string;
    position: 'left' | 'above' | 'inline';
  };
  /** Component definition */
  definition: typeof EDU_COMPONENTS[EduComponentRole];
  /** Tailwind class strings for interactions */
  tw: {
    button: string;
    card: string;
    quizOption: string;
    static: string;
  };
  /** Transition style helper */
  transitionStyle: (properties?: string) => Record<string, string>;
  /** Entrance animation style helper */
  entranceStyle: (index: number) => Record<string, string>;
}

/**
 * Generate complete educational component styles for a pedagogical role.
 * This is the primary bridge between the edu token system and renderers.
 *
 * @param role - The educational component role
 * @param tokens - The TokenResolver instance
 * @param options - Optional overrides
 */
export function renderEducationalComponent(
  role: EduComponentRole,
  tokens: import('./types').TokenResolver,
  options?: {
    /** Use compact spacing */
    compact?: boolean;
    /** Override viewing mode */
    viewingMode?: EduViewingMode;
    /** Show/hide accent stripe */
    showStripe?: boolean;
    /** Show/hide background tint */
    showBackgroundTint?: boolean;
    /** Override the icon position */
    iconPosition?: 'left' | 'above' | 'inline';
  },
): EduComponentRenderResult {
  const compact = options?.compact ?? false;
  const showStripe = options?.showStripe ?? true;
  const showBgTint = options?.showBackgroundTint ?? true;
  const mode = options?.viewingMode ?? tokens.getEduMode();

  // Ensure token resolver uses the right mode
  const prevMode = tokens.getEduMode();
  if (prevMode !== mode) tokens.setEduMode(mode);

  const colors = tokens.eduComponentColors(role);
  const comp = EDU_COMPONENTS[role];
  const isPrint = mode === 'print';

  const padding = compact ? EDU_RHYTHM.cardPaddingCompact : EDU_RHYTHM.cardPadding;

  // Container style — the outer card shell
  const containerStyle: Record<string, string | number> = {
    background: showBgTint ? colors.accentSoft : colors.cardBg,
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  };

  // Add stripe based on component definition
  if (showStripe && comp.style.borderStyle === 'left-stripe') {
    containerStyle.borderLeft = `${comp.style.stripeWidth}px solid ${colors.accent}`;
  } else if (showStripe && comp.style.borderStyle === 'bottom-accent') {
    containerStyle.borderBottom = `${comp.style.stripeWidth}px solid ${colors.accent}`;
  } else if (comp.style.borderStyle === 'full-border') {
    containerStyle.border = `${comp.style.stripeWidth}px solid ${colors.border}`;
  }

  // Header style
  const headerStyle: Record<string, string | number> = {
    padding: `${padding}px`,
    ...(comp.style.borderStyle === 'left-stripe' ? {
      background: isPrint ? 'transparent' : colors.accentSoft,
      borderLeft: `${comp.style.stripeWidth}px solid ${colors.accent}`,
    } : {}),
  };

  // Heading style
  const headingStyle: Record<string, string | number> = {
    ...tokens.eduTypography(comp.style.headingPattern === 'uppercase-small' ? 'caption' : 'sectionTitle'),
    ...(comp.style.headingPattern === 'uppercase-small' ? {
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: colors.accent,
    } : {
      color: tokens.eduTextPrimary(),
    }),
  };

  // Content style
  const contentStyle: Record<string, string | number> = {
    padding: `${padding}px`,
    paddingTop: comp.style.iconPosition === 'above' ? 0 : padding,
    maxWidth: `${EDU_CONTENT_WIDTH[comp.style.alignment === 'center' ? 'narrow' : 'standard']}px`,
    ...(comp.style.alignment === 'center' ? { margin: '0 auto', textAlign: 'center' } : {}),
  };

  // Item style generator
  const itemStyle = (index: number, colorOverride?: string): Record<string, string | number> => {
    const itemColor = colorOverride ?? colors.accent;
    return {
      padding: `${compact ? EDU_RHYTHM.cardPaddingCompact : EDU_RHYTHM.nestedPadding}px`,
      borderRadius: 12,
      background: isPrint ? 'transparent' : `${itemColor}10`,  // ~6% opacity
      border: `1px solid ${itemColor}30`, // ~19% opacity
      ...(comp.style.bulletStyle === 'checklist' ? {
        borderLeft: `3px solid ${itemColor}`,
      } : {}),
      ...tokens.eduTransitionStyle('background-color, border-color'),
    };
  };

  // Tailwind class strings
  const tw = {
    button: EDU_INTERACTION_TW.button,
    card: EDU_INTERACTION_TW.card,
    quizOption: EDU_INTERACTION_TW.quizOption,
    static: EDU_INTERACTION_TW.static,
  };

  // Transition style helper
  const transitionStyle = (properties: string = 'all'): Record<string, string> => {
    return tokens.eduTransitionStyle(properties);
  };

  // Entrance style helper
  const entranceStyle = (index: number): Record<string, string> => {
    const delay = index * EDU_MOTION.entrance.staggerDelay;
    return {
      animation: `blockStaggerIn ${EDU_MOTION.entrance.duration}ms ${EDU_MOTION.entrance.easing} ${delay}ms both`,
    };
  };

  return {
    containerStyle,
    headerStyle,
    headingStyle,
    contentStyle,
    itemStyle,
    colors,
    icon: {
      name: comp.icon,
      size: compact ? 14 : 18,
      color: colors.accent,
      position: options?.iconPosition ?? comp.style.iconPosition,
    },
    definition: comp,
    tw,
    transitionStyle,
    entranceStyle,
  };
}

// ═══════════════════════════════════════════════════════════════════
// IOS → EDU TYPOGRAPHY LEVEL MAPPING
// ═══════════════════════════════════════════════════════════════════
// Re-exported from types.ts where the mapping is defined alongside
// the TokenResolver that uses it. This avoids circular dependencies.
// ═══════════════════════════════════════════════════════════════════

export { IOS_TO_EDU_TYPOGRAPHY_MAP } from './types';
