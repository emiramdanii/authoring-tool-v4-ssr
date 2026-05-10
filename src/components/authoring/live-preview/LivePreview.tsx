'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import {
  RefreshCw,
  Loader2,
  ChevronDown,
  Eye,
  ExternalLink,
  ArrowLeft,
  Download,
  Home,
  FileText,
  BookOpen,
  Palette,
} from 'lucide-react';
import type { PreviewMode, DeviceMode, LayoutTheme } from './types';
import { DEVICE_MODES, LAYOUT_THEMES, SCREEN_OPTIONS, MODE_META } from './constants';
import { usePreviewBuilder } from './use-preview-builder';
import { usePreviewNavigation } from './use-preview-navigation';
import SchemaPlayer from './SchemaPlayer';
import { getAvailablePresets } from '@/core';

export default function LivePreview() {
  // ── Local state ────────────────────────────────────────────
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [previewMode, setPreviewModeLocal] = useState<PreviewMode>('template');
  const [layoutTheme, setLayoutTheme] = useState<LayoutTheme>('default');
  const [modeOpen, setModeOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const cachedHashRef = useRef<string>('');
  const modeRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const userModeRef = useRef(false); // Track if user manually selected a mode
  const initialDetectDone = useRef(false);

  // ── Store subscriptions ────────────────────────────────────
  const setActivePanel = useAuthoringStore((s) => s.setActivePanel);
  const dirty = useAuthoringStore((s) => s.dirty);
  const activePreset = useAuthoringStore((s) => s.activePreset);

  // ── Canva store subscriptions ──────────────────────────────
  const canvaPages = useCanvaStore((s) => s.pages);

  // ── Navigation hook ────────────────────────────────────────
  const {
    activeScreen,
    activeSlide,
    iframeRef,
    handleScreenSelect,
    handleSlideSelect,
    handleOpenInNewTab,
  } = usePreviewNavigation();

  // ── Builder hook ───────────────────────────────────────────
  const {
    htmlContent,
    building,
    srcdoc,
    handleForceRebuild,
    lastBuildTime,
  } = usePreviewBuilder(previewMode, layoutTheme, activeScreen, activeSlide);

  // ── Auto-detect mode (only on first load, not overriding user) ─
  const hasCanvasContent = canvaPages.some(
    (p) => p.elements && p.elements.length > 0
  ) || canvaPages.some(
    (p) => p.overlayElements && p.overlayElements.length > 0
  );

  const detectedMode = useMemo<PreviewMode>(() => {
    if (hasCanvasContent) return 'unified'; // Default to unified when canvas has content
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

  // ── Close dropdowns on outside click ───────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) setModeOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Keyboard shortcut: Escape to go back ──────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePanel('canva');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActivePanel]);

  // ── Device info ────────────────────────────────────────────
  const currentDevice = DEVICE_MODES.find((d) => d.id === deviceMode) || DEVICE_MODES[2];

  // ── Canvas slide count ─────────────────────────────────────
  const slideCount = canvaPages.length;

  // ── Mode label/badge colors ────────────────────────────────
  const currentModeMeta = MODE_META[previewMode];

  // ── Build time display ─────────────────────────────────────
  const buildTimeStr = lastBuildTime > 0
    ? new Date(lastBuildTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '';

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* ══ TOOLBAR ══════════════════════════════════════════════ */}
      <div className="flex-shrink-0 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-3 py-2 flex items-center gap-2 flex-wrap">

        {/* ── Back button (default to Canva) ──────────────────── */}
        <button
          onClick={() => setActivePanel('canva')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
          title="Kembali ke Canva (Esc)"
        >
          <Palette size={14} />
          <span className="hidden sm:inline">Canva</span>
        </button>

        <div className="w-px h-5 bg-zinc-700/50" />

        {/* ── Quick navigation ─────────────────────────────────── */}
        <button
          onClick={() => setActivePanel('dashboard')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title="Dashboard"
        >
          <Home size={13} />
        </button>
        <button
          onClick={() => setActivePanel('dokumen')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title="Edit Dokumen (CP/TP/ATP)"
        >
          <FileText size={13} />
        </button>
        <button
          onClick={() => setActivePanel('konten')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title="Edit Konten (Kuis/Game/Materi)"
        >
          <BookOpen size={13} />
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
                { id: 'unified' as PreviewMode, icon: '🚀', label: 'Unified', desc: 'Navigasi pintar + game + layout', disabled: false },
                { id: 'schema' as PreviewMode, icon: '⚡', label: 'Schema', desc: 'Schema-driven JSON → React (baru!)', disabled: !activePreset },
                { id: 'canvas' as PreviewMode, icon: '🎨', label: 'Canvas', desc: 'Slideshow dari halaman Canva', disabled: !hasCanvasContent },
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
          {/* Export HTML button (primary action) */}
          <button
            onClick={() => {
              if (!htmlContent) return;
              const blob = new Blob([htmlContent], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              const judul = useAuthoringStore.getState().meta.judulPertemuan || 'media-pembelajaran';
              a.download = `${judul.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase()}.html`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
            disabled={!htmlContent}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
              htmlContent
                ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed border border-transparent'
            }`}
            title="Export HTML — download file siap pakai"
          >
            <Download size={11} />
            <span className="hidden md:inline">Export HTML</span>
          </button>

          {/* Open in new tab button */}
          <button
            onClick={() => handleOpenInNewTab(htmlContent)}
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
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
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

            {previewMode === 'schema' && activePreset ? (
              <SchemaPlayer
                presetId={activePreset}
                mode="preview"
                showControls={true}
                showThemeSwitcher={true}
                className="w-full h-full"
              />
            ) : htmlContent ? (
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
