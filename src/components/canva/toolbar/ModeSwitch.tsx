'use client';

import { Button } from '@/components/ui/button';
// All icons migrated to Material Symbols Outlined
import type { AppMode } from '@/components/canva/types';
import { useTeacherMode } from '@/hooks/use-teacher-mode';

// ═══════════════════════════════════════════════════════════════
// MODE SWITCH — [EDIT] [PREVIEW] [PRESENT] pill toggle
// ═══════════════════════════════════════════════════════════════
// Teacher-mode aware labels:
//   Sederhana: Edit → Sunting, Preview → Pratinjau, Present → Tayangkan
//   Lengkap:   Edit, Preview, Present

interface ModeSwitchProps {
  appMode: AppMode;
  setAppMode: (m: AppMode) => void;
}

export function ModeSwitch({ appMode, setAppMode }: ModeSwitchProps) {
  const { isSederhana } = useTeacherMode();

  const MODES: { id: AppMode; label: string; labelSederhana: string; icon: React.ReactNode }[] = [
    { id: 'edit', label: 'Edit', labelSederhana: 'Sunting', icon: <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>edit</span> },
    { id: 'preview', label: 'Preview', labelSederhana: 'Pratinjau', icon: <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>visibility</span> },
    { id: 'present', label: 'Present', labelSederhana: 'Tayangkan', icon: <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>slideshow</span> },
  ];

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-app-elevated p-0.5">
      {MODES.map((m) => {
        const isActive = appMode === m.id;
        const displayLabel = isSederhana ? m.labelSederhana : m.label;
        return (
          <Button
            key={m.id}
            variant="ghost"
            size="sm"
            onClick={() => setAppMode(m.id)}
            className={`h-6 px-2.5 gap-1 text-[10px] font-bold transition-[background-color,border-color] rounded-full ${
              isActive
                ? 'bg-app-accent text-app-inverse shadow-sm'
                : 'text-app-muted hover:text-app-secondary'
            }`}
          >
            {m.icon}
            <span className="hidden sm:inline">{displayLabel}</span>
          </Button>
        );
      })}
    </div>
  );
}
