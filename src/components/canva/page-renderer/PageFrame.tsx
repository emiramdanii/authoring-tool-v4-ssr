'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { CanvaPage, NavConfig } from '../types';
import { DEFAULT_NAV_CONFIG } from '../types';
import { useInteractiveStore } from '@/store/interactive-store';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { TEMPLATE_ICON_MAP } from '@/lib/canva-icon-maps';
import { TokenResolver } from '@/core/renderer/SchemaRenderer';
import { alpha } from '@/lib/color-palette';
import { useNavSync } from '@/hooks/use-nav-sync';
import { ScoreDisplay } from './ScoreDisplay';

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

export type PageFrameMode = 'canvas' | 'preview' | 'export';

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
export function getScoreTier(pct: number): { label: string; color: string; glow: string } {
  if (pct >= 90) return { label: 'Luar Biasa', color: '#fbbf24', glow: 'rgba(251,191,36,0.4)' };
  if (pct >= 75) return { label: 'Hebat', color: '#34d399', glow: 'rgba(52,211,153,0.3)' };
  if (pct >= 50) return { label: 'Cukup Baik', color: '#22d3ee', glow: 'rgba(34,211,238,0.25)' };
  return { label: 'Terus Berlatih', color: '#fb923c', glow: 'rgba(251,146,60,0.25)' };
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

export function PageFrame({
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
  selectedBlockId,
  onBlockSelect,
}: PageFrameProps) {
  // ═══ Read navConfig reactively from both page prop AND store ═══
  // The page prop may be stale if the store updated after the prop was passed.
  // Reading directly from canva store ensures instant visual feedback when
  // the user toggles checkboxes or switches navbar style in the right panel.
  const storeNavConfig = useCanvaStore(s => s.pages[currentPageIndex]?.navConfig);
  const navConfig = storeNavConfig || getNavConfig(page);
  const navbarStyle = navConfig.navbarStyle || 'colorful';
  const theme = NAV_THEMES[navbarStyle] || NAV_THEMES.colorful;
  const showNavbar = navConfig.showNavbar !== false;
  const showScore = navConfig.showScore !== false;
  const showProgress = navConfig.showProgress !== false;
  const showPrevNext = navConfig.showPrevNext !== false;
  // Schema-driven cover pages don't show top nav — the CoverRenderer has its own background
  const isSchemaCover = isSchemaDriven && page.templateType === 'cover';
  const showTopNav = !isSchemaCover && page.templateType !== 'cover' && showNavbar;
  const isCoverPage = page.templateType === 'cover';
  const showBottomNav = showNavbar && !isCoverPage;

  // Use shared TokenResolver from PageRenderer (ensures palette overrides are consistent)
  const themeId = (page.templateData?.schemaThemeId as string) || undefined;
  const computedTokens = React.useMemo(() => new TokenResolver(themeId), [themeId]);
  const tokens = externalTokens || computedTokens;

  // ── Score data (use store computed functions — reactive + DRY) ──
  const totalScoreVal = useInteractiveStore((s) => s.totalScore());
  const totalMaxVal = useInteractiveStore((s) => s.totalMax());
  const totalPctVal = useInteractiveStore((s) => s.totalPct());
  const hasScore = totalMaxVal > 0;
  const scoreTier = hasScore ? getScoreTier(totalPctVal) : null;

  // Navigation — use shared navSync hook for dual-store sync
  const { goNext, goPrev, goToPage, goReset } = useNavSync();
  const meta = useAuthoringStore((s) => s.meta);
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
  const [topNavH, setTopNavH] = useState(isCompact ? 36 : 44);
  const [bottomNavH, setBottomNavH] = useState(isCompact ? 48 : 72);

  // Measure actual navbar heights via ResizeObserver
  useEffect(() => {
    const topEl = topNavRef.current;
    const bottomEl = bottomNavRef.current;
    const observers: ResizeObserver[] = [];

    if (topEl) {
      const obs = new ResizeObserver(() => {
        setTopNavH(topEl.offsetHeight);
      });
      obs.observe(topEl);
      observers.push(obs);
      setTopNavH(topEl.offsetHeight);
    } else {
      setTopNavH(0);
    }

    if (bottomEl) {
      const obs = new ResizeObserver(() => {
        setBottomNavH(bottomEl.offsetHeight);
      });
      obs.observe(bottomEl);
      observers.push(obs);
      setBottomNavH(bottomEl.offsetHeight);
    } else {
      setBottomNavH(0);
    }

    return () => observers.forEach(o => o.disconnect());
  }, [showTopNav, showBottomNav]);

  return (
    <>
      {/* ══ Background ════════════════════════════════════════ */}
      {!isSchemaDriven && (
        <>
          <div className="absolute inset-0" style={{ background: page.bgColor || tokens.color('bg') }} />
          {page.bgDataUrl && (
            <img src={page.bgDataUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `${alpha(tokens.color('bg'), 0.8)}` }}
          />
        </>
      )}
      {isSchemaDriven && (() => {
        const schemaBg = page.schema?.background;
        let baseBg = tokens.color('bg');
        if (schemaBg?.type === 'solid') baseBg = tokens.color(schemaBg.color1 || 'bg');
        else if (schemaBg?.type === 'gradient') baseBg = `linear-gradient(180deg, ${tokens.color(schemaBg.color1 || 'y')}, ${tokens.color(schemaBg.color2 || 'bg')})`;
        else if (schemaBg?.type === 'radial') baseBg = `radial-gradient(ellipse 90% 60% at 50% 0%, ${tokens.colorAlpha(schemaBg.color1 || 'y', 0.18)}, transparent 60%), linear-gradient(180deg, ${tokens.color(schemaBg.color2 || 'bg')}, ${tokens.color('bg2')})`;
        else baseBg = page.bgColor || tokens.color('bg');

        return (
          <>
            <div className="absolute inset-0" style={{ background: baseBg }} />
            {schemaBg?.imageUrl && (
              <>
                <img
                  src={schemaBg.imageUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: `rgba(0,0,0,${(schemaBg.overlay ?? 40) / 100})` }}
                />
              </>
            )}
          </>
        );
      })()}

      {/* ══ Top Navbar ════════════════════════════════════════ */}
      {showTopNav && (
        <div
          ref={topNavRef}
          className="absolute top-0 left-0 right-0 z-50 flex items-center gap-2 overflow-hidden"
          style={{
            ...theme.topBg(tokens),
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
            <div className="flex-1 min-w-[40px] rounded-full overflow-hidden" style={theme.progressTrack(tokens, isCompact)}>
              <div className="h-full transition-all duration-500" style={theme.progressBar(tokens, progressPct, isCompact)} />
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

      {/* ══ Content Area — offset for top & bottom navbars ════ */}
      <div className="absolute left-0 right-0 overflow-hidden" style={{
        top: showTopNav ? topNavH : 0,
        bottom: showBottomNav ? bottomNavH : 0,
      }}>
        {children}
        {extraElements}
      </div>

      {/* ══ Bottom Navbar ═════════════════════════════════════ */}
      {showBottomNav && (
        <div ref={bottomNavRef} className="absolute bottom-0 left-0 right-0 z-50 overflow-hidden"
          style={theme.bottomBg(tokens)}>
          {/* Progress bar */}
          {showProgress && (
            <div style={theme.progressTrack(tokens, isCompact)}>
              <div className="h-full transition-all duration-500" style={theme.progressBar(tokens, progressPct, isCompact)} />
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
                className={`font-bold transition-all active:scale-95 flex-shrink-0 ${
                  isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
                } ${
                  currentPageIndex > 0
                    ? 'cursor-pointer hover:opacity-80'
                    : 'opacity-30 cursor-not-allowed'
                }`}
                style={theme.prevBtn(tokens, currentPageIndex <= 0)}
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
                    className="relative flex-shrink-0 flex items-center justify-center cursor-pointer transition-all duration-200"
                    style={{
                      width: dotSize,
                      height: dotSize,
                      fontSize: isCompact ? 7 : (isActive ? 12 : 9),
                      ...theme.dotStyle(tokens, isActive, isComplete),
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
                  className={`transition-all active:scale-95 whitespace-nowrap ${
                    isLastPage ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'
                  } ${
                    isCompact ? 'text-[9px]' : 'text-xs'
                  }`}
                  style={theme.nextBtn(tokens, isLastPage, isCompact)}
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
                className="flex items-center gap-1 text-[10px] transition-all active:scale-95 whitespace-nowrap"
                style={theme.resetBtn(tokens)}
              >
                ↩ Ulangi
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
