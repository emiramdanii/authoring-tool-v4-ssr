/**
 * SILSE — Block Preview Renderer
 * Type-specific visual previews for each block type on the canvas.
 *
 * Task #7: Enhanced canvas block rendering.
 * Each block type gets a unique visual treatment that hints at its
 * real appearance in the student view, while remaining compact enough
 * for the authoring canvas.
 */

'use client';

import React from 'react';
import type { SchemaBlock } from '../../../core/schema/types';
import { estimateBlockHeight } from '../../../core/schema/transaction';
import { getBlockCapabilities } from '../../../core/schema/capability-registry';

// ─── Type Labels (Indonesian) ──────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  'cover': 'Cover',
  'hero': 'Hero',
  'materi-section': 'Materi',
  'def-box': 'Definisi',
  'image-block': 'Gambar',
  'text-block': 'Teks',
  'kuis': 'Kuis',
  'kuis-item': 'Soal',
  'game': 'Game',
  'skenario': 'Skenario',
  'diskusi': 'Diskusi',
  'refleksi': 'Refleksi',
  'petunjuk': 'Petunjuk',
  'penutup': 'Penutup',
  'note-callout': 'Catatan',
  'ftab-container': 'Tab',
  'ftab-item': 'Tab Item',
  'spacer': 'Spasi',
  'divider': 'Pembatas',
};

const VARIANT_LABELS: Record<string, string> = { A: 'Normal', B: 'Compact', C: 'Minimal' };

// ─── Block Icon Map ────────────────────────────────────────────────────
const TYPE_ICONS: Record<string, string> = {
  'cover': '📄',
  'hero': '🌟',
  'materi-section': '📝',
  'def-box': '📖',
  'image-block': '🖼',
  'text-block': '✏',
  'kuis': '❓',
  'kuis-item': '▸',
  'game': '🎮',
  'skenario': '🎭',
  'diskusi': '💬',
  'refleksi': '🪞',
  'petunjuk': '📋',
  'penutup': '🏁',
  'note-callout': '📌',
  'ftab-container': '📑',
  'ftab-item': '▸',
  'spacer': '↕',
  'divider': '—',
};

// ─── Main Block Preview Component ──────────────────────────────────────

export function BlockPreview({ block, compact = false }: { block: SchemaBlock; compact?: boolean }) {
  const height = estimateBlockHeight(block);
  const caps = getBlockCapabilities(block.type);
  const variant = block.variant ?? 'A';
  const icon = TYPE_ICONS[block.type] ?? '▪';
  const label = TYPE_LABELS[block.type] ?? block.type;

  // Variant-driven scaling
  const scaleMap = { A: 1.0, B: 0.85, C: 0.7 };
  const scale = scaleMap[variant];

  if (compact) {
    return <CompactBlockPreview block={block} height={height} icon={icon} label={label} variant={variant} />;
  }

  // Dispatch to type-specific renderer
  switch (block.type) {
    case 'cover':
      return <CoverPreview block={block} height={height} icon={icon} variant={variant} scale={scale} />;
    case 'materi-section':
      return <MateriSectionPreview block={block} height={height} icon={icon} variant={variant} scale={scale} />;
    case 'kuis':
      return <KuisPreview block={block} height={height} icon={icon} variant={variant} scale={scale} />;
    case 'game':
      return <GamePreview block={block} height={height} icon={icon} variant={variant} scale={scale} />;
    case 'def-box':
      return <DefBoxPreview block={block} height={height} icon={icon} variant={variant} scale={scale} />;
    case 'note-callout':
      return <NoteCalloutPreview block={block} height={height} icon={icon} variant={variant} scale={scale} />;
    case 'diskusi':
    case 'refleksi':
      return <DiscussionPreview block={block} height={height} icon={icon} label={label} variant={variant} scale={scale} />;
    case 'image-block':
      return <ImageBlockPreview block={block} height={height} icon={icon} variant={variant} scale={scale} />;
    case 'text-block':
      return <TextBlockPreview block={block} height={height} icon={icon} variant={variant} scale={scale} />;
    case 'petunjuk':
      return <PetunjukPreview block={block} height={height} icon={icon} variant={variant} scale={scale} />;
    case 'ftab-container':
      return <FtabPreview block={block} height={height} icon={icon} variant={variant} scale={scale} />;
    case 'spacer':
      return <SpacerPreview block={block} height={height} />;
    case 'divider':
      return <DividerPreview block={block} height={height} />;
    default:
      return <GenericPreview block={block} height={height} icon={icon} label={label} variant={variant} caps={caps} />;
  }
}

