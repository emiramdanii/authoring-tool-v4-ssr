'use client';

import { useCanvaStore } from '@/store/canva-store';
import { RATIOS } from '@/components/canva/types';
import { Ratio, Box, FileText, CheckCircle2, Loader2, Layers } from 'lucide-react';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

// ═══════════════════════════════════════════════════════════════
// Phase 2: StatusBar redesign
// - Replace mouse position with save indicator
// - Add template type to page info
// - Include overlay elements in count
// - Add zoom slider
// ═══════════════════════════════════════════════════════════════

export default function StatusBar() {
  const { pages, currentPageIndex, ratioId, zoom: storeZoom, setZoom, zoomToFit } = useCanvaStore();
  const page = pages[currentPageIndex];
  const ratio = useCanvaStore(s => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });

  // ── Save indicator: subscribe to centralized save status ───
  const saveStatus = useCanvaStore((s) => s._saveStatus);

  // Count all elements (overlayElements is always empty at runtime — merged into elements on load)
  const totalElements = page?.elements.length || 0;
  const templateBadge = TEMPLATE_BADGE_MAP[page?.templateType || 'custom'];



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

      {/* Save indicator (replaces mouse position) */}
      <span className="flex items-center gap-1">
        {saveStatus === 'saved' ? (
          <>
            <CheckCircle2 size={10} className="text-emerald-500/50" />
            <span className="text-emerald-500/50 hidden sm:inline">Tersimpan</span>
          </>
        ) : (
          <>
            <Loader2 size={10} className="text-amber-400/50 animate-spin" />
            <span className="text-amber-400/50 hidden sm:inline">Menyimpan...</span>
          </>
        )}
      </span>

      {/* Spacer + Theme toggle + Zoom slider (right side) */}
      <div className="flex items-center gap-1.5 ml-auto">
        <ThemeToggle />
        <Layers size={10} className="text-app-muted" />
        <input
          type="range"
          min={10}
          max={300}
          step={5}
          value={storeZoom === -1 ? 0 : Math.round(storeZoom * 100)}
          onChange={e => setZoom(parseInt(e.target.value) / 100)}
          className="w-16 h-1 accent-amber-500"
        />
        <button
          onClick={zoomToFit}
          className="font-mono text-[9px] text-app-muted hover:text-amber-400 transition-colors w-10 text-right"
          title="Fit to screen"
        >
          {storeZoom === -1 ? 'Fit' : `${Math.round(storeZoom * 100)}%`}
        </button>
      </div>
    </div>
  );
}
