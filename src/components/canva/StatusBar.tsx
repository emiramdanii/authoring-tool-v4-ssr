'use client';

import { useState, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { Ratio, Box, FileText, CheckCircle2, Loader2, Layers, Lock, Unlock } from 'lucide-react';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';

// ═══════════════════════════════════════════════════════════════
// Phase 2: StatusBar redesign
// - Replace mouse position with save indicator
// - Add template type to page info
// - Include overlay elements in count
// - Add zoom slider
// ═══════════════════════════════════════════════════════════════

export default function StatusBar({ mousePos }: { mousePos: { x: number; y: number } }) {
  const { pages, currentPageIndex, ratioId, zoom, setZoom } = useCanvaStore();
  const page = pages[currentPageIndex];
  const ratio = useCanvaStore(s => s.currentRatio());

  // ── Save indicator ──────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      setSaveStatus('saved');
    }, 800);
    return () => clearTimeout(timer);
  }, [pages, ratioId]);

  // Count all elements including overlays
  const totalElements = (page?.elements.length || 0) + (page?.overlayElements?.length || 0);
  const templateBadge = TEMPLATE_BADGE_MAP[page?.templateType || 'custom'];

  // Lock status
  const isTemplate = page?.templateType && page.templateType !== 'custom';
  const isPageLocked = isTemplate && page?.locked !== false;
  const isPageUnlocked = isTemplate && page?.locked === false;

  return (
    <div className="flex items-center gap-3 px-4 py-1 glass-panel text-[10px] text-slate-500 select-none">
      {/* Ratio */}
      <span className="flex items-center gap-1.5">
        <Ratio size={11} className="text-slate-600" />
        <span className="font-mono">{ratio.w}×{ratio.h}</span>
      </span>

      {/* Element count (includes overlays) */}
      <span className="flex items-center gap-1.5">
        <Box size={11} className="text-slate-600" />
        <span>{totalElements} elemen</span>
        {(page?.overlayElements?.length || 0) > 0 && (
          <span className="text-amber-400/50 text-[8px]">
            ({page.overlayElements.length} overlay)
          </span>
        )}
      </span>

      {/* Page info with template type + lock status */}
      <span className="flex items-center gap-1.5">
        <FileText size={11} className="text-slate-600" />
        <span>{currentPageIndex + 1}/{pages.length}</span>
        <span className="text-[8px] text-slate-600">
          {templateBadge?.icon} {templateBadge?.name || page?.templateType}
        </span>
        {isPageLocked && <Lock size={9} className="text-amber-400/60" />}
        {isPageUnlocked && <Unlock size={9} className="text-emerald-400/60" />}
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

      {/* Zoom slider (right side) */}
      <div className="flex items-center gap-1.5 ml-auto">
        <Layers size={10} className="text-slate-600" />
        <input
          type="range"
          min={25}
          max={200}
          step={5}
          value={Math.round(zoom * 100)}
          onChange={e => setZoom(parseInt(e.target.value) / 100)}
          className="w-16 h-1 accent-amber-500"
        />
        <span className="font-mono text-[9px] text-slate-500 w-8">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
