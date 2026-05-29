'use client';

// All icons migrated to Material Symbols Outlined
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { triggerCanvaTour } from '@/components/shared/CanvaTour';

// ═══════════════════════════════════════════════════════════════════
// TOOLBAR HELP — Help button that triggers CanvaTour
// ═══════════════════════════════════════════════════════════════════
// Dispatches the 'start-canva-tour' custom event via triggerCanvaTour()
// which the CanvaTour component listens for.
// ═══════════════════════════════════════════════════════════════════

export function ToolbarHelp() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={triggerCanvaTour}
          className="focus-ring text-app-muted hover:text-app-accent h-7 w-7"
          title="Bantuan — Tur interaktif (?)"
          aria-label="Bantuan — Buka tur editor dan daftar shortcut"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lifebuoy</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[10px]">
        <div>Bantuan — Tur editor (?)</div>
        <div className="text-app-muted mt-0.5">Lihat semua shortcut: <kbd className="px-1 py-0.5 rounded bg-app-elevated/40 text-[8px] font-mono">Ctrl+/</kbd></div>
      </TooltipContent>
    </Tooltip>
  );
}
