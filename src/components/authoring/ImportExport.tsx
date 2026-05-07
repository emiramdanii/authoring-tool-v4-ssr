'use client';

import { useCallback, useRef, useState } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import { generateExportHtml, generatePrintAdminHtml } from '@/lib/export-html';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileSpreadsheet, X, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';

// ── Types for parsed Excel data ──────────────────────────────────
interface SheetPreview {
  name: string;
  headers: string[];
  rows: string[][];
}

// ── Sheet config constants ──────────────────────────────────────
const META_HEADERS = ['judulPertemuan', 'subjudul', 'ikon', 'durasi', 'namaBab', 'mapel', 'kelas', 'kurikulum'];
const CP_HEADERS = ['elemen', 'subElemen', 'capaianFase', 'profil', 'fase', 'kelas'];
const TP_HEADERS = ['verb', 'desc', 'pertemuan', 'color'];
const ATP_HEADERS = ['namaBab', 'no', 'judul', 'tp', 'durasi', 'kegiatan', 'penilaian'];
const ALUR_HEADERS = ['no', 'fase', 'durasi', 'judul', 'deskripsi'];
const KUIS_HEADERS = ['no', 'soal', 'optA', 'optB', 'optC', 'optD', 'jawaban', 'penjelasan'];

const SHEET_NAMES = ['META', 'CP', 'TP', 'ATP', 'ALUR', 'KUIS'] as const;
const HEADER_MAP: Record<string, string[]> = {
  META: META_HEADERS,
  CP: CP_HEADERS,
  TP: TP_HEADERS,
  ATP: ATP_HEADERS,
  ALUR: ALUR_HEADERS,
  KUIS: KUIS_HEADERS,
};

const SHEET_DESCRIPTIONS: Record<string, string> = {
  META: 'Metadata pertemuan',
  CP: 'Capaian Pembelajaran',
  TP: 'Tujuan Pembelajaran',
  ATP: 'Alur Tujuan Pembelajaran',
  ALUR: 'Alur Kegiatan',
  KUIS: 'Soal Kuis',
};

const SHEET_COLORS: Record<string, string> = {
  META: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  CP: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  TP: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  ATP: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  ALUR: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  KUIS: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

// ── Helper: convert sheet to array of arrays ────────────────────
function sheetToAoa(sheet: XLSX.WorkSheet): string[][] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const rows: string[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      row.push(cell?.v != null ? String(cell.v) : '');
    }
    rows.push(row);
  }
  return rows;
}

// ── Helper: normalize sheet name (case-insensitive, trim) ──────
function normalizeSheetName(name: string): string {
  const upper = name.toUpperCase().trim();
  for (const sn of SHEET_NAMES) {
    if (upper === sn || upper === sn.replace(/\s/g, '')) return sn;
  }
  return name;
}

