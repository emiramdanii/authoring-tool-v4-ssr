'use client';

// ═══════════════════════════════════════════════════════════════
// BATCH-07B — SortItemsFieldEditor
// ═══════════════════════════════════════════════════════════════
// Inline editor for sortir-game block.
//
// Sortir-game schema (from src/core/schema/types/blocks.ts):
//   pool: Array<{ id, text, category }>      ← items to sort
//   kolom: Array<{ id, label, color }>        ← categories (columns)
//
// Editor layout:
//   Section 1: Kategori (kolom) editor
//     - List of kolom with label + color + delete
//     - "Tambah Kategori" button
//   Section 2: Item (pool) editor
//     - List of pool items with text + category dropdown + delete
//     - "Tambah Item" button
//
// All writes go through onChange callback. The value prop is the
// full block (we extract pool + kolom from it) — but we pass back
// a { pool, kolom } object so WorkspaceInspector can patch both
// fields in one updateSchemaBlock call.
// ═══════════════════════════════════════════════════════════════

import React, { useCallback, useMemo } from 'react';

export interface SortirKolom {
  id: string;
  label: string;
  color: string;
}

export interface SortirPoolItem {
  id: string;
  text: string;
  category: string;
}

export interface SortItemsValue {
  pool: SortirPoolItem[];
  kolom: SortirKolom[];
}

export interface SortItemsFieldEditorProps {
  /** Current block value (we extract pool + kolom) */
  value: unknown;
  /** Called with { pool, kolom } on every edit */
  onChange: (value: SortItemsValue) => void;
}

const COLOR_OPTIONS = [
  { value: 'y', label: 'Kuning', className: 'bg-amber-400' },
  { value: 'c', label: 'Cyan', className: 'bg-cyan-400' },
  { value: 'g', label: 'Hijau', className: 'bg-emerald-400' },
  { value: 'p', label: 'Ungu', className: 'bg-purple-400' },
  { value: 'o', label: 'Oranye', className: 'bg-orange-400' },
  { value: 'r', label: 'Merah', className: 'bg-red-400' },
] as const;

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeValue(value: unknown): SortItemsValue {
  const obj = (value ?? {}) as Record<string, unknown>;
  const poolRaw = Array.isArray(obj.pool) ? obj.pool : [];
  const kolomRaw = Array.isArray(obj.kolom) ? obj.kolom : [];

  const pool: SortirPoolItem[] = poolRaw.map((p) => {
    const item = (p ?? {}) as Record<string, unknown>;
    return {
      id: typeof item.id === 'string' && item.id ? item.id : generateId('item'),
      text: typeof item.text === 'string' ? item.text : '',
      category: typeof item.category === 'string' ? item.category : '',
    };
  });

  const kolom: SortirKolom[] = kolomRaw.map((k) => {
    const item = (k ?? {}) as Record<string, unknown>;
    return {
      id: typeof item.id === 'string' && item.id ? item.id : generateId('kolom'),
      label: typeof item.label === 'string' ? item.label : '',
      color: typeof item.color === 'string' ? item.color : 'y',
    };
  });

  return { pool, kolom };
}

