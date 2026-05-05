'use client';

import { EdProps, FieldLabel, INPUT_CLS } from './shared';

export function FlashcardEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const kartu = (mod.kartu as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Klik kartu untuk membalik…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Kartu ({kartu.length})</FieldLabel>
        {kartu.map((k, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 grid grid-cols-3 gap-2 items-start">
            <div>
              <span className="text-[10px] text-zinc-500 block mb-1">Depan</span>
              <input className={INPUT_CLS} value={(k.depan as string) || ''} onChange={(e) => ui!('kartu', i, 'depan', e.target.value)} placeholder="Pertanyaan" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block mb-1">Belakang</span>
              <input className={INPUT_CLS} value={(k.belakang as string) || ''} onChange={(e) => ui!('kartu', i, 'belakang', e.target.value)} placeholder="Jawaban" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <span className="text-[10px] text-zinc-500 block mb-1">Hint</span>
                <input className={INPUT_CLS} value={(k.hint as string) || ''} onChange={(e) => ui!('kartu', i, 'hint', e.target.value)} placeholder="💡" />
              </div>
              <button onClick={() => ri!('kartu', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 h-[38px]">✕</button>
            </div>
          </div>
        ))}
        <button onClick={() => ai!('kartu', { depan: '', belakang: '', hint: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Kartu</button>
      </div>
    </div>
  );
}
