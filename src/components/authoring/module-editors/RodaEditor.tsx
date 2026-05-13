'use client';

import { EdProps, FieldLabel, INPUT_CLS, MAX_TITLE } from './shared';

export function RodaEditor({ mod, ai, ri, ui }: EdProps) {
  const opsi = (mod.opsi as string[]) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Opsi Roda ({opsi.length})</FieldLabel>
        {opsi.map((o, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 flex items-center gap-2">
            <span className="text-xs text-app-muted flex-shrink-0">{i + 1}</span>
            <input className={INPUT_CLS} maxLength={MAX_TITLE} value={o} onChange={(e) => ui!('opsi', i, '', e.target.value)} placeholder="Opsi…" />
            <button onClick={() => ri!('opsi', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
          </div>
        ))}
        <button onClick={() => ai!('opsi', { '': '' })} className="text-xs text-app-accent hover:text-app-accent/80">＋ Tambah Opsi</button>
      </div>
    </div>
  );
}
