'use client';

// ═══════════════════════════════════════════════════════════════════
// SCHEMA PLAYER — Interactive player for LessonSchema
// ═══════════════════════════════════════════════════════════════════
// Renders a full LessonSchema with navigation, theme switching,
// and interactive widgets. This is the "schema-driven" preview mode
// that replaces raw HTML rendering with structured JSON → React UI.
//
// Usage:
//   <SchemaPlayer presetId="hakikat-norma" />
//   <SchemaPlayer schema={myCustomSchema} />
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';

// ── Transition Configurations ───────────────────────────────────

type TransitionType = 'slide' | 'fade' | 'zoom' | 'flip';

const TRANSITION_CONFIGS: Record<
  TransitionType,
  {
    initial: Record<string, number>;
    animate: Record<string, number>;
    exit: Record<string, number>;
    duration: number;
  }
> = {
  slide: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
    duration: 0.25,
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    duration: 0.25,
  },
  zoom: {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.08 },
    duration: 0.3,
  },
  flip: {
    initial: { opacity: 0, rotateY: 90 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: -90 },
    duration: 0.35,
  },
};

const TRANSITION_LABELS: Record<TransitionType, { icon: string; label: string }> = {
  slide: { icon: '↔️', label: 'Slide' },
  fade: { icon: '🌫️', label: 'Fade' },
  zoom: { icon: '🔍', label: 'Zoom' },
  flip: { icon: '🔄', label: 'Flip' },
};
import {
  SchemaEngine,
  loadPreset,
  getAvailablePresets,
  THEME_PRESETS,
  resolveTokens,
  type LessonSchema,
  type DesignTokens,
} from '@/core';
import { alpha, COLORS } from '@/lib/color-palette';
import { useInteractiveStore } from '@/store/interactive-store';

// ── Props ──────────────────────────────────────────────────────

export interface SchemaPlayerProps {
  /** Load by preset ID (e.g., 'hakikat-norma') */
  presetId?: string;
  /** Or pass a schema directly */
  schema?: LessonSchema;
  /** Render mode — preview is interactive, canvas is compact */
  mode?: 'preview' | 'canvas';
  /** Initial screen index */
  initialScreen?: number;
  /** Show navigation controls */
  showControls?: boolean;
  /** Show theme switcher */
  showThemeSwitcher?: boolean;
  /** Class name for outer container */
  className?: string;
}

// ── Component ──────────────────────────────────────────────────

