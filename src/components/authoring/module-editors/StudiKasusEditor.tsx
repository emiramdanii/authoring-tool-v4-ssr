'use client';

import { EdProps, FieldLabel, INPUT_CLS, SELECT_CLS, TEXTAREA_CLS } from './shared';

export function StudiKasusEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const pertanyaan = (mod.pertanyaan as Array<Record<string, unknown>>) || [];
  const bloomLevels = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Narasi Kasus</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={5} placeholder="Jelaskan kasus di sini…" value={(mod.teks as string) || ''} onChange={(e) => uf('teks', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Sumber</FieldLabel>
        <input className={INPUT_CLS} placeholder="Sumber kasus…" value={(mod.sumber as string) || ''} onChange={(e) => uf('sumber', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Pertanyaan Analisis ({pertanyaan.length})</FieldLabel>
        {pertanyaan.map((p, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <select className={`${SELECT_CLS} w-20`} value={(p.level as string) || 'C1'} onChange={(e) => ui!('pertanyaan', i, 'level', e.target.value)}>
                {bloomLevels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <input className={INPUT_CLS} placeholder="Label pertanyaan…" value={(p.label as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'label', e.target.value)} />
              <button onClick={() => ri!('pertanyaan', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Teks pertanyaan…" value={(p.teks as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'teks', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('pertanyaan', { level: 'C2', label: '', teks: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Pertanyaan</button>
      </div>
    </div>
  );
}
