'use client';

import { EdProps, FieldLabel, INPUT_CLS, SELECT_CLS, TEXTAREA_CLS, ColorPicker } from './shared';

// ── Sorting Editor ──────────────────────────────────────────
export function SortingEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const kategori = (mod.kategori as Array<Record<string, unknown>>) || [];
  const items = (mod.items as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Kelompokkan item ke kategori yang tepat…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Kategori ({kategori.length})</FieldLabel>
        {kategori.map((k, i) => (
          <div key={i} className="p-2 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 flex items-center gap-2">
            <input className={INPUT_CLS} placeholder="Nama kategori…" value={(k.label as string) || ''} onChange={(e) => ui!('kategori', i, 'label', e.target.value)} />
            <ColorPicker value={(k.color as string) || '#3ecfcf'} onChange={(v) => ui!('kategori', i, 'color', v)} />
            <button onClick={() => ri!('kategori', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
          </div>
        ))}
        <button onClick={() => ai!('kategori', { label: '', color: '#60a5fa', id: 'cat' + Date.now() })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Kategori</button>
      </div>
      <div>
        <FieldLabel>Item ({items.length})</FieldLabel>
        {items.map((item, i) => (
          <div key={i} className="p-2 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 flex items-center gap-2">
            <input className={INPUT_CLS} placeholder="Teks item…" value={(item.teks as string) || ''} onChange={(e) => ui!('items', i, 'teks', e.target.value)} />
            <select className={`${SELECT_CLS} w-36`} value={(item.kategori as string) || ''} onChange={(e) => ui!('items', i, 'kategori', e.target.value)}>
              <option value="">Pilih kategori</option>
              {kategori.map((k, ci) => <option key={ci} value={String(k.id)}>{String(k.label)}</option>)}
            </select>
            <button onClick={() => ri!('items', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
          </div>
        ))}
        <button onClick={() => ai!('items', { teks: '', kategori: (kategori[0]?.id as string) || '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Item</button>
      </div>
    </div>
  );
}

// ── Spinwheel Editor ──────────────────────────────────────────
export function SpinwheelEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const soal = (mod.soal as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Putar roda dan jawab pertanyaan…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Soal ({soal.length})</FieldLabel>
        {soal.map((s, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pertanyaan…" value={(s.teks as string) || ''} onChange={(e) => ui!('soal', i, 'teks', e.target.value)} />
            <div className="flex items-center gap-2">
              <input className={INPUT_CLS} placeholder="Kategori…" value={(s.kategori as string) || ''} onChange={(e) => ui!('soal', i, 'kategori', e.target.value)} />
              <button onClick={() => ri!('soal', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
          </div>
        ))}
        <button onClick={() => ai!('soal', { teks: '', kategori: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Soal</button>
      </div>
    </div>
  );
}

// ── Teambuzzer Editor ─────────────────────────────────────────
export function TeambuzzerEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const soal = (mod.soal as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Kuis antar tim…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Nama Tim A</FieldLabel>
          <input className={INPUT_CLS} value={(mod.timA as string) || ''} onChange={(e) => uf('timA', e.target.value)} />
        </div>
        <div>
          <FieldLabel>Nama Tim B</FieldLabel>
          <input className={INPUT_CLS} value={(mod.timB as string) || ''} onChange={(e) => uf('timB', e.target.value)} />
        </div>
      </div>
      <div>
        <FieldLabel>Soal ({soal.length})</FieldLabel>
        {soal.map((s, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pertanyaan…" value={(s.teks as string) || ''} onChange={(e) => ui!('soal', i, 'teks', e.target.value)} />
            <div className="flex items-center gap-2">
              <input className={INPUT_CLS} placeholder="Jawaban…" value={(s.jawaban as string) || ''} onChange={(e) => ui!('soal', i, 'jawaban', e.target.value)} />
              <div className="w-20">
                <FieldLabel>Poin</FieldLabel>
                <input className={INPUT_CLS} type="number" value={(s.poin as number) || 10} onChange={(e) => ui!('soal', i, 'poin', Number(e.target.value))} />
              </div>
              <button onClick={() => ri!('soal', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0 mt-4">✕</button>
            </div>
          </div>
        ))}
        <button onClick={() => ai!('soal', { teks: '', jawaban: '', poin: 10 })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Soal</button>
      </div>
    </div>
  );
}

// ── Wordsearch Editor ─────────────────────────────────────────
export function WordsearchEditor({ mod, uf }: EdProps) {
  const kataList = ((mod.kata as string[]) || []).join('\n');
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Cari kata tersembunyi…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Kata (satu per baris, maks 10)</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={5} placeholder="norma\nhukum\nagama" value={kataList} onChange={(e) => uf('kata', e.target.value.split('\n').filter(Boolean).slice(0, 10))} />
      </div>
      <div>
        <FieldLabel>Ukuran Grid</FieldLabel>
        <select className={SELECT_CLS} value={(mod.ukuran as number) || 10} onChange={(e) => uf('ukuran', Number(e.target.value))}>
          <option value={8}>8 x 8</option>
          <option value={10}>10 x 10</option>
          <option value={12}>12 x 12</option>
          <option value={15}>15 x 15</option>
        </select>
      </div>
    </div>
  );
}
