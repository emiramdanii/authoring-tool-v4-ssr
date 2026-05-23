'use client';

import React from 'react';
import { BookOpen, Quote, List, Table2, Clock, GitCompare, Zap,
         Info, CheckSquare, TrendingUp, BookMarked, Image, Type } from 'lucide-react';
import type { MateriBlokBlock, MateriBlokTipe } from '../../schema/types';
import type { TokenResolver } from '../types';
import { RichText } from './RichText';
import { PremiumBlockWrapper, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';

// ═══════════════════════════════════════════════════════════════════
// MATERI BLOK RENDERER — 13 content patterns for MateriSection
// ═══════════════════════════════════════════════════════════════════
// Renders all 13 MateriBlok.tipe patterns inside MateriSection:
//   teks, definisi, poin, tabel, kutipan, gambar, timeline,
//   highlight, compare, infobox, checklist, statistik, studi
//
// ROADMAP Phase 18.1: "Buat helper renderBlok(blok) dengan 13 pola"
// This IS the BlokRenderer — a single renderer that switches on tipe.
// ═══════════════════════════════════════════════════════════════════

// ── Type badge colors and labels per tipe ────────────────────────
const TIPE_META: Record<MateriBlokTipe, { label: string; color: string; icon: React.ReactNode }> = {
  teks:      { label: 'Paragraf',  color: 'y', icon: <Type size={10} /> },
  definisi:  { label: 'Definisi',  color: 'y', icon: <BookOpen size={10} /> },
  poin:      { label: 'Poin',      color: 'c', icon: <List size={10} /> },
  tabel:     { label: 'Tabel',     color: 'p', icon: <Table2 size={10} /> },
  kutipan:   { label: 'Kutipan',   color: 'g', icon: <Quote size={10} /> },
  gambar:    { label: 'Gambar',    color: 'c', icon: <Image size={10} /> },
  timeline:  { label: 'Timeline',  color: 'c', icon: <Clock size={10} /> },
  highlight: { label: 'Highlight', color: 'y', icon: <Zap size={10} /> },
  compare:   { label: 'Perbandingan', color: 'p', icon: <GitCompare size={10} /> },
  infobox:   { label: 'Info',      color: 'c', icon: <Info size={10} /> },
  checklist: { label: 'Checklist', color: 'g', icon: <CheckSquare size={10} /> },
  statistik: { label: 'Statistik', color: 'c', icon: <TrendingUp size={10} /> },
  studi:     { label: 'Studi Kasus', color: 'r', icon: <BookMarked size={10} /> },
};

// ── 1. TEKS — Card dengan paragraf ──────────────────────────────
function RenderTeks({ block, tokens, isCompact }: { block: MateriBlokBlock; tokens: TokenResolver; isCompact: boolean }) {
  return (
    <div className="rounded-xl" style={{ background: tokens.colorAlpha('y', 0.06), border: `1px solid ${tokens.colorAlpha('y', 0.12)}`, ...tokens.iosCardPadding(isCompact) }}>
      {block.judul && (
        <h3 className="font-bold mb-2" style={{ fontSize: isCompact ? '13px' : '15px', color: tokens.color('text') }}>
          {block.judul}
        </h3>
      )}
      <div style={{ fontSize: isCompact ? '12px' : '14px', lineHeight: 1.7, color: tokens.color('text') }}>
        <RichText content={block.isi || ''} />
      </div>
    </div>
  );
}

// ── 2. DEFINISI — Kotak highlight kuning ─────────────────────────
function RenderDefinisi({ block, tokens, isCompact }: { block: MateriBlokBlock; tokens: TokenResolver; isCompact: boolean }) {
  const colorKey = block.warna || 'y';
  return (
    <div className="rounded-xl" style={{ background: tokens.colorAlpha(colorKey, 0.08), border: `1px solid ${tokens.colorAlpha(colorKey, 0.25)}`, borderLeft: `4px solid ${tokens.color(colorKey)}` }}>
      <div style={{ ...tokens.iosCardPadding(isCompact) }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: tokens.colorAlpha(colorKey, 0.2) }}>
            <BookOpen size={10} style={{ color: tokens.color(colorKey) }} />
          </div>
          <PremiumBadge tokens={tokens} accent={colorKey} variant="glass">
            Definisi
          </PremiumBadge>
          {block.judul && (
            <span className="font-bold" style={{ fontSize: isCompact ? '12px' : '14px', color: tokens.color('text') }}>
              {block.judul}
            </span>
          )}
        </div>
        <div style={{ fontSize: isCompact ? '12px' : '14px', lineHeight: 1.7, color: tokens.color('text'), paddingLeft: '8px', borderLeft: `2px solid ${tokens.colorAlpha(colorKey, 0.3)}` }}>
          <RichText content={block.isi || ''} />
        </div>
      </div>
    </div>
  );
}

