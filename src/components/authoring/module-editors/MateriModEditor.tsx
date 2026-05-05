'use client';

import { EdProps, FieldLabel, TEXTAREA_CLS } from './shared';

export function MateriModEditor({ mod, uf }: EdProps) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar materi…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-center">
        <p className="text-sm text-zinc-400">Untuk mengedit blok materi, gunakan tab <strong className="text-amber-400">Materi</strong> di panel konten.</p>
      </div>
    </div>
  );
}
