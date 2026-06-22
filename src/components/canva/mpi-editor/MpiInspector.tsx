'use client';

// ═══════════════════════════════════════════════════════════════
// MPI INSPECTOR — Right panel contextual editor
// ═══════════════════════════════════════════════════════════════
// EDITOR-RADICAL-RESET-01: Right panel for MPI Studio.
//
// For sprint 1, this is a PLACEHOLDER that shows contextual hints:
//   - If a block is selected → "Edit Isi" (will be wired in sprint 2)
//   - If no block selected → "Pengaturan Halaman" + "Style Media"
//
// Per sprint scope: "Jangan bangun seluruh editor detail dulu."
// The full guided editor integration is deferred to sprint 2.

import React from 'react';
import { useCanvaStore } from '@/store/canva-store';

export function MpiInspector() {
  const selectedBlockId = useCanvaStore((s) => s.selectedBlockId);
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);

  const page = pages[currentPageIndex];

  // Find the selected block (if any)
  const selectedBlock = React.useMemo(() => {
    if (!selectedBlockId || !page?.schema?.blocks) return null;
    return page.schema.blocks.find((b) => b.id === selectedBlockId) || null;
  }, [selectedBlockId, page]);

  // Safe accessor for block fields (blocks are typed as union, but we
  // only need a few common fields for display)
  const blockFields = (selectedBlock as unknown as Record<string, unknown>) || {};

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

      {/* Content — contextual based on selection */}
      <div className="flex-1 p-4">
        {selectedBlock ? (
          // Block selected — show edit placeholder
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>edit</span>
                <span className="text-sm font-medium capitalize">{selectedBlock.type}</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">
                Bagian dipilih. Editor detail akan tersedia di sprint berikutnya.
              </p>
            </div>

            {/* Block info */}
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tipe</label>
                <p className="text-sm text-slate-800 capitalize">{selectedBlock.type}</p>
              </div>
              {blockFields.title != null && (
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Judul</label>
                  <p className="text-sm text-slate-800">{String(blockFields.title)}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">ID</label>
                <p className="text-xs text-slate-400 font-mono break-all">{selectedBlock.id}</p>
              </div>
            </div>

            {/* Hint */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                <span className="font-medium">Tip:</span> Untuk edit lengkap, switch ke Advanced Mode
                (toggle "Mode Guru" di sidebar kiri). Editor detail akan terbuka.
              </p>
            </div>
          </div>
        ) : (
          // No block selected — show page settings placeholder
          <div className="space-y-4">
            <div className="text-center py-6">
              <span className="material-symbols-outlined text-slate-300" aria-hidden="true" style={{ fontSize: '40px' }}>touch_app</span>
              <p className="text-sm text-slate-500 mt-2 font-medium">Pilih bagian di canvas</p>
              <p className="text-xs text-slate-400 mt-1">
                Klik bagian pada halaman untuk mengedit isi.
              </p>
            </div>

            {/* Page info */}
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

            {/* Style section */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Style Media</h3>
              <p className="text-xs text-slate-400">
                Ubah style via tombol "Style" di toolbar atas. Style berlaku untuk semua halaman.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
