'use client';

import { useCanvaStore } from '@/store/canva-store';
import { useExportActions } from './use-export-actions';
import { AutoSaveIndicator, SaveNowButton } from '@/components/shared/StatusToast';
import TeacherModeToggle from '@/components/shared/TeacherModeToggle';
import { ToolbarExport } from './ToolbarExport';
import { Download, Loader2, PanelRightOpen, PanelRightClose, Undo2, Redo2, HelpCircle } from 'lucide-react';
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
      {/* Undo / Redo — always visible, disabled when nothing to undo/redo */}
      <button
        onClick={undo}
        disabled={!canUndo()}
        className={`flex items-center justify-center h-7 w-7 rounded-lg transition-[background-color,border-color,color] ${
          canUndo()
            ? 'text-app-secondary hover:text-app-primary hover:bg-app-elevated/50'
            : 'text-app-muted/30 cursor-not-allowed'
        }`}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={14} />
      </button>
      <button
        onClick={redo}
        disabled={!canRedo()}
        className={`flex items-center justify-center h-7 w-7 rounded-lg transition-[background-color,border-color,color] ${
          canRedo()
            ? 'text-app-secondary hover:text-app-primary hover:bg-app-elevated/50'
            : 'text-app-muted/30 cursor-not-allowed'
        }`}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={14} />
      </button>

      <div className="section-divider h-5 w-px mx-0.5" />

      {/* Teacher Mode Toggle */}
      <TeacherModeToggle />

      {/* Auto-save indicator — hidden in teacher mode (shown in StatusBar instead) */}
      {!teacherMode && <AutoSaveIndicator />}
      <SaveNowButton />

      <div className="section-divider h-5 w-px mx-1" />

      {/* Toggle Right Panel */}
      <button
        onClick={toggleRightPanel}
        className={`flex items-center justify-center h-7 w-7 rounded-lg transition-[background-color,border-color,color] ${
          rightPanelOpen
            ? 'bg-app-accent/10 text-app-accent hover:bg-app-accent/20'
            : 'text-app-muted hover:text-app-secondary hover:bg-app-elevated/50'
        }`}
        title={rightPanelOpen ? 'Tutup panel properti' : 'Buka panel properti'}
      >
        {rightPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
      </button>

      {/* Bantuan / Help — re-trigger Canva Tour or Orientation */}
      <button
        onClick={() => {
          if (isSederhana) {
            triggerCanvaOrientation();
          } else {
            triggerCanvaTour();
          }
        }}
        className="flex items-center justify-center h-7 w-7 rounded-lg text-app-muted hover:text-app-accent hover:bg-app-accent/10 transition-[background-color,border-color,color]"
        title={isSederhana ? 'Bantuan — tampilkan panduan' : 'Help — restart tour'}
      >
        <HelpCircle size={14} />
      </button>

      {/* One-click HTML Export — prominent CTA for teachers */}
      <button
        onClick={exportHtml}
        disabled={isExporting}
        className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-app-success/90 hover:bg-app-success text-white text-[10px] font-bold transition-[background-color,border-color] shadow-sm hover:shadow disabled:opacity-50"
        title="Unduh HTML — siap dibagikan ke siswa"
      >
        {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        <span className="hidden sm:inline">Ekspor</span>
      </button>

      {/* Export (advanced options dropdown) — only in advanced mode */}
      {!teacherMode && <ToolbarExport />}
    </div>
  );
}
