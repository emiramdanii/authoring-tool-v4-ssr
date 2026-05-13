'use client';

import { useState } from 'react';
import type { CpState, TpItem, AlurItem, KuisItem, AtpState } from '@/store/authoring-store';
import type {
  PreviewData,
  FlashcardItem,
  MatchingPair,
  TrueFalseItem,
  SkenarioChapter,
} from './types';

// ═══════════════════════════════════════════════════════════════════
// Preview Renderer
// ═══════════════════════════════════════════════════════════════════

export function renderPreviewContent(preview: PreviewData) {
  switch (preview.type) {
    case 'cp':
      return <CpPreview data={preview.data as CpState} />;
    case 'tp':
      return <TpPreview data={preview.data as TpItem[]} />;
    case 'atp':
      return <AtpPreview data={preview.data as AtpState} />;
    case 'alur':
      return <AlurPreview data={preview.data as AlurItem[]} />;
    case 'kuis':
      return <KuisPreview data={preview.data as KuisItem[]} />;
    case 'flashcard':
      return <FlashcardPreview data={preview.data as FlashcardItem[]} />;
    case 'skenario':
      return <SkenarioPreview data={preview.data as SkenarioChapter[]} />;
    case 'matching':
      return <MatchingPreview data={preview.data as MatchingPair[]} />;
    case 'truefalse':
      return <TrueFalsePreview data={preview.data as TrueFalseItem[]} />;
    default:
      return <p className="text-sm text-app-secondary">Preview tidak tersedia</p>;
  }
}

// ── Individual Preview Components ─────────────────────────────────