export function SortItemsFieldEditor({ value, onChange }: SortItemsFieldEditorProps) {
  const normalized = useMemo(() => normalizeValue(value), [value]);

  // ── Kolom (category) handlers ──────────────────────────────────
  const handleAddKolom = useCallback(() => {
    const newKolom: SortirKolom = {
      id: generateId('kolom'),
      label: '',
      color: 'y',
    };
    onChange({ ...normalized, kolom: [...normalized.kolom, newKolom] });
  }, [normalized, onChange]);

  const handleDeleteKolom = useCallback((id: string) => {
    if (normalized.kolom.length <= 1) return; // Keep at least 1 category
    // Also remove items that reference this category
    const newKolom = normalized.kolom.filter((k) => k.id !== id);
    const newPool = normalized.pool.map((p) =>
      p.category === id ? { ...p, category: '' } : p
    );
    onChange({ kolom: newKolom, pool: newPool });
  }, [normalized, onChange]);

  const handleKolomChange = useCallback((id: string, patch: Partial<SortirKolom>) => {
    const newKolom = normalized.kolom.map((k) =>
      k.id === id ? { ...k, ...patch } : k
    );
    onChange({ ...normalized, kolom: newKolom });
  }, [normalized, onChange]);

  // ── Pool (item) handlers ───────────────────────────────────────
  const handleAddItem = useCallback(() => {
    const newItem: SortirPoolItem = {
      id: generateId('item'),
      text: '',
      category: normalized.kolom[0]?.id ?? '',
    };
    onChange({ ...normalized, pool: [...normalized.pool, newItem] });
  }, [normalized, onChange]);

  const handleDeleteItem = useCallback((id: string) => {
    const newPool = normalized.pool.filter((p) => p.id !== id);
    onChange({ ...normalized, pool: newPool });
  }, [normalized, onChange]);

  const handleItemChange = useCallback((id: string, patch: Partial<SortirPoolItem>) => {
    const newPool = normalized.pool.map((p) =>
      p.id === id ? { ...p, ...patch } : p
    );
    onChange({ ...normalized, pool: newPool });
  }, [normalized, onChange]);

  return (
    <div className="space-y-4" data-testid="sortitems-field-editor">
      {/* ── Section 1: Kategori (kolom) ─────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Kategori ({normalized.kolom.length})
          </h4>
          <button
            type="button"
            onClick={handleAddKolom}
            className="text-xs px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 flex items-center gap-1"
            aria-label="Tambah kategori sortir"
            data-testid="sortitems-add-kolom-btn"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '14px' }}>add</span>
            Kategori
          </button>
        </div>

        <div className="space-y-2">
          {normalized.kolom.map((kolom, idx) => (
            <div
              key={kolom.id}
              className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md"
              data-testid={`sortitems-kolom-card-${idx}`}
            >
              <input
                type="text"
                value={kolom.label}
                onChange={(e) => handleKolomChange(kolom.id, { label: e.target.value })}
                placeholder={`Kategori ${idx + 1}`}
                className="flex-1 px-2 py-1 text-xs text-slate-800 bg-white border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                aria-label={`Label kategori ${idx + 1}`}
                data-testid={`sortitems-kolom-label-${idx}`}
              />
              <select
                value={kolom.color}
                onChange={(e) => handleKolomChange(kolom.id, { color: e.target.value })}
                className="px-1.5 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                aria-label={`Warna kategori ${idx + 1}`}
                data-testid={`sortitems-kolom-color-${idx}`}
              >
                {COLOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleDeleteKolom(kolom.id)}
                disabled={normalized.kolom.length <= 1}
                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500/30"
                aria-label={`Hapus kategori ${idx + 1}`}
                data-testid={`sortitems-kolom-delete-${idx}`}
              >
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '14px' }}>delete</span>
              </button>
            </div>
          ))}
          {normalized.kolom.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">Belum ada kategori. Klik "Kategori" untuk menambah.</p>
          )}
        </div>
      </div>

      {/* ── Section 2: Item (pool) ──────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Item ({normalized.pool.length})
          </h4>
          <button
            type="button"
            onClick={handleAddItem}
            className="text-xs px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 flex items-center gap-1"
            aria-label="Tambah item sortir"
            data-testid="sortitems-add-item-btn"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '14px' }}>add</span>
            Item
          </button>
        </div>

        <div className="space-y-2">
          {normalized.pool.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md"
              data-testid={`sortitems-item-card-${idx}`}
            >
              <input
                type="text"
                value={item.text}
                onChange={(e) => handleItemChange(item.id, { text: e.target.value })}
                placeholder={`Item ${idx + 1}`}
                className="flex-1 px-2 py-1 text-xs text-slate-800 bg-white border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                aria-label={`Teks item ${idx + 1}`}
                data-testid={`sortitems-item-text-${idx}`}
              />
              <select
                value={item.category}
                onChange={(e) => handleItemChange(item.id, { category: e.target.value })}
                className="px-1.5 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500/30 max-w-[100px]"
                aria-label={`Kategori item ${idx + 1}`}
                data-testid={`sortitems-item-category-${idx}`}
              >
                <option value="">— pilih —</option>
                {normalized.kolom.map((k) => (
                  <option key={k.id} value={k.id}>{k.label || k.id}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleDeleteItem(item.id)}
                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
                aria-label={`Hapus item ${idx + 1}`}
                data-testid={`sortitems-item-delete-${idx}`}
              >
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '14px' }}>delete</span>
              </button>
            </div>
          ))}
          {normalized.pool.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">Belum ada item. Klik "Item" untuk menambah.</p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="text-[10px] text-slate-400 text-center" data-testid="sortitems-summary">
        {normalized.kolom.length} kategori · {normalized.pool.length} item
      </div>
    </div>
  );
}
