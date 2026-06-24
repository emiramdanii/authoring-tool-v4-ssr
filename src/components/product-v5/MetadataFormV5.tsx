'use client';

// ═══════════════════════════════════════════════════════════════
// V5-RELEASE-CANDIDATE-01 — MetadataFormV5
// ═══════════════════════════════════════════════════════════════
// Minimal metadata form for guru. Editable fields:
//   - Judul Media (judulPertemuan)
//   - Mapel
//   - Kelas
//   - Nama Guru (namaGuru → guru in cover badges)
//   - Nama Sekolah (namaSekolah → sekolah in cover badges)
//   - Semester
//   - Tahun Ajaran
//
// Opens as a portal modal from CleanEditorV5 top bar.
// Writes to authoring store via updateMeta().
// Also updates cover block badges in canva store so changes
// propagate to canvas + preview + export immediately.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import type { MetaState } from '@/store/authoring/types';
import { toast } from 'sonner';

export interface MetadataFormV5Props {
  open: boolean;
  onClose: () => void;
}

const FIELD_DEFS: Array<{ key: string; label: string; placeholder: string; type?: 'text' | 'select'; options?: string[] }> = [
  { key: 'judulPertemuan', label: 'Judul Media', placeholder: 'Contoh: Macam-Macam Norma' },
  { key: 'mapel', label: 'Mata Pelajaran', placeholder: 'Contoh: PPKn' },
  { key: 'kelas', label: 'Kelas', placeholder: 'Contoh: 7', type: 'select', options: ['7', '8', '9'] },
  { key: 'namaGuru', label: 'Nama Guru', placeholder: 'Contoh: Budi Santoso, S.Pd.' },
  { key: 'namaSekolah', label: 'Nama Sekolah', placeholder: 'Contoh: SMP Negeri 1 Indonesia' },
  { key: 'semester', label: 'Semester', placeholder: 'Pilih semester', type: 'select', options: ['1 (Ganjil)', '2 (Genap)'] },
  { key: 'tahunAjaran', label: 'Tahun Ajaran', placeholder: 'Contoh: 2024/2025' },
];

export function MetadataFormV5({ open, onClose }: MetadataFormV5Props) {
  const meta = useAuthoringStore((s) => s.meta) as unknown as Record<string, string>;
  const updateMeta = useAuthoringStore((s) => s.updateMeta);
  const pages = useCanvaStore((s) => s.pages);
  const updateSchemaBlock = useCanvaStore((s) => s.updateSchemaBlock);

  const [localMeta, setLocalMeta] = useState<Record<string, string>>({});

  // Sync local state when form opens
  React.useEffect(() => {
    if (open) {
      setLocalMeta({
        judulPertemuan: meta?.judulPertemuan || '',
        mapel: meta?.mapel || '',
        kelas: meta?.kelas || '',
        namaGuru: meta?.namaGuru || '',
        namaSekolah: meta?.namaSekolah || '',
        semester: meta?.semester || '',
        tahunAjaran: meta?.tahunAjaran || '',
      });
    }
  }, [open, meta]);

  const handleChange = useCallback((key: string, value: string) => {
    setLocalMeta((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    // V5-RC-POLISH-01: Write all metadata fields to authoring store.
    for (const field of FIELD_DEFS) {
      const key = field.key as keyof MetaState;
      const value = localMeta[field.key] || '';
      updateMeta(key, value);
    }

    // V5-RC-POLISH-01: Update cover block badges so changes propagate to
    // canvas + preview + export immediately. If the cover doesn't have
    // badges for guru/sekolah/judul, auto-add them (Non-blocker 1 fix).
    const coverPage = pages.find((p) => p.schema?.blocks?.some((b) => b.type === 'cover'));
    if (coverPage) {
      const coverBlock = coverPage.schema?.blocks?.find((b) => b.type === 'cover') as
        | { id?: string; badges?: Array<{ icon?: string; text: string; color: string }> }
        | undefined;
      if (coverBlock?.id) {
        const existingBadges = coverBlock.badges ? [...coverBlock.badges] : [];

        // Helper: find badge by icon or keyword, update text. If not found, add.
        const upsertBadge = (
          icon: string,
          keywords: string[],
          text: string,
          color: string,
        ) => {
          if (!text) return; // Don't add/update if metadata field is empty
          const idx = existingBadges.findIndex(
            (b) => b.icon === icon || keywords.some((kw) => b.text.includes(kw)),
          );
          if (idx >= 0) {
            existingBadges[idx] = { ...existingBadges[idx]!, text, icon };
          } else {
            existingBadges.push({ icon, text, color });
          }
        };

        upsertBadge('👨‍🏫', ['Guru', 'guru'], localMeta.namaGuru || '', 'g');
        upsertBadge('🏫', ['SMP', 'Sekolah', 'sekolah'], localMeta.namaSekolah || '', 'c');
        upsertBadge('📚', ['Modul', 'Bab'], localMeta.judulPertemuan || '', 'y');

        updateSchemaBlock(coverBlock.id, { badges: existingBadges } as never, { source: 'user' });
      }
    }

    toast.success('Metadata tersimpan');
    onClose();
  }, [localMeta, updateMeta, pages, updateSchemaBlock, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-label="Edit metadata media"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600" aria-hidden="true" style={{ fontSize: '20px' }}>edit_note</span>
              Informasi Media
            </h2>
            <button
              onClick={onClose}
              type="button"
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Tutup"
            >
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">Data ini muncul di cover, preview, dan export HTML.</p>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {FIELD_DEFS.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">
                {field.label}
              </label>
              {field.type === 'select' && field.options ? (
                <select
                  value={localMeta[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                >
                  <option value="">— Pilih {field.label} —</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={localMeta[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex gap-2 justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            type="button"
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Simpan
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
