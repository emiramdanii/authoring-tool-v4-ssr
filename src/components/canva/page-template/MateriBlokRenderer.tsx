'use client';

import React from 'react';
import type { MateriBlok } from '@/store/authoring/types';
import { alpha } from '@/lib/color-palette';

// ═══════════════════════════════════════════════════════════════
// MATERI BLOK RENDERER — Data-driven render per MateriBlok.tipe
//
// Renders 13 block types with distinct visual patterns:
//   teks, definisi, poin, tabel, kutipan, timeline, compare,
//   highlight, infobox, checklist, statistik, studi, gambar
//
// Used by MateriTemplate instead of ModulePreview which
// previously ignored the tipe field and rendered all as cards.
// ═══════════════════════════════════════════════════════════════

interface MateriBlokRendererProps {
  blok: MateriBlok;
  accent: string;
  interactive: boolean;
  compact?: boolean;
}

// ── Type-specific icon map ──────────────────────────────────
const TIPE_ICON: Record<string, string> = {
  teks: '\u{1F4DD}', definisi: '\u{1F4D6}', poin: '\u{1F4CC}', tabel: '\u{1F4CA}',
  kutipan: '\u{1F4AC}', timeline: '\u{1F504}', compare: '\u{2194}\u{FE0F}', highlight: '\u{2728}',
  infobox: '\u{2139}\u{FE0F}', checklist: '\u{2705}', statistik: '\u{1F4C8}', studi: '\u{1F52C}',
  gambar: '\u{1F5BC}\u{FE0F}',
};

// ── Type-specific accent override ───────────────────────────
const TIPE_COLOR: Record<string, string> = {
  definisi: '#f9c82e', kutipan: '#a78bfa', highlight: '#f97316',
  infobox: '#3ecfcf', checklist: '#34d399', statistik: '#60a5fa',
  studi: '#f472b6', gambar: '#fb923c',
};

// Helper: build border string (avoids template literals in JSX)
function bdr(px: number, style: string, col: string) {
  return px + 'px ' + style + ' ' + col;
}

export function MateriBlokRenderer({ blok, accent, interactive, compact = false }: MateriBlokRendererProps) {
  const tipe = blok.tipe || 'teks';
  const color = TIPE_COLOR[tipe] || accent;
  const icon = blok.icon || TIPE_ICON[tipe] || '\u{1F4E6}';

  switch (tipe) {
    case 'teks': return <TeksBlok blok={blok} color={color} icon={icon} compact={compact} />;
    case 'definisi': return <DefinisiBlok blok={blok} color={color} icon={icon} compact={compact} />;
    case 'poin': return <PoinBlok blok={blok} color={color} icon={icon} compact={compact} />;
    case 'tabel': return <TabelBlok blok={blok} color={color} icon={icon} compact={compact} />;
    case 'kutipan': return <KutipanBlok blok={blok} color={color} icon={icon} compact={compact} />;
    case 'timeline': return <TimelineBlok blok={blok} color={color} icon={icon} compact={compact} />;
    case 'compare': return <CompareBlok blok={blok} color={color} icon={icon} compact={compact} />;
    case 'highlight': return <HighlightBlok blok={blok} color={color} icon={icon} compact={compact} />;
    case 'infobox': return <InfoboxBlok blok={blok} color={color} icon={icon} compact={compact} />;
    case 'checklist': return <ChecklistBlok blok={blok} color={color} icon={icon} interactive={interactive} compact={compact} />;
    case 'statistik': return <StatistikBlok blok={blok} color={color} icon={icon} compact={compact} />;
    case 'studi': return <StudiBlok blok={blok} color={color} icon={icon} compact={compact} />;
    case 'gambar': return <GambarBlok blok={blok} color={color} icon={icon} compact={compact} />;
    default: return <TeksBlok blok={blok} color={color} icon={icon} compact={compact} />;
  }
}

// ═══════════════════════════════════════════════════════════════
// SHARED WRAPPER
// ═══════════════════════════════════════════════════════════════

