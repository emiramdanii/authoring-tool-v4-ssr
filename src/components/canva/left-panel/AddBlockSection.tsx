'use client';

import { useCanvaStore } from '@/store/canva-store';
// All icons migrated to Material Symbols Outlined
import AddBlockPanel from './AddBlockPanel';

// ═══════════════════════════════════════════════════════════════
// ADD BLOCK SECTION — Collapsible add-block panel header
// ═══════════════════════════════════════════════════════════════

interface AddBlockSectionProps {
  addBlockOpen: boolean;
  onToggle: () => void;
}

export function AddBlockSection({ addBlockOpen, onToggle }: AddBlockSectionProps) {
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const sectionLabel = teacherMode ? 'Tambah Konten' : 'Tambah Block';

  return (
    <div className="border border-silse-outline-variant rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-silse-secondary uppercase tracking-wider bg-silse-secondary/5 hover:bg-silse-secondary/10 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>add</span>
          {sectionLabel}
        </span>
        {addBlockOpen ? <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>expand_more</span> : <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>chevron_right</span>}
      </button>
      {addBlockOpen && (
        <div className="p-2 border-t border-silse-outline-variant/20">
          <AddBlockPanel />
        </div>
      )}
    </div>
  );
}
