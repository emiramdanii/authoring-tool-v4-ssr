'use client';

import { useState, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { deriveExportPayloadFromSchema } from '@/core/schema/export-projection';
import { useViteExport } from '@/lib/use-vite-export';
import { useExportActions as useSharedExportActions } from '@/components/authoring/import-export/use-export-actions';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';

// ═══════════════════════════════════════════════════════════════════
// TOOLBAR EXPORT ACTIONS HOOK
// ═══════════════════════════════════════════════════════════════════
// Encapsulates all export logic that was previously in the Toolbar
// god component. Each function is self-contained with its own
// loading state and toast feedback.
// ═══════════════════════════════════════════════════════════════════

export function useExportActions() {
  const [isExporting, setIsExporting] = useState(false);

  const { exportWithFallback, previewHTML } = useViteExport();
  const { exportJSON } = useSharedExportActions();

  /** Download HTML — auto-picks best method (Vite → client-side fallback) */
  const exportHtml = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportWithFallback();
      window.dispatchEvent(new CustomEvent('silse-export-success'));
    } finally {
      setIsExporting(false);
    }
  }, [exportWithFallback]);

  /** Preview in new tab */
  const previewTab = useCallback(async () => {
    try {
      await previewHTML();
    } catch {
      toast.error('Gagal membuat preview');
    }
  }, [previewHTML]);

  /** Download SCORM 1.2 ZIP — for Moodle LMS import */
  const exportScorm = useCallback(async () => {
    const canvaState = useCanvaStore.getState();
    const authState = useAuthoringStore.getState();

    setIsExporting(true);
    toast.loading(`Membuat SCORM (${canvaState.pages.length} halaman)...`, { id: 'export-scorm' });

    try {
      // Phase 5: Content data from schema (single source of truth)
      const schemaPayload = deriveExportPayloadFromSchema(canvaState.pages);

      const payload = {
        pages: canvaState.pages,
        ratioId: canvaState.ratioId,
        meta: authState.meta,
        cp: authState.cp,
        tp: authState.tp,
        atp: authState.atp,
        alur: authState.alur,
        suara: authState.suara,
        ...schemaPayload,
      };

      const response = await fetch('/api/export/scorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Kesalahan tidak diketahui' }));
        throw new Error(errorData.error || `SCORM export gagal (status ${response.status})`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'mpi-scorm.zip';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.success(`SCORM berhasil dibuat (${canvaState.pages.length} halaman, ${(blob.size / 1024).toFixed(0)} KB) — Upload ke Moodle!`, { id: 'export-scorm' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Kesalahan tidak diketahui';
      logger.error('SCORM Export', err);
      toast.error(`Gagal membuat SCORM: ${message}`, { id: 'export-scorm' });
    } finally {
      setIsExporting(false);
    }
  }, []);

  /** Browser print */
  const print = useCallback(() => {
    window.print();
  }, []);

  /** Clear all elements on current page */
  const clearCanvas = useCallback(() => {
    if (confirm('Bersihkan semua elemen di halaman ini? Tindakan ini bisa di-undo.')) {
      useCanvaStore.getState().clearStage();
    }
  }, []);

  return {
    exportHtml,
    exportScorm,
    exportJson: exportJSON,
    previewTab,
    print,
    clearCanvas,
    isExporting,
  };
}
