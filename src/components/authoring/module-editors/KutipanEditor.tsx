'use client';

import { EdProps, FieldLabel, INPUT_CLS, TEXTAREA_CLS, ColorPicker, MAX_TITLE, MAX_BODY } from './shared';

export function KutipanEditor({ mod, uf }: EdProps) {
  const displays = [
    { id: 'card', label: '🃏 Card' },
    { id: 'big', label: '📝 Big' },
    { id: 'minimal', label: '✨ Minimal' },
  ];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Kutipan</FieldLabel>
        <textarea className={TEXTAREA_CLS} maxLength={MAX_BODY} rows={3} placeholder="Tulis kutipan di sini…" value={(mod.quote as string) || ''} onChange={(e) => uf('quote', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Sumber / Tokoh</FieldLabel>
          <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Aristoteles" value={(mod.source as string) || ''} onChange={(e) => uf('source', e.target.value)} />
        </div>
        <div>
          <FieldLabel>Jabatan / Judul</FieldLabel>
          <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Filsuf Yunani" value={(mod.title as string) || ''} onChange={(e) => uf('title', e.target.value)} />
        </div>
      </div>
      <div className="flex items-end gap-4">
        <div>
          <FieldLabel>Gaya Tampilan</FieldLabel>
          <div className="flex gap-2">
            {displays.map((d) => (
              <button key={d.id} onClick={() => uf('display', d.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${(mod.display as string) === d.id ? 'border-app-accent bg-app-accent/20 text-app-accent' : 'border-app-border/50 text-app-secondary'}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Warna Aksen</FieldLabel>
          <ColorPicker value={(mod.accent as string) || '#f9c82e'} onChange={(v) => uf('accent', v)} />
        </div>
      </div>
    </div>
  );
}
