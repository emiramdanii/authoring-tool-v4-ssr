'use client';

// ═══════════════════════════════════════════════════════════════
// RANGKUMAN TAB — Schema-First (Phase 3)
// ═══════════════════════════════════════════════════════════════
// MIGRATION STATUS:
//   READ:  useSchemaRangkuman() ← CanvaStore.pages[].schema.blocks
//   WRITE: applyGuidedSchemaPatch() ← single write path to schema
//   SYNC:  No sync needed — writes go directly to schema
//
// SHAPE BRIDGE:
//   RangkumanBlock.concepts[] → RangkumanData.poin[] (structured → flat)
//   RangkumanBlock.closingStatement → RangkumanData.closingStatement
//
// Sprint 6.3-C: Removed dead writes:
//   - "Pengantar" (intro) — was a no-op (RangkumanBlock has no intro field)
//   - "Tips Belajar" (tips) — was a duplicate write to closingStatement,
//     confusing alongside the dedicated "Penutup" section
// ═══════════════════════════════════════════════════════════════

import { useRef, useCallback } from 'react';
// All icons migrated to Material Symbols Outlined
import { useSchemaRangkuman } from '@/hooks/use-schema-navigator';
import { INPUT_CLS, TEXTAREA_CLS, FieldLabel, MAX_TITLE, MAX_BODY } from './shared';

// ── Rangkuman Tab — Schema-first edit with dynamic poin list ──
export function RangkumanTab() {
  const {
    data: rangkuman,
    locations,
    updateTitle,
    addPoin,
    removePoin,
    updatePoin,
    updateClosingStatement,
  } = useSchemaRangkuman();

  const poinListRef = useRef<HTMLDivElement>(null);

  const handleAddPoin = useCallback(() => {
    addPoin();
    setTimeout(() => {
      const el = poinListRef.current?.lastElementChild;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [addPoin]);

  // No schema blocks → show empty state
  if (locations.length === 0) {
    return (
      <div className="text-center py-10 bg-app-surface border border-dashed border-app-border/40 rounded-xl">
        <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mx-auto mb-3">
          <span className="material-symbols-outlined text-teal-400" style={ { fontSize: '24px' } }>checklist</span>
        </div>
        <p className="text-sm font-medium text-app-primary mb-1">Belum ada blok rangkuman</p>
        <p className="text-xs text-app-muted">Tambahkan halaman rangkuman di Canva untuk mengedit di sini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-app-muted">{rangkuman.poin.length} poin rangkuman</span>
      </div>

      {/* Title */}
      <div className="space-y-3 bg-app-surface border border-app-border rounded-xl p-4">
        <div>
          <FieldLabel>Judul Rangkuman</FieldLabel>
          <input
            className={INPUT_CLS}
            maxLength={MAX_TITLE}
            placeholder="Rangkuman"
            value={rangkuman.title}
            onChange={(e) => updateTitle(e.target.value)}
          />
        </div>
      </div>

      {/* Poin-Poin Kunci — Key Points List */}
      <div className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-teal-400" style={ { fontSize: '16px' } }>checklist</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-app-primary">Poin-Poin Kunci</h4>
            <p className="text-xs text-app-muted">Poin-poin penting dari materi</p>
          </div>
        </div>

        {rangkuman.poin.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-app-border/40 rounded-lg">
            <p className="text-sm text-app-muted mb-3">Belum ada poin rangkuman</p>
            <button
              onClick={handleAddPoin}
              className="px-3 py-1.5 bg-app-accent hover:bg-app-accent/90 text-app-inverse text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>add</span> Tambah Poin
            </button>
          </div>
        ) : (
          <div ref={poinListRef} className="space-y-2">
            {rangkuman.poin.map((poin, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-md bg-teal-500/10 text-teal-400 text-xs font-bold flex items-center justify-center mt-1.5">
                  {i + 1}
                </span>
                <textarea
                  className={TEXTAREA_CLS + ' flex-1'}
                  rows={2}
                  maxLength={MAX_BODY}
                  placeholder={`Poin ${i + 1}...`}
                  value={poin}
                  onChange={(e) => updatePoin(i, e.target.value)}
                />
                <button
                  onClick={() => removePoin(i)}
                  className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-app-muted hover:text-red-400 hover:bg-red-500/10 transition-all mt-1.5"
                >
                  <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Poin button */}
      {rangkuman.poin.length > 0 && (
        <button
          onClick={handleAddPoin}
          className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors inline-flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>add</span> Tambah Poin
        </button>
      )}

      {/* Closing Statement */}
      <div className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-purple-400" style={ { fontSize: '16px' } }>format_quote</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-app-primary">Penutup</h4>
            <p className="text-xs text-app-muted">Pernyataan penutup yang memotivasi (opsional)</p>
          </div>
        </div>
        <textarea
          className={TEXTAREA_CLS}
          rows={2}
          maxLength={MAX_BODY}
          placeholder="Pernyataan penutup untuk memotivasi siswa..."
          value={rangkuman.closingStatement || ''}
          onChange={(e) => updateClosingStatement(e.target.value)}
        />
      </div>
    </div>
  );
}
