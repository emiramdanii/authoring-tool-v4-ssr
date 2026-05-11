'use client';

import { useState } from 'react';
import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import { TemplateNavButton } from './TemplateNavButton';

// ── Dokumen Template (CP/TP/ATP/Alur) ─────────────────────────────
// 4-tab layout: Capaian, Tujuan, Alur, ATP
// Shows all curriculum data from presets including Alur (learning phases),
// ATP penilaian, CP fase & kelas.

type ActiveTab = 'cp' | 'tp' | 'alur' | 'atp';

export function DokumenTemplate({ td, palette, isSelected, onEditField, interactive, variant = 'A' }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f9c82e');
  const accent2 = getPaletteColor(palette, '--c', '#3ecfcf');
  const green = getPaletteColor(palette, '--g', '#34d399');
  const purple = getPaletteColor(palette, '--p', '#a78bfa');
  const cp = td.cp as Record<string, unknown> | undefined;
  const tpItems = (td.tp as Array<Record<string, unknown>>) || [];
  const atpObj = td.atp as Record<string, unknown> | undefined;
  const atpItems = (atpObj?.pertemuan as Array<Record<string, unknown>>) || [];
  const atpNamaBab = String(td.atpNamaBab || atpObj?.namaBab || '');
  const alurItems = (td.alur as Array<Record<string, unknown>>) || [];

  // Track which tab is active (default: CP if exists, else TP, else Alur, else ATP)
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (cp?.capaianFase) return 'cp';
    if (tpItems.length > 0) return 'tp';
    if (alurItems.length > 0) return 'alur';
    if (atpItems.length > 0) return 'atp';
    return 'cp';
  });

  // Determine which tabs have content
  const hasCp = Boolean(cp?.capaianFase);
  const hasTp = tpItems.length > 0;
  const hasAlur = alurItems.length > 0;
  const hasAtp = atpItems.length > 0;
  const hasAnyContent = hasCp || hasTp || hasAlur || hasAtp;

  // Tab button helper (variant A only)
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
        <span className="px-1 py-0 rounded text-[7px]"
          style={{
            background: alpha(color, 0.15),
            color: activeTab === tab && enabled ? color : 'rgba(255,255,255,0.4)',
          }}>
          {count}
        </span>
      )}
      {activeTab === tab && enabled && (
        <span className="text-[7px]" style={{ color }}>●</span>
      )}
    </button>
  );

  // Sidebar nav item helper (variant B only)
  const sideNavItem = (tab: ActiveTab, icon: string, label: string, count: number, color: string, enabled: boolean) => (
    <button
      onClick={() => enabled && setActiveTab(tab)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all text-left w-full ${
        activeTab === tab && enabled
          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
          : enabled
            ? 'opacity-60 hover:opacity-90 border border-transparent'
            : 'opacity-30 cursor-not-allowed border border-transparent'
      }`}
      disabled={!enabled}
    >
      <span className="text-base flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {count > 0 && (
        <span className="px-1.5 py-0.5 rounded text-[7px] font-bold"
          style={{
            background: activeTab === tab && enabled ? alpha(color, 0.2) : alpha(color, 0.1),
            color: activeTab === tab && enabled ? color : 'rgba(255,255,255,0.4)',
          }}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: alpha(accent, 0.12) }}>📋</div>
        <div>
          <EditableText
            value={String(td.dokumenTitle || 'Dokumen Kurikulum')}
            fieldKey="dokumenTitle"
            isSelected={isSelected}
            onEdit={onEditField}
            interactive={interactive}
            className="font-black text-white text-sm"
            placeholder="Judul Dokumen"
          />
          <div className="text-[9px] text-white/40">Capaian • Tujuan • Alur • ATP</div>
        </div>
      </div>

      {/* ── Variant A: Horizontal Tab Buttons ── */}
      {variant !== 'B' && hasAnyContent && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-0.5">
          {tabBtn('cp', '📋', 'Capaian', hasCp ? 1 : 0, accent, hasCp)}
          {tabBtn('tp', '🎯', 'Tujuan', tpItems.length, accent2, hasTp)}
          {tabBtn('alur', '🔄', 'Alur', alurItems.length, purple, hasAlur)}
          {tabBtn('atp', '📅', 'ATP', atpItems.length, green, hasAtp)}
        </div>
      )}

      {/* ── Variant B: Side Nav Layout ── */}
      {variant === 'B' && hasAnyContent && (
        <div className="flex flex-1 min-h-0 gap-2">
          {/* Left Sidebar Navigation */}
          <div className="w-[30%] flex-shrink-0 flex flex-col gap-1 py-1">
            {sideNavItem('cp', '📋', 'Capaian', hasCp ? 1 : 0, accent, hasCp)}
            {sideNavItem('tp', '🎯', 'Tujuan', tpItems.length, accent2, hasTp)}
            {sideNavItem('alur', '🔄', 'Alur', alurItems.length, purple, hasAlur)}
            {sideNavItem('atp', '📅', 'ATP', atpItems.length, green, hasAtp)}
          </div>

          {/* Right Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* ── CP Section ── */}
            {activeTab === 'cp' && (
              cp ? (
                <div className="p-3 rounded-lg" style={{ background: alpha(accent, 0.06), border: `1px solid ${alpha(accent, 0.15)}` }}>
                  <div className="text-[11px] font-bold mb-2" style={{ color: accent }}>📋 Capaian Pembelajaran</div>

                  {/* Fase & Kelas badges */}
                  {(Boolean(cp.fase) || Boolean(cp.kelas)) && (
                    <div className="flex items-center gap-1.5 mb-2">
                      {Boolean(cp.fase) && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold"
                          style={{ background: alpha(accent, 0.1), color: accent, border: `1px solid ${alpha(accent, 0.2)}` }}>
                          Fase {String(cp.fase)}
                        </span>
                      )}
                      {Boolean(cp.kelas) && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold"
                          style={{ background: alpha(accent, 0.1), color: accent, border: `1px solid ${alpha(accent, 0.2)}` }}>
                          Kelas {String(cp.kelas)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Elemen & Sub-Elemen */}
                  {Boolean(cp.elemen) && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold"
                        style={{ background: alpha(accent, 0.1), color: accent }}>
                        {String(cp.elemen)}
                      </span>
                      {Boolean(cp.subElemen) && (
                        <span className="text-[8px] text-white/50">• {String(cp.subElemen)}</span>
                      )}
                    </div>
                  )}

                  {/* Narasi Capaian Fase */}
                  <div className="text-[10px] text-white/80 leading-relaxed mb-2">
                    {String(interactive ? (cp.capaianFase || '') : (cp.capaianFase || 'Belum diisi'))}
                  </div>

                  {/* Profil Pelajar Pancasila */}
                  {Array.isArray(cp.profil) && (cp.profil as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(cp.profil as string[]).map((p, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[8px] font-bold"
                          style={{ background: alpha(accent, 0.08), color: accent, border: `1px solid ${alpha(accent, 0.15)}` }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/30">
                  <span className="text-3xl mb-2">📋</span>
                  <span className="text-[10px]">{interactive ? 'Belum ada data Capaian Pembelajaran' : 'Isi data CP di panel Dokumen'}</span>
                </div>
              )
            )}

            {/* ── TP Section ── */}
            {activeTab === 'tp' && (
              tpItems.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold mb-1.5" style={{ color: accent2 }}>🎯 Tujuan Pembelajaran</div>
                  {tpItems.map((tp, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0 mt-0.5"
                        style={{ background: alpha(String(tp.color || accent2), 0.19), color: String(tp.color || accent2) }}>
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[9px] font-bold" style={{ color: String(tp.color || accent2) }}>
                            {String(tp.verb || '')}
                          </span>
                        </div>
                        <div className="text-[9px] text-white/75 leading-relaxed">
                          {String(tp.desc || '').length > 120 ? String(tp.desc).slice(0, 120) + '...' : String(tp.desc || '')}
                        </div>
                        {Boolean(tp.pertemuan) && (
                          <div className="text-[7px] text-white/40 mt-1">Pertemuan {String(tp.pertemuan)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/30">
                  <span className="text-3xl mb-2">🎯</span>
                  <span className="text-[10px]">{interactive ? 'Belum ada Tujuan Pembelajaran' : 'Tambah TP di panel Dokumen'}</span>
                </div>
              )
            )}

            {/* ── Alur Section (Learning Phases) ── */}
            {activeTab === 'alur' && (
              alurItems.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold mb-1.5" style={{ color: purple }}>🔄 Alur Kegiatan Pembelajaran</div>
                  {alurItems.map((item, i) => {
                    const fase = String(item.fase || 'Inti');
                    const faseColor = fase === 'Pendahuluan' ? accent : fase === 'Inti' ? accent2 : green;
                    return (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg" style={{
                        background: alpha(faseColor, 0.05),
                        border: `1px solid ${alpha(faseColor, 0.15)}`,
                        borderLeft: `3px solid ${faseColor}`,
                      }}>
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-black flex-shrink-0 mt-0.5"
                          style={{ background: alpha(faseColor, 0.15), color: faseColor }}>
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-bold" style={{ color: faseColor }}>
                              {fase}
                            </span>
                            {Boolean(item.durasi) && (
                              <span className="text-[7px] text-white/40">
                                ⏱ {String(item.durasi)}
                              </span>
                            )}
                          </div>
                          {Boolean(item.judul) && (
                            <div className="text-[10px] font-bold text-white/90 mb-0.5">
                              {String(item.judul)}
                            </div>
                          )}
                          {Boolean(item.deskripsi) && (
                            <div className="text-[9px] text-white/60 leading-relaxed">
                              {String(item.deskripsi).length > 150 ? String(item.deskripsi).slice(0, 150) + '...' : String(item.deskripsi)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/30">
                  <span className="text-3xl mb-2">🔄</span>
                  <span className="text-[10px]">{interactive ? 'Belum ada Alur Kegiatan' : 'Tambah Alur di panel Dokumen'}</span>
                </div>
              )
            )}

            {/* ── ATP Section ── */}
            {activeTab === 'atp' && (
              atpItems.length > 0 ? (
                <div className="space-y-2">
                  {/* ATP header with namaBab & jumlahPertemuan */}
                  {(Boolean(atpNamaBab) || atpItems.length > 0) && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold" style={{ color: green }}>📅 Alur Tujuan Pembelajaran</span>
                      {Boolean(atpNamaBab) && (
                        <span className="text-[8px] text-white/40">• {atpNamaBab}</span>
                      )}
                    </div>
                  )}
                  {atpItems.map((atp, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white/5 border-l-3" style={{ borderLeftColor: green, borderLeftWidth: 3 }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[7px] font-black"
                          style={{ background: alpha(green, 0.15), color: green }}>
                          P{i + 1}
                        </div>
                        <span className="text-[9px] font-bold text-emerald-400">Pertemuan {i + 1}</span>
                        {Boolean(atp.judul) && <span className="text-[8px] text-white/50">• {String(atp.judul)}</span>}
                      </div>
                      {Boolean(atp.durasi) && (
                        <div className="text-[7px] text-white/40 mb-1">⏱ {String(atp.durasi)}</div>
                      )}
                      {Boolean(atp.kegiatan) && (
                        <div className="text-[8px] text-white/60 leading-relaxed mb-1">{String(atp.kegiatan)}</div>
                      )}
                      {/* Penilaian */}
                      {Boolean(atp.penilaian) && (
                        <div className="mt-1 p-1.5 rounded" style={{
                          background: alpha(green, 0.06),
                          border: `1px solid ${alpha(green, 0.12)}`,
                        }}>
                          <span className="text-[7px] font-bold" style={{ color: green }}>📝 Penilaian: </span>
                          <span className="text-[7px] text-white/50">{String(atp.penilaian)}</span>
                        </div>
                      )}
                      {Array.isArray(atp.tp) && (atp.tp as Array<Record<string, unknown>>).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(atp.tp as Array<Record<string, unknown>>).map((tpItem, j) => (
                            <span key={j} className="px-1.5 py-0.5 rounded text-[7px] font-bold"
                              style={{ background: alpha(green, 0.08), color: green }}>
                              {String(tpItem.verb || tpItem.desc || `TP ${j + 1}`)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/30">
                  <span className="text-3xl mb-2">📅</span>
                  <span className="text-[10px]">{interactive ? 'Belum ada Alur Tujuan Pembelajaran' : 'Tambah ATP di panel Dokumen'}</span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ── Variant A: Content Sections ── */}
      {variant !== 'B' && (
        <>
          {/* ── CP Section ── */}
          {activeTab === 'cp' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              {cp ? (
                <div className="p-3 rounded-lg" style={{ background: alpha(accent, 0.06), border: `1px solid ${alpha(accent, 0.15)}` }}>
                  <div className="text-[11px] font-bold mb-2" style={{ color: accent }}>📋 Capaian Pembelajaran</div>

                  {/* Fase & Kelas badges */}
                  {(Boolean(cp.fase) || Boolean(cp.kelas)) && (
                    <div className="flex items-center gap-1.5 mb-2">
                      {Boolean(cp.fase) && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold"
                          style={{ background: alpha(accent, 0.1), color: accent, border: `1px solid ${alpha(accent, 0.2)}` }}>
                          Fase {String(cp.fase)}
                        </span>
                      )}
                      {Boolean(cp.kelas) && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold"
                          style={{ background: alpha(accent, 0.1), color: accent, border: `1px solid ${alpha(accent, 0.2)}` }}>
                          Kelas {String(cp.kelas)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Elemen & Sub-Elemen */}
                  {Boolean(cp.elemen) && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold"
                        style={{ background: alpha(accent, 0.1), color: accent }}>
                        {String(cp.elemen)}
                      </span>
                      {Boolean(cp.subElemen) && (
                        <span className="text-[8px] text-white/50">• {String(cp.subElemen)}</span>
                      )}
                    </div>
                  )}

                  {/* Narasi Capaian Fase */}
                  <div className="text-[10px] text-white/80 leading-relaxed mb-2">
                    {String(interactive ? (cp.capaianFase || '') : (cp.capaianFase || 'Belum diisi'))}
                  </div>

                  {/* Profil Pelajar Pancasila */}
                  {Array.isArray(cp.profil) && (cp.profil as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(cp.profil as string[]).map((p, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[8px] font-bold"
                          style={{ background: alpha(accent, 0.08), color: accent, border: `1px solid ${alpha(accent, 0.15)}` }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/30">
                  <span className="text-3xl mb-2">📋</span>
                  <span className="text-[10px]">{interactive ? 'Belum ada data Capaian Pembelajaran' : 'Isi data CP di panel Dokumen'}</span>
                </div>
              )}
            </div>
          )}

          {/* ── TP Section ── */}
          {activeTab === 'tp' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              {tpItems.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold mb-1.5" style={{ color: accent2 }}>🎯 Tujuan Pembelajaran</div>
                  {tpItems.map((tp, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0 mt-0.5"
                        style={{ background: alpha(String(tp.color || accent2), 0.19), color: String(tp.color || accent2) }}>
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[9px] font-bold" style={{ color: String(tp.color || accent2) }}>
                            {String(tp.verb || '')}
                          </span>
                        </div>
                        <div className="text-[9px] text-white/75 leading-relaxed">
                          {String(tp.desc || '').length > 120 ? String(tp.desc).slice(0, 120) + '...' : String(tp.desc || '')}
                        </div>
                        {Boolean(tp.pertemuan) && (
                          <div className="text-[7px] text-white/40 mt-1">Pertemuan {String(tp.pertemuan)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/30">
                  <span className="text-3xl mb-2">🎯</span>
                  <span className="text-[10px]">{interactive ? 'Belum ada Tujuan Pembelajaran' : 'Tambah TP di panel Dokumen'}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Alur Section (Learning Phases) ── */}
          {activeTab === 'alur' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              {alurItems.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold mb-1.5" style={{ color: purple }}>🔄 Alur Kegiatan Pembelajaran</div>
                  {alurItems.map((item, i) => {
                    const fase = String(item.fase || 'Inti');
                    const faseColor = fase === 'Pendahuluan' ? accent : fase === 'Inti' ? accent2 : green;
                    return (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg" style={{
                        background: alpha(faseColor, 0.05),
                        border: `1px solid ${alpha(faseColor, 0.15)}`,
                        borderLeft: `3px solid ${faseColor}`,
                      }}>
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-black flex-shrink-0 mt-0.5"
                          style={{ background: alpha(faseColor, 0.15), color: faseColor }}>
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-bold" style={{ color: faseColor }}>
                              {fase}
                            </span>
                            {Boolean(item.durasi) && (
                              <span className="text-[7px] text-white/40">
                                ⏱ {String(item.durasi)}
                              </span>
                            )}
                          </div>
                          {Boolean(item.judul) && (
                            <div className="text-[10px] font-bold text-white/90 mb-0.5">
                              {String(item.judul)}
                            </div>
                          )}
                          {Boolean(item.deskripsi) && (
                            <div className="text-[9px] text-white/60 leading-relaxed">
                              {String(item.deskripsi).length > 150 ? String(item.deskripsi).slice(0, 150) + '...' : String(item.deskripsi)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/30">
                  <span className="text-3xl mb-2">🔄</span>
                  <span className="text-[10px]">{interactive ? 'Belum ada Alur Kegiatan' : 'Tambah Alur di panel Dokumen'}</span>
                </div>
              )}
            </div>
          )}

          {/* ── ATP Section ── */}
          {activeTab === 'atp' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              {atpItems.length > 0 ? (
                <div className="space-y-2">
                  {/* ATP header with namaBab & jumlahPertemuan */}
                  {(Boolean(atpNamaBab) || atpItems.length > 0) && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold" style={{ color: green }}>📅 Alur Tujuan Pembelajaran</span>
                      {Boolean(atpNamaBab) && (
                        <span className="text-[8px] text-white/40">• {atpNamaBab}</span>
                      )}
                    </div>
                  )}
                  {atpItems.map((atp, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white/5 border-l-3" style={{ borderLeftColor: green, borderLeftWidth: 3 }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[7px] font-black"
                          style={{ background: alpha(green, 0.15), color: green }}>
                          P{i + 1}
                        </div>
                        <span className="text-[9px] font-bold text-emerald-400">Pertemuan {i + 1}</span>
                        {Boolean(atp.judul) && <span className="text-[8px] text-white/50">• {String(atp.judul)}</span>}
                      </div>
                      {Boolean(atp.durasi) && (
                        <div className="text-[7px] text-white/40 mb-1">⏱ {String(atp.durasi)}</div>
                      )}
                      {Boolean(atp.kegiatan) && (
                        <div className="text-[8px] text-white/60 leading-relaxed mb-1">{String(atp.kegiatan)}</div>
                      )}
                      {/* Penilaian — previously missing */}
                      {Boolean(atp.penilaian) && (
                        <div className="mt-1 p-1.5 rounded" style={{
                          background: alpha(green, 0.06),
                          border: `1px solid ${alpha(green, 0.12)}`,
                        }}>
                          <span className="text-[7px] font-bold" style={{ color: green }}>📝 Penilaian: </span>
                          <span className="text-[7px] text-white/50">{String(atp.penilaian)}</span>
                        </div>
                      )}
                      {Array.isArray(atp.tp) && (atp.tp as Array<Record<string, unknown>>).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(atp.tp as Array<Record<string, unknown>>).map((tpItem, j) => (
                            <span key={j} className="px-1.5 py-0.5 rounded text-[7px] font-bold"
                              style={{ background: alpha(green, 0.08), color: green }}>
                              {String(tpItem.verb || tpItem.desc || `TP ${j + 1}`)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/30">
                  <span className="text-3xl mb-2">📅</span>
                  <span className="text-[10px]">{interactive ? 'Belum ada Alur Tujuan Pembelajaran' : 'Tambah ATP di panel Dokumen'}</span>
                </div>
              )}
            </div>
          )}

          {/* Empty state — no content at all */}
          {!hasAnyContent && (
            <div className="flex-1 flex flex-col items-center justify-center text-white/30">
              <span className="text-3xl mb-2">📋</span>
              <span className="text-[10px]">{interactive ? 'Belum ada data dokumen' : 'Isi data CP, TP, Alur & ATP di panel Dokumen'}</span>
            </div>
          )}
        </>
      )}

      {/* Empty state — no content at all (variant B, outside side nav) */}
      {variant === 'B' && !hasAnyContent && (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">📋</span>
          <span className="text-[10px]">{interactive ? 'Belum ada data dokumen' : 'Isi data CP, TP, Alur & ATP di panel Dokumen'}</span>
        </div>
      )}

      {/* Navigation button — advance to next page in interactive mode */}
      {interactive && (
        <div className="flex justify-center mt-3">
          <TemplateNavButton action="next" label="Mulai Pembelajaran →" accent={accent} size="md" />
        </div>
      )}
    </div>
  );
}
