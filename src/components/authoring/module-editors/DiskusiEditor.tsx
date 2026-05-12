'use client';

import { EdProps, FieldLabel, INPUT_CLS, TEXTAREA_CLS } from './shared';

export function DiskusiEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const pertanyaan = (mod.pertanyaan as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Jawab pertanyaan berikut…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Pertanyaan Diskusi ({pertanyaan.length})</FieldLabel>
        {pertanyaan.map((p, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} placeholder="💬" value={(p.icon as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'icon', e.target.value)} />
              <input className={`${INPUT_CLS} w-40`} placeholder="Label…" value={(p.label as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'label', e.target.value)} />
              <button onClick={() => ri!('pertanyaan', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pertanyaan…" value={(p.teks as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'teks', e.target.value)} />
            <input className={INPUT_CLS} placeholder="Petunjuk jawaban…" value={(p.petunjuk as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'petunjuk', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('pertanyaan', { icon: '💬', label: '', teks: '', petunjuk: '' })} className="text-xs text-app-accent hover:text-app-accent/80">＋ Tambah Pertanyaan</button>
      </div>
    </div>
  );
}
