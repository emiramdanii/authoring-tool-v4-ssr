'use client';

import { useCanvaStore } from '@/store/canva-store';
import { ChevronLeft } from 'lucide-react';
import { useTeacherMode } from '@/hooks/use-teacher-mode';

// ═══════════════════════════════════════════════════════════════
// TOOLBAR NAV — SILSE v4 Brand + Project Name
// ═══════════════════════════════════════════════════════════════
// SILSE v4 spec:
//   - "SILSE Authoring" in Plus Jakarta Sans, extrabold, primary color
//   - Divider line
//   - Project name + auto-save subtitle
// ═══════════════════════════════════════════════════════════════

export function ToolbarNav() {
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const label = useCanvaStore((s) => s.pages[s.currentPageIndex]?.label || 'Untitled');
  const { isSederhana } = useTeacherMode();

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => useCanvaStore.setState({ panelRequest: 'dashboard' })}
        className="flex items-center gap-1 text-silse-on-surface-variant hover:text-silse-primary transition-colors"
        title={isSederhana ? 'Kembali ke Beranda' : 'Kembali ke Dashboard'}
      >
        <ChevronLeft size={16} />
      </button>
      <span className="font-[family-name:var(--font-plus-jakarta)] text-xl font-extrabold text-silse-primary tracking-tight">
        SILSE Authoring
      </span>
      <div className="h-6 w-px bg-silse-outline-variant" />
      <div className="flex flex-col">
        <span className="text-sm font-bold text-silse-on-surface leading-none max-w-[200px] truncate">
          {label}
        </span>
        <span className="text-[10px] text-silse-on-surface-variant">
          Disimpan otomatis
        </span>
      </div>
    </div>
  );
}
