'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import { generateExportHtml } from '@/lib/export-html';
import type { ExportState } from '@/lib/export-html';
import type { PreviewMode, LayoutTheme } from './types';
import { THEME_CSS } from './theme-css';
import { simpleHash } from './constants';

export interface UsePreviewBuilderReturn {
  htmlContent: string;
  building: boolean;
  srcdoc: string;
  handleForceRebuild: () => void;
  lastBuildTime: number;
  dataHash: string;
}

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

  // ── Canva store subscriptions ──────────────────────────────
  const canvaPages = useCanvaStore((s) => s.pages);
  const canvaRatioId = useCanvaStore((s) => s.ratioId);

  // ── Compute dataHash ───────────────────────────────────────
  const dataHash = useMemo(() => {
    if (previewMode === 'canvas') {
      return simpleHash(
        JSON.stringify({
          pages: canvaPages,
          ratioId: canvaRatioId,
          kuis: useAuthoringStore.getState().kuis,
          modules: useAuthoringStore.getState().modules,
        })
      );
    }
    return simpleHash(
      JSON.stringify({ meta, cp, tp, atp, alur, skenario, kuis, materi, modules, games, layoutTheme })
    );
  }, [previewMode, meta, cp, tp, atp, alur, skenario, kuis, materi, modules, games, canvaPages, canvaRatioId, layoutTheme]);

  // ── Build HTML content ─────────────────────────────────────
  const rebuildHTML = useCallback(() => {
    setBuilding(true);
    // Use requestAnimationFrame to let UI update with "Building..." indicator
    requestAnimationFrame(() => {
      try {
        let html = '';

        if (previewMode === 'unified') {
          // Unified mode -> exportUnifiedHTML (smart nav + canvas layout + game engines)
          const store = useCanvaStore.getState();
          html = store.exportUnifiedHTML();
        } else if (previewMode === 'canvas') {
          // Canvas mode -> exportSlideshowHTML (legacy slideshow)
          const store = useCanvaStore.getState();
          html = store.exportSlideshowHTML();
        } else if (previewMode === 'template') {
          // Template mode -> generateExportHtml + theme CSS
          const state: ExportState = {
            meta, cp, tp, atp, alur, skenario, kuis, materi, modules, games,
          };
          html = generateExportHtml(state);
          // Inject theme CSS before </head>
          if (layoutTheme !== 'default') {
            html = html.replace('</head>', THEME_CSS[layoutTheme] + '\n</head>');
          }
        } else {
          // Legacy mode -> generateExportHtml as-is
          const state: ExportState = {
            meta, cp, tp, atp, alur, skenario, kuis, materi, modules, games,
          };
          html = generateExportHtml(state);
        }

        setHtmlContent(html);
        cachedHashRef.current = dataHash;
        setLastBuildTime(Date.now());
      } catch (err) {
        console.error('Failed to generate preview HTML:', err);
      } finally {
        setBuilding(false);
      }
    });
  }, [previewMode, meta, cp, tp, atp, alur, skenario, kuis, materi, modules, games, layoutTheme, dataHash]);

  // ── Debounced rebuild on data change ───────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Skip rebuild if hash hasn't changed
    if (dataHash === cachedHashRef.current && htmlContent) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      rebuildHTML();
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataHash]);

  // ── Build srcdoc with navigation bridge ────────────────────
  const srcdoc = useMemo(() => {
    if (!htmlContent) return '';

    const isCanvasMode = previewMode === 'canvas';

    const navScript = `
<script>
(function(){
  ${isCanvasMode ? `
  // -- Canvas mode: showSlide navigation ----------------------
  var _origShow = window.showSlide;
  window.showSlide = function(n) {
    if (_origShow) _origShow(n);
    window.parent.postMessage({ type: 'canvasSlideChange', slide: n }, '*');
  };
  // Listen for parent navigate commands
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'goSlide' && typeof e.data.slide === 'number') {
      if (_origShow) _origShow(e.data.slide);
      else if (typeof showSlide === 'function') showSlide(e.data.slide);
    }
  });
  // Navigate to initial slide on load
  function initSlide() {
    if (typeof showSlide === 'function') showSlide(${activeSlide});
  }
  ` : `
  // -- Template/Legacy mode: goScreen navigation -------------
  var _origGo = window.goScreen;
  window.goScreen = function(id) {
    if (_origGo) _origGo(id);
    window.parent.postMessage({ type: 'screenChange', screen: id }, '*');
  };
  // Listen for navigateTo commands from parent
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'navigateTo' && e.data.screen) {
      if (_origGo) _origGo(e.data.screen);
      window.parent.postMessage({ type: 'screenChange', screen: e.data.screen }, '*');
    }
  });
  // Navigate to initial screen on load
  function initSlide() {
    if (typeof goScreen === 'function' && '${activeScreen}') {
      goScreen('${activeScreen}');
    }
  }
  `}

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initSlide();
  } else {
    document.addEventListener('DOMContentLoaded', initSlide);
  }
})();
<\/script>`;

    return htmlContent.replace('</body>', navScript + '\n</body>');
  }, [htmlContent, activeScreen, activeSlide, previewMode]);

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
