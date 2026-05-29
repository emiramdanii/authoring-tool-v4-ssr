// ═══════════════════════════════════════════════════════════════════
// STATUS TOAST — Undo/Redo feedback + Unified Auto-save indicator
// ═══════════════════════════════════════════════════════════════════
// Shows transient toast messages for undo/redo operations and a
// unified save status indicator in the toolbar that covers both
// canva and authoring stores.
//
// Save status states:
//   - 'unsaved'  → Red dot + "Belum tersimpan" (changes pending)
//   - 'saving'   → Amber spinner + "Menyimpan..."  (actively saving)
//   - 'saved'    → Green checkmark + "Tersimpan"   (auto-hides after 3s)
//   - 'error'    → Red error + "Gagal simpan" with retry button
// ═══════════════════════════════════════════════════════════════════

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useDirtyStore } from '@/store/dirty-store';
import { Save, Check, AlertCircle, Loader2, RotateCcw, Undo2, Redo2, Clock } from 'lucide-react';

// ── Undo/Redo Toast ─────────────────────────────────────────────

interface UndoRedoToastState {
  message: string;
  visible: boolean;
}

let toastTimeout: ReturnType<typeof setTimeout> | null = null;
let setToastExternal: ((state: UndoRedoToastState | ((prev: UndoRedoToastState) => UndoRedoToastState)) => void) | null = null;

export function showUndoRedoToast(message: string) {
  if (setToastExternal) {
    setToastExternal({ message, visible: true });
  }
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    if (setToastExternal) {
      setToastExternal(prev => ({ ...prev, visible: false }));
    }
  }, 1500);
}

export const UndoRedoToast: React.FC = React.memo(function UndoRedoToast() {
  const [toast, setToast] = useState<UndoRedoToastState>({ message: '', visible: false });

  useEffect(() => {
    setToastExternal = setToast;
    return () => { setToastExternal = null; };
  }, []);

  if (!toast.visible) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold shadow-lg border animate-in fade-in slide-in-from-top-2 duration-200"
        style={{
          background: 'var(--semantic-bg-elevated, #1c1c1f)',
          color: 'var(--semantic-accent, #f59e0b)',
          borderColor: 'var(--semantic-accent, #f59e0b)33',
        }}>
        <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>refresh</span>
        {toast.message}
      </div>
    </div>
  );
});

// ── Unified Save Status Indicator ──────────────────────────────────

type SaveStatus = 'unsaved' | 'saving' | 'saved' | 'error';

