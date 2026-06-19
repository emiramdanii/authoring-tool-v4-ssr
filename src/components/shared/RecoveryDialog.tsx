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

import { useState, useCallback, useEffect, useRef } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useDirtyStore } from '@/store/dirty-store';
import { BlockCapabilityRegistry } from '@/core/schema/capability-registry';
import { bootRecoveryOrchestrator, type BootReport } from '@/core/editor/boot-recovery';
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

/**
 * Clear ALL recovery-related storage keys.
 *
 * Sprint 8.5A: Used by "Mulai Baru" to guarantee a clean slate — both
 * localStorage (canva/authoring/emergency) and sessionStorage crash
 * recovery data via the boot recovery orchestrator.
 */
export function clearRecoveryKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CANVA_STORAGE_KEY);
    localStorage.removeItem(AUTHORING_STORAGE_KEY);
    localStorage.removeItem(EMERGENCY_SAVE_KEY);
    localStorage.removeItem(DIRTY_EXIT_KEY);
    localStorage.removeItem(SESSION_ACTIVE_KEY);
  } catch { /* ignore */ }
  // Also discard any incomplete-transaction recovery data via the orchestrator
  try {
    bootRecoveryOrchestrator.discardCrashRecovery();
  } catch { /* non-critical */ }
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
// Sprint 8.5A: 'boot-report' is a 4th reason, surfaced when
// BootRecoveryOrchestrator.run() returns needsRecovery=true.
// Priority: boot-report > emergency > crash > auto-save.
type RecoveryReason = 'boot-report' | 'emergency' | 'crash' | 'auto-save';

/**
 * Props for RecoveryDialog.
 *
 * Sprint 8.5A: `bootReport` is produced by `bootRecoveryOrchestrator.run()`
 * at AuthoringTool init. When `bootReport.needsRecovery` is true, the
 * dialog displays the boot report's severity + summary, and the
 * "Pulihkan" / "Mulai Baru" actions call the orchestrator's
 * applyCrashRecovery / discardCrashRecovery respectively.
 */
export interface RecoveryDialogProps {
  bootReport?: BootReport | null;
}

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

