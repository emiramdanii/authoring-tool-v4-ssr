/**
 * EDU RENDERING CONTEXT — Bridge between edu tokens and block renderers
 *
 * This context object is passed to block renderers so they can
 * access educational design tokens without importing the edu
 * modules directly. It provides a clean API surface that maps
 * pedagogical intent to visual output.
 *
 * Usage in renderers:
 *   const edu = useEduRenderingContext(tokens, blockType);
 *   edu.heading()    → { fontSize, fontWeight, lineHeight, ... }
 *   edu.body()       → { fontSize: '18px', fontWeight: 400, ... }
 *   edu.accent()     → '#f9c12e' (theme-aware)
 *   edu.accentBg()   → 'rgba(249,193,46,0.1)'
 */

import type { TokenResolver } from '../renderer/types';
import {
  type EduTypographyKey,
  type EduDisplayMode,
  resolveEduTypography,
  resolveEduTypographyCompact,
} from './education-typography';
import {
  type EduSemanticColor,
  EDU_COLOR_IDENTITY,
  blockTypeToSemanticColor,
} from './education-colors';
import {
  EDU_SPACING,
  eduComponentPadding,
  eduSectionPadding,
  eduNestedPadding,
} from './education-spacing';
import {
  type EduComponentRole,
  type EduComponentIdentity,
  EDU_COMPONENTS,
  getEduComponentForBlock,
} from './education-components';
import {
  eduTransitionStyle,
  eduEntranceStyle,
} from './education-motion';

// ═══════════════════════════════════════════════════════════════
// EDU RENDERING CONTEXT
// ═══════════════════════════════════════════════════════════════

export class EduRenderingContext {
  private tokens: TokenResolver;
  private semanticColor: EduSemanticColor;
  private component: EduComponentIdentity;
  private mode: EduDisplayMode;
  private isCompact: boolean;

  constructor(
    tokens: TokenResolver,
    blockType: string,
    isCompact: boolean = false,
    mode: EduDisplayMode = 'classroom',
  ) {
    this.tokens = tokens;
    this.semanticColor = blockTypeToSemanticColor(blockType);
    this.component = getEduComponentForBlock(blockType);
    this.mode = mode;
    this.isCompact = isCompact;
  }

  // ── Typography helpers ─────────────────────────────────────

  /** Title typography — for page/scene headings */
  title(): Record<string, string | number> {
    return resolveEduTypographyCompact('title', this.isCompact, this.mode);
  }

  /** Section heading typography — for component headings */
  heading(): Record<string, string | number> {
    return resolveEduTypographyCompact('section', this.isCompact, this.mode);
  }

  /** Large body typography — key definitions */
  bodyLg(): Record<string, string | number> {
    return resolveEduTypographyCompact('bodyLg', this.isCompact, this.mode);
  }

  /** Standard body typography — most content */
  body(): Record<string, string | number> {
    return resolveEduTypographyCompact('body', this.isCompact, this.mode);
  }

  /** Caption typography — labels, metadata */
  caption(): Record<string, string | number> {
    return resolveEduTypographyCompact('caption', this.isCompact, this.mode);
  }

  /** Micro typography — badges only, NOT for content */
  micro(): Record<string, string | number> {
    return resolveEduTypography('micro', this.mode);
  }

  /** Resolve any typography key */
  typo(key: EduTypographyKey): Record<string, string | number> {
    return resolveEduTypographyCompact(key, this.isCompact, this.mode);
  }

  // ── Color helpers ──────────────────────────────────────────

  /** Get the semantic color for this component */
  accent(): string {
    return this.tokens.color(this.component.color === this.semanticColor
      ? EDU_COLOR_IDENTITY[this.semanticColor].tokenKey
      : EDU_COLOR_IDENTITY[this.semanticColor].tokenKey);
  }

  /** Accent color with alpha */
  accentAlpha(a: number): string {
    const key = EDU_COLOR_IDENTITY[this.semanticColor].tokenKey;
    return this.tokens.colorAlpha(key, a);
  }

  /** Semantic background — WCAG-safe opacity */
  accentBg(): string {
    const identity = EDU_COLOR_IDENTITY[this.semanticColor];
    return this.tokens.colorAlpha(identity.tokenKey, identity.bgOpacity);
  }

