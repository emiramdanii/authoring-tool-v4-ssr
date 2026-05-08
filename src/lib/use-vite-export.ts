// ═══════════════════════════════════════════════════════════════════════
// VITE EXPORT HOOK — Calls the Next.js API route to generate
// a standalone HTML file using the Vite-built template + data injection.
// Replaces the old exportUnifiedHTML() string-based pipeline.
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { toast } from 'sonner';

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
          cp: authStore.cp,
          tp: authStore.tp,
          materi: authStore.materi,
          skenario: authStore.skenario,
          petunjuk: authStore.petunjuk,
          diskusi: authStore.diskusi,
          refleksi: authStore.refleksi,
          penutup: authStore.penutup,
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
      console.error('[Vite Export] Error:', err);
      toast.error(`Gagal export: ${err.message}`, { id: 'export-ssr' });
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
          cp: authStore.cp,
          tp: authStore.tp,
          materi: authStore.materi,
          skenario: authStore.skenario,
          petunjuk: authStore.petunjuk,
          diskusi: authStore.diskusi,
          refleksi: authStore.refleksi,
          penutup: authStore.penutup,
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
      console.error('[Vite Export Preview] Error:', err);
      toast.error(`Gagal preview: ${err.message}`);
    }
  }, [pages, ratioId]);

  return { exportHTML, previewHTML };
}
