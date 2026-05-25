/**
 * EDU RENDERING CONTEXT — Bridge between edu tokens and block renderers
 *
 * This context object is passed to block renderers so they can
 * access educational design tokens without importing the edu
 * modules directly. It provides a clean API surface that maps
 * pedagogical intent to visual output.
 *
 * Architecture: 6-Layer System
 *   Layer 1: Educational Foundation  → typography, color, readability
 *   Layer 2: Spatial System          → rhythm, density, whitespace
 *   Layer 3: Component Grammar       → card, header, body, footer
 *   Layer 4: Interaction Language    → hover, click, transition
 *   Layer 5: Emotional Interaction   → progress, discovery, reward
 *   Layer 6: Gamification            → optional (FASE 3)
 *
 * Usage in renderers:
 *   // Old API (still works, sceneType inferred from blockType)
 *   const edu = createEduContext(tokens, blockType, isCompact, mode);
 *
 *   // New API (explicit sceneType for scene-aware rendering)
 *   const edu = createEduContext(tokens, blockType, isCompact, mode, sceneType);
 *   edu.hero()        → { fontSize: '56px', ... } (Intro) or { fontSize: '44px', ... } (Concept)
 *   edu.atmosphere()  → { primary: 'materi', bgTint: '...', ... }
 *   edu.emotional()   → { primary: 'discovery', rewards: [...], ... }
 *   edu.sceneBg()     → '#FFFFFF' with subtle tint for scene atmosphere
 */

import type { TokenResolver } from '../renderer/types';
import {
  type EduTypographyKey,
  type EduDisplayMode,
  resolveEduTypography,
  resolveEduTypographyCompact,
  resolveEduTypographyScene,
  resolveEduTypographySceneCompact,
} from './education-typography';
import {
  type EduSemanticColor,
  EDU_COLOR_IDENTITY,
  EDU_MODE_BG,
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
  eduEmotionalStyle,
  type EmotionalMotionType,
} from './education-motion';
import { EDU_PRINT_SAFE } from './education-layout-rules';
import {
  type SceneType,
  type SceneTypeDefinition,
  SCENE_TYPES,
  inferSceneType,
} from './education-scene-types';
import {
  type SceneAtmosphere,
  type AccentProminence,
  SCENE_ATMOSPHERES,
  PROMINENCE_OPACITY,
  STRIPE_WIDTH,
  getAccentProminence,
  getAccentOpacity,
  getSceneStripeWidth,
} from './education-scene-atmosphere';
import {
  type SceneEmotionalProfile,
  type EmotionalReward,
  type EmotionalTrigger,
  SCENE_EMOTIONAL_PROFILES,
  getSceneEmotionalProfile,
} from './education-emotional-layer';

// ═══════════════════════════════════════════════════════════════
// EDU RENDERING CONTEXT
// ═══════════════════════════════════════════════════════════════

export class EduRenderingContext {
  private tokens: TokenResolver;
  private semanticColor: EduSemanticColor;
  private component: EduComponentIdentity;
  private mode: EduDisplayMode;
  private isCompact: boolean;
  private _sceneType: SceneType;

  constructor(
    tokens: TokenResolver,
    blockType: string,
    isCompact: boolean = false,
    mode: EduDisplayMode = 'classroom',
    sceneType?: SceneType,
  ) {
    this.tokens = tokens;
    this.semanticColor = blockTypeToSemanticColor(blockType);
    this.component = getEduComponentForBlock(blockType);
    this.mode = mode;
    this.isCompact = isCompact;
    // Infer scene type from blockType if not explicitly provided
    this._sceneType = sceneType ?? inferSceneType(undefined, undefined, blockType);
  }

  // ── Typography helpers (scene-aware) ──────────────────────

  /** Hero typography — for scene-opening headlines, cover titles.
   *  Size varies by scene type: Intro=56px, Concept=44px, Practice=36px */
  hero(): Record<string, string | number> {
    return resolveEduTypographySceneCompact('hero', this._sceneType, this.isCompact, this.mode);
  }

  /** Title typography — for page/scene headings.
   *  Scene-aware: Intro=44px, Concept=40px, Practice=36px */
  title(): Record<string, string | number> {
    return resolveEduTypographySceneCompact('title', this._sceneType, this.isCompact, this.mode);
  }

  /** Section heading typography — for component headings.
   *  Scene-aware: Intro=30px, Concept=28px, Summary=30px */
  heading(): Record<string, string | number> {
    return resolveEduTypographySceneCompact('section', this._sceneType, this.isCompact, this.mode);
  }

  /** Large body typography — key definitions.
   *  Scene-aware: Practice=24px (larger for instructions) */
  bodyLg(): Record<string, string | number> {
    return resolveEduTypographySceneCompact('bodyLg', this._sceneType, this.isCompact, this.mode);
  }

  /** Standard body typography — most content.
   *  Scene-aware: Practice=22px (larger for doing), Concept=20px */
  body(): Record<string, string | number> {
    return resolveEduTypographySceneCompact('body', this._sceneType, this.isCompact, this.mode);
  }