export const AutoSaveIndicator: React.FC = React.memo(function AutoSaveIndicator() {
  const canvaStatus = useCanvaStore(s => s._saveStatus as SaveStatus | undefined);
  const authoringDirty = useDirtyStore(s => s.dirty);  // Phase 5: migrated from useAuthoringStore
  const lastSavedAt = useCanvaStore(s => s._lastSavedAt);
  const teacherMode = useAuthoringStore(s => s.teacherMode);

  // Combine status: if authoring is dirty and canva is saved, still show unsaved
  const status: SaveStatus = (() => {
    const cs = canvaStatus || 'unsaved';
    // If canva is saved but authoring is still dirty, show unsaved
    if (cs === 'saved' && authoringDirty) return 'unsaved';
    // If canva is in error, that takes priority
    if (cs === 'error') return 'error';
    return cs;
  })();

  const isSederhana = teacherMode;

  // Format timestamp for display
  const timeLabel = useCallback((): string | null => {
    if (!lastSavedAt || status === 'unsaved') return null;
    const diff = Date.now() - lastSavedAt;
    if (diff < 60_000) return 'Baru saja';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m lalu`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}j lalu`;
    return `${Math.floor(diff / 86_400_000)}h lalu`;
  }, [lastSavedAt, status]);

  // Auto-hide "saved" indicator after 3 seconds
  const [showSaved, setShowSaved] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === 'saved') {
      setShowSaved(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setShowSaved(false), 3000);
    } else {
      setShowSaved(false);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [status]);

  // Retry handler
  const handleRetry = useCallback(() => {
    useCanvaStore.getState().saveToStorage();
    useAuthoringStore.getState().saveToStorage();
  }, []);

  // Don't render anything for saved when auto-hidden
  if (status === 'saved' && !showSaved) return null;

  const config: Record<SaveStatus, { icon: React.ReactNode; label: string; bgColor: string; textColor: string; borderColor: string }> = {
    unsaved: {
      icon: <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />,
      label: isSederhana ? 'Belum simpan' : 'Belum tersimpan',
      bgColor: 'color-mix(in srgb, var(--silse-error) 8%, transparent)',
      textColor: 'var(--silse-error)',
      borderColor: 'color-mix(in srgb, var(--silse-error) 20%, transparent)',
    },
    saving: {
      icon: <span className="material-symbols-outlined animate-spin" style={ { fontSize: '12px' } }>progress_activity</span>,
      label: 'Menyimpan...',
      bgColor: 'color-mix(in srgb, var(--silse-tertiary) 8%, transparent)',
      textColor: 'var(--silse-tertiary)',
      borderColor: 'color-mix(in srgb, var(--silse-tertiary) 20%, transparent)',
    },
    saved: {
      icon: <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>check</span>,
      label: isSederhana ? 'Tersimpan' : 'Tersimpan',
      bgColor: 'color-mix(in srgb, var(--silse-primary) 8%, transparent)',
      textColor: 'var(--silse-primary)',
      borderColor: 'color-mix(in srgb, var(--silse-primary) 20%, transparent)',
    },
    error: {
      icon: <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>error</span>,
      label: isSederhana ? 'Gagal simpan' : 'Gagal simpan',
      bgColor: 'color-mix(in srgb, var(--silse-error) 8%, transparent)',
      textColor: 'var(--silse-error)',
      borderColor: 'color-mix(in srgb, var(--silse-error) 20%, transparent)',
    },
  };

  const { icon, label, bgColor, textColor, borderColor } = config[status];
  const savedTime = timeLabel();

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-300"
      style={{
        background: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
      }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {icon}
      <span>{label}</span>
      {savedTime && status === 'saved' && (
        <span className="text-[8px] opacity-60 flex items-center gap-0.5 ml-0.5">
          <span className="material-symbols-outlined" style={ { fontSize: '8px' } }>schedule</span>
          {savedTime}
        </span>
      )}
      {status === 'error' && (
        <button
          onClick={handleRetry}
          className="ml-1 p-0.5 rounded hover:bg-red-500/20 transition-colors"
          title="Coba simpan lagi"
        >
          <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>refresh</span>
        </button>
      )}
    </div>
  );
});

// ── Save Now Button ────────────────────────────────────────────────
// Forces an immediate save of both canva and authoring stores.

export const SaveNowButton: React.FC = React.memo(function SaveNowButton() {
  const [saving, setSaving] = useState(false);

  const handleSaveNow = useCallback(async () => {
    setSaving(true);
    try {
      useCanvaStore.getState().saveToStorage();
      useAuthoringStore.getState().saveToStorage();
    } finally {
      // Brief visual feedback
      setTimeout(() => setSaving(false), 400);
    }
  }, []);

  return (
    <button
      onClick={handleSaveNow}
      disabled={saving}
      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-semibold transition-colors bg-app-elevated/60 text-app-muted hover:text-app-accent hover:bg-app-accent/10 border border-app-border/30 hover:border-app-accent/20 disabled:opacity-50"
      title="Simpan Sekarang (Ctrl+S)"
    >
      {saving ? (
        <span className="material-symbols-outlined animate-spin" style={ { fontSize: '10px' } }>progress_activity</span>
      ) : (
        <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>save</span>
      )}
      <span className="hidden sm:inline">Simpan</span>
    </button>
  );
});

// ── Undo/Redo Toolbar Buttons ─────────────────────────────────────
// Visual undo/redo buttons for the toolbar — clickable with keyboard
// shortcut hint. Especially useful in sederhana mode where users may
// not know Ctrl+Z / Ctrl+Shift+Z.

export const UndoRedoButtons: React.FC = React.memo(function UndoRedoButtons() {
  const undo = useCanvaStore(s => s.undo);
  const redo = useCanvaStore(s => s.redo);
  const canUndo = useCanvaStore(s => s.canUndo);
  const canRedo = useCanvaStore(s => s.canRedo);

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => { if (canUndo()) undo(); }}
        disabled={!canUndo()}
        className="p-1.5 rounded-md text-app-muted hover:text-app-secondary hover:bg-app-elevated/60 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        title="Kembalikan (Ctrl+Z)"
        aria-label="Kembalikan"
      >
        <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>undo</span>
      </button>
      <button
        onClick={() => { if (canRedo()) redo(); }}
        disabled={!canRedo()}
        className="p-1.5 rounded-md text-app-muted hover:text-app-secondary hover:bg-app-elevated/60 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        title="Ulangi (Ctrl+Shift+Z)"
        aria-label="Ulangi"
      >
        <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>redo</span>
      </button>
    </div>
  );
});
