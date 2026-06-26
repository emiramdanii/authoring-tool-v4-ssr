// @ts-nocheck — BATCH-12-04: quarantined to src/legacy-disabled/, not type-checked
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
  // V5-PRODUCT-STABILIZATION-01: Disable AutoSaveRecovery modal in V5.
  // V5's DashboardV5 already handles resume via the "Lanjut Edit" button,
  // which checks pages.length > 0. This modal was showing on every app
  // mount (including after reload → Lanjut Edit → Preview), intruding on
  // the user's workflow. The modal is now disabled — V5 DashboardV5 is
  // the single authority for "resume session" UX.
  //
  // The component is kept (not deleted) because layout.tsx imports it.
  // Returning null effectively removes it from runtime.
  return null;
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
