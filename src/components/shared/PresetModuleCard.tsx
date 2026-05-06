'use client';

import React from 'react';

// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════
const T = {
  bg: '#0e1c2f',
  bg2: '#13243a',
  card: '#182d45',
  y: '#f9c12e',
  c: '#3ecfcf',
  r: '#ff6b6b',
  p: '#a78bfa',
  g: '#34d399',
  o: '#fb923c',
  text: '#e8f2ff',
  muted: '#6e90b5',
} as const;

// ═══════════════════════════════════════════════════════════════════
// LAYOUT VARIANTS
// ═══════════════════════════════════════════════════════════════════
export type LayoutVariant = 'A' | 'B' | 'C' | 'D';

export const LAYOUT_VARIANTS = [
  { id: 'A' as const, label: 'Default', icon: '📐', desc: 'Tampilan standar grid' },
  { id: 'B' as const, label: 'Compact', icon: '📋', desc: 'Tata letak ringkas' },
  { id: 'C' as const, label: 'Visual', icon: '🎨', desc: 'Kartu besar visual' },
  { id: 'D' as const, label: 'Minimal', icon: '📝', desc: 'Fokus teks minimalis' },
] as const;

// ═══════════════════════════════════════════════════════════════════
// MODULE TYPE METADATA
// ═══════════════════════════════════════════════════════════════════
interface ModuleTypeMeta {
  id: string;
  icon: string;
  label: string;
  color: string;
  isGame?: boolean;
}

const MODULE_META: ModuleTypeMeta[] = [
  { id: 'video', icon: '🎥', label: 'Video Embed', color: '#ff6b6b' },
  { id: 'flashcard', icon: '🃏', label: 'Flashcard', color: '#3ecfcf' },
  { id: 'infografis', icon: '📊', label: 'Infografis', color: '#a78bfa' },
  { id: 'studi-kasus', icon: '📰', label: 'Studi Kasus', color: '#fb923c' },
  { id: 'debat', icon: '🗣️', label: 'Debat & Polling', color: '#f87171' },
  { id: 'timeline', icon: '📅', label: 'Timeline', color: '#34d399' },
  { id: 'matching', icon: '🔀', label: 'Game Pasangkan', color: '#60a5fa' },
  { id: 'materi', icon: '📖', label: 'Materi Teks', color: '#a1a1aa' },
  { id: 'hero', icon: '🖼️', label: 'Hero Banner', color: '#ff6b6b' },
  { id: 'kutipan', icon: '💬', label: 'Kutipan Inspiratif', color: '#34d399' },
  { id: 'langkah', icon: '👣', label: 'Langkah-Langkah', color: '#3ecfcf' },
  { id: 'accordion', icon: '🗂️', label: 'Accordion / FAQ', color: '#a78bfa' },
  { id: 'statistik', icon: '📊', label: 'Statistik & Angka', color: '#fb923c' },
  { id: 'polling', icon: '🗳️', label: 'Polling / Voting', color: '#60a5fa' },
  { id: 'embed', icon: '🔗', label: 'Embed / iFrame', color: '#a1a1aa' },
  { id: 'tab-icons', icon: '📑', label: 'Tab Interaktif', color: '#f9c82e' },
  { id: 'icon-explore', icon: '🔍', label: 'Eksplorasi Ikon', color: '#34d399' },
  { id: 'comparison', icon: '⚖️', label: 'Perbandingan', color: '#a78bfa' },
  { id: 'card-showcase', icon: '🃏', label: 'Card Showcase', color: '#fb923c' },
  { id: 'hotspot-image', icon: '🗺️', label: 'Hotspot Image', color: '#ff6b6b' },
  { id: 'truefalse', icon: '✅', label: 'Benar / Salah', color: '#34d399', isGame: true },
  { id: 'memory', icon: '🧠', label: 'Memory Match', color: '#a78bfa', isGame: true },
  { id: 'roda', icon: '🎡', label: 'Roda Putar', color: '#fb923c', isGame: true },
  { id: 'sorting', icon: '🔢', label: 'Urutkan / Klasifikasi', color: '#3ecfcf', isGame: true },
  { id: 'spinwheel', icon: '🎡', label: 'Roda Pertanyaan', color: '#ff6b6b', isGame: true },
  { id: 'teambuzzer', icon: '🏆', label: 'Kuis Tim / Buzzer', color: '#f9c82e', isGame: true },
  { id: 'wordsearch', icon: '🔍', label: 'Teka-Teki Kata', color: '#60a5fa', isGame: true },
  { id: 'crossword', icon: '🔤', label: 'Teka-Teki Silang', color: '#a78bfa', isGame: true },
  { id: 'fillblank', icon: '✏️', label: 'Isi Titik-Titik', color: '#34d399', isGame: true },
  { id: 'dragdrop', icon: '🖐️', label: 'Seret & Letakkan', color: '#fb923c', isGame: true },
  { id: 'skenario', icon: '🎭', label: 'Skenario Interaktif', color: '#f9c82e' },
  { id: 'petunjuk', icon: '📌', label: 'Petunjuk Penggunaan', color: '#3ecfcf' },
  { id: 'diskusi', icon: '💬', label: 'Diskusi & Refleksi', color: '#34d399' },
  { id: 'review', icon: '🔄', label: 'Review Pertemuan', color: '#f9c82e' },
  { id: 'refleksi', icon: '💭', label: 'Refleksi & Portofolio', color: '#a78bfa' },
];

