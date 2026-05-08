import React from 'react';
import type { LayoutVariant, M, ModuleTypeMeta } from './types';
import { T } from './tokens';
import { arr, str, num, getItemCount } from './helpers';
import { alpha } from '@/lib/color-palette';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: EMBED
// ═══════════════════════════════════════════════════════════════════
export function PreviewEmbed({ mod, compact }: { mod: M; compact: boolean }) {
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
// PREVIEW: POLLING
// ═══════════════════════════════════════════════════════════════════
export function PreviewPolling({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
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
          <div key={i} className="rounded-lg p-3 flex items-center gap-2" style={{ background: alpha(color, 0.04), border: `2px solid ${alpha(color, 0.20)}` }}>
            <span className={compact ? 'text-sm' : 'text-base'}>{str(o.icon, '📊')}</span>
            <span className="text-xs font-bold" style={{ color: T.text }}>{str(o.teks)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: COMPARISON
// ═══════════════════════════════════════════════════════════════════
export function PreviewComparison({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
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
export function PreviewCardShowcase({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
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
export function PreviewHotspotImage({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
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
// PREVIEW: TAB-ICONS
// ═══════════════════════════════════════════════════════════════════
export function PreviewTabIcons({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
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
export function PreviewIconExplore({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
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
// PREVIEW: GENERIC FALLBACK
// ═══════════════════════════════════════════════════════════════════
export function PreviewFallback({ mod, meta, compact }: { mod: M; meta: ModuleTypeMeta; compact: boolean }) {
  const count = getItemCount(mod);

  return (
    <div className="flex flex-col items-center justify-center py-3 gap-2" style={{ background: alpha(meta.color, 0.03), borderRadius: 8 }}>
      <div className={`flex items-center gap-1.5`}>
        <span className={compact ? 'text-base' : 'text-xl'}>{meta.icon}</span>
        <span className={`font-semibold ${compact ? 'text-[10px]' : 'text-xs'}`} style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>
      {count > 0 && (
        <div className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: alpha(meta.color, 0.08), color: meta.color }}>
          {count} item
        </div>
      )}
      {/* Mini icon grid */}
      {!compact && count > 0 && (
        <div className="flex flex-wrap gap-1 justify-center max-w-[160px]">
          {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
            <div key={i} className="w-4 h-4 rounded" style={{ background: alpha(meta.color, 0.15) }} />
          ))}
        </div>
      )}
    </div>
  );
}
