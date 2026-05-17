'use client';

import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { RATIOS } from '@/components/canva/types';
import { Ratio, Box, FileText, CheckCircle2, Loader2, Layers, AlertCircle, Eye, Zap, GraduationCap } from 'lucide-react';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ThemePresetPicker } from '@/components/canva/ThemePresetPicker';
import { BLOCK_DEFINITIONS } from '@/core/registry/BlockDefinitionRegistry';
import { teacherTerm } from '@/core/i18n/teacher-terminology';

// ═══════════════════════════════════════════════════════════════
// STATUS BAR v6 — Modernized & Clean
// ═══════════════════════════════════════════════════════════════
// - Consistent text-xs typography
// - Semantic tokens only (no hardcoded colors)
// - Styled range slider
// - saveIndicatorConfig as module-level constant
// ═══════════════════════════════════════════════════════════════

type SaveStatus = 'unsaved' | 'saving' | 'saved' | 'error';

// Module-level constant — moved from render
const SAVE_INDICATOR_CONFIG: Record<SaveStatus, { icon: React.ReactNode; label: string; className: string }> = {
  unsaved: {
    icon: <span className="inline-block w-2 h-2 rounded-full bg-app-error/60" />,
    label: 'Belum tersimpan',
    className: 'text-app-error/60',
  },
  saving: {
    icon: <Loader2 size={10} className="animate-spin" />,
    label: 'Menyimpan...',
    className: 'text-app-warning/60',
  },
  saved: {
    icon: <CheckCircle2 size={10} />,
    label: 'Tersimpan',
    className: 'text-app-success/50',
  },
  error: {
    icon: <AlertCircle size={10} />,
    label: 'Gagal simpan',
    className: 'text-app-error/60',
  },
};

