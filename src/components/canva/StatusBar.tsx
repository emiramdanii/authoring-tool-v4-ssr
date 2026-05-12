'use client';

import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { RATIOS } from '@/components/canva/types';
import { Ratio, Box, FileText, CheckCircle2, Loader2, Layers, AlertCircle } from 'lucide-react';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ThemePresetPicker } from '@/components/canva/ThemePresetPicker';

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
  const setZoom = useCanvaStore(s => s.setZoom);
  const zoomToFit = useCanvaStore(s => s.zoomToFit);
  const page = pages[currentPageIndex];
  const ratio = useCanvaStore(s => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });

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
    <div className="flex items-center gap-3 px-4 py-1 glass-panel text-[10px] text-app-muted select-none">
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

      {/* Page info with template type + lock status */}
      <span className="flex items-center gap-1.5">
        <FileText size={11} className="text-app-muted" />
        <span>{currentPageIndex + 1}/{pages.length}</span>
        <span className="text-[8px] text-app-muted">
          {templateBadge?.icon} {templateBadge?.name || page?.templateType}
        </span>

      </span>

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
          value={storeZoom === -1 ? 0 : Math.round(storeZoom * 100)}
          onChange={e => setZoom(parseInt(e.target.value) / 100)}
          className="w-16 h-1 accent-app-accent"
        />
        <button
          onClick={zoomToFit}
          className="font-mono text-[9px] text-app-muted hover:text-app-accent transition-colors w-10 text-right"
          title="Fit to screen"
        >
          {storeZoom === -1 ? 'Fit' : `${Math.round(storeZoom * 100)}%`}
        </button>
      </div>
    </div>
  );
}
