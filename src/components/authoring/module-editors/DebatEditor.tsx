'use client';

import { EdProps, FieldLabel, INPUT_CLS, TEXTAREA_CLS, MAX_TITLE, MAX_BODY } from './shared';

export function DebatEditor({ mod, uf }: EdProps) {
  const pA = (mod.pihakA as Record<string, unknown>) || {};
  const pB = (mod.pihakB as Record<string, unknown>) || {};
  const upA = (k: string, v: unknown) => uf('pihakA', { ...pA, [k]: v });
  const upB = (k: string, v: unknown) => uf('pihakB', { ...pB, [k]: v });
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Mosi / Pertanyaan Debat</FieldLabel>
        <textarea className={TEXTAREA_CLS} maxLength={MAX_BODY} rows={3} placeholder="Mosiperta debat…" value={(mod.pertanyaan as string) || ''} onChange={(e) => uf('pertanyaan', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Konteks / Latar Belakang</FieldLabel>
        <textarea className={TEXTAREA_CLS} maxLength={MAX_BODY} rows={3} placeholder="Konteks debat…" value={(mod.konteks as string) || ''} onChange={(e) => uf('konteks', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg space-y-2">
          <span className="text-xs font-bold text-green-400">✅ Pihak Pro</span>
          <input className={INPUT_CLS} maxLength={MAX_TITLE} value={(pA.label as string) || 'Pro / Setuju'} onChange={(e) => upA('label', e.target.value)} />
        </div>
        <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-lg space-y-2">
          <span className="text-xs font-bold text-red-400">❌ Pihak Kontra</span>
          <input className={INPUT_CLS} maxLength={MAX_TITLE} value={(pB.label as string) || 'Kontra / Tidak Setuju'} onChange={(e) => upB('label', e.target.value)} />
        </div>
      </div>
      <div>
        <FieldLabel>Prompt Kesimpulan</FieldLabel>
        <textarea className={TEXTAREA_CLS} maxLength={MAX_BODY} rows={2} placeholder="Setelah debat, tulis kesimpulan…" value={(mod.kesimpulan_prompt as string) || ''} onChange={(e) => uf('kesimpulan_prompt', e.target.value)} />
      </div>
    </div>
  );
}
