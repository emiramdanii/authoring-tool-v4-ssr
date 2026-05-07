'use client';

import { EdProps, FieldLabel, INPUT_CLS, TEXTAREA_CLS } from './shared';

export function RefleksiEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const pertanyaan = (mod.pertanyaan as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Tuliskan refleksimu…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Pertanyaan Refleksi ({pertanyaan.length})</FieldLabel>
        {pertanyaan.map((p, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} placeholder="💭" value={(p.icon as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'icon', e.target.value)} />
              <input className={INPUT_CLS} placeholder="Pertanyaan refleksi…" value={(p.teks as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'teks', e.target.value)} />
              <button onClick={() => ri!('pertanyaan', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <input className={INPUT_CLS} placeholder="Petunjuk jawaban…" value={(p.petunjuk as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'petunjuk', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('pertanyaan', { icon: '💭', teks: '', petunjuk: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Pertanyaan</button>
      </div>
    </div>
  );
}
