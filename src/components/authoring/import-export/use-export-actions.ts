'use client';

import { useCallback } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import { deriveExportPayloadFromSchema } from '@/core/schema/export-projection';
import { useViteExport } from '@/lib/use-vite-export';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';

/** Minimal interfaces for the print-export context.
 *  These capture only the properties accessed when generating
 *  the admin print document. Fields are optional because the
 *  data may come from imported JSON with varying shapes. */
interface PrintableTpItem {
  tujuan?: string;
  label?: string;
  indikator?: string;
  [key: string]: unknown;
}

interface PrintableAtpPertemuan {
  judul?: string;
  pertemuan?: string;
  tp?: string;
  kegiatan?: string;
  [key: string]: unknown;
}

interface PrintableAlurItem {
  kegiatan?: string;
  label?: string;
  deskripsi?: string;
  durasi?: string;
  [key: string]: unknown;
}

interface PrintableKuisItem {
  soal?: string;
  question?: string;
  jawaban?: string;
  answer?: string;
  [key: string]: unknown;
}

export function useExportActions() {
  const { exportHTML } = useViteExport();

  const exportJSON = useCallback(() => {
    const s = useAuthoringStore.getState();
    const canvaState = useCanvaStore.getState();
    // Phase 5: Content data from schema (single source of truth)
    const schemaPayload = deriveExportPayloadFromSchema(canvaState.pages);
    const data = {
      meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
      ...schemaPayload,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `authoring-tool-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON berhasil diekspor!');
  }, []);

  /** Export student HTML — now uses Vite SSR pipeline (same as preview) */
  const exportStudentHtml = useCallback(async () => {
    const s = useAuthoringStore.getState();
    const canvaState = useCanvaStore.getState();

    // Pre-export validation warnings (Phase 5: kuis from schema)
    if (!s.meta.judulPertemuan?.trim()) {
      toast.warning('Judul pertemuan kosong. Isi terlebih dahulu di panel Dokumen.');
    }
    const schemaPayload = deriveExportPayloadFromSchema(canvaState.pages);
    if (schemaPayload.allKuis.length === 0) {
      toast.warning('Belum ada soal kuis.');
    }

    try {
      await exportHTML();
    } catch (err: unknown) {
      logger.error('ExportHTML', err);
      const message = err instanceof Error ? err.message : 'Kesalahan tidak diketahui';
      toast.error(`Gagal mengexport HTML: ${message}`);
    }
  }, [exportHTML]);

  /** Cetak dokumen admin — generates a simple print-friendly page */
  const cetakDokumenAdmin = useCallback(() => {
    const s = useAuthoringStore.getState();
    try {
      // Build a simple printable HTML for admin docs
      const meta = s.meta;
      const cp = s.cp;
      const tp = s.tp;

      let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dokumen Admin - ${meta.judulPertemuan || 'Media'}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 900px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; }
  h1 { font-size: 22px; border-bottom: 2px solid #333; padding-bottom: 8px; }
  h2 { font-size: 18px; margin-top: 28px; color: #2563eb; }
  h3 { font-size: 15px; margin-top: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: #f1f5f9; font-weight: 600; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin: 12px 0; }
  .meta-grid dt { font-weight: 600; color: #475569; }
  .meta-grid dd { margin: 0; }
  @media print { body { padding: 0; } }
</style></head><body>`;

      // Meta section
      html += `<h1>Dokumen Admin: ${meta.judulPertemuan || '-'}</h1>`;
      html += `<dl class="meta-grid">
        <dt>Mata Pelajaran</dt><dd>${meta.mapel || '-'}</dd>
        <dt>Kelas</dt><dd>${meta.kelas || '-'}</dd>
        <dt>Semester</dt><dd>-</dd>
        <dt>Judul Pertemuan</dt><dd>${meta.judulPertemuan || '-'}</dd>
      </dl>`;

      // CP section
      if (cp?.elemen) {
        html += `<h2>Capaian Pembelajaran (CP)</h2><table><tr><th>#</th><th>Elemen</th><th>Sub Elemen</th><th>Fase</th></tr>`;
        html += `<tr><td>1</td><td>${cp.elemen || '-'}</td><td>${cp.subElemen || '-'}</td><td>${cp.fase || '-'}</td></tr>`;
        html += `</table>`;
      }

      // TP section
      if (tp?.length) {
        html += `<h2>Tujuan Pembelajaran (TP)</h2><table><tr><th>#</th><th>Tujuan</th><th>Indikator</th></tr>`;
        tp.forEach((t, i: number) => { const pt = t as unknown as PrintableTpItem; html += `<tr><td>${i + 1}</td><td>${pt.tujuan || pt.label || '-'}</td><td>${pt.indikator || '-'}</td></tr>`; });
        html += `</table>`;
      }

      // ATP section
      if (s.atp?.pertemuan?.length) {
        html += `<h2>Alur Tujuan Pembelajaran (ATP)</h2><table><tr><th>#</th><th>Pertemuan</th><th>TP</th><th>Materi</th></tr>`;
        s.atp.pertemuan.forEach((a, i: number) => { const pa = a as unknown as PrintableAtpPertemuan; html += `<tr><td>${i + 1}</td><td>${pa.judul || pa.pertemuan || '-'}</td><td>${pa.tp || '-'}</td><td>${pa.kegiatan || '-'}</td></tr>`; });
        html += `</table>`;
      }

      // Alur section
      if (s.alur?.length) {
        html += `<h2>Alur Pembelajaran</h2><table><tr><th>#</th><th>Kegiatan</th><th>Deskripsi</th><th>Durasi</th></tr>`;
        s.alur.forEach((a, i: number) => { const pa = a as unknown as PrintableAlurItem; html += `<tr><td>${i + 1}</td><td>${pa.kegiatan || pa.label || '-'}</td><td>${pa.deskripsi || '-'}</td><td>${pa.durasi || '-'}</td></tr>`; });
        html += `</table>`;
      }

      // Kuis section
      if (s.kuis?.length) {
        html += `<h2>Soal Kuis</h2><table><tr><th>#</th><th>Soal</th><th>Jawaban</th></tr>`;
        s.kuis.forEach((k, i: number) => { const pk = k as unknown as PrintableKuisItem; html += `<tr><td>${i + 1}</td><td>${pk.soal || pk.question || '-'}</td><td>${pk.jawaban || pk.answer || '-'}</td></tr>`; });
        html += `</table>`;
      }

      html += `</body></html>`;

      const win = window.open('', '_blank');
      if (!win) {
        toast.error('Popup diblokir oleh browser');
        return;
      }
      win.document.write(html);
      win.document.close();
      win.print();
      toast.success('Jendela cetak dibuka');
    } catch (err) {
      logger.error('PrintAdmin', err);
      toast.error('Gagal membuka jendela cetak');
    }
  }, []);

  return { exportJSON, exportStudentHtml, cetakDokumenAdmin };
}
