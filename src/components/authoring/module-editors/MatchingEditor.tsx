'use client';

import { EdProps, FieldLabel, INPUT_CLS } from './shared';

export function MatchingEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const pasangan = (mod.pasangan as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Cocokkan pasangan…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Pasangan ({pasangan.length})</FieldLabel>
        {pasangan.map((p, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 flex items-center gap-2">
            <span className="text-xs text-app-muted flex-shrink-0">{i + 1}</span>
            <input className={INPUT_CLS} placeholder="Kiri…" value={(p.kiri as string) || ''} onChange={(e) => ui!('pasangan', i, 'kiri', e.target.value)} />
            <span className="text-app-muted flex-shrink-0">↔</span>
            <input className={INPUT_CLS} placeholder="Kanan…" value={(p.kanan as string) || ''} onChange={(e) => ui!('pasangan', i, 'kanan', e.target.value)} />
            <button onClick={() => ri!('pasangan', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
          </div>
        ))}
        <button onClick={() => ai!('pasangan', { kiri: '', kanan: '' })} className="text-xs text-app-accent hover:text-app-accent/80">＋ Tambah Pasangan</button>
      </div>
    </div>
  );
}
