'use client';

// ═══════════════════════════════════════════════════════════════
// VIEWING MODE SELECTOR — Switch between educational display modes
// ═══════════════════════════════════════════════════════════════
// "Terbaca dari belakang kelas" > "Cantik di Behance"
//
// 4 modes (EduDisplayMode — single source of truth from core/edu/):
//   classroom — Lights on, white bg, standard classroom
//   projector — Lights off, warm bg (#FFFBF0), reduced glare
//   print     — Black & white, fotokopi-friendly
//   student   — Laptop/tablet individual study
//
// Source of Truth: @/core/edu/education-typography (EduDisplayMode)
// Store: session-slice.ts (displayMode / setDisplayMode)
// ═══════════════════════════════════════════════════════════════

import { useCanvaStore } from '@/store/canva-store';
import type { EduDisplayMode } from '@/core/edu';
import { Monitor, Projector, Printer, Laptop } from 'lucide-react';

const VIEWING_MODE_CONFIG: Record<EduDisplayMode, {
  icon: typeof Monitor;
  label: string;
  shortLabel: string;
  description: string;
  bgColor: string;
}> = {
  classroom: {
    icon: Monitor,
    label: 'Kelas',
    shortLabel: '\u{1F3EB}',
    description: 'Lampu nyala, latar putih — mode kelas standar',
    bgColor: 'bg-blue-500',
  },
  projector: {
    icon: Projector,
    label: 'Proyektor',
    shortLabel: '\u{1F4FD}',
    description: 'Lampu mati, latar hangat — kurangi silau proyektor',
    bgColor: 'bg-amber-500',
  },
  print: {
    icon: Printer,
    label: 'Cetak',
    shortLabel: '\u{1F5A8}',
    description: 'Hitam-putih — ramah fotokopi',
    bgColor: 'bg-gray-500',
  },
  student: {
    icon: Laptop,
    label: 'Layar',
    shortLabel: '\u{1F4BB}',
    description: 'Laptop/HP — untuk belajar mandiri',
    bgColor: 'bg-teal-500',
  },
};

const MODES: EduDisplayMode[] = ['classroom', 'projector', 'print', 'student'];

export function ViewingModeSelector() {
  const displayMode = useCanvaStore(s => s.displayMode);
  const setDisplayMode = useCanvaStore(s => s.setDisplayMode);

  const current = VIEWING_MODE_CONFIG[displayMode];

  return (
    <div className="flex items-center gap-0.5">
      {MODES.map((mode) => {
        const config = VIEWING_MODE_CONFIG[mode];
        const Icon = config.icon;
        const isActive = displayMode === mode;

        return (
          <button
            key={mode}
            onClick={() => setDisplayMode(mode)}
            title={config.description}
            className={`
              relative flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium
              transition-all duration-150 ease-out cursor-pointer
              focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500
              ${isActive
                ? 'bg-app-accent/12 text-app-accent'
                : 'text-app-muted hover:text-app-primary hover:bg-black/[0.04]'
              }
            `}
          >
            <Icon size={12} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className="hidden lg:inline">{config.label}</span>
            {isActive && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3/4 h-[2px] rounded-full bg-app-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
}
