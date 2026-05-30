'use client';

import { useState } from 'react';
import { isEnabled } from '@/config/feature-flags';
// All icons migrated to Material Symbols Outlined
import { toast } from 'sonner';
import { useExportActions } from './use-export-actions';
import { useExcelImport } from './use-excel-import';
import { ExcelPreviewDialog } from './excel-preview-dialog';
import { useViteExport } from '@/lib/use-vite-export';

export default function ImportExport() {
  const { exportJSON, exportStudentHtml, cetakDokumenAdmin } = useExportActions();
  const { exportHTML } = useViteExport();
  const [exportingSSR, setExportingSSR] = useState(false);
  const {
    fileInputRef,
    isDragOver,
    previewOpen,
    previewSheets,
    activePreviewTab,
    setActivePreviewTab,
    setPreviewOpen,
    handleImportJSON,
    downloadExcelTemplate,
    confirmExcelImport,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleExcelFileSelect,
    closePreview,
  } = useExcelImport();

  // Feature flag guard — after all hooks, before JSX
  if (!isEnabled('excelImportExport')) return null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-app-primary flex items-center gap-2">
          <span>📥</span> Import / Export
        </h2>
        <p className="text-sm text-app-secondary mt-1">
          Export media pembelajaran untuk siswa, cetak dokumen admin, atau import data proyek.
        </p>
      </div>

      {/* ── Export HTML Interaktif (Vite SSR) ──────────────────── */}
      <div className="bg-app-surface border border-emerald-800/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-emerald-300 mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined inline" style={ { fontSize: '16px' } }>rocket_launch</span> Ekspor HTML Interaktif
        </h3>
        <p className="text-xs text-app-secondary mb-4">
          Unduh HTML lengkap dengan <strong className="text-emerald-400">navbar + navigasi</strong> (sama persis dengan preview),
          <strong className="text-emerald-400"> game engines</strong> (11+ tipe), <strong className="text-emerald-400">skor tracking</strong>, dan semua komponen interaktif.
          Satu file HTML — siap dibagikan ke siswa.
        </p>
        <button
          onClick={async () => {
            setExportingSSR(true);
            try {
              await exportHTML();
            } finally {
              setExportingSSR(false);
            }
          }}
          disabled={exportingSSR}
          className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-wait text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {exportingSSR ? (
            <>
              <span className="material-symbols-outlined size-4 animate-spin" style={ { fontSize: '16px' } }>progress_activity</span>
              Mengekspor...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined size-4" style={ { fontSize: '16px' } }>download</span>
              Export HTML Interaktif
            </>
          )}
        </button>
        <p className="text-[0.65rem] text-app-muted mt-2">
          <span className="material-symbols-outlined inline" style={ { fontSize: '12px' } }>auto_awesome</span> SSR Export — hasil sama persis dengan preview (React components + Tailwind CSS)
        </p>
      </div>

      {/* ── Admin Print ───────────────────────────────────────── */}
      <div className="bg-app-surface border border-app-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-app-primary mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined inline" style={ { fontSize: '16px' } }>print</span> Cetak Dokumen Admin
        </h3>
        <p className="text-xs text-app-secondary mb-4">
          Buka jendela cetak dengan tabel CP, TP, ATP, dan Alur Pembelajaran untuk dokumentasi guru.
        </p>
        <button
          onClick={cetakDokumenAdmin}
          className="w-full px-4 py-2.5 bg-app-elevated hover:bg-app-elevated text-app-primary font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined inline" style={ { fontSize: '14px' } }>print</span> Cetak Dokumen Admin
        </button>
      </div>

      {/* ── JSON Import / Export ─────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Export JSON */}
        <div className="bg-app-surface border border-app-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-app-primary mb-3">📤 Ekspor JSON</h3>
          <p className="text-xs text-app-secondary mb-4">
            Unduh semua data proyek sebagai file JSON untuk backup atau transfer antar perangkat.
          </p>
          <button
            onClick={exportJSON}
            className="w-full px-4 py-2.5 bg-app-elevated hover:bg-app-elevated text-app-primary font-medium text-sm rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined inline" style={ { fontSize: '14px' } }>assignment</span> Ekspor JSON
          </button>
        </div>

        {/* Import JSON */}
        <div className="bg-app-surface border border-app-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-app-primary mb-3">📥 Import JSON</h3>
          <p className="text-xs text-app-secondary mb-4">
            Upload file JSON yang sebelumnya di-export untuk mengembalikan data proyek.
          </p>
          <label className="block w-full px-4 py-2.5 bg-app-elevated hover:bg-app-elevated text-app-primary font-medium text-sm rounded-lg transition-colors text-center cursor-pointer">
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
      <div className="bg-app-surface border border-app-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined size-4 text-emerald-400" style={ { fontSize: '16px' } }>table</span>
          <h3 className="text-sm font-semibold text-app-primary"><span className="material-symbols-outlined inline" style={ { fontSize: '16px' } }>bar_chart</span> Impor / Ekspor Excel (.xlsx)</h3>
        </div>
        <p className="text-xs text-app-secondary">
          Impor data dari spreadsheet Excel atau unduh template yang sudah diisi dengan data saat ini.
          File .xlsx berisi 6 sheet: META, CP, TP, ATP, ALUR, dan KUIS.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Download Template */}
          <button
            onClick={downloadExcelTemplate}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined size-4" style={ { fontSize: '16px' } }>download</span>
            Unduh Template .xlsx
          </button>

          {/* Upload Excel */}
          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-app-elevated hover:bg-app-elevated text-app-primary font-medium text-sm rounded-lg transition-colors cursor-pointer">
            <span className="material-symbols-outlined size-4" style={ { fontSize: '16px' } }>upload</span>
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
              : 'border-app-border bg-app-elevated/30 hover:border-app-border hover:bg-app-elevated/50'
            }
          `}
        >
          <div className="flex flex-col items-center gap-2">
            {isDragOver ? (
              <>
                <span className="material-symbols-outlined size-8 text-emerald-400" style={ { fontSize: '16px' } }>check_circle</span>
                <p className="text-sm font-medium text-emerald-300">
                  Lepaskan file di sini...
                </p>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined size-8 text-app-muted" style={ { fontSize: '16px' } }>table</span>
                <p className="text-sm text-app-secondary">
                  <span className="font-medium text-app-secondary">Drag & drop</span> file .xlsx ke sini
                </p>
                <p className="text-xs text-app-muted">
                  atau gunakan tombol &quot;Pilih File .xlsx&quot; di atas
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Excel Preview Modal ──────────────────────────────── */}
      <ExcelPreviewDialog
        previewOpen={previewOpen}
        previewSheets={previewSheets}
        activePreviewTab={activePreviewTab}
        setActivePreviewTab={setActivePreviewTab}
        setPreviewOpen={setPreviewOpen}
        onClose={closePreview}
        onConfirm={confirmExcelImport}
      />

      {/* ── Info Section ─────────────────────────────────────── */}
      <div className="bg-app-surface/50 border border-app-border/50 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-app-secondary mb-2 uppercase tracking-wider flex items-center gap-1.5"><span className="material-symbols-outlined inline" style={ { fontSize: '14px' } }>lightbulb</span> Tips</h4>
        <ul className="text-xs text-app-muted space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-app-accent flex-shrink-0 mt-0.5">•</span>
            Gunakan <strong className="text-emerald-300">Export Interaktif (Unified)</strong> untuk hasil terbaik — navigasi pintar, game engines, dan layout canvas dalam satu file.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-app-accent flex-shrink-0 mt-0.5">•</span>
            <strong className="text-app-secondary">Cetak Dokumen Admin</strong> berguna untuk bahan administrasi guru — berisi tabel CP, TP, ATP, dan Alur.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-app-accent flex-shrink-0 mt-0.5">•</span>
            <strong className="text-app-secondary">Ekspor/Impor JSON</strong> untuk backup data proyek atau pindah antar perangkat.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 flex-shrink-0 mt-0.5">•</span>
            <strong className="text-app-secondary">Template Excel</strong> memudahkan mengisi data di spreadsheet lalu import ke editor. Unduh template, isi di Excel/Sheets, lalu unggah kembali.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 flex-shrink-0 mt-0.5">•</span>
            <strong className="text-app-secondary">Import Excel</strong> akan menimpa data META, CP, TP, ATP, ALUR, dan KUIS. Pastikan untuk preview sebelum mengkonfirmasi.
          </li>
        </ul>
      </div>
    </div>
  );
}