export default function SchemaPlayer({
  presetId,
  schema: schemaProp,
  mode = 'preview',
  initialScreen = 0,
  showControls = true,
  showThemeSwitcher = true,
  className,
}: SchemaPlayerProps) {
  const [schema, setSchema] = useState<LessonSchema | null>(schemaProp || null);
  const [loading, setLoading] = useState(!schemaProp && !!presetId);
  const [error, setError] = useState<string | null>(null);
  const [screenIdx, setScreenIdx] = useState(initialScreen);
  const [themeId, setThemeId] = useState<string>('default');
  const [interactive, setInteractive] = useState(true);
  const [transitionType, setTransitionType] = useState<TransitionType>('slide');

  // ── Canvas store (ratio) ──────────────────────────────────
  const ratioId = useCanvaStore(s => s.ratioId);

  // ── Interactive store (replay) ────────────────────────────
  const replayAll = useInteractiveStore((s) => s.replayAll);
  const replayGeneration = useInteractiveStore((s) => s.replayGeneration);

  // Reset local screen index when replayGeneration changes
  useEffect(() => {
    if (replayGeneration > 0) {
      setScreenIdx(0);
    }
  }, [replayGeneration]);

  const handleReplay = useCallback(() => {
    replayAll();
    setScreenIdx(0);
  }, [replayAll]);

  // ── Load preset on mount / ID change ───────────────────────
  useEffect(() => {
    if (schemaProp) {
      setSchema(schemaProp);
      setThemeId(schemaProp.themeId || 'default');
      setScreenIdx(0);
      return;
    }
    if (!presetId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadPreset(presetId)
      .then((s) => {
        if (cancelled) return;
        if (!s) {
          setError(`Preset "${presetId}" tidak ditemukan`);
        } else {
          setSchema(s);
          setThemeId(s.themeId || 'default');
          setScreenIdx(0);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [presetId, schemaProp]);

  // ── Navigation ──────────────────────────────────────────────
  const totalScreens = schema?.screens.length || 0;
  const currentScreen = schema?.screens[screenIdx];
  const canPrev = screenIdx > 0;
  const canNext = screenIdx < totalScreens - 1;

  const goNext = useCallback(() => {
    setScreenIdx((i) => Math.min(i + 1, totalScreens - 1));
  }, [totalScreens]);

  const goPrev = useCallback(() => {
    setScreenIdx((i) => Math.max(i - 1, 0));
  }, []);

  const goTo = useCallback((idx: number) => {
    setScreenIdx(Math.max(0, Math.min(idx, totalScreens - 1)));
  }, [totalScreens]);

  // Keyboard navigation
  useEffect(() => {
    if (!showControls || mode === 'canvas') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showControls, mode, goNext, goPrev]);

  // ── Tokens ──────────────────────────────────────────────────
  const tokens = useMemo(() => resolveTokens(themeId), [themeId]);

  // ── Loading / Error states ──────────────────────────────────
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className || ''}`} style={{ background: COLORS.bgPlayer }}>
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">⏳</div>
          <div className="text-app-primary/50 text-sm">Memuat schema...</div>
          <div className="text-app-primary/30 text-xs mt-1">Preset: {presetId}</div>
        </div>
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className={`flex items-center justify-center ${className || ''}`} style={{ background: COLORS.bgPlayer }}>
        <div className="text-center p-6">
          <div className="text-3xl mb-3">⚠️</div>
          <div className="text-red-400 text-sm">{error || 'Schema tidak tersedia'}</div>
          <div className="text-app-primary/30 text-xs mt-2">
            Preset tersedia: {getAvailablePresets().join(', ') || 'tidak ada'}
          </div>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────
  const isCompact = mode === 'canvas';

  // Cover/hero pages don't show bottom nav — they fill the entire scene.
  // This matches PageFrame behavior where isCoverPage hides navbars.
  const isCoverScreen = currentScreen?.blocks.length === 1 &&
    (currentScreen.blocks[0].type === 'cover' || currentScreen.blocks[0].type === 'hero');
  const showBottomNav = showControls && !isCoverScreen;

  return (
    <div className={`relative overflow-hidden ${className || ''}`}
      style={{ fontFamily: tokens.typography.fontFamily.body, background: COLORS.bgPlayer }}>

      {/* ══ SCREEN CONTENT ══════════════════════════════════════ */}
      {/* Content area offset for bottom nav — use CSS variable approach
          so the nav height auto-adjusts via ResizeObserver.
          Fallback values match PageFrame defaults. */}
      <div
        className="absolute inset-0"
        style={{
          bottom: showBottomNav ? (isCompact ? '6.67%' : '10%') : 0,
          perspective: transitionType === 'flip' ? 1200 : undefined,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={screenIdx}
            className="absolute inset-0"
            initial={TRANSITION_CONFIGS[transitionType].initial}
            animate={TRANSITION_CONFIGS[transitionType].animate}
            exit={TRANSITION_CONFIGS[transitionType].exit}
            transition={{ duration: TRANSITION_CONFIGS[transitionType].duration, ease: 'easeInOut' }}
          >
            <SchemaEngine
              schema={schema}
              screenIndex={screenIdx}
              mode={mode === 'canvas' ? 'canvas' : 'preview'}
              themeOverride={themeId}
              interactive={interactive}
              ratioId={ratioId}
              showTopNav={false}
              showBottomNav={showBottomNav}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ══ BOTTOM NAVIGATION BAR ══════════════════════════════ */}
      {showBottomNav && (
        <div className="absolute bottom-0 left-0 right-0 z-50 border-t border-app-border/10"
          style={{
            background: 'rgba(15,23,42,0.92)',
            backdropFilter: 'blur(12px)',
          }}>
          {/* Progress bar */}
          <div className="bg-app-elevated/5" style={{ height: isCompact ? 2 : 4 }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${totalScreens > 0 ? ((screenIdx + 1) / totalScreens) * 100 : 0}%`,
                background: `linear-gradient(90deg, ${tokens.colors.g}, ${tokens.colors.c})`,
              }} />
          </div>

          {/* Navigation row */}
          <div className={`flex items-center justify-between gap-1 ${
            isCompact ? 'px-2 py-1.5' : 'px-3 py-2'
          }`}>
            {/* Prev button */}
            <button
              onClick={goPrev}
              disabled={!canPrev}
              className={`font-bold rounded-lg transition-all ${
                isCompact ? 'text-[7px] px-1.5 py-0.5' : 'text-xs px-3 py-1.5'
              } ${
                canPrev
                  ? 'hover:bg-app-elevated/10 text-app-primary/60 cursor-pointer'
                  : 'opacity-30 cursor-not-allowed text-app-primary/20'
              }`}>
              ← Prev
            </button>

            {/* Screen dots / selector */}
            <div className={`flex items-center gap-0.5 overflow-hidden ${
              isCompact ? 'max-w-[50%]' : 'max-w-[50vw]'
            }`}>
              {schema.screens.map((s, i) => {
                const isActive = i === screenIdx;
                const label = s.sectionLabel || s.id;
                const templateIcon: Record<string, string> = {
                  cover: '🎬', petunjuk: '📋', tp: '🎯', dokumen: '📄',
                  skenario: '🎭', materi: '📖', diskusi: '💬', kuis: '❓',
                  game: '🎮', hasil: '🏆', refleksi: '📝', penutup: '👋',
                  hero: '🦸',
                };
                const icon = templateIcon[s.templateType] || '📄';

                return (
                  <button
                    key={s.id}
                    onClick={() => goTo(i)}
                    title={`${label} (${i + 1}/${totalScreens})`}
                    className={`relative flex-shrink-0 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
                      isActive
                        ? isCompact
                          ? 'w-6 h-6 text-[10px] bg-app-elevated/40 ring-2 ring-emerald-400/60'
                          : 'w-8 h-8 text-base bg-app-elevated/40 ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-500/20'
                        : isCompact
                          ? 'w-4 h-4 text-[7px] hover:bg-app-elevated/40'
                          : 'w-6 h-6 text-xs hover:bg-app-elevated/40'
                    }`}>
                    <span>{icon}</span>
                  </button>
                );
              })}
            </div>

            {/* Replay button (always available) */}
            <button
              onClick={handleReplay}
              title="Mulai Ulang"
              className={`flex items-center justify-center rounded-lg transition-all hover:bg-app-elevated/20 cursor-pointer ${
                isCompact ? 'w-5 h-5' : 'w-7 h-7'
              }`}
            >
              <RotateCcw
                className={`text-app-primary/50 hover:text-app-primary ${
                  isCompact ? 'w-3 h-3' : 'w-4 h-4'
                }`}
              />
            </button>

            {/* Next button / Replay when finished */}
            {canNext ? (
              <button
                onClick={goNext}
                className={`font-extrabold rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer text-app-primary ${
                  isCompact ? 'text-[7px] px-1.5 py-0.5' : 'text-xs px-3 py-1.5'
                }`}
                style={{ background: tokens.colors.y }}
              >
                Lanjut →
              </button>
            ) : (
              <button
                onClick={handleReplay}
                className={`font-extrabold rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer flex items-center gap-1 ${
                  isCompact ? 'text-[7px] px-1.5 py-0.5' : 'text-xs px-3 py-1.5'
                }`}
                style={{ background: tokens.colors.y }}
              >
                <RotateCcw className={isCompact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
                Mulai Ulang
              </button>
            )}
          </div>

          {/* Transition type selector (compact, preview mode only) */}
          {!isCompact && (
            <div className="flex items-center justify-center gap-1 px-3 pb-1.5">
              {(Object.keys(TRANSITION_CONFIGS) as TransitionType[]).map((t) => {
                const cfg = TRANSITION_LABELS[t];
                const isActive = t === transitionType;
                return (
                  <button
                    key={t}
                    onClick={() => setTransitionType(t)}
                    title={`Transisi: ${cfg.label}`}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] transition-all cursor-pointer ${
                      isActive
                        ? 'bg-app-elevated/30 text-app-primary/90 ring-1 ring-emerald-400/40'
                        : 'text-app-primary/30 hover:bg-app-elevated/10 hover:text-app-primary/60'
                    }`}
                  >
                    <span className="text-[10px]">{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Info row (preview mode only) */}
          {!isCompact && (
            <div className="flex items-center justify-between px-3 pb-2 text-[10px] text-app-primary/30">
              <span>{currentScreen?.sectionLabel || currentScreen?.id}</span>
              <span>{screenIdx + 1}/{totalScreens} · Schema: {schema.id}</span>
              <span>Theme: {themeId}</span>
            </div>
          )}
        </div>
      )}

      {/* ══ THEME SWITCHER (floating, preview mode only) ═══════ */}
      {showThemeSwitcher && mode === 'preview' && (
        <div className="absolute top-2 right-2 z-50">
          <ThemeSwitcher
            currentTheme={themeId}
            onThemeChange={setThemeId}
            presetTheme={schema.themeId}
          />
        </div>
      )}
    </div>
  );
}

// ── Theme Switcher Sub-component ────────────────────────────────

function ThemeSwitcher({
  currentTheme,
  onThemeChange,
  presetTheme,
}: {
  currentTheme: string;
  onThemeChange: (id: string) => void;
  presetTheme?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all bg-app-border/8 border-app-border/15 text-app-primary/70">
        🎨 {THEME_PRESETS.find(t => t.id === currentTheme)?.name || currentTheme}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-1 w-48 rounded-xl overflow-hidden z-50 border border-app-border/10"
            style={{
              background: 'rgba(15,23,42,0.95)',
              boxShadow: '0 8px 32px rgba(0,0,0,.6)',
            }}>
            <div className="p-2 space-y-0.5">
              {THEME_PRESETS.map((t) => {
                const isActive = t.id === currentTheme;
                const isPreset = t.id === presetTheme;
                const tTokens = resolveTokens(t.id);

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onThemeChange(t.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                      isActive ? 'bg-app-elevated/10' : 'hover:bg-app-elevated/5'
                    }`}>
                    {/* Color swatch */}
                    <div className="flex gap-0.5 flex-shrink-0">
                      {[tTokens.colors.y, tTokens.colors.c, tTokens.colors.g, tTokens.colors.p].map((c, i) => (
                        <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-app-primary/80 truncate">{t.name}</div>
                      {isPreset && (
                        <div className="text-[8px] text-app-accent">Preset asli</div>
                      )}
                    </div>
                    {isActive && (
                      <span className="text-emerald-400 text-[10px] flex-shrink-0">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
