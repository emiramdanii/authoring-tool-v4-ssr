'use client';

// ═══════════════════════════════════════════════════════════════════════
// UNIFIED RECOVERY DIALOG — Single entry point for all recovery flows
// ═══════════════════════════════════════════════════════════════════════
// Replaces both CrashRecoveryDialog and AutoSaveRecovery with a single
// coordinated dialog that handles:
//
//   1. **Crash recovery**: Detects unclean session exits (crash, force-close)
//      via session marker + dirty exit flag
//   2. **Auto-save recovery**: Detects saved data from previous sessions
//      with detailed stats (page count, TP count, etc.)
//   3. **Emergency recovery**: Reads back data saved by AppErrorBoundary
//      from `silse_app_error_recovery` key
//
// Only ONE dialog ever appears — priority: emergency > crash > auto-save
//
// Bug fixes vs old system:
//   - "Mulai Baru" now actually clears localStorage (was broken before)
//   - beforeunload handler only sets dirty flag if there ARE unsaved changes
//   - Emergency save from AppErrorBoundary is now read back and offered
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useDirtyStore } from '@/store/dirty-store';
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
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Constants ────────────────────────────────────────────────────────
const DIRTY_EXIT_KEY = 'silse_dirty_exit';
const SESSION_ACTIVE_KEY = 'silse_session_active';
const EMERGENCY_SAVE_KEY = 'silse_app_error_recovery';
const CANVA_STORAGE_KEY = 'canva_state_v2';
const AUTHORING_STORAGE_KEY = 'at_state_v1';
const RECOVERY_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

// ── Exported helpers (used by AuthoringTool beforeunload) ─────────────
export function hasDirtyExit(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DIRTY_EXIT_KEY) === '1';
}

export function clearDirtyExitFlag(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DIRTY_EXIT_KEY);
}

export function setDirtyExitFlag(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DIRTY_EXIT_KEY, '1');
}

export function markSessionActive(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_ACTIVE_KEY, Date.now().toString());
}

export function markSessionCleanExit(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_ACTIVE_KEY);
}

// ── Types ────────────────────────────────────────────────────────────
type RecoveryReason = 'emergency' | 'crash' | 'auto-save';

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

interface RecoveryInfo {
  reason: RecoveryReason;
  canva: CanvaRecoveryData | null;
  authoring: AuthoringRecoveryData | null;
}

// ── Detection logic ──────────────────────────────────────────────────

function getPreviousSessionTimestamp(): number | null {
  if (typeof window === 'undefined') return null;
  const ts = localStorage.getItem(SESSION_ACTIVE_KEY);
  if (!ts) return null;
  const num = parseInt(ts, 10);
  return isNaN(num) ? null : num;
}

function checkEmergencyRecovery(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const data = localStorage.getItem(EMERGENCY_SAVE_KEY);
    if (!data) return false;
    const parsed = JSON.parse(data);
    return !!(parsed?.pages && Array.isArray(parsed.pages) && parsed.pages.length > 0);
  } catch {
    return false;
  }
}

