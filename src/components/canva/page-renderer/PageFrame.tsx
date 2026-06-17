'use client';

import React, { useRef } from 'react';
import type { CanvaPage, NavConfig } from '../types';
import { DEFAULT_NAV_CONFIG } from '../types';
import { useInteractiveStore } from '@/store/interactive-store';
import { useCanvaStore } from '@/store/canva-store';
import { useSchemaMetaProjection } from '@/hooks/use-schema-projection';
import { TEMPLATE_ICON_MAP } from '@/lib/canva-icon-maps';
import { TokenResolver } from '@/core/renderer/SchemaRenderer';
import { alpha } from '@/lib/color-palette';
import { useNavSync } from '@/hooks/use-nav-sync';
import { ScoreDisplay } from './ScoreDisplay';
import { computeSafeArea } from '@/core/scene/SceneLayoutEngine';
import { EDU_MODE_BG } from '@/core/edu/education-colors';
// Sprint 8.2A — Page Style Tokens (Canvas + Preview parity)
// PageFrame reads page-level tokens from the shared Style Contract
// helper. The legacy TokenResolver continues to drive block-level
// concerns; PageFrame uses ResolvedStyleTokens for:
//   - Background color / image / overlay (schema-aligned 0-80 scale)
//   - Navbar style fallback (when page.navConfig.navbarStyle is invalid)
//   - Page accent (for title color when contract is not active)
import type { ResolvePageStyleTokensResult } from '@/core/style';

// ═══════════════════════════════════════════════════════════════
// PAGE FRAME — Unified page shell shared by Canvas, Preview, Export
//
// Renders:
//   1. Background (color + image + overlay)
//   2. Top Navbar (title, progress, score) — 3 styles: colorful, minimal, glass
//   3. Content area (offset for navbars)
//   4. Bottom Navbar (progress, navigation, score) — 3 styles
//
// navbarStyle per-page config:
//   - 'colorful': Gradient progress, vibrant buttons, emoji score, icon dots
//   - 'minimal': Thin lines, muted palette, ghost buttons, simple dots
//   - 'glass': Glassmorphism, gradient borders, glowing accents
// ═══════════════════════════════════════════════════════════════

export type PageFrameMode = 'canvas' | 'preview' | 'export' | 'learn';

export interface PageFrameProps {
  /** Which render context is using this frame */
  mode: PageFrameMode;
  /** The page data */
  page: CanvaPage;
  /** Current page index (0-based) */
  currentPageIndex: number;
  /** Total pages */
  totalPages: number;
  /** Whether this is a schema-driven page (content from SchemaScreenRenderer) */
  isSchemaDriven?: boolean;
  /** Content children (PageRenderer or template content) */
  children: React.ReactNode;
  /** Extra elements on top of content (all user-placed elements) */
  extraElements?: React.ReactNode;
  /** Class/style overrides for the root container */
  className?: string;
  style?: React.CSSProperties;
  /** Shared TokenResolver — passed from PageRenderer to ensure consistency */
  tokens?: TokenResolver;
  /**
   * Sprint 8.2A — Page-level resolved style tokens.
   *
   * When present, PageFrame reads background image / overlay / navbar
   * style fallback from these tokens INSTEAD of from the legacy
   * page.bgColor / page.bgDataUrl / page.overlay fields. This aligns
   * Canvas + Preview with the Style Contract system without breaking
   * the existing block renderer pipeline (which still uses
   * TokenResolver).
   *
   * The legacy page fields continue to be read for non-schema
   * (element-mode) pages — they are the source of truth there.
   */
  pageStyleTokens?: ResolvePageStyleTokensResult;
  /** Currently selected schema block ID (canvas mode only) */
  selectedBlockId?: string | null;
  /** Callback when a schema block is clicked (canvas mode only) */
  onBlockSelect?: (blockId: string, blockType: string, addToSelection?: boolean) => void;
}

// ── Smart next button label based on current/next template type ──
function getNextLabel(currentType: string, nextType: string): string {
  switch (currentType) {
    case 'cover': return 'Mulai Belajar';
    case 'petunjuk': return 'Tujuan Pembelajaran';
    case 'dokumen': return 'Mulai Pembelajaran';
    case 'skenario':
      if (nextType === 'materi') return 'Lanjut ke Materi';
      if (nextType === 'kuis') return 'Lanjut ke Kuis';
      return 'Lanjut';
    case 'materi':
      if (nextType === 'kuis') return 'Mulai Kuis';
      return 'Lanjut';
    case 'refleksi': return 'Lihat Hasil';
    case 'penutup': return 'Lihat Hasil';
    default: return 'Lanjut';
  }
}