  /** Caption typography — labels, metadata */
  caption(): Record<string, string | number> {
    return resolveEduTypographySceneCompact('caption', this._sceneType, this.isCompact, this.mode);
  }

  /** Micro typography — badges only, NOT for content */
  micro(): Record<string, string | number> {
    return resolveEduTypography('micro', this.mode);
  }

  /** Resolve any typography key (scene-aware) */
  typo(key: EduTypographyKey): Record<string, string | number> {
    return resolveEduTypographySceneCompact(key, this._sceneType, this.isCompact, this.mode);
  }

  // ── Scene context ──────────────────────────────────────────

  /** Get the current scene type */
  get sceneType(): SceneType {
    return this._sceneType;
  }

  /** Get the scene type definition */
  sceneDefinition(): SceneTypeDefinition {
    return SCENE_TYPES[this._sceneType];
  }

  /** Get the scene emotional profile */
  emotional(): SceneEmotionalProfile {
    return getSceneEmotionalProfile(this._sceneType);
  }

  /** Get the scene atmosphere */
  atmosphere(): SceneAtmosphere {
    return SCENE_ATMOSPHERES[this._sceneType];
  }

  /** Get the scene intensity (0-1) */
  sceneIntensity(): number {
    return SCENE_TYPES[this._sceneType].intensity;
  }

  /** Get the default reveal strategy for this scene */
  revealStrategy(): 'all-visible' | 'progressive' | 'on-interaction' {
    return SCENE_TYPES[this._sceneType].defaultRevealStrategy;
  }

  /** Scene background with subtle atmosphere tint */
  sceneBg(): string {
    const atmosphere = SCENE_ATMOSPHERES[this._sceneType];
    // In print mode, always pure white
    if (this.mode === 'print') return EDU_MODE_BG.print.bg;
    // Otherwise, base background from display mode
    return EDU_MODE_BG[this.mode].bg;
  }

  /** Scene background with atmosphere tint overlay */
  sceneBgTinted(): string {
    const atmosphere = SCENE_ATMOSPHERES[this._sceneType];
    if (this.mode === 'print') return EDU_MODE_BG.print.bg;
    // Return the subtle tint — renderers can use as background or overlay
    return atmosphere.bgTint;
  }

  // ── Display mode helpers ────────────────────────────────────

  /** Get the current display mode */
  get displayMode(): EduDisplayMode {
    return this.mode;
  }

  /** Is this print mode? */
  isPrint(): boolean {
    return this.mode === 'print';
  }

  /** Is this projector mode? */
  isProjector(): boolean {
    return this.mode === 'projector';
  }

  /** Page background for the current display mode */
  pageBg(): string {
    return EDU_MODE_BG[this.mode].bg;
  }

  /** Secondary page background for the current display mode */
  pageBg2(): string {
    return EDU_MODE_BG[this.mode].bg2;
  }

  /** Card background for the current display mode */
  pageCardBg(): string {
    return EDU_MODE_BG[this.mode].card;
  }

  // ── Color helpers (scene-aware accent prominence) ─────────

  /** Get the semantic color for this component.
   *  In print mode, all accents become black for B&W fotokopi safety.
   *  Scene-aware: accent prominence affects opacity. */
  accent(): string {
    if (this.mode === 'print') return EDU_PRINT_SAFE.stripeColor;
    return this.tokens.color(this.component.color === this.semanticColor
      ? EDU_COLOR_IDENTITY[this.semanticColor].tokenKey
      : EDU_COLOR_IDENTITY[this.semanticColor].tokenKey);
  }

  /** Accent color with alpha.
   *  Scene-aware: reduced opacity for muted/minimal prominence colors.
   *  In print mode, uses grayscale alpha for B&W safety. */
  accentAlpha(a: number): string {
    if (this.mode === 'print') {
      const pct = Math.round(a * 100);
      return `rgba(0,0,0,${pct / 100})`;
    }
    // Apply scene-aware prominence multiplier
    const prominenceMultiplier = getAccentOpacity(this._sceneType, this.semanticColor, 'text');
    const adjustedA = a * prominenceMultiplier;
    const key = EDU_COLOR_IDENTITY[this.semanticColor].tokenKey;
    return this.tokens.colorAlpha(key, adjustedA);
  }

  /** Semantic background — WCAG-safe opacity, scene-aware.
   *  In print mode, uses very light gray instead of color fills
   *  so content survives B&W fotokopi. */
  accentBg(): string {
    if (this.mode === 'print') {
      return 'rgba(0,0,0,0.04)';
    }
    const identity = EDU_COLOR_IDENTITY[this.semanticColor];
    // Apply scene-aware prominence multiplier to bg opacity
    const prominenceMultiplier = getAccentOpacity(this._sceneType, this.semanticColor, 'bg');
    const adjustedOpacity = identity.bgOpacity * prominenceMultiplier;
    return this.tokens.colorAlpha(identity.tokenKey, adjustedOpacity);
  }

