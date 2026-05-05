'use client';

import { useRef, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { CanvaPage, ColorPalette } from './types';
import { getPaletteColor } from '@/lib/color-palette';
import QuizWidget from './QuizWidget';
import GameWidget from './GameWidget';
import PresetModuleCard, { type LayoutVariant } from '@/components/shared/PresetModuleCard';
import { useInteractiveStore } from '@/store/interactive-store';

// ═══════════════════════════════════════════════════════════════
// PAGE TEMPLATE — Full-page template renderer with editable zones
// Each template type renders a complete page layout with
// content from the authoring store. Text zones are editable.
// ═══════════════════════════════════════════════════════════════

interface PageTemplateProps {
  page: CanvaPage;
  isSelected: boolean;
  onEditField: (key: string, value: string) => void;
}

interface SubTemplateProps {
  td: Record<string, unknown>;
  palette: ColorPalette | null;
  isSelected: boolean;
  onEditField: (key: string, value: string) => void;
}

export default function PageTemplate({ page, isSelected, onEditField }: PageTemplateProps) {
  const td = page.templateData;
  const palette = page.colorPalette;

  switch (page.templateType) {
    case 'cover':
      return <CoverTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} />;
    case 'dokumen':
      return <DokumenTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} />;
    case 'materi':
      return <MateriTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} />;
    case 'kuis':
      return <KuisTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} />;
    case 'game':
      return <GameTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} />;
    case 'hasil':
      return <HasilTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} />;
    case 'hero':
      return <HeroTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} />;
    case 'skenario':
      return <SkenarioTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} />;
    default:
      return null;
  }
}

// ── Editable Text Zone ────────────────────────────────────────

