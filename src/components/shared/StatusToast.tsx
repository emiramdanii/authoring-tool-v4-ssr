// ═══════════════════════════════════════════════════════════════════
// STATUS TOAST — Undo/Redo feedback + Auto-save indicator
// ═══════════════════════════════════════════════════════════════════
// Shows transient toast messages for undo/redo operations and a
// persistent auto-save status indicator in the toolbar.
// ═══════════════════════════════════════════════════════════════════

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';

// ── Undo/Redo Toast ─────────────────────────────────────────────

interface UndoRedoToastState {
  message: string;
  visible: boolean;
}

let toastTimeout: ReturnType<typeof setTimeout> | null = null;
let setToastExternal: ((state: UndoRedoToastState) => void) | null = null;

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

// ── Auto-save Indicator ──────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const AutoSaveIndicator: React.FC = React.memo(function AutoSaveIndicator() {
  const saveStatus = useCanvaStore(s => s._saveStatus as SaveStatus | undefined);
  const status = saveStatus || 'idle';

  const config: Record<SaveStatus, { icon: string; label: string; color: string }> = {
    idle: { icon: '', label: '', color: '' },
    saving: { icon: '⏳', label: 'Menyimpan...', color: '#fbbf24' },
    saved: { icon: '✓', label: 'Tersimpan', color: '#34d399' },
    error: { icon: '⚠', label: 'Gagal simpan', color: '#ff6b6b' },
  };

  const { icon, label, color } = config[status];

  if (status === 'idle') return null;

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-300"
      style={{
        background: `${color}11`,
        color,
        border: `1px solid ${color}33`,
      }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {status === 'saving' && (
        <span className="inline-block w-2.5 h-2.5 border-2 rounded-full animate-spin"
          style={{ borderColor: `${color}44`, borderTopColor: color }} />
      )}
      {status !== 'saving' && <span>{icon}</span>}
      <span>{label}</span>
    </div>
  );
});
