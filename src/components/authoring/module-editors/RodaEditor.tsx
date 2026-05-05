'use client';

import { EdProps, FieldLabel, INPUT_CLS } from './shared';

export function RodaEditor({ mod, ai, ri, ui }: EdProps) {
  const opsi = (mod.opsi as string[]) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Opsi Roda ({opsi.length})</FieldLabel>
        {opsi.map((o, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 flex items-center gap-2">
            <span className="text-xs text-zinc-500 flex-shrink-0">{i + 1}</span>
            <input className={INPUT_CLS} value={o} onChange={(e) => ui!('opsi', i, '', e.target.value)} placeholder="Opsi…" />
            <button onClick={() => ri!('opsi', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
          </div>
        ))}
        <button onClick={() => ai!('opsi', { '': '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Opsi</button>
      </div>
    </div>
  );
}
