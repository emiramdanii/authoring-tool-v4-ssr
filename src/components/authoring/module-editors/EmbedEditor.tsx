'use client';

import { EdProps, FieldLabel, INPUT_CLS } from './shared';

export function EmbedEditor({ mod, uf }: EdProps) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>URL Embed</FieldLabel>
        <input className={INPUT_CLS} placeholder="https://..." value={(mod.url as string) || ''} onChange={(e) => uf('url', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Tinggi (px)</FieldLabel>
          <input className={INPUT_CLS} type="number" value={(mod.height as number) || 400} onChange={(e) => uf('height', Number(e.target.value))} />
        </div>
        <div>
          <FieldLabel>Label Link</FieldLabel>
          <input className={INPUT_CLS} value={(mod.label as string) || ''} onChange={(e) => uf('label', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
