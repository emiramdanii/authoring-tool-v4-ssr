'use client';

import { useState, useRef, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
// All icons migrated to Material Symbols Outlined
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

// ═══════════════════════════════════════════════════════════════════
// TOOLBAR VIEW CONTROLS — Ratio selector + Zoom controls
// ═══════════════════════════════════════════════════════════════════
// Handles canvas ratio selection and zoom in/out/fit/reset with
// percentage display.
// ═══════════════════════════════════════════════════════════════════

const RATIOS = [
  { id: '16:9', name: '16:9', desc: 'Landscape PPT' },
  { id: '9:16', name: '9:16', desc: 'Portrait HP' },
  { id: '1:1', name: '1:1', desc: 'Square Post' },
  { id: 'A4', name: 'A4', desc: 'Dokumen LKS' },
  { id: '4:3', name: '4:3', desc: 'Presentasi Lama' },
] as const;

export function ToolbarViewControls() {
  const storeZoom = useCanvaStore((s) => s.zoom);
  const storeFitZoom = useCanvaStore((s) => s.fitZoom);
  const zoomDelta = useCanvaStore((s) => s.zoomDelta);
  const zoomToFit = useCanvaStore((s) => s.zoomToFit);
  const ratioId = useCanvaStore((s) => s.ratioId);
  const setRatio = useCanvaStore((s) => s.setRatio);

  const [ratioOpen, setRatioOpen] = useState(false);
  const ratioRef = useRef<HTMLDivElement>(null);

  // Close ratio dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ratioRef.current && !ratioRef.current.contains(e.target as Node)) setRatioOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex items-center gap-0.5">
      {/* Ratio badge — clickable dropdown */}
      <div className="relative" ref={ratioRef}>
        <button
          onClick={() => setRatioOpen(!ratioOpen)}
          className="px-2 py-0.5 rounded-md bg-app-elevated text-app-accent font-mono text-[10px] hover:bg-app-surface transition-colors flex items-center gap-0.5"
          title="Rasio canvas"
        >
          {ratioId}
          <span className="material-symbols-outlined" style={ { fontSize: '8px' } }>expand_more</span>
        </button>
        {ratioOpen && (
          <div className="absolute top-full left-0 mt-1 w-36 rounded-xl bg-app-surface border border-app-border shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
            {RATIOS.map(r => (
              <button
                key={r.id}
                onClick={() => { setRatio(r.id); setRatioOpen(false); }}
                className={`w-full px-3 py-2 flex items-center justify-between hover:bg-app-accent/10 transition-colors ${
                  ratioId === r.id ? 'text-app-accent bg-app-accent/5' : 'text-app-secondary'
                }`}
              >
                <span className="text-[11px] font-mono font-bold">{r.name}</span>
                <span className="text-[8px] text-app-muted">{r.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom controls */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={zoomToFit} className="focus-ring h-7 w-7">
            <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>fullscreen</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Fit to screen (Ctrl+0)
        </TooltipContent>
      </Tooltip>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => zoomDelta(-0.1)}
        className="focus-ring h-7 w-7"
        title="Zoom out (Ctrl+-)"
      >
        <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>remove</span>
      </Button>
      <span
        className="text-[10px] font-mono text-app-secondary w-12 text-center select-none"
        title={storeZoom === -1 ? `Auto-fit (${Math.round(storeFitZoom * 100)}%)` : `${Math.round(storeZoom * 100)}% of native`}
      >
        {storeZoom === -1 ? `Fit ${Math.round(storeFitZoom * 100)}%` : `${Math.round(storeZoom * 100)}%`}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => zoomDelta(0.1)}
        className="focus-ring h-7 w-7"
        title="Zoom in (Ctrl++)"
      >
        <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>add</span>
      </Button>
    </div>
  );
}
