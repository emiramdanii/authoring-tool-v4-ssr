// ═══════════════════════════════════════════════════════════════════
// USE TEACHER MODE — Unified hook for teacher/advanced mode
// ═══════════════════════════════════════════════════════════════════
// Consolidates the dual-store teacher mode state:
//   - Canva store:  teacherMode (boolean: true=sederhana, false=lengkap)
//   - Authoring store: teacherMode ('sederhana' | 'lengkap')
//
// Both stores are always kept in sync. This hook provides a single
// API to read and toggle the mode, so components don't need to
// import both stores and manually sync.
//
// Usage:
//   const { isSederhana, isLengkap, toggle, setSederhana, setLengkap } = useTeacherMode();
// ═══════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';

export interface TeacherModeState {
  /** true if in sederhana (simple/teacher) mode */
  isSederhana: boolean;
  /** true if in lengkap (advanced/developer) mode */
  isLengkap: boolean;
  /** Toggle between sederhana and lengkap */
  toggle: () => void;
  /** Explicitly set to sederhana mode */
  setSederhana: () => void;
  /** Explicitly set to lengkap mode */
  setLengkap: () => void;
}

export function useTeacherMode(): TeacherModeState {
  const canvaTeacherMode = useCanvaStore(s => s.teacherMode);
  const toggleCanva = useCanvaStore(s => s.toggleTeacherMode);
  const setCanvaMode = useCanvaStore(s => s.setTeacherMode);
  const setAuthoringMode = useAuthoringStore(s => s.setTeacherMode);

  const isSederhana = canvaTeacherMode;
  const isLengkap = !canvaTeacherMode;

  const toggle = useCallback(() => {
    toggleCanva();
    const nextMode = !canvaTeacherMode ? 'sederhana' : 'lengkap';
    setAuthoringMode(nextMode);
  }, [toggleCanva, canvaTeacherMode, setAuthoringMode]);

  const setSederhana = useCallback(() => {
    setCanvaMode(true);
    setAuthoringMode('sederhana');
  }, [setCanvaMode, setAuthoringMode]);

  const setLengkap = useCallback(() => {
    setCanvaMode(false);
    setAuthoringMode('lengkap');
  }, [setCanvaMode, setAuthoringMode]);

  return { isSederhana, isLengkap, toggle, setSederhana, setLengkap };
}
