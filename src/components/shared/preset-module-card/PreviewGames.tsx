import React from 'react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str, num } from './helpers';
import { alpha } from '@/lib/color-palette';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: FLASHCARD
// ═══════════════════════════════════════════════════════════════════
export function PreviewFlashcard({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const kartu = arr<Record<string, unknown>>(mod.kartu);
  const max = compact ? 2 : variant === 'C' ? 6 : 4;
  const cols = variant === 'B' ? 'grid-cols-2' : variant === 'C' ? 'grid-cols-2' : 'grid-cols-2';

  return (
    <div className={`grid ${cols} gap-2`}>
      {kartu.slice(0, max).map((k, i) => (
        <div key={i} className="rounded-lg overflow-hidden" style={{ background: T.bg2, border: '1px solid rgba(255,255,255,0.09)', minHeight: compact ? 40 : 80 }}>
          <div className="flex flex-col items-center justify-center text-center p-3 h-full">
            <div className="font-bold text-xs" style={{ color: T.text }}>{str(k.depan) || `Kartu ${i + 1}`}</div>
            {str(k.hint) && <div className="text-[10px] mt-1" style={{ color: T.muted }}>{str(k.hint)}</div>}
            {!compact && <div className="text-[9px] mt-2" style={{ color: T.muted }}>Klik untuk membalik</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: MATCHING
// ═══════════════════════════════════════════════════════════════════
export function PreviewMatching({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const pasangan = arr<Record<string, unknown>>(mod.pasangan);
  const max = compact ? 2 : 4;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {pasangan.slice(0, max).map((p, i) => (
          <div key={i} style={{ borderLeft: '3px solid #60a5fa', paddingLeft: 8 }}>
            <span className="text-[11px]" style={{ color: T.text }}>{str(p.kiri)} ↔ {str(p.kanan)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {pasangan.slice(0, max).flatMap((p, i) => [
        <div key={`l${i}`} className="rounded-lg p-2 text-xs font-bold" style={{ background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.07)', color: T.text }}>{str(p.kiri)}</div>,
        <div key={`r${i}`} className="rounded-lg p-2 text-xs font-bold" style={{ background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.07)', color: T.text }}>{str(p.kanan)}</div>,
      ])}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: TRUEFALSE
// ═══════════════════════════════════════════════════════════════════
export function PreviewTrueFalse({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const soal = arr<Record<string, unknown>>(mod.soal);
  const max = compact ? 2 : 4;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {soal.slice(0, max).map((s, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${T.g}`, paddingLeft: 8 }}>
            <span className="text-[11px]" style={{ color: T.text }}>{str(s.teks)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {soal.slice(0, max).map((s, i) => (
        <div key={i} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-bold mb-1" style={{ color: T.text }}>{i + 1}. {str(s.teks)}</p>
          <div className="flex gap-1.5">
            <div className="flex-1 text-center text-[10px] font-bold py-1 rounded" style={{ background: 'rgba(52,211,153,0.05)', border: '2px solid rgba(52,211,153,0.3)', color: T.g }}>✅ Benar</div>
            <div className="flex-1 text-center text-[10px] font-bold py-1 rounded" style={{ background: 'rgba(255,107,107,0.05)', border: '2px solid rgba(255,107,107,0.3)', color: T.r }}>❌ Salah</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: MEMORY
// ═══════════════════════════════════════════════════════════════════
export function PreviewMemory({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const pasangan = arr<Record<string, unknown>>(mod.pasangan);
  const items = pasangan.flatMap(p => [str(p.a), str(p.b)]);
  const max = compact ? 4 : 8;
  const cols = variant === 'C' ? 'grid-cols-4' : 'grid-cols-4';

  return (
    <div className={`grid ${cols} gap-1`}>
      {items.slice(0, max).map((text, i) => (
        <div key={i} className="aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold p-1 text-center" style={{ background: T.bg2, border: '2px solid rgba(255,255,255,0.07)', color: T.text }}>{text}</div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: RODA
// ═══════════════════════════════════════════════════════════════════
export function PreviewRoda({ mod, compact }: { mod: M; compact: boolean }) {
  const opsi = arr<Record<string, unknown>>(mod.opsi);
  if (!opsi.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada opsi.</div>;
  const colors = ['#f9c12e', '#3ecfcf', '#ff6b6b', '#a78bfa', '#34d399', '#fb923c'];

  return (
    <div className="flex flex-wrap gap-1.5">
      {opsi.slice(0, compact ? 3 : 6).map((o, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: alpha(colors[i % colors.length], 0.12), color: colors[i % colors.length] }}>{String(o)}</span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: SORTING
// ═══════════════════════════════════════════════════════════════════
export function PreviewSorting({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const items = arr<Record<string, unknown>>(mod.items);
  const max = compact ? 3 : 4;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {items.slice(0, max).map((it, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${T.c}`, paddingLeft: 8 }}>
            <span className="text-[11px]" style={{ color: T.text }}>{str(it.icon, '📌')} {str(it.teks || it.label)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.slice(0, max).map((it, i) => (
        <div key={i} className="rounded-lg px-3 py-1.5 flex items-center gap-1.5" style={{ background: 'rgba(62,207,207,0.08)', border: '1px solid rgba(62,207,207,0.2)' }}>
          <span className="text-xs">{str(it.icon, '📌')}</span>
          <span className="text-[11px] font-bold" style={{ color: T.text }}>{str(it.teks || it.label)}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: SPINWHEEL
// ═══════════════════════════════════════════════════════════════════
export function PreviewSpinwheel({ mod, compact }: { mod: M; compact: boolean }) {
  const soal = arr<Record<string, unknown>>(mod.soal);
  const max = compact ? 2 : 3;

  return (
    <div className="space-y-1.5">
      {soal.slice(0, max).map((s, i) => (
        <div key={i} className="rounded-lg p-2 text-xs font-semibold" style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.2)', color: T.text }}>
          🎡 {str(s.teks || s.q)}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: TEAMBUZZER
// ═══════════════════════════════════════════════════════════════════
export function PreviewTeambuzzer({ mod, compact }: { mod: M; compact: boolean }) {
  const teams = arr<Record<string, unknown>>(mod.teams);
  if (!teams.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada tim.</div>;
  const max = compact ? 2 : 3;
  const colors = ['#f9c12e', '#3ecfcf', '#ff6b6b', '#a78bfa', '#34d399', '#fb923c'];

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {teams.slice(0, max).map((t, i) => {
        const color = str(t.color, colors[i % colors.length]);
        return (
          <div key={i} className="rounded-lg p-2 text-center" style={{ background: alpha(color, 0.07), border: `2px solid ${alpha(color, 0.20)}` }}>
            <div className="text-base">{str(t.icon, '🏆')}</div>
            <div className="text-[10px] font-black" style={{ color: T.text }}>{str(t.name, `Tim ${i + 1}`)}</div>
            <div className="text-sm font-black" style={{ color: color }}>{num(t.score, 0)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: WORDSEARCH
// ═══════════════════════════════════════════════════════════════════
export function PreviewWordsearch({ mod, compact }: { mod: M; compact: boolean }) {
  const kata = arr<Record<string, unknown>>(mod.kata);
  const max = compact ? 3 : 6;

  return (
    <div className="flex flex-wrap gap-1.5">
      {kata.slice(0, max).map((k, i) => (
        <span key={i} className="px-2 py-1 rounded text-[10px] font-bold" style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa' }}>{str(k.teks || k)}</span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: CROSSWORD (Teka-Teki Silang)
// ═══════════════════════════════════════════════════════════════════
export function PreviewCrossword({ mod, compact }: { mod: M; compact: boolean }) {
  const soal = arr<Record<string, unknown>>(mod.soal);
  if (!soal.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada soal TTS.</div>;
  const max = compact ? 2 : 4;

  return (
    <div className="space-y-1.5">
      {soal.slice(0, max).map((s, i) => (
        <div key={i} className="rounded-lg p-2 flex items-start gap-2" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{ background: alpha(T.p, 0.12), color: T.p }}>{str(s.arah, '→')}</span>
          <div>
            <div className="text-[10px] font-bold" style={{ color: T.text }}>{str(s.teks || s.pertanyaan)}</div>
            <div className="text-[9px]" style={{ color: T.muted }}>{str(s.jawaban).replace(/./g, '_ ')}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: FILLBLANK (Isi Titik-Titik)
// ═══════════════════════════════════════════════════════════════════
export function PreviewFillblank({ mod, compact }: { mod: M; compact: boolean }) {
  const soal = arr<Record<string, unknown>>(mod.soal);
  if (!soal.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada soal isian.</div>;
  const max = compact ? 2 : 3;

  return (
    <div className="space-y-1.5">
      {soal.slice(0, max).map((s, i) => (
        <div key={i} className="rounded-lg p-2.5" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <div className="text-xs font-bold mb-1.5" style={{ color: T.text }}>{i + 1}. {str(s.teks || s.pertanyaan)}</div>
          <div className="rounded px-2 py-1 text-[10px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', color: T.muted }}>
            Jawaban: _______________
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: DRAGDROP (Seret & Letakkan)
// ═══════════════════════════════════════════════════════════════════
export function PreviewDragdrop({ mod, compact }: { mod: M; compact: boolean }) {
  const pasangan = arr<Record<string, unknown>>(mod.pasangan);
  const items = arr<Record<string, unknown>>(mod.items);
  const data = pasangan.length ? pasangan : items;
  if (!data.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada item drag & drop.</div>;
  const max = compact ? 2 : 4;

  return (
    <div className="space-y-1.5">
      {data.slice(0, max).map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1 rounded-lg p-2 text-[10px] font-bold text-center" style={{ background: 'rgba(251,146,60,0.08)', border: '2px dashed rgba(251,146,60,0.3)', color: T.text }}>
            {str(d.teks || d.label || d.kiri)}
          </div>
          <span className="text-[10px]" style={{ color: T.muted }}>→</span>
          <div className="flex-1 rounded-lg p-2 text-[10px] text-center" style={{ background: 'rgba(251,146,60,0.06)', border: '2px solid rgba(251,146,60,0.15)', color: T.muted }}>
            {str(d.target || d.kanan || '...')}
          </div>
        </div>
      ))}
    </div>
  );
}
