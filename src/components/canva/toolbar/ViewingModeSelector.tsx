'use client';

// ═══════════════════════════════════════════════════════════════
// VIEWING MODE SELECTOR — Switch between educational display modes
// ═══════════════════════════════════════════════════════════════
// "Terbaca dari belakang kelas" > "Cantik di Behance"
//
// 4 modes:
//   🏫 Kelas      — Lights on, white bg, standard classroom
//   📽️ Proyektor  — Lights off, warm bg (#FFFBF0), reduced glare
//   🖨️ Cetak      — Black & white, fotokopi-friendly
//   💻 Layar      — Laptop/tablet individual study
//
// This is a TEACHER-FACING control — it affects how content
// looks on the canvas, not the app chrome.
// ═══════════════════════════════════════════════════════════════

import { useCanvaStore } from '@/store/canva-store';
import type { EduViewingMode } from '@/core/themes/education-colors';
import { Monitor, Projector, Printer, Laptop } from 'lucide-react';

const VIEWING_MODE_CONFIG: Record<EduViewingMode, {
  icon: typeof Monitor;
  label: string;
  shortLabel: string;
  description: string;
  bgColor: string; // Tailwind bg class for indicator
}> = {
  classroom: {
    icon: Monitor,
    label: 'Kelas',
    shortLabel: '🏫',
    description: 'Lampu nyala, latar putih — mode kelas standar',
    bgColor: 'bg-blue-500',
  },
  projector: {
    icon: Projector,
    label: 'Proyektor',
    shortLabel: '📽️',
    description: 'Lampu mati, latar hangat — kurangi silau proyektor',
    bgColor: 'bg-amber-500',
  },
  print: {
    icon: Printer,
    label: 'Cetak',
    shortLabel: '🖨️',
    description: 'Hitam-putih — ramah fotokopi',
    bgColor: 'bg-gray-500',
  },
  'student-screen': {
    icon: Laptop,
    label: 'Layar',
    shortLabel: '💻',
    description: 'Laptop/HP — untuk belajar mandiri',
    bgColor: 'bg-teal-500',
  },
};

const MODES: EduViewingMode[] = ['classroom', 'projector', 'print', 'student-screen'];

export function ViewingModeSelector() {
  const eduViewingMode = useCanvaStore(s => s.eduViewingMode);
  const setEduViewingMode = useCanvaStore(s => s.setEduViewingMode);

  const current = VIEWING_MODE_CONFIG[eduViewingMode];

  return (
    <div className="flex items-center gap-0.5">
      {MODES.map((mode) => {
        const config = VIEWING_MODE_CONFIG[mode];
        const Icon = config.icon;
        const isActive = eduViewingMode === mode;

        return (
          <button
            key={mode}
            onClick={() => setEduViewingMode(mode)}
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