  /** Semantic border — WCAG-safe opacity, scene-aware.
   *  In print mode, uses dark gray for B&W fotokopi safety. */
  accentBorder(): string {
    if (this.mode === 'print') {
      return EDU_PRINT_SAFE.borderColor;
    }
    const identity = EDU_COLOR_IDENTITY[this.semanticColor];
    // Apply scene-aware prominence multiplier to border opacity
    const prominenceMultiplier = getAccentOpacity(this._sceneType, this.semanticColor, 'border');
    const adjustedOpacity = identity.borderOpacity * prominenceMultiplier;
    return this.tokens.colorAlpha(identity.tokenKey, adjustedOpacity);
  }

  /** Text color.
   *  In print mode, always returns pure black for B&W fotokopi safety. */
  textColor(): string {
    if (this.mode === 'print') return EDU_PRINT_SAFE.textColor;
    return this.tokens.color('text');
  }

  /** Muted text.
   *  In print mode, uses dark gray for B&W safety. */
  mutedText(a: number = 0.8): string {
    if (this.mode === 'print') return 'rgba(0,0,0,0.6)';
    return this.tokens.muted(a);
  }

  /** Card background — mode-aware + scene treatment.
   *  Scene-aware: elevated/flat/subtle treatment per scene. */
  cardBg(): string {
    if (this.mode === 'print') return EDU_PRINT_SAFE.bgColor;
    if (this.mode === 'projector') return EDU_MODE_BG.projector.card;
    if (this.mode === 'student') return EDU_MODE_BG.student.card;
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

  // ── Spacing helpers (scene-aware density) ─────────────────

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

  /** Accent stripe width — scene-aware (bold/normal/gentle) */
  stripeWidth(): number {
    // In print mode, always use thick stripe
    if (this.mode === 'print') return EDU_PRINT_SAFE.stripeWidth;
    return getSceneStripeWidth(this._sceneType);
  }

  // ── Motion helpers (structural + emotional) ───────────────

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

  /** Emotional motion style — for Layer 5 interactions.
   *  Use for progress fills, reveal animations, reward feedback. */
  emotionalMotion(
    type: EmotionalMotionType,
    index?: number,
  ): Record<string, string> {
    return eduEmotionalStyle(type, index);
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

  // ── Layout helpers (scene-aware) ──────────────────────────

  /** Card style with scene-aware treatment.
   *  Scene determines: elevated/flat/subtle card treatment.
   *  In print mode: removes shadow, uses thick border for B&W fotokopi safety.
   *  In projector mode: warm card background, slightly larger radius. */
  cardStyle(): Record<string, string | number> {
    const atmosphere = SCENE_ATMOSPHERES[this._sceneType];
    const style: Record<string, string | number> = {
      background: this.cardBg(),
      borderRadius: this.radius(this.component.radiusKey),
      border: `${this.mode === 'print' ? EDU_PRINT_SAFE.borderWidth : 1}px solid ${this.accentBorder()}`,
    };

    if (this.mode === 'print') {
      style.boxShadow = 'none';
    } else {
      // Scene-aware shadow: elevated scenes get shadow, flat/subtle don't
      if (atmosphere.cardTreatment === 'elevated') {
        style.boxShadow = this.component.shadow === 'elevated'
          ? this.tokens.raw.shadow.elevated
          : this.tokens.raw.shadow.card;
      } else {
        // flat or subtle — minimal shadow
        style.boxShadow = this.component.shadow === 'elevated'
          ? this.tokens.raw.shadow.card
          : 'none';
      }
    }
    return style;
  }

  /** Header style with scene-aware stripe and treatment.
   *  Scene determines: bold/normal/gentle stripe, accented/outlined/minimal header.
   *  In print mode: uses thick black stripe instead of color fill. */
  headerStyle(): Record<string, string | number> {
    const atmosphere = SCENE_ATMOSPHERES[this._sceneType];
    const style: Record<string, string | number> = {
      ...this.sectionPadding(),
    };

    // Scene-aware header treatment
    if (atmosphere.headerTreatment === 'accented') {
      style.background = this.accentBg();
    } else if (atmosphere.headerTreatment === 'outlined') {
      style.background = 'transparent';
      style.borderBottom = `1px solid ${this.accentBorder()}`;
    } else {
      // minimal — no background, no border
      style.background = 'transparent';
    }

    // Scene-aware stripe
    if (this.component.hasStripe) {
      const stripeWidth = this.stripeWidth();
      style.borderLeft = `${stripeWidth}px solid ${this.accent()}`;
    }
    return style;
  }

  /** Shadow by level.
   *  In print mode: always returns 'none'. */
  shadow(level: 'none' | 'card' | 'elevated'): string {
    if (this.mode === 'print') return EDU_PRINT_SAFE.shadow;
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
// Backward compatible: old 4-param API still works.
// New 5-param API accepts explicit sceneType.

export function createEduContext(
  tokens: TokenResolver,
  blockType: string,
  isCompact: boolean = false,
  mode: EduDisplayMode = 'classroom',
  sceneType?: SceneType,
): EduRenderingContext {
  return new EduRenderingContext(tokens, blockType, isCompact, mode, sceneType);
}
