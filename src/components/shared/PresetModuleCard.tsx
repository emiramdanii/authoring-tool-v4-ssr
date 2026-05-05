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
  { id: 'senario', icon: '🎭', label: 'Skenario Interaktif', color: '#f9c82e' },
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
  { id: 'skenario', icon: '🎭', label: 'Skenario Interaktif', color: '#f9c82e' },
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
    senario: 'chapters', video: 'pertanyaan', flashcard: 'kartu',
    infografis: 'kartu', 'studi-kasus': 'pertanyaan', timeline: 'events',
    matching: 'pasangan', materi: 'blok', truefalse: 'soal',
    memory: 'pasangan', roda: 'opsi', hero: 'chips',
    kutipan: 'quote', langkah: 'steps', accordion: 'items',
    statistik: 'items', polling: 'opsi', embed: 'url',
    'tab-icons': 'tabs', 'icon-explore': 'items', comparison: 'baris',
    'card-showcase': 'cards', 'hotspot-image': 'hotspots',
    sorting: 'items', spinwheel: 'soal', teambuzzer: 'soal',
    wordsearch: 'kata', skenario: 'chapters', debat: 'pertanyaan',
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
