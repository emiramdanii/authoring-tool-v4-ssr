'use client';

import { EdProps, FieldLabel, INPUT_CLS, TEXTAREA_CLS, ColorPicker } from './shared';

export function ReviewEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const kartu = (mod.kartu as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Apa yang sudah dipelajari…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Kartu Review ({kartu.length})</FieldLabel>
        {kartu.map((k, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} placeholder="✅" value={(k.icon as string) || ''} onChange={(e) => ui!('kartu', i, 'icon', e.target.value)} />
              <input className={INPUT_CLS} placeholder="Judul kartu…" value={(k.judul as string) || ''} onChange={(e) => ui!('kartu', i, 'judul', e.target.value)} />
              <ColorPicker value={(k.warna as string) || '#f9c82e'} onChange={(v) => ui!('kartu', i, 'warna', v)} />
              <button onClick={() => ri!('kartu', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Isi kartu…" value={(k.isi as string) || ''} onChange={(e) => ui!('kartu', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('kartu', { icon: '✅', judul: '', isi: '', warna: '#f9c82e' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Kartu</button>
      </div>
    </div>
  );
}
