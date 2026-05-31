'use client';

import { useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// All icons migrated to Material Symbols Outlined
// ═══════════════════════════════════════════════════════════════
// ZOOM CONTROLS — Ratio badge + zoom in/out/fit + percentage
// ═══════════════════════════════════════════════════════════════

const RATIOS_LIST = [
  { id: '16:9', name: '16:9', desc: 'Landscape PPT' },
  { id: '9:16', name: '9:16', desc: 'Portrait HP' },
  { id: '1:1', name: '1:1', desc: 'Square Post' },
  { id: 'A4', name: 'A4', desc: 'Dokumen LKS' },
  { id: '4:3', name: '4:3', desc: 'Presentasi Lama' },
] as const;

export function ZoomControls() {
  const storeZoom = useCanvaStore((s) => s.zoom);
  const storeFitZoom = useCanvaStore((s) => s.fitZoom);
  const zoomDelta = useCanvaStore((s) => s.zoomDelta);
  const zoomToFit = useCanvaStore((s) => s.zoomToFit);
  const ratioId = useCanvaStore((s) => s.ratioId);
  const setRatio = useCanvaStore((s) => s.setRatio);

  const zoomPercent = storeZoom === -1
    ? Math.round(storeFitZoom * 100)
    : Math.round(storeZoom * 100);

  return (
    <div className="flex items-center gap-0.5">
      {/* Ratio badge — DropdownMenu replaces manual mousedown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="px-2 py-0.5 rounded-md bg-app-elevated text-app-accent font-mono text-[10px] hover:bg-app-surface transition-colors flex items-center gap-0.5"
            title="Rasio canvas"
          >
            {ratioId}
            <span className="material-symbols-outlined" style={{ fontSize: '8px' }}>expand_more</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-36 bg-app-surface border border-app-border shadow-md rounded-xl overflow-hidden"
        >
          {RATIOS_LIST.map((r) => (
            <DropdownMenuItem
              key={r.id}
              onClick={() => setRatio(r.id)}
              className={`px-3 py-2 flex items-center justify-between cursor-pointer ${
                ratioId === r.id ? 'text-app-accent bg-app-accent/5' : 'text-app-secondary'
              }`}
            >
              <span className="text-[11px] font-mono font-bold">{r.name}</span>
              <span className="text-[8px] text-app-muted">{r.desc}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Zoom controls */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={zoomToFit} className="focus-ring h-7 w-7 rounded-xl bg-silse-surface-container-lowest/80 hover:bg-silse-surface-container-lowest border border-silse-outline-variant/30">
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>fullscreen</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Sesuaikan layar (Ctrl+0)
        </TooltipContent>
      </Tooltip>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => zoomDelta(-0.1)}
        className="focus-ring h-7 w-7 rounded-xl bg-silse-surface-container-lowest/80 hover:bg-silse-surface-container-lowest border border-silse-outline-variant/30"
        title="Perkecil (Ctrl+-)"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>remove</span>
      </Button>
      <span
        className="text-[10px] font-mono text-app-secondary w-12 text-center select-none"
        title={storeZoom === -1 ? `Otomatis (${Math.round(storeFitZoom * 100)}%)` : `${Math.round(storeZoom * 100)}%`}
      >
        {storeZoom === -1 ? `Pas ${Math.round(storeFitZoom * 100)}%` : `${Math.round(storeZoom * 100)}%`}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => zoomDelta(0.1)}
        className="focus-ring h-7 w-7 rounded-xl bg-silse-surface-container-lowest/80 hover:bg-silse-surface-container-lowest border border-silse-outline-variant/30"
        title="Perbesar (Ctrl++)"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>add_circle</span>
      </Button>
    </div>
  );
}
