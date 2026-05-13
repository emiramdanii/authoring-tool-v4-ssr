'use client';

import { EdProps, FieldLabel, INPUT_CLS, MAX_TITLE } from './shared';

export function HeroEditor({ mod, uf }: EdProps) {
  const gradients = [
    { id: 'sunset', label: '🌅 Sunset' },
    { id: 'ocean', label: '🌊 Ocean' },
    { id: 'forest', label: '🌲 Forest' },
    { id: 'royal', label: '👑 Royal' },
    { id: 'fire', label: '🔥 Fire' },
    { id: 'aurora', label: '🌌 Aurora' },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <FieldLabel>Subjudul</FieldLabel>
          <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Subjudul banner…" value={(mod.subjudul as string) || ''} onChange={(e) => uf('subjudul', e.target.value)} />
        </div>
        <div className="w-20">
          <FieldLabel>Ikon</FieldLabel>
          <input className={INPUT_CLS} maxLength={MAX_TITLE} value={(mod.icon as string) || ''} onChange={(e) => uf('icon', e.target.value)} placeholder="🚀" />
        </div>
      </div>
      <div>
        <FieldLabel>Gradient Tema</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {gradients.map((g) => (
            <button key={g.id} onClick={() => uf('gradient', g.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${(mod.gradient as string) === g.id ? 'border-app-accent bg-app-accent/20 text-app-accent' : 'border-app-border/50 text-app-secondary hover:border-app-border'}`}>
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>CTA Button</FieldLabel>
        <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Mulai Belajar" value={(mod.cta as string) || ''} onChange={(e) => uf('cta', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Chips (pisahkan koma)</FieldLabel>
        <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="PPKn, Kelas VII, Kurikulum Merdeka" value={(mod.chips as string) || ''} onChange={(e) => uf('chips', e.target.value)} />
      </div>
    </div>
  );
}
