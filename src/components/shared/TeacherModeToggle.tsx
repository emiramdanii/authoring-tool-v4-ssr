'use client';

// ═══════════════════════════════════════════════════════════════════
// TEACHER MODE TOGGLE — Switches between Guru (simple) & Lanjutan modes
// ═══════════════════════════════════════════════════════════════════
// Clean toggle button for the header area:
//   - Mode Guru (Teacher mode) — GraduationCap icon, simplified labels
//   - Mode Lanjutan (Advanced mode) — Settings icon, full technical labels
//
// Uses the unified useTeacherMode hook for dual-store sync.
// Persists preference to localStorage via the canva store.
// ═══════════════════════════════════════════════════════════════════

import { GraduationCap, Settings } from 'lucide-react';
import { useTeacherMode } from '@/hooks/use-teacher-mode';

export default function TeacherModeToggle() {
  const { isSederhana, toggle } = useTeacherMode();

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
        isSederhana
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/30'
          : 'bg-app-elevated/60 border-app-border/30 text-app-secondary hover:bg-app-elevated/80 hover:text-app-primary'
      }`}
      title={isSederhana ? 'Mode Guru — istilah sederhana' : 'Mode Lanjutan — istilah teknis'}
    >
      {isSederhana ? (
        <GraduationCap size={14} className="flex-shrink-0" />
      ) : (
        <Settings size={14} className="flex-shrink-0" />
      )}
      <span className="hidden sm:inline">
        {isSederhana ? 'Mode Guru' : 'Mode Lanjutan'}
      </span>
      <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold ${
        isSederhana
          ? 'bg-emerald-500/20 text-emerald-300'
          : 'bg-app-elevated text-app-muted'
      }`}>
        {isSederhana ? 'Guru' : 'Dev'}
      </span>
    </button>
  );
}
