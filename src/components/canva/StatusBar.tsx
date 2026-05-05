'use client';

import { useCanvaStore } from '@/store/canva-store';
import { Ratio, Box, FileText } from 'lucide-react';

export default function StatusBar({ mousePos }: { mousePos: { x: number; y: number } }) {
  const { pages, currentPageIndex, ratioId } = useCanvaStore();
  const page = pages[currentPageIndex];
  const ratio = useCanvaStore(s => s.currentRatio());

  return (
    <div className="flex items-center gap-4 px-4 py-1 glass-panel text-[10px] text-slate-500 select-none">
      <span className="flex items-center gap-1.5">
        <Ratio size={11} className="text-slate-600" />
        <span className="font-mono">{ratio.w}×{ratio.h}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Box size={11} className="text-slate-600" />
        <span>{page?.elements.length || 0} elemen</span>
      </span>
      <span className="flex items-center gap-1.5">
        <FileText size={11} className="text-slate-600" />
        <span>{currentPageIndex + 1}/{pages.length}</span>
      </span>
      <div className="section-divider h-3 w-px mx-1" />
      <span className="ml-auto font-mono text-slate-600">
        x:{mousePos.x} y:{mousePos.y}
      </span>
    </div>
  );
}
