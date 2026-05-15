'use client';

// ═══════════════════════════════════════════════════════════════════
// TEACHER MODE TOGGLE — Switches between Lengkap & Sederhana modes
// ═══════════════════════════════════════════════════════════════════
// Small toggle in the AuthoringTool sidebar that switches between:
//   - Mode Lengkap (Full mode) — for power users, shows all technical details
//   - Mode Sederhana (Simple mode) — for teachers, hides technical jargon
//
// Persists preference to localStorage via the authoring store.
// ═══════════════════════════════════════════════════════════════════

import { GraduationCap, Code2 } from 'lucide-react';
import { useAuthoringStore } from '@/store/authoring-store';
import type { TeacherMode } from '@/core/i18n/teacher-terminology';

export default function TeacherModeToggle() {
  const teacherMode = useAuthoringStore((s) => s.teacherMode);
  const setTeacherMode = useAuthoringStore((s) => s.setTeacherMode);

  const isSederhana = teacherMode === 'sederhana';

  const toggle = () => {
    const next: TeacherMode = isSederhana ? 'lengkap' : 'sederhana';
    setTeacherMode(next);
  };

  return (
    <button
      onClick={toggle}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors ${
        isSederhana
          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15'
          : 'bg-app-elevated/60 border border-app-border/30 text-app-secondary hover:bg-app-elevated/80 hover:text-app-primary'
      }`}
      title={isSederhana ? 'Mode Sederhana — istilah guru' : 'Mode Lengkap — istilah teknis'}
    >
      {isSederhana ? (
        <GraduationCap size={16} className="flex-shrink-0" />
      ) : (
        <Code2 size={16} className="flex-shrink-0" />
      )}
      <span className="flex-1 text-left">
        {isSederhana ? 'Mode Sederhana' : 'Mode Lengkap'}
      </span>
      <span className={`text-[8px] px-1.5 py-0.5 rounded-md ${
        isSederhana
          ? 'bg-emerald-500/20 text-emerald-300'
          : 'bg-app-elevated text-app-muted'
      }`}>
        {isSederhana ? 'Guru' : 'Dev'}
      </span>
    </button>
  );
}
