// ═══════════════════════════════════════════════════════════════════
// RENDERER TYPES — Shared types for the renderer system
// ═══════════════════════════════════════════════════════════════════
// Extracted from SchemaRenderer.tsx to avoid circular dependencies.
// Block renderers import from this file instead of SchemaRenderer.

import { alpha } from '@/lib/color-palette';
import type { DesignTokens } from '../themes/tokens';
import { resolveTokens } from '../themes/tokens';
import { IOS_TYPOGRAPHY, IOS_CARD, IOS_SHADOW, IOS_SURFACE, IOS_SPACING, IOS_INTERACTION, IOS_COMPOSITION, type IOS_TypographyLevel } from '../themes/ios-visual-contract';
import { EduRenderingContext } from '../edu/EduRenderingContext';
import type { EduDisplayMode } from '../edu/education-typography';
import { EDU_MODE_BG } from '../edu/education-colors';
import { EDU_PRINT_SAFE } from '../edu/education-layout-rules';
import type { SceneType } from '../edu/education-scene-types';

// ═══════════════════════════════════════════════════════════════════
// RENDER MODE
// ═══════════════════════════════════════════════════════════════════

export type SchemaRenderMode = 'canvas' | 'preview' | 'export';

// ═══════════════════════════════════════════════════════════════════
// TOKEN RESOLVER — Maps token keys to actual CSS values
// ═══════════════════════════════════════════════════════════════════

export class TokenResolver {
  private tokens: DesignTokens;
  private _themeId: string | undefined;
  private _displayMode: EduDisplayMode;
  /**
   * Scene type for the current page/scene being rendered.
   * Set by SchemaScreenRenderer before rendering blocks.
   * When set, all tokens.edu() calls automatically inherit this
   * sceneType — making every block renderer scene-aware without
   * any changes to individual renderer code.
   *
   * Flow: PageRenderer → SchemaScreenRenderer → tokens.setSceneType()
   */
  private _sceneType?: SceneType;

  /**
   * Contract style overrides — when a TemplateThemeContract is active,
   * its resolved values OVERRIDE the theme/scene/block defaults.
   * Priority: Contract > Scene > Block Default
   *
   * Set via applyContract() from PageRenderer.
   * Null when no contract is active (legacy behavior).
   */
  private _contractStyle: import('@/core/template/contract/TemplateThemeContract').ContractResolvedStyle | null = null;

  constructor(themeId?: string, displayMode: EduDisplayMode = 'classroom') {
    this._themeId = themeId;
    this._displayMode = displayMode;
    this.tokens = resolveTokens(themeId);
  }

