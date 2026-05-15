'use client';

// ═══════════════════════════════════════════════════════════════════════
// AUTO-SAVE RECOVERY — Detects unsaved changes and offers recovery
// ═══════════════════════════════════════════════════════════════════════
// Phase E.4 Enhancement:
//   - Checks if saved data was within the last 30 minutes
//   - Uses _lastSavedAt timestamp from both stores
//   - If data is stale (>30 min), doesn't show recovery dialog
//   - Shows detailed recovery information to help users decide
//
// On app mount, checks if localStorage has saved data for BOTH:
//   1. Canva store (pages, layout)
//   2. Authoring store (CP, TP, ATP, Alur, Kuis, Modules, Games, Materi)
//
// If recoverable data is found, offers the user a choice to:
//   1. Recover the saved session (continue editing)
//   2. Start fresh (discard saved data)
//
// This prevents data loss when:
//   - Browser tab is accidentally closed
//   - Browser crashes
//   - User navigates away without saving
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { CANVA_STORAGE_KEY } from '@/store/canva/constants';
import { STORAGE_KEY as AUTHORING_STORAGE_KEY } from '@/store/authoring/types';
import { BlockCapabilityRegistry } from '@/core/schema/capability-registry';
import {
  AlertTriangle,
  RotateCcw,
  Trash2,
  FileText,
  BookOpen,
  Gamepad2,
  Target,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Constants ────────────────────────────────────────────────────────
const RECOVERY_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

interface CanvaRecoveryData {
  timestamp: number;
  pageCount: number;
  currentPageLabel: string;
}

interface AuthoringRecoveryData {
  timestamp: number;
  tpCount: number;
  kuisCount: number;
  moduleCount: number;
  gameCount: number;
  alurCount: number;
  materiCount: number;
  hasCp: boolean;
  hasAtp: boolean;
}

interface RecoveryStats {
  canva: CanvaRecoveryData | null;
  authoring: AuthoringRecoveryData | null;
}

// ── Check localStorage for recoverable data (runs at module load time) ──
function checkForRecoverableData(): RecoveryStats | null {
  try {
    const stats: RecoveryStats = { canva: null, authoring: null };
    const now = Date.now();

    // ── Check canva store ────────────────────────────────────
    const canvaSaved = localStorage.getItem(CANVA_STORAGE_KEY);
    if (canvaSaved) {
      const parsed = JSON.parse(canvaSaved);
      if (parsed?.pages && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        const savedAt = parsed._lastSavedAt || 0;
        // Only offer recovery if saved within the last 30 minutes
        if (now - savedAt <= RECOVERY_MAX_AGE_MS) {
          const currentPage = parsed.pages[0];
          stats.canva = {
            timestamp: savedAt || Date.now(),
            pageCount: parsed.pages.length,
            currentPageLabel: currentPage?.label || 'Untitled',
          };
        }
      }
    }

    // ── Check authoring store ────────────────────────────────
    const authoringSaved = localStorage.getItem(AUTHORING_STORAGE_KEY);
    if (authoringSaved) {
      const parsed = JSON.parse(authoringSaved);
      // Check if there's meaningful data (not just empty defaults)
      const hasData =
        (parsed.tp && Array.isArray(parsed.tp) && parsed.tp.length > 0) ||
        (parsed.kuis && Array.isArray(parsed.kuis) && parsed.kuis.length > 0) ||
        (parsed.modules && Array.isArray(parsed.modules) && parsed.modules.length > 0) ||
        (parsed.alur && Array.isArray(parsed.alur) && parsed.alur.length > 0) ||
        (parsed.materi?.blok && Array.isArray(parsed.materi.blok) && parsed.materi.blok.length > 0) ||
        (parsed.cp?.capaianFase) ||
        (parsed.atp?.pertemuan && Array.isArray(parsed.atp.pertemuan) && parsed.atp.pertemuan.length > 0);

      if (hasData) {
        const savedAt = parsed._lastSavedAt || 0;
        // Only offer recovery if saved within the last 30 minutes
        if (now - savedAt <= RECOVERY_MAX_AGE_MS) {
          // Use capability registry as single source of truth for interactive/game types
          const interactiveBlockTypes = new Set(
            BlockCapabilityRegistry.filterByCapability('interactive')
          );
          const modules = parsed.modules || [];
          const gameCount = modules.filter(
            (m: Record<string, unknown>) => interactiveBlockTypes.has(m.type as string)
          ).length;
          const moduleCount = modules.length - gameCount;

          stats.authoring = {
            timestamp: savedAt || Date.now(),
            tpCount: parsed.tp?.length || 0,
            kuisCount: parsed.kuis?.length || 0,
            moduleCount,
            gameCount,
            alurCount: parsed.alur?.length || 0,
            materiCount: parsed.materi?.blok?.length || 0,
            hasCp: !!parsed.cp?.capaianFase,
            hasAtp: !!(parsed.atp?.pertemuan && parsed.atp.pertemuan.length > 0),
          };
        }
      }
    }

    // Return stats if either store has meaningful data
    return (stats.canva || stats.authoring) ? stats : null;
  } catch {
    // Corrupted data — ignore
    return null;
  }
}

export default function AutoSaveRecovery() {
  // Use lazy initializer to check localStorage once on mount
  // (avoids calling setState in an effect)
  const [recoveryStats, setRecoveryStats] = useState<RecoveryStats | null>(() => {
    if (typeof window === 'undefined') return null;
    return checkForRecoverableData();
  });

  const loadCanvaFromStorage = useCanvaStore((s) => s.loadFromStorage);
  const loadAuthoringFromStorage = useAuthoringStore((s) => s.loadFromStorage);

  const handleRecover = useCallback(() => {
    loadCanvaFromStorage();
    loadAuthoringFromStorage();
    setRecoveryStats(null);
  }, [loadCanvaFromStorage, loadAuthoringFromStorage]);

  const handleDiscard = useCallback(() => {
    // Clear both stores' saved data so it won't show again
    try {
      localStorage.removeItem(CANVA_STORAGE_KEY);
      localStorage.removeItem(AUTHORING_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setRecoveryStats(null);
  }, []);

  if (!recoveryStats) return null;

  const canva = recoveryStats.canva;
  const authoring = recoveryStats.authoring;

  // Determine the latest timestamp for "last saved" display
  const timestamp = canva?.timestamp || authoring?.timestamp || Date.now();
  const timeAgo = getTimeAgo(timestamp);

  // Build summary line
  const summaryParts: string[] = [];
  if (canva) {
    summaryParts.push(`${canva.pageCount} halaman`);
  }
  if (authoring) {
    if (authoring.tpCount > 0) summaryParts.push(`${authoring.tpCount} tujuan pembelajaran`);
    if (authoring.moduleCount > 0) summaryParts.push(`${authoring.moduleCount} modul`);
    if (authoring.gameCount > 0) summaryParts.push(`${authoring.gameCount} game`);
    if (authoring.kuisCount > 0) summaryParts.push(`${authoring.kuisCount} kuis`);
    if (authoring.alurCount > 0) summaryParts.push(`${authoring.alurCount} alur`);
    if (authoring.materiCount > 0) summaryParts.push(`${authoring.materiCount} materi`);
    if (authoring.hasCp) summaryParts.push('capaian pembelajaran');
    if (authoring.hasAtp) summaryParts.push('ATP');
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-app-surface border border-app-border shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
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
          {/* Summary line */}
          {summaryParts.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
              <div className="text-[10px] text-amber-300 font-semibold mb-1">
                Ditemukan data tersimpan:
              </div>
              <div className="text-[10px] text-app-secondary leading-relaxed">
                {summaryParts.join(', ')}
              </div>
            </div>
          )}

          {/* Detail rows */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-app-muted">Terakhir disimpan</span>
              <span className="text-[10px] text-app-secondary font-semibold">{timeAgo}</span>
            </div>

            {/* Canva store details */}
            {canva && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-app-muted flex items-center gap-1">
                    <FileText size={10} /> Halaman canva
                  </span>
                  <span className="text-[10px] text-app-secondary font-semibold">{canva.pageCount} halaman</span>
                </div>
              </>
            )}

            {/* Authoring store details */}
            {authoring && (
              <>
                {authoring.hasCp && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <BookOpen size={10} /> Capaian Pembelajaran
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">✓</span>
                  </div>
                )}
                {authoring.tpCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <Target size={10} /> Tujuan Pembelajaran
                    </span>
                    <span className="text-[10px] text-app-secondary font-semibold">{authoring.tpCount} TP</span>
                  </div>
                )}
                {authoring.hasAtp && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <Layers size={10} /> ATP
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">✓</span>
                  </div>
                )}
                {authoring.alurCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <Layers size={10} /> Alur Pembelajaran
                    </span>
                    <span className="text-[10px] text-app-secondary font-semibold">{authoring.alurCount} alur</span>
                  </div>
                )}
                {authoring.kuisCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <FileText size={10} /> Kuis
                    </span>
                    <span className="text-[10px] text-app-secondary font-semibold">{authoring.kuisCount} kuis</span>
                  </div>
                )}
                {authoring.moduleCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <BookOpen size={10} /> Modul Konten
                    </span>
                    <span className="text-[10px] text-app-secondary font-semibold">{authoring.moduleCount} modul</span>
                  </div>
                )}
                {authoring.gameCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <Gamepad2 size={10} /> Game Interaktif
                    </span>
                    <span className="text-[10px] text-app-secondary font-semibold">{authoring.gameCount} game</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-3 rounded-lg bg-app-elevated/40 border border-app-border/20">
            <p className="text-[10px] text-app-muted leading-relaxed">
              Apakah Anda ingin melanjutkan sesi sebelumnya atau memulai baru?
              Jika memulai baru, semua data yang tersimpan akan dihapus permanen.
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
