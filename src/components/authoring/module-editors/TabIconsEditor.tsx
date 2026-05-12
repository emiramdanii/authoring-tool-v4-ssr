'use client';

import { EdProps, FieldLabel, INPUT_CLS, SELECT_CLS, TEXTAREA_CLS, ColorPicker } from './shared';

export function TabIconsEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const tabs = (mod.tabs as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div className="flex gap-3">
        <div>
          <FieldLabel>Layout</FieldLabel>
          <select className={SELECT_CLS} value={(mod.layout as string) || 'horizontal'} onChange={(e) => uf('layout', e.target.value)}>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="pills">Pills</option>
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
        <FieldLabel>Tabs ({tabs.length})</FieldLabel>
        {tabs.map((tab, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} value={(tab.icon as string) || ''} onChange={(e) => ui!('tabs', i, 'icon', e.target.value)} placeholder="📌" />
              <input className={INPUT_CLS} placeholder="Judul tab…" value={(tab.judul as string) || ''} onChange={(e) => ui!('tabs', i, 'judul', e.target.value)} />
              <ColorPicker value={(tab.warna as string) || '#3ecfcf'} onChange={(v) => ui!('tabs', i, 'warna', v)} />
              <button onClick={() => ri!('tabs', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Isi tab…" value={(tab.isi as string) || ''} onChange={(e) => ui!('tabs', i, 'isi', e.target.value)} />
            <div>
              <FieldLabel>Pertanyaan Refleksi</FieldLabel>
              <input className={INPUT_CLS} placeholder="Pertanyaan refleksi…" value={(tab.refleksi as string) || ''} onChange={(e) => ui!('tabs', i, 'refleksi', e.target.value)} />
            </div>
          </div>
        ))}
        <button onClick={() => ai!('tabs', { icon: '', judul: '', warna: '#3ecfcf', isi: '', poin: [], refleksi: '' })} className="text-xs text-app-accent hover:text-app-accent/80">＋ Tambah Tab</button>
      </div>
    </div>
  );
}
