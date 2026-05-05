'use client';

import { EdProps, FieldLabel, INPUT_CLS, SELECT_CLS, TEXTAREA_CLS, ColorPicker } from './shared';

export function PollingEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const opsi = (mod.opsi as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Pilih satu jawaban…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div className="flex gap-3">
        <div>
          <FieldLabel>Tipe Voting</FieldLabel>
          <select className={SELECT_CLS} value={(mod.tipe as string) || 'single'} onChange={(e) => uf('tipe', e.target.value)}>
            <option value="single">Pilihan Tunggal</option>
            <option value="multiple">Pilihan Ganda</option>
          </select>
        </div>
        <div>
          <FieldLabel>Anonim</FieldLabel>
          <label className="flex items-center gap-2 mt-2">
            <input type="checkbox" checked={(mod.anonymous as boolean) || false} onChange={(e) => uf('anonymous', e.target.checked)} className="rounded" />
            <span className="text-sm text-zinc-300">Voting anonim</span>
          </label>
        </div>
      </div>
      <div>
        <FieldLabel>Opsi ({opsi.length})</FieldLabel>
        {opsi.map((o, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 flex items-center gap-2">
            <input className={`${INPUT_CLS} w-12`} value={(o.icon as string) || ''} onChange={(e) => ui!('opsi', i, 'icon', e.target.value)} placeholder="📊" />
            <input className={INPUT_CLS} placeholder="Teks opsi…" value={(o.teks as string) || ''} onChange={(e) => ui!('opsi', i, 'teks', e.target.value)} />
            <ColorPicker value={(o.warna as string) || '#3ecfcf'} onChange={(v) => ui!('opsi', i, 'warna', v)} />
            <button onClick={() => ri!('opsi', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
          </div>
        ))}
        <button onClick={() => ai!('opsi', { icon: '', teks: '', warna: '#3ecfcf' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Opsi</button>
      </div>
    </div>
  );
}
