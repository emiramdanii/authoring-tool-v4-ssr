'use client';

import { useCanvaStore } from '@/store/canva-store';
import { PanelLeft, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

// ═══════════════════════════════════════════════════════════════════
// TOOLBAR PANEL TOGGLES — Left/Right panel toggle buttons
// ═══════════════════════════════════════════════════════════════════

export function ToolbarPanelToggles() {
  const leftPanelOpen = useCanvaStore((s) => s.leftPanelOpen);
  const toggleLeftPanel = useCanvaStore((s) => s.toggleLeftPanel);
  const rightPanelOpen = useCanvaStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useCanvaStore((s) => s.toggleRightPanel);

  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLeftPanel}
            className={`focus-ring h-7 w-7 ${leftPanelOpen ? 'text-app-accent' : ''}`}
          >
            <PanelLeft size={14} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          {leftPanelOpen ? 'Sembunyikan Panel Kiri' : 'Tampilkan Panel Kiri'}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRightPanel}
            className={`focus-ring h-7 w-7 ${rightPanelOpen ? 'text-app-accent' : ''}`}
          >
            <PanelRight size={14} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          {rightPanelOpen ? 'Sembunyikan Panel Kanan' : 'Tampilkan Panel Kanan'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
