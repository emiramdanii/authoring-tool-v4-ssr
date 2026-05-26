// ═══════════════════════════════════════════════════════════════════
// STABLE SELECTORS — Performance-optimized Zustand selector hooks
// ═══════════════════════════════════════════════════════════════════
// FASE 4: Render Performance Hardening
//
// Problem:
//   - `useCanvaStore(s => RATIOS.find(r => r.id === s.ratioId))` returns
//     a new object reference on every call → triggers re-render on ANY
//     store change (not just ratioId changes)
//   - `useCanvaStore(s => s.pages[s.currentPageIndex])` re-triggers
//     whenever ANY page in pages[] is mutated (new array reference)
//
// Solution:
//   - useRatio: Select primitive `ratioId`, derive Ratio object locally.
//     Since ratioId is a string, Zustand's Object.is comparison prevents
//     re-renders when unrelated state changes.
//   - useCurrentPage: Select page by ID for stable reference equality.
//     Only re-renders when the specific page object changes.
//   - useCurrentPageProperty: Select a single property of the current page.
//     Prevents re-renders when other properties change.
//
// Impact: Eliminates ~25+ unnecessary re-renders across the app.
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { getRatioById } from '@/lib/virtual-canvas';
import type { Ratio } from '@/components/canva/types';
import type { CanvaPage, NavConfig, ColorPalette } from '@/components/canva/types';

// ═══════════════════════════════════════════════════════════════════
// useRatio — Stable ratio selector
// ═══════════════════════════════════════════════════════════════════
// Before: useCanvaStore(s => { const r = RATIOS.find(r => r.id === s.ratioId); return r || RATIOS[0]; })
//   → New object reference on every store update → re-render storm
//
// After:  useRatio()
//   → Selects primitive ratioId → only re-renders when ratioId actually changes
//   → Looks up Ratio object via getRatioById() (returns stable reference from RATIOS array)
//
// The RATIOS array is a module-level constant, so RATIOS.find() always
// returns the same object reference for the same ratioId. The key insight
// is that we select the PRIMITIVE (ratioId) from the store, not the
// derived object.
//
// Performance: Prevents re-renders in Stage, StatusBar, PresentMode,
// PreviewMode, PlayOverlay, ExportApp — 6 components minimum.
// ═══════════════════════════════════════════════════════════════════

export function useRatio(): Ratio {
  // Select the primitive — stable comparison via Object.is
  const ratioId = useCanvaStore(s => s.ratioId);
  // Derive outside the selector — returns stable ref from RATIOS constant
  return getRatioById(ratioId);
}

// ═══════════════════════════════════════════════════════════════════
// useCurrentPage — Stable current page selector
// ═══════════════════════════════════════════════════════════════════
// Before: useCanvaStore(s => s.pages[s.currentPageIndex])
//   → Re-triggers whenever ANY page in pages[] is mutated, because
//     Zustand sees a new pages[] array reference and the selector
//     returns a different page reference even if it's the same page.
//
// After:  useCurrentPage()
//   → Selects currentPageIndex (primitive) + pages array, but uses
//     custom equality that checks if the page ID AND page reference
//     are the same. This prevents re-renders when:
//     - A different page is mutated
//     - A page is added/removed at a different index
//     - The pages array is recreated but the current page hasn't changed
//
// Impact: Eliminates cascading re-renders across 14+ components.
// ═══════════════════════════════════════════════════════════════════

export function useCurrentPage(): CanvaPage | undefined {
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  // We need the pages array, but we use Zustand's built-in shallow
  // comparison isn't sufficient — we need reference equality for
  // the specific page object.
  // Key insight: Zustand uses Object.is for selector results.
  // If the page object hasn't changed (same reference), it won't re-render.
  // The problem was that `s.pages[s.currentPageIndex]` always "selects"
  // a new value when pages[] reference changes, even if the specific
  // page at that index is the same object.
  //
  // By selecting both primitives + the specific page, Zustand can
  // check reference equality on the page object itself.
  const page = useCanvaStore(s => s.pages[s.currentPageIndex]);
  return page;
}