export default function StatusBar() {
  // PERF: Subscribe to only what's needed, not the full pages[] array
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const pagesLength = useCanvaStore(s => s.pages.length);
  const page = useCanvaStore(s => s.pages[s.currentPageIndex]);
  const storeZoom = useCanvaStore(s => s.zoom);
  const storeFitZoom = useCanvaStore(s => s.fitZoom);
  const setZoom = useCanvaStore(s => s.setZoom);
  const zoomToFit = useCanvaStore(s => s.zoomToFit);
  const ratio = useCanvaStore(s => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });

  // ── Scene navigation state ────────────────────────────────────
  const sceneIndex = useCanvaStore(s => s.sceneIndex);
  const sceneTotal = useCanvaStore(s => s.sceneTotal);

  // ── Block selection feedback ───────────────────────────────────
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const selectedBlockType = useCanvaStore(s => s.selectedBlockType);

  // ── Canvas preview mode ───────────────────────────────────────
  const canvasPreview = useCanvaStore(s => s.canvasPreview);

  // ── Teacher mode ──────────────────────────────────────────────
  const teacherMode = useCanvaStore(s => s.teacherMode);

  // ── Unified save indicator ────────────────────────────────────
  const canvaStatus = useCanvaStore((s) => s._saveStatus as SaveStatus | undefined);
  const canvaLastSaved = useCanvaStore((s) => s._lastSavedAt);
  const authoringDirty = useAuthoringStore((s) => s.dirty);

  const saveStatus: SaveStatus = (() => {
    const cs = canvaStatus || 'unsaved';
    if (cs === 'saved' && authoringDirty) return 'unsaved';
    if (cs === 'error') return 'error';
    return cs;
  })();

  // Format last saved time as relative (e.g., "2 menit lalu")
  const lastSavedLabel = (() => {
    if (!canvaLastSaved || canvaLastSaved === 0) return '';
    const diffSec = Math.floor((Date.now() - canvaLastSaved) / 1000);
    if (diffSec < 5) return 'Baru saja';
    if (diffSec < 60) return `${diffSec} dtk lalu`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr} jam lalu`;
  })();

  const totalElements = page?.elements.length || 0;
  const templateBadge = TEMPLATE_BADGE_MAP[page?.templateType || 'custom'];

  const saveConfig = SAVE_INDICATOR_CONFIG[saveStatus];

  const zoomPercent = storeZoom === -1
    ? Math.round(storeFitZoom * 100)
    : Math.round(storeZoom * 100);

  return (
    <div
      className="flex items-center gap-3 px-4 py-1.5 bg-app-surface border-t border-app-border text-xs text-app-muted select-none"
      style={{ height: 'var(--semantic-statusbar-height)' }}
    >
      {/* Ratio */}
      <span className="flex items-center gap-1.5">
        <Ratio size={11} className="text-app-muted" />
        <span className="font-mono">{ratio.w}×{ratio.h}</span>
      </span>

      {/* Element count — teacher-friendly label */}
      <span className="flex items-center gap-1.5">
        <Box size={11} className="text-app-muted" />
        <span>{totalElements} {teacherMode ? 'konten' : 'elemen'}</span>
      </span>

      {/* Page info with template type */}
      <span className="flex items-center gap-1.5">
        <FileText size={11} className="text-app-muted" />
        <span>{currentPageIndex + 1}/{pagesLength}</span>
        <span className="text-[8px] text-app-muted">
          {templateBadge?.icon} {templateBadge?.name || page?.templateType}
        </span>
      </span>

      {/* Scene indicator */}
      {sceneTotal > 1 && (
        <span className="flex items-center gap-1">
          <Layers size={11} className="text-app-success/60" />
          <span className="text-app-success/70 font-medium">{teacherMode ? 'Halaman' : 'Scene'} {sceneIndex + 1}/{sceneTotal}</span>
        </span>
      )}

      {/* Block selection feedback — shown in both modes */}
      {selectedBlockId && selectedBlockType && (
        <span className="flex items-center gap-1">
          <Zap size={11} className="text-app-accent/60" />
          <span className="text-app-accent/70 font-medium">
            {teacherTerm(BLOCK_DEFINITIONS[selectedBlockType]?.name || selectedBlockType, teacherMode)}
          </span>
        </span>
      )}

      {/* Canvas preview mode indicator */}
      {canvasPreview && (
        <span className="flex items-center gap-1">
          <Eye size={11} className="text-app-info/60" />
          <span className="text-app-info/70 font-medium">Preview</span>
        </span>
      )}

      <div className="section-divider h-3 w-px mx-1" />

      {/* Unified save indicator — always shows status + relative time */}
      <span className={`flex items-center gap-1 ${saveConfig.className}`}>
        {saveConfig.icon}
        <span className="hidden sm:inline">{saveConfig.label}</span>
        {lastSavedLabel && saveStatus !== 'error' && (
          <span className="text-[8px] opacity-60 ml-0.5">• {lastSavedLabel}</span>
        )}
      </span>

      {/* Error retry — one-click retry when save fails */}
      {saveStatus === 'error' && (
        <button
          onClick={() => {
            // Force re-save by triggering the auto-save hook
            useCanvaStore.getState().saveToStorage();
          }}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-app-error/10 text-app-error hover:bg-app-error/20 transition-colors"
          title="Coba simpan lagi"
        >
          Coba Lagi
        </button>
      )}

      {/* Right side: Teacher mode badge + Theme + Zoom */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Teacher mode badge — always visible so teachers know their mode */}
        {teacherMode && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-[8px] font-bold text-emerald-400">
            <GraduationCap size={8} />
            Mode Guru
          </span>
        )}
        <ThemePresetPicker />
        <ThemeToggle />
        <Layers size={10} className="text-app-muted" />
        {/* Zoom slider — hidden in teacher mode (simpler), show only fit button + percentage */}
        {!teacherMode && (
          <input
            type="range"
            min={10}
            max={300}
            step={5}
            value={zoomPercent}
            onChange={e => setZoom(parseInt(e.target.value) / 100)}
            className="w-16 h-1 accent-app-accent"
          />
        )}
        <button
          onClick={zoomToFit}
          className="font-mono text-[9px] text-app-muted hover:text-app-accent transition-colors w-12 text-right"
          title="Fit to screen"
        >
          {storeZoom === -1 ? `Fit ${Math.round(storeFitZoom * 100)}%` : `${Math.round(storeZoom * 100)}%`}
        </button>
      </div>
    </div>
  );
}
