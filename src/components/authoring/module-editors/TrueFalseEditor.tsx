'use client';

import { EdProps, FieldLabel, INPUT_CLS, SELECT_CLS, TEXTAREA_CLS, MAX_TITLE, MAX_BODY } from './shared';

export function TrueFalseEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const soal = (mod.soal as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Tentukan apakah pernyataan berikut benar atau salah…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Pernyataan ({soal.length})</FieldLabel>
        {soal.map((s, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <textarea className={TEXTAREA_CLS} maxLength={MAX_BODY} rows={2} placeholder="Pernyataan…" value={(s.teks as string) || ''} onChange={(e) => ui!('soal', i, 'teks', e.target.value)} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-app-muted">Jawaban:</span>
              <select className={`${SELECT_CLS} w-32`} value={(s.jawaban as boolean) ? 'true' : 'false'} onChange={(e) => ui!('soal', i, 'jawaban', e.target.value === 'true')}>
                <option value="true">✅ Benar</option>
                <option value="false">❌ Salah</option>
              </select>
              <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Penjelasan…" value={(s.penjelasan as string) || ''} onChange={(e) => ui!('soal', i, 'penjelasan', e.target.value)} />
              <button onClick={() => ri!('soal', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
          </div>
        ))}
        <button onClick={() => ai!('soal', { teks: '', jawaban: true, penjelasan: '' })} className="text-xs text-app-accent hover:text-app-accent/80">＋ Tambah Pernyataan</button>
      </div>
    </div>
  );
}
