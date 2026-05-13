'use client';

import { EdProps, FieldLabel, INPUT_CLS, MAX_TITLE } from './shared';

export function MemoryEditor({ mod, ai, ri, ui }: EdProps) {
  const pasangan = (mod.pasangan as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Pasangan ({pasangan.length})</FieldLabel>
        {pasangan.map((p, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 flex items-center gap-2">
            <span className="text-xs text-app-muted flex-shrink-0">{i + 1}</span>
            <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Kartu A…" value={(p.a as string) || ''} onChange={(e) => ui!('pasangan', i, 'a', e.target.value)} />
            <span className="text-app-muted flex-shrink-0">⇄</span>
            <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Kartu B…" value={(p.b as string) || ''} onChange={(e) => ui!('pasangan', i, 'b', e.target.value)} />
            <button onClick={() => ri!('pasangan', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
          </div>
        ))}
        <button onClick={() => ai!('pasangan', { a: '', b: '' })} className="text-xs text-app-accent hover:text-app-accent/80">＋ Tambah Pasangan</button>
      </div>
    </div>
  );
}
