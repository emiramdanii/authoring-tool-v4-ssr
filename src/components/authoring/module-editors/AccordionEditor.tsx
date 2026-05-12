'use client';

import { EdProps, FieldLabel, INPUT_CLS, TEXTAREA_CLS } from './shared';

export function AccordionEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const items = (mod.items as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Item ({items.length})</FieldLabel>
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} placeholder="📌" value={(item.icon as string) || ''} onChange={(e) => ui!('items', i, 'icon', e.target.value)} />
              <input className={INPUT_CLS} placeholder="Judul item…" value={(item.judul as string) || ''} onChange={(e) => ui!('items', i, 'judul', e.target.value)} />
              <button onClick={() => ri!('items', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Isi detail…" value={(item.isi as string) || ''} onChange={(e) => ui!('items', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('items', { icon: '📌', judul: '', isi: '' })} className="text-xs text-app-accent hover:text-app-accent/80">＋ Tambah Item</button>
      </div>
    </div>
  );
}