  /** Whether the current theme is a dark theme */
  isDark(): boolean {
    const bg = this.color('bg');
    // Simple luminance check: if bg is dark, theme is dark
    if (!bg || !bg.startsWith('#') || bg.length < 7) return true; // Default to dark
    const r = parseInt(bg.slice(1, 3), 16);
    const g = parseInt(bg.slice(3, 5), 16);
    const b = parseInt(bg.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }

  /** Get the theme ID */
  get themeId(): string | undefined {
    return this._themeId;
  }

  /** Minimum text opacity — enforces WCAG AA readability.
   *  Light themes need higher minimum opacity because dark text on light bg
   *  at low opacity has poor contrast. Dark themes can use lower opacity
   *  because light text on dark bg is readable even at lower alpha.
   *
   *  Previously, muted(0.5) on light bg resulted in ~2.5:1 contrast —
   *  failing WCAG AA for all text sizes. This clamp ensures minimum 0.65
   *  opacity on light themes (~4.5:1 contrast for body text).
   */
  private minOpacity(a: number): number {
    return this.isDark() ? Math.max(a, 0.4) : Math.max(a, 0.65);
  }

  /** Muted text color — adapts to dark/light automatically
   *  Dark: uses 'muted' token, Light: uses 'muted' token (both are theme-appropriate)
   */
  muted(a: number = 1): string {
    return this.colorAlpha('muted', this.minOpacity(a));
  }

  /** Secondary text — slightly dimmer than main text
   *  Uses text color with reduced alpha
   */
  textSecondary(a: number = 0.8): string {
    return this.colorAlpha('text', this.minOpacity(a));
  }

  /** Subtle text — for hints, placeholders, captions
   *  Uses text color with low alpha
   */
  textSubtle(a: number = 0.55): string {
    return this.colorAlpha('text', this.minOpacity(a));
  }

  /** Get a color by token key (e.g., 'y' → '#f9c12e')
   *  When a contract is active, contract colors OVERRIDE theme defaults.
   *  Priority: Contract > Theme token
   */
  color(key: string): string {
    // Contract override: if contract is active, check contract colors first
    if (this._contractStyle) {
      const contractColorMap: Record<string, string> = {
        bg: this._contractStyle.background,
        bg2: this._contractStyle.background, // surface used as bg2
        card: this._contractStyle.cardBg,
        text: this._contractStyle.textColor,
        muted: this._contractStyle.mutedColor,
        y: this._contractStyle.accent, // Primary accent = 'y' in golden contract
      };
      if (key in contractColorMap) return contractColorMap[key]!;
    }
    const colors = this.tokens.colors as Record<string, string>;
    return colors[key] || key; // Pass through if not a token key (already a hex)
  }

  /** Get color with alpha */
  colorAlpha(key: string, a: number): string {
    return alpha(this.color(key), a);
  }

  /** Get spacing value in px */
  spacing(key: keyof DesignTokens['spacing']): string {
    return `${this.tokens.spacing[key]}px`;
  }

  /** Get radius value in px */
  radius(key: keyof DesignTokens['radius']): string {
    return `${this.tokens.radius[key]}px`;
  }

  /** Get font family */
  fontFamily(key: keyof DesignTokens['typography']['fontFamily']): string {
    // Use CSS variables from next/font/google (defined in layout.tsx)
    // Falls back to the token value if CSS vars aren't available
    if (key === 'display') return 'var(--font-fredoka), Fredoka, cursive';
    if (key === 'body') return 'var(--font-nunito), Nunito, sans-serif';
    return this.tokens.typography.fontFamily[key];
  }

  /** Get font size */
  fontSize(key: keyof DesignTokens['typography']['fontSize']): string {
    return this.tokens.typography.fontSize[key];
  }

  /** Get raw tokens */
  get raw(): DesignTokens {
    return this.tokens;
  }

  /** Surface/card background — adapts to theme */
  surface(a: number = 1): string {
    return this.colorAlpha('card', a);
  }

  /** Subtle background for inset areas — rgba(255,255,255,N) on dark, rgba(0,0,0,N) on light */
  subtleBg(opacity: number): string {
    return this.isDark()
      ? `rgba(255,255,255,${opacity})`
      : `rgba(0,0,0,${opacity})`;
  }

  /** Subtle border — rgba(255,255,255,N) on dark, rgba(0,0,0,N) on light */
  subtleBorder(opacity: number): string {
    return this.isDark()
      ? `rgba(255,255,255,${opacity})`
      : `rgba(0,0,0,${opacity})`;
  }

  // ═══════════════════════════════════════════════════════════════════
  // VISUAL CONTRACT HELPERS — Consistent patterns across all renderers
  // ═══════════════════════════════════════════════════════════════════

  /** Standard card style — consistent across all renderers */
  cardStyle(): Record<string, string | number> {
    return {
      background: this.color('card'),
      borderRadius: this.radius('xl'),
      border: `1px solid ${this.subtleBorder(0.06)}`,
      boxShadow: this.tokens.shadow.card,
    };
  }

  /** Elevated card style — for hover/active states */
  elevatedCardStyle(): Record<string, string | number> {
    return {
      background: this.color('card'),
      borderRadius: this.radius('xl'),
      border: `1px solid ${this.subtleBorder(0.08)}`,
      boxShadow: this.tokens.shadow.elevated,
    };
  }

  /** Section padding — consistent content area spacing */
  sectionPadding(): Record<string, string | number> {
    return {
      padding: `${this.tokens.spacing.xxl}px ${this.tokens.spacing.xl}px`,
    };
  }

  /** Accent text color — for headings and highlights on the given accent key */
  accentText(key: string = 'c'): string {
    return this.color(key);
  }

  /** Subtle accent background — for hover states and badges */
  accentBg(key: string = 'c', opacity: number = 0.08): string {
    return this.colorAlpha(key, opacity);
  }

  /** Content max-width for readable text */
  contentWidth(): string {
    return '720px';
  }

  /** Narrow content width (refleksi, kuis) */
  narrowWidth(): string {
    return '560px';
  }

  // ═══════════════════════════════════════════════════════════════════
  // iOS VISUAL CONTRACT — Typography, Card, Surface helpers
  // ═══════════════════════════════════════════════════════════════════

  /** iOS typography style — returns a style object for a semantic type level */
  iosTypography(level: IOS_TypographyLevel, overrides?: Record<string, string | number>): Record<string, string | number> {
    const spec = IOS_TYPOGRAPHY[level];
    return {
      fontSize: spec.size,
      fontWeight: spec.weight,
      lineHeight: spec.lineHeight,
      letterSpacing: `${spec.letterSpacing}em`,
      ...overrides,
    };
  }

  /** iOS nested card style — for takeaways, self-check, inset areas */
  nestedCardStyle(): Record<string, string | number> {
    return {
      background: this.isDark() ? IOS_SURFACE.nested.dark : IOS_SURFACE.nested.light,
      borderRadius: `${IOS_CARD.nested.style.borderRadius}px`,
      border: `1px solid ${this.subtleBorder(0.06)}`,
      boxShadow: 'none',
    };
  }

  /** iOS interactive card style — for buttons, options, tabs */
  interactiveCardStyle(accentKey: string = 'c'): Record<string, string | number> {
    return {
      background: this.colorAlpha(accentKey, 0.06),
      borderRadius: `${IOS_CARD.interactive.style.borderRadius}px`,
      border: `1px solid ${this.colorAlpha(accentKey, 0.15)}`,
      boxShadow: 'none',
      // Sprint 4: Targeted transition properties instead of 'all'
      transition: `background-color, border-color, color, transform, box-shadow ${IOS_INTERACTION.duration.standard}ms ${IOS_INTERACTION.easing.default}`,
      cursor: 'pointer',
    };
  }

  /** iOS accent stripe — consistent left border */
  accentStripe(key: string = 'c', width: number = IOS_CARD.accentStripe.standard): string {
    return `${width}px solid ${this.color(key)}`;
  }

  /** iOS shadow — by discipline level (whisper/soft/ambient/prominent) */
  iosShadow(level: 'whisper' | 'soft' | 'ambient' | 'prominent'): string {
    return IOS_SHADOW[level];
  }

  /** iOS icon container size — returns { width, height } for a named size */
  iosIconSize(level: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): { width: number; height: number } {
    const map = { xs: IOS_SPACING.iconXs, sm: IOS_SPACING.iconSm, md: IOS_SPACING.iconMd, lg: IOS_SPACING.iconLg, xl: IOS_SPACING.iconXl };
    const size = map[level];
    return { width: size, height: size };
  }

  /** iOS section padding — adaptive to compact/standard mode */
  iosSectionPadding(compact?: boolean): Record<string, string> {
    return {
      padding: compact ? IOS_SPACING.sectionHeader.compact : IOS_SPACING.sectionHeader.standard,
    };
  }

  /** iOS content area padding — adaptive to compact/standard mode */
  iosContentPadding(compact?: boolean): Record<string, string> {
    return {
      padding: compact ? IOS_SPACING.contentArea.compact : IOS_SPACING.contentArea.standard,
    };
  }

  /** iOS button padding — standard CTA */
  iosButtonPadding(size: 'md' | 'lg' = 'md'): Record<string, string | number> {
    const spec = size === 'lg' ? IOS_SPACING.buttonLg : IOS_SPACING.buttonMd;
    return {
      padding: `${spec.py}px ${spec.px}px`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // iOS INTERACTION — Tailwind class compositions for consistent UX
  // ═══════════════════════════════════════════════════════════════════
  // Renderers MUST use these helpers instead of hand-coding
  // hover/focus/active/transition classes. This ensures consistent
  // timing, easing, and interaction patterns across the entire app.
  //
  // Every method returns a Tailwind class string. When `interactive`
  // is false, returns a minimal non-interactive string (cursor-default).
  // ═══════════════════════════════════════════════════════════════════

  /** iOS CTA button — scale hover/press, targeted transition, focus ring.
   *  Use for: primary action buttons ("Mulai", "Kirim", "Lanjut") */
  iosButtonTw(interactive?: boolean): string {
    if (!interactive) return 'cursor-default';
    return IOS_INTERACTION.tw.button + ' cursor-pointer';
  }

  /** iOS interactive card — lift hover, settle press, focus ring.
   *  Use for: NcGrid cards, selectable cards */
  iosCardTw(): string {
    return IOS_INTERACTION.tw.card;
  }

  /** iOS quiz option — subtle scale (1.02) for multi-option grids.
   *  Use for: Kuis A/B option buttons */
  iosQuizOptionTw(interactive?: boolean): string {
    if (!interactive) return 'cursor-default';
    return IOS_INTERACTION.tw.quizOption + ' cursor-pointer';
  }

  /** iOS tab/pill toggle — bg/border/color transition, opacity hover.
   *  Use for: MateriTabBar tabs, variant selector pills */
  iosTabTw(interactive?: boolean): string {
    if (!interactive) return 'cursor-default';
    return IOS_INTERACTION.tw.tab + ' cursor-pointer';
  }

  /** iOS accordion toggle — bg/color transition, opacity hover.
   *  Use for: MateriSection accordion headers */
  iosAccordionTw(interactive?: boolean): string {
    if (!interactive) return 'cursor-default';
    return IOS_INTERACTION.tw.accordion + ' cursor-pointer';
  }

  /** iOS expand/collapse button — opacity hover + scale press.
   *  Use for: "Selengkapnya", "Sembunyikan" expand buttons */
  iosExpandTw(interactive?: boolean): string {
    if (!interactive) return 'cursor-default';
    return IOS_INTERACTION.tw.expandButton + ' cursor-pointer';
  }

  /** iOS game button — scale hover/press for game tiles, cards, drag handles.
   *  Uses 1.03 scale (contract-compliant) instead of old 1.05.
   *  Use for: game renderer buttons, tiles, draggable items */
  iosGameButtonTw(interactive?: boolean): string {
    if (!interactive) return 'cursor-default';
    return IOS_INTERACTION.tw.gameButton + ' cursor-pointer';
  }

  /** iOS text input — focus ring + border transition.
   *  Use for: textarea, text input fields */
  iosTextInputTw(): string {
    return IOS_INTERACTION.tw.textInput;
  }

  /** iOS focus ring — accessible outline only.
   *  Use for: elements that need focus ring without other interactions */
  iosFocusRing(): string {
    return IOS_INTERACTION.tw.focusRing;
  }

  // ═══════════════════════════════════════════════════════════════════
  // iOS INTERACTION — Inline style helpers for transition & entrance
  // ═══════════════════════════════════════════════════════════════════
  // These replace hardcoded `transition: 'all 0.2s ease'` strings in
  // renderers with IOS_INTERACTION-token-driven values. All timing
  // and easing values come from a single source of truth.
  // ═══════════════════════════════════════════════════════════════════

  /** iOS transition style — returns a CSS transition style object.
   *  Use for: inline style objects that need transition on specific properties.
   *  @param properties - CSS properties to transition (default: 'all')
   *  @param speed - 'instant' (75ms), 'fast' (150ms), 'standard' (200ms), or 'slow' (300ms)
   *  @param curve - 'default' (ease), 'ios' (cubic-bezier), or 'spring' (overshoot) */
  iosTransitionStyle(
    properties: string = 'all',
    speed: 'instant' | 'fast' | 'standard' | 'slow' = 'standard',
    curve: 'default' | 'ios' | 'spring' = 'default',
  ): Record<string, string> {
    const duration = IOS_INTERACTION.duration[speed];
    const easing = IOS_INTERACTION.easing[curve];
    return {
      transition: `${properties} ${duration}ms ${easing}`,
    };
  }

  /** iOS entrance animation — returns inline style for stagger entrance.
   *  Use for: nested cards, takeaways, self-check panels, score badges.
   *  @param index - stagger index (0-based) for delay calculation
   *  @param type - 'slideIn' (translateY) or 'scaleIn' (scale) */
  iosEntranceStyle(
    index: number = 0,
    type: 'slideIn' | 'scaleIn' = 'slideIn',
  ): Record<string, string> {
    const delay = index * IOS_INTERACTION.duration.fast; // 150ms per item
    const duration = IOS_INTERACTION.duration.slow; // 300ms entrance
    const easing = IOS_INTERACTION.easing.ios;
    if (type === 'scaleIn') {
      return {
        animation: `blockEntrance ${duration}ms ${easing} ${delay}ms both`,
      };
    }
    return {
      animation: `blockStaggerIn ${duration}ms ${easing} ${delay}ms both`,
    };
  }

  /** iOS hover background — theme-aware subtle hover background.
   *  Returns { background, transition } for use in React state-driven hover.
   *  Use for: Penutup preview items, Refleksi question cards.
   *  @param isHovered - current hover state
   *  @param opacity - hover bg opacity (default 0.03, very subtle) */
  iosHoverBgStyle(
    isHovered: boolean,
    opacity: number = 0.03,
  ): Record<string, string> {
    return {
      background: isHovered ? this.subtleBg(opacity) : 'transparent',
      transition: `background-color ${IOS_INTERACTION.duration.fast}ms ${IOS_INTERACTION.easing.default}`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // iOS COMPOSITION — Adaptive spacing, rhythm, width discipline
  // ═══════════════════════════════════════════════════════════════════
  // These helpers replace hardcoded padding/margin/max-width values
  // in renderers with contract-driven tokens for consistent rhythm.
  // ═══════════════════════════════════════════════════════════════════

  /** Inner margin — space between card edge and nested content.
   *  Use for: takeaway margins, self-check margins, nested card margins
   *  inside MateriSection. Returns a CSS margin string. */
  iosInnerMargin(compact?: boolean): Record<string, string> {
    const spec = compact ? IOS_COMPOSITION.innerMargin.compact : IOS_COMPOSITION.innerMargin.standard;
    return {
      margin: `${spec.y}px ${spec.x}px`,
    };
  }

  /** Element gap — spacing between sub-elements within a block.
   *  Use for: icon→title, title→subtitle, subtitle→body, etc.
   *  Returns a CSS value in px. */
  iosElementGap(type: keyof typeof IOS_COMPOSITION.elementGap): string {
    return `${IOS_COMPOSITION.elementGap[type]}px`;
  }

  /** Subtitle max-width — readable line lengths for subtitle text.
   *  Use for: Cover, Hero subtitle max-width constraints.
   *  Returns a CSS value in px. */
  iosSubtitleWidth(context: keyof typeof IOS_COMPOSITION.subtitleWidth): string {
    return `${IOS_COMPOSITION.subtitleWidth[context]}px`;
  }

  /** Card inner padding — standard padding for card content areas.
   *  Use for: DefBox, NcGrid card content, Kuis question area.
   *  Returns a CSS padding string. */
  iosCardPadding(compact?: boolean): Record<string, string> {
    const spec = compact ? IOS_COMPOSITION.cardInnerPadding.compact : IOS_COMPOSITION.cardInnerPadding.standard;
    return {
      padding: `${spec.block}px ${spec.inline}px`,
    };
  }

  /** Nested card inner padding — for takeaways, self-check, penugasan.
   *  Returns a CSS padding string. */
  iosNestedPadding(compact?: boolean): Record<string, string> {
    const spec = compact ? IOS_COMPOSITION.nestedCardPadding.compact : IOS_COMPOSITION.nestedCardPadding.standard;
    return {
      padding: `${spec.block}px ${spec.inline}px`,
    };
  }

  /** Kuis card padding — slightly more generous for interactive areas.
   *  Returns a CSS padding string. */
  iosKuisPadding(compact?: boolean): Record<string, string> {
    const spec = compact ? IOS_COMPOSITION.kuisPadding.compact : IOS_COMPOSITION.kuisPadding.standard;
    return {
      padding: `${spec.block}px ${spec.inline}px`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // EDUCATIONAL DESIGN SYSTEM — Canvas content tokens
  // ═══════════════════════════════════════════════════════════════════
  // The edu() method creates an EduRenderingContext for a block type.
  // Use this for CANVAS CONTENT only — app chrome keeps iOS VC.
  //
  //   const edu = tokens.edu('tujuan-display', isCompact);
  //   edu.heading()  → { fontSize: '28px', fontWeight: 700, ... }
  //   edu.accent()   → '#f9c12e'
  // ═══════════════════════════════════════════════════════════════════

  /** Create an educational rendering context for a block type.
   *  This is the PRIMARY way to access edu tokens in renderers.
   *  The display mode is inherited from the TokenResolver instance
   *  (set via constructor from the canva store's displayMode state).
   *
   *  Scene-aware: pass sceneType for scene-specific typography,
   *  atmosphere, emotional profile, and accent prominence.
   *
   *  // Old API (still works, sceneType inferred from blockType)
   *  const edu = tokens.edu('tujuan-display', isCompact);
   *
   *  // New API (explicit sceneType)
   *  const edu = tokens.edu('tujuan-display', isCompact, 'intro');
   */
  /** Apply a TemplateThemeContract's resolved style to this TokenResolver.
   *  This is the KEY enforcement mechanism: when a contract is active,
   *  its values OVERRIDE theme/scene/block defaults.
   *
   *  Called from PageRenderer after resolving the contract for a page.
   *  All subsequent color(), spacing(), radius() calls will return
   *  contract values instead of theme defaults.
   *
   *  Priority chain:
   *    TemplateThemeContract > Scene Style > Block Default
   *
   *  @param contractStyle - Resolved contract style for the current page
   */
  applyContract(contractStyle: import('@/core/template/contract/TemplateThemeContract').ContractResolvedStyle): void {
    this._contractStyle = contractStyle;

    // Patch the underlying DesignTokens to ensure ALL existing code paths
    // (including code that reads tokens.raw directly) get contract values.
    // This is the enforcement layer — contract wins everywhere.
    const raw = this.tokens;
    const colors = raw.colors as Record<string, string>;
    colors['bg'] = contractStyle.background;
    colors['bg2'] = contractStyle.background;
    colors['card'] = contractStyle.cardBg;
    colors['text'] = contractStyle.textColor;
    colors['muted'] = contractStyle.mutedColor;

    // Override accent color token 'y' with contract accent
    colors['y'] = contractStyle.accent;

    // Override spacing
    const spacing = raw.spacing as Record<string, number>;
    spacing['xl'] = contractStyle.pagePadding;
    spacing['xxl'] = contractStyle.cardPadding;

    // Override radius
    const radius = raw.radius as Record<string, number>;
    radius['xl'] = contractStyle.cardRadius;

    // Override shadow
    raw.shadow.card = contractStyle.cardShadow;

    // Override typography scale
    const fontSize = raw.typography.fontSize as Record<string, string>;
    fontSize['h1'] = `${contractStyle.typo.hero}px`;
    fontSize['h2'] = `${contractStyle.typo.title}px`;
    fontSize['h3'] = `${contractStyle.typo.heading}px`;
    fontSize['lg'] = `${contractStyle.typo.bodyLg}px`;
    fontSize['md'] = `${contractStyle.typo.body}px`;
    fontSize['sm'] = `${contractStyle.typo.caption}px`;
    fontSize['xs'] = `${contractStyle.typo.micro}px`;
  }

  /** Get the active contract style, if any */
  get contractStyle(): import('@/core/template/contract/TemplateThemeContract').ContractResolvedStyle | null {
    return this._contractStyle;
  }

  /** Whether a TemplateThemeContract is currently active */
  hasContract(): boolean {
    return this._contractStyle !== null;
  }

  /** Set the scene type for the current rendering context.
   *  Called by SchemaScreenRenderer before rendering each page's blocks.
   *  This enables ALL block renderers to automatically become scene-aware
   *  without any code changes — tokens.edu('kuis', isCompact) will
   *  automatically use the page's sceneType for typography, colors, spacing,
   *  emotional profile, and accent prominence.
   *
   *  IMPORTANT: This is a per-page setting, not a global setting.
   *  Each page has its own sceneType (from page.templateType).
   */
  setSceneType(sceneType: SceneType): void {
    this._sceneType = sceneType;
  }

  /** Get the current scene type (set by SchemaScreenRenderer) */
  getSceneType(): SceneType | undefined {
    return this._sceneType;
  }

  edu(blockType: string, isCompact: boolean = false, sceneType?: import('@/core/edu/education-scene-types').SceneType): EduRenderingContext {
    // Priority: explicit sceneType param > stored _sceneType > undefined (inferred from blockType)
    const resolvedSceneType = sceneType ?? this._sceneType;
    return new EduRenderingContext(this, blockType, isCompact, this._displayMode, resolvedSceneType);
  }

  // ═══════════════════════════════════════════════════════════════════
  // DISPLAY MODE — Mode-aware color/typography helpers
  // ═══════════════════════════════════════════════════════════════════

  /** Get the current display mode */
  get displayMode(): EduDisplayMode {
    return this._displayMode;
  }

  /** Mode-aware page background — returns EDU_MODE_BG for the current mode.
   *  Use for page/scene backgrounds instead of tokens.color('bg'). */
  eduPageBg(): string {
    return EDU_MODE_BG[this._displayMode].bg;
  }

  /** Mode-aware secondary page background */
  eduPageBg2(): string {
    return EDU_MODE_BG[this._displayMode].bg2;
  }

  /** Mode-aware card background */
  eduCardBg(): string {
    return EDU_MODE_BG[this._displayMode].card;
  }

  /** Mode-aware text color — in print mode, always returns #000000 */
  eduTextColor(): string {
    return this._displayMode === 'print' ? EDU_PRINT_SAFE.textColor : this.color('text');
  }

  /** Is the current display mode 'print'? */
  isPrintMode(): boolean {
    return this._displayMode === 'print';
  }

  /** Is the current display mode 'projector'? */
  isProjectorMode(): boolean {
    return this._displayMode === 'projector';
  }
}

// ═══════════════════════════════════════════════════════════════════
// DARK-MODE-AWARE FALLBACK HELPERS
// ═══════════════════════════════════════════════════════════════════
// When `tokens` is null/undefined (defensive edge case), these helpers
// pick the correct fallback based on the user's system color-scheme
// preference. Without them, hardcoded light-mode fallbacks (e.g.
// `#ffffff` for card bg, `#0f172a` for text) would render invisible
// elements in dark mode.
//
// Usage:
//   resolveColor(tokens, 'card', '#ffffff', '#182d45')
//   resolveColorAlpha(tokens, 'y', 0.15, 'rgba(251,191,36,0.15)', 'rgba(251,191,36,0.15)')
//   resolveSubtleBg(tokens, 0.06)
// ═══════════════════════════════════════════════════════════════════

/** Detect if the user is in dark mode.
 *  Checks the `.dark` class on <html> (set by next-themes ThemeProvider)
 *  which respects both system preference AND manual toggle via ThemeToggle.
 *  Falls back to `prefers-color-scheme` if the class is not yet applied
 *  (e.g., during SSR or before hydration). */
function prefersDarkMode(): boolean {
  if (typeof document !== 'undefined') {
    // Primary: check the .dark class set by next-themes (respects manual toggle)
    if (document.documentElement.classList.contains('dark')) return true;
    // If no theme class yet (before hydration), fall back to system preference
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false; // Default to light (education-first)
}

/** Resolve a token color with dark-mode-aware fallback.
 *  When `tokens` is available, delegates to `tokens.color(name)`.
 *  When null/undefined, returns `darkFallback` or `lightFallback`
 *  based on the user's system color-scheme preference. */
export function resolveColor(
  tokens: TokenResolver | null | undefined,
  name: string,
  lightFallback: string,
  darkFallback: string,
): string {
  if (tokens) return tokens.color(name);
  return prefersDarkMode() ? darkFallback : lightFallback;
}

/** Resolve a token color-alpha with dark-mode-aware fallback. */
export function resolveColorAlpha(
  tokens: TokenResolver | null | undefined,
  name: string,
  a: number,
  lightFallback: string,
  darkFallback: string,
): string {
  if (tokens) return tokens.colorAlpha(name, a);
  return prefersDarkMode() ? darkFallback : lightFallback;
}

/** Resolve muted text color with dark-mode-aware fallback. */
export function resolveMuted(
  tokens: TokenResolver | null | undefined,
  a: number,
  lightFallback: string,
  darkFallback: string,
): string {
  if (tokens) return tokens.muted(a);
  return prefersDarkMode() ? darkFallback : lightFallback;
}

/** Resolve subtle background — rgba(255,255,255,N) on dark, rgba(0,0,0,N) on light. */
export function resolveSubtleBg(
  tokens: TokenResolver | null | undefined,
  opacity: number,
): string {
  if (tokens) return tokens.subtleBg(opacity);
  return prefersDarkMode()
    ? `rgba(255,255,255,${opacity})`
    : `rgba(0,0,0,${opacity})`;
}

/** Resolve subtle border — rgba(255,255,255,N) on dark, rgba(0,0,0,N) on light. */
export function resolveSubtleBorder(
  tokens: TokenResolver | null | undefined,
  opacity: number,
): string {
  if (tokens) return tokens.subtleBorder(opacity);
  return prefersDarkMode()
    ? `rgba(255,255,255,${opacity})`
    : `rgba(0,0,0,${opacity})`;
}
