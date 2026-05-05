'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import type { MateriBlok, KuisItem } from '@/store/authoring-store';
import Skenario from './Skenario';
import ModuleEditorModal from './ModuleEditorModal';
import { useDragSort } from '@/hooks/use-drag-sort';
import PresetModuleCard, { type LayoutVariant, LAYOUT_VARIANTS } from '@/components/shared/PresetModuleCard';

// ── Sub-tab type ─────────────────────────────────────────────────
type KontenTab = 'materi' | 'skenario' | 'modules' | 'kuis';

// ── Block type definitions ──────────────────────────────────────
const BLOCK_TYPES = [
  { id: 'teks',      icon: '📝', label: 'Paragraf Teks',    color: '#a1a1aa' },
  { id: 'definisi',  icon: '📌', label: 'Kotak Definisi',   color: '#f9c82e' },
  { id: 'poin',      icon: '•',  label: 'Poin-Poin',        color: '#3ecfcf' },
  { id: 'tabel',     icon: '📊', label: 'Tabel',            color: '#a78bfa' },
  { id: 'kutipan',   icon: '💬', label: 'Kutipan / Quote',  color: '#34d399' },
  { id: 'gambar',    icon: '🖼️', label: 'Gambar dari URL',  color: '#fb923c' },
  { id: 'timeline',  icon: '🔄', label: 'Timeline / Alur',  color: '#3ecfcf' },
  { id: 'highlight', icon: '⚡', label: 'Highlight Card',   color: '#f9c82e' },
  { id: 'compare',   icon: '⚖️', label: 'Perbandingan',     color: '#a78bfa' },
  { id: 'infobox',   icon: '💡', label: 'Info / Tips Box',  color: '#60a5fa' },
  { id: 'checklist', icon: '✅', label: 'Checklist',        color: '#34d399' },
  { id: 'statistik', icon: '📈', label: 'Statistik Angka',  color: '#fb923c' },
  { id: 'studi',     icon: '📖', label: 'Studi Kasus',      color: '#f87171' },
] as const;

const INPUT_CLS =
  'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors';

const TEXTAREA_CLS = INPUT_CLS + ' resize-none';

function blockTypeInfo(tipe: string) {
  return BLOCK_TYPES.find((b) => b.id === tipe) || { id: 'unknown', icon: '📦', label: tipe, color: '#71717a' };
}

// ── Shared small components ────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-zinc-400 mb-1.5">{children}</label>;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ── Block type badge ───────────────────────────────────────────
function TypeBadge({ tipe }: { tipe: string }) {
  const info = blockTypeInfo(tipe);
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border"
      style={{
        backgroundColor: info.color + '18',
        color: info.color,
        borderColor: info.color + '30',
      }}
    >
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </span>
  );
}

// ── Block Editor Forms ─────────────────────────────────────────

/** 1. teks – Paragraph text */
function TeksEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const update = useAuthoringStore((s) => s.updateMateriBlok);
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Judul (opsional)</FieldLabel>
        <input className={INPUT_CLS} placeholder="Judul paragraf…" value={blok.judul || ''} onChange={(e) => update(idx, 'judul', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Isi Paragraf</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={4} placeholder="Tulis isi paragraf di sini…" value={blok.isi || ''} onChange={(e) => update(idx, 'isi', e.target.value)} />
      </div>
    </div>
  );
}

/** 2. definisi – Definition box */
function DefinisiEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const update = useAuthoringStore((s) => s.updateMateriBlok);
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Istilah / Judul</FieldLabel>
        <input className={INPUT_CLS} placeholder="Contoh: Norma…" value={blok.judul || ''} onChange={(e) => update(idx, 'judul', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Definisi</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={3} placeholder="Tulis definisi…" value={blok.isi || ''} onChange={(e) => update(idx, 'isi', e.target.value)} />
      </div>
    </div>
  );
}

