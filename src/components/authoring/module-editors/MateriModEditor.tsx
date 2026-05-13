'use client';

import { EdProps, FieldLabel, TEXTAREA_CLS, MAX_BODY } from './shared';

export function MateriModEditor({ mod, uf }: EdProps) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} maxLength={MAX_BODY} rows={2} placeholder="Pengantar materi…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 text-center">
        <p className="text-sm text-app-secondary">Untuk mengedit blok materi, gunakan tab <strong className="text-app-accent">Materi</strong> di panel konten.</p>
      </div>
    </div>
  );
}
