// ═══════════════════════════════════════════════════════════════════════
// VITE EXPORT HOOK — Calls the Next.js API route to generate
// a standalone HTML file using the Vite-built template + data injection.
// Replaces the old exportUnifiedHTML() string-based pipeline.
//
// Phase 6: Added client-side fallback export that generates a
// self-contained HTML entirely in the browser (no Vite dependency).
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
} from '@/lib/client-export';
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
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Export failed with status ${response.status}`);
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
    } catch (err: any) {
      logger.error('Vite Export', err);
      toast.error(`Gagal export: ${err.message}`, { id: 'export-ssr' });
      throw err; // Re-throw so caller can fall back
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
    } catch (err: any) {
      logger.error('Vite Export Preview', err);
      toast.error(`Gagal preview: ${err.message}`);
      throw err;
    }
  }, [pages, ratioId]);

  // ═══════════════════════════════════════════════════════════════════
  // CLIENT-SIDE EXPORT — Pure browser fallback (no Vite dependency)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Export HTML using the client-side generator.
   * Generates a self-contained HTML file entirely in the browser.
   * Always works — no server template required.
   */
  const exportClientSide = useCallback(async () => {
    toast.loading(`Mengekspor ${pages.length} halaman (Client-Side)...`, { id: 'export-client' });

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

      toast.success(`Export client-side selesai (${pages.length} halaman, ${(blob.size / 1024).toFixed(0)} KB)`, { id: 'export-client' });
    } catch (err: any) {
      logger.error('Client Export', err);
      toast.error(`Gagal export client-side: ${err.message}`, { id: 'export-client' });
    }
  }, [pages, ratioId, buildPayload]);

  /**
   * Preview using the client-side generator in a new tab.
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
      toast.success(`Preview client-side dibuka (${pages.length} halaman)`);
    } catch (err: any) {
      logger.error('Client Preview', err);
      toast.error(`Gagal preview client-side: ${err.message}`);
    }
  }, [pages, ratioId, buildPayload]);

  /**
   * Try Vite export first; if it fails, automatically fall back
   * to client-side export. Provides the best experience.
   */
  const exportWithFallback = useCallback(async () => {
    toast.loading(`Mengekspor ${pages.length} halaman...`, { id: 'export-fallback' });

    try {
      // Try Vite SSR export first
      await exportHTML();
    } catch (viteErr) {
      // Vite failed — fall back to client-side
      console.warn('[Export] Vite export failed, falling back to client-side:', viteErr);
      toast.loading(`Vite gagal, menggunakan client-side fallback...`, { id: 'export-fallback' });

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

        toast.success(`Export fallback selesai (${pages.length} halaman, ${(blob.size / 1024).toFixed(0)} KB)`, { id: 'export-fallback' });
      } catch (clientErr: any) {
        logger.error('Export', clientErr);
        toast.error(`Export gagal total: ${clientErr.message}`, { id: 'export-fallback' });
      }
    }
  }, [exportHTML, buildPayload, pages]);

  return {
    exportHTML,
    previewHTML,
    exportClientSide,
    previewClientSide,
    exportWithFallback,
  };
}
