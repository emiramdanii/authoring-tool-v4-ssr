'use client';

import { EdProps, FieldLabel, INPUT_CLS, TEXTAREA_CLS } from './shared';

export function TimelineEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const events = (mod.events as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar timeline…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Peristiwa ({events.length})</FieldLabel>
        {events.map((ev, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2 relative pl-6 border-l-2 border-app-border ml-2">
            <div className="absolute -left-[9px] top-3 w-4 h-4 rounded-full bg-app-elevated border-2 border-app-border" />
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} placeholder="📌" value={(ev.icon as string) || ''} onChange={(e) => ui!('events', i, 'icon', e.target.value)} />
              <input className={`${INPUT_CLS} w-32`} placeholder="Tahun" value={(ev.tahun as string) || ''} onChange={(e) => ui!('events', i, 'tahun', e.target.value)} />
              <input className={INPUT_CLS} placeholder="Judul peristiwa…" value={(ev.judul as string) || ''} onChange={(e) => ui!('events', i, 'judul', e.target.value)} />
              <button onClick={() => ri!('events', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Deskripsi peristiwa…" value={(ev.isi as string) || ''} onChange={(e) => ui!('events', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('events', { icon: '📌', tahun: '', judul: '', isi: '' })} className="text-xs text-app-accent hover:text-app-accent/80">＋ Tambah Peristiwa</button>
      </div>
    </div>
  );
}
