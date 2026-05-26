'use client';

import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TOOLBAR NAV — Project name + back button
// ═══════════════════════════════════════════════════════════════

export function ToolbarNav() {
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const setActivePanel = useAuthoringStore((s) => s.setActivePanel);
  const page = pages[currentPageIndex];
  const label = page?.label || 'Untitled';

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-app-muted hover:text-app-primary"
        onClick={() => setActivePanel('dashboard')}
        title="Kembali ke Dashboard"
      >
        <ChevronLeft size={14} />
      </Button>
      <span className="text-[11px] font-semibold text-app-primary min-w-0 truncate max-w-[160px]">
        {label}
      </span>
    </div>
  );
}