function getModuleMeta(typeId: string): ModuleTypeMeta {
  return MODULE_META.find((m) => m.id === typeId) || { id: typeId, icon: '📦', label: typeId, color: '#71717a' };
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT API
// ═══════════════════════════════════════════════════════════════════
export interface PresetModuleCardProps {
  mode: 'edit' | 'canvas' | 'export';
  module: Record<string, unknown>;
  onEdit?: () => void;
  compact?: boolean;
  layoutVariant?: LayoutVariant;
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
type M = Record<string, unknown>;

function arr<T>(val: unknown): T[] {
  return Array.isArray(val) ? val : [];
}

function str(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

function num(val: unknown, fallback = 0): number {
  return typeof val === 'number' ? val : fallback;
}

function obj(val: unknown): Record<string, unknown> {
  return val != null && typeof val === 'object' && !Array.isArray(val) ? val as Record<string, unknown> : {};
}

/** Count items in a module for fallback preview */
function getItemCount(mod: M): number {
  const t = str(mod.type);
  const keys: Record<string, string> = {
    video: 'pertanyaan', flashcard: 'kartu',
    infografis: 'kartu', 'studi-kasus': 'pertanyaan', timeline: 'events',
    matching: 'pasangan', materi: 'blok', truefalse: 'soal',
    memory: 'pasangan', roda: 'opsi', hero: 'chips',
    kutipan: 'quote', langkah: 'steps', accordion: 'items',
    statistik: 'items', polling: 'opsi', embed: 'url',
    'tab-icons': 'tabs', 'icon-explore': 'items', comparison: 'baris',
    'card-showcase': 'cards', 'hotspot-image': 'hotspots',
    sorting: 'items', spinwheel: 'soal', teambuzzer: 'teams',
    wordsearch: 'kata', crossword: 'soal', fillblank: 'soal', dragdrop: 'pasangan',
    skenario: 'chapters', debat: 'pertanyaan',
    petunjuk: 'langkah', diskusi: 'pertanyaan', review: 'kartu', refleksi: 'pertanyaan',
  };
  const key = keys[t];
  if (!key) return 0;
  const v = mod[key];
  if (Array.isArray(v)) return v.length;
  if (typeof v === 'string' && v.length > 0) return 1;
  return 0;
}

// ═══════════════════════════════════════════════════════════════════
// GRADIENT MAP FOR HERO
// ═══════════════════════════════════════════════════════════════════
const GRADIENTS: Record<string, string> = {
  sunset: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
  ocean: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a78bfa 100%)',
  forest: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 50%, #0ea5e9 100%)',
  royal: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 50%, #f43f5e 100%)',
  fire: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #eab308 100%)',
  aurora: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
};

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: INFOGRAFIS
// ═══════════════════════════════════════════════════════════════════
function PreviewInfografis({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const kartu = arr<Record<string, unknown>>(mod.kartu);
  const maxItems = compact ? 3 : variant === 'C' ? 6 : variant === 'B' ? 4 : 4;

  if (variant === 'D') {
    return (
      <div className="space-y-1.5">
        {kartu.slice(0, maxItems).map((k, i) => (
          <div key={i} className="flex items-start gap-2" style={{ borderLeft: `3px solid ${str(k.color, T.c)}`, paddingLeft: 8 }}>
            <span className="text-xs">{str(k.icon, '📌')}</span>
            <div>
              <div className="text-xs font-semibold" style={{ color: T.text }}>{str(k.judul) || `Kartu ${i + 1}`}</div>
              {str(k.isi) && <div className="text-[10px]" style={{ color: T.muted }}>{str(k.isi).slice(0, 60)}</div>}
            </div>
          </div>
        ))}
        {kartu.length > maxItems && <div className="text-[10px]" style={{ color: T.muted }}>+{kartu.length - maxItems} lagi</div>}
      </div>
    );
  }

  const gridCols = variant === 'C' ? 'grid-cols-2' : variant === 'B' ? 'grid-cols-2' : 'grid-cols-2';
  const cardP = variant === 'C' ? 'p-3' : compact ? 'p-1.5' : 'p-2';

  return (
    <div className={`grid ${gridCols} gap-2`}>
      {kartu.slice(0, maxItems).map((k, i) => (
        <div key={i} className={`rounded-lg ${cardP}`} style={{ background: str(k.color, T.c) + '18', border: `1px solid ${str(k.color, T.c)}30` }}>
          <div className={`${compact ? 'text-sm' : variant === 'C' ? 'text-xl' : 'text-lg'} mb-1`}>{str(k.icon, '📌')}</div>
          <div className="font-semibold text-xs" style={{ color: str(k.color, T.c) }}>{str(k.judul) || `Kartu ${i + 1}`}</div>
          {!compact && str(k.isi) && <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>{str(k.isi).slice(0, 50)}</div>}
        </div>
      ))}
      {kartu.length > maxItems && (
        <div className="flex items-center justify-center text-[10px] rounded-lg p-2" style={{ background: T.bg2, color: T.muted }}>
          +{kartu.length - maxItems} lagi
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: STATISTIK
// ═══════════════════════════════════════════════════════════════════
function PreviewStatistik({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const items = arr<Record<string, unknown>>(mod.items);
  const maxItems = compact ? 3 : 4;

  if (variant === 'D') {
    return (
      <div className="space-y-1.5">
        {items.slice(0, maxItems).map((it, i) => (
          <div key={i} className="flex items-center gap-2" style={{ borderLeft: `3px solid ${str(it.color, T.o)}`, paddingLeft: 8 }}>
            <span className="text-xs">{str(it.icon, '📊')}</span>
            <span className="font-bold text-sm" style={{ color: str(it.color, T.o) }}>{str(it.angka, '-')}{str(it.satuan)}</span>
            <span className="text-[10px]" style={{ color: T.muted }}>{str(it.label)}</span>
          </div>
        ))}
      </div>
    );
  }

  const cols = variant === 'B' ? 'grid-cols-4' : variant === 'C' ? 'grid-cols-2' : 'grid-cols-2';

  return (
    <div className={`grid ${cols} gap-2`}>
      {items.slice(0, maxItems).map((it, i) => (
        <div key={i} className="rounded-lg p-2 text-center" style={{ background: str(it.color, T.o) + '12', border: `1px solid ${str(it.color, T.o)}25` }}>
          <div className={compact ? 'text-sm' : 'text-lg'}>{str(it.icon, '📊')}</div>
          <div className={`font-bold ${compact ? 'text-sm' : 'text-xl'}`} style={{ color: str(it.color, T.o) }}>
            {str(it.angka, '-')}
          </div>
          {str(it.satuan) && <div className="text-[10px]" style={{ color: T.muted }}>{str(it.satuan)}</div>}
          <div className="text-[10px]" style={{ color: T.muted }}>{str(it.label)}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: TIMELINE
// ═══════════════════════════════════════════════════════════════════
function PreviewTimeline({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const events = arr<Record<string, unknown>>(mod.events);
  const maxItems = compact ? 3 : variant === 'C' ? 5 : 4;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {events.slice(0, maxItems).map((ev, i) => (
          <div key={i} className="flex items-start gap-2" style={{ borderLeft: `2px solid ${T.g}`, paddingLeft: 8 }}>
            <span className="text-[10px]">{str(ev.icon, '📌')}</span>
            <div>
              <span className="text-[10px] font-bold" style={{ color: T.g }}>{str(ev.tahun)}</span>
              <span className="text-xs ml-1" style={{ color: T.text }}>{str(ev.judul) || `Event ${i + 1}`}</span>
            </div>
          </div>
        ))}
        {events.length > maxItems && <div className="text-[10px]" style={{ color: T.muted }}>+{events.length - maxItems} lagi</div>}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.slice(0, maxItems).map((ev, i) => (
        <div key={i} className="flex items-start gap-2 relative" style={{ paddingLeft: 16 }}>
          {/* Dot + line */}
          <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full" style={{ background: T.g, border: `2px solid ${T.card}`, zIndex: 1 }} />
          {i < Math.min(events.length, maxItems) - 1 && (
            <div className="absolute left-[4px] top-3 bottom-0 w-px" style={{ background: T.g + '40' }} />
          )}
          <div className="pb-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={compact ? 'text-[10px]' : 'text-xs'}>{str(ev.icon, '📌')}</span>
              {str(ev.tahun) && <span className="text-[10px] font-bold px-1 py-0.5 rounded" style={{ background: T.g + '20', color: T.g }}>{str(ev.tahun)}</span>}
              <span className={`font-semibold ${compact ? 'text-[10px]' : 'text-xs'}`} style={{ color: T.text }}>{str(ev.judul) || `Event ${i + 1}`}</span>
            </div>
            {!compact && str(ev.isi) && <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>{str(ev.isi).slice(0, 60)}</div>}
          </div>
        </div>
      ))}
      {events.length > maxItems && <div className="text-[10px] pl-4" style={{ color: T.muted }}>+{events.length - maxItems} lagi</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: HERO
// ═══════════════════════════════════════════════════════════════════
function PreviewHero({ mod, compact }: { mod: M; compact: boolean }) {
  const gradient = str(mod.gradient, 'sunset');
  const bg = GRADIENTS[gradient] || GRADIENTS.sunset;
  const chipsStr = str(mod.chips, '');
  const chips = chipsStr ? chipsStr.split(',').map((c) => c.trim()).filter(Boolean) : [];

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{ background: bg, minHeight: compact ? 48 : 80 }}
    >
      <div className="relative z-10">
        <div className={`${compact ? 'text-lg' : 'text-2xl'} mb-0.5`}>{str(mod.icon, '🚀')}</div>
        <div className={`font-bold ${compact ? 'text-xs' : 'text-sm'} text-white`}>
          {str(mod.title) || 'Hero Banner'}
        </div>
        {!compact && str(mod.subjudul) && (
          <div className="text-[10px] text-white/80 mt-0.5">{str(mod.subjudul)}</div>
        )}
        {!compact && chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {chips.slice(0, 3).map((c, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/20 text-white/90">{c}</span>
            ))}
            {chips.length > 3 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/20 text-white/90">+{chips.length - 3}</span>}
          </div>
        )}
      </div>
      {/* Decorative circles */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full bg-white/5" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: KUTIPAN
// ═══════════════════════════════════════════════════════════════════
function PreviewKutipan({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const accent = str(mod.accent, T.y);
  const quote = str(mod.quote, '');
  const source = str(mod.source, '');
  const display = str(mod.display, 'card');

  if (variant === 'D' || display === 'minimal') {
    return (
      <div className="pl-3" style={{ borderLeft: `3px solid ${accent}` }}>
        <div className={`italic ${compact ? 'text-[10px]' : 'text-xs'}`} style={{ color: T.text }}>
          &ldquo;{quote || 'Belum ada kutipan'}&rdquo;
        </div>
        {source && <div className="text-[10px] mt-1" style={{ color: accent }}>— {source}</div>}
      </div>
    );
  }

  return (
    <div className="rounded-lg p-3 relative" style={{ background: accent + '10', border: `1px solid ${accent}30` }}>
      <div className="absolute -top-1 left-2 text-xl leading-none" style={{ color: accent }}>&ldquo;</div>
      <div className={`italic ${compact ? 'text-[10px]' : variant === 'C' ? 'text-sm' : 'text-xs'} mt-2`} style={{ color: T.text }}>
        {quote || 'Belum ada kutipan'}
      </div>
      {source && (
        <div className="text-[10px] mt-1.5 font-semibold" style={{ color: accent }}>— {source}</div>
      )}
      {str(mod.title) && <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>{str(mod.title)}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: LANGKAH
// ═══════════════════════════════════════════════════════════════════
function PreviewLangkah({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const steps = arr<Record<string, unknown>>(mod.steps);
  const maxItems = compact ? 3 : variant === 'C' ? 5 : 4;

  if (variant === 'D') {
    return (
      <div className="space-y-1.5">
        {steps.slice(0, maxItems).map((s, i) => (
          <div key={i} className="flex items-start gap-2" style={{ borderLeft: `3px solid ${str(s.color, T.c)}`, paddingLeft: 8 }}>
            <span className="text-[10px] font-bold" style={{ color: str(s.color, T.c) }}>{i + 1}.</span>
            <div>
              <span className="text-xs font-semibold" style={{ color: T.text }}>{str(s.icon, '📌')} {str(s.judul) || `Langkah ${i + 1}`}</span>
              {!compact && str(s.isi) && <div className="text-[10px]" style={{ color: T.muted }}>{str(s.isi).slice(0, 50)}</div>}
            </div>
          </div>
        ))}
        {steps.length > maxItems && <div className="text-[10px]" style={{ color: T.muted }}>+{steps.length - maxItems} lagi</div>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {steps.slice(0, maxItems).map((s, i) => (
        <div key={i} className="flex items-start gap-2">
          <div
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: str(s.color, T.c) }}
          >
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={compact ? 'text-[10px]' : 'text-xs'}>{str(s.icon, '📌')}</span>
              <span className={`font-semibold ${compact ? 'text-[10px]' : 'text-xs'}`} style={{ color: T.text }}>
                {str(s.judul) || `Langkah ${i + 1}`}
              </span>
            </div>
            {!compact && str(s.isi) && <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>{str(s.isi).slice(0, 60)}</div>}
          </div>
        </div>
      ))}
      {steps.length > maxItems && <div className="text-[10px] pl-8" style={{ color: T.muted }}>+{steps.length - maxItems} lagi</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: ACCORDION
// ═══════════════════════════════════════════════════════════════════
function PreviewAccordion({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const items = arr<Record<string, unknown>>(mod.items);
  const maxItems = compact ? 2 : variant === 'C' ? 5 : 3;

  if (variant === 'D') {
    return (
      <div className="space-y-1.5">
        {items.slice(0, maxItems).map((it, i) => (
          <div key={i} className="flex items-start gap-2" style={{ borderLeft: `3px solid ${T.p}`, paddingLeft: 8 }}>
            <span className="text-[10px]">{str(it.icon, '📌')}</span>
            <div>
              <div className="text-xs font-semibold" style={{ color: T.text }}>{str(it.judul) || `Item ${i + 1}`}</div>
              {!compact && str(it.isi) && <div className="text-[10px]" style={{ color: T.muted }}>{str(it.isi).slice(0, 60)}</div>}
            </div>
          </div>
        ))}
        {items.length > maxItems && <div className="text-[10px]" style={{ color: T.muted }}>+{items.length - maxItems} lagi</div>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {items.slice(0, maxItems).map((it, i) => (
        <div key={i} className="rounded-lg p-2 flex items-start gap-2" style={{ background: T.bg2, border: `1px solid ${T.p}18` }}>
          <span className={compact ? 'text-[10px]' : 'text-sm'}>{str(it.icon, '📌')}</span>
          <div className="flex-1 min-w-0">
            <div className={`font-semibold ${compact ? 'text-[10px]' : 'text-xs'}`} style={{ color: T.text }}>
              {str(it.judul) || `Item ${i + 1}`}
            </div>
            {!compact && str(it.isi) && <div className="text-[10px] mt-0.5" style={{ color: T.muted }}>{str(it.isi).slice(0, 50)}</div>}
          </div>
          <svg className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: T.muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      ))}
      {items.length > maxItems && <div className="text-[10px]" style={{ color: T.muted }}>+{items.length - maxItems} lagi</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: VIDEO
// ═══════════════════════════════════════════════════════════════════
function PreviewVideo({ mod, compact }: { mod: M; compact: boolean }) {
  const platform = str(mod.platform, 'youtube');
  const url = str(mod.url, '');
  const duration = str(mod.durasi, '');

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: T.bg, border: `1px solid ${T.r}25` }}>
      {/* Video placeholder area */}
      <div className="relative flex items-center justify-center" style={{ background: '#0a0a0a', minHeight: compact ? 32 : 56 }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: T.r + '30' }}>
          <span className="text-sm">▶</span>
        </div>
        {duration && (
          <div className="absolute bottom-1 right-1 text-[9px] px-1 rounded" style={{ background: 'rgba(0,0,0,0.7)', color: T.text }}>
            {duration}
          </div>
        )}
        <div className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase" style={{ background: T.r + '20', color: T.r }}>
          {platform}
        </div>
      </div>
      {!compact && url && (
        <div className="p-1.5 text-[10px] truncate" style={{ color: T.muted }}>{url}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: PETUNJUK PENGGUNAAN
// ═══════════════════════════════════════════════════════════════════
function PreviewPetunjuk({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const langkah = arr<Record<string, unknown>>(mod.langkah);
  if (!langkah.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada langkah petunjuk.</div>;
  const max = compact ? 3 : variant === 'C' ? 6 : 4;
  const accent = T.c;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {langkah.slice(0, max).map((l, i) => (
          <div key={i} className="flex items-start gap-2" style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 10 }}>
            <div className="flex-shrink-0 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold" style={{ background: accent + '25', color: accent }}>{i + 1}</div>
            <div>
              <span className="text-[11px] font-semibold" style={{ color: T.text }}>{str(l.icon, '📌')} {str(l.judul)}</span>
              {!compact && str(l.isi) && <div className="text-[10px]" style={{ color: T.muted }}>{str(l.isi).slice(0, 60)}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const intro = str(mod.intro);

  return (
    <div>
      {intro && <div className="text-[13px] mb-3 px-0.5 leading-relaxed" style={{ color: T.muted }}>{intro}</div>}
      <div className="grid grid-cols-2 gap-2.5">
        {langkah.slice(0, max).map((l, i) => {
          const stepColor = str(l.color, accent);
          return (
            <div key={i} className="relative rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${stepColor}0a, ${stepColor}04)`, border: `1px solid ${stepColor}22`, borderLeft: `3px solid ${stepColor}`, padding: '14px 12px 12px' }}>
              <div className="absolute top-2 right-2 min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm" style={{ background: stepColor, boxShadow: `0 2px 6px ${stepColor}40` }}>{i + 1}</div>
              <div className={`${compact ? 'text-base' : 'text-2xl'} mb-1.5`}>{str(l.icon, '📌')}</div>
              <div className="font-extrabold text-xs mb-0.5 pr-6" style={{ color: T.text }}>{str(l.judul)}</div>
              {!compact && str(l.isi) && <div className="text-[10px] leading-relaxed" style={{ color: T.muted }}>{str(l.isi)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: DISKUSI
// ═══════════════════════════════════════════════════════════════════
function PreviewDiskusi({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const pertanyaan = arr<Record<string, unknown>>(mod.pertanyaan);
  if (!pertanyaan.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada pertanyaan diskusi.</div>;
  const max = compact ? 2 : 3;
  const accent = T.g;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {pertanyaan.slice(0, max).map((p, i) => (
          <div key={i} className="flex items-start gap-2" style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 10 }}>
            <div className="flex-shrink-0 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold" style={{ background: accent + '25', color: accent }}>{i + 1}</div>
            <span className="text-[11px]" style={{ color: T.text }}>{str(p.teks).slice(0, 80)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {pertanyaan.slice(0, max).map((p, i) => (
        <div key={i} className="relative rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent}08, ${accent}03)`, border: `1px solid ${accent}22`, borderLeft: `4px solid ${accent}`, padding: 14 }}>
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}50, transparent)` }} />
          {/* Header with number badge */}
          <div className="flex items-center gap-2 mb-2">
            <div className="min-w-[26px] h-[26px] rounded-lg flex items-center justify-center text-[10px] font-black" style={{ background: accent + '20', color: accent, border: `1px solid ${accent}30` }}>{i + 1}</div>
            {str(p.label) ? (
              <div className="text-[11px] font-extrabold tracking-wide" style={{ color: accent }}>{str(p.icon || '💬')} {str(p.label)}</div>
            ) : (
              <div className="text-[11px] font-extrabold tracking-wide" style={{ color: accent }}>{str(p.icon || '💬')} Pertanyaan {i + 1}</div>
            )}
          </div>
          <p className="text-xs font-bold leading-relaxed" style={{ color: T.text }}>{str(p.teks)}</p>
          {str(p.petunjuk) && <div className="text-[10px] italic mt-1" style={{ color: T.muted }}>{str(p.petunjuk)}</div>}
          {!compact && (
            <div className="mt-2.5 rounded-lg p-2.5 text-[10px]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.09)', color: T.muted }}>
              Tuliskan jawabanmu di sini…
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: REVIEW
// ═══════════════════════════════════════════════════════════════════
function PreviewReview({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const kartu = arr<Record<string, unknown>>(mod.kartu);
  if (!kartu.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada konten review.</div>;
  const max = compact ? 2 : 4;
  const accent = T.y;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {kartu.slice(0, max).map((k, i) => (
          <div key={i} className="flex items-start gap-2" style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 10 }}>
            <span className="text-xs">{str(k.icon, '🔄')}</span>
            <div>
              <span className="text-[11px] font-semibold" style={{ color: T.text }}>{str(k.judul)}</span>
              {!compact && str(k.isi) && <div className="text-[10px]" style={{ color: T.muted }}>{str(k.isi).slice(0, 60)}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {kartu.slice(0, max).map((k, i) => {
        const color = str(k.warna, accent);
        return (
          <div key={i} className="relative rounded-xl overflow-hidden" style={{ background: `linear-gradient(160deg, ${color}10, ${color}05)`, border: `1px solid ${color}22`, padding: 14 }}>
            {/* Decorative circle */}
            <div className="absolute -top-2.5 -right-2.5 w-12 h-12 rounded-full" style={{ background: color + '0a' }} />
            {/* Icon area */}
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-2.5" style={{ background: color + '18', border: `1px solid ${color}20` }}>
              {str(k.icon, '✅')}
            </div>
            <div className="font-extrabold text-xs mb-0.5" style={{ color: T.text }}>{str(k.judul)}</div>
            {!compact && str(k.isi) && <div className="text-[10px] leading-relaxed" style={{ color: T.muted }}>{str(k.isi)}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: REFLEKSI
// ═══════════════════════════════════════════════════════════════════
function PreviewRefleksi({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const pertanyaan = arr<Record<string, unknown>>(mod.pertanyaan);
  if (!pertanyaan.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada pertanyaan refleksi.</div>;
  const max = compact ? 2 : 3;
  const accent = T.p;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {pertanyaan.slice(0, max).map((p, i) => (
          <div key={i} className="flex items-start gap-2" style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 10 }}>
            <div className="flex-shrink-0 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold" style={{ background: accent + '25', color: accent }}>{i + 1}</div>
            <span className="text-[11px]" style={{ color: T.text }}>{str(p.teks).slice(0, 80)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {pertanyaan.slice(0, max).map((p, i) => (
        <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${accent}20`, background: `linear-gradient(160deg, ${accent}08, transparent)` }}>
          {/* Gradient accent header */}
          <div className="flex items-center gap-2 px-3.5 py-2.5" style={{ background: `linear-gradient(135deg, ${accent}20, ${accent}08)`, borderBottom: `1px solid ${accent}15` }}>
            <div className="min-w-[24px] h-[24px] rounded-md flex items-center justify-center text-[10px] font-black" style={{ background: accent + '30', color: accent, border: `1px solid ${accent}35` }}>{i + 1}</div>
            <label className="text-[12px] font-extrabold block" style={{ color: T.text }}>{str(p.icon || '💭')} {str(p.teks)}</label>
          </div>
          <div className="px-3.5 py-3">
            {str(p.petunjuk) && <div className="text-[10px] italic mb-2" style={{ color: T.muted }}>{str(p.petunjuk)}</div>}
            {!compact && (
              <div className="rounded-lg p-2.5 text-[10px]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.09)', color: T.muted }}>
                Tuliskan refleksimu…
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: SKENARIO
// ═══════════════════════════════════════════════════════════════════
function PreviewSkenario({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const chapters = arr<Record<string, unknown>>(mod.chapters);
  if (!chapters.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada bab skenario.</div>;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {chapters.map((ch, i) => (
          <div key={i} style={{ borderLeft: '3px solid #f9c82e', paddingLeft: 8 }}>
            <span className="text-[11px]" style={{ color: T.text }}>🎭 {str(ch.title)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {chapters.map((ch, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(249,193,46,0.06)', border: '1px solid rgba(249,193,46,0.2)' }}>
          <span className={compact ? 'text-sm' : 'text-base'}>🎭</span>
          <span className="text-xs font-bold" style={{ color: T.text }}>{str(ch.title)}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: DEBAT
// ═══════════════════════════════════════════════════════════════════
function PreviewDebat({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const pA = obj(mod.pihakA);
  const pB = obj(mod.pihakB);

  if (variant === 'D') {
    return (
      <div style={{ borderLeft: '3px solid #f87171', paddingLeft: 8 }}>
        <span className="text-[11px]" style={{ color: T.text }}>{str(mod.pertanyaan)}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="font-black text-xs mb-1" style={{ color: T.text }}>🗣️ Mosi:</div>
        <p className="text-xs leading-relaxed" style={{ color: T.text }}>{str(mod.pertanyaan)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg p-3" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <div className="font-black text-xs" style={{ color: T.g }}>✅ {str(pA.label, 'Pro')}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.2)' }}>
          <div className="font-black text-xs" style={{ color: T.r }}>❌ {str(pB.label, 'Kontra')}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: FLASHCARD
// ═══════════════════════════════════════════════════════════════════
function PreviewFlashcard({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
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
// PREVIEW: TAB-ICONS
// ═══════════════════════════════════════════════════════════════════
function PreviewTabIcons({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const tabs = arr<Record<string, unknown>>(mod.tabs);

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {tabs.map((t, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${T.y}`, paddingLeft: 8 }}>
            <span className="text-[10px]">{str(t.icon, '📌')}</span> <span className="text-[11px] font-semibold" style={{ color: T.text }}>{str(t.judul)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-0 border-b-2" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {tabs.slice(0, 3).map((t, i) => (
          <div key={i} className="px-3 py-1.5 text-xs font-bold whitespace-nowrap" style={{ borderBottom: `2px solid ${i === 0 ? T.y : 'transparent'}`, color: i === 0 ? T.y : T.muted }}>
            {str(t.icon, '📌')} {str(t.judul)}
          </div>
        ))}
      </div>
      <div className="py-2 text-xs leading-relaxed" style={{ color: T.muted }}>
        {str(tabs[0]?.isi) || 'Konten tab...'}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: ICON-EXPLORE
// ═══════════════════════════════════════════════════════════════════
function PreviewIconExplore({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const items = arr<Record<string, unknown>>(mod.items);
  const cols = variant === 'C' ? 'grid-cols-3' : variant === 'B' ? 'grid-cols-4' : 'grid-cols-3';
  const max = compact ? 3 : variant === 'C' ? 6 : 4;

  return (
    <div className={`grid ${cols} gap-2`}>
      {items.slice(0, max).map((it, i) => (
        <div key={i} className="rounded-lg p-3 text-center" style={{ background: T.bg2, border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className={`${compact ? 'text-base' : 'text-xl'} mb-1`}>{str(it.icon, '🔍')}</div>
          <div className="text-[11px] font-bold" style={{ color: T.text }}>{str(it.judul)}</div>
          {!compact && str(it.isi) && <div className="text-[10px] mt-1 leading-relaxed" style={{ color: T.muted }}>{str(it.isi).slice(0, 50)}</div>}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: COMPARISON
// ═══════════════════════════════════════════════════════════════════
function PreviewComparison({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const baris = arr<Record<string, unknown> | string[]>(mod.baris);
  if (!baris.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada data perbandingan.</div>;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {baris.map((row, i) => {
          const cells = Array.isArray(row) ? row : [str((row as Record<string, unknown>).kiri), str((row as Record<string, unknown>).kanan)];
          return <div key={i} style={{ borderLeft: `3px solid ${T.p}`, paddingLeft: 8 }}><span className="text-[11px]" style={{ color: T.text }}>{cells.join(' vs ')}</span></div>;
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {baris.flatMap((row, i) => {
        const cells = Array.isArray(row) ? row : [str((row as Record<string, unknown>).kiri), str((row as Record<string, unknown>).kanan)];
        return cells.map((cell, j) => (
          <div key={`${i}-${j}`} className="rounded-lg p-3 text-xs" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: T.text }}>
            {String(cell)}
          </div>
        ));
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: CARD-SHOWCASE
// ═══════════════════════════════════════════════════════════════════
function PreviewCardShowcase({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const cards = arr<Record<string, unknown>>(mod.cards);
  const max = compact ? 2 : variant === 'C' ? 4 : 3;

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.slice(0, max).map((c, i) => (
        <div key={i} className="rounded-xl overflow-hidden" style={{ background: T.bg2, border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-center text-2xl" style={{ background: str(c.bgGrad, `linear-gradient(135deg,${T.y},${T.c})`), height: compact ? 40 : 64 }}>
            {str(c.icon, '🃏')}
          </div>
          <div className="p-2">
            <div className="font-black text-xs" style={{ color: T.text }}>{str(c.judul)}</div>
            {!compact && str(c.isi) && <p className="text-[10px] leading-relaxed mt-0.5" style={{ color: T.muted }}>{str(c.isi).slice(0, 50)}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: HOTSPOT-IMAGE
// ═══════════════════════════════════════════════════════════════════
function PreviewHotspotImage({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const hotspots = arr<Record<string, unknown>>(mod.hotspots);

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {hotspots.map((h, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${T.r}`, paddingLeft: 8 }}>
            <span className="text-[11px]" style={{ color: T.text }}>{i + 1}. {str(h.text || h.judul)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden flex items-center justify-center" style={{ background: T.bg2, minHeight: compact ? 48 : 120 }}>
      <span className="text-xs" style={{ color: T.muted }}>Hotspot Image</span>
      {hotspots.slice(0, compact ? 3 : 5).map((h, i) => (
        <div key={i} className="absolute w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer" style={{ background: T.y, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', left: `${num(h.x, 30 + i * 15)}%`, top: `${num(h.y, 30 + i * 10)}%`, transform: 'translate(-50%,-50%)' }}>
          {i + 1}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: POLLING
// ═══════════════════════════════════════════════════════════════════
function PreviewPolling({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const opsi = arr<Record<string, unknown>>(mod.opsi);
  const max = compact ? 2 : 4;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {opsi.slice(0, max).map((o, i) => (
          <div key={i} style={{ borderLeft: '3px solid #60a5fa', paddingLeft: 8 }}>
            <span className="text-[11px]" style={{ color: T.text }}>{str(o.icon, '📊')} {str(o.teks)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {opsi.slice(0, max).map((o, i) => {
        const color = str(o.warna, T.c);
        return (
          <div key={i} className="rounded-lg p-3 flex items-center gap-2" style={{ background: color + '0a', border: `2px solid ${color}33` }}>
            <span className={compact ? 'text-sm' : 'text-base'}>{str(o.icon, '📊')}</span>
            <span className="text-xs font-bold" style={{ color: T.text }}>{str(o.teks)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: EMBED
// ═══════════════════════════════════════════════════════════════════
function PreviewEmbed({ mod, compact }: { mod: M; compact: boolean }) {
  const url = str(mod.url);
  if (!url) return <div className="text-xs" style={{ color: T.muted }}>URL embed belum diisi.</div>;

  return (
    <div className="rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.2)', minHeight: compact ? 32 : 56 }}>
      <div className="text-center p-3">
        <div className={compact ? 'text-base' : 'text-xl'}>🔗</div>
        <div className="text-[10px] truncate max-w-[160px]" style={{ color: T.muted }}>{url}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: STUDI-KASUS
// ═══════════════════════════════════════════════════════════════════
function PreviewStudiKasus({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const pertanyaan = arr<Record<string, unknown>>(mod.pertanyaan);

  if (variant === 'D') {
    return (
      <div>
        <div style={{ borderLeft: `3px solid ${T.o}`, paddingLeft: 8 }}>
          <span className="text-[11px]" style={{ color: T.muted }}>{str(mod.teks).slice(0, 100)}</span>
        </div>
        {pertanyaan.map((p, i) => <div key={i} className="text-[10px] py-0.5" style={{ color: T.text }}>📌 {str(p.teks || p.label)}</div>)}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs leading-relaxed" style={{ color: T.text }}>{str(mod.teks)}</p>
        {str(mod.sumber) && <p className="text-[10px] mt-1" style={{ color: T.muted }}>Sumber: {str(mod.sumber)}</p>}
      </div>
      {pertanyaan.length > 0 && !compact && (
        <>
          <div className="font-bold text-xs" style={{ color: T.text }}>📝 Pertanyaan Analisis</div>
          {pertanyaan.slice(0, 2).map((p, i) => (
            <div key={i} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: T.p, background: T.p + '18' }}>{str(p.level, 'C2')}</span>
              <p className="text-xs font-semibold mt-1" style={{ color: T.text }}>{str(p.teks || p.label)}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: MATERI
// ═══════════════════════════════════════════════════════════════════
function PreviewMateri({ mod, compact }: { mod: M; compact: boolean }) {
  const blok = arr<Record<string, unknown>>(mod.blok);
  if (!blok.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada blok materi.</div>;
  const max = compact ? 2 : 4;

  return (
    <div className="space-y-1.5">
      {blok.slice(0, max).map((b, i) => (
        <div key={i} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[11px] font-extrabold" style={{ color: T.text }}>{str(b.judul)}</div>
          {!compact && str(b.isi) && <div className="text-[10px] leading-relaxed" style={{ color: T.muted }}>{str(b.isi).slice(0, 60)}</div>}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: MATCHING
// ═══════════════════════════════════════════════════════════════════
function PreviewMatching({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
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
// PREVIEW: GAME TYPES (TRUEFALSE, MEMORY, RODA, SORTING, SPINWHEEL, TEAMBUZZER, WORDSEARCH)
// ═══════════════════════════════════════════════════════════════════
function PreviewTrueFalse({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
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

function PreviewMemory({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
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

function PreviewRoda({ mod, compact }: { mod: M; compact: boolean }) {
  const opsi = arr<Record<string, unknown>>(mod.opsi);
  if (!opsi.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada opsi.</div>;
  const colors = ['#f9c12e', '#3ecfcf', '#ff6b6b', '#a78bfa', '#34d399', '#fb923c'];

  return (
    <div className="flex flex-wrap gap-1.5">
      {opsi.slice(0, compact ? 3 : 6).map((o, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: colors[i % colors.length] + '20', color: colors[i % colors.length] }}>{String(o)}</span>
      ))}
    </div>
  );
}

function PreviewSorting({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
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

function PreviewSpinwheel({ mod, compact }: { mod: M; compact: boolean }) {
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

function PreviewTeambuzzer({ mod, compact }: { mod: M; compact: boolean }) {
  const teams = arr<Record<string, unknown>>(mod.teams);
  if (!teams.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada tim.</div>;
  const max = compact ? 2 : 3;
  const colors = ['#f9c12e', '#3ecfcf', '#ff6b6b', '#a78bfa', '#34d399', '#fb923c'];

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {teams.slice(0, max).map((t, i) => {
        const color = str(t.color, colors[i % colors.length]);
        return (
          <div key={i} className="rounded-lg p-2 text-center" style={{ background: color + '12', border: `2px solid ${color}33` }}>
            <div className="text-base">{str(t.icon, '🏆')}</div>
            <div className="text-[10px] font-black" style={{ color: T.text }}>{str(t.name, `Tim ${i + 1}`)}</div>
            <div className="text-sm font-black" style={{ color: color }}>{num(t.score, 0)}</div>
          </div>
        );
      })}
    </div>
  );
}

function PreviewWordsearch({ mod, compact }: { mod: M; compact: boolean }) {
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
function PreviewCrossword({ mod, compact }: { mod: M; compact: boolean }) {
  const soal = arr<Record<string, unknown>>(mod.soal);
  if (!soal.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada soal TTS.</div>;
  const max = compact ? 2 : 4;

  return (
    <div className="space-y-1.5">
      {soal.slice(0, max).map((s, i) => (
        <div key={i} className="rounded-lg p-2 flex items-start gap-2" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{ background: T.p + '20', color: T.p }}>{str(s.arah, '→')}</span>
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
function PreviewFillblank({ mod, compact }: { mod: M; compact: boolean }) {
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
function PreviewDragdrop({ mod, compact }: { mod: M; compact: boolean }) {
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

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: GENERIC FALLBACK
// ═══════════════════════════════════════════════════════════════════
function PreviewFallback({ mod, meta, compact }: { mod: M; meta: ModuleTypeMeta; compact: boolean }) {
  const count = getItemCount(mod);

  return (
    <div className="flex flex-col items-center justify-center py-3 gap-2" style={{ background: meta.color + '08', borderRadius: 8 }}>
      <div className={`flex items-center gap-1.5`}>
        <span className={compact ? 'text-base' : 'text-xl'}>{meta.icon}</span>
        <span className={`font-semibold ${compact ? 'text-[10px]' : 'text-xs'}`} style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>
      {count > 0 && (
        <div className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: meta.color + '15', color: meta.color }}>
          {count} item
        </div>
      )}
      {/* Mini icon grid */}
      {!compact && count > 0 && (
        <div className="flex flex-wrap gap-1 justify-center max-w-[160px]">
          {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
            <div key={i} className="w-4 h-4 rounded" style={{ background: meta.color + '25' }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW ROUTER
// ═══════════════════════════════════════════════════════════════════
function ModulePreview({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const t = str(mod.type);
  const meta = getModuleMeta(t);

  switch (t) {
    case 'infografis':
      return <PreviewInfografis mod={mod} variant={variant} compact={compact} />;
    case 'statistik':
      return <PreviewStatistik mod={mod} variant={variant} compact={compact} />;
    case 'timeline':
      return <PreviewTimeline mod={mod} variant={variant} compact={compact} />;
    case 'hero':
      return <PreviewHero mod={mod} compact={compact} />;
    case 'kutipan':
      return <PreviewKutipan mod={mod} variant={variant} compact={compact} />;
    case 'langkah':
      return <PreviewLangkah mod={mod} variant={variant} compact={compact} />;
    case 'accordion':
      return <PreviewAccordion mod={mod} variant={variant} compact={compact} />;
    case 'video':
      return <PreviewVideo mod={mod} compact={compact} />;
    case 'petunjuk':
      return <PreviewPetunjuk mod={mod} variant={variant} compact={compact} />;
    case 'diskusi':
      return <PreviewDiskusi mod={mod} variant={variant} compact={compact} />;
    case 'review':
      return <PreviewReview mod={mod} variant={variant} compact={compact} />;
    case 'refleksi':
      return <PreviewRefleksi mod={mod} variant={variant} compact={compact} />;
    case 'skenario':
    case 'senario':
      return <PreviewSkenario mod={mod} variant={variant} compact={compact} />;
    case 'debat':
      return <PreviewDebat mod={mod} variant={variant} compact={compact} />;
    case 'flashcard':
      return <PreviewFlashcard mod={mod} variant={variant} compact={compact} />;
    case 'tab-icons':
      return <PreviewTabIcons mod={mod} variant={variant} compact={compact} />;
    case 'icon-explore':
      return <PreviewIconExplore mod={mod} variant={variant} compact={compact} />;
    case 'comparison':
      return <PreviewComparison mod={mod} variant={variant} compact={compact} />;
    case 'card-showcase':
      return <PreviewCardShowcase mod={mod} variant={variant} compact={compact} />;
    case 'hotspot-image':
      return <PreviewHotspotImage mod={mod} variant={variant} compact={compact} />;
    case 'polling':
      return <PreviewPolling mod={mod} variant={variant} compact={compact} />;
    case 'embed':
      return <PreviewEmbed mod={mod} compact={compact} />;
    case 'studi-kasus':
      return <PreviewStudiKasus mod={mod} variant={variant} compact={compact} />;
    case 'materi':
      return <PreviewMateri mod={mod} compact={compact} />;
    case 'matching':
      return <PreviewMatching mod={mod} variant={variant} compact={compact} />;
    case 'truefalse':
      return <PreviewTrueFalse mod={mod} variant={variant} compact={compact} />;
    case 'memory':
      return <PreviewMemory mod={mod} variant={variant} compact={compact} />;
    case 'roda':
      return <PreviewRoda mod={mod} compact={compact} />;
    case 'sorting':
      return <PreviewSorting mod={mod} variant={variant} compact={compact} />;
    case 'spinwheel':
      return <PreviewSpinwheel mod={mod} compact={compact} />;
    case 'teambuzzer':
      return <PreviewTeambuzzer mod={mod} compact={compact} />;
    case 'wordsearch':
      return <PreviewWordsearch mod={mod} compact={compact} />;
    case 'crossword':
      return <PreviewCrossword mod={mod} compact={compact} />;
    case 'fillblank':
      return <PreviewFillblank mod={mod} compact={compact} />;
    case 'dragdrop':
      return <PreviewDragdrop mod={mod} compact={compact} />;
    default:
      return <PreviewFallback mod={mod} meta={meta} compact={compact} />;
  }
}

// ═══════════════════════════════════════════════════════════════════
// CARD SHELL (shared across all modes)
// ═══════════════════════════════════════════════════════════════════
function CardShell({
  children,
  moduleColor,
  rounded,
  className = '',
  style,
}: {
  children: React.ReactNode;
  moduleColor: string;
  rounded: '2xl' | 'xl';
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden border border-white/[0.09] rounded-${rounded} ${className}`}
      style={{ background: T.card, ...style }}
    >
      {/* Top accent bar */}
      <div
        className="h-[3px] w-full"
        style={{ background: `linear-gradient(90deg, ${moduleColor} 0%, transparent 100%)` }}
      />
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT BADGE
// ═══════════════════════════════════════════════════════════════════
function VariantBadge({ variant }: { variant: LayoutVariant }) {
  const v = LAYOUT_VARIANTS.find((lv) => lv.id === variant);
  if (!v) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
      style={{ background: T.y + '18', color: T.y, border: `1px solid ${T.y}30` }}
    >
      {v.icon} {v.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GAME BADGE
// ═══════════════════════════════════════════════════════════════════
function GameBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase"
      style={{ background: T.g + '18', color: T.g, border: `1px solid ${T.g}30` }}
    >
      🎮 Game
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EDIT / EXPORT MODE (full card)
// ═══════════════════════════════════════════════════════════════════
function FullCard({ mode, mod, variant, onEdit }: { mode: 'edit' | 'export'; mod: M; variant: LayoutVariant; onEdit?: () => void }) {
  const meta = getModuleMeta(str(mod.type));
  const title = str(mod.title) || meta.label;
  const isEdit = mode === 'edit';
  const [hovered, setHovered] = React.useState(false);

  return (
    <CardShell moduleColor={meta.color} rounded="2xl" className="group">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Icon box */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ background: meta.color + '20', border: `1px solid ${meta.color}30` }}
          >
            {meta.icon}
          </div>
          {/* Title & type */}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate" style={{ color: T.text }}>{title}</div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: meta.color + '15', color: meta.color }}>
                {meta.label}
              </span>
              <VariantBadge variant={variant} />
              {meta.isGame && <GameBadge />}
            </div>
          </div>
        </div>

        {/* Body: Preview content */}
        <div className="min-h-[60px]">
          <ModulePreview mod={mod} variant={variant} compact={false} />
        </div>
      </div>

      {/* Edit hover overlay */}
      {isEdit && onEdit && (
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
          style={{
            background: hovered ? 'rgba(14, 28, 47, 0.85)' : 'transparent',
            opacity: hovered ? 1 : 0,
            backdropFilter: hovered ? 'blur(4px)' : 'none',
            pointerEvents: hovered ? 'auto' : 'none',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition-transform duration-150"
            style={{
              background: T.y,
              color: '#1a1a2e',
              transform: hovered ? 'scale(1)' : 'scale(0.9)',
            }}
          >
            ✏️ Edit Modul
          </button>
        </div>
      )}
    </CardShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CANVAS MODE (compact)
// ═══════════════════════════════════════════════════════════════════
function CompactCard({ mod, variant }: { mod: M; variant: LayoutVariant }) {
  const meta = getModuleMeta(str(mod.type));
  const title = str(mod.title) || meta.label;

  return (
    <CardShell moduleColor={meta.color} rounded="xl" className="group">
      <div className="p-2">
        {/* Header: tiny icon + title + badges */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div
            className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs"
            style={{ background: meta.color + '20', border: `1px solid ${meta.color}30` }}
          >
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold truncate" style={{ color: T.text }}>{title}</div>
          </div>
          <VariantBadge variant={variant} />
          {meta.isGame && <GameBadge />}
        </div>

        {/* Mini preview */}
        <div className="min-h-[24px]">
          <ModulePreview mod={mod} variant={variant} compact={true} />
        </div>
      </div>
    </CardShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
function PresetModuleCard({ mode, module, onEdit, compact, layoutVariant }: PresetModuleCardProps) {
  const variant = layoutVariant || 'A';

  if (mode === 'canvas' || compact) {
    return <CompactCard mod={module} variant={variant} />;
  }

  return <FullCard mode={mode} mod={module} variant={variant} onEdit={onEdit} />;
}

export default PresetModuleCard;
