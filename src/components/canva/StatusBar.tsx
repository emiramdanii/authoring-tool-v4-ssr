'use client';

import { useCanvaStore } from '@/store/canva-store';
import { useDirtyStore } from '@/store/dirty-store';
import { RATIOS } from '@/components/canva/types';
import { Ratio, Box, FileText, CheckCircle2, Loader2, Layers, AlertCircle, Eye, Zap, GraduationCap, Monitor, Projector, Printer, Laptop } from 'lucide-react';
// Note: lucide icons kept for small 10-11px status bar inline icons — Material Symbols at this size are blurry
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ThemePresetPicker } from '@/components/canva/ThemePresetPicker';
import { BLOCK_DEFINITIONS } from '@/core/registry/BlockDefinitionRegistry';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { teacherTerm } from '@/core/i18n/teacher-terminology';
import { inferSceneType, SCENE_TYPES } from '@/core/edu/education-scene-types';
import type { SceneType } from '@/core/edu/education-scene-types';
import { SCENE_PRIMARY_COLOR } from '@/core/edu/education-components';

// ═══════════════════════════════════════════════════════════════
// STATUS BAR v7 — SILSE v4 Stitch Reference Bottom Bar
// ═══════════════════════════════════════════════════════════════
// - Consistent text-xs typography
// - SILSE v4 semantic tokens only (no hardcoded colors)
// - Styled range slider
// - saveIndicatorConfig as module-level constant
// ═══════════════════════════════════════════════════════════════

type SaveStatus = 'unsaved' | 'saving' | 'saved' | 'error';

// ═══════════════════════════════════════════════════════════════
// DISPLAY MODE SELECTOR — Educational viewing context switcher
// ═══════════════════════════════════════════════════════════════
// Controls how canvas content renders:
//   🏫 Classroom — white bg, standard sizes (1.0x)
//   📽️ Projector — warm bg, max sizes (1.15x)
//   🖨️ Print — B&W friendly (0.95x)
//   💻 Student — laptop/HP (0.9x)
// ═══════════════════════════════════════════════════════════════

import type { EduDisplayMode } from '@/core/edu/education-typography';

const DISPLAY_MODES: Array<{
  key: EduDisplayMode;
  label: string;
  icon: React.ReactNode;
  shortLabel: string;
}> = [
  { key: 'classroom', label: 'Kelas', icon: <Monitor size={10} />, shortLabel: '🏫' },
  { key: 'projector', label: 'Proyektor', icon: <Projector size={10} />, shortLabel: '📽️' },
  { key: 'print', label: 'Cetak', icon: <Printer size={10} />, shortLabel: '🖨️' },
  { key: 'student', label: 'Siswa', icon: <Laptop size={10} />, shortLabel: '💻' },
];

