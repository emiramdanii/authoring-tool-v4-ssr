'use client';

import { EdProps, FieldLabel, INPUT_CLS, SELECT_CLS, TEXTAREA_CLS, ColorPicker } from './shared';

export function IconExploreEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const items = (mod.items as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div className="flex gap-3">
        <div>
          <FieldLabel>Layout</FieldLabel>
          <select className={SELECT_CLS} value={(mod.layout as string) || 'grid'} onChange={(e) => uf('layout', e.target.value)}>
            <option value="grid">Grid</option>
            <option value="carousel">Carousel</option>
            <option value="wheel">Wheel</option>
          </select>
        </div>
        <div>
          <FieldLabel>Animasi</FieldLabel>
          <select className={SELECT_CLS} value={(mod.animation as string) || 'fade'} onChange={(e) => uf('animation', e.target.value)}>
            <option value="fade">Fade In</option>
            <option value="slide-up">Slide Up</option>
            <option value="zoom">Zoom</option>
            <option value="bounce">Bounce</option>
          </select>
        </div>
      </div>
      <div>
        <FieldLabel>Item ({items.length})</FieldLabel>
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} value={(item.icon as string) || ''} onChange={(e) => ui!('items', i, 'icon', e.target.value)} placeholder="📌" />
              <input className={INPUT_CLS} placeholder="Judul…" value={(item.judul as string) || ''} onChange={(e) => ui!('items', i, 'judul', e.target.value)} />
              <ColorPicker value={(item.warna as string) || '#3ecfcf'} onChange={(v) => ui!('items', i, 'warna', v)} />
              <button onClick={() => ri!('items', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Ringkasan…" value={(item.ringkasan as string) || ''} onChange={(e) => ui!('items', i, 'ringkasan', e.target.value)} />
            <textarea className={TEXTAREA_CLS} rows={3} placeholder="Isi lengkap…" value={(item.isi as string) || ''} onChange={(e) => ui!('items', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('items', { icon: '', judul: '', warna: '#3ecfcf', ringkasan: '', isi: '', contoh: [], sanksi: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Item</button>
      </div>
    </div>
  );
}
