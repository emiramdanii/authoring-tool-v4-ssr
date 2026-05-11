'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvaPage, NavConfig } from '../types';
import { DEFAULT_NAV_CONFIG } from '../types';
import { useInteractiveStore } from '@/store/interactive-store';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { TEMPLATE_ICON_MAP } from '@/lib/canva-icon-maps';
import { TokenResolver } from '@/core/renderer/SchemaRenderer';
import { alpha } from '@/lib/color-palette';
import type { SchemaBlock } from '@/core/schema/types';

// ═══════════════════════════════════════════════════════════════
// PAGE FRAME — Unified page shell shared by Canvas, Preview, Export
//
// Renders:
//   1. Background (color + image + overlay)
//   2. Top Navbar (title, progress, score)
//   3. Content area (offset for navbars)
//   4. Bottom Navbar (progress, navigation, score)
//
// Each render context (canvas/preview/export) uses this frame
// and only adds its own features on top.
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
  /** Whether the template is locked */
  isLocked: boolean;
  /** Whether this is a schema-driven page (content from SchemaScreenRenderer) */
  isSchemaDriven?: boolean;
  /** Content children (PageRenderer or template content) */
  children: React.ReactNode;
  /** Overlay elements rendered on top of content (for locked templates) */
  overlayElements?: React.ReactNode;
  /** Extra elements on top (for unlocked templates / custom mode) */
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

// TEMPLATE_ICON_MAP imported from canva-icon-maps.ts (single source of truth)

// ── Get next button label based on current/next template type ──
function getNextLabel(currentType: string, nextType: string): string {
  switch (currentType) {
    case 'cover': return 'Mulai Belajar →';
    case 'petunjuk': return 'Tujuan Pembelajaran →';
    case 'dokumen': return 'Mulai Pembelajaran →';
    case 'skenario':
      if (nextType === 'materi') return 'Lanjut ke Materi →';
      if (nextType === 'kuis') return 'Lanjut ke Kuis →';
      return 'Lanjut →';
    case 'materi':
      if (nextType === 'kuis') return 'Mulai Kuis ❓';
      return 'Lanjut →';
    case 'refleksi': return 'Lihat Hasil →';
    case 'penutup': return 'Lihat Hasil →';
    default: return 'Lanjut →';
  }
}

// ── Helpers ───────────────────────────────────────────────────

