// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Teacher Mode Slice
// ═══════════════════════════════════════════════════════════════
// Controls whether the UI shows simplified (teacher-friendly)
// labels or full technical labels.
//
// V3-PHASE-1B: teacherMode NO LONGER controls routing. It only
// toggles terminology labels inside MpiWorkspaceV2. The previous
// branch `if (stored === 'lengkap' || stored === 'false') return false`
// is removed because:
//   - It allowed users to fall into the quarantined legacy 3-panel
//     editor when teacherMode was false.
//   - The official editor route is now `appMode === 'edit'` →
//     MpiWorkspaceV2 regardless of teacherMode.
//
// Migration: any persisted 'lengkap' / 'false' value is rewritten to
// 'sederhana' on first read so stale state from old sessions cannot
// cause confusion in components that still read teacherMode for
// label rendering. teacherMode is always true after this slice
// initializes.
// ═══════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';

const TEACHER_MODE_KEY = 'silse_teacher_mode';

/**
 * V3-PHASE-1B: Always returns true. If a stale 'lengkap' / 'false'
 * value is found in localStorage, it is rewritten to 'sederhana' so
 * the persisted state matches the new contract (teacherMode is always
 * true; it no longer gates editor routing).
 */
function getInitialTeacherMode(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(TEACHER_MODE_KEY);
    if (stored === 'lengkap' || stored === 'false') {
      // Migrate stale advanced-mode preference to sederhana.
      localStorage.setItem(TEACHER_MODE_KEY, 'sederhana');
    }
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
