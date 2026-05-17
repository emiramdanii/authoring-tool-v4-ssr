'use client';

import { useCanvaStore } from '@/store/canva-store';
import { useExportActions } from './use-export-actions';
import { AutoSaveIndicator, SaveNowButton } from '@/components/shared/StatusToast';
import TeacherModeToggle from '@/components/shared/TeacherModeToggle';
import { ToolbarExport } from './ToolbarExport';
import { Download, Loader2, PanelRightOpen, PanelRightClose } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// QUICK ACTIONS — Save, Export, Command palette button
// ═══════════════════════════════════════════════════════════════

export function QuickActions() {
  const { exportHtml, isExporting } = useExportActions();
  const rightPanelOpen = useCanvaStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useCanvaStore((s) => s.toggleRightPanel);

  return (
    <div className="flex items-center gap-1">
      {/* Teacher Mode Toggle */}
      <TeacherModeToggle />

      {/* Auto-save indicator */}
      <AutoSaveIndicator />
      <SaveNowButton />

      <div className="section-divider h-5 w-px mx-1" />

      {/* Toggle Right Panel */}
      <button
        onClick={toggleRightPanel}
        className={`flex items-center justify-center h-7 w-7 rounded-lg transition-all ${
          rightPanelOpen
            ? 'bg-app-accent/10 text-app-accent hover:bg-app-accent/20'
            : 'text-app-muted hover:text-app-secondary hover:bg-app-elevated/50'
        }`}
        title={rightPanelOpen ? 'Tutup panel properti' : 'Buka panel properti'}
      >
        {rightPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
      </button>

      {/* One-click HTML Export — prominent CTA for teachers */}
      <button
        onClick={exportHtml}
        disabled={isExporting}
        className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-app-success/90 hover:bg-app-success text-white text-[10px] font-bold transition-all shadow-sm hover:shadow disabled:opacity-50"
        title="Download HTML — siap dibagikan ke siswa"
      >
        {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        <span className="hidden sm:inline">Export</span>
      </button>

      {/* Export (advanced options dropdown) */}
      <ToolbarExport />
    </div>
  );
}