function getNavConfig(page: CanvaPage): NavConfig {
  return page.navConfig || DEFAULT_NAV_CONFIG;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function PageFrame({
  mode,
  page,
  currentPageIndex,
  totalPages,
  isLocked,
  isSchemaDriven = false,
  children,
  overlayElements,
  extraElements,
  className,
  style,
  tokens: externalTokens,
  selectedBlockId,
  onBlockSelect,
}: PageFrameProps) {
  const navConfig = getNavConfig(page);
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
  // Fall back to creating one if not provided (backward compat)
  const themeId = (page.templateData?.schemaThemeId as string) || undefined;
  const computedTokens = React.useMemo(() => new TokenResolver(themeId), [themeId]);
  const tokens = externalTokens || computedTokens;

  // Score data
  const totalScoreVal = useInteractiveStore((s) => s.scores.reduce((sum: number, e: { score: number }) => sum + e.score, 0));
  const totalMaxVal = useInteractiveStore((s) => s.scores.reduce((sum: number, e: { maxScore: number }) => sum + e.maxScore, 0));
  const totalPctVal = useInteractiveStore((s) => {
    const max = s.scores.reduce((sum: number, e: { maxScore: number }) => sum + e.maxScore, 0);
    return max === 0 ? 0 : Math.round((s.scores.reduce((sum: number, e: { score: number }) => sum + e.score, 0) / max) * 100);
  });
  const hasScore = totalMaxVal > 0;

  // Navigation
  const meta = useAuthoringStore((s) => s.meta);
  const pages = useCanvaStore((s) => s.pages);
  const goPage = useCanvaStore((s) => s.goPage);
  const goInteractivePage = useInteractiveStore((s) => s.goInteractivePage);
  const nextInteractivePage = useInteractiveStore((s) => s.nextInteractivePage);
  const prevInteractivePage = useInteractiveStore((s) => s.prevInteractivePage);
  const resetAllScores = useInteractiveStore((s) => s.resetAllScores);
  const isPageComplete = useInteractiveStore((s) => s.isPageComplete);

  const progressPct = totalPages > 0 ? Math.round(((currentPageIndex + 1) / totalPages) * 100) : 0;
  const isLastPage = currentPageIndex >= totalPages - 1;
  const currentTemplate = page.templateType || 'custom';
  const nextTemplate = pages[currentPageIndex + 1]?.templateType || '';

  const handleNext = useCallback(() => {
    // Sync interactive store index to current page before advancing.
    // In canvas mode, user navigates via LeftPanel which updates
    // canvaStore.currentPageIndex but NOT interactiveStore.interactivePageIdx.
    // Without syncing, nextInteractivePage() advances from the stale
    // interactivePageIdx and goPage() jumps to the wrong page.
    goInteractivePage(currentPageIndex);
    nextInteractivePage();
    const afterIdx = useInteractiveStore.getState().interactivePageIdx;
    goPage(afterIdx);
  }, [currentPageIndex, nextInteractivePage, goPage, goInteractivePage]);

  const handlePrev = useCallback(() => {
    goInteractivePage(currentPageIndex);
    prevInteractivePage();
    const afterIdx = useInteractiveStore.getState().interactivePageIdx;
    goPage(afterIdx);
  }, [currentPageIndex, prevInteractivePage, goPage, goInteractivePage]);

  const handleNav = useCallback((idx: number) => {
    goInteractivePage(idx);
    goPage(idx);
  }, [goInteractivePage, goPage]);

  const handleReset = useCallback(() => {
    resetAllScores();
    goInteractivePage(0);
    goPage(0);
  }, [resetAllScores, goInteractivePage, goPage]);

  // ── Mode-specific sizing ──────────────────────────────────
  // Canvas mode: slightly smaller but NOT crushed; Preview/Export: full-size
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
      {/* Schema-driven pages render their own backgrounds (radial gradients, etc.)
          — skip the default bg overlay to avoid drowning them out */}
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
      {/* Schema-driven: only set base bg color so schema gradients blend properly */}
      {isSchemaDriven && (
        <div className="absolute inset-0" style={{ background: page.bgColor || tokens.color('bg') }} />
      )}

      {/* ══ Top Navbar ════════════════════════════════════════ */}
      {showTopNav && (
        <div
          ref={topNavRef}
          className="absolute top-0 left-0 right-0 z-50 flex items-center gap-2 border-b"
          style={{
            background: `${alpha(tokens.color('bg'), 0.88)}`,
            backdropFilter: 'blur(12px)',
            borderColor: tokens.colorAlpha('border', 1),
            padding: isCompact ? '3px 8px' : '8px 16px',
          }}
        >
          <span className={`font-bold whitespace-nowrap truncate ${
            isCompact ? 'text-[10px] max-w-[140px]' : 'text-sm max-w-[200px]'
          }`} style={{ color: tokens.color('y'), fontFamily: tokens.fontFamily('body') }}>
            {meta.namaBab || meta.judulPertemuan || 'Media'}
          </span>

          {showProgress && (
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: isCompact ? 4 : 6, background: tokens.colorAlpha('border', 0.5) }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${tokens.color('g')}, ${tokens.color('c')})`,
                }} />
            </div>
          )}

          {hasScore && showScore && (
            <div className={`flex items-center gap-1.5 rounded-full ${
              isCompact
                ? 'px-2 py-0.5 text-[9px]'
                : 'px-2.5 py-1 text-[11px]'
            }`} style={{
              background: tokens.colorAlpha('g', 0.1),
              border: `1px solid ${tokens.colorAlpha('g', 0.2)}`,
            }}>
              <span>🏆</span>
              <span className="font-mono font-bold" style={{ color: tokens.color('g') }}>{totalPctVal}%</span>
              {!isCompact && (
                <span className="text-[9px]" style={{ color: tokens.colorAlpha('g', 0.5) }}>{totalScoreVal}/{totalMaxVal}</span>
              )}
            </div>
          )}

          <span className={`font-mono ${isCompact ? 'text-[8px]' : 'text-[10px]'}`} style={{ color: tokens.color('muted') }}>
            {currentPageIndex + 1}/{totalPages}
          </span>
        </div>
      )}

      {/* ══ Content Area — offset for top & bottom navbars ════ */}
      <div className="absolute left-0 right-0 overflow-hidden" style={{
        top: showTopNav ? topNavH : 0,
        bottom: showBottomNav ? bottomNavH : 0,
      }}>
        {/* Main content (template or custom elements) */}
        {children}

        {/* Overlay elements on locked template pages */}
        {isLocked && overlayElements}

        {/* Extra elements on unlocked template / custom pages */}
        {!isLocked && extraElements}
      </div>

      {/* ══ Bottom Navbar ═════════════════════════════════════ */}
      {showBottomNav && (
        <div ref={bottomNavRef} className="absolute bottom-0 left-0 right-0 z-50 border-t"
          style={{
            background: `${alpha(tokens.color('bg'), 0.92)}`,
            backdropFilter: 'blur(12px)',
            borderColor: tokens.colorAlpha('border', 1),
          }}>
          {/* Progress bar */}
          {showProgress && (
            <div style={{ height: isCompact ? 2 : 4, background: tokens.colorAlpha('border', 0.3) }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${tokens.color('g')}, ${tokens.color('c')})`,
                }} />
            </div>
          )}

          {/* Nav bar */}
          <div className={`flex items-center justify-between gap-1 ${
            isCompact ? 'px-2 py-1' : 'px-3 py-2'
          }`}>
            {/* Prev button */}
            {showPrevNext && (
              <button
                onClick={handlePrev}
                disabled={currentPageIndex <= 0}
                className={`font-bold rounded-lg transition-all ${
                  isCompact
                    ? 'text-[9px] px-1.5 py-0.5'
                    : 'text-xs px-3 py-1.5'
                } ${
                  currentPageIndex > 0
                    ? 'cursor-pointer hover:opacity-80'
                    : 'opacity-30 cursor-not-allowed'
                }`}
                style={{
                  color: currentPageIndex > 0 ? tokens.color('muted') : tokens.colorAlpha('muted', 0.3),
                }}
              >
                ← Prev
              </button>
            )}

            {/* Page dots */}
            <div className={`flex items-center gap-0.5 overflow-hidden ${
              isCompact ? 'max-w-[50%]' : 'max-w-[50vw]'
            }`}>
              {pages.slice(0, isCompact ? 12 : pages.length).map((p, i) => {
                const isActive = i === currentPageIndex;
                const isComplete = isPageComplete(i);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleNav(i)}
                    title={`${p.label || `Halaman ${i + 1}`} (${i + 1}/${totalPages})${isComplete ? ' ✓' : ''}`}
                    className={`relative flex-shrink-0 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
                      isActive
                        ? isCompact
                          ? 'w-5 h-5 text-[8px]'
                          : 'w-8 h-8 text-base shadow-lg'
                        : ` ${
                            isCompact ? 'w-3.5 h-3.5 text-[6px]' : 'w-6 h-6 text-xs'
                          }`
                    }`}
                    style={{
                      background: isActive ? tokens.colorAlpha('c', 0.15) : 'transparent',
                      border: isActive ? `2px solid ${tokens.colorAlpha('c', 0.5)}` : isComplete ? `2px solid ${tokens.color('g')}` : '2px solid transparent',
                      boxShadow: isActive ? `0 0 8px ${tokens.colorAlpha('c', 0.2)}` : 'none',
                    }}
                  >
                    <span>{TEMPLATE_ICON_MAP[p.templateType] || '📄'}</span>
                  </button>
                );
              })}
              {isCompact && pages.length > 12 && (
                <span className="text-[7px]" style={{ color: tokens.colorAlpha('muted', 0.4) }}>+{pages.length - 12}</span>
              )}
            </div>

            {/* Score + Next */}
            <div className="flex items-center gap-1.5">
              {hasScore && showScore && !isCompact && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{
                    background: tokens.colorAlpha('g', 0.1),
                    border: `1px solid ${tokens.colorAlpha('g', 0.2)}`,
                  }}>
                  <span className="text-[10px]">🏆</span>
                  <span className="font-mono font-bold text-[11px]" style={{ color: tokens.color('g') }}>{totalPctVal}%</span>
                  <span className="text-[9px]" style={{ color: tokens.colorAlpha('g', 0.5) }}>{totalScoreVal}/{totalMaxVal}</span>
                </div>
              )}

              {showPrevNext && (
                <button
                  onClick={handleNext}
                  disabled={isLastPage}
                  className={`font-extrabold rounded-lg transition-all ${
                    isCompact
                      ? 'text-[9px] px-2 py-0.5'
                      : 'text-xs px-3 py-1.5'
                  } ${
                    isLastPage
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:-translate-y-0.5 hover:shadow-lg cursor-pointer'
                  }`}
                  style={{
                    background: isLastPage ? tokens.colorAlpha('y', 0.3) : tokens.color('y'),
                    color: tokens.color('bg'),
                  }}
                >
                  {isLastPage ? '🎉 Selesai' : (isCompact ? 'Lanjut →' : getNextLabel(currentTemplate, nextTemplate))}
                </button>
              )}
            </div>
          </div>

          {/* Reset button (export/preview only, not canvas) */}
          {hasScore && showScore && mode !== 'canvas' && (
            <div className="flex justify-center pb-1">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-[10px] transition-colors px-2 py-0.5 rounded"
                style={{ color: tokens.color('muted') }}
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