// ─── Compact Preview (for nested children) ─────────────────────────────

function CompactBlockPreview({
  block, height, icon, label, variant,
}: {
  block: SchemaBlock; height: number; icon: string; label: string; variant: string;
}) {
  const caps = getBlockCapabilities(block.type);

  return (
    <div className="rounded border p-1.5 text-[10px] bg-white/80 border-slate-200">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[9px]">{icon}</span>
          <span className="font-medium text-slate-700 truncate">{label}</span>
          {block.title && <span className="text-slate-400 truncate">— {block.title}</span>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[8px] px-1 py-0.5 rounded bg-slate-100 text-slate-400">{variant}</span>
          {caps.isInteractive && (
            <span className="text-[8px] px-1 py-0.5 rounded bg-indigo-100 text-indigo-600">✦</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cover Preview ─────────────────────────────────────────────────────

function CoverPreview({ block, height, icon, variant, scale }: { block: SchemaBlock; height: number; icon: string; variant: string; scale: number }) {
  return (
    <div className="rounded-md border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/50 overflow-hidden" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <div className="p-2 text-center">
        <div className="text-[8px] text-indigo-400 mb-0.5">{icon} Cover</div>
        <div className="text-xs font-bold text-indigo-900 truncate">{block.title ?? 'Judul Cover'}</div>
        {block.subtitle && <div className="text-[9px] text-indigo-600/70 truncate">{block.subtitle}</div>}
        <div className="mt-1 text-[7px] text-indigo-400">
          {variant} · {height}px
        </div>
      </div>
    </div>
  );
}

// ─── Materi Section Preview ────────────────────────────────────────────

function MateriSectionPreview({ block, height, icon, variant, scale }: { block: SchemaBlock; height: number; icon: string; variant: string; scale: number }) {
  const childCount = block.children?.length ?? 0;

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50/80 overflow-hidden" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <div className="px-2 py-1 bg-emerald-100/60 border-b border-emerald-200/50 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-[8px]">{icon}</span>
          <span className="text-[10px] font-medium text-emerald-800 truncate">{block.title ?? 'Materi'}</span>
        </div>
        <div className="flex items-center gap-1 text-[8px] text-emerald-500">
          <span>{variant}</span>
          <span>·</span>
          <span>{height}px</span>
          {childCount > 0 && <span>· {childCount} sub</span>}
        </div>
      </div>
      {block.content && (
        <div className="px-2 py-1 text-[9px] text-emerald-700/70 line-clamp-1">{block.content}</div>
      )}
      {childCount > 0 && (
        <div className="px-2 pb-1 space-y-0.5">
          {block.children!.slice(0, 3).map(child => (
            <div key={child.id} className="text-[8px] text-emerald-600 bg-emerald-100/40 rounded px-1.5 py-0.5 truncate">
              {TYPE_ICONS[child.type] ?? '▪'} {TYPE_LABELS[child.type] ?? child.type}: {child.title ?? child.content ?? '...'}
            </div>
          ))}
          {childCount > 3 && <div className="text-[7px] text-emerald-400">+{childCount - 3} lainnya</div>}
        </div>
      )}
    </div>
  );
}

// ─── Kuis Preview ──────────────────────────────────────────────────────

function KuisPreview({ block, height, icon, variant, scale }: { block: SchemaBlock; height: number; icon: string; variant: string; scale: number }) {
  const itemCount = block.items?.length ?? 0;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50/80 overflow-hidden" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <div className="px-2 py-1 bg-amber-100/60 border-b border-amber-200/50 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-[8px]">{icon}</span>
          <span className="text-[10px] font-medium text-amber-800 truncate">{block.title ?? 'Kuis'}</span>
        </div>
        <div className="flex items-center gap-1 text-[8px] text-amber-500">
          <span>{variant}</span>
          <span>·</span>
          <span>{height}px</span>
          <span>·</span>
          <span className="text-amber-600 font-medium">{itemCount} soal</span>
        </div>
      </div>
      {itemCount > 0 && (
        <div className="px-2 py-1 space-y-0.5">
          {block.items!.slice(0, 2).map((item, i) => (
            <div key={item.id} className="text-[8px] text-amber-700 bg-amber-100/40 rounded px-1.5 py-0.5 truncate">
              {i + 1}. {item.content ?? 'Soal...'}
            </div>
          ))}
          {itemCount > 2 && <div className="text-[7px] text-amber-400">+{itemCount - 2} soal lagi</div>}
        </div>
      )}
    </div>
  );
}

// ─── Game Preview ──────────────────────────────────────────────────────

function GamePreview({ block, height, icon, variant, scale }: { block: SchemaBlock; height: number; icon: string; variant: string; scale: number }) {
  return (
    <div className="rounded-md border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/50 overflow-hidden" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <div className="p-2 text-center">
        <div className="text-lg leading-none mb-0.5">🎮</div>
        <div className="text-[10px] font-bold text-orange-800 truncate">{block.title ?? 'Game Interaktif'}</div>
        {block.content && <div className="text-[8px] text-orange-600/70 truncate">{block.content}</div>}
        <div className="mt-1 flex items-center justify-center gap-1">
          <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-orange-200/60 text-orange-700">{variant}</span>
          <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-orange-200/60 text-orange-700">{height}px</span>
          {block.timer && <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-orange-200/60 text-orange-700">⏱ {block.timer}s</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Def-box Preview ───────────────────────────────────────────────────

function DefBoxPreview({ block, height, icon, variant, scale }: { block: SchemaBlock; height: number; icon: string; variant: string; scale: number }) {
  const borderColor = block.borderColor ?? 'emerald';

  return (
    <div className={`rounded-md border-l-[3px] ${borderColor === 'emerald' ? 'border-l-emerald-400 bg-emerald-50/80' : 'border-l-blue-400 bg-blue-50/80'} border border-slate-200 overflow-hidden`} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <div className="px-2 py-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-medium text-emerald-700">{icon} {block.title ?? 'Definisi'}</span>
          <span className="text-[8px] text-slate-400">{variant} · {height}px</span>
        </div>
        {block.content && <div className="text-[9px] text-emerald-600/80 mt-0.5 line-clamp-2">{block.content}</div>}
      </div>
    </div>
  );
}

// ─── Note Callout Preview ──────────────────────────────────────────────

function NoteCalloutPreview({ block, height, icon, variant, scale }: { block: SchemaBlock; height: number; icon: string; variant: string; scale: number }) {
  return (
    <div className="rounded-md border-l-[3px] border-l-yellow-400 bg-yellow-50/80 border border-yellow-200 overflow-hidden" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <div className="px-2 py-1">
        <div className="flex items-center gap-1">
          <span className="text-[9px]">📌</span>
          <span className="text-[9px] font-medium text-yellow-700">{block.title ?? 'Catatan'}</span>
          <span className="text-[8px] text-yellow-400 ml-auto">{variant} · {height}px</span>
        </div>
        {block.content && <div className="text-[9px] text-yellow-700/70 mt-0.5 line-clamp-1">{block.content}</div>}
      </div>
    </div>
  );
}

// ─── Discussion / Refleksi Preview ─────────────────────────────────────

function DiscussionPreview({ block, height, icon, label, variant, scale }: { block: SchemaBlock; height: number; icon: string; label: string; variant: string; scale: number }) {
  const isDiskusi = block.type === 'diskusi';

  return (
    <div className={`rounded-md border ${isDiskusi ? 'border-teal-200 bg-teal-50/80' : 'border-cyan-200 bg-cyan-50/80'} overflow-hidden`} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <div className="px-2 py-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-medium text-teal-700">{icon} {block.title ?? label}</span>
          <span className="text-[8px] text-teal-400">{variant} · {height}px</span>
        </div>
        {block.content && <div className="text-[9px] text-teal-600/70 mt-0.5 line-clamp-1">{block.content}</div>}
      </div>
    </div>
  );
}

// ─── Image Block Preview ───────────────────────────────────────────────

function ImageBlockPreview({ block, height, icon, variant, scale }: { block: SchemaBlock; height: number; icon: string; variant: string; scale: number }) {
  return (
    <div className="rounded-md border border-pink-200 bg-pink-50/80 overflow-hidden" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <div className="p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-medium text-pink-700">{icon} {block.title ?? 'Gambar'}</span>
          <span className="text-[8px] text-pink-400">{variant} · {height}px</span>
        </div>
        {/* Image placeholder */}
        <div className="bg-pink-100/60 border border-pink-200/50 rounded h-8 flex items-center justify-center">
          {block.imageUrl ? (
            <span className="text-[8px] text-pink-600 truncate">📷 {block.imageUrl.slice(0, 30)}...</span>
          ) : (
            <span className="text-[8px] text-pink-400">📷 Klik untuk upload gambar</span>
          )}
        </div>
        {block.altText && <div className="text-[8px] text-pink-500/60 mt-0.5 truncate">Alt: {block.altText}</div>}
      </div>
    </div>
  );
}

// ─── Text Block Preview ────────────────────────────────────────────────

function TextBlockPreview({ block, height, icon, variant, scale }: { block: SchemaBlock; height: number; icon: string; variant: string; scale: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white/90 overflow-hidden" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <div className="px-2 py-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[9px] font-medium text-slate-600">{icon} {block.title ?? 'Teks'}</span>
          <span className="text-[8px] text-slate-400">{variant} · {height}px</span>
        </div>
        {block.content ? (
          <div className="text-[9px] text-slate-600 line-clamp-2">{block.content}</div>
        ) : (
          <div className="text-[9px] text-slate-300 italic">Klik untuk menulis...</div>
        )}
      </div>
    </div>
  );
}

// ─── Petunjuk Preview ──────────────────────────────────────────────────

function PetunjukPreview({ block, height, icon, variant, scale }: { block: SchemaBlock; height: number; icon: string; variant: string; scale: number }) {
  return (
    <div className="rounded-md border border-blue-200 bg-blue-50/80 overflow-hidden" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <div className="px-2 py-1">
        <div className="flex items-center gap-1">
          <span className="text-[9px]">📋</span>
          <span className="text-[9px] font-medium text-blue-700">{block.title ?? 'Petunjuk'}</span>
          <span className="text-[8px] text-blue-400 ml-auto">{variant} · {height}px</span>
        </div>
        {block.content && <div className="text-[9px] text-blue-600/70 mt-0.5 line-clamp-1">{block.content}</div>}
      </div>
    </div>
  );
}

// ─── FTab Preview ──────────────────────────────────────────────────────

function FtabPreview({ block, height, icon, variant, scale }: { block: SchemaBlock; height: number; icon: string; variant: string; scale: number }) {
  const tabCount = block.tabs?.length ?? 0;

  return (
    <div className="rounded-md border border-sky-200 bg-sky-50/80 overflow-hidden" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      {/* Tab headers */}
      {tabCount > 0 && (
        <div className="flex border-b border-sky-200/50 bg-sky-100/40">
          {block.tabs!.slice(0, 4).map((tab, i) => (
            <div key={tab.id} className={`px-2 py-0.5 text-[8px] ${i === 0 ? 'bg-white text-sky-800 font-medium border-b-2 border-sky-400' : 'text-sky-500'}`}>
              {tab.title ?? `Tab ${i + 1}`}
            </div>
          ))}
          {tabCount > 4 && <div className="px-1 py-0.5 text-[7px] text-sky-400">+{tabCount - 4}</div>}
        </div>
      )}
      <div className="px-2 py-1 flex items-center justify-between">
        <span className="text-[9px] font-medium text-sky-700">{icon} {block.title ?? 'Tab Container'}</span>
        <div className="flex items-center gap-1 text-[8px] text-sky-400">
          <span>{tabCount} tab</span>
          <span>·</span>
          <span>{variant} · {height}px</span>
        </div>
      </div>
    </div>
  );
}

// ─── Spacer Preview ────────────────────────────────────────────────────

function SpacerPreview({ block, height }: { block: SchemaBlock; height: number }) {
  return (
    <div className="rounded border border-dashed border-slate-300 bg-slate-50/50 flex items-center justify-center h-4">
      <span className="text-[7px] text-slate-300">↕ {height}px spasi</span>
    </div>
  );
}

// ─── Divider Preview ───────────────────────────────────────────────────

function DividerPreview({ block, height }: { block: SchemaBlock; height: number }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 h-px bg-slate-300" />
      <span className="text-[7px] text-slate-300">{height}px</span>
      <div className="flex-1 h-px bg-slate-300" />
    </div>
  );
}

// ─── Generic Preview (fallback) ────────────────────────────────────────

function GenericPreview({ block, height, icon, label, variant, caps }: { block: SchemaBlock; height: number; icon: string; label: string; variant: string; caps: ReturnType<typeof getBlockCapabilities> }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/80 p-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-[9px]">{icon}</span>
          <span className="font-medium text-slate-700">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] px-1 py-0.5 rounded bg-slate-100 text-slate-400">{variant}</span>
          <span className="text-[8px] px-1 py-0.5 rounded bg-slate-100 text-slate-400">{height}px</span>
          {caps.isInteractive && (
            <span className="text-[8px] px-1 py-0.5 rounded bg-indigo-100 text-indigo-600">✦ interaktif</span>
          )}
        </div>
      </div>
      {block.title && <div className="text-[9px] text-slate-500 mt-0.5 truncate">{block.title}</div>}
    </div>
  );
}