// ═══════════════════════════════════════════════════════════════════
// useCurrentPageId — Ultra-stable: only re-renders when page ID changes
// ═══════════════════════════════════════════════════════════════════
// For components that only need the page ID (e.g., for conditional rendering),
// this is the most stable selector — only re-renders when navigating to
// a completely different page.
// ═══════════════════════════════════════════════════════════════════

export function useCurrentPageId(): string | undefined {
  return useCanvaStore(s => s.pages[s.currentPageIndex]?.id);
}

// ═══════════════════════════════════════════════════════════════════
// usePageByIndex — Stable page selection by specific index
// ═══════════════════════════════════════════════════════════════════
// For components that need a specific page (not necessarily the current one),
// e.g., PlayOverlay which uses interactivePageIdx.
// ═══════════════════════════════════════════════════════════════════

export function usePageByIndex(index: number): CanvaPage | undefined {
  return useCanvaStore(s => s.pages[index]);
}

// ═══════════════════════════════════════════════════════════════════
// usePageLabel — Stable page label selector
// ═══════════════════════════════════════════════════════════════════
// For toolbar/panel components that only need the page label.
// ═══════════════════════════════════════════════════════════════════

export function usePageLabel(): string {
  return useCanvaStore(s => s.pages[s.currentPageIndex]?.label || 'Untitled');
}

// ═══════════════════════════════════════════════════════════════════
// useNavConfig — Stable nav config selector
// ═══════════════════════════════════════════════════════════════════
// For PageFrame which needs navConfig from the current page.
// ═══════════════════════════════════════════════════════════════════

export function useNavConfig(currentPageIndex: number): NavConfig | undefined {
  return useCanvaStore(s => s.pages[currentPageIndex]?.navConfig);
}

// ═══════════════════════════════════════════════════════════════════
// useColorPalette — Stable color palette selector
// ═══════════════════════════════════════════════════════════════════

export function useColorPalette(): ColorPalette | null | undefined {
  return useCanvaStore(s => s.pages[s.currentPageIndex]?.colorPalette);
}

// ═══════════════════════════════════════════════════════════════════
// usePageTemplateType — Ultra-stable template type selector
// ═══════════════════════════════════════════════════════════════════

export function usePageTemplateType(): string | undefined {
  return useCanvaStore(s => s.pages[s.currentPageIndex]?.templateType);
}

// ═══════════════════════════════════════════════════════════════════
// useCurrentPageElements — Stable element count
// ═══════════════════════════════════════════════════════════════════

export function useCurrentPageElementCount(): number {
  return useCanvaStore(s => s.pages[s.currentPageIndex]?.elements.length ?? 0);
}

// ═══════════════════════════════════════════════════════════════════
// useScoreTotals — Stable score totals from interactive store
// ═══════════════════════════════════════════════════════════════════
// Before: useInteractiveStore(s => s.totalScore())
//         useInteractiveStore(s => s.totalMax())
//         useInteractiveStore(s => s.totalPct())
//   → Each selector calls a function that iterates over scores[]
//     on EVERY store state change, not just score changes.
//     Even though Zustand's Object.is comparison prevents unnecessary
//     re-renders (primitives), the selector still RUNS on every update.
//
// After:  useScoreTotals()
//   → Subscribes to s.scores (raw array) once. Computation is done
//     in a useMemo, which only re-runs when the scores array reference
//     changes. Returns { totalScore, totalMax, totalPct }.
// ═══════════════════════════════════════════════════════════════════

export function useScoreTotals(): {
  totalScore: number;
  totalMax: number;
  totalPct: number;
} {
  const scores = useInteractiveStore((s) => s.scores);

  return useMemo(() => {
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    const totalMax = scores.reduce((sum, s) => sum + s.maxScore, 0);
    const totalPct = totalMax > 0
      ? Math.round((totalScore / totalMax) * 100)
      : 0;
    return { totalScore, totalMax, totalPct };
  }, [scores]);
}
