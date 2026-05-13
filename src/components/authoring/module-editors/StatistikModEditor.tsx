'use client';

import { EdProps, FieldLabel, INPUT_CLS, TEXTAREA_CLS, ColorPicker, MAX_TITLE, MAX_BODY, MAX_SHORT_TEXT } from './shared';

export function StatistikModEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const items = (mod.items as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} maxLength={MAX_BODY} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Layout</FieldLabel>
        <div className="flex gap-2">
          {['grid', 'row'].map((l) => (
            <button key={l} onClick={() => uf('layout', l)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${(mod.layout as string) === l ? 'border-app-accent bg-app-accent/20 text-app-accent' : 'border-app-border/50 text-app-secondary'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Item Statistik ({items.length})</FieldLabel>
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} maxLength={MAX_SHORT_TEXT} placeholder="📊" value={(item.icon as string) || ''} onChange={(e) => ui!('items', i, 'icon', e.target.value)} />
              <input className={`${INPUT_CLS} w-28`} maxLength={MAX_SHORT_TEXT} placeholder="Angka" value={(item.angka as string) || ''} onChange={(e) => ui!('items', i, 'angka', e.target.value)} />
              <input className={`${INPUT_CLS} w-20`} maxLength={MAX_SHORT_TEXT} placeholder="Satuan" value={(item.satuan as string) || ''} onChange={(e) => ui!('items', i, 'satuan', e.target.value)} />
              <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Label…" value={(item.label as string) || ''} onChange={(e) => ui!('items', i, 'label', e.target.value)} />
              <ColorPicker value={(item.color as string) || '#3ecfcf'} onChange={(v) => ui!('items', i, 'color', v)} />
              <button onClick={() => ri!('items', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
          </div>
        ))}
        <button onClick={() => ai!('items', { icon: '📊', angka: '', satuan: '', label: '', color: '#3ecfcf' })} className="text-xs text-app-accent hover:text-app-accent/80">＋ Tambah Item</button>
      </div>
    </div>
  );
}
