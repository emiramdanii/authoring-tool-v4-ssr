'use client';

import { Button } from '@/components/ui/button';
import { Edit3, Eye, Presentation } from 'lucide-react';
import type { AppMode } from '@/components/canva/types';

// ═══════════════════════════════════════════════════════════════
// MODE SWITCH — [EDIT] [PREVIEW] [PRESENT] pill toggle
// ═══════════════════════════════════════════════════════════════

interface ModeSwitchProps {
  appMode: AppMode;
  setAppMode: (m: AppMode) => void;
}

const MODES: { id: AppMode; label: string; icon: React.ReactNode }[] = [
  { id: 'edit', label: 'Edit', icon: <Edit3 size={12} /> },
  { id: 'preview', label: 'Preview', icon: <Eye size={12} /> },
  { id: 'present', label: 'Present', icon: <Presentation size={12} /> },
];

export function ModeSwitch({ appMode, setAppMode }: ModeSwitchProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-app-elevated p-0.5">
      {MODES.map((m) => {
        const isActive = appMode === m.id;
        return (
          <Button
            key={m.id}
            variant="ghost"
            size="sm"
            onClick={() => setAppMode(m.id)}
            className={`h-6 px-2.5 gap-1 text-[10px] font-bold transition-all rounded-full ${
              isActive
                ? 'bg-app-accent text-app-inverse shadow-sm'
                : 'text-app-muted hover:text-app-secondary'
            }`}
          >
            {m.icon}
            <span className="hidden sm:inline">{m.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