// ── 3. POIN — Bullet list ───────────────────────────────────────
function RenderPoin({ block, tokens, isCompact }: { block: MateriBlokBlock; tokens: TokenResolver; isCompact: boolean }) {
  const butir = block.butir || [];
  return (
    <div className="rounded-xl" style={{ background: tokens.color('card'), border: `1px solid ${tokens.colorAlpha('c', 0.15)}`, boxShadow: tokens.raw.shadow.card }}>
      {block.judul && (
        <div className="font-bold" style={{ ...tokens.iosCardPadding(isCompact), paddingBottom: isCompact ? 6 : 8, fontSize: isCompact ? '13px' : '15px', color: tokens.color('text') }}>
          {block.judul}
        </div>
      )}
      <div style={{ ...tokens.iosContentPadding(isCompact), paddingTop: isCompact ? 6 : 8, paddingBottom: isCompact ? 10 : 14 }} className="flex flex-col gap-2">
        {butir.map((b, i) => (
          <div key={i} className="flex items-start gap-2.5" style={{ ...tokens.iosNestedPadding(isCompact), background: tokens.colorAlpha('c', 0.04), borderRadius: tokens.radius('sm') }}>
            <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: tokens.colorAlpha('c', 0.2), color: tokens.color('c'), fontSize: isCompact ? '9px' : '10px' }}>
              {i + 1}
            </span>
            <span style={{ fontSize: isCompact ? '12px' : '13px', color: tokens.color('text'), lineHeight: 1.6 }}>
              <RichText content={b} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 4. TABEL — HTML table ───────────────────────────────────────
function RenderTabel({ block, tokens, isCompact }: { block: MateriBlokBlock; tokens: TokenResolver; isCompact: boolean }) {
  const baris = block.baris || [];
  if (baris.length === 0) return null;
  const hasHeader = baris.length > 1;
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: tokens.color('card'), border: `1px solid ${tokens.colorAlpha('p', 0.15)}`, boxShadow: tokens.raw.shadow.card }}>
      {block.judul && (
        <div className="font-bold" style={{ ...tokens.iosCardPadding(isCompact), paddingBottom: isCompact ? 6 : 8, fontSize: isCompact ? '13px' : '15px', color: tokens.color('text') }}>
          {block.judul}
        </div>
      )}
      <div style={{ ...tokens.iosContentPadding(isCompact), paddingTop: 0, paddingBottom: isCompact ? 10 : 14, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isCompact ? '11px' : '13px' }}>
          <tbody>
            {baris.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: `1px solid ${tokens.colorAlpha('p', 0.1)}` }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{
                    ...tokens.iosNestedPadding(isCompact),
                    color: tokens.color('text'),
                    fontWeight: ri === 0 && hasHeader ? 700 : 400,
                    background: ri === 0 && hasHeader ? tokens.colorAlpha('p', 0.08) : undefined,
                  }}>
                    <RichText content={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 5. KUTIPAN — Quote block besar ──────────────────────────────
function RenderKutipan({ block, tokens, isCompact }: { block: MateriBlokBlock; tokens: TokenResolver; isCompact: boolean }) {
  return (
    <div className="rounded-xl" style={{ background: tokens.colorAlpha('g', 0.06), border: `1px solid ${tokens.colorAlpha('g', 0.15)}`, borderLeft: `4px solid ${tokens.color('g')}` }}>
      <div style={{ ...tokens.iosCardPadding(isCompact) }}>
        <Quote size={isCompact ? 16 : 22} style={{ color: tokens.colorAlpha('g', 0.4), marginBottom: '8px' }} />
        <div style={{ fontSize: isCompact ? '13px' : '16px', fontStyle: 'italic', lineHeight: 1.7, color: tokens.color('text') }}>
          &ldquo;<RichText content={block.isi || ''} />&rdquo;
        </div>
        {block.karakter && (
          <div className="mt-3 font-bold" style={{ fontSize: isCompact ? '11px' : '13px', color: tokens.color('g') }}>
            — {block.karakter}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 6. GAMBAR — Image + caption ─────────────────────────────────
function RenderGambar({ block, tokens, isCompact }: { block: MateriBlokBlock; tokens: TokenResolver; isCompact: boolean }) {
  const url = block.isi || '';
  if (!url) return (
    <div className="rounded-xl flex items-center justify-center" style={{ background: tokens.colorAlpha('c', 0.06), border: `1px dashed ${tokens.colorAlpha('c', 0.2)}`, height: isCompact ? '80px' : '160px' }}>
      <div className="text-center">
        <Image size={isCompact ? 20 : 32} style={{ color: tokens.muted(0.4), margin: '0 auto' }} />
        <div style={{ fontSize: '11px', color: tokens.muted(0.5), marginTop: '4px' }}>Masukkan URL gambar</div>
      </div>
    </div>
  );
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tokens.colorAlpha('c', 0.15)}` }}>
      <img src={url} alt={block.judul || 'Gambar'} style={{ width: '100%', maxHeight: isCompact ? '120px' : '280px', objectFit: 'cover' }} />
      {block.judul && (
        <div style={{ ...tokens.iosNestedPadding(isCompact), fontSize: isCompact ? '11px' : '12px', color: tokens.muted(0.7), background: tokens.colorAlpha('c', 0.04) }}>
          {block.judul}
        </div>
      )}
    </div>
  );
}

// ── 7. TIMELINE — Step vertikal ─────────────────────────────────
function RenderTimeline({ block, tokens, isCompact }: { block: MateriBlokBlock; tokens: TokenResolver; isCompact: boolean }) {
  const langkah = block.langkah || [];
  return (
    <div className="rounded-xl" style={{ background: tokens.color('card'), border: `1px solid ${tokens.colorAlpha('c', 0.15)}`, boxShadow: tokens.raw.shadow.card }}>
      {block.judul && (
        <div className="font-bold flex items-center gap-2" style={{ ...tokens.iosCardPadding(isCompact), paddingBottom: isCompact ? 6 : 8, fontSize: isCompact ? '13px' : '15px', color: tokens.color('text') }}>
          <Clock size={isCompact ? 12 : 14} style={{ color: tokens.color('c') }} />
          {block.judul}
        </div>
      )}
      <div style={{ ...tokens.iosContentPadding(isCompact), paddingTop: isCompact ? 6 : 8, paddingBottom: isCompact ? 10 : 14 }} className="flex flex-col gap-0">
        {langkah.map((step, i) => (
          <div key={i} className="flex gap-3" style={{ position: 'relative' }}>
            {/* Vertical line */}
            {i < langkah.length - 1 && (
              <div style={{ position: 'absolute', left: isCompact ? '9px' : '11px', top: '22px', bottom: '-4px', width: '2px', background: tokens.colorAlpha('c', 0.2) }} />
            )}
            {/* Step dot */}
            <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
              style={{ background: tokens.colorAlpha('c', 0.2), border: `2px solid ${tokens.color('c')}`, zIndex: 1, fontSize: isCompact ? '8px' : '10px' }}>
              {step.icon || (i + 1)}
            </div>
            {/* Step content */}
            <div className="flex-1 min-w-0" style={{ paddingBottom: isCompact ? '8px' : '12px' }}>
              <div className="font-bold" style={{ fontSize: isCompact ? '12px' : '13px', color: tokens.color('text') }}>
                {step.judul}
              </div>
              {step.isi && (
                <div style={{ fontSize: isCompact ? '11px' : '12px', color: tokens.muted(0.8), lineHeight: 1.5 }}>
                  <RichText content={step.isi} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 8. HIGHLIGHT — Card accent ──────────────────────────────────
function RenderHighlight({ block, tokens, isCompact }: { block: MateriBlokBlock; tokens: TokenResolver; isCompact: boolean }) {
  const colorKey = block.warna || 'y';
  const resolvedColor = tokens.color(colorKey);
  return (
    <MicroInteraction tokens={tokens} accent={colorKey} effect="glow">
    <div className="rounded-xl" style={{ background: `linear-gradient(135deg, ${tokens.colorAlpha(colorKey, 0.12)}, ${tokens.colorAlpha(colorKey, 0.04)})`, border: `1px solid ${tokens.colorAlpha(colorKey, 0.25)}`, boxShadow: `0 4px 16px ${tokens.colorAlpha(colorKey, 0.12)}` }}>
      <div style={{ ...tokens.iosCardPadding(isCompact) }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontSize: isCompact ? '14px' : '18px' }}>{block.icon || '⚡'}</span>
          {block.judul && (
            <h3 className="font-bold" style={{ fontSize: isCompact ? '13px' : '15px', color: resolvedColor }}>
              {block.judul}
            </h3>
          )}
        </div>
        <div style={{ fontSize: isCompact ? '12px' : '14px', lineHeight: 1.7, color: tokens.color('text') }}>
          <RichText content={block.isi || ''} />
        </div>
      </div>
    </div>
    </MicroInteraction>
  );
}

// ── 9. COMPARE — 2 kolom kiri-kanan ─────────────────────────────
function RenderCompare({ block, tokens, isCompact }: { block: MateriBlokBlock; tokens: TokenResolver; isCompact: boolean }) {
  return (
    <div className="rounded-xl" style={{ background: tokens.color('card'), border: `1px solid ${tokens.colorAlpha('p', 0.15)}`, boxShadow: tokens.raw.shadow.card }}>
      {block.judul && (
        <div className="font-bold flex items-center gap-2" style={{ ...tokens.iosCardPadding(isCompact), paddingBottom: isCompact ? 6 : 8, fontSize: isCompact ? '13px' : '15px', color: tokens.color('text') }}>
          <GitCompare size={isCompact ? 12 : 14} style={{ color: tokens.color('p') }} />
          {block.judul}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3" style={{ ...tokens.iosContentPadding(isCompact), paddingTop: isCompact ? 6 : 8, paddingBottom: isCompact ? 10 : 14 }}>
        {/* Kiri */}
        <div className="rounded-lg" style={{ background: tokens.colorAlpha('c', 0.06), border: `1px solid ${tokens.colorAlpha('c', 0.12)}`, ...tokens.iosNestedPadding(isCompact) }}>
          {block.kiri?.icon && <span style={{ fontSize: isCompact ? '12px' : '16px' }}>{block.kiri.icon}</span>}
          {block.kiri?.judul && <div className="font-bold mt-1" style={{ fontSize: isCompact ? '11px' : '13px', color: tokens.color('c') }}>{block.kiri.judul}</div>}
          {block.kiri?.isi && <div style={{ fontSize: isCompact ? '11px' : '12px', color: tokens.color('text'), lineHeight: 1.5 }}><RichText content={block.kiri.isi} /></div>}
        </div>
        {/* Kanan */}
        <div className="rounded-lg" style={{ background: tokens.colorAlpha('y', 0.06), border: `1px solid ${tokens.colorAlpha('y', 0.12)}`, ...tokens.iosNestedPadding(isCompact) }}>
          {block.kanan?.icon && <span style={{ fontSize: isCompact ? '12px' : '16px' }}>{block.kanan.icon}</span>}
          {block.kanan?.judul && <div className="font-bold mt-1" style={{ fontSize: isCompact ? '11px' : '13px', color: tokens.color('y') }}>{block.kanan.judul}</div>}
          {block.kanan?.isi && <div style={{ fontSize: isCompact ? '11px' : '12px', color: tokens.color('text'), lineHeight: 1.5 }}><RichText content={block.kanan.isi} /></div>}
        </div>
      </div>
    </div>
  );
}

// ── 10. INFOBOX — Info box biru ──────────────────────────────────
function RenderInfobox({ block, tokens, isCompact }: { block: MateriBlokBlock; tokens: TokenResolver; isCompact: boolean }) {
  const styleKey = block.infoboxStyle || 'info';
  const colorMap: Record<string, string> = { info: 'c', tip: 'g', warning: 'y' };
  const colorKey = colorMap[styleKey] || 'c';
  return (
    <div className="rounded-xl" style={{ background: tokens.colorAlpha(colorKey, 0.08), border: `1px solid ${tokens.colorAlpha(colorKey, 0.2)}`, borderLeft: `4px solid ${tokens.color(colorKey)}` }}>
      <div style={{ ...tokens.iosCardPadding(isCompact) }}>
        <div className="flex items-center gap-2 mb-2">
          <Info size={isCompact ? 12 : 14} style={{ color: tokens.color(colorKey) }} />
          <span className="font-bold uppercase" style={{ fontSize: isCompact ? '9px' : '10px', letterSpacing: '0.05em', color: tokens.color(colorKey) }}>
            {styleKey === 'tip' ? 'Tips' : styleKey === 'warning' ? 'Perhatian' : 'Info'}
          </span>
          {block.judul && (
            <span className="font-bold" style={{ fontSize: isCompact ? '12px' : '14px', color: tokens.color('text') }}>
              {block.judul}
            </span>
          )}
        </div>
        <div style={{ fontSize: isCompact ? '12px' : '13px', lineHeight: 1.7, color: tokens.color('text') }}>
          <RichText content={block.isi || ''} />
        </div>
      </div>
    </div>
  );
}

// ── 11. CHECKLIST — Checkbox list ───────────────────────────────
function RenderChecklist({ block, tokens, isCompact }: { block: MateriBlokBlock; tokens: TokenResolver; isCompact: boolean }) {
  const butir = block.butir || [];
  return (
    <div className="rounded-xl" style={{ background: tokens.color('card'), border: `1px solid ${tokens.colorAlpha('g', 0.15)}`, boxShadow: tokens.raw.shadow.card }}>
      {block.judul && (
        <div className="font-bold flex items-center gap-2" style={{ ...tokens.iosCardPadding(isCompact), paddingBottom: isCompact ? 6 : 8, fontSize: isCompact ? '13px' : '15px', color: tokens.color('text') }}>
          <CheckSquare size={isCompact ? 12 : 14} style={{ color: tokens.color('g') }} />
          {block.judul}
        </div>
      )}
      <div style={{ ...tokens.iosContentPadding(isCompact), paddingTop: isCompact ? 6 : 8, paddingBottom: isCompact ? 10 : 14 }} className="flex flex-col gap-2">
        {butir.map((b, i) => (
          <label key={i} className="flex items-start gap-2.5 cursor-pointer" style={{ ...tokens.iosNestedPadding(isCompact), background: tokens.colorAlpha('g', 0.04), borderRadius: tokens.radius('sm') }}>
            <input type="checkbox" className="mt-0.5 flex-shrink-0" style={{ accentColor: tokens.color('g') }} />
            <span style={{ fontSize: isCompact ? '12px' : '13px', color: tokens.color('text'), lineHeight: 1.5 }}>
              <RichText content={b} />
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── 12. STATISTIK — Angka besar + label ─────────────────────────
function RenderStatistik({ block, tokens, isCompact }: { block: MateriBlokBlock; tokens: TokenResolver; isCompact: boolean }) {
  const items = block.items || [];
  return (
    <div className="rounded-xl" style={{ background: tokens.color('card'), border: `1px solid ${tokens.colorAlpha('c', 0.15)}`, boxShadow: tokens.raw.shadow.card }}>
      {block.judul && (
        <div className="font-bold flex items-center gap-2" style={{ ...tokens.iosCardPadding(isCompact), paddingBottom: isCompact ? 6 : 8, fontSize: isCompact ? '13px' : '15px', color: tokens.color('text') }}>
          <TrendingUp size={isCompact ? 12 : 14} style={{ color: tokens.color('c') }} />
          {block.judul}
        </div>
      )}
      <div className="grid gap-3" style={{ ...tokens.iosContentPadding(isCompact), paddingTop: isCompact ? 6 : 8, paddingBottom: isCompact ? 10 : 14, gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)` }}>
        {items.map((item, i) => {
          const colorKey = item.warna || 'c';
          return (
            <div key={i} className="rounded-lg text-center" style={{ background: tokens.colorAlpha(colorKey, 0.08), border: `1px solid ${tokens.colorAlpha(colorKey, 0.15)}`, ...tokens.iosCardPadding(isCompact), paddingLeft: isCompact ? 8 : 14, paddingRight: isCompact ? 8 : 14 }}>
              {item.icon && <div style={{ fontSize: isCompact ? '14px' : '20px', marginBottom: '4px' }}>{item.icon}</div>}
              <div className="font-black" style={{ fontSize: isCompact ? '18px' : '28px', color: tokens.color(colorKey), lineHeight: 1.1 }}>
                {item.angka || '0'}
                {item.satuan && <span style={{ fontSize: isCompact ? '10px' : '13px', fontWeight: 500 }}>{item.satuan}</span>}
              </div>
              {item.label && <div style={{ fontSize: isCompact ? '10px' : '12px', color: tokens.muted(0.7), marginTop: '4px' }}>{item.label}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 13. STUDI — Kasus + pertanyaan ──────────────────────────────
function RenderStudi({ block, tokens, isCompact }: { block: MateriBlokBlock; tokens: TokenResolver; isCompact: boolean }) {
  return (
    <div className="rounded-xl" style={{ background: tokens.color('card'), border: `1px solid ${tokens.colorAlpha('r', 0.15)}`, boxShadow: tokens.raw.shadow.card }}>
      {/* Header */}
      <div style={{ ...tokens.iosCardPadding(isCompact), background: tokens.colorAlpha('r', 0.06), borderBottom: `1px solid ${tokens.colorAlpha('r', 0.1)}` }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: isCompact ? '14px' : '18px' }}>{block.icon || '📖'}</span>
          <span className="font-bold" style={{ fontSize: isCompact ? '13px' : '15px', color: tokens.color('text') }}>
            {block.judul || 'Studi Kasus'}
          </span>
          <PremiumBadge tokens={tokens} accent="r" variant="glass">Kasus</PremiumBadge>
        </div>
      </div>
      {/* Situasi */}
      {block.situasi && (
        <div style={{ ...tokens.iosCardPadding(isCompact) }}>
          <div className="font-bold mb-1" style={{ fontSize: isCompact ? '10px' : '11px', color: tokens.color('r'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>Situasi</div>
          <div style={{ fontSize: isCompact ? '12px' : '13px', lineHeight: 1.7, color: tokens.color('text') }}>
            <RichText content={block.situasi} />
          </div>
        </div>
      )}
      {/* Pertanyaan */}
      {block.pertanyaan && (
        <div style={{ ...tokens.iosCardPadding(isCompact), background: tokens.colorAlpha('y', 0.04), borderTop: `1px solid ${tokens.colorAlpha('y', 0.08)}` }}>
          <div className="font-bold mb-1" style={{ fontSize: isCompact ? '10px' : '11px', color: tokens.color('y'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pertanyaan</div>
          <div style={{ fontSize: isCompact ? '12px' : '13px', lineHeight: 1.6, color: tokens.color('text') }}>
            <RichText content={block.pertanyaan} />
          </div>
        </div>
      )}
      {/* Pesan */}
      {block.pesan && (
        <div style={{ ...tokens.iosContentPadding(isCompact), paddingTop: isCompact ? 6 : 8, paddingBottom: isCompact ? 10 : 14 }}>
          <div className="rounded-lg" style={{ background: tokens.colorAlpha('g', 0.06), border: `1px solid ${tokens.colorAlpha('g', 0.12)}`, ...tokens.iosNestedPadding(isCompact) }}>
            <span style={{ fontSize: isCompact ? '10px' : '11px', color: tokens.color('g'), fontWeight: 700 }}>💡 </span>
            <span style={{ fontSize: isCompact ? '11px' : '12px', color: tokens.color('text'), lineHeight: 1.5 }}>
              <RichText content={block.pesan} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dispatcher: maps tipe → renderer component ──────────────────
const TIPE_RENDERERS: Record<MateriBlokTipe, React.ComponentType<{ block: MateriBlokBlock; tokens: TokenResolver; isCompact: boolean }>> = {
  teks: RenderTeks,
  definisi: RenderDefinisi,
  poin: RenderPoin,
  tabel: RenderTabel,
  kutipan: RenderKutipan,
  gambar: RenderGambar,
  timeline: RenderTimeline,
  highlight: RenderHighlight,
  compare: RenderCompare,
  infobox: RenderInfobox,
  checklist: RenderChecklist,
  statistik: RenderStatistik,
  studi: RenderStudi,
};

// ── Main Component ───────────────────────────────────────────────
export const MateriBlokRenderer = React.memo(function MateriBlokRenderer({ block, tokens, isCompact, mode, interactive, isEditing, compression, pageIndex }: {
  block: MateriBlokBlock;
  tokens: TokenResolver;
  isCompact?: boolean;
  /** Render mode — accepted for interface compatibility, not used by MateriBlok */
  mode?: import('../types').SchemaRenderMode;
  /** Interactive mode — accepted for interface compatibility, not used by MateriBlok */
  interactive?: boolean;
  /** Editing mode — accepted for interface compatibility, not used by MateriBlok */
  isEditing?: boolean;
  /** Compression decision — accepted for interface compatibility, not used by MateriBlok */
  compression?: import('../../layout/CompressionEngine').CompressionDecision;
  /** Page index — accepted for interface compatibility, not used by MateriBlok */
  pageIndex?: number;
}) {
  const tipe = block.tipe || 'teks';
  const meta = TIPE_META[tipe];
  const Renderer = TIPE_RENDERERS[tipe];

  if (!Renderer) {
    return (
      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
        Unknown materi tipe: <strong>{tipe}</strong>
      </div>
    );
  }

  return (
    <PremiumBlockWrapper tokens={tokens} accent={meta.color} staggerIndex={0}>
      <Renderer block={block} tokens={tokens} isCompact={!!isCompact} />
    </PremiumBlockWrapper>
  );
});