  /** Semantic border — WCAG-safe opacity */
  accentBorder(): string {
    const identity = EDU_COLOR_IDENTITY[this.semanticColor];
    return this.tokens.colorAlpha(identity.tokenKey, identity.borderOpacity);
  }

  /** Text color */
  textColor(): string {
    return this.tokens.color('text');
  }

  /** Muted text */
  mutedText(a: number = 0.8): string {
    return this.tokens.muted(a);
  }

  /** Card background */
  cardBg(): string {
    return this.tokens.color('card');
  }

  /** Get any theme color */
  color(key: string): string {
    return this.tokens.color(key);
  }

  /** Get any theme color with alpha */
  colorAlpha(key: string, a: number): string {
    return this.tokens.colorAlpha(key, a);
  }

  // ── Spacing helpers ────────────────────────────────────────

  /** Component padding */
  componentPadding(): Record<string, string> {
    return eduComponentPadding(this.isCompact);
  }

  /** Section padding */
  sectionPadding(): Record<string, string> {
    return eduSectionPadding(this.isCompact);
  }

  /** Nested padding */
  nestedPadding(): Record<string, string> {
    return eduNestedPadding(this.isCompact);
  }

  /** Gap between items */
  gap(type: 'tight' | 'standard' | 'generous' | 'section' = 'standard'): string {
    return `${EDU_SPACING.gap[type]}px`;
  }

  /** Icon size */
  iconSize(level: 'sm' | 'md' | 'lg' | 'xl' = 'md'): number {
    return EDU_SPACING.icon[level];
  }

  /** Border radius */
  radius(key: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'lg'): string {
    return `${EDU_SPACING.radius[key]}px`;
  }

  /** Accent stripe width */
  stripeWidth(): number {
    return this.component.stripeWidth;
  }

  // ── Motion helpers ─────────────────────────────────────────

  /** Edu transition style */
  transition(
    properties: string = 'all',
    speed: 'instant' | 'fast' | 'standard' | 'slow' = 'standard',
  ): Record<string, string> {
    return eduTransitionStyle(properties, speed);
  }

  /** Edu entrance animation */
  entrance(
    index: number = 0,
    type: 'fadeIn' | 'slideUp' = 'slideUp',
  ): Record<string, string> {
    return eduEntranceStyle(index, type);
  }

  // ── Component identity ─────────────────────────────────────

  /** Get the component identity */
  identity(): EduComponentIdentity {
    return this.component;
  }

  /** Get the semantic color role */
  role(): EduSemanticColor {
    return this.semanticColor;
  }

  /** Component heading prefix */
  headingPrefix(): string {
    return this.component.headingPrefix;
  }

  // ── Layout helpers ─────────────────────────────────────────

  /** Card style with edu-compliant radius and shadow */
  cardStyle(): Record<string, string | number> {
    return {
      background: this.cardBg(),
      borderRadius: this.radius(this.component.radiusKey),
      border: `1px solid ${this.accentBorder()}`,
      boxShadow: this.component.shadow === 'elevated'
        ? this.tokens.raw.shadow.elevated
        : this.component.shadow === 'card'
          ? this.tokens.raw.shadow.card
          : 'none',
    };
  }

  /** Header style with accent stripe */
  headerStyle(): Record<string, string | number> {
    const style: Record<string, string | number> = {
      ...this.sectionPadding(),
      background: this.accentBg(),
    };
    if (this.component.hasStripe) {
      style.borderLeft = `${this.component.stripeWidth}px solid ${this.accent()}`;
    }
    return style;
  }

  /** Shadow by level */
  shadow(level: 'none' | 'card' | 'elevated'): string {
    if (level === 'none') return 'none';
    if (level === 'elevated') return this.tokens.raw.shadow.elevated;
    return this.tokens.raw.shadow.card;
  }

  /** Is dark theme */
  isDark(): boolean {
    return this.tokens.isDark();
  }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY: Create an EduRenderingContext
// ═══════════════════════════════════════════════════════════════

export function createEduContext(
  tokens: TokenResolver,
  blockType: string,
  isCompact: boolean = false,
  mode: EduDisplayMode = 'classroom',
): EduRenderingContext {
  return new EduRenderingContext(tokens, blockType, isCompact, mode);
}
