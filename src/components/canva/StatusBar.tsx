'use client';

import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { RATIOS } from '@/components/canva/types';
import { Ratio, Box, FileText, CheckCircle2, Loader2, Layers, AlertCircle, Eye, Zap } from 'lucide-react';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ThemePresetPicker } from '@/components/canva/ThemePresetPicker';
import { BLOCK_DEFINITIONS } from '@/core/registry/BlockDefinitionRegistry';
import { teacherTerm } from '@/core/i18n/teacher-terminology';

// ═══════════════════════════════════════════════════════════════
// Phase 2: StatusBar redesign
// - Replace mouse position with unified save indicator
// - Add template type to page info
// - Include overlay elements in count
// - Add zoom slider
// ═══════════════════════════════════════════════════════════════

type SaveStatus = 'unsaved' | 'saving' | 'saved' | 'error';

export default function StatusBar() {
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const ratioId = useCanvaStore(s => s.ratioId);
  const storeZoom = useCanvaStore(s => s.zoom);
  const storeFitZoom = useCanvaStore(s => s.fitZoom);
  const setZoom = useCanvaStore(s => s.setZoom);
  const zoomToFit = useCanvaStore(s => s.zoomToFit);
  const page = pages[currentPageIndex];
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
  const authoringDirty = useAuthoringStore((s) => s.dirty);

  const saveStatus: SaveStatus = (() => {
    const cs = canvaStatus || 'unsaved';
    if (cs === 'saved' && authoringDirty) return 'unsaved';
    if (cs === 'error') return 'error';
    return cs;
  })();

  // Count all elements (overlayElements is always empty at runtime — merged into elements on load)
  const totalElements = page?.elements.length || 0;
  const templateBadge = TEMPLATE_BADGE_MAP[page?.templateType || 'custom'];

  const saveIndicatorConfig: Record<SaveStatus, { icon: React.ReactNode; label: string; className: string }> = {
    unsaved: {
      icon: <span className="inline-block w-2 h-2 rounded-full bg-red-400/60" />,
      label: 'Belum tersimpan',
      className: 'text-red-400/60',
    },
    saving: {
      icon: <Loader2 size={10} className="animate-spin" />,
      label: 'Menyimpan...',
      className: 'text-amber-400/60',
    },
    saved: {
      icon: <CheckCircle2 size={10} />,
      label: 'Tersimpan',
      className: 'text-emerald-500/50',
    },
    error: {
      icon: <AlertCircle size={10} />,
      label: 'Gagal simpan',
      className: 'text-red-400/60',
    },
  };

  const saveConfig = saveIndicatorConfig[saveStatus];

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 bg-app-surface border-t border-app-border text-[11px] text-app-muted select-none">
      {/* Ratio */}
      <span className="flex items-center gap-1.5">
        <Ratio size={11} className="text-app-muted" />
        <span className="font-mono">{ratio.w}×{ratio.h}</span>
      </span>

      {/* Element count */}
      <span className="flex items-center gap-1.5">
        <Box size={11} className="text-app-muted" />
        <span>{totalElements} elemen</span>
      </span>

      {/* Page info with template type */}
      <span className="flex items-center gap-1.5">
        <FileText size={11} className="text-app-muted" />
        <span>{currentPageIndex + 1}/{pages.length}</span>
        <span className="text-[8px] text-app-muted">
          {templateBadge?.icon} {templateBadge?.name || page?.templateType}
        </span>
      </span>

      {/* Scene indicator — only when multi-scene */}
      {sceneTotal > 1 && (
        <span className="flex items-center gap-1">
          <Layers size={11} className="text-emerald-400/60" />
          <span className="text-emerald-400/70 font-medium">{teacherMode ? 'Bagian' : 'Scene'} {sceneIndex + 1}/{sceneTotal}</span>
        </span>
      )}

      {/* Block selection feedback — shows block type when selected */}
      {selectedBlockId && selectedBlockType && !teacherMode && (
        <span className="flex items-center gap-1">
          <Zap size={11} className="text-amber-400/60" />
          <span className="text-amber-400/70 font-medium">
            {teacherTerm(BLOCK_DEFINITIONS[selectedBlockType]?.name || selectedBlockType, teacherMode)}
          </span>
        </span>
      )}

      {/* Canvas preview mode indicator */}
      {canvasPreview && (
        <span className="flex items-center gap-1">
          <Eye size={11} className="text-cyan-400/60" />
          <span className="text-cyan-400/70 font-medium">Preview</span>
        </span>
      )}

      <div className="section-divider h-3 w-px mx-1" />

      {/* Unified save indicator */}
      <span className={`flex items-center gap-1 ${saveConfig.className}`}>
        {saveConfig.icon}
        <span className="hidden sm:inline">{saveConfig.label}</span>
      </span>

      {/* Spacer + Theme preset picker + Theme toggle + Zoom slider (right side) */}
      <div className="flex items-center gap-1.5 ml-auto">
        <ThemePresetPicker />
        <ThemeToggle />
        <Layers size={10} className="text-app-muted" />
        <input
          type="range"
          min={10}
          max={300}
          step={5}
          value={storeZoom === -1 ? Math.round(storeFitZoom * 100) : Math.round(storeZoom * 100)}
          onChange={e => setZoom(parseInt(e.target.value) / 100)}
          className="w-16 h-1 accent-app-accent"
        />
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
