// @ts-nocheck — BATCH-12: quarantined to src/legacy-disabled/, not type-checked
'use client';

// ═══════════════════════════════════════════════════════════════
// MPI INSPECTOR — Right panel with minimal real editing
// ═══════════════════════════════════════════════════════════════
// PHASE-3B: Replaces NOT_IMPLEMENTED_UI with real minimal editing.
//
// When a block is selected, shows editable fields for the most
// common content fields (title, subtitle, content, icon).
// Uses updateSchemaBlock() — the official schema update route.
//
// When no block is selected, shows page settings + style hint.

import React, { useMemo, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';

// Block types that have editable title field
const HAS_TITLE = new Set(['cover', 'petunjuk', 'tp', 'def-box', 'materi-section', 'tujuan-display', 'motivasi', 'rangkuman', 'diskusi', 'refleksi', 'penutup', 'tabel-accord', 'hero', 'materi-blok', 'nk-card', 'nc-grid']);
const HAS_SUBTITLE = new Set(['cover', 'hero', 'materi-section']);
const HAS_CONTENT = new Set(['def-box', 'materi-blok']);
const HAS_ICON = new Set(['cover', 'hero', 'petunjuk', 'materi-section', 'nk-card']);

export function MpiInspector() {
  const selectedBlockId = useCanvaStore((s) => s.selectedBlockId);
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const updateSchemaBlock = useCanvaStore((s) => s.updateSchemaBlock);

  const page = pages[currentPageIndex];

  const selectedBlock = useMemo(() => {
    if (!selectedBlockId || !page?.schema?.blocks) return null;
    return page.schema.blocks.find((b) => b.id === selectedBlockId) || null;
  }, [selectedBlockId, page]);

  const blockFields = (selectedBlock as unknown as Record<string, unknown>) || {};

  const handleFieldChange = useCallback((field: string, value: string) => {
    if (!selectedBlockId) return;
    updateSchemaBlock(selectedBlockId, { [field]: value } as never, { source: 'user' });
  }, [selectedBlockId, updateSchemaBlock]);

  return (
    <aside
      className="w-80 min-w-80 bg-white border-l border-slate-200 flex flex-col overflow-y-auto"
      aria-label="Panel edit"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 sticky top-0 bg-white z-10">
        <h2 className="text-sm font-semibold text-slate-800">
          {selectedBlock ? 'Edit Isi' : 'Pengaturan Halaman'}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {selectedBlock ? (
          <div className="space-y-4">
            {/* Block type badge */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>edit</span>
                <span className="text-sm font-medium capitalize">{selectedBlock.type}</span>
              </div>
            </div>

            {/* Editable fields — PHASE-3B: real editing via updateSchemaBlock */}
            {HAS_ICON.has(selectedBlock.type) && (
              <FieldInput
                label="Ikon"
                value={String(blockFields.icon ?? '')}
                onChange={(v) => handleFieldChange('icon', v)}
                placeholder="📄"
              />
            )}

            {HAS_TITLE.has(selectedBlock.type) && (
              <FieldInput
                label="Judul"
                value={String(blockFields.title ?? '')}
                onChange={(v) => handleFieldChange('title', v)}
                placeholder="Judul bagian"
              />
            )}

            {HAS_SUBTITLE.has(selectedBlock.type) && (
              <FieldInput
                label="Subjudul"
                value={String(blockFields.subtitle ?? '')}
                onChange={(v) => handleFieldChange('subtitle', v)}
                placeholder="Subjudul"
              />
            )}

            {HAS_CONTENT.has(selectedBlock.type) && (
              <FieldTextarea
                label="Konten"
                value={String(blockFields.content ?? '')}
                onChange={(v) => handleFieldChange('content', v)}
                placeholder="Isi konten"
              />
            )}

            {/* Hint */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-500">
                Perubahan otomatis tersimpan. Untuk edit lengkap (warna, varian, dll),
                klik tombol &quot;Lanjutan&quot; di toolbar atas.
              </p>
            </div>
          </div>
        ) : (
          // No block selected — page settings
          <div className="space-y-4">
            <div className="text-center py-6">
              <span className="material-symbols-outlined text-slate-300" aria-hidden="true" style={{ fontSize: '40px' }}>touch_app</span>
              <p className="text-sm text-slate-500 mt-2 font-medium">Pilih bagian di canvas</p>
              <p className="text-xs text-slate-400 mt-1">
                Klik bagian pada halaman untuk mengedit isi.
              </p>
            </div>

            {page && (
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Halaman Aktif</h3>
                <div>
                  <label className="text-xs text-slate-400">Label</label>
                  <p className="text-sm text-slate-800">{page.label || `Halaman ${currentPageIndex + 1}`}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Tipe</label>
                  <p className="text-sm text-slate-800 capitalize">{page.templateType || 'custom'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Jumlah Bagian</label>
                  <p className="text-sm text-slate-800">{page.schema?.blocks?.length || 0} blok</p>
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Style Media</h3>
              <p className="text-xs text-slate-400">
                Ubah style via tombol &quot;Style&quot; di toolbar atas. Style berlaku untuk semua halaman.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Reusable field components ──────────────────────────────────

function FieldInput({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
      />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full px-3 py-2 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors resize-none"
      />
    </div>
  );
}
