'use client';

import { Upload, Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useExportActions } from './use-export-actions';
import { useExcelImport } from './use-excel-import';
import { ExcelPreviewDialog } from './excel-preview-dialog';

export default function ImportExport() {
  const { exportJSON, exportStudentHtml, cetakDokumenAdmin } = useExportActions();
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

      {/* ── Student Export ────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-1 flex items-center gap-2">
          🎓 Export untuk Siswa
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Download file HTML standalone yang berisi media pembelajaran lengkap (cover, skenario, materi, kuis, hasil).
          Siswa bisa langsung membuka di browser tanpa koneksi internet.
        </p>
        <button
          onClick={exportStudentHtml}
          className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Download className="size-4" />
          Export HTML untuk Siswa
        </button>
        <p className="text-[0.65rem] text-zinc-500 mt-2">
          File .html standalone — tidak perlu server, langsung buka di browser
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
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">💡 Tips</h4>
        <ul className="text-xs text-zinc-500 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 flex-shrink-0 mt-0.5">•</span>
            Gunakan <strong className="text-zinc-300">Export HTML untuk Siswa</strong> setelah semua konten selesai diedit. File akan berisi seluruh media pembelajaran dalam satu file.
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
