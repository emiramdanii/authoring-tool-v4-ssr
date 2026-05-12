'use client';

import { EdProps, FieldLabel, INPUT_CLS, TEXTAREA_CLS } from './shared';

export function HotspotImageEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const hotspots = (mod.hotspots as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Image URL</FieldLabel>
          <input className={INPUT_CLS} placeholder="https://..." value={(mod.imageUrl as string) || ''} onChange={(e) => uf('imageUrl', e.target.value)} />
        </div>
        <div>
          <FieldLabel>Tinggi (px)</FieldLabel>
          <input className={INPUT_CLS} type="number" value={(mod.height as number) || 300} onChange={(e) => uf('height', Number(e.target.value))} />
        </div>
      </div>
      <div>
        <FieldLabel>Mode</FieldLabel>
        <div className="flex gap-2">
          {['pin', 'tooltip', 'card'].map((m) => (
            <button key={m} onClick={() => uf('mode', m)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${(mod.mode as string) === m ? 'border-amber-500 bg-amber-500/20 text-amber-400' : 'border-app-border/50 text-app-secondary'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Hotspots ({hotspots.length})</FieldLabel>
        {hotspots.map((h, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-app-muted">X:</span>
              <input className={`${INPUT_CLS} w-16`} type="number" value={(h.x as number) || 50} onChange={(e) => ui!('hotspots', i, 'x', Number(e.target.value))} />
              <span className="text-xs text-app-muted">Y:</span>
              <input className={`${INPUT_CLS} w-16`} type="number" value={(h.y as number) || 50} onChange={(e) => ui!('hotspots', i, 'y', Number(e.target.value))} />
              <input className={`${INPUT_CLS} w-16`} value={(h.icon as string) || ''} onChange={(e) => ui!('hotspots', i, 'icon', e.target.value)} placeholder="📌" />
              <input className={INPUT_CLS} placeholder="Judul…" value={(h.judul as string) || ''} onChange={(e) => ui!('hotspots', i, 'judul', e.target.value)} />
              <button onClick={() => ri!('hotspots', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Deskripsi hotspot…" value={(h.isi as string) || ''} onChange={(e) => ui!('hotspots', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('hotspots', { x: 50, y: 50, icon: '📌', judul: '', warna: '#f9c82e', isi: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Hotspot</button>
      </div>
    </div>
  );
}