function checkRecoverableData(): RecoveryInfo | null {
  if (typeof window === 'undefined') return null;

  const now = Date.now();
  const canva: CanvaRecoveryData | null = null;
  const authoring: AuthoringRecoveryData | null = null;
  let stats: { canva: CanvaRecoveryData | null; authoring: AuthoringRecoveryData | null } = { canva, authoring };
  let reason: RecoveryReason | null = null;

  // Priority 1: Emergency recovery from AppErrorBoundary
  if (checkEmergencyRecovery()) {
    try {
      const data = JSON.parse(localStorage.getItem(EMERGENCY_SAVE_KEY)!);
      stats.canva = {
        timestamp: data._emergencySavedAt || now,
        pageCount: data.pages?.length || 0,
        currentPageLabel: data.pages?.[0]?.label || 'Untitled',
      };
    } catch { /* ignore */ }
    reason = 'emergency';
  }

  // Priority 2: Crash detection (dirty exit or unclean session)
  const prevSession = getPreviousSessionTimestamp();
  const dirtyExit = hasDirtyExit();

  if (!reason && (prevSession || dirtyExit)) {
    reason = 'crash';
  }

  // Priority 3: Auto-save detection (just has saved data)
  if (!reason) {
    // Only offer auto-save recovery if there's actual meaningful data
    const hasData = checkHasMeaningfulData();
    if (hasData) {
      reason = 'auto-save';
    }
  }

  if (!reason) return null;

  // Parse canva data
  if (!stats.canva) {
    try {
      const canvaSaved = localStorage.getItem(CANVA_STORAGE_KEY);
      if (canvaSaved) {
        const parsed = JSON.parse(canvaSaved);
        if (parsed?.pages && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          const savedAt = parsed._lastSavedAt || 0;
          if (now - savedAt <= RECOVERY_MAX_AGE_MS || reason === 'crash') {
            stats.canva = {
              timestamp: savedAt || now,
              pageCount: parsed.pages.length,
              currentPageLabel: parsed.pages[0]?.label || 'Untitled',
            };
          }
        }
      }
    } catch { /* ignore */ }
  }

  // Parse authoring data
  try {
    const authoringSaved = localStorage.getItem(AUTHORING_STORAGE_KEY);
    if (authoringSaved) {
      const parsed = JSON.parse(authoringSaved);
      const hasData =
        (parsed.tp?.length > 0) ||
        (parsed.kuis?.length > 0) ||
        (parsed.modules?.length > 0) ||
        (parsed.alur?.length > 0) ||
        (parsed.materi?.blok?.length > 0) ||
        (parsed.cp?.capaianFase) ||
        (parsed.atp?.pertemuan?.length > 0);

      if (hasData) {
        const savedAt = parsed._lastSavedAt || 0;
        if (now - savedAt <= RECOVERY_MAX_AGE_MS || reason === 'crash') {
          const interactiveBlockTypes = new Set(
            BlockCapabilityRegistry.filterByCapability('interactive')
          );
          const modules = parsed.modules || [];
          const gameCount = modules.filter(
            (m: Record<string, unknown>) => interactiveBlockTypes.has(m.type as string)
          ).length;

          stats.authoring = {
            timestamp: savedAt || now,
            tpCount: parsed.tp?.length || 0,
            kuisCount: parsed.kuis?.length || 0,
            moduleCount: modules.length - gameCount,
            gameCount,
            alurCount: parsed.alur?.length || 0,
            materiCount: parsed.materi?.blok?.length || 0,
            hasCp: !!parsed.cp?.capaianFase,
            hasAtp: !!(parsed.atp?.pertemuan?.length > 0),
          };
        }
      }
    }
  } catch { /* ignore */ }

  // Return if there's any meaningful data to recover
  if (!stats.canva && !stats.authoring) return null;

  return { reason, canva: stats.canva, authoring: stats.authoring };
}

function checkHasMeaningfulData(): boolean {
  try {
    const canvaSaved = localStorage.getItem(CANVA_STORAGE_KEY);
    if (canvaSaved) {
      const parsed = JSON.parse(canvaSaved);
      if (parsed?.pages?.length > 0) return true;
    }
    const authoringSaved = localStorage.getItem(AUTHORING_STORAGE_KEY);
    if (authoringSaved) {
      const parsed = JSON.parse(authoringSaved);
      if (
        parsed.tp?.length > 0 ||
        parsed.kuis?.length > 0 ||
        parsed.modules?.length > 0 ||
        parsed.alur?.length > 0 ||
        parsed.materi?.blok?.length > 0 ||
        parsed.cp?.capaianFase ||
        parsed.atp?.pertemuan?.length > 0
      ) return true;
    }
  } catch { /* ignore */ }
  return false;
}

// ── Time formatting helper ───────────────────────────────────────────
function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return 'Baru saja';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} menit lalu`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} jam lalu`;
  return `${Math.floor(diff / 86_400_000)} hari lalu`;
}

// ══════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════

