'use client';

import { useState } from 'react';
import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import PresetModuleCard, { type LayoutVariant } from '@/components/shared/PresetModuleCard';
import { TemplateNavButton } from './TemplateNavButton';

// ── Materi Template ───────────────────────────────────────────
// Renders blok content conditionally based on `tipe` field:
// - definisi: simple title + text card
// - highlight: accent-colored card with icon + warna
// - poin: bullet point list (butir)
// - timeline: step-by-step visual (langkah)
// - tabel: table grid (baris)
// - perbandingan: side-by-side comparison (kiri/kanan)
// - statistik: stats grid (items)
// Also renders modul cards.

type ActiveTab = 'blok' | 'modul';

// ── Block renderer by tipe ────────────────────────────────────

function BlokCard({ b, accent, variant }: { b: Record<string, unknown>; accent: string; variant?: string }) {
  const tipe = String(b.tipe || 'definisi');
  const judul = String(b.judul || '');
  const isi = String(b.isi || '');
  const icon = String(b.icon || '');
  const warna = String(b.warna || accent);

  // ── Definisi: simple card with title + text ──
  if (tipe === 'definisi') {
    return (
      <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-1.5 mb-1">
          {icon && <span className="text-base">{icon}</span>}
          {judul && <span className="text-[11px] font-bold text-white">{judul}</span>}
        </div>
        {isi && <div className="text-[9px] text-white/70 leading-relaxed line-clamp-5">{isi}</div>}
      </div>
    );
  }

  // ── Highlight: accent-colored card ──
  if (tipe === 'highlight') {
    return (
      <div className="p-2.5 rounded-lg" style={{
        background: alpha(warna, 0.08),
        border: `1px solid ${alpha(warna, 0.25)}`,
      }}>
        <div className="flex items-center gap-1.5 mb-1">
          {icon && <span className="text-base">{icon}</span>}
          {judul && <span className="text-[11px] font-bold" style={{ color: warna }}>{judul}</span>}
        </div>
        {isi && <div className="text-[9px] text-white/80 leading-relaxed line-clamp-5">{isi}</div>}
      </div>
    );
  }

  // ── Poin: bullet point list ──
  if (tipe === 'poin') {
    const butir = (b.butir as string[]) || [];
    return (
      <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-1.5 mb-1.5">
          {icon && <span className="text-base">{icon}</span>}
          {judul && <span className="text-[11px] font-bold text-white">{judul}</span>}
        </div>
        {butir.length > 0 ? (
          <div className="space-y-0.5">
            {butir.slice(0, 6).map((item, j) => (
              <div key={j} className="text-[9px] text-white/60 flex items-start gap-1">
                <span className="text-[7px] mt-0.5" style={{ color: warna }}>•</span>
                <span className="line-clamp-2">{item}</span>
              </div>
            ))}
          </div>
        ) : isi ? (
          <div className="text-[9px] text-white/70 leading-relaxed">{isi}</div>
        ) : null}
      </div>
    );
  }

  // ── Timeline: step-by-step visual ──
  if (tipe === 'timeline') {
    const langkah = (b.langkah as Array<{ icon: string; judul: string; isi: string }>) || [];
    return (
      <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
        {judul && (
          <div className="flex items-center gap-1.5 mb-2">
            {icon && <span className="text-base">{icon}</span>}
            <span className="text-[11px] font-bold text-white">{judul}</span>
          </div>
        )}
        {langkah.length > 0 ? (
          <div className="space-y-1.5">
            {langkah.map((step, j) => (
              <div key={j} className="flex items-start gap-2">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black"
                    style={{ background: alpha(warna, 0.2), color: warna }}>
                    {j + 1}
                  </div>
                  {j < langkah.length - 1 && (
                    <div className="w-0.5 h-3 mt-0.5" style={{ background: alpha(warna, 0.2) }} />
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-1 mb-0.5">
                    {step.icon && <span className="text-[10px]">{step.icon}</span>}
                    {step.judul && <span className="text-[9px] font-bold text-white">{step.judul}</span>}
                  </div>
                  {step.isi && (
                    <div className="text-[8px] text-white/55 leading-relaxed line-clamp-2">{step.isi}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : isi ? (
          <div className="text-[9px] text-white/70 leading-relaxed">{isi}</div>
        ) : null}
      </div>
    );
  }

  // ── Tabel: grid table ──
  if (tipe === 'tabel') {
    const baris = (b.baris as string[][]) || [];
    return (
      <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
        {judul && (
          <div className="flex items-center gap-1.5 mb-2">
            {icon && <span className="text-base">{icon}</span>}
            <span className="text-[11px] font-bold text-white">{judul}</span>
          </div>
        )}
        {baris.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <tbody>
                {baris.map((row, i) => (
                  <tr key={i} className={i === 0 ? 'font-bold' : ''}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-2 py-1.5 border border-white/10"
                        style={{
                          background: i === 0 ? alpha(warna, 0.12) : (j === 0 ? alpha(warna, 0.06) : 'transparent'),
                          color: i === 0 ? warna : 'rgba(255,255,255,0.7)',
                        }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : isi ? (
          <div className="text-[9px] text-white/70 leading-relaxed">{isi}</div>
        ) : null}
      </div>
    );
  }

  // ── Perbandingan: side-by-side comparison ──
  if (tipe === 'perbandingan') {
    const kiri = b.kiri as Record<string, string> | undefined;
    const kanan = b.kanan as Record<string, string> | undefined;
    return (
      <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
        {judul && (
          <div className="flex items-center gap-1.5 mb-2">
            {icon && <span className="text-base">{icon}</span>}
            <span className="text-[11px] font-bold text-white">{judul}</span>
          </div>
        )}
        {(kiri || kanan) ? (
          <div className="grid grid-cols-2 gap-2">
            {/* Left side */}
            <div className="p-2 rounded-lg" style={{
              background: alpha(warna, 0.06),
              border: `1px solid ${alpha(warna, 0.15)}`,
            }}>
              {kiri?.icon && <span className="text-sm">{kiri.icon}</span>}
              {kiri?.judul && <div className="text-[9px] font-bold mt-0.5" style={{ color: warna }}>{kiri.judul}</div>}
              {kiri?.isi && <div className="text-[8px] text-white/60 leading-relaxed mt-1 line-clamp-3">{kiri.isi}</div>}
            </div>
            {/* Right side */}
            <div className="p-2 rounded-lg bg-white/5 border border-white/10">
              {kanan?.icon && <span className="text-sm">{kanan.icon}</span>}
              {kanan?.judul && <div className="text-[9px] font-bold mt-0.5 text-white">{kanan.judul}</div>}
              {kanan?.isi && <div className="text-[8px] text-white/60 leading-relaxed mt-1 line-clamp-3">{kanan.isi}</div>}
            </div>
          </div>
        ) : isi ? (
          <div className="text-[9px] text-white/70 leading-relaxed">{isi}</div>
        ) : null}
      </div>
    );
  }

  // ── Statistik: stats grid ──
  if (tipe === 'statistik' || tipe === 'stats') {
    const items = (b.items as Array<Record<string, string>>) || [];
    return (
      <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
        {judul && (
          <div className="flex items-center gap-1.5 mb-2">
            {icon && <span className="text-base">{icon}</span>}
            <span className="text-[11px] font-bold text-white">{judul}</span>
          </div>
        )}
        {items.length > 0 ? (
          <div className={`grid gap-2 ${items.length <= 3 ? 'grid-cols-' + items.length : 'grid-cols-3'}`}>
            {items.slice(0, 6).map((item, j) => {
              const itemWarna = String(item.warna || warna);
              return (
                <div key={j} className="p-2 rounded-lg text-center" style={{
                  background: alpha(itemWarna, 0.06),
                  border: `1px solid ${alpha(itemWarna, 0.15)}`,
                }}>
                  {item.icon && <div className="text-sm mb-0.5">{item.icon}</div>}
                  {(item.angka || item.satuan) && (
                    <div className="text-[14px] font-black" style={{ color: itemWarna }}>
                      {item.angka || ''}{item.satuan ? <span className="text-[8px] ml-0.5">{item.satuan}</span> : ''}
                    </div>
                  )}
                  {item.label && <div className="text-[7px] text-white/50 mt-0.5">{item.label}</div>}
                  {item.judul && !item.angka && <div className="text-[9px] font-bold" style={{ color: itemWarna }}>{item.judul}</div>}
                  {item.isi && <div className="text-[7px] text-white/50 mt-0.5 line-clamp-2">{item.isi}</div>}
                </div>
              );
            })}
          </div>
        ) : isi ? (
          <div className="text-[9px] text-white/70 leading-relaxed">{isi}</div>
        ) : null}
      </div>
    );
  }

  // ── Default fallback: definisi-style card ──
  return (
    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-base">{icon}</span>}
        {judul && <span className="text-[11px] font-bold text-white">{judul}</span>}
      </div>
      {isi && <div className="text-[9px] text-white/70 leading-relaxed line-clamp-5">{isi}</div>}
      {/* Render butir if present */}
      {Array.isArray(b.butir) && (b.butir as string[]).length > 0 && (
        <div className="space-y-0.5 mt-1.5">
          {(b.butir as string[]).slice(0, 5).map((item, j) => (
            <div key={j} className="text-[9px] text-white/60 flex items-start gap-1">
              <span className="text-[8px] mt-0.5">•</span>
              <span className="line-clamp-2">{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MateriTemplate({ td, palette, isSelected, onEditField, interactive, variant = 'A' }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#a78bfa');
  const accent2 = getPaletteColor(palette, '--c', '#3ecfcf');
  const blok = (td.blok as Array<Record<string, unknown>>) || [];
  const modules = (td.modules as Array<Record<string, unknown>>) || [];

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (blok.length > 0) return 'blok';
    if (modules.length > 0) return 'modul';
    return 'blok';
  });

  const hasBlok = blok.length > 0;
  const hasModules = modules.length > 0;
  const hasAnyContent = hasBlok || hasModules;

  // Tab button helper
  const tabBtn = (tab: ActiveTab, icon: string, label: string, count: number, color: string, enabled: boolean) => (
    <button
      onClick={() => enabled && setActiveTab(tab)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
        activeTab === tab && enabled
          ? 'scale-105'
          : enabled
            ? 'opacity-60 hover:opacity-90'
            : 'opacity-30 cursor-not-allowed'
      }`}
      style={{
        background: activeTab === tab && enabled ? alpha(color, 0.15) : 'rgba(255,255,255,0.04)',
        border: `1px solid ${activeTab === tab && enabled ? alpha(color, 0.35) : 'rgba(255,255,255,0.08)'}`,
        color: activeTab === tab && enabled ? color : 'rgba(255,255,255,0.5)',
        boxShadow: activeTab === tab && enabled ? `0 0 12px ${alpha(color, 0.12)}` : 'none',
      }}
      disabled={!enabled}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {count > 0 && (
        <span className="px-1 rounded text-[7px]"
          style={{ background: alpha(color, 0.15), color: activeTab === tab && enabled ? color : 'rgba(255,255,255,0.4)' }}>
          {count}
        </span>
      )}
      {activeTab === tab && enabled && <span className="text-[7px]" style={{ color }}>●</span>}
    </button>
  );

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: alpha(accent, 0.12) }}>📝</div>
        <div>
          <EditableText
            value={String(td.materiTitle || 'Materi Pembelajaran')}
            fieldKey="materiTitle"
            isSelected={isSelected}
            onEdit={onEditField}
            interactive={interactive}
            className="font-black text-white text-sm"
            placeholder="Judul Materi"
          />
          <div className="text-[9px] text-white/40">{blok.length} blok • {modules.length} modul</div>
        </div>
      </div>

      {/* Tab Toggle Buttons — show when both content types exist */}
      {hasAnyContent && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-0.5">
          {tabBtn('blok', '📦', 'Materi', blok.length, accent, hasBlok)}
          {tabBtn('modul', '🧩', 'Modul', modules.length, accent2, hasModules)}
        </div>
      )}

      {/* ── Blok/Materi Content — conditional by tipe ── */}
      {activeTab === 'blok' && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {blok.length > 0 ? (
            variant === 'B' ? (
              /* Variant B: 2-column grid */
              <div className="grid grid-cols-2 gap-2">
                {blok.map((b, i) => (
                  <BlokCard key={i} b={b} accent={accent} variant={variant} />
                ))}
              </div>
            ) : (
              /* Variant A: Vertical list */
              <div className="space-y-2">
                {blok.map((b, i) => (
                  <BlokCard key={i} b={b} accent={accent} variant={variant} />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/30">
              <span className="text-3xl mb-2">📦</span>
              <span className="text-[10px]">{interactive ? 'Belum ada materi tersedia' : 'Tambah materi di panel Konten → Materi'}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Modul Content ── */}
      {activeTab === 'modul' && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {modules.length > 0 ? (
            <div className="space-y-2">
              {modules.map((m, i) => (
                <PresetModuleCard
                  key={i}
                  mode="canvas"
                  module={m as Parameters<typeof PresetModuleCard>[0]['module']}
                  layoutVariant={(m.layoutVariant as LayoutVariant) || 'A'}
                  compact
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/30">
              <span className="text-3xl mb-2">🧩</span>
              <span className="text-[10px]">{interactive ? 'Belum ada modul tersedia' : 'Tambah modul di panel Konten → Modul'}</span>
            </div>
          )}
        </div>
      )}

      {/* Empty state — no content at all */}
      {!hasAnyContent && (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">📝</span>
          <span className="text-[10px]">{interactive ? 'Belum ada materi tersedia' : 'Tambah materi di panel Konten → Materi'}</span>
        </div>
      )}

      {/* Navigation button — advance to next page in interactive mode */}
      {interactive && (
        <div className="flex justify-center mt-3">
          <TemplateNavButton action="next" accent={accent} size="md" />
        </div>
      )}
    </div>
  );
}
