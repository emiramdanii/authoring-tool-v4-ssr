'use client';

import { useState } from 'react';
import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';

// ── Refleksi Template ───────────────────────────────────────────
// Phase 10: Added interactive answer mode with text input per
// question, collapsible penugasan section, improved layout and
// font sizes for better readability.

export function RefleksiTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--p', '#a78bfa');
  const green = getPaletteColor(palette, '--g', '#34d399');
  const pertanyaan = (td.pertanyaan as Array<Record<string, unknown>>) || [];
  const penugasan = td.penugasan as Record<string, unknown> | undefined;

  // Interactive mode: track current question and answers
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showPenugasan, setShowPenugasan] = useState(false);

  const handleAnswer = (idx: number, value: string) => {
    setAnswers(prev => ({ ...prev, [idx]: value }));
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: alpha(accent, 0.12) }}>🪞</div>
        <div>
          <EditableText
            value={String(td.title || 'Refleksi Diri')}
            fieldKey="title"
            isSelected={isSelected}
            onEdit={onEditField}
            interactive={interactive}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Refleksi"
          />
          <div className="text-[9px] text-white/40">
            {interactive ? `Pertanyaan ${activeIdx + 1}/${pertanyaan.length}` : `${pertanyaan.length} pertanyaan`}
          </div>
        </div>
      </div>

      {/* Intro */}
      {Boolean(td.intro) && (
        <div className="text-[10px] text-white/70 leading-relaxed mb-2">{String(td.intro)}</div>
      )}

      {/* ── Interactive Mode: One question at a time with answer input ── */}
      {interactive && pertanyaan.length > 0 ? (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Progress dots */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
            {pertanyaan.map((_, i) => (
              <button key={i} onClick={() => setActiveIdx(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === activeIdx ? 'w-5' : answers[i] ? 'w-3' : 'w-2'
                }`}
                style={{
                  background: i === activeIdx ? accent : answers[i] ? alpha(green, 0.5) : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>

          {/* Current question card */}
          {pertanyaan[activeIdx] && (
            <div className="p-3 rounded-lg flex-1 min-h-0 flex flex-col"
              style={{ background: alpha(String(pertanyaan[activeIdx].warna || accent), 0.04), border: `1px solid ${alpha(String(pertanyaan[activeIdx].warna || accent), 0.15)}` }}>
              <div className="flex items-center gap-1.5 mb-2">
                {Boolean(pertanyaan[activeIdx].icon) && <span className="text-base">{String(pertanyaan[activeIdx].icon)}</span>}
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: String(pertanyaan[activeIdx].warna || accent) }} />
                <span className="text-[9px] font-bold" style={{ color: String(pertanyaan[activeIdx].warna || accent) }}>
                  Pertanyaan {activeIdx + 1}
                </span>
              </div>
              <div className="text-[11px] text-white/90 leading-relaxed mb-3">
                {String(pertanyaan[activeIdx].teks || '')}
              </div>
              {Boolean(pertanyaan[activeIdx].petunjuk) && (
                <div className="text-[9px] text-white/40 italic mb-2">💡 {String(pertanyaan[activeIdx].petunjuk)}</div>
              )}

              {/* Answer textarea */}
              <textarea
                value={answers[activeIdx] || ''}
                onChange={(e) => handleAnswer(activeIdx, e.target.value)}
                placeholder="Tulis refleksimu di sini..."
                className="flex-1 min-h-[60px] w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white/80 placeholder:text-white/25 outline-none focus:ring-1 focus:ring-purple-400/50 resize-none"
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
              disabled={activeIdx === 0}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                activeIdx > 0 ? 'hover:bg-white/10 cursor-pointer text-white' : 'opacity-30 cursor-not-allowed text-white/50'
              }`}
              style={{ background: activeIdx > 0 ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
              ← Sebelumnya
            </button>
            <span className="text-[8px] text-emerald-400">{Object.keys(answers).length}/{pertanyaan.length} dijawab</span>
            <button
              onClick={() => setActiveIdx(Math.min(pertanyaan.length - 1, activeIdx + 1))}
              disabled={activeIdx >= pertanyaan.length - 1}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                activeIdx < pertanyaan.length - 1 ? 'hover:scale-105 cursor-pointer' : 'opacity-30 cursor-not-allowed'
              }`}
              style={{
                background: activeIdx < pertanyaan.length - 1 ? alpha(accent, 0.15) : 'transparent',
                border: activeIdx < pertanyaan.length - 1 ? `1px solid ${alpha(accent, 0.3)}` : 'none',
                color: activeIdx < pertanyaan.length - 1 ? accent : 'rgba(255,255,255,0.5)',
              }}>
              Lanjut →
            </button>
          </div>
        </div>
      ) : !interactive && pertanyaan.length > 0 ? (
        /* ── Design Mode: Show all questions as cards ── */
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {pertanyaan.map((p, i) => {
            const warna = String(p.warna || accent);
            return (
              <div key={i} className="p-2.5 rounded-lg" style={{ background: alpha(warna, 0.04), border: `1px solid ${alpha(warna, 0.15)}` }}>
                <div className="flex items-center gap-1.5 mb-1">
                  {Boolean(p.icon) && <span className="text-sm">{String(p.icon)}</span>}
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: warna }} />
                  <span className="text-[9px] font-bold" style={{ color: warna }}>Pertanyaan {i + 1}</span>
                </div>
                <div className="text-[10px] text-white/80 leading-relaxed mb-0.5">{String(p.teks || '')}</div>
                {Boolean(p.petunjuk) && (
                  <div className="text-[9px] text-white/40 italic">💡 {String(p.petunjuk)}</div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">🪞</span>
          <span className="text-[10px]">{interactive ? 'Belum ada pertanyaan tersedia' : 'Tambah pertanyaan di panel Konten → Refleksi'}</span>
        </div>
      )}

      {/* Penugasan — collapsible to prevent overflow */}
      {penugasan && (
        <div className="mt-2">
          <button
            onClick={() => setShowPenugasan(!showPenugasan)}
            className="flex items-center gap-1.5 text-[10px] font-bold mb-1"
            style={{ color: accent }}>
            <span className={`text-[8px] transition-transform ${showPenugasan ? 'rotate-90' : ''}`}>▸</span>
            📝 {String(penugasan.judul || 'Penugasan')}
          </button>
          {showPenugasan && (
            <div className="p-2.5 rounded-lg" style={{ background: alpha(accent, 0.06), border: `1px solid ${alpha(accent, 0.15)}` }}>
              <div className="text-[10px] font-bold mb-0.5" style={{ color: accent }}>📝 {String(penugasan.judul || 'Penugasan')}</div>
              <div className="text-[9px] text-white/70 leading-relaxed">{String(penugasan.isi || '')}</div>
              {Boolean(penugasan.contoh) && (
                <div className="mt-1 text-[8px] text-white/40 italic">Contoh: {String(penugasan.contoh)}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
