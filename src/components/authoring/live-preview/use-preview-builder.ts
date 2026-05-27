'use client';

// ═══════════════════════════════════════════════════════════════════
// USE PREVIEW BUILDER — Schema-first preview/export pipeline
// ═══════════════════════════════════════════════════════════════════
// Phase 3: Migrated from useAuthoringStore reads to schema-derived data.
//
// Data flow:
//   CONTENT:  CanvaStore.pages[].schema → deriveExportPayloadFromSchema()
//             → kuis, modules, games, materi, diskusi, refleksi, penutup,
//               petunjuk, skenario (all derived from schema, single source)
//   PROJECT:  useAuthoringStore → meta, cp, tp, atp, alur, suara
//             (project-level metadata, Phase 5 territory)
//   WRITE:    /api/export receives the same data shapes as before
//             → backward compatible, just the source changed
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import { deriveExportPayloadFromSchema } from '@/core/schema/export-projection';
import type { PreviewMode, LayoutTheme } from './types';
import { simpleHash } from './constants';
import { logger } from '@/core/utils/logger';

export interface UsePreviewBuilderReturn {
  htmlContent: string;
  building: boolean;
  srcdoc: string;
  handleForceRebuild: () => void;
  lastBuildTime: number;
  dataHash: string;
}

/**
 * Preview builder — now uses Vite SSR Export pipeline for ALL preview modes.
 * Instead of generating HTML client-side (which was always different from export),
 * we call /api/export with the same data — guaranteeing preview === export.
 *
 * Phase 3: Content data is derived from CanvaPage[].schema instead of
 * useAuthoringStore. This eliminates the dual source of truth that caused
 * "Engine Canggih Tapi Output Hollow" — edits via applyGuidedSchemaPatch()
 * are now immediately reflected in the preview.
 */
