'use client';

import { LifeBuoy } from 'lucide-react';
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
        >
          <LifeBuoy size={14} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[10px]">
        Bantuan — Tur editor (?)
      </TooltipContent>
    </Tooltip>
  );
}
