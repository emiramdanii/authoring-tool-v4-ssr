// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Teacher Mode Slice
// ═══════════════════════════════════════════════════════════════
// Controls whether the UI shows simplified (teacher-friendly)
// labels or full technical labels.
//
// Default: true (teachers see simple mode by default)
// Persists to localStorage so the preference survives refresh.
// ═══════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';

const TEACHER_MODE_KEY = 'silse_teacher_mode';

/** Read initial value from localStorage; default = true (simple mode) */
function getInitialTeacherMode(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(TEACHER_MODE_KEY);
    if (stored === 'lengkap' || stored === 'false') return false;
    // Default to true for teachers
    return true;
  } catch {
    return true;
  }
}

export type TeacherModeSlice = Pick<
  CanvaState,
  'teacherMode' | 'toggleTeacherMode' | 'setTeacherMode'
>;

export const createTeacherModeSlice: StateCreator<CanvaState, [], [], TeacherModeSlice> = (set) => ({
  /** true = simple/teacher mode, false = advanced/technical mode */
  teacherMode: getInitialTeacherMode(),

  /** Toggle between teacher and advanced mode */
  toggleTeacherMode: () =>
    set((state) => {
      const next = !state.teacherMode;
      if (typeof window !== 'undefined') {
        localStorage.setItem(TEACHER_MODE_KEY, next ? 'sederhana' : 'lengkap');
      }
      return { teacherMode: next };
    }),

  /** Set teacher mode explicitly */
  setTeacherMode: (mode: boolean) =>
    set(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(TEACHER_MODE_KEY, mode ? 'sederhana' : 'lengkap');
      }
      return { teacherMode: mode };
    }),
});
