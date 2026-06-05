// ═══════════════════════════════════════════════════════════════════════
// VITE EXPORT HOOK — Calls the Next.js API route to generate
// a standalone HTML file using the Vite-built template + data injection.
// Replaces the old exportUnifiedHTML() string-based pipeline.
//
// Phase 6: Added client-side fallback export that generates a
// self-contained HTML entirely in the browser (no Vite dependency).
//
// D1/D3 Fix: exportWithFallback() NO LONGER silently falls back to
// the degraded vanilla JS export. If Path A (Vite SSR) fails, the
// user gets a clear error message instead of a silently degraded
// export. The client-side export (exportClientSide) is still
// available for explicit dev/debug use but is NOT automatically
// called. Path A is the only production source of truth.
//
// D-P0F: Strengthened — if Path A fails, NO degraded fallback is
// offered. exportClientSide/previewClientSide are DEPRECATED and
// should not be used in production. src/lib/client-export.ts has
// been deleted (0 imports). Only Path A (Vite SSR) is official.
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { toast } from 'sonner';
import {
  generateClientExportHtml,
  generateExportFilename,
  type ClientExportPayload,
} from '@/lib/export';
import { logger } from '@/core/utils/logger';

/**
 * Export HTML using the Vite SSR pipeline.
 * Sends page data to the API route, which injects it into the
 * pre-built template and returns a single HTML file.
 */
