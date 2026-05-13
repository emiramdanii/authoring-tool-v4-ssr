'use client';

import { EdProps, FieldLabel, INPUT_CLS, TEXTAREA_CLS, ColorPicker, MAX_TITLE, MAX_BODY, MAX_SHORT_TEXT } from './shared';

export function ComparisonEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const kolom = (mod.kolom as Array<Record<string, unknown>>) || [];
  const baris = (mod.baris as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} maxLength={MAX_BODY} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Kolom</FieldLabel>
        <div className="flex gap-2">
          {kolom.map((k, i) => (
            <div key={i} className="flex-1 p-2 bg-app-elevated/50 rounded-lg border border-app-border/50 space-y-1">
              <div className="flex items-center gap-1">
                <input className={`${INPUT_CLS} w-16`} maxLength={MAX_SHORT_TEXT} value={(k.icon as string) || ''} onChange={(e) => ui!('kolom', i, 'icon', e.target.value)} placeholder="📌" />
                <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Judul kolom…" value={(k.judul as string) || ''} onChange={(e) => ui!('kolom', i, 'judul', e.target.value)} />
                <ColorPicker value={(k.warna as string) || '#3ecfcf'} onChange={(v) => ui!('kolom', i, 'warna', v)} />
              </div>
            </div>
          ))}
          <button onClick={() => ai!('kolom', { icon: '', judul: '', warna: '#60a5fa' })} className="text-xs text-app-accent">＋ Kolom</button>
        </div>
      </div>
      <div>
        <FieldLabel>Baris Perbandingan ({baris.length})</FieldLabel>
        {baris.map((b, i) => {
          const nilai = (b.nilai as string[]) || [''];
          return (
            <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
              <div className="flex items-center gap-2">
                <input className={`${INPUT_CLS} w-16`} maxLength={MAX_SHORT_TEXT} value={(b.icon as string) || ''} onChange={(e) => ui!('baris', i, 'icon', e.target.value)} placeholder="📌" />
                <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Label baris…" value={(b.label as string) || ''} onChange={(e) => ui!('baris', i, 'label', e.target.value)} />
                <button onClick={() => ri!('baris', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${kolom.length}, 1fr)` }}>
                {kolom.map((_, ci) => (
                  <input key={ci} className={INPUT_CLS} maxLength={MAX_TITLE} value={nilai[ci] || ''} onChange={(e) => {
                    const n = [...nilai];
                    n[ci] = e.target.value;
                    ui!('baris', i, 'nilai', n);
                  }} placeholder={`Kolom ${ci + 1}`} />
                ))}
              </div>
            </div>
          );
        })}
        <button onClick={() => ai!('baris', { label: '', icon: '', nilai: kolom.map(() => '') })} className="text-xs text-app-accent hover:text-app-accent/80">＋ Tambah Baris</button>
      </div>
      <div>
        <FieldLabel>Pertanyaan Refleksi</FieldLabel>
        <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Apa pendapatmu?" value={(mod.tanya as string) || ''} onChange={(e) => uf('tanya', e.target.value)} />
      </div>
    </div>
  );
}
