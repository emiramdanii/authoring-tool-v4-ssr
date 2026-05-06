'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import { generateExportHtml } from '@/lib/export-html';
import type { ExportState } from '@/lib/export-html';
import {
  RefreshCw,
  Loader2,
  Monitor,
  Tablet,
  Smartphone,
  ChevronDown,
  Eye,
  ExternalLink,
  ArrowLeft,
  X,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

type PreviewMode = 'canvas' | 'template' | 'legacy';
type DeviceMode = 'mobile' | 'tablet' | 'desktop';
type LayoutTheme = 'colorful' | 'neon' | 'glass' | 'default' | 'minimal';

const DEVICE_MODES: { id: DeviceMode; label: string; icon: typeof Smartphone; width: number }[] = [
  { id: 'mobile', label: 'Mobile', icon: Smartphone, width: 390 },
  { id: 'tablet', label: 'Tablet', icon: Tablet, width: 768 },
  { id: 'desktop', label: 'Desktop', icon: Monitor, width: 0 },
];

const LAYOUT_THEMES: { id: LayoutTheme; icon: string; label: string }[] = [
  { id: 'colorful', icon: '🌈', label: 'Colorful' },
  { id: 'neon', icon: '💜', label: 'Neon' },
  { id: 'glass', icon: '🪟', label: 'Glass' },
  { id: 'default', icon: '🌙', label: 'Default' },
  { id: 'minimal', icon: '⬜', label: 'Minimal' },
];

const SCREEN_OPTIONS = [
  { id: 's-cover', label: '🎬 Cover' },
  { id: 's-cp', label: '📋 CP / TP / ATP' },
  { id: 's-modules', label: '📦 Modul' },
  { id: 's-sk', label: '🎭 Skenario' },
  { id: 's-materi', label: '📖 Materi & Fungsi' },
  { id: 's-kuis', label: '❓ Kuis' },
  { id: 's-hasil', label: '📊 Hasil' },
];

// ═══════════════════════════════════════════════════════════════
// CSS THEME OVERRIDES for Template mode
// ═══════════════════════════════════════════════════════════════

const THEME_CSS: Record<LayoutTheme, string> = {
  colorful: `<style>
:root{--bg:#1a1030;--bg2:#251845;--card:#301f58;--border:rgba(255,255,255,.1);
  --y:#ffd166;--c:#06d6a0;--r:#ef476f;--p:#9b5de5;--g:#06d6a0;--o:#ff9f1c;
  --text:#f0e6ff;--muted:#9b8ab8;}
.screen,.navbar{background:transparent!important;}
.screen>div,.main{background:transparent!important;}
.card{background:rgba(255,255,255,.08)!important;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12)!important;}
.btn-y{background:linear-gradient(135deg,#ffd166,#ff9f1c)!important;box-shadow:0 4px 15px rgba(255,209,102,.3)!important;}
.btn-c{background:linear-gradient(135deg,#06d6a0,#0cb88e)!important;}
.btn-g{background:linear-gradient(135deg,#06d6a0,#34d399)!important;}
.chip{box-shadow:0 2px 8px rgba(0,0,0,.2)!important;}
.cover-icon{filter:drop-shadow(0 0 20px rgba(255,209,102,.4));}
.def-box{background:linear-gradient(135deg,rgba(255,209,102,.1),rgba(6,214,160,.05))!important;border-left-color:#ffd166!important;}
.sk-shell{border-color:rgba(155,93,229,.3)!important;}
</style>`,
  neon: `<style>
:root{--bg:#0a0a1a;--bg2:#0d0d24;--card:#12122e;--border:rgba(139,92,246,.15);
  --y:#c084fc;--c:#22d3ee;--r:#f472b6;--p:#8b5cf6;--g:#34d399;--o:#fb923c;
  --text:#e0e7ff;--muted:#6366f1;}
.card{background:rgba(139,92,246,.06)!important;border:1px solid rgba(139,92,246,.2)!important;box-shadow:0 0 20px rgba(139,92,246,.08)!important;}
.btn-y{background:#8b5cf6!important;box-shadow:0 0 20px rgba(139,92,246,.4),0 0 40px rgba(139,92,246,.15)!important;text-shadow:0 0 10px rgba(255,255,255,.3)!important;}
.btn-c{background:#22d3ee!important;box-shadow:0 0 20px rgba(34,211,238,.4)!important;}
.btn-g{background:#34d399!important;box-shadow:0 0 20px rgba(52,211,153,.4)!important;}
.chip{box-shadow:0 0 10px rgba(139,92,246,.2)!important;}
.cover-icon{filter:drop-shadow(0 0 25px rgba(139,92,246,.6));}
.navbar{border-bottom-color:rgba(139,92,246,.2)!important;}
.nav-prog-fill{background:linear-gradient(90deg,#8b5cf6,#22d3ee)!important;box-shadow:0 0 10px rgba(139,92,246,.4)!important;}
.q-opt:hover:not(.dis){border-color:#8b5cf6!important;box-shadow:0 0 15px rgba(139,92,246,.2)!important;}
.sk-shell{border-color:rgba(139,92,246,.3)!important;box-shadow:0 0 30px rgba(139,92,246,.1)!important;}
</style>`,
  glass: `<style>
:root{--bg:#1e293b;--bg2:#263548;--card:rgba(255,255,255,.06);--border:rgba(255,255,255,.1);
  --y:#fbbf24;--c:#22d3ee;--r:#f87171;--p:#a78bfa;--g:#34d399;--o:#fb923c;
  --text:#f1f5f9;--muted:#94a3b8;}
body{background:linear-gradient(135deg,#1e293b,#0f172a)!important;}
.card{background:rgba(255,255,255,.05)!important;backdrop-filter:blur(16px)!important;-webkit-backdrop-filter:blur(16px)!important;border:1px solid rgba(255,255,255,.1)!important;box-shadow:0 8px 32px rgba(0,0,0,.2)!important;}
.btn-y{background:rgba(251,191,36,.9)!important;backdrop-filter:blur(8px)!important;box-shadow:0 4px 20px rgba(251,191,36,.2)!important;}
.btn-c{background:rgba(34,211,238,.9)!important;backdrop-filter:blur(8px)!important;}
.btn-g{background:rgba(52,211,153,.9)!important;backdrop-filter:blur(8px)!important;}
.chip{backdrop-filter:blur(8px)!important;}
.navbar{backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important;background:rgba(30,41,59,.7)!important;}
.sk-shell{backdrop-filter:blur(12px)!important;background:rgba(255,255,255,.03)!important;border-color:rgba(255,255,255,.1)!important;}
</style>`,
  default: ``, // Uses original CSS as-is (dark classic theme)
  minimal: `<style>
:root{--bg:#fafafa;--bg2:#f5f5f5;--card:#ffffff;--border:rgba(0,0,0,.08);
  --y:#eab308;--c:#0891b2;--r:#dc2626;--p:#7c3aed;--g:#16a34a;--o:#ea580c;
  --text:#1a1a1a;--muted:#737373;}
body{color:#1a1a1a!important;}
.screen{background:var(--bg)!important;}
.card{background:var(--card)!important;border:1px solid var(--border)!important;box-shadow:none!important;backdrop-filter:none!important;}
.btn{box-shadow:none!important;transform:none!important;border-radius:8px!important;}
.btn:hover{transform:none!important;}
.cover-icon{animation:none!important;filter:none!important;}
.chip{box-shadow:none!important;}
.navbar{background:var(--bg2)!important;backdrop-filter:none!important;border-bottom-color:var(--border)!important;}
.q-opt{border:1px solid var(--border)!important;background:var(--card)!important;}
.sk-shell{border:1px solid var(--border)!important;box-shadow:none!important;}
.def-box{background:rgba(234,179,8,.06)!important;border-left-color:var(--y)!important;}
.hasil-circle{background:conic-gradient(var(--g) 0%,var(--g) var(--prog,0%),#e5e5e5 var(--prog,0%) 100%)!important;}
.hasil-circle::before{background:var(--bg2)!important;}
</style>`,
};

// ═══════════════════════════════════════════════════════════════
// SIMPLE HASH for data change detection
// ═══════════════════════════════════════════════════════════════

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(36);
}

