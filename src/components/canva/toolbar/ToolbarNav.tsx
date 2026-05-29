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
    <div className="flex items-center gap-2.5">
      {/* Back-to-dashboard link */}
      <button
        onClick={() => useCanvaStore.setState({ panelRequest: 'dashboard' })}
        className="flex items-center justify-center w-8 h-8 rounded-xl text-silse-on-surface-variant hover:text-silse-primary hover:bg-silse-primary-container/15 transition-[background-color,color] duration-150"
        title={isSederhana ? 'Kembali ke Beranda' : 'Kembali ke Dashboard'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
      </button>

      {/* Brand name — SILSE Studio identity */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-silse-primary-container/15 flex items-center justify-center border border-silse-primary-container/25">
          <span className="material-symbols-outlined text-silse-primary" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1, 'wght' 500" }}>school</span>
        </div>
        <span
          className="text-sm font-extrabold text-silse-primary tracking-tight"
          style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
        >
          SILSE Studio
        </span>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-silse-outline-variant/40 mx-1" />

      {/* Project name + save status */}
      <div className="flex flex-col">
        <span className="text-[12px] font-bold text-silse-on-surface leading-none max-w-[180px] truncate">
          {label}
        </span>
        <span className="text-[9px] text-silse-on-surface-variant/70 leading-tight">
          Disimpan otomatis
        </span>
      </div>
    </div>
  );
}