function DisplayModeSelector() {
  const displayMode = useCanvaStore((s) => s.displayMode);
  const setDisplayMode = useCanvaStore((s) => s.setDisplayMode);

  return (
    <div className="flex items-center gap-0.5 rounded-md bg-silse-surface-container/50 px-0.5 py-0.5" title="Mode tampilan konten">
      {DISPLAY_MODES.map((m) => {
        const isActive = displayMode === m.key;
        return (
          <button
            key={m.key}
            onClick={() => setDisplayMode(m.key)}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors text-[9px] font-bold ${
              isActive
                ? 'bg-silse-primary/15 text-silse-primary'
                : 'text-silse-on-surface-variant hover:text-silse-on-surface-variant/80 hover:bg-silse-surface-container-high/50'
            }`}
            title={m.label}
            aria-label={`Mode tampilan: ${m.label}`}
            aria-pressed={isActive}
          >
            {m.icon}
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Module-level constant — moved from render
const SAVE_INDICATOR_CONFIG: Record<SaveStatus, { icon: React.ReactNode; label: string; className: string }> = {
  unsaved: {
    icon: <span className="inline-block w-2 h-2 rounded-full bg-silse-error/60" />,
    label: 'Belum tersimpan',
    className: 'text-silse-error/60',
  },
  saving: {
    icon: <Loader2 size={10} className="animate-spin text-silse-tertiary" />,
    label: 'Menyimpan...',
    className: 'text-silse-tertiary/60',
  },
  saved: {
    icon: <CheckCircle2 size={10} className="text-silse-primary" />,
    label: 'Tersimpan',
    className: 'text-silse-primary/50',
  },
  error: {
    icon: <AlertCircle size={10} className="text-silse-error" />,
    label: 'Gagal simpan',
    className: 'text-silse-error/60',
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
  const authoringDirty = useDirtyStore((s) => s.dirty);  // Phase 5: migrated from useAuthoringStore

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

  // FIX: Count BOTH schema blocks AND legacy elements.
  // Schema-driven pages store blocks in page.schema.blocks,
  // legacy pages store elements in page.elements.
  // Previously only counted page.elements → always showed "0 konten"
  // for schema-driven pages even when they had blocks.
  const schemaBlocks = page ? (ensurePageSchema(page)?.blocks.length ?? 0) : 0;
  const legacyElements = page?.elements.length || 0;
  const totalElements = schemaBlocks + legacyElements;
  const templateBadge = TEMPLATE_BADGE_MAP[page?.templateType || 'custom'];

  const saveConfig = SAVE_INDICATOR_CONFIG[saveStatus];

  const zoomPercent = storeZoom === -1
    ? Math.round(storeFitZoom * 100)
    : Math.round(storeZoom * 100);

  return (
    <div
      className="flex items-center gap-3 px-4 py-1.5 bg-silse-surface-container-lowest border-t border-silse-outline-variant text-xs text-silse-on-surface-variant select-none"
      style={{ height: 'var(--semantic-statusbar-height)' }}
    >
      {/* Ratio */}
      <span className="flex items-center gap-1.5">
        <Ratio size={11} className="text-silse-on-surface-variant" />
        <span className="font-mono">{ratio!.w}×{ratio!.h}</span>
      </span>

      {/* Element count — teacher-friendly label */}
      <span className="flex items-center gap-1.5">
        <Box size={11} className="text-silse-on-surface-variant" />
        <span>{totalElements} {teacherMode ? 'konten' : 'elemen'}</span>
      </span>

      {/* Page info with template type + scene type */}
      <span className="flex items-center gap-1.5">
        <FileText size={11} className="text-silse-on-surface-variant" />
        <span>{currentPageIndex + 1}/{pagesLength}</span>
        <span className="text-[8px] text-silse-on-surface-variant">
          {templateBadge?.icon} {templateBadge?.name || page?.templateType}
        </span>
        {/* Scene Type indicator — shows which Learning Scene this page is */}
        {page?.templateType && (() => {
          const st = inferSceneType(undefined, page.templateType, undefined);
          const def = SCENE_TYPES[st];
          const colorKey = SCENE_PRIMARY_COLOR[st];
          const sceneColors: Record<string, string> = {
            tujuan: 'text-silse-tertiary',
            materi: 'text-cyan-500',
            contoh: 'text-green-500',
            aktivitas: 'text-orange-500',
            diskusi: 'text-purple-500',
            refleksi: 'text-teal-500',
            quiz: 'text-red-500',
            rangkuman: 'text-blue-500',
          };
          return (
            <span className={`text-[7px] font-bold ${sceneColors[colorKey] ?? 'text-silse-on-surface-variant'}`} title={`Scene: ${def.labelId} — ${def.description}`}>
              ● {def.labelId}
            </span>
          );
        })()}
      </span>

      {/* Scene indicator */}
      {sceneTotal > 1 && (
        <span className="flex items-center gap-1">
          <Layers size={11} className="text-silse-primary/60" />
          <span className="text-silse-primary/70 font-medium">{teacherMode ? 'Halaman' : 'Scene'} {sceneIndex + 1}/{sceneTotal}</span>
        </span>
      )}

      {/* Block selection feedback — shown in both modes */}
      {selectedBlockId && selectedBlockType && (
        <span className="flex items-center gap-1">
          <Zap size={11} className="text-silse-primary/60" />
          <span className="text-silse-primary/70 font-medium">
            {teacherTerm(BLOCK_DEFINITIONS[selectedBlockType]?.name || selectedBlockType, teacherMode)}
          </span>
        </span>
      )}

      {/* Canvas preview mode indicator */}
      {canvasPreview && (
        <span className="flex items-center gap-1">
          <Eye size={11} className="text-silse-secondary/60" />
          <span className="text-silse-secondary/70 font-medium">Preview</span>
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
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-silse-error/10 text-silse-error hover:bg-silse-error/20 transition-colors"
          title="Coba simpan lagi"
        >
          Coba Lagi
        </button>
      )}

      {/* Right side: Display mode + Teacher mode badge + Theme + Zoom */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Display Mode Selector — educational viewing context */}
        <DisplayModeSelector />
        {/* Teacher mode badge — always visible so teachers know their mode */}
        {teacherMode && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-silse-primary-container/10 text-[8px] font-bold text-silse-primary-container">
            <GraduationCap size={8} />
            Mode Guru
          </span>
        )}
        <ThemePresetPicker />
        <ThemeToggle />
        <Layers size={10} className="text-silse-on-surface-variant" />
        {/* Zoom slider — hidden in teacher mode (simpler), show only fit button + percentage */}
        {!teacherMode && (
          <input
            type="range"
            min={10}
            max={300}
            step={5}
            value={zoomPercent}
            onChange={e => setZoom(parseInt(e.target.value) / 100)}
            className="w-16 h-1 accent-silse-primary"
          />
        )}
        <button
          onClick={zoomToFit}
          className="font-mono text-[9px] text-silse-on-surface-variant hover:text-silse-primary transition-colors w-12 text-right"
          title="Sesuaikan layar"
        >
          {storeZoom === -1 ? `Pas ${Math.round(storeFitZoom * 100)}%` : `${Math.round(storeZoom * 100)}%`}
        </button>
      </div>
    </div>
  );
}
