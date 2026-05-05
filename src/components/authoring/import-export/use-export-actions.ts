'use client';

import { useCallback } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import { generateExportHtml, generatePrintAdminHtml } from '@/lib/export-html';
import { toast } from 'sonner';

export function useExportActions() {
  const exportJSON = useCallback(() => {
    const s = useAuthoringStore.getState();
    const data = {
      meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
      skenario: s.skenario, kuis: s.kuis, modules: s.modules,
      games: s.games, materi: s.materi,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `authoring-tool-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('✅ JSON berhasil diekspor!');
  }, []);

  const exportStudentHtml = useCallback(() => {
    const s = useAuthoringStore.getState();

    // ── Pre-export validation warnings ─────────────────────────
    if (!s.meta.judulPertemuan?.trim()) {
      toast.warning('⚠️ Judul pertemuan kosong. Isi terlebih dahulu di panel Dokumen.');
    }
    if (s.kuis.length === 0) {
      toast.warning('⚠️ Belum ada soal kuis.');
    }
    if (s.materi.blok.length === 0) {
      toast.warning('⚠️ Materi kosong.');
    }

    try {
      const html = generateExportHtml({
        meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
        skenario: s.skenario, kuis: s.kuis, materi: s.materi,
        modules: s.modules, games: s.games,
      });
      const filename = (s.meta.judulPertemuan || 'media')
        .replace(/[^a-z0-9\-]/gi, '-')
        .replace(/-+/g, '-')
        .toLowerCase();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('✅ Media pembelajaran berhasil didownload!');
    } catch (err) {
      console.error('Export HTML failed:', err);
      toast.error('❌ Gagal mengexport HTML');
    }
  }, []);

  const cetakDokumenAdmin = useCallback(() => {
    const s = useAuthoringStore.getState();
    try {
      const html = generatePrintAdminHtml({
        meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
        skenario: s.skenario, kuis: s.kuis, materi: s.materi,
        modules: s.modules, games: s.games,
      });
      const win = window.open('', '_blank');
      if (!win) {
        toast.error('❌ Popup diblokir oleh browser');
        return;
      }
      win.document.write(html);
      win.document.close();
      win.print();
      toast.success('🖨️ Jendela cetak dibuka');
    } catch (err) {
      console.error('Print admin failed:', err);
      toast.error('❌ Gagal membuka jendela cetak');
    }
  }, []);

  return { exportJSON, exportStudentHtml, cetakDokumenAdmin };
}
