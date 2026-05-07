'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { CanvaPage, ColorPalette } from './types';
import { getPaletteColor } from '@/lib/color-palette';
import QuizWidget from './QuizWidget';
import GameWidget from './GameWidget';
import PresetModuleCard, { type LayoutVariant } from '@/components/shared/PresetModuleCard';
import { useInteractiveStore } from '@/store/interactive-store';
import { getModuleIcon as _getModuleIcon, getGameIcon as _getGameIcon } from '@/lib/canva-icon-maps';

// ═══════════════════════════════════════════════════════════════
// PAGE TEMPLATE — Full-page template renderer with editable zones
// Each template type renders a complete page layout with
// content from the authoring store. Text zones are editable.
// ═══════════════════════════════════════════════════════════════

interface PageTemplateProps {
  page: CanvaPage;
  isSelected: boolean;
  onEditField: (key: string, value: string) => void;
  interactive?: boolean; // When true, widgets are playable with score tracking
}

interface SubTemplateProps {
  td: Record<string, unknown>;
  palette: ColorPalette | null;
  isSelected: boolean;
  onEditField: (key: string, value: string) => void;
  interactive?: boolean;
  variant?: 'A' | 'B' | 'C'; // Phase 3: Template layout variant
}

export default function PageTemplate({ page, isSelected, onEditField, interactive }: PageTemplateProps) {
  const td = page.templateData;
  const palette = page.colorPalette;
  const variant = page.templateVariant || 'A'; // Phase 3: Default to variant A

  switch (page.templateType) {
    case 'cover':
      return <CoverTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} variant={variant} />;
    case 'dokumen':
      return <DokumenTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} />;
    case 'materi':
      return <MateriTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} variant={variant} />;
    case 'kuis':
      return <KuisTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} />;
    case 'game':
      return <GameTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} />;
    case 'hasil':
      return <HasilTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} />;
    case 'hero':
      return <HeroTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} />;
    case 'skenario':
      return <SkenarioTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} />;
    case 'petunjuk':
      return <PetunjukTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} />;
    case 'diskusi':
      return <DiskusiTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} />;
    case 'refleksi':
      return <RefleksiTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} />;
    case 'penutup':
      return <PenutupTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} />;
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
// Phase 3: 3 variants — A (centered), B (left-aligned), C (split icon+text)