// ── Score tier label + color ──
// Token-aware: when tokens available, resolves from palette; otherwise falls back to safe defaults
export function getScoreTier(pct: number, tokens?: { color: (k: string) => string; colorAlpha: (k: string, a: number) => string }): { label: string; color: string; glow: string } {
  if (pct >= 90) return { label: 'Luar Biasa', color: tokens?.color('y') ?? '#fbbf24', glow: tokens?.colorAlpha('y', 0.4) ?? 'rgba(251,191,36,0.4)' };
  if (pct >= 75) return { label: 'Hebat', color: tokens?.color('g') ?? '#34d399', glow: tokens?.colorAlpha('g', 0.3) ?? 'rgba(52,211,153,0.3)' };
  if (pct >= 50) return { label: 'Cukup Baik', color: tokens?.color('c') ?? '#22d3ee', glow: tokens?.colorAlpha('c', 0.25) ?? 'rgba(34,211,238,0.25)' };
  return { label: 'Terus Berlatih', color: tokens?.color('o') ?? '#fb923c', glow: tokens?.colorAlpha('o', 0.25) ?? 'rgba(251,146,60,0.25)' };
}

// ── Helpers ───────────────────────────────────────────────────

function getNavConfig(page: CanvaPage): NavConfig {
  return page.navConfig || DEFAULT_NAV_CONFIG;
}

// ═══════════════════════════════════════════════════════════════
// NAVBAR STYLE THEMES
// ═══════════════════════════════════════════════════════════════

interface NavStyleTheme {
  topBg: (tokens: TokenResolver) => React.CSSProperties;
  bottomBg: (tokens: TokenResolver) => React.CSSProperties;
  progressBar: (tokens: TokenResolver, pct: number, isCompact: boolean) => React.CSSProperties;
  progressTrack: (tokens: TokenResolver, isCompact: boolean) => React.CSSProperties;
  scorePill: (tokens: TokenResolver, pct: number, isCompact: boolean) => React.CSSProperties;
  scoreText: (tokens: TokenResolver, pct: number) => React.CSSProperties;
  nextBtn: (tokens: TokenResolver, isLast: boolean, isCompact: boolean) => React.CSSProperties;
  prevBtn: (tokens: TokenResolver, disabled: boolean) => React.CSSProperties;
  dotStyle: (tokens: TokenResolver, isActive: boolean, isComplete: boolean) => React.CSSProperties;
  resetBtn: (tokens: TokenResolver) => React.CSSProperties;
}