/** 3. poin – Bullet points */
function PoinEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const update = useAuthoringStore((s) => s.updateMateriBlok);
  const butir = blok.butir || [''];

  const addButir = useCallback(() => {
    update(idx, 'butir', [...butir, '']);
  }, [idx, butir, update]);

  const removeButir = useCallback(
    (i: number) => {
      if (butir.length <= 1) return;
      update(idx, 'butir', butir.filter((_, j) => j !== i));
    },
    [idx, butir, update],
  );

  const updateButir = useCallback(
    (i: number, val: string) => {
      const next = [...butir];
      next[i] = val;
      update(idx, 'butir', next);
    },
    [idx, butir, update],
  );

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Judul (opsional)</FieldLabel>
        <input className={INPUT_CLS} placeholder="Judul poin-poin…" value={blok.judul || ''} onChange={(e) => update(idx, 'judul', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Daftar Poin</FieldLabel>
        <div className="space-y-2">
          {butir.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-zinc-500 text-sm flex-shrink-0">•</span>
              <input className={INPUT_CLS} placeholder={`Poin ${i + 1}…`} value={b} onChange={(e) => updateButir(i, e.target.value)} />
              <button
                onClick={() => removeButir(i)}
                className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0 text-sm p-1"
                title="Hapus poin"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button onClick={addButir} className="mt-2 text-xs text-amber-500 hover:text-amber-400 transition-colors">
          ＋ Tambah Poin
        </button>
      </div>
    </div>
  );
}

/** 4. tabel – Table */
function TabelEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const update = useAuthoringStore((s) => s.updateMateriBlok);
  const baris = blok.baris || [['', ''], ['', '']];
  const cols = baris[0]?.length || 2;

  const updateCell = useCallback(
    (r: number, c: number, val: string) => {
      const next = baris.map((row) => [...row]);
      next[r][c] = val;
      update(idx, 'baris', next);
    },
    [idx, baris, update],
  );

  const addRow = useCallback(() => {
    const newRow = Array(cols).fill('');
    update(idx, 'baris', [...baris, newRow]);
  }, [idx, baris, cols, update]);

  const addCol = useCallback(() => {
    update(idx, 'baris', baris.map((row) => [...row, '']));
  }, [idx, baris, update]);

  const removeRow = useCallback(
    (r: number) => {
      if (baris.length <= 1) return;
      update(idx, 'baris', baris.filter((_, i) => i !== r));
    },
    [idx, baris, update],
  );

  const removeCol = useCallback(() => {
    if (cols <= 1) return;
    update(idx, 'baris', baris.map((row) => row.slice(0, -1)));
  }, [idx, baris, cols, update]);

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Judul Tabel (opsional)</FieldLabel>
        <input className={INPUT_CLS} placeholder="Judul tabel…" value={blok.judul || ''} onChange={(e) => update(idx, 'judul', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Isi Tabel</FieldLabel>
        <div className="overflow-x-auto rounded-lg border border-zinc-700">
          <table className="w-full text-sm">
            <tbody>
              {baris.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="p-0.5">
                      <input
                        className="w-full bg-zinc-800 border border-zinc-700/50 rounded px-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 min-w-[100px]"
                        placeholder={r === 0 ? `Kolom ${c + 1}` : ''}
                        value={cell}
                        onChange={(e) => updateCell(r, c, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <button onClick={addRow} className="text-xs text-amber-500 hover:text-amber-400 transition-colors">
            ＋ Tambah Baris
          </button>
          <button onClick={addCol} className="text-xs text-amber-500 hover:text-amber-400 transition-colors">
            ＋ Tambah Kolom
          </button>
          <button onClick={() => removeRow(baris.length - 1)} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
            － Hapus Baris
          </button>
          <button onClick={removeCol} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
            － Hapus Kolom
          </button>
        </div>
      </div>
    </div>
  );
}

/** 5. kutipan – Quote */
function KutipanEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const update = useAuthoringStore((s) => s.updateMateriBlok);
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Sumber / Tokoh</FieldLabel>
        <input className={INPUT_CLS} placeholder="Contoh: Aristoteles…" value={blok.judul || ''} onChange={(e) => update(idx, 'judul', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Kutipan</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={3} placeholder="Tulis kutipan di sini…" value={blok.isi || ''} onChange={(e) => update(idx, 'isi', e.target.value)} />
      </div>
    </div>
  );
}

/** 6. gambar – Image URL */
function GambarEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const update = useAuthoringStore((s) => s.updateMateriBlok);
  const url = blok.isi || '';
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Judul Gambar (opsional)</FieldLabel>
        <input className={INPUT_CLS} placeholder="Judul gambar…" value={blok.judul || ''} onChange={(e) => update(idx, 'judul', e.target.value)} />
      </div>
      <div>
        <FieldLabel>URL Gambar</FieldLabel>
        <input className={INPUT_CLS} placeholder="https://contoh.com/gambar.png" value={url} onChange={(e) => update(idx, 'isi', e.target.value)} />
      </div>
      {url && (
        <div className="rounded-lg border border-zinc-700 overflow-hidden bg-zinc-800/50">
          <img
            src={url}
            alt={blok.judul || 'Pratinjau gambar'}
            className="w-full max-h-64 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
            onLoad={(e) => {
              (e.target as HTMLImageElement).style.display = 'block';
            }}
          />
        </div>
      )}
    </div>
  );
}

/** 7. timeline – Timeline */
function TimelineEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const update = useAuthoringStore((s) => s.updateMateriBlok);
  const langkah = blok.langkah || [{ icon: '📌', judul: '', isi: '' }];

  const addLangkah = useCallback(() => {
    update(idx, 'langkah', [...langkah, { icon: '📌', judul: '', isi: '' }]);
  }, [idx, langkah, update]);

  const removeLangkah = useCallback(
    (i: number) => {
      if (langkah.length <= 1) return;
      update(idx, 'langkah', langkah.filter((_, j) => j !== i));
    },
    [idx, langkah, update],
  );

  const updateLangkah = useCallback(
    (i: number, key: 'icon' | 'judul' | 'isi', val: string) => {
      const next = langkah.map((l, j) => (j === i ? { ...l, [key]: val } : l));
      update(idx, 'langkah', next);
    },
    [idx, langkah, update],
  );

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Judul Timeline (opsional)</FieldLabel>
        <input className={INPUT_CLS} placeholder="Judul timeline…" value={blok.judul || ''} onChange={(e) => update(idx, 'judul', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Langkah-langkah</FieldLabel>
        <div className="space-y-3">
          {langkah.map((l, i) => (
            <div key={i} className="relative pl-6 border-l-2 border-zinc-700 ml-2 pb-1">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-zinc-700 border-2 border-zinc-600" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-12 flex-shrink-0">Ikon</span>
                  <input
                    className={`${INPUT_CLS} w-24`}
                    value={l.icon}
                    onChange={(e) => updateLangkah(i, 'icon', e.target.value)}
                    placeholder="📌"
                  />
                </div>
                <input
                  className={INPUT_CLS}
                  placeholder={`Langkah ${i + 1}…`}
                  value={l.judul}
                  onChange={(e) => updateLangkah(i, 'judul', e.target.value)}
                />
                <textarea
                  className={TEXTAREA_CLS}
                  rows={2}
                  placeholder="Deskripsi langkah…"
                  value={l.isi}
                  onChange={(e) => updateLangkah(i, 'isi', e.target.value)}
                />
                {langkah.length > 1 && (
                  <button onClick={() => removeLangkah(i)} className="text-xs text-zinc-600 hover:text-red-400 transition-colors">
                    Hapus langkah
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={addLangkah} className="mt-3 text-xs text-amber-500 hover:text-amber-400 transition-colors">
          ＋ Tambah Langkah
        </button>
      </div>
    </div>
  );
}

/** 8. highlight – Highlight card */
function HighlightEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const update = useAuthoringStore((s) => s.updateMateriBlok);
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Judul</FieldLabel>
        <input className={INPUT_CLS} placeholder="Judul highlight…" value={blok.judul || ''} onChange={(e) => update(idx, 'judul', e.target.value)} />
      </div>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <FieldLabel>Ikon</FieldLabel>
          <input className={INPUT_CLS} placeholder="⚡" value={blok.icon || ''} onChange={(e) => update(idx, 'icon', e.target.value)} />
        </div>
        <div className="w-32">
          <FieldLabel>Warna</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="w-8 h-8 rounded cursor-pointer border border-zinc-700 bg-transparent"
              value={blok.warna || '#f9c82e'}
              onChange={(e) => update(idx, 'warna', e.target.value)}
            />
            <span className="text-xs text-zinc-500 font-mono">{blok.warna || '#f9c82e'}</span>
          </div>
        </div>
      </div>
      <div>
        <FieldLabel>Isi Highlight</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={3} placeholder="Teks highlight…" value={blok.isi || ''} onChange={(e) => update(idx, 'isi', e.target.value)} />
      </div>
    </div>
  );
}

/** Shared side form for compare editor */
function CompareSideForm({
  side, label, data, onUpdate,
}: {
  side: 'kiri' | 'kanan';
  label: string;
  data: { icon?: string; judul?: string; isi?: string };
  onUpdate: (side: 'kiri' | 'kanan', key: string, val: string) => void;
}) {
  return (
    <div className="space-y-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
      <div className="text-xs font-semibold text-zinc-300 mb-1">{label}</div>
      <div>
        <FieldLabel>Ikon</FieldLabel>
        <input className={INPUT_CLS} placeholder="🎯" value={data.icon || ''} onChange={(e) => onUpdate(side, 'icon', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Judul</FieldLabel>
        <input className={INPUT_CLS} placeholder={`Judul ${label.toLowerCase()}…`} value={data.judul || ''} onChange={(e) => onUpdate(side, 'judul', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Isi</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={3} placeholder={`Isi ${label.toLowerCase()}…`} value={data.isi || ''} onChange={(e) => onUpdate(side, 'isi', e.target.value)} />
      </div>
    </div>
  );
}

/** 9. compare – Comparison */
function CompareEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const update = useAuthoringStore((s) => s.updateMateriBlok);
  const kiri = blok.kiri || { icon: '', judul: '', isi: '' };
  const kanan = blok.kanan || { icon: '', judul: '', isi: '' };

  const updateSide = useCallback(
    (side: 'kiri' | 'kanan', key: string, val: string) => {
      const current = side === 'kiri' ? { ...kiri } : { ...kanan };
      (current as Record<string, unknown>)[key] = val;
      update(idx, side, current);
    },
    [idx, kiri, kanan, update],
  );

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Judul Perbandingan (opsional)</FieldLabel>
        <input className={INPUT_CLS} placeholder="Judul perbandingan…" value={blok.judul || ''} onChange={(e) => update(idx, 'judul', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CompareSideForm side="kiri" label="Kiri" data={kiri} onUpdate={updateSide} />
        <CompareSideForm side="kanan" label="Kanan" data={kanan} onUpdate={updateSide} />
      </div>
    </div>
  );
}

/** 10. infobox – Info / Tips Box */
function InfoboxEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const update = useAuthoringStore((s) => s.updateMateriBlok);
  const styles = [
    { id: 'info', label: 'ℹ️ Info', color: '#60a5fa' },
    { id: 'tips', label: '💡 Tips', color: '#f9c82e' },
    { id: 'warning', label: '⚠️ Warning', color: '#fb923c' },
    { id: 'success', label: '✅ Success', color: '#34d399' },
  ];

  const currentStyle = blok.style || 'info';
  const currentStyleInfo = styles.find((s) => s.id === currentStyle) || styles[0];

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Judul (opsional)</FieldLabel>
        <input className={INPUT_CLS} placeholder="Judul info box…" value={blok.judul || ''} onChange={(e) => update(idx, 'judul', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Gaya Box</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {styles.map((s) => (
            <button
              key={s.id}
              onClick={() => update(idx, 'style', s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                currentStyle === s.id
                  ? 'border-current'
                  : 'border-zinc-700/50 opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: s.color + (currentStyle === s.id ? '25' : '10'),
                color: s.color,
                borderColor: currentStyle === s.id ? s.color + '60' : undefined,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        {/* Preview swatch */}
        <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: currentStyleInfo.color }} />
      </div>
      <div>
        <FieldLabel>Isi Pesan</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={3} placeholder="Tulis isi pesan…" value={blok.isi || ''} onChange={(e) => update(idx, 'isi', e.target.value)} />
      </div>
    </div>
  );
}

/** 11. checklist – Checklist */
function ChecklistEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const update = useAuthoringStore((s) => s.updateMateriBlok);
  const butir = blok.butir || [''];

  const addButir = useCallback(() => {
    update(idx, 'butir', [...butir, '']);
  }, [idx, butir, update]);

  const removeButir = useCallback(
    (i: number) => {
      if (butir.length <= 1) return;
      update(idx, 'butir', butir.filter((_, j) => j !== i));
    },
    [idx, butir, update],
  );

  const updateButir = useCallback(
    (i: number, val: string) => {
      const next = [...butir];
      next[i] = val;
      update(idx, 'butir', next);
    },
    [idx, butir, update],
  );

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Judul (opsional)</FieldLabel>
        <input className={INPUT_CLS} placeholder="Judul checklist…" value={blok.judul || ''} onChange={(e) => update(idx, 'judul', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Item Checklist</FieldLabel>
        <div className="space-y-2">
          {butir.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-4 h-4 flex-shrink-0 rounded border border-zinc-600 flex items-center justify-center text-[10px] text-zinc-500">
                {i + 1}
              </span>
              <input className={INPUT_CLS} placeholder={`Item ${i + 1}…`} value={b} onChange={(e) => updateButir(i, e.target.value)} />
              <button
                onClick={() => removeButir(i)}
                className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0 text-sm p-1"
                title="Hapus item"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button onClick={addButir} className="mt-2 text-xs text-amber-500 hover:text-amber-400 transition-colors">
          ＋ Tambah Item
        </button>
      </div>
    </div>
  );
}

/** 12. statistik – Statistics */
function StatistikEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const update = useAuthoringStore((s) => s.updateMateriBlok);
  const items = blok.items || [{ icon: '📊', angka: '', label: '', warna: '#3ecfcf' }];

  const addItem = useCallback(() => {
    update(idx, 'items', [...items, { icon: '📊', angka: '', label: '', warna: '#3ecfcf' }]);
  }, [idx, items, update]);

  const removeItem = useCallback(
    (i: number) => {
      if (items.length <= 1) return;
      update(idx, 'items', items.filter((_, j) => j !== i));
    },
    [idx, items, update],
  );

  const updateItem = useCallback(
    (i: number, key: string, val: string) => {
      const next = items.map((item, j) => (j === i ? { ...item, [key]: val } : item));
      update(idx, 'items', next);
    },
    [idx, items, update],
  );

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Judul (opsional)</FieldLabel>
        <input className={INPUT_CLS} placeholder="Judul statistik…" value={blok.judul || ''} onChange={(e) => update(idx, 'judul', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Item Statistik</FieldLabel>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 space-y-2">
              <div className="flex items-center gap-2">
                <input className={`${INPUT_CLS} w-16`} placeholder="📊" value={item.icon || ''} onChange={(e) => updateItem(i, 'icon', e.target.value)} />
                <input className={INPUT_CLS} placeholder="Angka (contoh: 85%)" value={item.angka || ''} onChange={(e) => updateItem(i, 'angka', e.target.value)} />
                <input className={INPUT_CLS} placeholder="Satuan (opsional)" value={item.satuan || ''} onChange={(e) => updateItem(i, 'satuan', e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input className={`${INPUT_CLS} flex-1`} placeholder="Label statistik…" value={item.label || ''} onChange={(e) => updateItem(i, 'label', e.target.value)} />
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    type="color"
                    className="w-7 h-7 rounded cursor-pointer border border-zinc-700 bg-transparent"
                    value={item.warna || '#3ecfcf'}
                    onChange={(e) => updateItem(i, 'warna', e.target.value)}
                  />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-zinc-600 hover:text-red-400 transition-colors text-sm p-1">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="mt-2 text-xs text-amber-500 hover:text-amber-400 transition-colors">
          ＋ Tambah Item
        </button>
      </div>
    </div>
  );
}

/** 13. studi – Case study */
function StudiEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const update = useAuthoringStore((s) => s.updateMateriBlok);
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Judul Studi Kasus</FieldLabel>
        <input className={INPUT_CLS} placeholder="Judul studi kasus…" value={blok.judul || ''} onChange={(e) => update(idx, 'judul', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Karakter (Emoji)</FieldLabel>
        <input className={INPUT_CLS} placeholder="🧑" value={blok.karakter || ''} onChange={(e) => update(idx, 'karakter', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Situasi</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={3} placeholder="Jelaskan situasi kasus…" value={blok.situasi || ''} onChange={(e) => update(idx, 'situasi', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Pertanyaan untuk Siswa</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pertanyaan diskusi…" value={blok.pertanyaan || ''} onChange={(e) => update(idx, 'pertanyaan', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Pesan / Pesan Moral</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pesan moral dari kasus ini…" value={blok.pesan || ''} onChange={(e) => update(idx, 'pesan', e.target.value)} />
      </div>
    </div>
  );
}

// ── Block Editor Router ────────────────────────────────────────
function BlockEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  switch (blok.tipe) {
    case 'teks':      return <TeksEditor blok={blok} idx={idx} />;
    case 'definisi':  return <DefinisiEditor blok={blok} idx={idx} />;
    case 'poin':      return <PoinEditor blok={blok} idx={idx} />;
    case 'tabel':     return <TabelEditor blok={blok} idx={idx} />;
    case 'kutipan':   return <KutipanEditor blok={blok} idx={idx} />;
    case 'gambar':    return <GambarEditor blok={blok} idx={idx} />;
    case 'timeline':  return <TimelineEditor blok={blok} idx={idx} />;
    case 'highlight': return <HighlightEditor blok={blok} idx={idx} />;
    case 'compare':   return <CompareEditor blok={blok} idx={idx} />;
    case 'infobox':   return <InfoboxEditor blok={blok} idx={idx} />;
    case 'checklist': return <ChecklistEditor blok={blok} idx={idx} />;
    case 'statistik': return <StatistikEditor blok={blok} idx={idx} />;
    case 'studi':     return <StudiEditor blok={blok} idx={idx} />;
    default:          return <div className="text-sm text-zinc-500">Tipe blok tidak dikenali: {blok.tipe}</div>;
  }
}

// ── Blok Card ──────────────────────────────────────────────────
function BlokCard({
  blok,
  idx,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  blok: MateriBlok;
  idx: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);
  const info = blockTypeInfo(blok.tipe);
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all"
      style={{ borderLeftWidth: '3px', borderLeftColor: info.color }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <TypeBadge tipe={blok.tipe} />
        <span className="flex-1 text-sm text-zinc-300 truncate">
          {blok.judul || info.label}
        </span>
        <span className="text-xs text-zinc-600">#{idx + 1}</span>
        <ChevronIcon open={open} />
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-zinc-800">
          {/* Action buttons */}
          <div className="flex items-center gap-1 mb-3 pt-2">
            <button
              onClick={onMoveUp}
              disabled={idx === 0}
              className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-zinc-800 transition-colors"
              title="Pindah ke atas"
            >
              ↑ Naik
            </button>
            <button
              onClick={onMoveDown}
              disabled={idx === total - 1}
              className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-zinc-800 transition-colors"
              title="Pindah ke bawah"
            >
              ↓ Turun
            </button>
            <div className="flex-1" />
            <button
              onClick={onRemove}
              className="px-2 py-1 text-xs text-zinc-500 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
              title="Hapus blok"
            >
              🗑️ Hapus
            </button>
          </div>

          {/* Editor form */}
          <BlockEditor blok={blok} idx={idx} />
        </div>
      )}
    </div>
  );
}

// ── Materi Tab ─────────────────────────────────────────────────
function MateriTab() {
  const materi = useAuthoringStore((s) => s.materi);
  const addMateriBlok = useAuthoringStore((s) => s.addMateriBlok);
  const removeMateriBlok = useAuthoringStore((s) => s.removeMateriBlok);
  const moveMateriBlok = useAuthoringStore((s) => s.moveMateriBlok);
  const listRef = useRef<HTMLDivElement>(null);

  const handleAdd = useCallback(
    (tipe: string) => {
      addMateriBlok(tipe);
      setTimeout(() => {
        const el = listRef.current?.lastElementChild;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    },
    [addMateriBlok],
  );

  return (
    <div className="space-y-4">
      {/* Block count */}
      <div className="text-xs text-zinc-500">
        {materi.blok.length} blok materi
      </div>

      {/* Empty state */}
      {materi.blok.length === 0 ? (
        <div className="text-center py-8 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="text-3xl mb-2">📝</div>
          <p className="text-sm text-zinc-500">Belum ada blok materi. Tambahkan blok di bawah.</p>
        </div>
      ) : (
        /* Block list */
        <div ref={listRef} className="space-y-3">
          {materi.blok.map((blok, i) => (
            <BlokCard
              key={i}
              blok={blok}
              idx={i}
              total={materi.blok.length}
              onMoveUp={() => moveMateriBlok(i, i - 1)}
              onMoveDown={() => moveMateriBlok(i, i + 1)}
              onRemove={() => removeMateriBlok(i)}
            />
          ))}
        </div>
      )}

      {/* Add Block Grid */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-zinc-200 mb-3">➕ Tambah Blok</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
          {BLOCK_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleAdd(t.id)}
              className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2.5 text-center hover:border-zinc-600 transition-colors cursor-pointer"
              title={`Tambah blok ${t.label}`}
            >
              <div className="text-lg mb-0.5">{t.icon}</div>
              <div className="text-[0.65rem] text-zinc-400">{t.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Module Type Definitions ───────────────────────────────────
const MODULE_TYPES = [
  { id: 'skenario', icon: '🎭', label: 'Skenario Interaktif', desc: 'Pilihan bercabang dengan dialog dan konsekuensi', color: '#f9c82e' },
  { id: 'video', icon: '🎥', label: 'Video Embed', desc: 'Video dari YouTube, Drive, atau URL lain', color: '#ff6b6b' },
  { id: 'flashcard', icon: '🃏', label: 'Flashcard', desc: 'Kartu bolak-balik untuk belajar istilah', color: '#3ecfcf' },
  { id: 'infografis', icon: '📊', label: 'Infografis / Kartu Konsep', desc: 'Kartu informasi visual', color: '#a78bfa' },
  { id: 'studi-kasus', icon: '📰', label: 'Studi Kasus', desc: 'Analisis kasus dengan pertanyaan', color: '#fb923c' },
  { id: 'debat', icon: '🗣️', label: 'Debat & Polling', desc: 'Mosiperta debat pro dan kontra', color: '#f87171' },
  { id: 'timeline', icon: '📅', label: 'Timeline', desc: 'Urutan peristiwa berdasarkan waktu', color: '#34d399' },
  { id: 'matching', icon: '🔀', label: 'Game Pasangkan', desc: 'Cocokkan istilah dengan definisi', color: '#60a5fa' },
  { id: 'materi', icon: '📖', label: 'Materi Teks', desc: 'Blok konten teks untuk siswa baca', color: '#a1a1aa' },
  { id: 'hero', icon: '🖼️', label: 'Hero Banner', desc: 'Banner utama dengan gradient', color: '#ff6b6b' },
  { id: 'kutipan', icon: '💬', label: 'Kutipan Inspiratif', desc: 'Kutipan dengan gaya visual', color: '#34d399' },
  { id: 'langkah', icon: '👣', label: 'Langkah-Langkah', desc: 'Tutorial langkah demi langkah', color: '#3ecfcf' },
  { id: 'accordion', icon: '🗂️', label: 'Accordion / FAQ', desc: 'Panel yang bisa dibuka/tutup', color: '#a78bfa' },
  { id: 'statistik', icon: '📊', label: 'Statistik & Angka', desc: 'Angka kunci dengan visual', color: '#fb923c' },
  { id: 'polling', icon: '🗳️', label: 'Polling / Voting', desc: 'Voting dan polling interaktif', color: '#60a5fa' },
  { id: 'embed', icon: '🔗', label: 'Embed / iFrame', desc: 'Sematkan konten eksternal', color: '#a1a1aa' },
  { id: 'tab-icons', icon: '📑', label: 'Tab Interaktif', desc: 'Konten dalam tab bergambar', color: '#f9c82e' },
  { id: 'icon-explore', icon: '🔍', label: 'Eksplorasi Ikon', desc: 'Jelajahi konten lewat ikon', color: '#34d399' },
  { id: 'comparison', icon: '⚖️', label: 'Perbandingan', desc: 'Bandingkan beberapa kolom', color: '#a78bfa' },
  { id: 'card-showcase', icon: '🃏', label: 'Card Showcase', desc: 'Tampilkan kartu visual', color: '#fb923c' },
  { id: 'hotspot-image', icon: '🗺️', label: 'Hotspot Image', desc: 'Gambar dengan titik interaktif', color: '#ff6b6b' },
] as const;

const GAME_TYPES = [
  { id: 'truefalse', icon: '✅', label: 'Benar / Salah', desc: 'Pernyataan benar atau salah', color: '#34d399' },
  { id: 'memory', icon: '🧠', label: 'Memory Match', desc: 'Cocokkan kartu berpasangan', color: '#a78bfa' },
  { id: 'roda', icon: '🎡', label: 'Roda Putar', desc: 'Putar roda untuk pilihan acak', color: '#fb923c' },
  { id: 'sorting', icon: '🔢', label: 'Urutkan / Klasifikasi', desc: 'Kelompokkan item ke kategori', color: '#3ecfcf' },
  { id: 'spinwheel', icon: '🎡', label: 'Roda Pertanyaan', desc: 'Roda putar dengan soal acak', color: '#ff6b6b' },
  { id: 'teambuzzer', icon: '🏆', label: 'Kuis Tim / Buzzer', desc: 'Kuis kompetisi antar tim', color: '#f9c82e' },
  { id: 'wordsearch', icon: '🔍', label: 'Teka-Teki Kata', desc: 'Cari kata tersembunyi', color: '#60a5fa' },
] as const;

const ALL_MODULE_TYPES = [...MODULE_TYPES, ...GAME_TYPES];

function moduleTypeInfo(typeId: string) {
  return ALL_MODULE_TYPES.find((t) => t.id === typeId) || { id: 'unknown', icon: '📦', label: typeId, desc: '', color: '#71717a' };
}

// ── Module Mini Preview ───────────────────────────────────────
function modulePreview(mod: Record<string, unknown>): string {
  const t = mod.type as string;
  switch (t) {
    case 'skenario': {
      const ch = (mod.chapters as unknown[]) || [];
      let pilihan = 0;
      (ch as Record<string, unknown>[]).forEach((c) => { pilihan += ((c.choices as unknown[]) || []).length; });
      return ch.length ? `${ch.length} bab · ${pilihan} pilihan` : 'Belum ada bab';
    }
    case 'video': return mod.url ? `URL tersimpan` : 'Belum ada URL';
    case 'flashcard': {
      const k = (mod.kartu as unknown[]) || [];
      return k.length ? `${k.length} kartu` : 'Belum ada kartu';
    }
    case 'infografis': {
      const k = (mod.kartu as unknown[]) || [];
      return k.length ? `${k.length} kartu · ${(mod.layout as string) || 'grid'}` : 'Belum ada kartu';
    }
    case 'studi-kasus': {
      const p = (mod.pertanyaan as unknown[]) || [];
      return p.length ? `${p.length} pertanyaan` : 'Belum ada pertanyaan';
    }
    case 'debat': return (mod.pertanyaan as string) ? 'Mosiperta tersimpan' : 'Belum ada mosiperta';
    case 'timeline': {
      const e = (mod.events as unknown[]) || [];
      return e.length ? `${e.length} peristiwa` : 'Belum ada peristiwa';
    }
    case 'matching': {
      const p = (mod.pasangan as unknown[]) || [];
      return p.length ? `${p.length} pasangan` : 'Belum ada pasangan';
    }
    case 'materi': {
      const b = (mod.blok as unknown[]) || [];
      return b.length ? `${b.length} blok` : 'Belum ada blok';
    }
    case 'truefalse': {
      const s = (mod.soal as unknown[]) || [];
      return s.length ? `${s.length} pernyataan` : 'Belum ada pernyataan';
    }
    case 'memory': {
      const p = (mod.pasangan as unknown[]) || [];
      return p.length ? `${p.length} pasangan` : 'Belum ada pasangan';
    }
    case 'roda': {
      const o = (mod.opsi as unknown[]) || [];
      return o.length ? `${o.length} opsi` : 'Belum ada opsi';
    }
    case 'hero': return (mod.gradient as string) ? `Gradient: ${(mod.gradient as string)}` : '';
    case 'kutipan': return (mod.quote as string) ? 'Kutipan tersimpan' : 'Belum ada kutipan';
    case 'langkah': { const s = (mod.steps as unknown[]) || []; return s.length ? `${s.length} langkah` : 'Belum ada langkah'; }
    case 'accordion': { const it = (mod.items as unknown[]) || []; return it.length ? `${it.length} item` : 'Belum ada item'; }
    case 'statistik': { const it = (mod.items as unknown[]) || []; return it.length ? `${it.length} item` : 'Belum ada item'; }
    case 'polling': { const op = (mod.opsi as unknown[]) || []; return op.length ? `${op.length} opsi · ${(mod.tipe as string) || 'single'}` : 'Belum ada opsi'; }
    case 'embed': return (mod.url as string) ? 'URL tersimpan' : 'Belum ada URL';
    case 'tab-icons': { const tb = (mod.tabs as unknown[]) || []; return tb.length ? `${tb.length} tab` : 'Belum ada tab'; }
    case 'icon-explore': { const it = (mod.items as unknown[]) || []; return it.length ? `${it.length} item` : 'Belum ada item'; }
    case 'comparison': { const b = (mod.baris as unknown[]) || []; return b.length ? `${b.length} baris` : 'Belum ada baris'; }
    case 'card-showcase': { const c = (mod.cards as unknown[]) || []; return c.length ? `${c.length} kartu` : 'Belum ada kartu'; }
    case 'hotspot-image': { const h = (mod.hotspots as unknown[]) || []; return h.length ? `${h.length} hotspot` : 'Belum ada hotspot'; }
    case 'sorting': { const it = (mod.items as unknown[]) || []; return it.length ? `${it.length} item` : 'Belum ada item'; }
    case 'spinwheel': { const s = (mod.soal as unknown[]) || []; return s.length ? `${s.length} soal` : 'Belum ada soal'; }
    case 'teambuzzer': { const s = (mod.soal as unknown[]) || []; return s.length ? `${s.length} soal` : 'Belum ada soal'; }
    case 'wordsearch': { const k = (mod.kata as unknown[]) || []; return k.length ? `${k.length} kata` : 'Belum ada kata'; }
    default: return '';
  }
}

// ── Module Picker Modal ───────────────────────────────────────
function ModulePickerModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (typeId: string) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">Pilih Tipe Modul / Game</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Pilih modul pembelajaran atau game yang ingin ditambahkan</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors text-xl leading-none p-1">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Learning Modules */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Modul Pembelajaran
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MODULE_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onPick(t.id)}
                  className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-4 text-left hover:border-zinc-500 hover:bg-zinc-800 transition-all group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{t.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-zinc-200 group-hover:text-zinc-100">{t.label}</div>
                      <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{t.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Games */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Game Interaktif
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {GAME_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onPick(t.id)}
                  className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-4 text-left hover:border-zinc-500 hover:bg-zinc-800 transition-all group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{t.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-zinc-200 group-hover:text-zinc-100">{t.label}</div>
                      <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{t.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Layout Variant Picker ─────────────────────────────────────
function LayoutVariantPicker({ value, onChange }: { value: LayoutVariant; onChange: (v: LayoutVariant) => void }) {
  return (
    <div className="flex gap-1">
      {LAYOUT_VARIANTS.map(v => (
        <button
          key={v.id}
          onClick={() => onChange(v.id as LayoutVariant)}
          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
            value === v.id ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
          title={v.desc}
        >
          {v.icon} {v.label}
        </button>
      ))}
    </div>
  );
}

// ── Module List Card (using PresetModuleCard) ────────────────
function ModuleCard({
  mod,
  idx,
  total,
  onEdit,
  onMoveUp,
  onMoveDown,
  onRemove,
  onVariantChange,
}: {
  mod: Record<string, unknown>;
  idx: number;
  total: number;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onVariantChange: (variant: LayoutVariant) => void;
}) {
  const variant = (mod.layoutVariant as LayoutVariant) || 'A';

  return (
    <div className="space-y-1.5">
      {/* Beautiful preset card */}
      <PresetModuleCard
        mode="edit"
        module={mod}
        layoutVariant={variant}
        onEdit={onEdit}
      />

      {/* Controls row: variant picker + action buttons */}
      <div className="flex items-center gap-2 px-1">
        <LayoutVariantPicker value={variant} onChange={onVariantChange} />
        <div className="flex-1" />
        <button
          onClick={onMoveUp}
          disabled={idx === 0}
          className="p-1 text-zinc-600 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-zinc-800 transition-colors text-xs"
          title="Pindah ke atas"
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={idx === total - 1}
          className="p-1 text-zinc-600 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-zinc-800 transition-colors text-xs"
          title="Pindah ke bawah"
        >
          ↓
        </button>
        <button
          onClick={onEdit}
          className="p-1 text-zinc-600 hover:text-amber-400 rounded-md hover:bg-zinc-800 transition-colors text-sm"
          title="Edit modul"
        >
          ✏️
        </button>
        <button
          onClick={onRemove}
          className="p-1 text-zinc-600 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors text-sm"
          title="Hapus modul"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// ── Modules Tab ────────────────────────────────────────────────
function ModulesTab() {
  const modules = useAuthoringStore((s) => s.modules);
  const addModule = useAuthoringStore((s) => s.addModule);
  const removeModule = useAuthoringStore((s) => s.removeModule);
  const moveModule = useAuthoringStore((s) => s.moveModule);
  const updateModuleField = useAuthoringStore((s) => s.updateModuleField);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [editorIndex, setEditorIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handlePick = useCallback((typeId: string) => {
    addModule(typeId);
    setPickerOpen(false);
    setTimeout(() => {
      const el = listRef.current?.lastElementChild;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }, [addModule]);

  const handleRemove = useCallback((i: number) => {
    if (confirm(`Hapus modul "${(modules[i].title as string) || moduleTypeInfo(modules[i].type as string).label}"?`)) {
      removeModule(i);
      if (editorIndex === i) setEditorIndex(null);
    }
  }, [modules, removeModule, editorIndex]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{modules.length} modul & game</span>
        <button
          onClick={() => setPickerOpen(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors"
        >
          ＋ Tambah Modul / Game
        </button>
      </div>

      {/* Empty state */}
      {modules.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="text-4xl mb-3">🧩</div>
          <p className="text-sm text-zinc-400 font-medium">Belum ada modul atau game</p>
          <p className="text-xs text-zinc-500 mt-1">Klik tombol di atas untuk menambahkan modul pembelajaran atau game interaktif.</p>
        </div>
      ) : (
        /* Module list */
        <div ref={listRef} className="space-y-2">
          {modules.map((mod, i) => (
            <ModuleCard
              key={i}
              mod={mod}
              idx={i}
              total={modules.length}
              onEdit={() => setEditorIndex(i)}
              onMoveUp={() => moveModule(i, i - 1)}
              onMoveDown={() => moveModule(i, i + 1)}
              onRemove={() => handleRemove(i)}
              onVariantChange={(v) => updateModuleField(i, 'layoutVariant', v)}
            />
          ))}
        </div>
      )}

      {/* Quick Add Grid */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-zinc-200 mb-3">⚡ Tambah Cepat</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {ALL_MODULE_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => handlePick(t.id)}
              className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2.5 text-center hover:border-zinc-500 transition-colors cursor-pointer"
              title={`Tambah ${t.label}`}
            >
              <div className="text-lg mb-0.5">{t.icon}</div>
              <div className="text-[0.6rem] text-zinc-400 leading-tight">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      <ModulePickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={handlePick} />
      <ModuleEditorModal open={editorIndex !== null} moduleIndex={editorIndex ?? 0} onClose={() => setEditorIndex(null)} />
    </div>
  );
}

// ── Kuis Tab (Fully Functional) ────────────────────────────────
function KuisTab() {
  const kuis = useAuthoringStore((s) => s.kuis);
  const addKuis = useAuthoringStore((s) => s.addKuis);
  const deleteKuis = useAuthoringStore((s) => s.deleteKuis);
  const updateKuis = useAuthoringStore((s) => s.updateKuis);
  const updateKuisOpt = useAuthoringStore((s) => s.updateKuisOpt);
  const applyKuisPreset = useAuthoringStore((s) => s.applyKuisPreset);
  const reorderKuis = useAuthoringStore((s) => s.reorderKuis);
  const listRef = useRef<HTMLDivElement>(null);
  const letters = ['A', 'B', 'C', 'D'];

  const handleReorder = useCallback((newItems: KuisItem[]) => {
    const fromIndex = kuis.findIndex((item, i) => newItems[i] !== item);
    const toIndex = newItems.findIndex((item, i) => kuis[i] !== item);
    if (fromIndex >= 0 && toIndex >= 0) reorderKuis(fromIndex, toIndex);
  }, [kuis, reorderKuis]);

  const { dragHandlers } = useDragSort(kuis, handleReorder);

  const handleAdd = () => {
    addKuis();
    setTimeout(() => {
      const el = listRef.current?.lastElementChild;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div className="space-y-4">
      {/* Preset Cards */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-zinc-200 mb-3">⚡ Preset Kuis</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          <button
            onClick={() => applyKuisPreset('norma-10-soal')}
            className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 text-center hover:border-zinc-600 transition-colors cursor-pointer"
          >
            <div className="text-xl mb-1">❓</div>
            <div className="text-xs font-semibold text-zinc-200">Norma – 10 Soal</div>
            <div className="text-[0.65rem] text-zinc-500">Siap pakai, bisa diedit</div>
          </button>
          <button
            onClick={() => applyKuisPreset('blank')}
            className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 text-center hover:border-zinc-600 transition-colors cursor-pointer"
          >
            <div className="text-xl mb-1">📋</div>
            <div className="text-xs font-semibold text-zinc-200">Kosong</div>
            <div className="text-[0.65rem] text-zinc-500">Buat dari nol</div>
          </button>
        </div>
      </div>

      {/* Quiz List */}
      <div ref={listRef} className="space-y-4">
        {!kuis.length ? (
          <div className="text-center py-6 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="text-3xl mb-2">❓</div>
            <p className="text-sm text-zinc-500">Belum ada soal.</p>
          </div>
        ) : (
          kuis.map((soal, i) => (
            <div key={i} className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 transition-all duration-200 ${
              dragHandlers.getIsDragged(i) ? 'opacity-50 scale-[0.98]' : ''
            } ${dragHandlers.getIsOver(i) ? 'border-t-2 border-t-amber-500' : ''}`}>
              {/* Header */}
              <div className="flex items-center gap-2">
                <span
                  onPointerDown={(e) => dragHandlers.onPointerDown(e, i)}
                  className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing select-none text-lg leading-none px-1"
                  aria-label="Drag to reorder"
                >
                  ⠿
                </span>
                <div className="w-7 h-7 rounded-md bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-sm font-medium text-zinc-200">Soal {i + 1}</span>
                <button
                  onClick={() => deleteKuis(i)}
                  className="ml-auto text-zinc-500 hover:text-red-400 transition-colors text-sm"
                >
                  🗑️
                </button>
              </div>

              {/* Question */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Pertanyaan</label>
                <textarea
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors resize-none"
                  rows={2}
                  placeholder="Tulis pertanyaan…"
                  value={soal.q}
                  onChange={(e) => updateKuis(i, 'q', e.target.value)}
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  Pilihan Jawaban (pilih yang benar)
                </label>
                <div className="space-y-2">
                  {letters.map((letter, j) => (
                    <label
                      key={j}
                      className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                        soal.ans === j
                          ? 'bg-cyan-500/10 border border-cyan-500/30'
                          : 'bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`kuis_ans_${i}`}
                        checked={soal.ans === j}
                        onChange={() => updateKuis(i, 'ans', j)}
                        className="accent-cyan-400"
                      />
                      <span className="text-xs font-bold text-cyan-400 w-4">{letter}.</span>
                      <input
                        className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
                        placeholder={`Opsi ${letter}`}
                        value={soal.opts[j] || ''}
                        onChange={(e) => updateKuisOpt(i, j, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Penjelasan / Feedback</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors"
                  placeholder="Mengapa jawaban ini benar?"
                  value={soal.ex}
                  onChange={(e) => updateKuis(i, 'ex', e.target.value)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={handleAdd}
        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors"
      >
        ＋ Tambah Soal
      </button>
    </div>
  );
}

// ── Main Konten Panel ──────────────────────────────────────────
export default function Konten() {
  const [activeTab, setActiveTab] = useState<KontenTab>('materi');

  const tabs: { id: KontenTab; icon: string; label: string }[] = [
    { id: 'materi', icon: '📝', label: 'Materi' },
    { id: 'skenario', icon: '🎭', label: 'Skenario' },
    { id: 'modules', icon: '🧩', label: 'Modul & Game' },
    { id: 'kuis', icon: '❓', label: 'Evaluasi' },
  ];

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <span>📚</span> Konten Pembelajaran
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Materi, aktivitas/modul, dan evaluasi siswa dalam satu panel.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-1 custom-scrollbar">
        {activeTab === 'materi' && <MateriTab />}
        {activeTab === 'skenario' && <Skenario />}
        {activeTab === 'modules' && <ModulesTab />}
        {activeTab === 'kuis' && <KuisTab />}
      </div>
    </div>
  );
}
