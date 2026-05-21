'use client';

// ═══════════════════════════════════════════════════════════════════
// HEALTH MONITOR — Periodic integrity + memory guard
// ═══════════════════════════════════════════════════════════════════
// FASE 8 of the ROADMAP PEMULIHAN SILSE
//
// Runs periodic health checks on the app:
//   1. Schema integrity check (every 5 min) — auto-repair corrupt pages
//   2. Memory guard (every 2 min) — trim history if memory is high
//   3. Storage quota check (every 10 min) — warn if localStorage is full
//
// All checks are non-blocking, safe to call, and never crash the app.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { useCanvaStore } from '@/store/canva/store';
import { runIntegrityCheck } from '@/core/recovery/periodic-check';
import { trimHistory, getHistorySize } from '@/store/canva/history-slice';
import { logger } from '@/core/utils/logger';

// ── Timing constants ─────────────────────────────────────────────
const INTEGRITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MEMORY_CHECK_INTERVAL = 2 * 60 * 1000;     // 2 minutes
const STORAGE_CHECK_INTERVAL = 10 * 60 * 1000;   // 10 minutes
const MAX_HISTORY_BYTES = 5 * 1024 * 1024;       // 5MB
const STORAGE_QUOTA_WARNING = 0.85;               // 85% of 5MB

/**
 * Health Monitor hook — runs periodic checks while the editor is open.
 * Mount this once at the CanvaBuilder level.
 */
export function useHealthMonitor() {
  const integrityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const memoryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const storageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // ── 1. Periodic Integrity Check ──────────────────────────────
    integrityTimerRef.current = setInterval(() => {
      try {
        const pages = useCanvaStore.getState().pages;
        if (!pages || pages.length === 0) return;

        const report = runIntegrityCheck(pages, { autoRepair: true });

        if (report.corruptedPages > 0) {
          logger.warn('Health', `Integrity check: ${report.corruptedPages} corrupted, ${report.repairedPages} repaired, ${report.unrecoverablePages} unrecoverable`);

          // If pages were repaired, update the store
          if (report.repairedPages > 0) {
            const repairedPages = pages.map((page, i) => {
              const detail = report.details.find(d => d.pageIndex === i);
              if (detail?.status === 'repaired') {
                // The repair was applied in-place to the page object
                // We need to trigger a state update for React to re-render
                return { ...page };
              }
              return page;
            });
            useCanvaStore.setState({ pages: repairedPages });
          }
        }
      } catch (err) {
        // Health checks must never crash the app
        logger.warn('Health', 'Integrity check failed: ' + String(err));
      }
    }, INTEGRITY_CHECK_INTERVAL);

    // ── 2. Memory Guard ─────────────────────────────────────────
    memoryTimerRef.current = setInterval(() => {
      try {
        const state = useCanvaStore.getState();
        const history = state._history;
        if (!history || history.length === 0) return;

        const totalBytes = getHistorySize(history);
        if (totalBytes > MAX_HISTORY_BYTES) {
          const trimmed = trimHistory(history, state._historyIdx);
          useCanvaStore.setState({
            _history: trimmed.history,
            _historyIdx: trimmed.historyIdx,
          });
          logger.warn('Health', `Memory guard: trimmed history from ${history.length} to ${trimmed.history.length} entries`);
        }
      } catch (err) {
        logger.warn('Health', 'Memory check failed: ' + String(err));
      }
    }, MEMORY_CHECK_INTERVAL);

    // ── 3. Storage Quota Check ──────────────────────────────────
    storageTimerRef.current = setInterval(() => {
      try {
        const raw = localStorage.getItem('silse_canva_data');
        if (!raw) return;

        const sizeBytes = new Blob([raw]).size;
        const maxBytes = 5 * 1024 * 1024; // 5MB typical localStorage limit

        if (sizeBytes > maxBytes * STORAGE_QUOTA_WARNING) {
          const pct = Math.round((sizeBytes / maxBytes) * 100);
          logger.warn('Health', `Storage quota: ${pct}% used (${(sizeBytes / 1048576).toFixed(1)}MB / 5MB). Consider saving to server to free up space.`);
        }
      } catch (err) {
        logger.warn('Health', 'Storage check failed: ' + String(err));
      }
    }, STORAGE_CHECK_INTERVAL);

    // ── Cleanup ──────────────────────────────────────────────────
    return () => {
      if (integrityTimerRef.current) clearInterval(integrityTimerRef.current);
      if (memoryTimerRef.current) clearInterval(memoryTimerRef.current);
      if (storageTimerRef.current) clearInterval(storageTimerRef.current);
    };
  }, []);
}