export default function RecoveryDialog({ bootReport }: RecoveryDialogProps = {}) {
  const [recoveryInfo, setRecoveryInfo] = useState<RecoveryInfo | null>(() => {
    if (typeof window === 'undefined') return null;
    return checkRecoverableData();
  });

  // Sprint 8.5A: Boot-report takes priority over localStorage-based detection.
  // When bootReport.needsRecovery is true, we synthesize a RecoveryInfo that
  // surfaces the boot report's severity + summary in the dialog UI.
  useEffect(() => {
    if (!bootReport || !bootReport.needsRecovery) return;
    setRecoveryInfo((prev) => {
      // boot-report has highest priority — overrides emergency/crash/auto-save
      const canva: CanvaRecoveryData | null = prev?.canva ?? (bootReport.healedPages?.length
        ? {
            timestamp: bootReport.bootTimestamp,
            pageCount: bootReport.healedPages.length,
            currentPageLabel: bootReport.healedPages[0]?.label || 'Untitled',
          }
        : null);
      return {
        reason: 'boot-report',
        canva,
        authoring: prev?.authoring ?? null,
      };
    });
  }, [bootReport]);

  const loadCanvaFromStorage = useCanvaStore((s) => s.loadFromStorage);
  const loadAuthoringFromStorage = useAuthoringStore((s) => s.loadFromStorage);

  // Sprint 8.5A: a11y — focus trap + Esc handler
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = 'recovery-dialog-title';

  // Focus first action button on mount
  useEffect(() => {
    if (!recoveryInfo) return;
    // Move focus to the first focusable element shortly after mount
    const t = window.setTimeout(() => {
      const root = dialogRef.current;
      if (!root) return;
      const first = root.querySelector<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])');
      first?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [recoveryInfo]);

  // Esc key handler — Esc = "Mulai Baru" (discard recovery)
  // This is safe because the dialog only appears when there's recoverable
  // data; Esc is the equivalent of "I don't want to recover, start fresh".
  useEffect(() => {
    if (!recoveryInfo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      handleStartFreshRef.current();
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recoveryInfo]);

  // Tab focus trap — cycle Tab within dialog
  useEffect(() => {
    if (!recoveryInfo) return;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, [recoveryInfo]);

  // handleStartFresh is recreated on every render (depends on stores).
  // Keep a ref so the Esc handler (registered once per recoveryInfo change)
  // can call the latest version without re-binding the listener.
  const handleStartFreshRef = useRef<() => void>(() => {});

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

    // Sprint 8.5A: If boot-report flagged an incomplete transaction, apply
    // the orchestrator's crash recovery (rolls back to pre-transaction schema).
    if (bootReport?.transactionRecovery.hasIncompleteTransaction) {
      try {
        bootRecoveryOrchestrator.applyCrashRecovery();
      } catch { /* non-critical — loadFromStorage will still run */ }
    }

    // Load data from localStorage into both stores
    loadCanvaFromStorage();
    loadAuthoringFromStorage();
    clearDirtyExitFlag();
    markSessionActive();
    setRecoveryInfo(null);
  }, [loadCanvaFromStorage, loadAuthoringFromStorage, bootReport]);

  const handleStartFresh = useCallback(() => {
    // Sprint 8.5A: Use the unified clearRecoveryKeys() helper so ALL recovery
    // storage (canva/authoring/emergency/dirty-exit/session-active + crash
    // recovery data via orchestrator.discardCrashRecovery) is wiped in one
    // place. This is the source of truth for "start fresh".
    clearRecoveryKeys();

    markSessionCleanExit();

    // Reset both stores to default state
    useCanvaStore.getState().resetCanvas();
    useAuthoringStore.getState().newProject();

    setRecoveryInfo(null);
  }, []);

  // Keep Esc-handler ref in sync with latest handleStartFresh
  handleStartFreshRef.current = handleStartFresh;

  if (!recoveryInfo) return null;

  const { reason, canva, authoring } = recoveryInfo;

  // Determine header based on reason
  const headerConfig: Record<RecoveryReason, {
    icon: React.ReactNode;
    bgClass: string;
    iconBgClass: string;
    title: string;
    subtitle: string;
  }> = {
    'boot-report': {
      icon: <ShieldAlert size={20} className="text-orange-400" />,
      bgClass: 'bg-orange-500/10 border-orange-500/20',
      iconBgClass: 'bg-orange-500/20',
      title: 'Pemulihan Boot Aman',
      subtitle: 'Data sebelumnya tidak konsisten — sistem telah memulihkannya',
    },
    emergency: {
      icon: <ShieldAlert size={20} className="text-red-400" />,
      bgClass: 'bg-red-500/10 border-red-500/20',
      iconBgClass: 'bg-red-500/20',
      title: 'Pemulihan Darurat',
      subtitle: 'Data disimpan otomatis sebelum aplikasi error',
    },
    crash: {
      icon: <span className="material-symbols-outlined text-amber-400" style={ { fontSize: '20px' } }>warning</span>,
      bgClass: 'bg-amber-500/10 border-amber-500/20',
      iconBgClass: 'bg-amber-500/20',
      title: 'Sesi Sebelumnya Terdeteksi',
      subtitle: 'Aplikasi kemungkinan ditutup tanpa menyimpan',
    },
    'auto-save': {
      icon: <span className="material-symbols-outlined text-amber-400" style={ { fontSize: '20px' } }>warning</span>,
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
  // Sprint 8.5A: For boot-report, surface orchestrator's summary message
  if (reason === 'boot-report' && bootReport) {
    summaryParts.push(bootReport.summary);
  }
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
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      // Sprint 8.5A: a11y — backdrop click = Esc = start fresh
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleStartFreshRef.current();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby="recovery-dialog-desc"
        className="w-full max-w-md mx-4 rounded-2xl bg-app-surface border border-app-border shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b ${header.bgClass}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${header.iconBgClass}`}>
              {header.icon}
            </div>
            <div>
              <h2 id={titleId} className="text-sm font-bold text-amber-300">{header.title}</h2>
              <p id="recovery-dialog-desc" className="text-[10px] text-amber-400/60 mt-0.5">
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
                  <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>description</span> Halaman desain
                </span>
                <span className="text-[10px] text-app-secondary font-semibold">{canva.pageCount} halaman</span>
              </div>
            )}

            {authoring && (
              <>
                {authoring.hasCp && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>menu_book</span> Capaian Pembelajaran
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">&#10003;</span>
                  </div>
                )}
                {authoring.tpCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>target</span> Tujuan Pembelajaran
                    </span>
                    <span className="text-[10px] text-app-secondary font-semibold">{authoring.tpCount} TP</span>
                  </div>
                )}
                {authoring.kuisCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>description</span> Kuis
                    </span>
                    <span className="text-[10px] text-app-secondary font-semibold">{authoring.kuisCount} kuis</span>
                  </div>
                )}
                {authoring.moduleCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>menu_book</span> Modul Konten
                    </span>
                    <span className="text-[10px] text-app-secondary font-semibold">{authoring.moduleCount} modul</span>
                  </div>
                )}
                {authoring.gameCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>sports_esports</span> Game Interaktif
                    </span>
                    <span className="text-[10px] text-app-secondary font-semibold">{authoring.gameCount} game</span>
                  </div>
                )}
                {authoring.alurCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-app-muted flex items-center gap-1">
                      <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>layers</span> Alur Pembelajaran
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
            <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>refresh</span>
            Pulihkan
          </Button>
          <Button
            onClick={handleStartFresh}
            className="flex-1 gap-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 font-bold text-[11px]"
            variant="outline"
          >
            <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>delete</span>
            Mulai Baru
          </Button>
        </div>
      </div>
    </div>
  );
}
