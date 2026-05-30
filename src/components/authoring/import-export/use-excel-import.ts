'use client';

import { useCallback, useRef, useState } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import { toast } from 'sonner';
import type { WorkBook } from 'xlsx';
import type { SheetPreview } from './types';
import { logger } from '@/core/utils/logger';
import {
  META_HEADERS,
  CP_HEADERS,
  TP_HEADERS,
  ATP_HEADERS,
  ALUR_HEADERS,
  KUIS_HEADERS,
} from './constants';
import { sheetToAoa, normalizeSheetName } from './helpers';

// ── Lazy-loaded XLSX module ─────────────────────────────────────
// xlsx (7.3MB) is only needed when the user imports/exports Excel.
// We dynamically import it so it's never included in the initial bundle.
let xlsxCache: Promise<typeof import('xlsx')> | null = null;
function getXLSX(): Promise<typeof import('xlsx')> {
  if (!xlsxCache) xlsxCache = import('xlsx');
  return xlsxCache;
}

export function useExcelImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSheets, setPreviewSheets] = useState<SheetPreview[]>([]);
  const [pendingWorkbook, setPendingWorkbook] = useState<WorkBook | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState('META');

  // ── Import JSON ─────────────────────────────────────
  const handleImportJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const store = useAuthoringStore.getState();
        useAuthoringStore.setState({
          meta: data.meta || store.meta,
          cp: data.cp || store.cp,
          tp: data.tp || [],
          atp: data.atp || store.atp,
          alur: data.alur || [],
          skenario: data.skenario || [],
          kuis: data.kuis || [],
          modules: data.modules || [],
          // Phase 5-H: games auto-derived from modules via subscription
          materi: data.materi || { blok: [] },
          dirty: true,
        });
        useCanvaStore.setState({ panelRequest: 'dashboard' });
        toast.success('✅ Data berhasil diimport!');
      } catch {
        toast.error('❌ Gagal membaca file JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // ── Download Excel Template ──────────────────────────────
  const downloadExcelTemplate = useCallback(async () => {
    const XLSX = await getXLSX();
    const s = useAuthoringStore.getState();
    const wb = XLSX.utils.book_new();

    // META sheet
    const metaAoa: (string | number)[][] = [
      META_HEADERS,
      [
        s.meta.judulPertemuan || 'Pertemuan 1 – Judul',
        s.meta.subjudul || 'Sub-judul pertemuan',
        s.meta.ikon || '📖',
        s.meta.durasi || '2×40 menit',
        s.meta.namaBab || 'Bab 1',
        s.meta.mapel || 'PPKn',
        s.meta.kelas || 'VII',
        s.meta.kurikulum || 'Kurikulum Merdeka',
      ],
    ];
    const metaWs = XLSX.utils.aoa_to_sheet(metaAoa);
    metaWs['!cols'] = META_HEADERS.map(() => ({ wch: 30 }));
    XLSX.utils.book_append_sheet(wb, metaWs, 'META');

    // CP sheet
    const cpAoa: (string | number)[][] = [
      CP_HEADERS,
      [
        s.cp.elemen || 'Pancasila',
        s.cp.subElemen || 'Pemahaman norma dan nilai',
        s.cp.capaianFase || 'Peserta didik mampu menganalisis...',
        s.cp.profil.join(', ') || 'Beriman, Bernalar Kritis, Bergotong Royong',
        s.cp.fase || 'D',
        s.cp.kelas || 'VII',
      ],
    ];
    const cpWs = XLSX.utils.aoa_to_sheet(cpAoa);
    cpWs['!cols'] = CP_HEADERS.map((h) => ({ wch: h === 'capaianFase' ? 60 : 30 }));
    XLSX.utils.book_append_sheet(wb, cpWs, 'CP');

    // TP sheet
    const tpAoa: (string | number)[][] = [
      TP_HEADERS,
      ...s.tp.map((t) => [t.verb, t.desc, t.pertemuan, t.color]),
    ];
    if (s.tp.length === 0) {
      tpAoa.push(['Menjelaskan', 'Deskripsi tujuan pembelajaran', 1, '#f9c82e']);
    }
    const tpWs = XLSX.utils.aoa_to_sheet(tpAoa);
    tpWs['!cols'] = [{ wch: 20 }, { wch: 60 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, tpWs, 'TP');

    // ATP sheet
    const atpAoa: (string | number)[][] = [
      ATP_HEADERS,
      ...s.atp.pertemuan.map((p, i) => [
        s.atp.namaBab || 'Bab 1',
        i + 1,
        p.judul || 'Judul Pertemuan',
        p.tp || 'TP 1 – ...',
        p.durasi || '2×40 menit',
        p.kegiatan || 'Kegiatan pembelajaran',
        p.penilaian || 'Observasi + Kuis',
      ]),
    ];
    if (s.atp.pertemuan.length === 0) {
      atpAoa.push(['Bab 1', 1, 'Judul Pertemuan', 'TP 1 – ...', '2×40 menit', 'Kegiatan...', 'Observasi']);
    }
    const atpWs = XLSX.utils.aoa_to_sheet(atpAoa);
    atpWs['!cols'] = [{ wch: 20 }, { wch: 5 }, { wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 50 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, atpWs, 'ATP');

    // ALUR sheet
    const alurAoa: (string | number)[][] = [
      ALUR_HEADERS,
      ...s.alur.map((a, i) => [i + 1, a.fase, a.durasi, a.judul, a.deskripsi]),
    ];
    if (s.alur.length === 0) {
      alurAoa.push([1, 'Pendahuluan', '10 menit', 'Apersepsi', 'Guru menyapa siswa...']);
    }
    const alurWs = XLSX.utils.aoa_to_sheet(alurAoa);
    alurWs['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, alurWs, 'ALUR');

    // KUIS sheet
    const kuisAoa: (string | number)[][] = [
      KUIS_HEADERS,
      ...s.kuis.map((k, i) => [
        i + 1,
        k.q,
        k.opts[0] || '',
        k.opts[1] || '',
        k.opts[2] || '',
        k.opts[3] || '',
        ['A', 'B', 'C', 'D'][k.ans] || 'A',
        k.ex,
      ]),
    ];
    if (s.kuis.length === 0) {
      kuisAoa.push([1, 'Soal pilihan ganda?', 'Opsi A', 'Opsi B', 'Opsi C', 'Opsi D', 'A', 'Penjelasan jawaban']);
    }
    const kuisWs = XLSX.utils.aoa_to_sheet(kuisAoa);
    kuisWs['!cols'] = [{ wch: 5 }, { wch: 50 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 10 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, kuisWs, 'KUIS');

    // Download
    const filename = (s.meta.judulPertemuan || 'template')
      .replace(/[^a-z0-9\-]/gi, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    XLSX.writeFile(wb, `${filename}.xlsx`);
    toast.success('✅ Template Excel berhasil didownload!');
  }, []);

  // ── Parse Excel file and build preview ───────────────────
  const parseExcelFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const XLSX = await getXLSX();
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheets: SheetPreview[] = [];

        for (const sheetName of wb.SheetNames) {
          const normName = normalizeSheetName(sheetName);
          const ws = wb.Sheets[sheetName];
          const aoa = sheetToAoa(XLSX!, ws);

          if (aoa.length === 0) continue;

          // Use first row as headers
          const headers = aoa[0]!.map((h) => h.trim());
          const rows = aoa.slice(1);

          sheets.push({
            name: normName,
            headers,
            rows,
          });
        }

        if (sheets.length === 0) {
          toast.error('❌ File Excel kosong atau tidak valid');
          return;
        }

        setPendingWorkbook(wb);
        setPreviewSheets(sheets);
        setActivePreviewTab(sheets[0]!.name);
        setPreviewOpen(true);
      } catch (err) {
        logger.error('ExcelImport', err);
        toast.error('❌ Gagal membaca file Excel');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // ── Apply parsed Excel data to store ─────────────────────
  const confirmExcelImport = useCallback(() => {
    if (!pendingWorkbook) return;

    const store = useAuthoringStore.getState();
    const updates: Record<string, unknown> = { dirty: true };

    // Collect data from each sheet
    const sheetMap = new Map<string, SheetPreview>();
    for (const sp of previewSheets) {
      sheetMap.set(sp.name, sp);
    }

    // META
    const metaSheet = sheetMap.get('META');
    if (metaSheet && metaSheet.rows.length > 0) {
      const r = metaSheet.rows[0];
      updates.meta = {
        judulPertemuan: r![0]! ?? '',
        subjudul: r![1]! ?? '',
        ikon: r![2]! ?? '',
        durasi: r![3]! ?? '',
        namaBab: r![4]! ?? '',
        mapel: r![5]! ?? '',
        kelas: r![6]! ?? '',
        kurikulum: r![7]! ?? '',
      };
    }

    // CP
    const cpSheet = sheetMap.get('CP');
    if (cpSheet && cpSheet.rows.length > 0) {
      const r = cpSheet.rows[0];
      const profilStr = r![3]! ?? '';
      const profil = profilStr
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
      updates.cp = {
        elemen: r![0]! ?? '',
        subElemen: r![1]! ?? '',
        capaianFase: r![2]! ?? '',
        profil,
        fase: r![4]! ?? 'D',
        kelas: r![5]! ?? '',
      };
    }

    // TP
    const tpSheet = sheetMap.get('TP');
    if (tpSheet && tpSheet.rows.length > 0) {
      const tp = tpSheet.rows
        .filter((r) => r.some((c) => c.trim() !== ''))
        .map((r) => ({
          verb: r[0] ?? '',
          desc: r[1] ?? '',
          pertemuan: parseInt(String(r[2]), 10) || 1,
          color: r[3] ?? '#f9c82e',
        }));
      updates.tp = tp;
    }

    // ATP
    const atpSheet = sheetMap.get('ATP');
    if (atpSheet && atpSheet.rows.length > 0) {
      const namaBab = atpSheet.rows[0]![0] ?? '';
      const pertemuan = atpSheet.rows
        .filter((r) => r.some((c) => c.trim() !== ''))
        .map((r) => ({
          judul: r[2] ?? '',
          tp: r[3] ?? '',
          durasi: r[4] ?? '',
          kegiatan: r[5] ?? '',
          penilaian: r[6] ?? '',
        }));
      updates.atp = {
        namaBab,
        jumlahPertemuan: pertemuan.length || 3,
        pertemuan,
      };
    }

    // ALUR
    const alurSheet = sheetMap.get('ALUR');
    if (alurSheet && alurSheet.rows.length > 0) {
      const alur = alurSheet.rows
        .filter((r) => r.some((c) => c.trim() !== ''))
        .map((r) => ({
          fase: r[1] ?? '',
          durasi: r[2] ?? '',
          judul: r[3] ?? '',
          deskripsi: r[4] ?? '',
        }));
      updates.alur = alur;
    }

    // KUIS
    const kuisSheet = sheetMap.get('KUIS');
    if (kuisSheet && kuisSheet.rows.length > 0) {
      const kuis = kuisSheet.rows
        .filter((r) => r.some((c) => c.trim() !== ''))
        .map((r) => {
          const jawaban = String(r[6] ?? 'A').toUpperCase().charCodeAt(0) - 65;
          return {
            q: r[1] ?? '',
            opts: [r[2] ?? '', r[3] ?? '', r[4] ?? '', r[5] ?? ''],
            ans: isNaN(jawaban) || jawaban < 0 || jawaban > 3 ? 0 : jawaban,
            ex: r[7] ?? '',
          };
        });
      updates.kuis = kuis;
    }

    useAuthoringStore.setState(updates);
    useCanvaStore.setState({ panelRequest: 'dashboard' });

    // Clean up
    setPendingWorkbook(null);
    setPreviewSheets([]);
    setPreviewOpen(false);

    const importedSheets = Object.keys(updates).filter((k) => k !== 'dirty');
    toast.success(`✅ ${importedSheets.length} sheet berhasil diimport!`);
  }, [pendingWorkbook, previewSheets]);

  // ── Drag & drop handlers ─────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (!file!.name.match(/\.xlsx?$/i)) {
      toast.error('❌ Hanya file .xlsx yang didukung');
      return;
    }

    parseExcelFile!(file);
  }, [parseExcelFile]);

  const handleExcelFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.xlsx?$/i)) {
      toast.error('❌ Hanya file .xlsx yang didukung');
      return;
    }
    parseExcelFile(file);
    e.target.value = '';
  }, [parseExcelFile]);

  // ── Close preview handler ─────────────────────────────────
  const closePreview = useCallback(() => {
    setPendingWorkbook(null);
    setPreviewSheets([]);
    setPreviewOpen(false);
  }, []);

  return {
    fileInputRef,
    isDragOver,
    previewOpen,
    previewSheets,
    pendingWorkbook,
    activePreviewTab,
    setActivePreviewTab,
    setPreviewOpen,
    handleImportJSON,
    downloadExcelTemplate,
    parseExcelFile,
    confirmExcelImport,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleExcelFileSelect,
    closePreview,
  };
}
