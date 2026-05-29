'use client';

import { useCanvaStore } from '@/store/canva-store';
import { useTeacherMode } from '@/hooks/use-teacher-mode';

// ═══════════════════════════════════════════════════════════════
// TOOLBAR NAV v2 — SILSE v4 MD3 Brand + Project Name
// ═══════════════════════════════════════════════════════════════
// MD3 spec:
//   - "SILSE" in Plus Jakarta Sans, extrabold, primary color
//   - Compact spacing
//   - Project name + auto-save subtitle
//   - Back-to-dashboard chevron link
// ═══════════════════════════════════════════════════════════════

export function ToolbarNav() {
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const label = useCanvaStore((s) => s.pages[s.currentPageIndex]?.label || 'Untitled');
  const { isSederhana } = useTeacherMode();

  return (
    <div className="flex items-center gap-3">
      {/* Back-to-dashboard link */}
      <button
        onClick={() => useCanvaStore.setState({ panelRequest: 'dashboard' })}
        className="flex items-center justify-center w-7 h-7 rounded-lg text-silse-on-surface-variant hover:text-silse-primary hover:bg-silse-surface-container-high/50 transition-colors"
        title={isSederhana ? 'Kembali ke Beranda' : 'Kembali ke Dashboard'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
      </button>

      {/* Brand name */}
      <span
        className="text-base font-extrabold text-silse-primary tracking-tight"
        style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
      >
        SILSE
      </span>

      {/* Divider */}
      <div className="h-4 w-px bg-silse-outline-variant/50" />

      {/* Project name + save status */}
      <div className="flex flex-col">
        <span className="text-xs font-bold text-silse-on-surface leading-none max-w-[180px] truncate">
          {label}
        </span>
        <span className="text-[9px] text-silse-on-surface-variant leading-tight">
          Disimpan otomatis
        </span>
      </div>
    </div>
  );
}
