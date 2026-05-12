'use client';

// ═══════════════════════════════════════════════════════════════════════
// AUTO-SAVE RECOVERY — Detects unsaved changes and offers recovery
// ═══════════════════════════════════════════════════════════════════════
// On app mount, checks if localStorage has saved canvas data.
// If so, offers the user a choice to:
//   1. Recover the saved session (continue editing)
//   2. Start fresh (discard saved data)
//
// This prevents data loss when:
//   - Browser tab is accidentally closed
//   - Browser crashes
//   - User navigates away without saving
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import {
  AlertTriangle,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'canva_state_v2';

interface RecoveryData {
  timestamp: number;
  pageCount: number;
  currentPageLabel: string;
}

export default function AutoSaveRecovery() {
  const [showDialog, setShowDialog] = useState(false);
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const loadFromStorage = useCanvaStore((s) => s.loadFromStorage);

  // Check for saved data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (!parsed?.pages || !Array.isArray(parsed.pages)) return;

      const pages = parsed.pages;
      if (pages.length === 0) return;

      // Only show recovery dialog if there's meaningful data
      // (not just the default empty state)
      const currentPageIdx = 0;
      const currentPage = pages[currentPageIdx];

      setRecoveryData({
        timestamp: parsed._lastSavedAt || Date.now(),
        pageCount: pages.length,
        currentPageLabel: currentPage?.label || 'Untitled',
      });
      setShowDialog(true);
    } catch {
      // Corrupted data — ignore
    }
  }, []);

  const handleRecover = useCallback(() => {
    loadFromStorage();
    setShowDialog(false);
  }, [loadFromStorage]);

  const handleDiscard = useCallback(() => {
    // Clear the saved data so it won't show again
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setShowDialog(false);
  }, []);

  if (!showDialog || !recoveryData) return null;

  const timeAgo = getTimeAgo(recoveryData.timestamp);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md mx-4 rounded-2xl glass-panel-strong border border-app-border shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <AlertTriangle size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-300">Sesi Sebelumnya Ditemukan</h2>
              <p className="text-[10px] text-amber-400/60 mt-0.5">
                Ada data yang tersimpan dari sesi sebelumnya
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-app-muted">Terakhir disimpan</span>
              <span className="text-[10px] text-app-secondary font-semibold">{timeAgo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-app-muted">Jumlah halaman</span>
              <span className="text-[10px] text-app-secondary font-semibold">{recoveryData.pageCount} halaman</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-app-muted">Halaman aktif</span>
              <span className="text-[10px] text-app-secondary font-semibold">{recoveryData.currentPageLabel}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-app-elevated/40 border border-app-border/20">
            <p className="text-[10px] text-app-muted leading-relaxed">
              Apakah Anda ingin melanjutkan sesi sebelumnya atau memulai baru?
              Jika memulai baru, data yang tersimpan akan dihapus permanen.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-app-border/20 flex items-center gap-3">
          <Button
            onClick={handleRecover}
            className="flex-1 gap-2 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 font-bold text-[11px]"
            variant="outline"
          >
            <RotateCcw size={14} />
            Pulihkan Sesi
          </Button>
          <Button
            onClick={handleDiscard}
            className="flex-1 gap-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 font-bold text-[11px]"
            variant="outline"
          >
            <Trash2 size={14} />
            Mulai Baru
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Helper: Human-readable time ago ──────────────────────────────────

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60_000) return 'Baru saja';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} menit yang lalu`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} jam yang lalu`;
  return `${Math.floor(diff / 86_400_000)} hari yang lalu`;
}