// ═══════════════════════════════════════════════════════════════
// LIVE PREVIEW COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function LivePreview() {
  // ── Local state ────────────────────────────────────────────────
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [activeScreen, setActiveScreen] = useState('s-cover');
  const [activeSlide, setActiveSlide] = useState(0);
  const [htmlContent, setHtmlContent] = useState('');
  const [previewMode, setPreviewModeLocal] = useState<PreviewMode>('template');
  const [layoutTheme, setLayoutTheme] = useState<LayoutTheme>('default');
  const [building, setBuilding] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [lastBuildTime, setLastBuildTime] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cachedHashRef = useRef<string>('');
  const modeRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const userModeRef = useRef(false); // Track if user manually selected a mode
  const initialDetectDone = useRef(false);

  // ── Store subscriptions ────────────────────────────────────────
  const setActivePanel = useAuthoringStore((s) => s.setActivePanel);

  // ── Authoring store subscriptions ──────────────────────────────
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
  const dirty = useAuthoringStore((s) => s.dirty);

  // ── Canva store subscriptions ──────────────────────────────────
  const canvaPages = useCanvaStore((s) => s.pages);
  const canvaRatioId = useCanvaStore((s) => s.ratioId);

  // ── Auto-detect mode (only on first load, not overriding user) ─
  const hasCanvasContent = canvaPages.some(
    (p) => p.elements && p.elements.length > 0
  );

  const detectedMode = useMemo<PreviewMode>(() => {
    if (hasCanvasContent) return 'canvas';
    return 'template';
  }, [hasCanvasContent]);

  // Only auto-detect on initial mount — don't override user's manual selection
  useEffect(() => {
    if (!initialDetectDone.current) {
      initialDetectDone.current = true;
      setPreviewModeLocal(detectedMode);
    }
  }, [detectedMode]);

  // Wrapper for setPreviewMode that tracks user intent
  const setPreviewMode = useCallback((mode: PreviewMode) => {
    userModeRef.current = true;
    setPreviewModeLocal(mode);
    cachedHashRef.current = ''; // force rebuild on mode change
  }, []);

  // ── Compute dataHash ───────────────────────────────────────────
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

  // ── Build HTML content ─────────────────────────────────────────
  const rebuildHTML = useCallback(() => {
    setBuilding(true);
    // Use requestAnimationFrame to let UI update with "Building..." indicator
    requestAnimationFrame(() => {
      try {
        let html = '';

        if (previewMode === 'canvas') {
          // Canvas mode -> exportSlideshowHTML
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

  // ── Debounced rebuild on data change ───────────────────────────
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

  // ── Build srcdoc with navigation bridge ────────────────────────
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

  // ── Listen for postMessage from iframe ─────────────────────────
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // Template/Legacy: screen navigation sync
      if (e.data?.type === 'screenChange' && e.data.screen) {
        setActiveScreen(e.data.screen);
      }
      // Canvas: slide navigation sync
      if (e.data?.type === 'canvasSlideChange' && typeof e.data.slide === 'number') {
        setActiveSlide(e.data.slide);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // ── Close dropdowns on outside click ───────────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) setModeOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Keyboard shortcut: Escape to go back ──────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePanel('canva');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActivePanel]);

  // ── Navigation handlers ────────────────────────────────────────
  const handleScreenSelect = (screenId: string) => {
    setActiveScreen(screenId);
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'navigateTo', screen: screenId }, '*');
    }
  };

  const handleSlideSelect = (slideIdx: number) => {
    setActiveSlide(slideIdx);
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'goSlide', slide: slideIdx }, '*');
    }
  };

  const handleForceRebuild = () => {
    cachedHashRef.current = ''; // Force hash mismatch
    rebuildHTML();
  };

  // ── Open preview in new browser tab ────────────────────────────
  const handleOpenInNewTab = useCallback(() => {
    if (!htmlContent) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
    }
  }, [htmlContent]);

  // ── Device info ────────────────────────────────────────────────
  const currentDevice = DEVICE_MODES.find((d) => d.id === deviceMode) || DEVICE_MODES[2];

  // ── Canvas slide count ─────────────────────────────────────────
  const slideCount = canvaPages.length;

  // ── Mode label/badge colors ────────────────────────────────────
  const modeMeta: Record<PreviewMode, { label: string; color: string; icon: string }> = {
    canvas: { label: 'Canvas', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', icon: '🎨' },
    template: { label: 'Template', color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30', icon: '🧩' },
    legacy: { label: 'Legacy', color: 'text-purple-400 bg-purple-500/15 border-purple-500/30', icon: '📝' },
  };

  const currentModeMeta = modeMeta[previewMode];

  // ── Build time display ─────────────────────────────────────────
  const buildTimeStr = lastBuildTime > 0
    ? new Date(lastBuildTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '';

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* ══ TOOLBAR ══════════════════════════════════════════════ */}
      <div className="flex-shrink-0 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-3 py-2 flex items-center gap-2 flex-wrap">

        {/* ── Back button ────────────────────────────────────── */}
        <button
          onClick={() => setActivePanel('canva')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title="Kembali ke Canva (Esc)"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Kembali</span>
        </button>

        <div className="w-px h-5 bg-zinc-700/50" />

        {/* ── Mode selector dropdown ──────────────────────────── */}
        <div className="relative" ref={modeRef}>
          <button
            onClick={() => setModeOpen(!modeOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${currentModeMeta.color}`}
          >
            <span>{currentModeMeta.icon}</span>
            <span>{currentModeMeta.label}</span>
            <ChevronDown size={10} className={`transition-transform ${modeOpen ? 'rotate-180' : ''}`} />
          </button>
          {modeOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 rounded-xl bg-zinc-900 border border-zinc-700/50 shadow-xl z-50 overflow-hidden">
              {([
                { id: 'canvas' as PreviewMode, icon: '🎨', label: 'Canvas', desc: 'Dari halaman Canva', disabled: !hasCanvasContent },
                { id: 'template' as PreviewMode, icon: '🧩', label: 'Template', desc: 'Template system + tema', disabled: false },
                { id: 'legacy' as PreviewMode, icon: '📝', label: 'Legacy', desc: 'HTML lama (tanpa tema)', disabled: false },
              ]).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    if (!m.disabled) {
                      setPreviewMode(m.id);
                      setModeOpen(false);
                    }
                  }}
                  disabled={m.disabled}
                  className={`w-full px-3 py-2.5 flex items-center gap-2.5 transition-colors text-left ${
                    m.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : previewMode === m.id
                        ? 'bg-zinc-800/60'
                        : 'hover:bg-zinc-800/40'
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  <div>
                    <div className="text-[11px] text-zinc-200 font-semibold">{m.label}</div>
                    <div className="text-[9px] text-zinc-500">{m.desc}</div>
                  </div>
                  {previewMode === m.id && (
                    <span className="ml-auto text-emerald-400 text-[10px]">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Layout theme selector (Template mode only) ──────── */}
        {previewMode === 'template' && (
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setThemeOpen(!themeOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/60 transition-colors"
            >
              {LAYOUT_THEMES.find((t) => t.id === layoutTheme)?.icon}{' '}
              {LAYOUT_THEMES.find((t) => t.id === layoutTheme)?.label}
              <ChevronDown size={10} className={`transition-transform ${themeOpen ? 'rotate-180' : ''}`} />
            </button>
            {themeOpen && (
              <div className="absolute top-full left-0 mt-1 w-44 rounded-xl bg-zinc-900 border border-zinc-700/50 shadow-xl z-50 overflow-hidden">
                {LAYOUT_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setLayoutTheme(t.id);
                      cachedHashRef.current = ''; // force rebuild on theme change
                      setThemeOpen(false);
                    }}
                    className={`w-full px-3 py-2 flex items-center gap-2 transition-colors ${
                      layoutTheme === t.id
                        ? 'bg-zinc-800/60 text-zinc-100'
                        : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span className="text-[11px] font-semibold">{t.label}</span>
                    {layoutTheme === t.id && (
                      <span className="ml-auto text-emerald-400 text-[10px]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Divider ─────────────────────────────────────────── */}
        <div className="w-px h-5 bg-zinc-700/50" />

        {/* ── Device mode buttons ─────────────────────────────── */}
        <div className="flex items-center gap-0.5 bg-zinc-800 rounded-lg p-0.5">
          {DEVICE_MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setDeviceMode(mode.id)}
                className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  deviceMode === mode.id
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                }`}
                title={mode.label}
              >
                <Icon size={13} />
                {mode.width > 0 && (
                  <span className="text-[0.6rem] opacity-60">{mode.width}px</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Screen / Slide navigation ───────────────────────── */}
        {previewMode === 'canvas' ? (
          <div className="flex items-center gap-1">
            <select
              value={activeSlide}
              onChange={(e) => handleSlideSelect(Number(e.target.value))}
              className="bg-zinc-800 border border-zinc-700/50 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 cursor-pointer"
            >
              {Array.from({ length: slideCount }, (_, i) => (
                <option key={i} value={i}>
                  Slide {i + 1}: {canvaPages[i]?.label || 'Untitled'}
                </option>
              ))}
            </select>
            <span className="text-[0.65rem] text-zinc-600">
              {slideCount} halaman
            </span>
          </div>
        ) : (
          <select
            value={activeScreen}
            onChange={(e) => handleScreenSelect(e.target.value)}
            className="bg-zinc-800 border border-zinc-700/50 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 cursor-pointer"
          >
            {SCREEN_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        )}

        {/* ── Right side: Actions + Status ────────────────────── */}
        <div className="ml-auto flex items-center gap-2">
          {/* Open in new tab button */}
          <button
            onClick={handleOpenInNewTab}
            disabled={!htmlContent}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
              htmlContent
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
                : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
            }`}
            title="Buka di tab baru"
          >
            <ExternalLink size={11} />
            <span className="hidden md:inline">Tab Baru</span>
          </button>

          {/* Rebuild button */}
          <button
            onClick={handleForceRebuild}
            disabled={building}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
              building
                ? 'bg-amber-500/10 text-amber-400 cursor-wait'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
            }`}
            title="Force rebuild preview"
          >
            <RefreshCw size={11} className={building ? 'animate-spin' : ''} />
            Rebuild
          </button>

          {/* Building indicator */}
          {building && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400">
              <Loader2 size={11} className="animate-spin" />
              <span className="text-[10px] font-semibold">Building...</span>
            </div>
          )}

          {/* Sync status badge */}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                dirty ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
            />
            <span className="text-[0.6rem] text-zinc-500">
              {dirty ? 'Ada perubahan' : 'Up to date'}
            </span>
          </div>

          {/* Last build time */}
          {buildTimeStr && (
            <span className="text-[0.6rem] text-zinc-600 hidden lg:inline">
              {buildTimeStr}
            </span>
          )}

          <span className="text-[0.6rem] text-zinc-600 hidden xl:inline">
            Auto-refresh 500ms
          </span>
        </div>
      </div>

      {/* ══ PREVIEW AREA ═════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        {/* Banner */}
        <div className="flex-shrink-0 w-full bg-gradient-to-r from-emerald-600/90 to-cyan-600/90 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-2 z-10">
          <span className="flex items-center gap-1.5">
            <span className="bg-white/20 rounded px-1.5 py-0.5 text-[0.6rem]">
              <Eye size={10} className="inline -mt-0.5" />
            </span>
            <span>LIVE PREVIEW</span>
          </span>
          <span className="text-[0.6rem] opacity-75 font-normal">
            — Tampilan persis seperti yang dilihat siswa
          </span>
          <span className="ml-auto flex items-center gap-2">
            <span className="bg-white/20 rounded px-2 py-0.5 text-[0.6rem]">
              {currentModeMeta.icon} {currentModeMeta.label}
              {previewMode === 'template' && layoutTheme !== 'default' && ` · ${LAYOUT_THEMES.find((t) => t.id === layoutTheme)?.icon} ${layoutTheme}`}
            </span>
            {deviceMode !== 'desktop' && (
              <span className="bg-white/20 rounded px-2 py-0.5 text-[0.6rem]">
                {currentDevice.icon && <currentDevice.icon size={10} className="inline -mt-0.5" />} {currentDevice.width}px
              </span>
            )}
          </span>
        </div>

        {/* Device frame */}
        <div className="flex-1 flex items-start justify-center overflow-auto p-4">
          <div
            className={`transition-all duration-300 overflow-hidden relative ${
              currentDevice.width > 0
                ? 'rounded-[2rem] border-[3px] border-zinc-700/50 shadow-2xl shadow-black/30'
                : 'rounded-xl border border-zinc-800/50'
            }`}
            style={{
              width: currentDevice.width > 0 ? `${currentDevice.width}px` : '100%',
              maxWidth: currentDevice.width > 0 ? `${currentDevice.width}px` : '100%',
              height: currentDevice.width > 0
                ? `min(720px, calc(100vh - 140px))`
                : 'calc(100vh - 140px)',
            }}
          >
            {/* Mobile notch indicator */}
            {currentDevice.width > 0 && currentDevice.id === 'mobile' && (
              <div className="flex justify-center py-1 bg-zinc-900">
                <div className="w-20 h-4 bg-zinc-800 rounded-b-xl" />
              </div>
            )}

            {/* Tablet camera indicator */}
            {currentDevice.width > 0 && currentDevice.id === 'tablet' && (
              <div className="flex justify-center py-0.5 bg-zinc-900">
                <div className="w-3 h-3 bg-zinc-800 rounded-full border border-zinc-700/50" />
              </div>
            )}

            {htmlContent ? (
              <iframe
                ref={iframeRef}
                srcDoc={srcdoc}
                className="w-full h-full border-0"
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <div className="text-center">
                  <div className="text-3xl mb-3 animate-pulse">⏳</div>
                  <div className="text-zinc-400 text-sm">Membuat preview...</div>
                  <div className="text-zinc-600 text-xs mt-1">
                    {currentModeMeta.icon} {currentModeMeta.label} mode
                  </div>
                </div>
              </div>
            )}

            {/* Watermark for device frame */}
            {currentDevice.width > 0 && (
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="text-[0.55rem] text-zinc-600 bg-zinc-900/80 px-2 py-0.5 rounded-full">
                  {currentDevice.label} · {currentDevice.width}px
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