export function useViteExport() {
  const pages = useCanvaStore((s) => s.pages);
  const ratioId = useCanvaStore((s) => s.ratioId);

  /**
   * Build the common export payload from both stores.
   */
  const buildPayload = useCallback((): ClientExportPayload => {
    const authStore = useAuthoringStore.getState();
    return {
      pages,
      ratioId,
      meta: authStore.meta as unknown as Record<string, unknown>,
      allKuis: authStore.kuis,
      allModules: authStore.modules,
      games: authStore.games,
      cp: authStore.cp as unknown as Record<string, unknown>,
      tp: authStore.tp,
      atp: authStore.atp as unknown as Record<string, unknown>,
      alur: authStore.alur,
      materi: authStore.materi as unknown as Record<string, unknown>,
      skenario: authStore.skenario,
      petunjuk: authStore.petunjuk as unknown as Record<string, unknown>,
      diskusi: authStore.diskusi as unknown as Record<string, unknown>,
      refleksi: authStore.refleksi as unknown as Record<string, unknown>,
      penutup: authStore.penutup as unknown as Record<string, unknown>,
      suara: authStore.suara as unknown as Record<string, unknown>,
    };
  }, [pages, ratioId]);

  const exportHTML = useCallback(async () => {
    const authStore = useAuthoringStore.getState();

    toast.loading(`Mengekspor ${pages.length} halaman (SSR)...`, { id: 'export-ssr' });

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages,
          ratioId,
          meta: authStore.meta,
          allKuis: authStore.kuis,
          allModules: authStore.modules,
          games: authStore.games,
          cp: authStore.cp,
          tp: authStore.tp,
          atp: authStore.atp,
          alur: authStore.alur,
          materi: authStore.materi,
          skenario: authStore.skenario,
          petunjuk: authStore.petunjuk,
          diskusi: authStore.diskusi,
          refleksi: authStore.refleksi,
          penutup: authStore.penutup,
          suara: authStore.suara,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Kesalahan tidak diketahui' }));
        throw new Error(error.error || `Export gagal dengan status ${response.status}`);
      }

      // Get the HTML blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header, or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'media-pembelajaran-export.html';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.success(`Export selesai (${pages.length} halaman, ${(blob.size / 1024).toFixed(0)} KB)`, { id: 'export-ssr' });
    } catch (err: unknown) {
      logger.error('Vite Export', err);
      toast.error(`Gagal export: ${err instanceof Error ? err.message : String(err)}`, { id: 'export-ssr' });
      throw err; // Re-throw so caller can show error
    }
  }, [pages, ratioId]);

  /**
   * Preview the export in a new tab.
   * Same as exportHTML but opens in a new window instead of downloading.
   */
  const previewHTML = useCallback(async () => {
    const authStore = useAuthoringStore.getState();

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages,
          ratioId,
          meta: authStore.meta,
          allKuis: authStore.kuis,
          allModules: authStore.modules,
          games: authStore.games,
          cp: authStore.cp,
          tp: authStore.tp,
          atp: authStore.atp,
          alur: authStore.alur,
          materi: authStore.materi,
          skenario: authStore.skenario,
          petunjuk: authStore.petunjuk,
          diskusi: authStore.diskusi,
          refleksi: authStore.refleksi,
          penutup: authStore.penutup,
          suara: authStore.suara,
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      const html = await response.text();
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
      toast.success(`Preview dibuka (${pages.length} halaman)`);
    } catch (err: unknown) {
      logger.error('Vite Export Preview', err);
      toast.error(`Gagal preview: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }, [pages, ratioId]);

  // ═══════════════════════════════════════════════════════════════════
  // CLIENT-SIDE EXPORT — ⛔ DEPRECATED — Do NOT use in production
  //
  // This path uses vanilla JS string templates that produce DEGRADED
  // output: no navigation locks, no contract-aware rendering, no
  // premium effects, no sound, basic quiz layout (all-at-once).
  // It is intentionally NOT called automatically from exportWithFallback().
  //
  // D-P0F: These functions are DEPRECATED. They remain for dev/debug
  // only. The ONLY production export is Path A (Vite SSR) via /api/export.
  // If Path A fails, the user sees a clear error — NOT a degraded fallback.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * ⛔ DEPRECATED — Export HTML using the client-side generator.
   * Generates a self-contained HTML file entirely in the browser.
   * ⚠️ DEGRADED OUTPUT — no navigation locks, no premium effects,
   * basic quiz rendering. For dev/debug only, NOT production use.
   * This function will be removed in a future sprint.
   */
  const exportClientSide = useCallback(async () => {
    toast.loading(`Mengekspor ${pages.length} halaman (Mode Terbatas)...`, { id: 'export-client' });

    try {
      const payload = buildPayload();
      const html = generateClientExportHtml(payload);
      const filename = generateExportFilename(payload.meta as Record<string, unknown>);

      const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.success(`Export mode terbatas selesai (${pages.length} halaman, ${(blob.size / 1024).toFixed(0)} KB) — Hasil TIDAK sama dengan preview`, { id: 'export-client' });
    } catch (err: unknown) {
      logger.error('Client Export', err);
      toast.error(`Gagal export client-side: ${err instanceof Error ? err.message : String(err)}`, { id: 'export-client' });
    }
  }, [pages, ratioId, buildPayload]);

  /**
   * ⛔ DEPRECATED — Preview using the client-side generator in a new tab.
   * ⚠️ DEGRADED OUTPUT — for dev/debug only.
   * This function will be removed in a future sprint.
   */
  const previewClientSide = useCallback(() => {
    try {
      const payload = buildPayload();
      const html = generateClientExportHtml(payload);

      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
      toast.success(`Preview mode terbatas dibuka (${pages.length} halaman) — Hasil TIDAK sama dengan preview`);
    } catch (err: unknown) {
      logger.error('Client Preview', err);
      toast.error(`Gagal preview client-side: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [pages, ratioId, buildPayload]);

  /**
   * Primary export entry point. Uses Vite SSR (Path A) — the only
   * production source of truth. If Path A fails, shows a clear error
   * instead of silently falling back to the degraded vanilla JS export.
   *
   * The degraded client-side export (exportClientSide) is still
   * available for explicit dev/debug use but is NOT called here.
   */
  const exportWithFallback = useCallback(async () => {
    toast.loading(`Mengekspor ${pages.length} halaman...`, { id: 'export-primary' });

    try {
      await exportHTML();
    } catch (err: unknown) {
      // Path A failed — do NOT silently fall back to degraded export.
      // Show clear error so the user knows the export is not available.
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error('Export', 'Vite SSR export gagal: ' + errMsg);

      // D-P0F: Clear, actionable error messages — no silent fallback.
      // Detect template-missing error from the API route
      const isTemplateMissing = errMsg.includes('template') || errMsg.includes('export:build');
      const isServerDown = errMsg.includes('fetch') || errMsg.includes('network') || errMsg.includes('Failed to fetch');
      const userMessage = isTemplateMissing
        ? `Export utama gagal. Template export belum tersedia atau server export bermasalah. Jalankan "npm run export:build" atau hubungi admin.`
        : isServerDown
        ? `Export utama gagal. Server export tidak dapat dijangkau. Periksa koneksi atau hubungi admin.`
        : `Export gagal: ${errMsg}. Hubungi admin jika masalah berlanjut.`;

      toast.error(userMessage, { id: 'export-primary', duration: 8000 });
    }
  }, [exportHTML, pages]);

  return {
    exportHTML,
    previewHTML,
    exportClientSide,
    previewClientSide,
    exportWithFallback,
  };
}