export default function ImportExport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSheets, setPreviewSheets] = useState<SheetPreview[]>([]);
  const [pendingWorkbook, setPendingWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState('META');

  // ── Existing: Export JSON ──────────────────────────────────────
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

  // ── Existing: Export Student HTML ──────────────────────────────
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

  // ── Existing: Cetak Dokumen Admin ─────────────────────────────
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

  // ── Existing: Import JSON ─────────────────────────────────────
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
          games: data.games || [],
          materi: data.materi || { blok: [] },
          dirty: true,
        });
        store.setActivePanel('dashboard');
        toast.success('✅ Data berhasil diimport!');
      } catch {
        toast.error('❌ Gagal membaca file JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // ── NEW: Download Excel Template ──────────────────────────────
  const downloadExcelTemplate = useCallback(() => {
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

  // ── NEW: Parse Excel file and build preview ───────────────────
  const parseExcelFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheets: SheetPreview[] = [];

        for (const sheetName of wb.SheetNames) {
          const normName = normalizeSheetName(sheetName);
          const ws = wb.Sheets[sheetName];
          const aoa = sheetToAoa(ws);

          if (aoa.length === 0) continue;

          // Use first row as headers
          const headers = aoa[0].map((h) => h.trim());
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
        setActivePreviewTab(sheets[0].name);
        setPreviewOpen(true);
      } catch (err) {
        console.error('Excel parse error:', err);
        toast.error('❌ Gagal membaca file Excel');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // ── NEW: Apply parsed Excel data to store ─────────────────────
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
        judulPertemuan: r[0] ?? '',
        subjudul: r[1] ?? '',
        ikon: r[2] ?? '',
        durasi: r[3] ?? '',
        namaBab: r[4] ?? '',
        mapel: r[5] ?? '',
        kelas: r[6] ?? '',
        kurikulum: r[7] ?? '',
      };
    }

    // CP
    const cpSheet = sheetMap.get('CP');
    if (cpSheet && cpSheet.rows.length > 0) {
      const r = cpSheet.rows[0];
      const profilStr = r[3] ?? '';
      const profil = profilStr
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
      updates.cp = {
        elemen: r[0] ?? '',
        subElemen: r[1] ?? '',
        capaianFase: r[2] ?? '',
        profil,
        fase: r[4] ?? 'D',
        kelas: r[5] ?? '',
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
      const namaBab = atpSheet.rows[0][0] ?? '';
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
    store.setActivePanel('dashboard');

    // Clean up
    setPendingWorkbook(null);
    setPreviewSheets([]);
    setPreviewOpen(false);

    const importedSheets = Object.keys(updates).filter((k) => k !== 'dirty');
    toast.success(`✅ ${importedSheets.length} sheet berhasil diimport!`);
  }, [pendingWorkbook, previewSheets]);

  // ── NEW: Drag & drop handlers ─────────────────────────────────
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
    if (!file.name.match(/\.xlsx?$/i)) {
      toast.error('❌ Hanya file .xlsx yang didukung');
      return;
    }

    parseExcelFile(file);
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

  // ── Count rows for badge ──────────────────────────────────────
  const getRowCount = (sheetName: string): number => {
    const sheet = previewSheets.find((s) => s.name === sheetName);
    if (!sheet) return 0;
    return sheet.rows.filter((r) => r.some((c) => c.trim() !== '')).length;
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <span>📥</span> Import / Export
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Export media pembelajaran untuk siswa, cetak dokumen admin, atau import data proyek.
        </p>
      </div>

      {/* ── Unified Export (RECOMMENDED) ──────────────────────── */}
      <div className="bg-zinc-900 border border-emerald-800/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-emerald-300 mb-1 flex items-center gap-2">
          🚀 Export Interaktif (Unified) — Rekomendasi
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Download HTML lengkap dengan <strong className="text-emerald-400">navigasi pintar</strong> (Lanjut → / ← Kembali), <strong className="text-emerald-400">game engines</strong> (11+ tipe), dan layout canvas.
          Mode Unified menggabungkan kekuatan canvas + template + game engines.
        </p>
        <button
          onClick={() => {
            try {
              const { useCanvaStore } = require('@/store/canva-store');
              const html = useCanvaStore.getState().exportUnifiedHTML();
              const s = useAuthoringStore.getState();
              const filename = (s.meta.judulPertemuan || 'media')
                .replace(/[^a-z0-9\-]/gi, '-')
                .replace(/-+/g, '-')
                .toLowerCase();
              const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${filename}-unified.html`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('🚀 Export Unified berhasil didownload!');
            } catch (err) {
              console.error('Unified export failed:', err);
              toast.error('❌ Gagal mengexport Unified HTML');
            }
          }}
          className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Download className="size-4" />
          Export HTML Interaktif (Unified)
        </button>
        <p className="text-[0.65rem] text-zinc-500 mt-2">
          🚀 Navigasi pintar + game engines + canvas layout — satu file HTML lengkap
        </p>
      </div>

      {/* ── Template Export ──────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-1 flex items-center gap-2">
          🎓 Export Template
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Download HTML template system dengan navigasi screen-based (Cover → CP → Skenario → Materi → Kuis → Hasil).
        </p>
        <button
          onClick={exportStudentHtml}
          className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Download className="size-4" />
          Export HTML Template
        </button>
        <p className="text-[0.65rem] text-zinc-500 mt-2">
          Template system dengan screen navigation
        </p>
      </div>

      {/* ── Admin Print ───────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-1 flex items-center gap-2">
          🖨️ Cetak Dokumen Admin
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Buka jendela cetak dengan tabel CP, TP, ATP, dan Alur Pembelajaran untuk dokumentasi guru.
        </p>
        <button
          onClick={cetakDokumenAdmin}
          className="w-full px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          🖨️ Cetak Dokumen Admin
        </button>
      </div>

      {/* ── JSON Import / Export ─────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Export JSON */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">📤 Export JSON</h3>
          <p className="text-xs text-zinc-400 mb-4">
            Download semua data proyek sebagai file JSON untuk backup atau transfer antar perangkat.
          </p>
          <button
            onClick={exportJSON}
            className="w-full px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm rounded-lg transition-colors"
          >
            📋 Export JSON
          </button>
        </div>

        {/* Import JSON */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">📥 Import JSON</h3>
          <p className="text-xs text-zinc-400 mb-4">
            Upload file JSON yang sebelumnya di-export untuk mengembalikan data proyek.
          </p>
          <label className="block w-full px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm rounded-lg transition-colors text-center cursor-pointer">
            📂 Pilih File JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* ── Excel Import / Export ────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="size-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-200">📊 Import / Export Excel (.xlsx)</h3>
        </div>
        <p className="text-xs text-zinc-400">
          Import data dari spreadsheet Excel atau download template yang sudah diisi dengan data saat ini.
          File .xlsx berisi 6 sheet: META, CP, TP, ATP, ALUR, dan KUIS.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Download Template */}
          <button
            onClick={downloadExcelTemplate}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download className="size-4" />
            Download Template .xlsx
          </button>

          {/* Upload Excel */}
          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm rounded-lg transition-colors cursor-pointer">
            <Upload className="size-4" />
            Pilih File .xlsx
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
            ${isDragOver
              ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
              : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50'
            }
          `}
        >
          <div className="flex flex-col items-center gap-2">
            {isDragOver ? (
              <>
                <CheckCircle2 className="size-8 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-300">
                  Lepaskan file di sini...
                </p>
              </>
            ) : (
              <>
                <FileSpreadsheet className="size-8 text-zinc-500" />
                <p className="text-sm text-zinc-400">
                  <span className="font-medium text-zinc-300">Drag & drop</span> file .xlsx ke sini
                </p>
                <p className="text-xs text-zinc-600">
                  atau gunakan tombol &quot;Pilih File .xlsx&quot; di atas
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Excel Preview Modal ──────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={(open) => {
        if (!open) {
          setPendingWorkbook(null);
          setPreviewSheets([]);
        }
        setPreviewOpen(open);
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 sm:max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <DialogTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Eye className="size-5 text-amber-400" />
              Preview Import Excel
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Periksa data dari setiap sheet sebelum mengimport. Data yang sudah ada akan ditimpa.
            </DialogDescription>
          </DialogHeader>

          {/* Summary badges */}
          <div className="px-6 pb-3 flex flex-wrap gap-2 flex-shrink-0">
            {SHEET_NAMES.map((name) => {
              const count = getRowCount(name);
              const hasData = count > 0;
              return (
                <Badge
                  key={name}
                  variant="outline"
                  className={`
                    text-xs cursor-pointer transition-all
                    ${hasData ? SHEET_COLORS[name] : 'bg-zinc-800 text-zinc-500 border-zinc-700'}
                    ${activePreviewTab === name ? 'ring-2 ring-amber-500/50' : ''}
                  `}
                  onClick={() => setActivePreviewTab(name)}
                >
                  {name}
                  <span className="ml-1 opacity-70">({count})</span>
                </Badge>
              );
            })}
          </div>

          {/* Sheet preview tabs with tables */}
          <div className="flex-1 overflow-hidden px-6 pb-4">
            <Tabs value={activePreviewTab} onValueChange={setActivePreviewTab}>
              {SHEET_NAMES.map((name) => {
                const sheet = previewSheets.find((s) => s.name === name);
                if (!sheet) return null;

                return (
                  <TabsContent key={name} value={name} className="mt-0 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-200">{name}</span>
                        <span className="text-xs text-zinc-500">{SHEET_DESCRIPTIONS[name]}</span>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {sheet.rows.filter((r) => r.some((c) => c.trim() !== '')).length} baris data
                      </span>
                    </div>

                    <ScrollArea className="flex-1 rounded-lg border border-zinc-800 max-h-[45vh]">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-zinc-800 hover:bg-transparent">
                            {sheet.headers.map((h, i) => (
                              <TableHead
                                key={i}
                                className="bg-zinc-800/80 text-zinc-300 text-xs font-semibold py-2 px-3 whitespace-nowrap"
                              >
                                {h}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sheet.rows.filter((r) => r.some((c) => c.trim() !== '')).length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={sheet.headers.length}
                                className="text-center text-zinc-500 py-8"
                              >
                                Tidak ada data
                              </TableCell>
                            </TableRow>
                          ) : (
                            sheet.rows
                              .filter((r) => r.some((c) => c.trim() !== ''))
                              .map((row, ri) => (
                                <TableRow key={ri} className="border-zinc-800/50">
                                  {sheet.headers.map((_, ci) => (
                                    <TableCell
                                      key={ci}
                                      className="text-xs text-zinc-300 py-1.5 px-3 max-w-[200px] truncate"
                                      title={row[ci] ?? ''}
                                    >
                                      {row[ci] ?? ''}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>

          {/* Warning + Actions */}
          <DialogFooter className="p-6 pt-3 border-t border-zinc-800 flex-shrink-0 gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-400/80 mr-auto">
              <AlertTriangle className="size-3.5 flex-shrink-0" />
              <span>Data yang sudah ada di editor akan ditimpa.</span>
            </div>
            <button
              onClick={() => {
                setPendingWorkbook(null);
                setPreviewSheets([]);
                setPreviewOpen(false);
              }}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              onClick={confirmExcelImport}
              className="px-5 py-2 text-sm font-semibold text-black bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="size-4" />
              Konfirmasi Import
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Info Section ─────────────────────────────────────── */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">💡 Tips</h4>
        <ul className="text-xs text-zinc-500 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 flex-shrink-0 mt-0.5">•</span>
            Gunakan <strong className="text-emerald-300">Export Interaktif (Unified)</strong> untuk hasil terbaik — navigasi pintar, game engines, dan layout canvas dalam satu file.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 flex-shrink-0 mt-0.5">•</span>
            <strong className="text-zinc-300">Cetak Dokumen Admin</strong> berguna untuk bahan administrasi guru — berisi tabel CP, TP, ATP, dan Alur.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 flex-shrink-0 mt-0.5">•</span>
            <strong className="text-zinc-300">Export/Import JSON</strong> untuk backup data proyek atau pindah antar perangkat.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 flex-shrink-0 mt-0.5">•</span>
            <strong className="text-zinc-300">Template Excel</strong> memudahkan mengisi data di spreadsheet lalu import ke editor. Download template, isi di Excel/Sheets, lalu upload kembali.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 flex-shrink-0 mt-0.5">•</span>
            <strong className="text-zinc-300">Import Excel</strong> akan menimpa data META, CP, TP, ATP, ALUR, dan KUIS. Pastikan untuk preview sebelum mengkonfirmasi.
          </li>
        </ul>
      </div>
    </div>
  );
}
