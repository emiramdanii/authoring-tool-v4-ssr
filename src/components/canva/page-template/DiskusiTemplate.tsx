'use client';

import { useState } from 'react';
import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';

// ── Diskusi Template ───────────────────────────────────────────
// Phase 10: Added interactive answer mode — students can type
// answers to discussion questions. Design mode shows all questions.
// Improved font sizes and layout.

export function DiskusiTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--c', '#3ecfcf');
  const green = getPaletteColor(palette, '--g', '#34d399');
  const pertanyaan = (td.pertanyaan as Array<Record<string, unknown>>) || [];

  // Interactive mode: track current question and answers
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleAnswer = (idx: number, value: string) => {
    setAnswers(prev => ({ ...prev, [idx]: value }));
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: alpha(accent, 0.12) }}>💬</div>
        <div>
          <EditableText
            value={String(td.title || 'Diskusi & Pertanyaan')}
            fieldKey="title"
            isSelected={isSelected}
            onEdit={onEditField}
            interactive={interactive}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Diskusi"
          />
          <div className="text-[9px] text-white/40">
            {interactive ? `Pertanyaan ${activeIdx + 1}/${pertanyaan.length}` : `${pertanyaan.length} pertanyaan`}
          </div>
        </div>
      </div>

      {/* Intro */}
      {Boolean(td.intro) && (
        <div className="text-[10px] text-white/70 leading-relaxed mb-3">{String(td.intro)}</div>
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
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex-1 min-h-0 flex flex-col">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold"
                  style={{ background: alpha(accent, 0.12), color: accent }}>
                  {String(pertanyaan[activeIdx].label || `Pertanyaan ${activeIdx + 1}`)}
                </span>
                <span className="text-base">{String(pertanyaan[activeIdx].icon || '💬')}</span>
              </div>
              <div className="text-[11px] text-white/90 leading-relaxed mb-3">
                {String(pertanyaan[activeIdx].teks || '')}
              </div>
              {Boolean(pertanyaan[activeIdx].petunjuk) && (
                <div className="text-[9px] text-white/40 italic mb-2">💡 {String(pertanyaan[activeIdx].petunjuk)}</div>
              )}

              {/* Answer input */}
              <textarea
                value={answers[activeIdx] || ''}
                onChange={(e) => handleAnswer(activeIdx, e.target.value)}
                placeholder="Tulis jawaban atau pendapatmu di sini..."
                className="flex-1 min-h-[60px] w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white/80 placeholder:text-white/25 outline-none focus:ring-1 focus:ring-cyan-400/50 resize-none"
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
            <div className="flex items-center gap-1">
              {Object.keys(answers).length > 0 && (
                <span className="text-[8px] text-emerald-400">{Object.keys(answers).length} dijawab</span>
              )}
            </div>
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
          {pertanyaan.map((p, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold"
                  style={{ background: alpha(accent, 0.12), color: accent }}>
                  {String(p.label || `Pertanyaan ${i + 1}`)}
                </span>
                <span className="text-sm">{String(p.icon || '💬')}</span>
              </div>
              <div className="text-[10px] text-white/80 leading-relaxed mb-1">{String(p.teks || '')}</div>
              {Boolean(p.petunjuk) && (
                <div className="text-[9px] text-white/40 italic">💡 {String(p.petunjuk)}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">💬</span>
          <span className="text-[10px]">{interactive ? 'Belum ada pertanyaan tersedia' : 'Tambah pertanyaan di panel Konten → Diskusi'}</span>
        </div>
      )}
    </div>
  );
}
