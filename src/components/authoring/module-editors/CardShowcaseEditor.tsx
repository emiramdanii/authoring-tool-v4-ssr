'use client';

import { EdProps, FieldLabel, INPUT_CLS, SELECT_CLS, TEXTAREA_CLS, ColorPicker, MAX_TITLE, MAX_BODY, MAX_SHORT_TEXT } from './shared';

export function CardShowcaseEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const cards = (mod.cards as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} maxLength={MAX_BODY} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div className="flex gap-3">
        <div>
          <FieldLabel>Layout</FieldLabel>
          <select className={SELECT_CLS} value={(mod.layout as string) || 'grid'} onChange={(e) => uf('layout', e.target.value)}>
            <option value="grid">Grid</option>
            <option value="list">List</option>
            <option value="masonry">Masonry</option>
          </select>
        </div>
        <div>
          <FieldLabel>Animasi</FieldLabel>
          <select className={SELECT_CLS} value={(mod.animation as string) || 'fade'} onChange={(e) => uf('animation', e.target.value)}>
            <option value="fade">Fade</option>
            <option value="slide-up">Slide Up</option>
            <option value="zoom">Zoom</option>
            <option value="bounce">Bounce</option>
          </select>
        </div>
      </div>
      <div>
        <FieldLabel>Cards ({cards.length})</FieldLabel>
        {cards.map((c, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} maxLength={MAX_SHORT_TEXT} value={(c.icon as string) || ''} onChange={(e) => ui!('cards', i, 'icon', e.target.value)} placeholder="📌" />
              <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Judul…" value={(c.judul as string) || ''} onChange={(e) => ui!('cards', i, 'judul', e.target.value)} />
              <ColorPicker value={(c.warna as string) || '#3ecfcf'} onChange={(v) => ui!('cards', i, 'warna', v)} />
              <button onClick={() => ri!('cards', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Subtitle…" value={(c.subtitle as string) || ''} onChange={(e) => ui!('cards', i, 'subtitle', e.target.value)} />
            <textarea className={TEXTAREA_CLS} maxLength={MAX_BODY} rows={2} placeholder="Isi kartu…" value={(c.isi as string) || ''} onChange={(e) => ui!('cards', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('cards', { icon: '', judul: '', subtitle: '', isi: '', tag: [], warna: '#3ecfcf' })} className="text-xs text-app-accent hover:text-app-accent/80">＋ Tambah Card</button>
      </div>
    </div>
  );
}
