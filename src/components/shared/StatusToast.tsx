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
import { Save, Check, AlertCircle, Loader2, RotateCcw } from 'lucide-react';

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
      <div className="px-4 py-2 rounded-lg text-xs font-bold shadow-lg border animate-in fade-in slide-in-from-top-2 duration-200"
        style={{
          background: 'var(--background, #182d45)',
          color: 'var(--foreground, #e8f2ff)',
          borderColor: 'rgba(255,255,255,0.1)',
        }}>
        {toast.message}
      </div>
    </div>
  );
});

// ── Unified Save Status Indicator ──────────────────────────────────

type SaveStatus = 'unsaved' | 'saving' | 'saved' | 'error';

export const AutoSaveIndicator: React.FC = React.memo(function AutoSaveIndicator() {
  const canvaStatus = useCanvaStore(s => s._saveStatus as SaveStatus | undefined);
  const authoringDirty = useAuthoringStore(s => s.dirty);

  // Combine status: if authoring is dirty and canva is saved, still show unsaved
  const status: SaveStatus = (() => {
    const cs = canvaStatus || 'unsaved';
    // If canva is saved but authoring is still dirty, show unsaved
    if (cs === 'saved' && authoringDirty) return 'unsaved';
    // If canva is in error, that takes priority
    if (cs === 'error') return 'error';
    return cs;
  })();

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
      icon: <span className="inline-block w-2 h-2 rounded-full bg-red-400" />,
      label: 'Belum tersimpan',
      bgColor: 'rgba(248,113,113,0.08)',
      textColor: '#f87171',
      borderColor: 'rgba(248,113,113,0.2)',
    },
    saving: {
      icon: <Loader2 size={12} className="animate-spin" />,
      label: 'Menyimpan...',
      bgColor: 'rgba(251,191,36,0.08)',
      textColor: '#fbbf24',
      borderColor: 'rgba(251,191,36,0.2)',
    },
    saved: {
      icon: <Check size={12} />,
      label: 'Tersimpan',
      bgColor: 'rgba(52,211,153,0.08)',
      textColor: '#34d399',
      borderColor: 'rgba(52,211,153,0.2)',
    },
    error: {
      icon: <AlertCircle size={12} />,
      label: 'Gagal simpan',
      bgColor: 'rgba(248,113,113,0.08)',
      textColor: '#f87171',
      borderColor: 'rgba(248,113,113,0.2)',
    },
  };

  const { icon, label, bgColor, textColor, borderColor } = config[status];

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
      {status === 'error' && (
        <button
          onClick={handleRetry}
          className="ml-1 p-0.5 rounded hover:bg-red-500/20 transition-colors"
          title="Coba simpan lagi"
        >
          <RotateCcw size={10} />
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
        <Loader2 size={10} className="animate-spin" />
      ) : (
        <Save size={10} />
      )}
      <span className="hidden sm:inline">Simpan</span>
    </button>
  );
});