function EditableText({
  value,
  fieldKey,
  isSelected,
  onEdit,
  className = '',
  style = {},
  placeholder = 'Ketik di sini...',
}: {
  value: string;
  fieldKey: string;
  isSelected: boolean;
  onEdit: (key: string, value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleBlur = useCallback(() => {
    if (ref.current) {
      onEdit(fieldKey, ref.current.textContent || '');
    }
  }, [fieldKey, onEdit]);

  return (
    <div
      ref={ref}
      contentEditable={isSelected}
      suppressContentEditableWarning
      onBlur={handleBlur}
      className={`outline-none ${isSelected ? 'ring-1 ring-amber-400/40 ring-offset-2 ring-offset-transparent rounded' : ''} ${className}`}
      style={style}
    >
      {value || placeholder}
    </div>
  );
}

// ── Cover Template ────────────────────────────────────────────

function CoverTemplate({ td, palette, isSelected, onEditField }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f9c82e');
  const bg = getPaletteColor(palette, '--bg', '#0f172a');

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
      style={{ background: `linear-gradient(180deg, ${bg} 0%, ${bg}dd 100%)` }}>

      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${accent}, ${getPaletteColor(palette, '--c', '#3ecfcf')}, ${accent})` }} />

      {/* Icon */}
      <div className="text-5xl mb-4 animate-bounce"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.3))' }}>
        {String(td.icon || '📚')}
      </div>

      {/* Title */}
      <EditableText
        value={String(td.title || '')}
        fieldKey="title"
        isSelected={isSelected}
        onEdit={onEditField}
        className="font-black text-white leading-tight"
        style={{ fontSize: 'clamp(18px, 3.5%, 32px)', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}
        placeholder="Judul Pertemuan"
      />

      {/* Subtitle */}
      <EditableText
        value={String(td.subtitle || '')}
        fieldKey="subtitle"
        isSelected={isSelected}
        onEdit={onEditField}
        className="mt-2"
        style={{ fontSize: 'clamp(10px, 1.8%, 16px)', color: 'rgba(255,255,255,.7)' }}
        placeholder="Subjudul / Deskripsi"
      />

      {/* Badge */}
      {Boolean(td.mapel || td.kelas) && (
        <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
          style={{
            background: `${accent}20`,
            border: `1px solid ${accent}40`,
            color: accent,
          }}>
          {String(td.mapel || '')} {td.kelas ? `• Kelas ${td.kelas}` : ''}
        </div>
      )}

      {/* Decorative bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
        {[accent, getPaletteColor(palette, '--c', '#3ecfcf'), getPaletteColor(palette, '--g', '#34d399')].map((c, i) => (
          <div key={i} className="w-8 h-1 rounded-full" style={{ background: c, opacity: 0.6 }} />
        ))}
      </div>
    </div>
  );
}

// ── Dokumen Template (CP/TP/ATP) ─────────────────────────────

function DokumenTemplate({ td, palette, isSelected, onEditField }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f9c82e');
  const accent2 = getPaletteColor(palette, '--c', '#3ecfcf');
  const cp = td.cp as Record<string, unknown> | undefined;
  const tpItems = (td.tp as Array<Record<string, unknown>>) || [];
  const atp = td.atp as Record<string, unknown> | undefined;

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${accent}20` }}>📋</div>
        <div>
          <div className="font-black text-white text-sm">Dokumen Kurikulum</div>
          <div className="text-[9px] text-white/40">Capaian Pembelajaran • Tujuan Pembelajaran</div>
        </div>
      </div>

      {/* CP Section */}
      {cp && (
        <div className="mb-3 p-3 rounded-lg" style={{ background: `${accent}10`, border: `1px solid ${accent}25` }}>
          <div className="text-[10px] font-bold mb-1" style={{ color: accent }}>Capaian Pembelajaran</div>
          <div className="text-[9px] text-white/80 leading-relaxed line-clamp-4">
            {String(cp.capaianFase || 'Belum diisi')}
          </div>
          {Array.isArray(cp.profil) && (cp.profil as string[]).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(cp.profil as string[]).slice(0, 4).map((p, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded text-[7px] font-bold"
                  style={{ background: `${accent}15`, color: accent }}>
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TP Items */}
      {tpItems.length > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="text-[10px] font-bold mb-1.5" style={{ color: accent2 }}>Tujuan Pembelajaran</div>
          <div className="space-y-1">
            {tpItems.map((tp, i) => (
              <div key={i} className="flex items-start gap-1.5 px-2 py-1 rounded-md bg-white/5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black flex-shrink-0 mt-0.5"
                  style={{ background: String(tp.color || accent2) + '30', color: String(tp.color || accent2) }}>
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <span className="text-[8px] font-bold" style={{ color: String(tp.color || accent2) }}>
                    {String(tp.verb || '')}
                  </span>
                  <span className="text-[8px] text-white/70 ml-0.5">{String(tp.desc || '').slice(0, 80)}...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!cp?.capaianFase && tpItems.length === 0) && (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">📋</span>
          <span className="text-[10px]">Isi data CP & TP di panel Dokumen</span>
        </div>
      )}
    </div>
  );
}

// ── Materi Template ───────────────────────────────────────────

function MateriTemplate({ td, palette, isSelected, onEditField }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#a78bfa');
  const accent2 = getPaletteColor(palette, '--c', '#3ecfcf');
  const blok = (td.blok as Array<Record<string, unknown>>) || [];
  const modules = (td.modules as Array<Record<string, unknown>>) || [];

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${accent}20` }}>📝</div>
        <div>
          <EditableText
            value="Materi Pembelajaran"
            fieldKey="materiTitle"
            isSelected={isSelected}
            onEdit={onEditField}
            className="font-black text-white text-sm"
            placeholder="Judul Materi"
          />
          <div className="text-[9px] text-white/40">{blok.length} blok • {modules.length} modul</div>
        </div>
      </div>

      {/* Materi Blocks */}
      {blok.length > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {blok.map((b, i) => (
            <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10">
              {Boolean(b.judul) && <div className="text-[10px] font-bold text-white mb-0.5">{String(b.judul)}</div>}
              {Boolean(b.isi) && <div className="text-[8px] text-white/70 leading-relaxed line-clamp-3">{String(b.isi)}</div>}
              {Boolean(b.icon) && <span className="text-sm mr-1">{String(b.icon)}</span>}
              {Array.isArray(b.butir) && (
                <div className="space-y-0.5 mt-1">
                  {(b.butir as string[]).slice(0, 4).map((item, j) => (
                    <div key={j} className="text-[8px] text-white/60 flex items-start gap-1">
                      <span className="text-[7px] mt-0.5">•</span>
                      <span className="line-clamp-1">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Module Cards — using PresetModuleCard in canvas mode */}
      {modules.length > 0 && (
        <div className="mt-2 space-y-1">
          {modules.slice(0, 3).map((m, i) => (
            <PresetModuleCard
              key={i}
              mode="canvas"
              module={m as Parameters<typeof PresetModuleCard>[0]['module']}
              layoutVariant={(m.layoutVariant as LayoutVariant) || 'A'}
              compact
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {blok.length === 0 && modules.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">📝</span>
          <span className="text-[10px]">Tambah materi di panel Konten → Materi</span>
        </div>
      )}
    </div>
  );
}

// ── Kuis Template ─────────────────────────────────────────────

function KuisTemplate({ td, palette, isSelected, onEditField }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f5c842');
  const kuisData = (td.kuis as Array<Record<string, unknown>>) || [];

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2"
        style={{ background: `linear-gradient(90deg, ${accent}15, transparent)` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${accent}20` }}>❓</div>
        <div>
          <EditableText
            value="Kuis Interaktif"
            fieldKey="kuisTitle"
            isSelected={isSelected}
            onEdit={onEditField}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Kuis"
          />
          <div className="text-[9px] text-white/40">{kuisData.length} soal</div>
        </div>
        <div className="ml-auto px-2 py-1 rounded-lg text-[9px] font-bold"
          style={{ background: `${accent}15`, color: accent }}>
          ⭐ 0
        </div>
      </div>

      {/* Quiz Widget */}
      <div className="flex-1 min-h-0 px-3 pb-3">
        {kuisData.length > 0 ? (
          <QuizWidget compact />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/30">
            <span className="text-3xl mb-2">❓</span>
            <span className="text-[10px]">Tambah soal di panel Konten → Evaluasi</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Game Template ─────────────────────────────────────────────

function GameTemplate({ td, palette, isSelected, onEditField }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--c', '#3ecfcf');
  const games = (td.games as Array<Record<string, unknown>>) || [];

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2"
        style={{ background: `linear-gradient(90deg, ${accent}15, transparent)` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${accent}20` }}>🎮</div>
        <div>
          <EditableText
            value="Game Interaktif"
            fieldKey="gameTitle"
            isSelected={isSelected}
            onEdit={onEditField}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Game"
          />
          <div className="text-[9px] text-white/40">{games.length} game tersedia</div>
        </div>
        <div className="ml-auto px-2 py-1 rounded-lg text-[9px] font-bold"
          style={{ background: `${accent}15`, color: accent }}>
          🏆 0
        </div>
      </div>

      {/* Game selection or widget */}
      <div className="flex-1 min-h-0 px-3 pb-3">
        {games.length > 0 ? (
          <div className="space-y-2">
            {/* Show first game as main widget */}
            <GameWidget dataIdx={getGameModuleIndex(games[0])} compact />

            {/* Show other games as selectable cards */}
            {games.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {games.map((g, i) => (
                  <button key={i}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-colors"
                    style={{
                      background: i === 0 ? `${accent}15` : 'rgba(255,255,255,.05)',
                      border: `1px solid ${i === 0 ? accent + '30' : 'rgba(255,255,255,.1)'}`,
                    }}>
                    <span className="text-sm">{getGameIcon(String(g.type))}</span>
                    <span className="text-[8px] font-bold text-white truncate max-w-[60px]">
                      {String(g.title || g.type)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/30">
            <span className="text-3xl mb-2">🎮</span>
            <span className="text-[10px]">Tambah game di panel Konten → Modul</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Hasil Template ────────────────────────────────────────────

function HasilTemplate({ td, palette, isSelected, onEditField }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--g', '#34d399');
  const totalKuis = (td.totalKuis as number) || 0;
  const namaBab = String(td.namaBab || '');

  // Live score from interactive store
  const mode = useInteractiveStore((s) => s.mode);
  const totalPct = useInteractiveStore((s) => s.totalPct);
  const totalScore = useInteractiveStore((s) => s.totalScore);
  const totalMax = useInteractiveStore((s) => s.totalMax);

  const pct = mode === 'interactive' ? totalPct() : 0;
  const level = pct >= 85 ? 'Sangat Baik' : pct >= 70 ? 'Baik' : pct > 0 ? 'Perlu Latihan' : '';
  const levelColor = pct >= 85 ? '#34d399' : pct >= 70 ? '#f9c82e' : '#f87171';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
      {/* Trophy */}
      <div className="text-5xl mb-4" style={{ filter: 'drop-shadow(0 4px 16px rgba(52,211,153,.3))' }}>🏆</div>

      {/* Title */}
      <EditableText
        value="Hasil Belajar"
        fieldKey="hasilTitle"
        isSelected={isSelected}
        onEdit={onEditField}
        className="font-black mb-2"
        style={{ fontSize: 'clamp(16px, 3%, 28px)', color: accent }}
        placeholder="Judul Hasil"
      />

      {/* Score Circle — live in interactive mode */}
      <div className="relative w-24 h-24 rounded-full flex items-center justify-center mb-4"
        style={{
          background: `conic-gradient(${levelColor || accent} ${pct}%, ${accent}20 ${pct}%)`,
          boxShadow: `0 0 40px ${accent}30`,
          transition: 'background 1s ease-out',
        }}>
        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center">
          <span className="text-2xl font-black" style={{ color: pct > 0 ? levelColor : accent }}>{pct}%</span>
        </div>
      </div>

      {/* Level */}
      {level && (
        <div className="text-sm font-bold mb-2" style={{ color: levelColor }}>{level}</div>
      )}

      {/* Info */}
      {totalKuis > 0 && (
        <div className="text-[10px] text-white/50 mb-3">
          {mode === 'interactive' ? `${totalScore()}/${totalMax()} poin` : `${totalKuis} soal kuis tersedia`}
        </div>
      )}

      {/* Appreciation levels */}
      <div className="flex gap-3 mt-2">
        {[
          { label: 'Sangat Baik', pct: 85, color: '#34d399' },
          { label: 'Baik', pct: 70, color: '#f9c82e' },
          { label: 'Perlu Latihan', pct: 0, color: '#f87171' },
        ].map((level) => (
          <div key={level.label} className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full mb-0.5" style={{ background: level.color + '40', border: `1px solid ${level.color}` }} />
            <span className="text-[7px] text-white/40">{level.label}</span>
          </div>
        ))}
      </div>

      {/* Bab name */}
      {namaBab && (
        <div className="absolute bottom-4 text-[9px] text-white/30">{namaBab}</div>
      )}
    </div>
  );
}

// ── Hero Template ─────────────────────────────────────────────

function HeroTemplate({ td, palette, isSelected, onEditField }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f9c82e');

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
      style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b, #0f172a)' }}>

      {/* Icon */}
      <div className="text-4xl mb-3">{String(td.icon || '🚀')}</div>

      {/* Title */}
      <EditableText
        value={String(td.title || '')}
        fieldKey="title"
        isSelected={isSelected}
        onEdit={onEditField}
        className="font-black text-white leading-tight"
        style={{ fontSize: 'clamp(16px, 3%, 28px)', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}
        placeholder="Hero Title"
      />

      {/* Subtitle */}
      <EditableText
        value={String(td.subtitle || '')}
        fieldKey="subtitle"
        isSelected={isSelected}
        onEdit={onEditField}
        className="mt-2"
        style={{ fontSize: 'clamp(10px, 1.6%, 14px)', color: 'rgba(255,255,255,.6)' }}
        placeholder="Subjudul"
      />

      {/* CTA Button */}
      {Boolean(td.cta) && (
        <div className="mt-5 px-5 py-2 rounded-xl font-bold text-sm"
          style={{ background: accent, color: '#000' }}>
          {String(td.cta)}
        </div>
      )}

      {/* Chips */}
      {Boolean(td.chips) && (
        <div className="flex gap-2 mt-3">
          {String(td.chips).split(',').map((chip, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[8px] font-bold"
              style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
              {chip.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Skenario Template ─────────────────────────────────────────

function SkenarioTemplate({ td, palette, isSelected, onEditField }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--r', '#f472b6');
  const skenario = (td.skenario as Array<Record<string, unknown>>) || [];

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${accent}20` }}>🎭</div>
        <div>
          <EditableText
            value="Skenario Interaktif"
            fieldKey="skenarioTitle"
            isSelected={isSelected}
            onEdit={onEditField}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Skenario"
          />
          <div className="text-[9px] text-white/40">{skenario.length} babak</div>
        </div>
      </div>

      {/* Chapter cards */}
      {skenario.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {skenario.map((ch, i) => (
            <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{String(ch.charEmoji || '🧑')}</span>
                <span className="text-[10px] font-bold text-white">Babak {i + 1}</span>
                {Boolean(ch.title) && <span className="text-[8px] text-white/40 truncate">{String(ch.title)}</span>}
              </div>
              {Boolean(ch.choicePrompt) && (
                <div className="text-[8px] text-white/50 italic">{String(ch.choicePrompt)}</div>
              )}
              {Array.isArray(ch.choices) && (
                <div className="flex gap-1 mt-1">
                  {(ch.choices as Array<Record<string, unknown>>).map((c, j) => (
                    <div key={j} className="px-1.5 py-0.5 rounded text-[7px]"
                      style={{
                        background: c.good ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)',
                        color: c.good ? '#34d399' : '#f87171',
                      }}>
                      {String(c.icon || '🤔')} {String(c.label || `Pilihan ${j + 1}`)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">🎭</span>
          <span className="text-[10px]">Tambah skenario di panel Konten → Skenario</span>
        </div>
      )}
    </div>
  );
}

// ── Utility helpers ───────────────────────────────────────────

function getModuleIcon(type: string): string {
  const icons: Record<string, string> = {
    materi: '📝', video: '🎬', infografis: '📊', flashcard: '🃏',
    'studi-kasus': '🔬', debat: '⚖️', timeline: '📅', matching: '🔀',
    hero: '🚀', kutipan: '💬', langkah: '📌', accordion: '📂',
    statistik: '📈', polling: '🗳️', embed: '🌐', 'tab-icons': '📑',
    'icon-explore': '🔍', comparison: '⚖️', 'card-showcase': '🎴',
    'hotspot-image': '📍', truefalse: '✅❌', memory: '🧠',
    roda: '🎡', sorting: '🔢', spinwheel: '🎡',
    teambuzzer: '🏆', wordsearch: '🔍', skenario: '🎭',
  };
  return icons[type] || '🧩';
}

function getGameIcon(type: string): string {
  const icons: Record<string, string> = {
    truefalse: '✅', memory: '🧠', matching: '🔀', roda: '🎡',
    sorting: '🔢', spinwheel: '🎡', teambuzzer: '🏆',
    wordsearch: '🔍', flashcard: '🃏',
  };
  return icons[type] || '🎮';
}

function getGameModuleIndex(game: Record<string, unknown>): number {
  const modules = useAuthoringStore.getState().modules;
  // Use property-based comparison instead of reference equality
  // since localStorage reload breaks object identity
  const idx = modules.findIndex(m =>
    m.type === game.type &&
    m.title === game.title &&
    (m as Record<string, unknown>).teks === game.teks
  );
  return idx >= 0 ? idx : -1;
}
