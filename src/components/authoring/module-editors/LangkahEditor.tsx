'use client';

import { EdProps, FieldLabel, INPUT_CLS, TEXTAREA_CLS, ColorPicker } from './shared';

export function LangkahEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const steps = (mod.steps as Array<Record<string, unknown>>) || [];
  const styles = ['numbered', 'bubble', 'arrow'];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Gaya</FieldLabel>
        <div className="flex gap-2">
          {styles.map((s) => (
            <button key={s} onClick={() => uf('style', s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${(mod.style as string) === s ? 'border-amber-500 bg-amber-500/20 text-amber-400' : 'border-app-border/50 text-app-secondary'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Langkah ({steps.length})</FieldLabel>
        {steps.map((st, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-app-elevated flex items-center justify-center text-xs font-bold text-app-secondary flex-shrink-0">{i + 1}</span>
              <input className={`${INPUT_CLS} w-16`} value={(st.icon as string) || ''} onChange={(e) => ui!('steps', i, 'icon', e.target.value)} placeholder="📌" />
              <input className={INPUT_CLS} placeholder="Judul langkah…" value={(st.judul as string) || ''} onChange={(e) => ui!('steps', i, 'judul', e.target.value)} />
              <ColorPicker value={(st.color as string) || '#3ecfcf'} onChange={(v) => ui!('steps', i, 'color', v)} />
              <button onClick={() => ri!('steps', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Deskripsi langkah…" value={(st.isi as string) || ''} onChange={(e) => ui!('steps', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('steps', { icon: '📌', judul: '', isi: '', color: '#3ecfcf' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Langkah</button>
      </div>
    </div>
  );
}