function MateriBlokShell({ children, color, icon, title, badge, style, compact }: {
  children: React.ReactNode; color: string; icon?: string; title?: string; badge?: string; style?: React.CSSProperties; compact?: boolean;
}) {
  const s: React.CSSProperties = {
    background: alpha(color, 0.04),
    border: bdr(1, 'solid', alpha(color, 0.15)),
    ...style,
  };
  return (
    <div className={compact ? 'rounded-lg p-1.5' : 'rounded-lg p-2.5'} style={s}>
      {(icon || title || badge) && (
        <div className={compact ? 'flex items-center gap-1 mb-1' : 'flex items-center gap-1.5 mb-1.5'}>
          {icon && <span className={compact ? 'text-xs' : 'text-sm'}>{icon}</span>}
          {title && <span className={compact ? 'text-[9px] font-bold' : 'text-[11px] font-bold'} style={{ color }}>{title}</span>}
          {badge && (
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full ml-auto"
              style={{ background: alpha(color, 0.1), color, border: bdr(1, 'solid', alpha(color, 0.2)) }}>
              {badge}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 13 BLOCK TYPE RENDERERS
// ═══════════════════════════════════════════════════════════════

// 1. teks — Card dengan paragraf
function TeksBlok({ blok, color, icon, compact }: { blok: MateriBlok; color: string; icon: string; compact?: boolean }) {
  return (
    <MateriBlokShell color={color} icon={icon} title={blok.judul} compact={compact}>
      {blok.isi && (
        <div className={compact ? 'text-[9px] text-white/80 leading-snug whitespace-pre-line line-clamp-4' : 'text-[10px] text-white/80 leading-relaxed whitespace-pre-line'}>{blok.isi}</div>
      )}
    </MateriBlokShell>
  );
}

// 2. definisi — Kotak highlight kuning
function DefinisiBlok({ blok, color, icon, compact }: { blok: MateriBlok; color: string; icon: string; compact?: boolean }) {
  const s: React.CSSProperties = {
    background: alpha(color, 0.08),
    border: bdr(2, 'solid', alpha(color, 0.3)),
    borderLeft: bdr(compact ? 3 : 4, 'solid', color),
  };
  return (
    <div className={compact ? 'rounded-lg p-1.5' : 'rounded-lg p-2.5'} style={s}>
      <div className={compact ? 'flex items-center gap-1 mb-0.5' : 'flex items-center gap-1.5 mb-1'}>
        <span className={compact ? 'text-xs' : 'text-sm'}>{icon}</span>
        <span className={compact ? 'text-[9px] font-black' : 'text-[11px] font-black'} style={{ color }}>{blok.judul || 'Definisi'}</span>
      </div>
      {blok.isi && (
        <div className={compact ? 'text-[9px] text-white/85 leading-snug pl-3 line-clamp-3' : 'text-[10px] text-white/85 leading-relaxed pl-5'}>{blok.isi}</div>
      )}
    </div>
  );
}

// 3. poin — Bullet list
function PoinBlok({ blok, color, icon, compact }: { blok: MateriBlok; color: string; icon: string; compact?: boolean }) {
  const butir = blok.butir || [];
  const visibleButir = compact ? butir.slice(0, 4) : butir;
  return (
    <MateriBlokShell color={color} icon={icon} title={blok.judul} badge={butir.length + ' poin'} compact={compact}>
      {butir.length > 0 ? (
        <ul className={compact ? 'space-y-0.5 pl-1' : 'space-y-1 pl-1'}>
          {visibleButir.map((item, i) => (
            <li key={i} className={compact ? 'flex items-start gap-1 text-[9px] text-white/80 leading-snug' : 'flex items-start gap-1.5 text-[10px] text-white/80 leading-relaxed'}>
              <span className={compact ? 'mt-0.5 w-1 h-1 rounded-full flex-shrink-0' : 'mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0'} style={{ background: color }} />
              {item}
            </li>
          ))}
          {compact && butir.length > 4 && (
            <li className="text-[8px] text-white/40 pl-2">+{butir.length - 4} lainnya</li>
          )}
        </ul>
      ) : (
        <div className="text-[9px] text-white/30 italic">Belum ada butir poin</div>
      )}
    </MateriBlokShell>
  );
}

// 4. tabel — HTML table
function TabelBlok({ blok, color, icon, compact }: { blok: MateriBlok; color: string; icon: string; compact?: boolean }) {
  const baris = blok.baris || [];
  if (baris.length === 0) {
    return (
      <MateriBlokShell color={color} icon={icon} title={blok.judul} compact={compact}>
        <div className="text-[9px] text-white/30 italic">Belum ada data tabel</div>
      </MateriBlokShell>
    );
  }
  const headers = baris[0] || [];
  const rows = baris.slice(1);
  return (
    <MateriBlokShell color={color} icon={icon} title={blok.judul} compact={compact}>
      <div className="overflow-x-auto rounded" style={{ border: bdr(1, 'solid', alpha(color, 0.15)) }}>
        <table className={compact ? 'w-full text-[8px]' : 'w-full text-[9px]'}>
          <thead>
            <tr style={{ background: alpha(color, 0.12) }}>
              {headers.map((h, i) => (
                <th key={i} className="px-2 py-1.5 text-left font-bold" style={{ color }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                {(row as string[]).map((cell, j) => (
                  <td key={j} className="px-2 py-1 text-white/75" style={{ borderTop: bdr(1, 'solid', alpha(color, 0.08)) }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MateriBlokShell>
  );
}

// 5. kutipan — Quote block besar
function KutipanBlok({ blok, color, icon, compact }: { blok: MateriBlok; color: string; icon: string; compact?: boolean }) {
  const s: React.CSSProperties = {
    background: alpha(color, 0.06),
    border: bdr(1, 'solid', alpha(color, 0.15)),
    borderLeft: bdr(compact ? 3 : 4, 'solid', color),
  };
  return (
    <div className={compact ? 'rounded-lg p-1.5 relative' : 'rounded-lg p-3 relative'} style={s}>
      <div className={compact ? 'absolute top-0 left-1 text-xl leading-none opacity-20' : 'absolute top-1 left-2 text-3xl leading-none opacity-20'} style={{ color }}>&ldquo;</div>
      <div className={compact ? 'pl-2 pt-1' : 'pl-4 pt-2'}>
        {blok.isi && <div className={compact ? 'text-[9px] text-white/90 leading-snug italic line-clamp-3' : 'text-[11px] text-white/90 leading-relaxed italic'}>{blok.isi}</div>}
        {blok.karakter && (
          <div className={compact ? 'mt-1 flex items-center gap-1' : 'mt-2 flex items-center gap-1.5'}>
            <span className={compact ? 'text-xs' : 'text-sm'}>{icon}</span>
            <span className="text-[9px] font-bold" style={{ color }}>{'\u2014'} {blok.karakter}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 6. timeline — Step vertikal
function TimelineBlok({ blok, color, icon, compact }: { blok: MateriBlok; color: string; icon: string; compact?: boolean }) {
  const langkah = blok.langkah || [];
  const visibleLangkah = compact ? langkah.slice(0, 3) : langkah;
  return (
    <MateriBlokShell color={color} icon={icon} title={blok.judul} badge={langkah.length + ' langkah'} compact={compact}>
      {langkah.length > 0 ? (
        <div className={compact ? 'space-y-0 pl-1' : 'space-y-0 pl-2'}>
          {visibleLangkah.map((step, i) => (
            <div key={i} className={compact ? 'flex items-start gap-1 relative' : 'flex items-start gap-2 relative'}>
              {i < visibleLangkah.length - 1 && (
                <div className={compact ? 'absolute top-4 left-[5px] w-0.5' : 'absolute top-5 left-[7px] w-0.5'}
                  style={{ height: 'calc(100% - 4px)', background: alpha(color, 0.2) }} />
              )}
              <div className={compact ? 'w-3 h-3 rounded-full flex items-center justify-center text-[6px] font-black flex-shrink-0 mt-0.5' : 'w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black flex-shrink-0 mt-0.5'}
                style={{ background: alpha(color, 0.2), color, border: bdr(compact ? 1.5 : 2, 'solid', color) }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-1">
                  {step.icon && <span className={compact ? 'text-[9px]' : 'text-xs'}>{step.icon}</span>}
                  <span className={compact ? 'text-[9px] font-bold text-white/90' : 'text-[10px] font-bold text-white/90'}>{step.judul}</span>
                </div>
                {!compact && step.isi && <div className="text-[9px] text-white/65 leading-relaxed mt-0.5">{step.isi}</div>}
              </div>
            </div>
          ))}
          {compact && langkah.length > 3 && (
            <div className="text-[8px] text-white/40 pl-4">+{langkah.length - 3} langkah</div>
          )}
        </div>
      ) : (
        <div className="text-[9px] text-white/30 italic">Belum ada langkah</div>
      )}
    </MateriBlokShell>
  );
}

// 7. compare — 2 kolom kiri-kanan
function CompareBlok({ blok, color, icon, compact }: { blok: MateriBlok; color: string; icon: string; compact?: boolean }) {
  const kiri = blok.kiri;
  const kanan = blok.kanan;
  return (
    <MateriBlokShell color={color} icon={icon} title={blok.judul} compact={compact}>
      <div className="grid grid-cols-2 gap-2">
        <div className={compact ? 'rounded-lg p-1.5' : 'rounded-lg p-2'} style={{ background: alpha(color, 0.06), border: bdr(1, 'solid', alpha(color, 0.12)) }}>
          <div className={compact ? 'text-[8px] font-bold mb-0.5' : 'text-[9px] font-bold mb-1'} style={{ color }}>
            {kiri?.icon && <span className="mr-1">{kiri.icon}</span>}{kiri?.judul || 'Kiri'}
          </div>
          {kiri?.isi && <div className={compact ? 'text-[8px] text-white/70 leading-snug line-clamp-3' : 'text-[9px] text-white/70 leading-relaxed'}>{kiri.isi}</div>}
        </div>
        <div className={compact ? 'rounded-lg p-1.5' : 'rounded-lg p-2'} style={{ background: alpha('#3ecfcf', 0.06), border: bdr(1, 'solid', alpha('#3ecfcf', 0.12)) }}>
          <div className={compact ? 'text-[8px] font-bold mb-0.5 text-cyan-400' : 'text-[9px] font-bold mb-1 text-cyan-400'}>
            {kanan?.icon && <span className="mr-1">{kanan.icon}</span>}{kanan?.judul || 'Kanan'}
          </div>
          {kanan?.isi && <div className={compact ? 'text-[8px] text-white/70 leading-snug line-clamp-3' : 'text-[9px] text-white/70 leading-relaxed'}>{kanan.isi}</div>}
        </div>
      </div>
    </MateriBlokShell>
  );
}

// 8. highlight — Card accent dengan warna kustom
function HighlightBlok({ blok, color, icon, compact }: { blok: MateriBlok; color: string; icon: string; compact?: boolean }) {
  const hlColor = blok.warna || color;
  const s: React.CSSProperties = {
    background: alpha(hlColor, 0.08),
    border: bdr(1, 'solid', alpha(hlColor, 0.25)),
    boxShadow: compact ? 'none' : '0 0 12px ' + alpha(hlColor, 0.08),
  };
  return (
    <div className={compact ? 'rounded-lg p-1.5 relative overflow-hidden' : 'rounded-lg p-2.5 relative overflow-hidden'} style={s}>
      {!compact && <div className="absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-8 translate-x-8"
        style={{ background: alpha(hlColor, 0.06) }} />}
      <div className={compact ? 'flex items-center gap-1 mb-1 relative' : 'flex items-center gap-1.5 mb-1.5 relative'}>
        <span className={compact ? 'text-xs' : 'text-sm'}>{icon}</span>
        <span className={compact ? 'text-[9px] font-bold' : 'text-[11px] font-bold'} style={{ color: hlColor }}>{blok.judul || 'Penting'}</span>
      </div>
      {blok.isi && <div className={compact ? 'text-[9px] text-white/85 leading-snug relative line-clamp-3' : 'text-[10px] text-white/85 leading-relaxed relative'}>{blok.isi}</div>}
    </div>
  );
}

// 9. infobox — Info box biru
function InfoboxBlok({ blok, color, icon, compact }: { blok: MateriBlok; color: string; icon: string; compact?: boolean }) {
  const s: React.CSSProperties = {
    background: alpha(color, 0.08),
    border: bdr(1, 'solid', alpha(color, 0.2)),
    borderLeft: bdr(compact ? 3 : 4, 'solid', color),
  };
  return (
    <div className={compact ? 'rounded-lg p-1.5 flex gap-1.5' : 'rounded-lg p-2.5 flex gap-2'} style={s}>
      <span className={compact ? 'text-sm flex-shrink-0 mt-0.5' : 'text-lg flex-shrink-0 mt-0.5'}>{icon}</span>
      <div>
        {blok.judul && <div className={compact ? 'text-[9px] font-bold mb-0.5' : 'text-[10px] font-bold mb-0.5'} style={{ color }}>{blok.judul}</div>}
        {blok.isi && <div className={compact ? 'text-[9px] text-white/80 leading-snug line-clamp-3' : 'text-[10px] text-white/80 leading-relaxed'}>{blok.isi}</div>}
      </div>
    </div>
  );
}

// 10. checklist — Checkbox list
function ChecklistBlok({ blok, color, icon, interactive, compact }: { blok: MateriBlok; color: string; icon: string; interactive: boolean; compact?: boolean }) {
  const butir = blok.butir || [];
  const visibleButir = compact ? butir.slice(0, 4) : butir;
  const [checked, setChecked] = React.useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    if (!interactive) return;
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  return (
    <MateriBlokShell color={color} icon={icon} title={blok.judul} badge={checked.size + '/' + butir.length + ' diceklis'} compact={compact}>
      {butir.length > 0 ? (
        <ul className={compact ? 'space-y-0.5 pl-1' : 'space-y-1 pl-1'}>
          {visibleButir.map((item, i) => (
            <li key={i} className={compact ? 'flex items-start gap-1 text-[9px] leading-snug' : 'flex items-start gap-1.5 text-[10px] leading-relaxed'}>
              <button
                onClick={() => toggle(i)}
                className={(compact ? 'mt-0.5 w-3 h-3' : 'mt-0.5 w-3.5 h-3.5') + ' rounded flex-shrink-0 flex items-center justify-center transition-all ' + (interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default')}
                style={{
                  background: checked.has(i) ? alpha(color, 0.3) : 'transparent',
                  border: bdr(1.5, 'solid', checked.has(i) ? color : alpha(color, 0.3)),
                }}
              >
                {checked.has(i) && <span className={compact ? 'text-[7px] font-bold' : 'text-[8px] font-bold'} style={{ color }}>{'\u2713'}</span>}
              </button>
              <span className={checked.has(i) ? 'text-white/50 line-through' : 'text-white/80'}>{item}</span>
            </li>
          ))}
          {compact && butir.length > 4 && (
            <li className="text-[8px] text-white/40 pl-4">+{butir.length - 4} lainnya</li>
          )}
        </ul>
      ) : (
        <div className="text-[9px] text-white/30 italic">Belum ada butir checklist</div>
      )}
    </MateriBlokShell>
  );
}

// 11. statistik — Angka besar + label
function StatistikBlok({ blok, color, icon, compact }: { blok: MateriBlok; color: string; icon: string; compact?: boolean }) {
  const items = blok.items || [];
  return (
    <MateriBlokShell color={color} icon={icon} title={blok.judul} compact={compact}>
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, i) => {
            const ic = item.warna || color;
            return (
              <div key={i} className={compact ? 'rounded-lg p-1.5 text-center' : 'rounded-lg p-2 text-center'}
                style={{ background: alpha(ic, 0.06), border: bdr(1, 'solid', alpha(ic, 0.15)) }}>
                <div className="flex items-center justify-center gap-1">
                  {item.icon && <span className="text-sm">{item.icon}</span>}
                  <span className={compact ? 'text-sm font-black' : 'text-lg font-black'} style={{ color: ic }}>{item.angka || '\u2014'}</span>
                  {item.satuan && <span className="text-[8px] text-white/40">{item.satuan}</span>}
                </div>
                {item.label && <div className="text-[8px] text-white/60 mt-0.5">{item.label}</div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-[9px] text-white/30 italic">Belum ada data statistik</div>
      )}
    </MateriBlokShell>
  );
}

// 12. studi — Kasus + pertanyaan
function StudiBlok({ blok, color, icon, compact }: { blok: MateriBlok; color: string; icon: string; compact?: boolean }) {
  const s: React.CSSProperties = {
    background: alpha(color, 0.04),
    border: bdr(1, 'solid', alpha(color, 0.15)),
    borderLeft: bdr(compact ? 3 : 4, 'solid', color),
  };
  return (
    <div className={compact ? 'rounded-lg p-1.5' : 'rounded-lg p-2.5'} style={s}>
      <div className={compact ? 'flex items-center gap-1 mb-1' : 'flex items-center gap-1.5 mb-2'}>
        <span className={compact ? 'text-xs' : 'text-sm'}>{icon}</span>
        <span className={compact ? 'text-[9px] font-bold' : 'text-[11px] font-bold'} style={{ color }}>{blok.judul || 'Studi Kasus'}</span>
      </div>
      {blok.situasi && (
        <div className={compact ? 'rounded p-1.5 mb-1 bg-white/5 border border-white/10' : 'rounded-lg p-2 mb-2 bg-white/5 border border-white/10'}>
          <div className="text-[9px] font-bold text-white/50 mb-1">{'\u{1F4CB}'} Situasi</div>
          <div className={compact ? 'text-[9px] text-white/80 leading-snug line-clamp-2' : 'text-[10px] text-white/80 leading-relaxed'}>{blok.situasi}</div>
        </div>
      )}
      {blok.pertanyaan && (
        <div className={compact ? 'rounded p-1.5 mb-0.5' : 'rounded-lg p-2 mb-1'} style={{ background: alpha(color, 0.06), border: bdr(1, 'solid', alpha(color, 0.15)) }}>
          <div className="text-[9px] font-bold mb-1" style={{ color }}>{'\u2753'} Pertanyaan</div>
          <div className={compact ? 'text-[9px] text-white/85 leading-snug line-clamp-2' : 'text-[10px] text-white/85 leading-relaxed'}>{blok.pertanyaan}</div>
        </div>
      )}
      {blok.pesan && (
        <div className={compact ? 'text-[8px] text-white/50 italic mt-1 pl-1.5' : 'text-[9px] text-white/50 italic mt-1.5 pl-2'} style={{ borderLeft: bdr(compact ? 1.5 : 2, 'solid', alpha(color, 0.3)) }}>
          {'\u{1F4A1}'} {blok.pesan}
        </div>
      )}
    </div>
  );
}

// 13. gambar — Image + caption
function GambarBlok({ blok, color, icon, compact }: { blok: MateriBlok; color: string; icon: string; compact?: boolean }) {
  const url = blok.isi; // isi contains URL for gambar type
  return (
    <MateriBlokShell color={color} icon={icon} title={blok.judul} compact={compact}>
      {url ? (
        <div className="rounded overflow-hidden">
          <img src={url} alt={blok.judul || 'Gambar'} className="w-full rounded"
            style={{ maxHeight: compact ? 100 : 200, objectFit: 'cover' }} loading="lazy" />
          {blok.style && <div className="text-[8px] text-white/40 text-center mt-1 italic">{blok.style}</div>}
        </div>
      ) : (
        <div className={compact ? 'h-16 rounded flex flex-col items-center justify-center' : 'h-24 rounded flex flex-col items-center justify-center'}
          style={{ background: alpha(color, 0.06), border: bdr(1, 'dashed', alpha(color, 0.3)) }}>
          <span className="text-2xl mb-1">{icon}</span>
          <span className="text-[8px] text-white/40">Masukkan URL gambar di field Isi</span>
        </div>
      )}
    </MateriBlokShell>
  );
}
