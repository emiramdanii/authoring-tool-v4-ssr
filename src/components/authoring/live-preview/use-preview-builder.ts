'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import type { PreviewMode, LayoutTheme } from './types';
import { simpleHash } from './constants';

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

  // ── Authoring store subscriptions ──────────────────────────
  const meta = useAuthoringStore((s) => s.meta);
  const cp = useAuthoringStore((s) => s.cp);
  const tp = useAuthoringStore((s) => s.tp);
  const atp = useAuthoringStore((s) => s.atp);
  const alur = useAuthoringStore((s) => s.alur);
  const skenario = useAuthoringStore((s) => s.skenario);
  const kuis = useAuthoringStore((s) => s.kuis);
  const materi = useAuthoringStore((s) => s.materi);
  const modules = useAuthoringStore((s) => s.modules);
  const games = useAuthoringStore((s) => s.games);
  const petunjuk = useAuthoringStore((s) => s.petunjuk);
  const diskusi = useAuthoringStore((s) => s.diskusi);
  const refleksi = useAuthoringStore((s) => s.refleksi);
  const penutup = useAuthoringStore((s) => s.penutup);

  // ── Canva store subscriptions ──────────────────────────────
  const canvaPages = useCanvaStore((s) => s.pages);
  const canvaRatioId = useCanvaStore((s) => s.ratioId);

  // ── Compute dataHash ───────────────────────────────────────
  const dataHash = useMemo(() => {
    return simpleHash(
      JSON.stringify({
        pages: canvaPages,
        ratioId: canvaRatioId,
        meta, cp, tp, atp, alur, skenario, kuis, materi, modules, games,
        petunjuk, diskusi, refleksi, penutup, layoutTheme, previewMode,
      })
    );
  }, [canvaPages, canvaRatioId, meta, cp, tp, atp, alur, skenario, kuis, materi, modules, games, petunjuk, diskusi, refleksi, penutup, layoutTheme, previewMode]);

  // ── Build HTML content via Vite SSR Export API ─────────────
  const rebuildHTML = useCallback(async () => {
    setBuilding(true);
    try {
      const authStore = useAuthoringStore.getState();
      const canvaStore = useCanvaStore.getState();

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: canvaStore.pages,
          ratioId: canvaStore.ratioId,
          meta: authStore.meta,
          allKuis: authStore.kuis,
          allModules: authStore.modules,
          cp: authStore.cp,
          tp: authStore.tp,
          materi: authStore.materi,
          skenario: authStore.skenario,
          petunjuk: authStore.petunjuk,
          diskusi: authStore.diskusi,
          refleksi: authStore.refleksi,
          penutup: authStore.penutup,
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
      console.error('Failed to generate preview HTML:', err);
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
