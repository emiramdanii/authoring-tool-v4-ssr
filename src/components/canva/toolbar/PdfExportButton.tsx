// ═══════════════════════════════════════════════════════════════════════
// PDF EXPORT BUTTON — Toolbar button for server-side PDF generation
// ═══════════════════════════════════════════════════════════════════════
// Calls /api/export/pdf with the current canva state,
// generates a native PDF via Puppeteer on the server, and downloads it.
// Shows a loading spinner while generating.
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useState, useCallback } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { toast } from 'sonner';

export function PdfExportButton() {
  const [loading, setLoading] = useState(false);
  const pages = useCanvaStore((s) => s.pages);
  const ratioId = useCanvaStore((s) => s.ratioId);

  const handleExportPdf = useCallback(async () => {
    setLoading(true);
    toast.loading(`Membuat PDF (${pages.length} halaman)...`, { id: 'export-pdf' });

    try {
      // Get the current authoring store state for metadata
      const authStore = useAuthoringStore.getState();

      // Build the export payload (same format as /api/export)
      const payload = {
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
        // PDF-specific options
        format: 'A4',
        landscape: false,
        includeAnswerKeys: true,
      };

      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `PDF export failed with status ${response.status}`);
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'mpi-export.pdf';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.success(`PDF berhasil dibuat (${pages.length} halaman, ${(blob.size / 1024).toFixed(0)} KB)`, { id: 'export-pdf' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PDF Export] Error:', error);
      toast.error(`Gagal membuat PDF: ${message}`, { id: 'export-pdf' });
    } finally {
      setLoading(false);
    }
  }, [pages, ratioId]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleExportPdf}
      disabled={loading}
      className="focus-ring hover:scale-105 active:scale-95 transition-transform gap-1"
      title="Export PDF — Buat file PDF native dari halaman MPI"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <FileDown size={14} />
      )}
      {loading ? (
        <span className="hidden md:inline text-[9px] font-semibold">Generating...</span>
      ) : (
        <span className="hidden md:inline text-[9px] font-semibold">PDF</span>
      )}
    </Button>
  );
}
