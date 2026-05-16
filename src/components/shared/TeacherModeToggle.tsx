'use client';

// ═══════════════════════════════════════════════════════════════════
// TEACHER MODE TOGGLE — Switches between Guru (simple) & Lanjutan modes
// ═══════════════════════════════════════════════════════════════════
// Clean toggle button for the header area:
//   - Mode Guru (Teacher mode) — GraduationCap icon, simplified labels
//   - Mode Lanjutan (Advanced mode) — Settings icon, full technical labels
//
// Persists preference to localStorage via the canva store.
// Also syncs with the authoring store for consistency.
// ═══════════════════════════════════════════════════════════════════

import { GraduationCap, Settings } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';

export default function TeacherModeToggle() {
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const toggleTeacherMode = useCanvaStore(s => s.toggleTeacherMode);
  const setAuthoringMode = useAuthoringStore(s => s.setTeacherMode);

  const handleToggle = () => {
    toggleTeacherMode();
    // Sync with authoring store for consistency
    const nextMode = !teacherMode;
    setAuthoringMode(nextMode ? 'sederhana' : 'lengkap');
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
        teacherMode
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/30'
          : 'bg-app-elevated/60 border-app-border/30 text-app-secondary hover:bg-app-elevated/80 hover:text-app-primary'
      }`}
      title={teacherMode ? 'Mode Guru — istilah sederhana' : 'Mode Lanjutan — istilah teknis'}
    >
      {teacherMode ? (
        <GraduationCap size={14} className="flex-shrink-0" />
      ) : (
        <Settings size={14} className="flex-shrink-0" />
      )}
      <span className="hidden sm:inline">
        {teacherMode ? 'Mode Guru' : 'Mode Lanjutan'}
      </span>
      <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold ${
        teacherMode
          ? 'bg-emerald-500/20 text-emerald-300'
          : 'bg-app-elevated text-app-muted'
      }`}>
        {teacherMode ? 'Guru' : 'Dev'}
      </span>
    </button>
  );
}
