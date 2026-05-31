'use client';

import { useState } from 'react';
import { isEnabled } from '@/config/feature-flags';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useExportActions } from './use-export-actions';
// All icons migrated to Material Symbols Outlined
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

// ═══════════════════════════════════════════════════════════════════
// TOOLBAR EXPORT — Bagikan & Export dropdown
// ═══════════════════════════════════════════════════════════════════
// Organized into sections:
//   Preview → Download → Cetak → Lanjutan (Advanced submenu)
// Uses the useExportActions hook for all export logic.
// ═══════════════════════════════════════════════════════════════════

export function ToolbarExport() {
  const {
    exportHtml,
    exportScorm,
    exportJson,
    previewTab,
    print,
    clearCanvas,
    isExporting,
  } = useExportActions();

  // Phase 3: setActivePanel migrated → panelRequest; soundOn stays until Phase 5
  const soundOn = useAuthoringStore((s) => Object.values(s.suara).some(Boolean));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            disabled={isExporting}
            className={`focus-ring flex items-center gap-1 h-7 px-2 ${isExporting ? 'opacity-50' : ''}`}
          >
            {isExporting ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: '13px' }}>progress_activity</span> : <span className="material-symbols-outlined" style={ { fontSize: '13px' } }>share</span>}
            <span className="hidden sm:inline text-[10px] font-semibold">Ekspor</span>
            <span className="material-symbols-outlined" style={{ fontSize: '8px' }}>expand_more</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-72 bg-app-surface border border-app-border shadow-md rounded-xl p-0 overflow-hidden"
        >
          {/* ── Preview Section ── */}
          <DropdownMenuLabel className="px-3 py-1.5 bg-teal-500/10 border-b border-teal-500/20 text-[9px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>visibility</span> Preview
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={previewTab}
            className="px-3 py-2.5 gap-2.5 focus:bg-teal-500/10 cursor-pointer"
          >
            <span className="material-symbols-outlined text-teal-400 flex-shrink-0" style={ { fontSize: '14px' } }>movie</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-teal-300">Preview Tab Baru</div>
              <div className="text-[8px] text-app-muted">Lihat tampilan siswa di tab baru</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => useCanvaStore.setState({ panelRequest: 'preview' })}
            className="px-3 py-2.5 gap-2.5 focus:bg-cyan-500/10 cursor-pointer"
          >
            <span className="material-symbols-outlined text-cyan-400 flex-shrink-0" style={ { fontSize: '14px' } }>smart_display</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-cyan-300">Live Preview</div>
              <div className="text-[8px] text-app-muted">Panel lengkap di samping canvas</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-app-border/30" />

          {/* ── Download Section ── */}
          <DropdownMenuLabel className="px-3 py-1.5 bg-emerald-500/10 border-y border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>download</span> Unduh
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={exportHtml}
            disabled={isExporting}
            className="px-3 py-2.5 gap-2.5 focus:bg-emerald-500/10 cursor-pointer"
          >
            {isExporting
              ? <span className="material-symbols-outlined animate-spin text-emerald-400 flex-shrink-0" style={{ fontSize: '14px' }}>progress_activity</span>
              : <span className="material-symbols-outlined text-emerald-400 flex-shrink-0" style={{ fontSize: '14px' }}>download</span>
            }
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-emerald-300">
                {isExporting ? 'Mengunduh...' : 'Unduh HTML'}
              </div>
              <div className="text-[8px] text-app-muted">File HTML lengkap — siap dibagikan</div>
            </div>
          </DropdownMenuItem>
          {isEnabled('scormExport') && (
            <DropdownMenuItem
              onClick={exportScorm}
              disabled={isExporting}
              className="px-3 py-2.5 gap-2.5 focus:bg-orange-500/10 cursor-pointer"
            >
              {isExporting
                ? <span className="material-symbols-outlined animate-spin text-orange-400 flex-shrink-0" style={{ fontSize: '14px' }}>progress_activity</span>
                : <span className="material-symbols-outlined text-orange-400 flex-shrink-0" style={ { fontSize: '14px' } }>inventory_2</span>
              }
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-orange-300">
                  {isExporting ? 'Membuat SCORM...' : 'Unduh SCORM (Moodle)'}
                </div>
                <div className="text-[8px] text-app-muted">Paket ZIP untuk upload ke LMS Moodle</div>
              </div>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="bg-app-border/30" />

          {/* ── Cetak Section ── */}
          <DropdownMenuLabel className="px-3 py-1.5 bg-amber-500/10 border-y border-amber-500/20 text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>print</span> Cetak
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={print}
            className="px-3 py-2.5 gap-2.5 focus:bg-amber-500/10 cursor-pointer"
          >
            <span className="material-symbols-outlined text-amber-400 flex-shrink-0" style={{ fontSize: '14px' }}>print</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-amber-300">Cetak (Print)</div>
              <div className="text-[8px] text-app-muted">Cetak halaman MPI via browser</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-app-border/30" />

          {/* ── Lanjutan (Advanced) Submenu ── */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="px-3 py-2 gap-2 text-[11px] font-semibold text-app-muted hover:text-app-secondary cursor-pointer">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>settings</span>
              <span>Lanjutan</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-app-surface border border-app-border shadow-md rounded-xl p-1 min-w-[180px]">
              <DropdownMenuItem
                onClick={clearCanvas}
                className="px-2.5 py-2 gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-red-400/60" style={{ fontSize: '14px' }}>delete</span>
                <span className="text-[11px] text-red-400/80">Bersihkan Canvas</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportJson}
                className="px-2.5 py-2 gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-app-secondary" style={ { fontSize: '14px' } }>data_object</span>
                <span className="text-[11px]">Export JSON</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-app-border/30" />
              <DropdownMenuItem
                onClick={() => useAuthoringStore.getState().toggleSuaraAll()}
                className="px-2.5 py-2 gap-2 cursor-pointer"
              >
                {soundOn
                  ? <span className="material-symbols-outlined text-emerald-400" style={ { fontSize: '14px' } }>volume_up</span>
                  : <span className="material-symbols-outlined text-app-muted" style={ { fontSize: '14px' } }>volume_off</span>
                }
                <span className="text-[11px]">{soundOn ? 'Matikan Suara' : 'Nyalakan Suara'}</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

    </>
  );
}