const NAV_THEMES: Record<string, NavStyleTheme> = {
  // ═══════════════════════════════════════════════════════════
  // COLORFUL — Vibrant gradients, emoji score, icon dots, glow
  // ═══════════════════════════════════════════════════════════
  colorful: {
    topBg: (t) => ({
      background: `${alpha(t.color('bg'), 0.88)}`,
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${t.colorAlpha('border', 1)}`,
    }),
    bottomBg: (t) => ({
      background: `${alpha(t.color('bg'), 0.92)}`,
      backdropFilter: 'blur(12px)',
      borderTop: `1px solid ${t.colorAlpha('border', 1)}`,
    }),
    progressBar: (t, pct) => ({
      width: `${pct}%`,
      background: `linear-gradient(90deg, ${t.color('g')}, ${t.color('c')})`,
      borderRadius: 9999,
    }),
    progressTrack: (t, isCompact) => ({
      height: isCompact ? 4 : 6,
      background: t.colorAlpha('border', 0.5),
      borderRadius: 9999,
      overflow: 'hidden',
    }),
    scorePill: (t, pct, isCompact) => {
      const tier = getScoreTier(pct);
      return {
        background: `${tier.color}18`,
        border: `1px solid ${tier.color}33`,
        borderRadius: 9999,
        padding: isCompact ? '2px 8px' : '4px 10px',
        boxShadow: `0 0 12px ${tier.glow}`,
      };
    },
    scoreText: (t, pct) => {
      const tier = getScoreTier(pct);
      return { color: tier.color, fontWeight: 800, fontFamily: 'monospace' };
    },
    nextBtn: (t, isLast, isCompact) => ({
      background: isLast ? t.colorAlpha('y', 0.3) : `linear-gradient(135deg, ${t.color('y')}, ${t.color('c')})`,
      color: t.color('bg'),
      borderRadius: 8,
      fontWeight: 800,
      padding: isCompact ? '2px 8px' : '6px 14px',
      boxShadow: isLast ? 'none' : `0 2px 8px ${t.colorAlpha('y', 0.3)}`,
    }),
    prevBtn: (t, disabled) => ({
      color: disabled ? t.colorAlpha('muted', 0.3) : t.color('muted'),
      borderRadius: 8,
      fontWeight: 700,
    }),
    dotStyle: (t, isActive, isComplete) => ({
      background: isActive ? t.colorAlpha('c', 0.15) : 'transparent',
      border: isActive ? `2px solid ${t.colorAlpha('c', 0.5)}` : isComplete ? `2px solid ${t.color('g')}` : '2px solid transparent',
      boxShadow: isActive ? `0 0 8px ${t.colorAlpha('c', 0.2)}` : 'none',
      borderRadius: '50%',
    }),
    resetBtn: (t) => ({
      color: t.color('muted'),
      borderRadius: 6,
      padding: '2px 8px',
    }),
  },

  // ═══════════════════════════════════════════════════════════
  // MINIMAL — Thin lines, muted, ghost buttons, simple dots
  // ═══════════════════════════════════════════════════════════
  minimal: {
    topBg: (t) => ({
      background: `${alpha(t.color('bg'), 0.95)}`,
      borderBottom: `1px solid ${t.colorAlpha('border', 0.4)}`,
    }),
    bottomBg: (t) => ({
      background: `${alpha(t.color('bg'), 0.95)}`,
      borderTop: `1px solid ${t.colorAlpha('border', 0.4)}`,
    }),
    progressBar: (t, pct) => ({
      width: `${pct}%`,
      background: t.colorAlpha('muted', 0.5),
      borderRadius: 0,
    }),
    progressTrack: (t, isCompact) => ({
      height: isCompact ? 1 : 2,
      background: t.colorAlpha('border', 0.2),
    }),
    scorePill: (t, pct, isCompact) => ({
      background: 'transparent',
      border: 'none',
      borderRadius: 0,
      padding: isCompact ? '1px 4px' : '2px 6px',
    }),
    scoreText: (t, pct) => {
      const tier = getScoreTier(pct);
      return { color: tier.color, fontWeight: 700, fontFamily: 'monospace' };
    },
    nextBtn: (t, isLast, isCompact) => ({
      background: 'transparent',
      color: isLast ? t.colorAlpha('muted', 0.3) : t.color('y'),
      borderRadius: 4,
      fontWeight: 700,
      padding: isCompact ? '2px 8px' : '6px 14px',
      border: isLast ? 'none' : `1px solid ${t.colorAlpha('y', 0.3)}`,
    }),
    prevBtn: (t, disabled) => ({
      color: disabled ? t.colorAlpha('muted', 0.2) : t.colorAlpha('muted', 0.6),
      borderRadius: 4,
      fontWeight: 600,
    }),
    dotStyle: (t, isActive, isComplete) => ({
      background: isActive ? t.colorAlpha('y', 0.15) : 'transparent',
      border: isActive ? `1px solid ${t.colorAlpha('y', 0.3)}` : isComplete ? `1px solid ${t.colorAlpha('g', 0.3)}` : `1px solid ${t.colorAlpha('border', 0.2)}`,
      boxShadow: 'none',
      borderRadius: '50%',
    }),
    resetBtn: (t) => ({
      color: t.colorAlpha('muted', 0.5),
      borderRadius: 4,
      padding: '2px 6px',
    }),
  },

  // ═══════════════════════════════════════════════════════════
  // GLASS — Glassmorphism, gradient borders, glowing accents
  // ═══════════════════════════════════════════════════════════
  glass: {
    topBg: (t) => ({
      background: `${alpha(t.color('bg'), 0.65)}`,
      backdropFilter: 'blur(20px) saturate(1.5)',
      borderBottom: `1px solid ${t.colorAlpha('border', 0.15)}`,
    }),
    bottomBg: (t) => ({
      background: `${alpha(t.color('bg'), 0.7)}`,
      backdropFilter: 'blur(20px) saturate(1.5)',
      borderTop: `1px solid ${t.colorAlpha('border', 0.15)}`,
    }),
    progressBar: (t, pct) => ({
      width: `${pct}%`,
      background: `linear-gradient(90deg, ${t.color('g')}, ${t.color('c')}, ${t.color('y')})`,
      borderRadius: 9999,
      boxShadow: `0 0 10px ${t.colorAlpha('c', 0.3)}`,
    }),
    progressTrack: (t, isCompact) => ({
      height: isCompact ? 3 : 5,
      background: t.colorAlpha('border', 0.15),
      borderRadius: 9999,
      overflow: 'hidden',
    }),
    scorePill: (t, pct, isCompact) => {
      const tier = getScoreTier(pct);
      return {
        background: `${alpha(t.color('bg'), 0.4)}`,
        border: `1px solid ${tier.color}30`,
        borderRadius: 9999,
        padding: isCompact ? '2px 8px' : '4px 12px',
        backdropFilter: 'blur(8px)',
        boxShadow: `0 0 16px ${tier.glow}, inset 0 0 8px ${tier.color}10`,
      };
    },
    scoreText: (t, pct) => {
      const tier = getScoreTier(pct);
      return {
        color: tier.color,
        fontWeight: 800,
        fontFamily: 'monospace',
        textShadow: `0 0 8px ${tier.glow}`,
      };
    },
    nextBtn: (t, isLast, isCompact) => ({
      background: isLast
        ? `${alpha(t.color('bg'), 0.3)}`
        : `linear-gradient(135deg, ${t.color('y')}, ${t.color('c')})`,
      color: t.color('bg'),
      borderRadius: 10,
      fontWeight: 800,
      padding: isCompact ? '3px 10px' : '6px 16px',
      boxShadow: isLast
        ? `inset 0 0 12px ${t.colorAlpha('y', 0.15)}`
        : `0 0 16px ${t.colorAlpha('y', 0.25)}, 0 2px 8px ${t.colorAlpha('y', 0.15)}`,
      border: isLast ? `1px solid ${t.colorAlpha('y', 0.2)}` : 'none',
    }),
    prevBtn: (t, disabled) => ({
      color: disabled ? t.colorAlpha('muted', 0.2) : t.colorAlpha('muted', 0.8),
      borderRadius: 10,
      fontWeight: 700,
      background: disabled ? 'transparent' : `${alpha(t.color('bg'), 0.3)}`,
      backdropFilter: disabled ? 'none' : 'blur(8px)',
      border: disabled ? 'none' : `1px solid ${t.colorAlpha('border', 0.15)}`,
    }),
    dotStyle: (t, isActive, isComplete) => ({
      background: isActive ? `${alpha(t.color('c'), 0.12)}` : 'transparent',
      border: isActive
        ? `1.5px solid ${t.colorAlpha('c', 0.5)}`
        : isComplete
          ? `1.5px solid ${t.colorAlpha('g', 0.4)}`
          : `1.5px solid ${t.colorAlpha('border', 0.15)}`,
      boxShadow: isActive
        ? `0 0 12px ${t.colorAlpha('c', 0.25)}, inset 0 0 6px ${t.colorAlpha('c', 0.1)}`
        : 'none',
      borderRadius: '50%',
      backdropFilter: isActive ? 'blur(4px)' : 'none',
    }),
    resetBtn: (t) => ({
      color: t.colorAlpha('muted', 0.6),
      borderRadius: 8,
      padding: '3px 10px',
      background: `${alpha(t.color('bg'), 0.3)}`,
      backdropFilter: 'blur(6px)',
      border: `1px solid ${t.colorAlpha('border', 0.12)}`,
    }),
  },
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const PageFrame = React.memo(function PageFrame({
  mode,
  page,
  currentPageIndex,
  totalPages,
  isSchemaDriven = false,
  children,
  extraElements,
  className,
  style,
  tokens: externalTokens,
  pageStyleTokens,
  selectedBlockId,
  onBlockSelect,
}: PageFrameProps) {
  // ═══ Read navConfig reactively from both page prop AND store ═══
  // The page prop may be stale if the store updated after the prop was passed.
  // Reading directly from canva store ensures instant visual feedback when
  // the user toggles checkboxes or switches navbar style in the right panel.
  const storeNavConfig = useCanvaStore(s => s.pages[currentPageIndex]?.navConfig);
  const navConfig = storeNavConfig || getNavConfig(page);
  // Sprint 8.2A — Navbar style fallback chain.
  //   1. page.navConfig.navbarStyle (when valid: 'colorful'|'minimal'|'glass')
  //   2. ResolvedStyleTokens.navigation.style (from Style Contract helper)
  //   3. 'colorful' (terminal default)
  //
  // This guarantees that invalid navbarStyle values fall back to the
  // Style Contract's choice (which itself falls back to the preset's
  // default) rather than silently snapping to 'colorful'. Canvas and
  // Preview share the same fallback because both read from the same
  // pageStyleTokens helper.
  const validNavbarStyle = (v: string | undefined): v is 'colorful' | 'minimal' | 'glass' =>
    v === 'colorful' || v === 'minimal' || v === 'glass';
  const navbarStyle = validNavbarStyle(navConfig.navbarStyle)
    ? navConfig.navbarStyle
    : validNavbarStyle(pageStyleTokens?.tokens.navigation.style)
      ? pageStyleTokens!.tokens.navigation.style
      : 'colorful';
  const theme = NAV_THEMES[navbarStyle] || NAV_THEMES.colorful;
  const showNavbar = navConfig.showNavbar !== false;
  const showScore = navConfig.showScore !== false;
  const showProgress = navConfig.showProgress !== false;
  const showPrevNext = navConfig.showPrevNext !== false;
  // Schema-driven cover pages don't show top nav — the CoverRenderer has its own background
  const isSchemaCover = isSchemaDriven && page.templateType === 'cover';
  const isCoverPage = page.templateType === 'cover';

  // ═══ Sprint 4.1 (Export): Hide PageFrame navbars when external navigation exists ═══
  // In learn mode: LearningMediaShell provides TopNavbar + BottomNav
  // In preview mode: PreviewMode provides floating navigation bar
  // In export mode: ExportApp provides ExportTopNavbar + ExportBottomNav
  // In canvas mode: PageFrame navbars are needed for editing context
  //
  // When isSchemaDriven is true AND mode is 'learn'/'preview'/'export', an external
  // navigation shell provides page-level chrome. PageFrame's navbars would be
  // duplicate and should be hidden.
  //
  // For legacy (non-schema) pages, keep navbars in all modes since there's no
  // external navigation chrome to replace them.
  const externalNavigation = isSchemaDriven && (mode === 'learn' || mode === 'preview' || mode === 'export');
  const showTopNav = !isSchemaCover && !isCoverPage && showNavbar && !externalNavigation;
  const showBottomNav = showNavbar && !isCoverPage && !externalNavigation;

  // Use shared TokenResolver from PageRenderer (ensures palette overrides are consistent)
  // D-P0B.1: Read schema.themeId first (canonical), fallback to templateData.schemaThemeId (legacy bridge)
  const themeId = page.schema?.themeId || (page.templateData?.schemaThemeId as string) || undefined;
  const displayMode = useCanvaStore((s) => s.displayMode);
  const computedTokens = React.useMemo(() => new TokenResolver(themeId, displayMode), [themeId, displayMode]);
  const tokens = externalTokens || computedTokens;
  const modeBg = EDU_MODE_BG[displayMode];

  // ── Score data (use store computed functions — reactive + DRY) ──
  const totalScoreVal = useInteractiveStore((s) => s.totalScore());
  const totalMaxVal = useInteractiveStore((s) => s.totalMax());
  const totalPctVal = useInteractiveStore((s) => s.totalPct());
  const hasScore = totalMaxVal > 0;
  const scoreTier = hasScore ? getScoreTier(totalPctVal) : null;

  // Navigation — use shared navSync hook for dual-store sync
  const { goNext, goPrev, goToPage, goReset } = useNavSync();
  const meta = useSchemaMetaProjection();
  const pages = useCanvaStore((s) => s.pages);
  const isPageComplete = useInteractiveStore((s) => s.isPageComplete);

  const progressPct = totalPages > 0 ? Math.round(((currentPageIndex + 1) / totalPages) * 100) : 0;
  const isLastPage = currentPageIndex >= totalPages - 1;
  const currentTemplate = page.templateType || 'custom';
  const nextTemplate = pages[currentPageIndex + 1]?.templateType || '';

  const handleNext = () => goNext(currentPageIndex);
  const handlePrev = () => goPrev(currentPageIndex);
  const handleNav = (idx: number) => goToPage(idx);
  const handleReset = () => goReset();

  // ── Mode-specific sizing ──────────────────────────────────
  const isCompact = mode === 'canvas';
  const topNavRef = useRef<HTMLDivElement>(null);
  const bottomNavRef = useRef<HTMLDivElement>(null);

  // ═══ SAFE AREA — Deterministic, from scene engine ═══════════
  // FASE 1C: Replace ResizeObserver-based measurement with
  // deterministic safe area computation from the scene engine.
  // This eliminates layout thrashing and ensures consistency
  // between canvas, preview, and export rendering.
  //
  // Navbar heights are KNOWN — they're defined by the theme,
  // not by browser measurement. The scene engine computes them
  // deterministically, and we use the same values here.
  const safeArea = computeSafeArea({
    showTopNav,
    showBottomNav,
    isCompact,
    pagePadding: 0, // PageFrame doesn't add padding — that's SchemaScreenRenderer's job
  });
  const topNavH = safeArea.top;
  const bottomNavH = safeArea.bottom;

  return (
    <>
      {/* ══ Background ════════════════════════════════════════ */}
      {!isSchemaDriven && (() => {
        // Sprint 8.2A-Patch P0-3: Render legacy element-page background
        // from a SINGLE authority — the resolved Style Contract tokens.
        //
        // Before the patch, this block used `page.bgColor`, `page.bgDataUrl`,
        // and a HARDCODED `alpha(modeBg.bg, 0.8)` overlay — ignoring the
        // overlay value the teacher actually set. Now we read from
        // `pageStyleTokens.tokens.page.background` which carries:
        //   color1, color2, imageUrl, overlay, overlayType,
        //   imageFit, imageOpacity, imageBlur
        //
        // Page-level fields (page.bgColor, page.bgDataUrl, page.overlay)
        // are still honored as the source the adapter read FROM — but
        // the rendered values come from the resolved tokens so the
        // overlay = 40 invariant is preserved end-to-end.
        //
        // Field priority: resolved token > legacy page field > modeBg.
        const resolvedBg = pageStyleTokens?.tokens.page.background;
        const bgColor =
          page.bgColor ||
          resolvedBg?.color1 ||
          pageStyleTokens?.tokens.colors.background ||
          modeBg.bg;
        const bgImage =
          page.bgDataUrl ||
          resolvedBg?.imageUrl ||
          '';
        const overlayPct =
          typeof resolvedBg?.overlay === 'number'
            ? resolvedBg.overlay
            : typeof page.overlay === 'number'
              ? page.overlay
              : 80; // schema default max — was previously hardcoded 0.8 alpha
        const overlayType = resolvedBg?.overlayType || 'dark';
        const imageFit = resolvedBg?.imageFit || 'cover';
        const imageOpacity =
          typeof resolvedBg?.imageOpacity === 'number' ? resolvedBg.imageOpacity : 100;
        const imageBlur =
          typeof resolvedBg?.imageBlur === 'number' ? resolvedBg.imageBlur : 0;
        // Convert 0-80 schema overlay scale → 0-1 alpha for CSS.
        const overlayAlpha = Math.max(0, Math.min(1, overlayPct / 100));

        return (
          <>
            {/* Layer 1: background color (solid/gradient/radial) */}
            <div className="absolute inset-0" style={{ background: bgColor }} />
            {/* Layer 2: background image (with fit/opacity/blur) */}
            {bgImage && (
              <img
                src={bgImage}
                alt=""
                role="presentation"
                className="absolute inset-0 w-full h-full"
                style={{
                  objectFit: imageFit,
                  opacity: imageOpacity / 100,
                  filter: imageBlur > 0 ? `blur(${imageBlur}px)` : undefined,
                }}
              />
            )}
            {/* Layer 3: overlay/scrim — driven by resolved overlay token.
                'dark'      → rgba(0,0,0,α)
                'light'     → rgba(255,255,255,α)
                'gradient'  → bottom-up gradient fade */}
            {bgImage && overlayAlpha > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    overlayType === 'light'
                      ? `rgba(255,255,255,${overlayAlpha})`
                      : overlayType === 'gradient'
                        ? `linear-gradient(to top, rgba(0,0,0,${overlayAlpha}), rgba(0,0,0,${overlayAlpha * 0.3}) 40%, transparent 70%)`
                        : `rgba(0,0,0,${overlayAlpha})`,
                }}
              />
            )}
          </>
        );
      })()}
      {isSchemaDriven && (() => {
        // Sprint 1G: PageFrame only renders the canvas base for schema pages.
        // All background layers (color, image, overlay) are handled by
        // SchemaScreenRenderer which has full control over the layer stack:
        //   Layer 0: Canvas base (EDU_MODE_BG)
        //   Layer 1: Background style (solid/gradient/radial)
        //   Layer 2: Background media (image with fit/opacity/blur)
        //   Layer 3: Overlay/scrim (dark/light/gradient)
        //   Layer 4: Content (blocks, navbars)
        // This eliminates the duplicate background image rendering that
        // existed before Sprint 1G (PageFrame + SchemaRenderer both rendered it).
        const baseBg = modeBg.bg;
        return <div className="absolute inset-0" style={{ background: baseBg }} />;
      })()}

      {/* ══ Top Navbar ════════════════════════════════════════ */}
      {showTopNav && (
        <div
          ref={topNavRef}
          className="absolute top-0 left-0 right-0 z-50 flex items-center gap-2 overflow-hidden"
          style={{
            ...theme!.topBg(tokens),
            padding: isCompact ? '4px 10px' : '8px 16px',
          }}
        >
          {/* Title — truncated to prevent overflow */}
          <span className={`font-bold whitespace-nowrap truncate flex-shrink-0 ${
            isCompact ? 'text-[10px] max-w-[100px]' : 'text-sm max-w-[160px]'
          }`} style={{ color: tokens.color('y'), fontFamily: tokens.fontFamily('body') }}>
            {meta.namaBab || meta.judulPertemuan || 'Media'}
          </span>

          {/* Progress bar — takes remaining space */}
          {showProgress && (
            <div className="flex-1 min-w-[40px]! rounded-full overflow-hidden" style={theme!.progressTrack(tokens, isCompact)}>
              <div className="h-full transition-[width]! duration-300" style={theme!.progressBar(tokens, progressPct, isCompact)} />
            </div>
          )}

          {/* Score pill — animated with +N popup */}
          {hasScore && showScore && (
            <ScoreDisplay
              navbarStyle={navbarStyle}
              isCompact={isCompact}
              showDetail={!isCompact}
              tokens={tokens}
              variant="top"
            />
          )}

          {/* Page counter — compact, no overflow */}
          <span className={`font-mono flex-shrink-0 ${isCompact ? 'text-[8px]' : 'text-[10px]'}`} style={{ color: tokens.color('muted') }}>
            {currentPageIndex + 1}/{totalPages}
          </span>
        </div>
      )}

      {/* ══ Content Area ══════════════════════════════════════════ */}
      {/* Schema-driven: FULL scene canvas (inset-0) — the scene engine
          handles safe-area positioning via resolveSceneLayout(). Navbar
          overlays (z-50) sit on top. DO NOT offset or safeArea will be
          applied twice (double-offset bug). */}
      {/* Legacy (non-schema): offset content area for navbars — CSS layout
          doesn't know about safe areas, so PageFrame must offset. */}
      <div className="absolute left-0 right-0 overflow-hidden" style={{
        top: isSchemaDriven ? 0 : (showTopNav ? topNavH : 0),
        bottom: isSchemaDriven ? 0 : (showBottomNav ? bottomNavH : 0),
      }}>
        {children}
        {extraElements}
      </div>

      {/* ══ Bottom Navbar ═════════════════════════════════════ */}
      {showBottomNav && (
        <div ref={bottomNavRef} className="absolute bottom-0 left-0 right-0 z-50 overflow-hidden"
          style={theme!.bottomBg(tokens)}>
          {/* Progress bar */}
          {showProgress && (
            <div style={theme!.progressTrack(tokens, isCompact)}>
              <div className="h-full transition-[width]! duration-300" style={theme!.progressBar(tokens, progressPct, isCompact)} />
            </div>
          )}

          {/* Nav bar */}
          <div className={`flex items-center justify-between gap-1 overflow-hidden ${
            isCompact ? 'px-2 py-1' : 'px-3 py-2'
          }`}>
            {/* Prev button */}
            {showPrevNext && (
              <button
                onClick={handlePrev}
                disabled={currentPageIndex <= 0}
                className={`font-bold transition-[transform,box-shadow,background-color] active:scale-95 flex-shrink-0 ${
                  isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
                } ${
                  currentPageIndex > 0
                    ? 'cursor-pointer hover:opacity-80'
                    : 'opacity-30 cursor-not-allowed'
                }`}
                style={theme!.prevBtn(tokens, currentPageIndex <= 0)}
              >
                {navbarStyle === 'minimal' ? '‹' : '←'}
              </button>
            )}

            {/* Page dots — constrained width, scrollable overflow */}
            <div className={`flex items-center gap-0.5 overflow-hidden flex-1 min-w-0 ${
              isCompact ? 'max-w-[45%]' : 'max-w-[50%]'
            }`}>
              {pages.slice(0, isCompact ? 8 : 20).map((p, i) => {
                const isActive = i === currentPageIndex;
                const isComplete = isPageComplete(i);
                // Smaller dots to prevent overflow — especially in compact mode
                const dotSize = isActive
                  ? isCompact ? 18 : 28
                  : isCompact ? 12 : 20;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleNav(i)}
                    title={`${p.label || `Halaman ${i + 1}`} (${i + 1}/${totalPages})${isComplete ? ' ✓' : ''}`}
                    className="relative flex-shrink-0 flex items-center justify-center cursor-pointer transition-[background-color,border-color] duration-200"
                    style={{
                      width: dotSize,
                      height: dotSize,
                      fontSize: isCompact ? 7 : (isActive ? 12 : 9),
                      ...theme!.dotStyle(tokens, isActive, isComplete),
                    }}
                  >
                    {navbarStyle === 'minimal' ? (
                      // Minimal: numbered dots, no icons
                      <span style={{ color: isActive ? tokens.color('y') : tokens.colorAlpha('muted', 0.5) }}>
                        {i + 1}
                      </span>
                    ) : (
                      <span>{TEMPLATE_ICON_MAP[p.templateType] || '📄'}</span>
                    )}
                  </button>
                );
              })}
              {pages.length > (isCompact ? 8 : 20) && (
                <span className="text-[7px] flex-shrink-0" style={{ color: tokens.colorAlpha('muted', 0.4) }}>+{pages.length - (isCompact ? 8 : 20)}</span>
              )}
            </div>

            {/* Score + Next */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Bottom score pill — animated with +N popup */}
              {hasScore && showScore && !isCompact && (
                <ScoreDisplay
                  navbarStyle={navbarStyle}
                  isCompact={false}
                  showDetail={navbarStyle !== 'minimal'}
                  tokens={tokens}
                  variant="bottom"
                />
              )}

              {/* Next button — shorter labels to prevent overflow */}
              {showPrevNext && (
                <button
                  onClick={handleNext}
                  disabled={isLastPage}
                  className={`transition-[transform,box-shadow,background-color] active:scale-95 whitespace-nowrap ${
                    isLastPage ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'
                  } ${
                    isCompact ? 'text-[9px]' : 'text-xs'
                  }`}
                  style={theme!.nextBtn(tokens, isLastPage, isCompact)}
                >
                  {isLastPage
                    ? (navbarStyle === 'glass' ? '✨ Selesai' : '🎉 Selesai')
                    : (isCompact
                      ? 'Lanjut →'
                      : `${navbarStyle === 'minimal' ? 'Next →' : 'Lanjut →'}`)
                  }
                </button>
              )}
            </div>
          </div>

          {/* Reset + Score tier message — only in preview/export, compact */}
          {hasScore && showScore && mode !== 'canvas' && !isCompact && (
            <div className="flex items-center justify-center gap-3 py-0.5 overflow-hidden">
              {scoreTier && navbarStyle !== 'minimal' && (
                <span className="text-[9px] font-bold truncate" style={{ color: scoreTier.color }}>
                  {scoreTier.label}
                </span>
              )}
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[10px] transition-[transform,box-shadow,background-color] active:scale-95 whitespace-nowrap"
                style={theme!.resetBtn(tokens)}
              >
                ↩ Ulangi
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
});
