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
  Download,
  Home,
  FileText,
  BookOpen,
  Palette,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Settings2,
} from 'lucide-react';
import type { PreviewMode, DeviceMode, LayoutTheme } from './types';
import { DEVICE_MODES, LAYOUT_THEMES, SCREEN_OPTIONS, MODE_META } from './constants';
import { usePreviewBuilder } from './use-preview-builder';
import { usePreviewNavigation } from './use-preview-navigation';
import dynamic from 'next/dynamic';
import { getAvailablePresets } from '@/core';
import { COLORS } from '@/lib/color-palette';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';

// Lazy-loaded: SchemaPlayer is only used in live preview (schema mode)
const SchemaPlayer = dynamic(() => import('./SchemaPlayer'), { ssr: false });

export default function LivePreview() {
  // ── Local state ────────────────────────────────────────────
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [previewMode, setPreviewModeLocal] = useState<PreviewMode>('unified');
  const [layoutTheme, setLayoutTheme] = useState<LayoutTheme>('default');
  const [modeOpen, setModeOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
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
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);

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

  // ── Auto-detect best mode (8.4) ──────────────────────────────
  const hasCanvasContent = canvaPages.some(
    (p) => p.elements && p.elements.length > 0
  );

  const detectedMode = useMemo<PreviewMode>(() => {
    // If a schema preset is active, prefer schema mode
    if (activePreset) return 'schema';
    if (hasCanvasContent) return 'unified';
    return 'unified'; // Default to unified — always works
  }, [hasCanvasContent, activePreset]);

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
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) {
        setModeOpen(false);
        setAdvancedOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Keyboard shortcuts (8.4) ────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePanel('canva');
        return;
      }
      // Arrow keys for page navigation in preview
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePrevPage();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateNextPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActivePanel, previewMode, activeSlide, canvaPages]);

  // ── Page navigation helpers ────────────────────────────────
  const navigatePrevPage = useCallback(() => {
    if (previewMode === 'canvas') {
      if (activeSlide > 0) handleSlideSelect(activeSlide - 1);
    } else {
      // For schema/unified — navigate iframe or screens
      const currentIdx = SCREEN_OPTIONS.findIndex(s => s.id === activeScreen);
      if (currentIdx > 0) handleScreenSelect(SCREEN_OPTIONS[currentIdx - 1].id);
    }
  }, [previewMode, activeSlide, activeScreen, handleSlideSelect, handleScreenSelect]);

  const navigateNextPage = useCallback(() => {
    if (previewMode === 'canvas') {
      if (activeSlide < canvaPages.length - 1) handleSlideSelect(activeSlide + 1);
    } else {
      const currentIdx = SCREEN_OPTIONS.findIndex(s => s.id === activeScreen);
      if (currentIdx < SCREEN_OPTIONS.length - 1) handleScreenSelect(SCREEN_OPTIONS[currentIdx + 1].id);
    }
  }, [previewMode, activeSlide, activeScreen, canvaPages.length, handleSlideSelect, handleScreenSelect]);

  // ── Determine if we should show the mode selector at all ──
  // If no schema preset, and user hasn't manually selected, just show "Preview"
  const showModeSelector = activePreset || userModeRef.current;

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
    <div className="h-full flex flex-col bg-app-surface">
      {/* ══ TOOLBAR ══════════════════════════════════════════════ */}
      <div className="flex-shrink-0 bg-app-surface/95 backdrop-blur-md border-b border-app-border px-3 py-2 flex items-center gap-2 flex-wrap">

        {/* ── Kembali ke Editor button (8.4 — prominent) ──────── */}
        <button
          onClick={() => setActivePanel('canva')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
          title="Kembali ke Editor (Esc)"
        >
          <Palette size={14} />
          <span>Kembali ke Editor</span>
        </button>

        <div className="w-px h-5 bg-app-elevated/50" />

        {/* ── Quick navigation ─────────────────────────────────── */}
        <button
          onClick={() => setActivePanel('dashboard')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-app-secondary hover:text-app-primary hover:bg-app-elevated transition-colors"
          title="Dashboard"
        >
          <Home size={13} />
        </button>
        <button
          onClick={() => setActivePanel('dokumen')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-app-secondary hover:text-app-primary hover:bg-app-elevated transition-colors"
          title="Edit Dokumen (CP/TP/ATP)"
        >
          <FileText size={13} />
        </button>
        <button
          onClick={() => setActivePanel('konten')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-app-secondary hover:text-app-primary hover:bg-app-elevated transition-colors"
          title="Edit Konten (Kuis/Game/Materi)"
        >
          <BookOpen size={13} />
        </button>

        <div className="w-px h-5 bg-app-elevated/50" />

        {/* ── Simplified Mode Selector (8.4) ─────────────────────── */}
        <div className="relative" ref={modeRef}>
          <button
            onClick={() => setModeOpen(!modeOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${currentModeMeta.color}`}
          >
            <span>{currentModeMeta.icon}</span>
            <span>{currentModeMeta.simplifiedLabel}</span>
            <ChevronDown size={10} className={`transition-transform ${modeOpen ? 'rotate-180' : ''}`} />
          </button>
          {modeOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 rounded-xl bg-app-surface border border-app-border/50 shadow-xl z-50 overflow-hidden">
              {/* Primary modes */}
              {([
                { id: 'unified' as PreviewMode, icon: '🚀', label: 'Preview', desc: 'Tampilan lengkap untuk siswa', disabled: false },
                { id: 'schema' as PreviewMode, icon: '⚡', label: 'Dengan Skema', desc: 'Schema-driven (preset aktif)', disabled: !activePreset },
              ]).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    if (!m.disabled) {
                      setPreviewMode(m.id);
                      setModeOpen(false);
                      setAdvancedOpen(false);
                    }
                  }}
                  disabled={m.disabled}
                  className={`w-full px-3 py-2.5 flex items-center gap-2.5 transition-colors text-left ${
                    m.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : previewMode === m.id
                        ? 'bg-app-elevated/60'
                        : 'hover:bg-app-elevated/40'
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  <div>
                    <div className="text-[11px] text-app-primary font-semibold">{m.label}</div>
                    <div className="text-[9px] text-app-muted">{m.desc}</div>
                  </div>
                  {previewMode === m.id && (
                    <span className="ml-auto text-emerald-400 text-[10px]">✓</span>
                  )}
                </button>
              ))}

              {/* Advanced modes submenu */}
              <div className="border-t border-app-border/30">
                <button
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-app-elevated/30 transition-colors"
                >
                  <Settings2 size={12} className="text-app-muted" />
                  <span className="text-[10px] text-app-muted font-medium">Advanced</span>
                  <ChevronRight size={10} className={`text-app-muted ml-auto transition-transform ${advancedOpen ? 'rotate-90' : ''}`} />
                </button>
                {advancedOpen && (
                  <div className="pb-1">
                    {([
                      { id: 'canvas' as PreviewMode, icon: '🎨', label: 'Canvas', desc: 'Slideshow dari halaman Canva', disabled: !hasCanvasContent },
                      { id: 'template' as PreviewMode, icon: '🧩', label: 'Template', desc: 'Template system + tema', disabled: false },
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
                        className={`w-full px-3 py-2 pl-8 flex items-center gap-2.5 transition-colors text-left ${
                          m.disabled
                            ? 'opacity-40 cursor-not-allowed'
                            : previewMode === m.id
                              ? 'bg-app-elevated/60'
                              : 'hover:bg-app-elevated/40'
                        }`}
                      >
                        <span className="text-sm">{m.icon}</span>
                        <div>
                          <div className="text-[10px] text-app-primary font-semibold">{m.label}</div>
                          <div className="text-[8px] text-app-muted">{m.desc}</div>
                        </div>
                        {previewMode === m.id && (
                          <span className="ml-auto text-emerald-400 text-[9px]">✓</span>
                        )}
                      </button>
                    ))}
                    {/* Legacy mode — deeply hidden, marked as deprecated */}
                    {/* @deprecated Legacy mode — old HTML without theme support */}
                    <button
                      onClick={() => {
                        setPreviewMode('legacy');
                        setModeOpen(false);
                      }}
                      className={`w-full px-3 py-2 pl-8 flex items-center gap-2.5 transition-colors text-left opacity-50 hover:opacity-80 ${
                        previewMode === 'legacy' ? 'bg-app-elevated/60' : 'hover:bg-app-elevated/40'
                      }`}
                    >
                      <span className="text-sm">📝</span>
                      <div>
                        <div className="text-[10px] text-app-muted font-semibold">Legacy <span className="text-[8px] text-red-400/60">(deprecated)</span></div>
                        <div className="text-[8px] text-app-muted">HTML lama tanpa tema</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Layout theme selector (Template mode only) ──────── */}
        {previewMode === 'template' && (
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setThemeOpen(!themeOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-app-elevated border border-app-border/50 text-app-secondary hover:bg-app-elevated/60 transition-colors"
            >
              {LAYOUT_THEMES.find((t) => t.id === layoutTheme)?.icon}{' '}
              {LAYOUT_THEMES.find((t) => t.id === layoutTheme)?.label}
              <ChevronDown size={10} className={`transition-transform ${themeOpen ? 'rotate-180' : ''}`} />
            </button>
            {themeOpen && (
              <div className="absolute top-full left-0 mt-1 w-44 rounded-xl bg-app-surface border border-app-border/50 shadow-xl z-50 overflow-hidden">
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
                        ? 'bg-app-elevated/60 text-app-primary'
                        : 'text-app-secondary hover:bg-app-elevated/40 hover:text-app-primary'
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
        <div className="w-px h-5 bg-app-elevated/50" />

        {/* ── Device mode buttons ─────────────────────────────── */}
        <div className="flex items-center gap-0.5 bg-app-elevated rounded-lg p-0.5">
          {DEVICE_MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setDeviceMode(mode.id)}
                className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  deviceMode === mode.id
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-app-secondary hover:text-app-primary hover:bg-app-elevated'
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
              className="bg-app-elevated border border-app-border/50 text-app-primary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 cursor-pointer"
            >
              {Array.from({ length: slideCount }, (_, i) => (
                <option key={i} value={i}>
                  Slide {i + 1}: {canvaPages[i]?.label || 'Untitled'}
                </option>
              ))}
            </select>
            <span className="text-[0.65rem] text-app-muted">
              {slideCount} halaman
            </span>
          </div>
        ) : (
          <select
            value={activeScreen}
            onChange={(e) => handleScreenSelect(e.target.value)}
            className="bg-app-elevated border border-app-border/50 text-app-primary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 cursor-pointer"
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
                : 'bg-app-elevated/50 text-app-muted cursor-not-allowed border border-transparent'
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
                ? 'bg-app-elevated text-app-secondary hover:bg-app-elevated hover:text-app-primary'
                : 'bg-app-elevated/50 text-app-muted cursor-not-allowed'
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
                ? 'bg-app-accent/10 text-app-accent cursor-wait'
                : 'bg-app-elevated text-app-secondary hover:bg-app-elevated hover:text-app-primary'
            }`}
            title="Force rebuild preview"
          >
            <RefreshCw size={11} className={building ? 'animate-spin' : ''} />
            Rebuild
          </button>

          {/* Building indicator */}
          {building && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-app-accent/10 text-app-accent">
              <Loader2 size={11} className="animate-spin" />
              <span className="text-[10px] font-semibold">Building...</span>
            </div>
          )}

          {/* Sync status badge */}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                dirty ? 'bg-app-accent' : 'bg-emerald-500'
              }`}
            />
            <span className="text-[0.6rem] text-app-muted">
              {dirty ? 'Ada perubahan' : 'Up to date'}
            </span>
          </div>

          {/* Last build time */}
          {buildTimeStr && (
            <span className="text-[0.6rem] text-app-muted hidden lg:inline">
              {buildTimeStr}
            </span>
          )}
        </div>
      </div>

      {/* ══ PREVIEW AREA ═════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden bg-app-surface">
        {/* Banner */}
        <div className="flex-shrink-0 w-full bg-gradient-to-r from-emerald-600/90 to-cyan-600/90 text-app-primary text-xs font-bold px-4 py-1.5 flex items-center gap-2 z-10">
          <span className="flex items-center gap-1.5">
            <span className="bg-app-elevated/20 rounded px-1.5 py-0.5 text-[0.6rem]">
              <Eye size={10} className="inline -mt-0.5" />
            </span>
            <span>LIVE PREVIEW</span>
          </span>
          <span className="text-[0.6rem] opacity-75 font-normal">
            — Tampilan persis seperti yang dilihat siswa
          </span>
          <span className="ml-auto flex items-center gap-2">
            <span className="bg-app-elevated/20 rounded px-2 py-0.5 text-[0.6rem]">
              {currentModeMeta.icon} {currentModeMeta.simplifiedLabel}
              {previewMode === 'template' && layoutTheme !== 'default' && ` · ${LAYOUT_THEMES.find((t) => t.id === layoutTheme)?.icon} ${layoutTheme}`}
            </span>
            {deviceMode !== 'desktop' && (
              <span className="bg-app-elevated/20 rounded px-2 py-0.5 text-[0.6rem]">
                {currentDevice.icon && <currentDevice.icon size={10} className="inline -mt-0.5" />} {currentDevice.width}px
              </span>
            )}
            <span className="bg-app-elevated/20 rounded px-2 py-0.5 text-[0.6rem]">
              ← → navigasi halaman
            </span>
          </span>
        </div>

        {/* Device frame */}
        <div className="flex-1 flex items-start justify-center overflow-auto p-4">
          <div
            className={`transition-all duration-300 overflow-hidden relative ${
              currentDevice.width > 0
                ? 'rounded-[2rem] border-[3px] border-app-border/50 shadow-2xl shadow-black/30'
                : 'rounded-xl border border-app-border/50'
            }`}
            style={{
              width: currentDevice.width > 0 ? `${currentDevice.width}px` : '100%',
              maxWidth: currentDevice.width > 0 ? `${currentDevice.width}px` : '100%',
              height: currentDevice.width > 0
                ? `min(720px, calc(100vh - 200px))`
                : 'calc(100vh - 200px)',
            }}
          >
            {/* Mobile notch indicator */}
            {currentDevice.width > 0 && currentDevice.id === 'mobile' && (
              <div className="flex justify-center py-1 bg-app-surface">
                <div className="w-20 h-4 bg-app-elevated rounded-b-xl" />
              </div>
            )}

            {/* Tablet camera indicator */}
            {currentDevice.width > 0 && currentDevice.id === 'tablet' && (
              <div className="flex justify-center py-0.5 bg-app-surface">
                <div className="w-3 h-3 bg-app-elevated rounded-full border border-app-border/50" />
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
              <div className="w-full h-full flex items-center justify-center bg-app-surface">
                <div className="text-center">
                  <div className="text-3xl mb-3 animate-pulse">⏳</div>
                  <div className="text-app-secondary text-sm">Membuat preview...</div>
                  <div className="text-app-muted text-xs mt-1">
                    {currentModeMeta.icon} {currentModeMeta.simplifiedLabel}
                  </div>
                </div>
              </div>
            )}

            {/* Watermark for device frame */}
            {currentDevice.width > 0 && (
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="text-[0.55rem] text-app-muted bg-app-surface/80 px-2 py-0.5 rounded-full">
                  {currentDevice.label} · {currentDevice.width}px
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ══ Page Thumbnails Navigation Bar (8.4) ══════════════════ */}
        {previewMode === 'canvas' && slideCount > 1 && (
          <div className="flex-shrink-0 border-t border-app-border bg-app-surface/90 backdrop-blur-md px-3 py-2">
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
              {/* Prev button */}
              <button
                onClick={navigatePrevPage}
                disabled={activeSlide <= 0}
                className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                  activeSlide > 0
                    ? 'text-app-secondary hover:text-app-primary hover:bg-app-elevated'
                    : 'text-app-muted/30 cursor-not-allowed'
                }`}
                title="Halaman sebelumnya (←)"
              >
                <ArrowLeft size={14} />
              </button>

              {/* Thumbnail strip */}
              {canvaPages.map((p, i) => {
                const isActive = i === activeSlide;
                const badge = TEMPLATE_BADGE_MAP[p.templateType || 'custom'] || TEMPLATE_BADGE_MAP.custom;
                const bgStyle = p.bgDataUrl
                  ? { backgroundImage: `url('${p.bgDataUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : p.bgColor?.includes('gradient')
                    ? { background: p.bgColor }
                    : { background: p.bgColor || COLORS.bgDark };

                return (
                  <button
                    key={p.id}
                    onClick={() => handleSlideSelect(i)}
                    className={`flex-shrink-0 relative rounded-lg overflow-hidden transition-all ${
                      isActive
                        ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-app-surface scale-105'
                        : 'opacity-60 hover:opacity-90 hover:ring-1 hover:ring-app-border'
                    }`}
                    style={{ width: '64px', height: '40px', ...bgStyle }}
                    title={`Slide ${i + 1}: ${p.label}`}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[6px] text-white text-center truncate px-1 py-0.5">
                      {i + 1}
                    </div>
                    {isActive && (
                      <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}

              {/* Next button */}
              <button
                onClick={navigateNextPage}
                disabled={activeSlide >= slideCount - 1}
                className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                  activeSlide < slideCount - 1
                    ? 'text-app-secondary hover:text-app-primary hover:bg-app-elevated'
                    : 'text-app-muted/30 cursor-not-allowed'
                }`}
                title="Halaman berikutnya (→)"
              >
                <ArrowRight size={14} />
              </button>

              {/* Page counter */}
              <span className="flex-shrink-0 text-[0.65rem] text-app-muted ml-1">
                {activeSlide + 1} / {slideCount}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
