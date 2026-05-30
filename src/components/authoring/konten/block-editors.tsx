'use client';

import { useCallback, useState } from 'react';
import { useSchemaMateri } from '@/hooks/use-schema-navigator';
import type { MateriBlok } from '@/store/authoring-store';
import { FieldLabel, INPUT_CLS, TEXTAREA_CLS, CompareSideForm } from './shared';
import { ImageUploader } from './ImageUploader';
import { MediaLibrary } from './MediaLibrary';
// All icons migrated to Material Symbols Outlined
// ═══════════════════════════════════════════════════════════════════
// BLOCK EDITORS — Schema-First (Phase 3)
// ═══════════════════════════════════════════════════════════════════
// All editors now write through useSchemaMateri().updateBlok(),
// which calls applyGuidedSchemaPatch() — the single write path.
//
// Previously: updateMateriBlok(idx, key, value) → authoring store
// Now:        updateBlok(idx, key, value) → schema → projection sync
// ═══════════════════════════════════════════════════════════════════

// ── Block Editor Forms ─────────────────────────────────────────

/** 1. teks – Paragraph text */
function TeksEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const { updateBlok: update } = useSchemaMateri();
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
  const { updateBlok: update } = useSchemaMateri();
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
  const { updateBlok: update } = useSchemaMateri();
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
              <span className="text-app-muted text-sm flex-shrink-0">•</span>
              <input className={INPUT_CLS} placeholder={`Poin ${i + 1}…`} value={b} onChange={(e) => updateButir(i, e.target.value)} />
              <button
                onClick={() => removeButir(i)}
                className="text-app-muted hover:text-red-400 transition-colors flex-shrink-0 text-sm p-1"
                title="Hapus poin"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button onClick={addButir} className="mt-2 text-xs text-app-accent hover:text-app-accent/80 transition-colors">
          ＋ Tambah Poin
        </button>
      </div>
    </div>
  );
}

