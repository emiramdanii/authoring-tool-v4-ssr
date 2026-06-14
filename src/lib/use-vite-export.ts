// ═══════════════════════════════════════════════════════════════════════
// VITE EXPORT HOOK — Calls the Next.js API route to generate
// a standalone HTML file using the Vite-built template + data injection.
//
// Sprint 6.4-F: Legacy client-side export path REMOVED.
//   - exportClientSide() — DELETED (no production callers)
//   - previewClientSide() — DELETED (no production callers)
//   - generateClientExportHtml() — DELETED (only used by above)
//   - buildPayload() — DELETED (only used by above)
//
// The ONLY production export path is Vite SSR via POST /api/export.
// If Path A fails, the user sees a clear error — NOT a degraded fallback.
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';

/**
 * Export HTML using the Vite SSR pipeline.
 * Sends page data to the API route, which injects it into the
 * pre-built template and returns a single HTML file.
 */
export function useViteExport() {
  const pages = useCanvaStore((s) => s.pages);
  const ratioId = useCanvaStore((s) => s.ratioId);

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

  /**
   * Primary export entry point. Uses Vite SSR (Path A) — the only
   * production source of truth. If Path A fails, shows a clear error
   * instead of silently falling back.
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
    exportWithFallback,
  };
}
