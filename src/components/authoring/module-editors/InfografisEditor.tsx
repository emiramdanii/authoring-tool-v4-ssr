'use client';

import { EdProps, FieldLabel, INPUT_CLS, SELECT_CLS, TEXTAREA_CLS, ColorPicker, MAX_TITLE, MAX_BODY, MAX_SHORT_TEXT } from './shared';

export function InfografisEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const kartu = (mod.kartu as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Layout</FieldLabel>
          <select className={SELECT_CLS} value={(mod.layoutVariant as string) || (mod.layout as string) || 'grid'} onChange={(e) => uf('layoutVariant', e.target.value)}>
            <option value="grid">Grid</option>
            <option value="list">List</option>
            <option value="timeline">Timeline</option>
          </select>
        </div>
      </div>
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} maxLength={MAX_BODY} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Kartu ({kartu.length})</FieldLabel>
        {kartu.map((k, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} maxLength={MAX_SHORT_TEXT} placeholder="📊" value={(k.icon as string) || ''} onChange={(e) => ui!('kartu', i, 'icon', e.target.value)} />
              <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Judul kartu…" value={(k.judul as string) || ''} onChange={(e) => ui!('kartu', i, 'judul', e.target.value)} />
              <ColorPicker value={(k.color as string) || '#3ecfcf'} onChange={(v) => ui!('kartu', i, 'color', v)} />
              <button onClick={() => ri!('kartu', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} maxLength={MAX_BODY} rows={2} placeholder="Isi kartu…" value={(k.isi as string) || ''} onChange={(e) => ui!('kartu', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('kartu', { icon: '📌', judul: '', isi: '', color: '#3ecfcf' })} className="text-xs text-app-accent hover:text-app-accent/80">＋ Tambah Kartu</button>
      </div>
    </div>
  );
}