export function usePreviewBuilder(
  previewMode: PreviewMode,
  layoutTheme: LayoutTheme,
  activeScreen: string,
  activeSlide: number,
): UsePreviewBuilderReturn {
  // ── Local state ────────────────────────────────────────────
  const [htmlContent, setHtmlContent] = useState('');
  const [building, setBuilding] = useState(false);
  const [lastBuildTime, setLastBuildTime] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cachedHashRef = useRef<string>('');

  // ── Canva store subscriptions ──────────────────────────────
  const canvaPages = useCanvaStore((s) => s.pages);
  const canvaRatioId = useCanvaStore((s) => s.ratioId);

  // ── Project-level metadata from authoring store (Phase 5 territory) ──
  const meta = useAuthoringStore((s) => s.meta);
  const cp = useAuthoringStore((s) => s.cp);
  const tp = useAuthoringStore((s) => s.tp);
  const atp = useAuthoringStore((s) => s.atp);
  const alur = useAuthoringStore((s) => s.alur);
  const suara = useAuthoringStore((s) => s.suara);

  // ── Derive content from schema (single source of truth) ────
  const schemaPayload = useMemo(
    () => deriveExportPayloadFromSchema(canvaPages),
    [canvaPages],
  );

  // ── Compute dataHash ───────────────────────────────────────
  // Exclude bgDataUrl from hash — base64 images are huge and slow down stringify.
  // Changes to bgDataUrl still trigger rebuild via the canvaPages dependency.
  const dataHash = useMemo(() => {
    const pagesLite = canvaPages.map(p => ({
      ...p,
      bgDataUrl: p.bgDataUrl ? `[img:${p.bgDataUrl.length}]` : null,
      elements: p.elements.map(e => ({
        ...e,
        // Exclude large text content from hash
        text: e.text ? `[text:${e.text.length}]` : undefined,
      })),
    }));
    return simpleHash(
      JSON.stringify({
        pages: pagesLite,
        ratioId: canvaRatioId,
        // Project-level metadata
        meta, cp, tp, atp, alur, suara,
        // Schema-derived content
        ...schemaPayload,
        layoutTheme, previewMode,
      })
    );
  }, [canvaPages, canvaRatioId, meta, cp, tp, atp, alur, suara, schemaPayload, layoutTheme, previewMode]);

  // ── Build HTML content via Vite SSR Export API ─────────────
  const rebuildHTML = useCallback(async () => {
    setBuilding(true);
    try {
      // Read current state at build time (not from stale closures)
      const canvaStore = useCanvaStore.getState();
      const authStore = useAuthoringStore.getState();

      // Derive content from schema at build time (same logic as subscription)
      const payload = deriveExportPayloadFromSchema(canvaStore.pages);

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: canvaStore.pages,
          ratioId: canvaStore.ratioId,
          // Project-level metadata (Phase 5 territory)
          meta: authStore.meta,
          cp: authStore.cp,
          tp: authStore.tp,
          atp: authStore.atp,
          alur: authStore.alur,
          suara: authStore.suara,
          // Schema-derived content (single source of truth)
          allKuis: payload.allKuis,
          allModules: payload.allModules,
          games: payload.games,
          materi: payload.materi,
          skenario: payload.skenario,
          petunjuk: payload.petunjuk,
          diskusi: payload.diskusi,
          refleksi: payload.refleksi,
          penutup: payload.penutup,
        }),
      });

      if (!response.ok) {
        throw new Error(`Export API returned ${response.status}`);
      }

      const html = await response.text();
      setHtmlContent(html);
      cachedHashRef.current = dataHash;
      setLastBuildTime(Date.now());
    } catch (err) {
      logger.error('PreviewBuilder', err);
      setHtmlContent('');
    } finally {
      setBuilding(false);
    }
  }, [dataHash]);

  // ── Debounced rebuild on data change ───────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Skip rebuild if hash hasn't changed
    if (dataHash === cachedHashRef.current && htmlContent) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      rebuildHTML();
    }, 800); // Slightly longer debounce since it's now an API call

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataHash]);

  // ── Build srcdoc with navigation bridge ────────────────────
  // The Vite SSR export already includes full interactive navigation
  // (keyboard, swipe, button). We just add a postMessage bridge
  // so the parent iframe can track page changes.
  const srcdoc = useMemo(() => {
    if (!htmlContent) return '';

    const navScript = `
<script>
(function(){
  // Listen for interactiveStore navigation changes and relay to parent
  // The Vite SSR export uses Zustand interactiveStore for navigation,
  // so we watch for DOM mutations that indicate page changes.
  var _lastPageIdx = 0;
  var observer = new MutationObserver(function() {
    var activePage = document.querySelector('[class*="block"]');
    if (activePage) {
      var allPages = activePage.parentElement ? activePage.parentElement.children : [];
      var idx = Array.from(allPages).indexOf(activePage);
      if (idx !== _lastPageIdx) {
        _lastPageIdx = idx;
        window.parent.postMessage({ type: 'canvasSlideChange', slide: idx }, '*');
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });

  // Listen for parent navigate commands
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'goSlide' && typeof e.data.slide === 'number') {
      // Trigger the interactiveStore navigation
      var store = window.__INTERACTIVE_STORE__;
      if (store && store.getState) {
        store.getState().goInteractivePage(e.data.slide);
      }
    }
  });

  // Navigate to initial slide on load
  function initSlide() {
    var store = window.__INTERACTIVE_STORE__;
    if (store && store.getState) {
      store.getState().goInteractivePage(${activeSlide});
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initSlide();
  } else {
    document.addEventListener('DOMContentLoaded', initSlide);
  }
})();
<\/script>`;

    return htmlContent.replace('</body>', navScript + '\n</body>');
  }, [htmlContent, activeSlide]);

  const handleForceRebuild = useCallback(() => {
    cachedHashRef.current = ''; // Force hash mismatch
    rebuildHTML();
  }, [rebuildHTML]);

  return {
    htmlContent,
    building,
    srcdoc,
    handleForceRebuild,
    lastBuildTime,
    dataHash,
  };
}