function CoverTemplate({ td, palette, isSelected, onEditField, variant = 'A' }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f9c82e');
  const bg = getPaletteColor(palette, '--bg', '#0f172a');
  const cyan = getPaletteColor(palette, '--c', '#3ecfcf');
  const green = getPaletteColor(palette, '--g', '#34d399');

  // ── Variant A: Centered (original) ──
  if (variant === 'A') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
        style={{ background: `linear-gradient(180deg, ${bg} 0%, ${bg}dd 100%)` }}>

        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: `linear-gradient(90deg, ${accent}, ${cyan}, ${accent})` }} />

        {/* Icon */}
        <div className="text-5xl mb-4"
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
          {[accent, cyan, green].map((c, i) => (
            <div key={i} className="w-8 h-1 rounded-full" style={{ background: c, opacity: 0.6 }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Variant B: Left-aligned ──
  if (variant === 'B') {
    return (
      <div className="absolute inset-0 flex flex-col justify-center p-8 pl-12"
        style={{ background: `linear-gradient(135deg, ${bg} 0%, ${bg}cc 100%)` }}>

        {/* Decorative left bar */}
        <div className="absolute top-0 left-0 bottom-0 w-1.5"
          style={{ background: `linear-gradient(180deg, ${accent}, ${cyan}, ${green})` }} />

        {/* Badge at top */}
        {Boolean(td.mapel || td.kelas) && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold w-fit"
            style={{
              background: `${accent}20`,
              border: `1px solid ${accent}40`,
              color: accent,
            }}>
            {String(td.mapel || '')} {td.kelas ? `• Kelas ${td.kelas}` : ''}
          </div>
        )}

        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-2">
          <div className="text-4xl" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.3))' }}>
            {String(td.icon || '📚')}
          </div>
          <EditableText
            value={String(td.title || '')}
            fieldKey="title"
            isSelected={isSelected}
            onEdit={onEditField}
            className="font-black text-white leading-tight"
            style={{ fontSize: 'clamp(16px, 3.2%, 30px)', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}
            placeholder="Judul Pertemuan"
          />
        </div>

        {/* Subtitle */}
        <EditableText
          value={String(td.subtitle || '')}
          fieldKey="subtitle"
          isSelected={isSelected}
          onEdit={onEditField}
          className="mt-1"
          style={{ fontSize: 'clamp(10px, 1.6%, 14px)', color: 'rgba(255,255,255,.6)' }}
          placeholder="Subjudul / Deskripsi"
        />

        {/* Decorative accent dots bottom right */}
        <div className="absolute bottom-4 right-6 flex gap-1.5">
          {[accent, cyan, green].map((c, i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ background: c, opacity: 0.5 }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Variant C: Split layout (icon left, text right) ──
  return (
    <div className="absolute inset-0 flex"
      style={{ background: bg }}>

      {/* Left panel: Icon + gradient background */}
      <div className="w-2/5 flex flex-col items-center justify-center relative"
        style={{ background: `linear-gradient(135deg, ${accent}15, ${cyan}10)` }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${bg}80, ${bg}40)` }} />
        <div className="relative text-6xl mb-4" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.4))' }}>
          {String(td.icon || '📚')}
        </div>
        {/* Badge */}
        {Boolean(td.mapel || td.kelas) && (
          <div className="relative px-3 py-1 rounded-full text-[9px] font-bold"
            style={{ background: `${accent}30`, border: `1px solid ${accent}50`, color: accent }}>
            {String(td.mapel || '')} {td.kelas ? `• Kelas ${td.kelas}` : ''}
          </div>
        )}
        {/* Decorative dots */}
        <div className="absolute bottom-4 flex gap-1">
          {[accent, cyan, green].map((c, i) => (
            <div key={i} className="w-6 h-1 rounded-full" style={{ background: c, opacity: 0.4 }} />
          ))}
        </div>
      </div>

      {/* Right panel: Text content */}
      <div className="w-3/5 flex flex-col justify-center p-8">
        <EditableText
          value={String(td.title || '')}
          fieldKey="title"
          isSelected={isSelected}
          onEdit={onEditField}
          className="font-black text-white leading-tight mb-3"
          style={{ fontSize: 'clamp(20px, 4%, 36px)', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}
          placeholder="Judul Pertemuan"
        />

        <EditableText
          value={String(td.subtitle || '')}
          fieldKey="subtitle"
          isSelected={isSelected}
          onEdit={onEditField}
          className=""
          style={{ fontSize: 'clamp(11px, 2%, 18px)', color: 'rgba(255,255,255,.65)', lineHeight: 1.5 }}
          placeholder="Subjudul / Deskripsi"
        />

        {/* Divider accent */}
        <div className="mt-4 w-16 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${accent}, ${cyan})` }} />
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
// Phase 3: 2 variants — A (vertical list), B (2-column grid)

function MateriTemplate({ td, palette, isSelected, onEditField, variant = 'A' }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#a78bfa');
  const accent2 = getPaletteColor(palette, '--c', '#3ecfcf');
  const blok = (td.blok as Array<Record<string, unknown>>) || [];
  const modules = (td.modules as Array<Record<string, unknown>>) || [];

  // ── Variant A: Vertical list (original) ──
  if (variant === 'A') {
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

        {/* Module Cards */}
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

  // ── Variant B: 2-column grid layout ──
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

      {/* 2-column grid */}
      {blok.length > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {blok.map((b, i) => (
              <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10">
                {Boolean(b.icon) && <span className="text-lg">{String(b.icon)}</span>}
                {Boolean(b.judul) && <div className="text-[9px] font-bold text-white mb-0.5">{String(b.judul)}</div>}
                {Boolean(b.isi) && <div className="text-[7px] text-white/70 leading-relaxed line-clamp-4">{String(b.isi)}</div>}
                {Array.isArray(b.butir) && (
                  <div className="space-y-0.5 mt-1">
                    {(b.butir as string[]).slice(0, 3).map((item, j) => (
                      <div key={j} className="text-[7px] text-white/60 flex items-start gap-0.5">
                        <span className="text-[6px] mt-0.5">•</span>
                        <span className="line-clamp-1">{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Cards — horizontal scroll in variant B */}
      {modules.length > 0 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {modules.slice(0, 4).map((m, i) => (
            <div key={i} className="flex-shrink-0 w-40">
              <PresetModuleCard
                mode="canvas"
                module={m as Parameters<typeof PresetModuleCard>[0]['module']}
                layoutVariant={(m.layoutVariant as LayoutVariant) || 'A'}
                compact
              />
            </div>
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

function KuisTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f5c842');
  const kuisData = (td.kuis as Array<Record<string, unknown>>) || [];
  const reportScore = useInteractiveStore((s) => s.reportScore);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);

  const handleComplete = useCallback((score: number, maxScore: number) => {
    reportScore({ elementId: 'kuis-template', pageIndex: interactivePageIdx, score, maxScore, completed: true });
  }, [reportScore, interactivePageIdx]);

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
      </div>

      {/* Quiz Widget — full-size in interactive mode */}
      <div className="flex-1 min-h-0 px-3 pb-3">
        {kuisData.length > 0 ? (
          <QuizWidget compact={!interactive} onComplete={interactive ? handleComplete : undefined} />
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

function GameTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--c', '#3ecfcf');
  const games = (td.games as Array<Record<string, unknown>>) || [];
  const reportScore = useInteractiveStore((s) => s.reportScore);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);

  // Phase 4: Game selector — track which game is displayed as main widget
  const [activeGameIdx, setActiveGameIdx] = useState(() => {
    const stored = td.activeGameIdx as number | undefined;
    return (stored != null && stored >= 0 && stored < games.length) ? stored : 0;
  });

  // Sync with templateData if it changes externally
  useEffect(() => {
    const stored = td.activeGameIdx as number | undefined;
    if (stored != null && stored >= 0 && stored < games.length && stored !== activeGameIdx) {
      setActiveGameIdx(stored);
    }
  }, [td.activeGameIdx, games.length]);

  const handleComplete = useCallback((score: number, maxScore: number) => {
    reportScore({ elementId: 'game-template', pageIndex: interactivePageIdx, score, maxScore, completed: true });
  }, [reportScore, interactivePageIdx]);

  const handleSelectGame = useCallback((idx: number) => {
    setActiveGameIdx(idx);
    // Persist to templateData
    onEditField('activeGameIdx', String(idx));
  }, [onEditField]);

  // Ensure activeGameIdx is valid
  const safeIdx = activeGameIdx < games.length ? activeGameIdx : 0;
  const activeGame = games[safeIdx];

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
          <div className="text-[9px] text-white/40">{games.length} game tersedia{games.length > 1 ? ' • klik untuk ganti' : ''}</div>
        </div>
      </div>

      {/* Game selection or widget — full-size in interactive mode */}
      <div className="flex-1 min-h-0 px-3 pb-3">
        {games.length > 0 ? (
          <div className="space-y-2">
            {/* Show selected game as main widget */}
            {activeGame && (
              <GameWidget dataIdx={getGameModuleIndex(activeGame)} moduleId={(activeGame._id as string) || undefined} compact={!interactive} onComplete={interactive ? handleComplete : undefined} />
            )}

            {/* Game selector tabs — always visible when multiple games */}
            {games.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {games.map((g, i) => (
                  <button key={i}
                    onClick={() => handleSelectGame(i)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-left transition-all hover:scale-105"
                    style={{
                      background: i === safeIdx ? `${accent}20` : 'rgba(255,255,255,.05)',
                      border: `1px solid ${i === safeIdx ? accent + '50' : 'rgba(255,255,255,.1)'}`,
                      boxShadow: i === safeIdx ? `0 0 12px ${accent}20` : 'none',
                    }}>
                    <span className="text-sm">{getGameIcon(String(g.type))}</span>
                    <span className={`text-[8px] font-bold truncate max-w-[60px] ${i === safeIdx ? 'text-white' : 'text-white/50'}`}>
                      {String(g.title || g.type)}
                    </span>
                    {i === safeIdx && (
                      <span className="text-[7px] text-cyan-400 font-bold">●</span>
                    )}
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

function HasilTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--g', '#34d399');
  const totalKuis = (td.totalKuis as number) || 0;
  const namaBab = String(td.namaBab || '');

  // Live score from interactive store
  const totalPct = useInteractiveStore((s) => s.totalPct);
  const totalScore = useInteractiveStore((s) => s.totalScore);
  const totalMax = useInteractiveStore((s) => s.totalMax);

  const pct = interactive ? totalPct() : 0;
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
          {interactive ? `${totalScore()}/${totalMax()} poin` : `${totalKuis} soal kuis tersedia`}
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
// Phase 4: Interactive choices — clickable in play mode with branching navigation

function SkenarioTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--r', '#f472b6');
  const green = getPaletteColor(palette, '--g', '#34d399');
  const red = getPaletteColor(palette, '--r', '#f87171');
  const skenario = (td.skenario as Array<Record<string, unknown>>) || [];
  const reportScore = useInteractiveStore((s) => s.reportScore);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);

  // Phase 4: Track current chapter and choice history for interactive mode
  const [currentChapter, setCurrentChapter] = useState(0);
  const [choiceHistory, setChoiceHistory] = useState<Array<{ chapter: number; choiceIdx: number; good: boolean }>>([]);
  const [showFeedback, setShowFeedback] = useState<{ good: boolean; message: string } | null>(null);

  // Reset state when not in interactive mode
  useEffect(() => {
    if (!interactive) {
      setCurrentChapter(0);
      setChoiceHistory([]);
      setShowFeedback(null);
    }
  }, [interactive]);

  const handleChoice = useCallback((chapterIdx: number, choiceIdx: number, choice: Record<string, unknown>) => {
    const isGood = Boolean(choice.good);
    const nextChapter = choice.nextChapter != null ? Number(choice.nextChapter) : chapterIdx + 1;

    setChoiceHistory(prev => [...prev, { chapter: chapterIdx, choiceIdx, good: isGood }]);

    // Show brief feedback
    setShowFeedback({
      good: isGood,
      message: isGood
        ? String(choice.feedbackGood || 'Pilihan tepat!')
        : String(choice.feedbackBad || 'Coba lagi!'),
    });

    // Auto-advance after feedback
    setTimeout(() => {
      setShowFeedback(null);
      if (nextChapter < skenario.length && nextChapter >= 0) {
        setCurrentChapter(nextChapter);
      } else if (nextChapter >= skenario.length) {
        // Completed all chapters — report score
        const goodCount = [...choiceHistory, { chapter: chapterIdx, choiceIdx, good: isGood }].filter(c => c.good).length;
        const totalChoices = [...choiceHistory, { chapter: chapterIdx, choiceIdx, good: isGood }].length;
        reportScore({
          elementId: 'skenario-template',
          pageIndex: interactivePageIdx,
          score: goodCount,
          maxScore: totalChoices,
          completed: true,
        });
      }
    }, 1500);
  }, [choiceHistory, skenario.length, reportScore, interactivePageIdx]);

  const currentCh = skenario[currentChapter];
  const totalGoodChoices = choiceHistory.filter(c => c.good).length;

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
          <div className="text-[9px] text-white/40">
            {interactive
              ? `Babak ${currentChapter + 1}/${skenario.length} • ${totalGoodChoices} benar`
              : `${skenario.length} babak`
            }
          </div>
        </div>
      </div>

      {/* ── Interactive Mode: Show current chapter with clickable choices ── */}
      {interactive && skenario.length > 0 && currentCh ? (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Current chapter card */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{String(currentCh.charEmoji || '🧑')}</span>
              <div>
                <div className="text-[11px] font-bold text-white">
                  {currentCh.title ? String(currentCh.title) : `Babak ${currentChapter + 1}`}
                </div>
                {Boolean(currentCh.choicePrompt) && (
                  <div className="text-[10px] text-white/60 italic mt-0.5">
                    {String(currentCh.choicePrompt)}
                  </div>
                )}
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1 mb-2">
              {skenario.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i < currentChapter
                      ? 'w-4 bg-emerald-500'
                      : i === currentChapter
                        ? 'w-6 bg-pink-400'
                        : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Choice buttons */}
            {Array.isArray(currentCh.choices) && !showFeedback && (
              <div className="space-y-2">
                {(currentCh.choices as Array<Record<string, unknown>>).map((c, j) => (
                  <button
                    key={j}
                    onClick={() => handleChoice(currentChapter, j, c)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'rgba(255,255,255,.05)',
                      border: '1px solid rgba(255,255,255,.15)',
                    }}
                  >
                    <span className="text-lg">{String(c.icon || '🤔')}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-white truncate">
                        {String(c.label || `Pilihan ${j + 1}`)}
                      </div>
                      {Boolean(c.desc) && (
                        <div className="text-[8px] text-white/40 truncate">
                          {String(c.desc)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Feedback overlay */}
            {showFeedback && (
              <div className={`p-3 rounded-lg text-center transition-all ${
                showFeedback.good
                  ? 'bg-emerald-500/20 border border-emerald-500/30'
                  : 'bg-red-500/20 border border-red-500/30'
              }`}>
                <div className="text-xl mb-1">{showFeedback.good ? '✅' : '❌'}</div>
                <div className={`text-xs font-bold ${showFeedback.good ? 'text-emerald-300' : 'text-red-300'}`}>
                  {showFeedback.message}
                </div>
              </div>
            )}
          </div>

          {/* Choice history summary */}
          {choiceHistory.length > 0 && (
            <div className="space-y-1 overflow-y-auto flex-1 min-h-0">
              <div className="text-[8px] text-white/30 font-bold mb-1">Riwayat Pilihan</div>
              {choiceHistory.map((h, i) => {
                const ch = skenario[h.chapter];
                const choice = Array.isArray(ch?.choices)
                  ? (ch.choices as Array<Record<string, unknown>>)[h.choiceIdx]
                  : null;
                return (
                  <div key={i} className="flex items-center gap-1.5 text-[8px]">
                    <span className={h.good ? 'text-emerald-400' : 'text-red-400'}>
                      {h.good ? '✓' : '✗'}
                    </span>
                    <span className="text-white/50">Babak {h.chapter + 1}:</span>
                    <span className="text-white/70 truncate">
                      {choice ? String(choice.label || `Pilihan ${h.choiceIdx + 1}`) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : !interactive && skenario.length > 0 ? (
        /* ── Design Mode: Show all chapters as preview cards ── */
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {skenario.map((ch, i) => (
            <div key={i} className={`p-2 rounded-lg border ${
              i === currentChapter && interactive
                ? 'bg-pink-500/10 border-pink-500/30'
                : 'bg-white/5 border-white/10'
            }`}>
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
        /* ── Empty state ── */
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">🎭</span>
          <span className="text-[10px]">Tambah skenario di panel Konten → Skenario</span>
        </div>
      )}
    </div>
  );
}

// ── Petunjuk Template ─────────────────────────────────────────

function PetunjukTemplate({ td, palette, isSelected, onEditField }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f9c82e');
  const langkah = (td.langkah as Array<Record<string, unknown>>) || [];
  const tips = String(td.tips || '');

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${accent}20` }}>📋</div>
        <div>
          <EditableText
            value={String(td.title || 'Petunjuk Penggunaan')}
            fieldKey="title"
            isSelected={isSelected}
            onEdit={onEditField}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Petunjuk"
          />
          <div className="text-[9px] text-white/40">{langkah.length} langkah</div>
        </div>
      </div>

      {/* Intro */}
      {Boolean(td.intro) && (
        <div className="text-[9px] text-white/70 leading-relaxed mb-3">{String(td.intro)}</div>
      )}

      {/* Steps */}
      {langkah.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {langkah.map((l, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0 mt-0.5"
                style={{ background: `${accent}30`, color: accent }}>
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-sm">{String(l.icon || '📌')}</span>
                  <span className="text-[10px] font-bold text-white">{String(l.judul || '')}</span>
                </div>
                <div className="text-[8px] text-white/70 leading-relaxed line-clamp-3">{String(l.isi || '')}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">📋</span>
          <span className="text-[10px]">Tambah langkah di panel Konten → Petunjuk</span>
        </div>
      )}

      {/* Tips */}
      {tips && (
        <div className="mt-2 p-2 rounded-lg" style={{ background: `${accent}10`, border: `1px solid ${accent}25` }}>
          <div className="text-[9px] font-bold mb-0.5" style={{ color: accent }}>💡 Tips</div>
          <div className="text-[8px] text-white/70 leading-relaxed">{tips}</div>
        </div>
      )}
    </div>
  );
}

// ── Diskusi Template ───────────────────────────────────────────

function DiskusiTemplate({ td, palette, isSelected, onEditField }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--c', '#3ecfcf');
  const pertanyaan = (td.pertanyaan as Array<Record<string, unknown>>) || [];

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${accent}20` }}>💬</div>
        <div>
          <EditableText
            value={String(td.title || 'Diskusi & Pertanyaan')}
            fieldKey="title"
            isSelected={isSelected}
            onEdit={onEditField}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Diskusi"
          />
          <div className="text-[9px] text-white/40">{pertanyaan.length} pertanyaan</div>
        </div>
      </div>

      {/* Intro */}
      {Boolean(td.intro) && (
        <div className="text-[9px] text-white/70 leading-relaxed mb-3">{String(td.intro)}</div>
      )}

      {/* Questions */}
      {pertanyaan.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {pertanyaan.map((p, i) => (
            <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-1.5 py-0.5 rounded text-[7px] font-bold"
                  style={{ background: `${accent}20`, color: accent }}>
                  {String(p.label || `Pertanyaan ${i + 1}`)}
                </span>
                <span className="text-sm">{String(p.icon || '💬')}</span>
              </div>
              <div className="text-[9px] text-white/80 leading-relaxed mb-1">{String(p.teks || '')}</div>
              {Boolean(p.petunjuk) && (
                <div className="text-[8px] text-white/40 italic">💡 {String(p.petunjuk)}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">💬</span>
          <span className="text-[10px]">Tambah pertanyaan di panel Konten → Diskusi</span>
        </div>
      )}
    </div>
  );
}

// ── Refleksi Template ───────────────────────────────────────────

function RefleksiTemplate({ td, palette, isSelected, onEditField }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--p', '#a78bfa');
  const pertanyaan = (td.pertanyaan as Array<Record<string, unknown>>) || [];
  const penugasan = td.penugasan as Record<string, unknown> | undefined;

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${accent}20` }}>🪞</div>
        <div>
          <EditableText
            value={String(td.title || 'Refleksi Diri')}
            fieldKey="title"
            isSelected={isSelected}
            onEdit={onEditField}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Refleksi"
          />
          <div className="text-[9px] text-white/40">{pertanyaan.length} pertanyaan</div>
        </div>
      </div>

      {/* Intro */}
      {Boolean(td.intro) && (
        <div className="text-[9px] text-white/70 leading-relaxed mb-3">{String(td.intro)}</div>
      )}

      {/* Questions */}
      {pertanyaan.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {pertanyaan.map((p, i) => {
            const warna = String(p.warna || accent);
            return (
              <div key={i} className="p-2 rounded-lg" style={{ background: `${warna}08`, border: `1px solid ${warna}25` }}>
                <div className="flex items-center gap-1.5 mb-1">
                  {Boolean(p.icon) && <span className="text-sm">{String(p.icon)}</span>}
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: warna }} />
                </div>
                <div className="text-[9px] text-white/80 leading-relaxed mb-0.5">{String(p.teks || '')}</div>
                {Boolean(p.petunjuk) && (
                  <div className="text-[8px] text-white/40 italic">💡 {String(p.petunjuk)}</div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">🪞</span>
          <span className="text-[10px]">Tambah pertanyaan di panel Konten → Refleksi</span>
        </div>
      )}

      {/* Penugasan */}
      {penugasan && (
        <div className="mt-2 p-2 rounded-lg" style={{ background: `${accent}10`, border: `1px solid ${accent}25` }}>
          <div className="text-[10px] font-bold mb-0.5" style={{ color: accent }}>📝 {String(penugasan.judul || 'Penugasan')}</div>
          <div className="text-[8px] text-white/70 leading-relaxed">{String(penugasan.isi || '')}</div>
          {Boolean(penugasan.contoh) && (
            <div className="mt-1 text-[7px] text-white/40 italic">Contoh: {String(penugasan.contoh)}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Penutup Template ───────────────────────────────────────────

function PenutupTemplate({ td, palette, isSelected, onEditField }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--g', '#34d399');
  const preview = (td.preview as Array<Record<string, unknown>>) || [];
  const nextPertemuan = td.nextPertemuan as Record<string, unknown> | undefined;

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${accent}20` }}>🎓</div>
        <div>
          <EditableText
            value={String(td.title || 'Penutup')}
            fieldKey="title"
            isSelected={isSelected}
            onEdit={onEditField}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Penutup"
          />
          {Boolean(td.subjudul) && (
            <div className="text-[9px] text-white/50">{String(td.subjudul)}</div>
          )}
        </div>
      </div>

      {/* Preview Items */}
      {preview.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {preview.map((item, i) => {
            const warna = String(item.warna || accent);
            return (
              <div key={i} className="p-2 rounded-lg" style={{ background: `${warna}10`, border: `1px solid ${warna}25` }}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm">{String(item.icon || '📌')}</span>
                  <span className="text-[10px] font-bold" style={{ color: warna }}>{String(item.judul || '')}</span>
                </div>
                <div className="text-[8px] text-white/70 leading-relaxed">{String(item.isi || '')}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">🎓</span>
          <span className="text-[10px]">Tambah item di panel Konten → Penutup</span>
        </div>
      )}

      {/* Next Pertemuan */}
      {nextPertemuan && (
        <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/10">
          <div className="text-[10px] font-bold mb-0.5" style={{ color: accent }}>📅 {String(nextPertemuan.judul || 'Pertemuan Berikutnya')}</div>
          {Boolean(nextPertemuan.deskripsi) && (
            <div className="text-[8px] text-white/60 leading-relaxed mb-1">{String(nextPertemuan.deskripsi)}</div>
          )}
          {Array.isArray(nextPertemuan.items) && (nextPertemuan.items as Array<Record<string, unknown>>).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(nextPertemuan.items as Array<Record<string, unknown>>).map((it, j) => {
                const itWarna = String(it.warna || accent);
                return (
                  <span key={j} className="px-1.5 py-0.5 rounded text-[7px] font-bold"
                    style={{ background: `${itWarna}15`, color: itWarna }}>
                    {String(it.icon || '')} {String(it.judul || '')}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Utility helpers ───────────────────────────────────────────

// Phase 1: Use shared icon maps from canva-icon-maps.ts
// (removed local duplicates of getModuleIcon / getGameIcon)
// Import is at the top of this file

// Keep local aliases for backward compat within this file
// (some local template icons differ slightly from the shared map)
function getModuleIcon(type: string): string {
  // Local overrides for template-specific display
  const localOverrides: Record<string, string> = {
    video: '🎬', flashcard: '🃏', langkah: '📌', accordion: '📂',
    embed: '🌐', 'hotspot-image': '📍', truefalse: '✅❌',
    skenario: '🎭',
  };
  return localOverrides[type] || _getModuleIcon(type);
}

function getGameIcon(type: string): string {
  return _getGameIcon(type);
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
