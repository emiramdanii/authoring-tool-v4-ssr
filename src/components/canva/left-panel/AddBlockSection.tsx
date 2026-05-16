'use client';

import { useAuthoringStore } from '@/store/authoring-store';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import AddBlockPanel from './AddBlockPanel';

// ═══════════════════════════════════════════════════════════════
// ADD BLOCK SECTION — Collapsible add-block panel header
// ═══════════════════════════════════════════════════════════════

interface AddBlockSectionProps {
  addBlockOpen: boolean;
  onToggle: () => void;
}

export function AddBlockSection({ addBlockOpen, onToggle }: AddBlockSectionProps) {
  const teacherMode = useAuthoringStore(s => s.teacherMode);
  const sectionLabel = teacherMode === 'sederhana' ? 'Tambah Konten' : 'Tambah Block';

  return (
    <div className="border border-app-border/30 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-app-accent-secondary uppercase tracking-wider bg-app-accent-secondary/5 hover:bg-app-accent-secondary/10 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Plus size={10} />
          {sectionLabel}
        </span>
        {addBlockOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {addBlockOpen && (
        <div className="p-2 border-t border-app-border/20">
          <AddBlockPanel />
        </div>
      )}
    </div>
  );
}
