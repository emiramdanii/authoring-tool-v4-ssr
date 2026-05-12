'use client';

import { EdProps, FieldLabel, INPUT_CLS, TEXTAREA_CLS } from './shared';

export function PetunjukEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const langkah = (mod.langkah as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Ikuti langkah-langkah berikut…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Langkah Petunjuk ({langkah.length})</FieldLabel>
        {langkah.map((l, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} placeholder="📌" value={(l.icon as string) || ''} onChange={(e) => ui!('langkah', i, 'icon', e.target.value)} />
              <input className={INPUT_CLS} placeholder="Judul langkah…" value={(l.judul as string) || ''} onChange={(e) => ui!('langkah', i, 'judul', e.target.value)} />
              <button onClick={() => ri!('langkah', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Deskripsi langkah…" value={(l.isi as string) || ''} onChange={(e) => ui!('langkah', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('langkah', { icon: '📌', judul: '', isi: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Langkah</button>
      </div>
    </div>
  );
}
