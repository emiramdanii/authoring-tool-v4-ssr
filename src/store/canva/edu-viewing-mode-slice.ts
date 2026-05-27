// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Educational Viewing Mode Slice
// ═══════════════════════════════════════════════════════════════
// Controls how canvas content is displayed based on the viewing
// environment. This affects colors, contrast, spacing, and text
// sizes through the Educational Design System.
//
// 4 modes:
//   classroom     — Lights on, whiteboard-style (default)
//   projector     — Lights off, warm tinted bg (#FFFBF0), reduced glare
//   print         — Black & white photocopy optimized
//   student-screen — Laptop/tablet individual study
//
// Persists to localStorage so the preference survives refresh.
// ═══════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { EduViewingMode } from '@/core/themes/education-colors';

const EDU_VIEWING_MODE_KEY = 'silse_edu_viewing_mode';

/** Read initial value from localStorage; default = 'classroom' */
function getInitialEduViewingMode(): EduViewingMode {
  if (typeof window === 'undefined') return 'classroom';
  try {
    const stored = localStorage.getItem(EDU_VIEWING_MODE_KEY);
    if (stored === 'projector' || stored === 'print' || stored === 'student-screen') {
      return stored;
    }
    return 'classroom';
  } catch {
    return 'classroom';
  }
}

export type EduViewingModeSlice = Pick<
  CanvaState,
  'eduViewingMode' | 'setEduViewingMode' | 'cycleEduViewingMode'
>;

export const createEduViewingModeSlice: StateCreator<CanvaState, [], [], EduViewingModeSlice> = (set) => ({
  /** Current educational viewing mode — defaults to 'classroom' */
  eduViewingMode: getInitialEduViewingMode(),

  /** Set the educational viewing mode explicitly */
  setEduViewingMode: (mode: EduViewingMode) =>
    set(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(EDU_VIEWING_MODE_KEY, mode);
      }
      return { eduViewingMode: mode };
    }),

  /** Cycle through viewing modes: classroom → projector → print → student-screen → classroom */
  cycleEduViewingMode: () =>
    set((state) => {
      const cycle: EduViewingMode[] = ['classroom', 'projector', 'print', 'student-screen'];
      const currentIdx = cycle.indexOf(state.eduViewingMode);
      const next = cycle[(currentIdx + 1) % cycle.length];
      if (typeof window !== 'undefined') {
        localStorage.setItem(EDU_VIEWING_MODE_KEY, next);
      }
      return { eduViewingMode: next };
    }),
});