/** 4. tabel – Table */
function TabelEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const { updateBlok: update } = useSchemaMateri();
  const baris = blok.baris || [['', ''], ['', '']];
  const cols = baris[0]?.length || 2;

  const updateCell = useCallback(
    (r: number, c: number, val: string) => {
      const next = baris.map((row) => [...row]);
      next[r]![c] = val;
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
        <div className="overflow-x-auto rounded-lg border border-app-border">
          <table className="w-full text-sm">
            <tbody>
              {baris.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="p-0.5">
                      <input
                        className="w-full bg-app-elevated border border-app-border/50 rounded px-2 py-1.5 text-xs text-app-primary placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-app-accent/50 min-w-[100px]"
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
          <button onClick={addRow} className="text-xs text-app-accent hover:text-app-accent/80 transition-colors">
            ＋ Tambah Baris
          </button>
          <button onClick={addCol} className="text-xs text-app-accent hover:text-app-accent/80 transition-colors">
            ＋ Tambah Kolom
          </button>
          <button onClick={() => removeRow(baris.length - 1)} className="text-xs text-app-muted hover:text-red-400 transition-colors">
            － Hapus Baris
          </button>
          <button onClick={removeCol} className="text-xs text-app-muted hover:text-red-400 transition-colors">
            － Hapus Kolom
          </button>
        </div>
      </div>
    </div>
  );
}

/** 5. kutipan – Quote */
function KutipanEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const { updateBlok: update } = useSchemaMateri();
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

/** 6. gambar – Image with upload support */
function GambarEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const { updateBlok: update } = useSchemaMateri();
  const url = blok.isi || '';
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Judul Gambar (opsional)</FieldLabel>
        <input className={INPUT_CLS} placeholder="Judul gambar…" value={blok.judul || ''} onChange={(e) => update(idx, 'judul', e.target.value)} />
      </div>

      {/* Image Uploader — drag & drop + file picker */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <FieldLabel>Unggah Gambar</FieldLabel>
          <button
            onClick={() => setShowMediaLibrary(true)}
            className="flex items-center gap-1 text-xs text-app-accent hover:text-app-accent/80 transition-colors"
            title="Buka Pustaka Media"
          >
            <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>folder_open</span> Pustaka Media
          </button>
        </div>
        <ImageUploader
          value={url}
          onUpload={(uploadedUrl) => update(idx, 'isi', uploadedUrl)}
          onClear={() => update(idx, 'isi', '')}
        />
      </div>

      {/* URL input as fallback */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <FieldLabel>URL Gambar</FieldLabel>
          <span className="text-[0.6rem] text-app-muted">(opsional, jika tidak unggah)</span>
        </div>
        <input
          className={INPUT_CLS}
          placeholder="https://contoh.com/gambar.png"
          value={url}
          onChange={(e) => update(idx, 'isi', e.target.value)}
        />
      </div>

      {/* Preview thumbnail */}
      {url && (
        <div className="rounded-lg border border-app-border overflow-hidden bg-app-elevated/50">
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

      {/* Media Library overlay */}
      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={(selectedUrl) => update(idx, 'isi', selectedUrl)}
      />
    </div>
  );
}

/** 7. timeline – Timeline */
function TimelineEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const { updateBlok: update } = useSchemaMateri();
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
            <div key={i} className="relative pl-6 border-l-2 border-app-border ml-2 pb-1">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-app-elevated border-2 border-app-border" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-app-muted w-12 flex-shrink-0">Ikon</span>
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
                  <button onClick={() => removeLangkah(i)} className="text-xs text-app-muted hover:text-red-400 transition-colors">
                    Hapus langkah
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={addLangkah} className="mt-3 text-xs text-app-accent hover:text-app-accent/80 transition-colors">
          ＋ Tambah Langkah
        </button>
      </div>
    </div>
  );
}

/** 8. highlight – Highlight card */
function HighlightEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const { updateBlok: update } = useSchemaMateri();
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
              className="w-8 h-8 rounded cursor-pointer border border-app-border bg-transparent"
              value={blok.warna || '#f9c82e'}
              onChange={(e) => update(idx, 'warna', e.target.value)}
            />
            <span className="text-xs text-app-muted font-mono">{blok.warna || '#f9c82e'}</span>
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

/** 9. compare – Comparison */
function CompareEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const { updateBlok: update } = useSchemaMateri();
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
  const { updateBlok: update } = useSchemaMateri();
  const styles = [
    { id: 'info', label: 'ℹ️ Info', color: '#60a5fa' },
    { id: 'tips', label: '💡 Tips', color: '#f9c82e' },
    { id: 'warning', label: '⚠️ Warning', color: '#fb923c' },
    { id: 'success', label: '✅ Success', color: '#34d399' },
  ];

  const currentStyle = blok.style || blok.infoboxStyle || 'info';
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
                  : 'border-app-border/50 opacity-60 hover:opacity-100'
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
        <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: currentStyleInfo!.color }} />
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
  const { updateBlok: update } = useSchemaMateri();
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
              <span className="w-4 h-4 flex-shrink-0 rounded border border-app-border flex items-center justify-center text-[10px] text-app-muted">
                {i + 1}
              </span>
              <input className={INPUT_CLS} placeholder={`Item ${i + 1}…`} value={b} onChange={(e) => updateButir(i, e.target.value)} />
              <button
                onClick={() => removeButir(i)}
                className="text-app-muted hover:text-red-400 transition-colors flex-shrink-0 text-sm p-1"
                title="Hapus item"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button onClick={addButir} className="mt-2 text-xs text-app-accent hover:text-app-accent/80 transition-colors">
          ＋ Tambah Item
        </button>
      </div>
    </div>
  );
}

/** 12. statistik – Statistics */
function StatistikEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const { updateBlok: update } = useSchemaMateri();
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
            <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 space-y-2">
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
                    className="w-7 h-7 rounded cursor-pointer border border-app-border bg-transparent"
                    value={item.warna || '#3ecfcf'}
                    onChange={(e) => updateItem(i, 'warna', e.target.value)}
                  />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-app-muted hover:text-red-400 transition-colors text-sm p-1">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="mt-2 text-xs text-app-accent hover:text-app-accent/80 transition-colors">
          ＋ Tambah Item
        </button>
      </div>
    </div>
  );
}

/** 13. studi – Case study */
function StudiEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
  const { updateBlok: update } = useSchemaMateri();
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
export function BlockEditor({ blok, idx }: { blok: MateriBlok; idx: number }) {
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
    default:          return <div className="text-sm text-app-muted">Tipe blok tidak dikenali: {blok.tipe}</div>;
  }
}
