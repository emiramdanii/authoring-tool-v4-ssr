'use client';

import { EdProps, FieldLabel, INPUT_CLS, SELECT_CLS, TEXTAREA_CLS } from './shared';

export function VideoEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const pertanyaan = (mod.pertanyaan as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Platform</FieldLabel>
          <select className={SELECT_CLS} value={(mod.platform as string) || 'youtube'} onChange={(e) => uf('platform', e.target.value)}>
            <option value="youtube">YouTube</option>
            <option value="drive">Google Drive</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
        <div>
          <FieldLabel>Durasi</FieldLabel>
          <input className={INPUT_CLS} placeholder="5:30" value={(mod.durasi as string) || ''} onChange={(e) => uf('durasi', e.target.value)} />
        </div>
      </div>
      <div>
        <FieldLabel>URL Video</FieldLabel>
        <input className={INPUT_CLS} placeholder="https://youtube.com/watch?v=..." value={(mod.url as string) || ''} onChange={(e) => uf('url', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Instruksi untuk Siswa</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={3} placeholder="Tonton video ini dan perhatikan…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      {/* Pertanyaan Refleksi */}
      <div>
        <FieldLabel>Pertanyaan Refleksi</FieldLabel>
        {pertanyaan.map((p, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={INPUT_CLS} placeholder="Pertanyaan…" value={(p.teks as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'teks', e.target.value)} />
              <button onClick={() => ri!('pertanyaan', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <label className="flex items-center gap-2 text-xs text-app-secondary">
              <input type="checkbox" checked={(p.wajib as boolean) || false} onChange={(e) => ui!('pertanyaan', i, 'wajib', e.target.checked)} className="rounded" />
              Wajib dijawab
            </label>
          </div>
        ))}
        <button onClick={() => ai!('pertanyaan', { teks: '', wajib: false })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Pertanyaan</button>
      </div>
    </div>
  );
}
