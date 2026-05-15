'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { EdProps, FieldLabel, INPUT_CLS, TEXTAREA_CLS, MAX_TITLE, MAX_BODY, MAX_SHORT_TEXT } from './shared';
import { useAuthoringStore } from '@/store/authoring-store';
import { regenerateRefleksi } from '../auto-generate/regenerate';
import { Zap, Loader2 } from 'lucide-react';
import { canRegenerate } from '../auto-generate/regenerate';

export function RefleksiEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const pertanyaan = (mod.pertanyaan as Array<Record<string, unknown>>) || [];
  const [regenerating, setRegenerating] = useState(false);
  const showRegenBtn = canRegenerate() || pertanyaan.length > 0;

  const handleRegenerate = async () => {
    const store = useAuthoringStore.getState();
    const meta = store.meta;
    setRegenerating(true);
    try {
      const data = regenerateRefleksi({
        judulPertemuan: meta.judulPertemuan,
        namaBab: meta.namaBab,
      });
      if (data) {
        uf('intro', data.intro);
        uf('pertanyaan', data.pertanyaan);
        if (data.title) uf('title', data.title);
        if (data.penugasan) uf('penugasan', data.penugasan);
        toast.success(`🪞 ${data.pertanyaan.length} pertanyaan refleksi digenerate ulang`);
      } else {
        toast.error('Gagal regenerate — tidak ada teks sumber.');
        useAuthoringStore.getState().setActivePanel('autogen');
      }
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Regenerate button row */}
      {showRegenBtn && (
        <div className="flex justify-end">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-app-elevated/70 border border-app-border/50 text-app-secondary hover:text-app-accent hover:border-app-accent/30 hover:bg-app-accent/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            title="Regenerate pertanyaan refleksi dari teks sumber"
          >
            {regenerating ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            {regenerating ? 'Generating...' : 'Regenerate'}
          </button>
        </div>
      )}

      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} maxLength={MAX_BODY} rows={2} placeholder="Tuliskan refleksimu…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Pertanyaan Refleksi ({pertanyaan.length})</FieldLabel>
        {pertanyaan.map((p, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} maxLength={MAX_SHORT_TEXT} placeholder="💭" value={(p.icon as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'icon', e.target.value)} />
              <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Pertanyaan refleksi…" value={(p.teks as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'teks', e.target.value)} />
              <button onClick={() => ri!('pertanyaan', i)} className="text-app-muted hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <input className={INPUT_CLS} maxLength={MAX_TITLE} placeholder="Petunjuk jawaban…" value={(p.petunjuk as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'petunjuk', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('pertanyaan', { icon: '💭', teks: '', petunjuk: '' })} className="text-xs text-app-accent hover:text-app-accent/80">＋ Tambah Pertanyaan</button>
      </div>
    </div>
  );
}
