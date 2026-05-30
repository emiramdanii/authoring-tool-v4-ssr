'use client';

import { useCanvaStore } from '@/store/canva-store';
import { useExportActions } from './use-export-actions';
import { AutoSaveIndicator, SaveNowButton } from '@/components/shared/StatusToast';
import TeacherModeToggle from '@/components/shared/TeacherModeToggle';
import { ToolbarExport } from './ToolbarExport';
// All icons migrated to Material Symbols Outlined
import { useTeacherMode } from '@/hooks/use-teacher-mode';

import { triggerCanvaTour } from '@/components/shared/CanvaTour';
import { triggerCanvaOrientation } from '@/components/shared/CanvaOrientationTooltip';

export function QuickActions() {
  const { exportHtml, isExporting } = useExportActions();
  const rightPanelOpen = useCanvaStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useCanvaStore((s) => s.toggleRightPanel);
  const undo = useCanvaStore((s) => s.undo);
  const redo = useCanvaStore((s) => s.redo);
  const canUndo = useCanvaStore((s) => s.canUndo);
  const canRedo = useCanvaStore((s) => s.canRedo);
  const teacherMode = useCanvaStore((s) => s.teacherMode);
  const { isSederhana } = useTeacherMode();

  return (
    <div className="flex items-center gap-1">
      {/* Undo / Redo */}
      <button
        onClick={undo}
        disabled={!canUndo()}
        className={`flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${
          canUndo()
            ? 'text-silse-on-surface-variant hover:text-silse-on-surface hover:bg-silse-surface-container-high'
            : 'text-silse-outline-variant/40 cursor-not-allowed'
        }`}
        title="Undo (Ctrl+Z)"
      >
        <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>undo</span>
      </button>
      <button
        onClick={redo}
        disabled={!canRedo()}
        className={`flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${
          canRedo()
            ? 'text-silse-on-surface-variant hover:text-silse-on-surface hover:bg-silse-surface-container-high'
            : 'text-silse-outline-variant/40 cursor-not-allowed'
        }`}
        title="Redo (Ctrl+Y)"
      >
        <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>redo</span>
      </button>

      <div className="h-5 w-px bg-silse-outline-variant mx-0.5" />

      {/* Teacher Mode Toggle */}
      <TeacherModeToggle />

      {/* Auto-save indicator */}
      {!teacherMode && <AutoSaveIndicator />}
      <SaveNowButton />

      <div className="h-5 w-px bg-silse-outline-variant mx-1" />

      {/* Toggle Right Panel */}
      <button
        onClick={toggleRightPanel}
        className={`flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${
          rightPanelOpen
            ? 'bg-silse-primary-container/20 text-silse-primary hover:bg-silse-primary-container/30'
            : 'text-silse-on-surface-variant hover:text-silse-on-surface hover:bg-silse-surface-container-high'
        }`}
        title={rightPanelOpen ? 'Tutup panel properti' : 'Buka panel properti'}
      >
        {rightPanelOpen ? <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>dock_to_right</span> : <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>dock_to_right</span>}
      </button>

      {/* Help */}
      <button
        onClick={() => {
          if (isSederhana) {
            triggerCanvaOrientation();
          } else {
            triggerCanvaTour();
          }
        }}
        className="flex items-center justify-center h-7 w-7 rounded-lg text-silse-on-surface-variant hover:text-silse-primary hover:bg-silse-primary-container/10 transition-colors"
        title={isSederhana ? 'Bantuan — tampilkan panduan' : 'Help — restart tour'}
      >
        <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>help</span>
      </button>

      {/* Export HTML */}
      <button
        onClick={exportHtml}
        disabled={isExporting}
        className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-silse-primary-container text-silse-on-primary-container text-[10px] font-bold transition-all hover:opacity-90 active:scale-95 shadow-sm disabled:opacity-50"
        title="Unduh HTML — siap dibagikan ke siswa"
      >
        {isExporting ? <span className="material-symbols-outlined animate-spin" style={ { fontSize: '13px' } }>progress_activity</span> : <span className="material-symbols-outlined" style={ { fontSize: '13px' } }>download</span>}
        <span className="hidden sm:inline">Ekspor</span>
      </button>

      {/* Export (advanced options dropdown) — only in advanced mode */}
      {!teacherMode && <ToolbarExport />}
    </div>
  );
}