function CpPreview({ data }: { data: CpState }) {
  return (
    <div className="space-y-3">
      <div className="bg-app-elevated/50 rounded-lg p-4 space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[0.65rem] text-app-muted uppercase tracking-wider">Elemen</p>
            <p className="text-sm text-app-primary">{data.elemen || '-'}</p>
          </div>
          <div>
            <p className="text-[0.65rem] text-app-muted uppercase tracking-wider">Sub Elemen</p>
            <p className="text-sm text-app-primary">{data.subElemen || '-'}</p>
          </div>
          <div>
            <p className="text-[0.65rem] text-app-muted uppercase tracking-wider">Fase</p>
            <p className="text-sm text-app-primary">Fase {data.fase}</p>
          </div>
          <div>
            <p className="text-[0.65rem] text-app-muted uppercase tracking-wider">Kelas</p>
            <p className="text-sm text-app-primary">{data.kelas || '-'}</p>
          </div>
        </div>
      </div>
      <div className="bg-app-elevated/50 rounded-lg p-4">
        <p className="text-[0.65rem] text-app-muted uppercase tracking-wider mb-2">Capaian Fase</p>
        <p className="text-sm text-app-primary leading-relaxed">{data.capaianFase}</p>
      </div>
      <div className="bg-app-elevated/50 rounded-lg p-4">
        <p className="text-[0.65rem] text-app-muted uppercase tracking-wider mb-2">Profil Pelajar Pancasila</p>
        <div className="flex flex-wrap gap-1.5">
          {data.profil.map((p, i) => (
            <span key={i} className="px-2.5 py-1 bg-app-accent/10 border border-app-accent/20 rounded-lg text-xs text-app-accent">
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TpPreview({ data }: { data: TpItem[] }) {
  return (
    <div className="space-y-2">
      {data.map((tp, i) => (
        <div key={i} className="bg-app-elevated/50 rounded-lg p-3 flex items-start gap-3">
          <span
            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
            style={{ backgroundColor: tp.color }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: tp.color + '20',
                  color: tp.color,
                }}
              >
                TP {i + 1}
              </span>
              <span className="text-xs text-app-secondary bg-app-elevated/50 px-1.5 py-0.5 rounded">
                Pertemuan {tp.pertemuan}
              </span>
            </div>
            <p className="text-sm text-app-primary mt-1">
              <span className="font-semibold text-app-accent">{tp.verb}</span>{' '}
              {tp.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AtpPreview({ data }: { data: AtpState }) {
  return (
    <div className="space-y-3">
      <div className="bg-app-elevated/50 rounded-lg p-3">
        <p className="text-xs text-app-muted">Nama Bab</p>
        <p className="text-sm font-medium text-app-primary">{data.namaBab || '-'}</p>
      </div>
      {data.pertemuan.map((p, i) => (
        <div key={i} className="bg-app-elevated/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded">
              Pertemuan {i + 1}
            </span>
            <span className="text-xs text-app-muted">{p.durasi}</span>
          </div>
          <p className="text-sm font-semibold text-app-primary">{p.judul}</p>
          <div className="space-y-1">
            <p className="text-[0.65rem] text-app-muted uppercase tracking-wider">Tujuan Pembelajaran</p>
            <p className="text-xs text-app-secondary">{p.tp}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[0.65rem] text-app-muted uppercase tracking-wider">Kegiatan</p>
            <p className="text-xs text-app-secondary">{p.kegiatan}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[0.65rem] text-app-muted uppercase tracking-wider">Penilaian</p>
            <p className="text-xs text-app-secondary">{p.penilaian}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AlurPreview({ data }: { data: AlurItem[] }) {
  const faseColors: Record<string, string> = {
    Pendahuluan: 'text-green-400',
    Inti: 'text-purple-400',
    Penutup: 'text-app-accent',
  };
  return (
    <div className="space-y-2">
      {data.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center mt-1">
            <div className={`w-3 h-3 rounded-full ${step.fase === 'Pendahuluan' ? 'bg-green-500' : step.fase === 'Inti' ? 'bg-purple-500' : 'bg-app-accent'}`} />
            {i < data.length - 1 && <div className="w-px h-full min-h-[40px] bg-app-elevated" />}
          </div>
          <div className="bg-app-elevated/50 rounded-lg p-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold ${faseColors[step.fase] || 'text-app-secondary'}`}>
                {step.fase}
              </span>
              <span className="text-xs text-app-muted">• {step.durasi}</span>
            </div>
            <p className="text-sm font-medium text-app-primary mt-1">{step.judul}</p>
            <p className="text-xs text-app-secondary mt-1 leading-relaxed">{step.deskripsi}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function KuisPreview({ data }: { data: KuisItem[] }) {
  return (
    <div className="space-y-4">
      {data.map((k, i) => (
        <div key={i} className="bg-app-elevated/50 rounded-lg p-4 space-y-2.5">
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded flex-shrink-0">
              {i + 1}
            </span>
            <p className="text-sm font-medium text-app-primary">{k.q}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-8">
            {k.opts.map((opt, oi) => (
              <div
                key={oi}
                className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                  oi === k.ans
                    ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                    : 'bg-app-elevated/30 text-app-secondary'
                }`}
              >
                <span className="font-mono text-[0.6rem]">{String.fromCharCode(65 + oi)}.</span>
                {opt}
                {oi === k.ans && <span className="ml-auto text-green-400">✓</span>}
              </div>
            ))}
          </div>
          {k.ex && (
            <p className="text-xs text-app-muted ml-8 italic">💡 {k.ex}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function FlashcardPreview({ data }: { data: FlashcardItem[] }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {data.slice(0, 12).map((card, i) => (
        <button
          key={i}
          onClick={() =>
            setFlipped((prev) => {
              const next = new Set(prev);
              if (next.has(i)) next.delete(i);
              else next.add(i);
              return next;
            })
          }
          className="bg-app-elevated/50 border border-app-border/50 rounded-lg p-4 text-left hover:border-app-border transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.6rem] text-app-muted uppercase tracking-wider">
              {flipped.has(i) ? 'Belakang' : 'Depan'}
            </span>
            <span className="text-[0.6rem] text-app-muted">{card.hint}</span>
          </div>
          <p className="text-sm text-app-primary">
            {flipped.has(i) ? card.belakang : card.depan}
          </p>
        </button>
      ))}
      {data.length > 12 && (
        <div className="text-xs text-app-muted col-span-full text-center py-2">
          +{data.length - 12} flashcard lainnya...
        </div>
      )}
    </div>
  );
}

function SkenarioPreview({ data }: { data: SkenarioChapter[] }) {
  return (
    <div className="space-y-4">
      {data.map((chapter, ci) => (
        <div key={ci} className="bg-app-elevated/50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-app-primary">{chapter.title}</h4>
          <p className="text-xs text-app-secondary leading-relaxed">{chapter.setup}</p>

          {/* Dialog */}
          <div className="space-y-1.5">
            <p className="text-[0.65rem] text-app-muted uppercase tracking-wider">Dialog</p>
            {chapter.dialog.map((d, di) => (
              <div key={di} className="flex items-start gap-2">
                <span className="text-xs font-semibold text-app-accent flex-shrink-0 min-w-[60px]">
                  {d.speaker}:
                </span>
                <p className="text-xs text-app-secondary">&ldquo;{d.text}&rdquo;</p>
              </div>
            ))}
          </div>

          {/* Choices */}
          <div className="space-y-1.5">
            <p className="text-[0.65rem] text-app-muted uppercase tracking-wider">Pilihan</p>
            {chapter.choices.map((c, chi) => (
              <div
                key={chi}
                className={`text-xs px-3 py-2 rounded-lg ${
                  c.correct
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-app-elevated/30'
                }`}
              >
                <p className={`font-medium ${c.correct ? 'text-green-300' : 'text-app-secondary'}`}>
                  {c.correct ? '✅ ' : '⬜ '}{c.text}
                </p>
                <p className="text-app-muted mt-0.5 italic">{c.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchingPreview({ data }: { data: MatchingPair[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-app-muted">
        {data.length} pasangan yang akan dicocokkan. Siswa mencocokkan kolom kiri dengan kolom kanan.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-[0.65rem] text-app-muted uppercase tracking-wider">Kolom Kiri</p>
          {data.map((p, i) => (
            <div key={i} className="bg-app-elevated/50 border border-app-accent/20 rounded-lg px-3 py-2 text-xs text-app-primary">
              {p.left}
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <p className="text-[0.65rem] text-app-muted uppercase tracking-wider">Kolom Kanan (Acak)</p>
          {[...data].sort(() => Math.random() - 0.5).map((p, i) => (
            <div key={i} className="bg-app-elevated/50 border border-cyan-500/20 rounded-lg px-3 py-2 text-xs text-app-primary">
              {p.right}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrueFalsePreview({ data }: { data: TrueFalseItem[] }) {
  return (
    <div className="space-y-2">
      {data.slice(0, 12).map((item, i) => (
        <div
          key={i}
          className={`bg-app-elevated/50 border rounded-lg p-3 flex items-start gap-3 ${
            item.answer
              ? 'border-green-500/20'
              : 'border-red-500/20'
          }`}
        >
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${
              item.answer
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {item.answer ? 'BENAR' : 'SALAH'}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-app-primary">{item.statement}</p>
            <p className="text-xs text-app-muted mt-1 italic">💡 {item.explanation}</p>
          </div>
        </div>
      ))}
      {data.length > 12 && (
        <div className="text-xs text-app-muted text-center py-2">
          +{data.length - 12} soal lainnya...
        </div>
      )}
    </div>
  );
}