export default function RecoveryDialog() {
  const [recoveryInfo, setRecoveryInfo] = useState<RecoveryInfo | null>(() => {
    if (typeof window === 'undefined') return null;
    return checkRecoverableData();
  });

  const loadCanvaFromStorage = useCanvaStore((s) => s.loadFromStorage);
  const loadAuthoringFromStorage = useAuthoringStore((s) => s.loadFromStorage);

  // ── Session marker setup ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Mark session as active on first interaction
    const markActive = () => {
      markSessionActive();
      window.removeEventListener('mousedown', markActive);
      window.removeEventListener('keydown', markActive);
      window.removeEventListener('touchstart', markActive);
    };

    window.addEventListener('mousedown', markActive, { once: true });
    window.addEventListener('keydown', markActive, { once: true });
    window.addEventListener('touchstart', markActive, { once: true });

    // beforeunload — only set dirty flag if there are ACTUAL unsaved changes
    const handleBeforeUnload = () => {
      const isDirty =
        useDirtyStore.getState().dirty ||
        useCanvaStore.getState()._saveStatus === 'unsaved';
      if (isDirty) {
        setDirtyExitFlag();
      }
      // Always clear session marker (will be re-set on next session)
      markSessionCleanExit();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('mousedown', markActive);
      window.removeEventListener('keydown', markActive);
      window.removeEventListener('touchstart', markActive);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleRecover = useCallback(() => {
    // If emergency recovery data exists, merge it into the normal canva store key
    try {
      const emergencyData = localStorage.getItem(EMERGENCY_SAVE_KEY);
      if (emergencyData) {
        const parsed = JSON.parse(emergencyData);
        if (parsed?.pages?.length > 0) {
          // Write emergency data to the normal canva storage key so loadFromStorage picks it up
          const existing = localStorage.getItem(CANVA_STORAGE_KEY);
          const existingParsed = existing ? JSON.parse(existing) : {};
          localStorage.setItem(CANVA_STORAGE_KEY, JSON.stringify({
            ...existingParsed,
            pages: parsed.pages,
            ratioId: parsed.ratioId || existingParsed.ratioId,
            _lastSavedAt: parsed._emergencySavedAt || Date.now(),
          }));
          // Clear emergency key after merging
          localStorage.removeItem(EMERGENCY_SAVE_KEY);
        }
      }
    } catch { /* ignore */ }

    // Load data from localStorage into both stores
    loadCanvaFromStorage();
    loadAuthoringFromStorage();
    clearDirtyExitFlag();
    markSessionActive();
    setRecoveryInfo(null);
  }, [loadCanvaFromStorage, loadAuthoringFromStorage]);

  const handleStartFresh = useCallback(() => {
    // Actually clear ALL stored data (fixes the bug where "Mulai Baru" didn't clear data)
    try {
      localStorage.removeItem(CANVA_STORAGE_KEY);
      localStorage.removeItem(AUTHORING_STORAGE_KEY);
      localStorage.removeItem(EMERGENCY_SAVE_KEY);
    } catch { /* ignore */ }

    clearDirtyExitFlag();
    markSessionCleanExit();

    // Reset both stores to default state
    useCanvaStore.getState().resetCanvas();
    useAuthoringStore.getState().newProject();

    setRecoveryInfo(null);
  }, []);

  if (!recoveryInfo) return null;

  const { reason, canva, authoring } = recoveryInfo;

  // Determine header based on reason
  const headerConfig = {
    emergency: {
      icon: <ShieldAlert size={20} className="text-red-400" />,
      bgClass: 'bg-red-500/10 border-red-500/20',
      iconBgClass: 'bg-red-500/20',
      title: 'Pemulihan Darurat',
      subtitle: 'Data disimpan otomatis sebelum aplikasi error',
    },
    crash: {
      icon: <AlertTriangle size={20} className="text-amber-400" />,
      bgClass: 'bg-amber-500/10 border-amber-500/20',
      iconBgClass: 'bg-amber-500/20',
      title: 'Sesi Sebelumnya Terdeteksi',
      subtitle: 'Aplikasi kemungkinan ditutup tanpa menyimpan',
    },
    'auto-save': {
      icon: <AlertTriangle size={20} className="text-amber-400" />,
      bgClass: 'bg-amber-500/10 border-amber-500/20',
      iconBgClass: 'bg-amber-500/20',
      title: 'Data Tersimpan Ditemukan',
      subtitle: 'Ada data dari sesi sebelumnya',
    },
  };

  const header = headerConfig[reason];
  const timestamp = canva?.timestamp || authoring?.timestamp || Date.now();
  const timeAgo = getTimeAgo(timestamp);

  // Build summary
  const summaryParts: string[] = [];
  if (canva) summaryParts.push(`${canva.pageCount} halaman`);
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
        <div className={`px-5 py-4 border-b ${header.bgClass}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${header.iconBgClass}`}>
              {header.icon}
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-300">{header.title}</h2>
              <p className="text-[10px] text-amber-400/60 mt-0.5">
                {header.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {/* Summary */}
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

            {canva && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-app-muted flex items-center gap-1">
                  <FileText size={10} /> Halaman desain
                </span>
                <span className="text-[10px] text-app-secondary font-semibold">{canva.pageCount} halaman</span>
              </div>
            )}

            {authoring && (
              <>
                {authoring.hasCp && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <BookOpen size={10} /> Capaian Pembelajaran
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">&#10003;</span>
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
                {authoring.alurCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <Layers size={10} /> Alur Pembelajaran
                    </span>
                    <span className="text-[10px] text-app-secondary font-semibold">{authoring.alurCount} alur</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Warning */}
          <div className="p-3 rounded-lg bg-app-elevated/40 border border-app-border/20">
            <p className="text-[10px] text-app-muted leading-relaxed">
              Pilih <strong>&quot;Pulihkan&quot;</strong> untuk melanjutkan sesi sebelumnya,
              atau <strong>&quot;Mulai Baru&quot;</strong> untuk menghapus semua data tersimpan dan memulai dari awal.
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
            Pulihkan
          </Button>
          <Button
            onClick={handleStartFresh}
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
