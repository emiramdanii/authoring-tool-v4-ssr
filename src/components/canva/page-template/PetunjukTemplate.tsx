'use client';

import { useState } from 'react';
import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import { TemplateNavButton } from './TemplateNavButton';

// ── Petunjuk Template ─────────────────────────────────────────
// Phase 10: Step-by-step interactive mode with expand/collapse,
// fixed tips overflow by putting it inside scrollable area,
// improved font sizes and step navigation.

export function PetunjukTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f9c82e');
  const langkah = (td.langkah as Array<Record<string, unknown>>) || [];
  const tips = String(td.tips || '');

  // In interactive mode: track which step is shown
  const [activeStep, setActiveStep] = useState(0);
  const [showTips, setShowTips] = useState(false);

  const handleNextStep = () => {
    if (activeStep < langkah.length - 1) setActiveStep(activeStep + 1);
  };
  const handlePrevStep = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: alpha(accent, 0.12) }}>📌</div>
        <div>
          <EditableText
            value={String(td.title || 'Petunjuk Penggunaan')}
            fieldKey="title"
            isSelected={isSelected}
            onEdit={onEditField}
            interactive={interactive}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Petunjuk"
          />
          <div className="text-[9px] text-white/40">
            {interactive ? `Langkah ${activeStep + 1}/${langkah.length}` : `${langkah.length} langkah`}
          </div>
        </div>
      </div>

      {/* Intro */}
      {Boolean(td.intro) && (
        <div className="text-[10px] text-white/70 leading-relaxed mb-3">{String(td.intro)}</div>
      )}

      {/* ── Interactive Mode: Step-by-step navigation ── */}
      {interactive && langkah.length > 0 ? (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Progress dots */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
            {langkah.map((_, i) => (
              <button key={i} onClick={() => setActiveStep(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === activeStep ? 'w-6' : i < activeStep ? 'w-3' : 'w-2'
                }`}
                style={{
                  background: i === activeStep ? accent : i < activeStep ? alpha(accent, 0.5) : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>

          {/* Current step card */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                style={{ background: alpha(accent, 0.19), color: accent }}>
                {activeStep + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{String(langkah[activeStep]?.icon || '📌')}</span>
                  <span className="text-[12px] font-bold text-white">
                    {String(langkah[activeStep]?.judul || `Langkah ${activeStep + 1}`)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-white/80 leading-relaxed flex-1 min-h-0 overflow-y-auto">
              {String(langkah[activeStep]?.isi || '')}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={handlePrevStep}
              disabled={activeStep === 0}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${
                activeStep > 0 ? 'hover:bg-white/10 cursor-pointer text-white' : 'opacity-30 cursor-not-allowed text-white/50'
              }`}
              style={{ background: activeStep > 0 ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
              ← Sebelumnya
            </button>
            <span className="text-[9px] text-white/40">{activeStep + 1} / {langkah.length}</span>
            <button
              onClick={handleNextStep}
              disabled={activeStep >= langkah.length - 1}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${
                activeStep < langkah.length - 1
                  ? 'hover:scale-105 cursor-pointer'
                  : 'opacity-30 cursor-not-allowed'
              }`}
              style={{
                background: activeStep < langkah.length - 1 ? alpha(accent, 0.2) : 'transparent',
                border: activeStep < langkah.length - 1 ? `1px solid ${alpha(accent, 0.3)}` : 'none',
                color: activeStep < langkah.length - 1 ? accent : 'rgba(255,255,255,0.5)',
              }}>
              Lanjut →
            </button>
          </div>
        </div>
      ) : !interactive && langkah.length > 0 ? (
        /* ── Design Mode: Show all steps as cards ── */
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {langkah.map((l, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5"
                style={{ background: alpha(accent, 0.19), color: accent }}>
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-sm">{String(l.icon || '📌')}</span>
                  <span className="text-[11px] font-bold text-white">{String(l.judul || '')}</span>
                </div>
                <div className="text-[9px] text-white/70 leading-relaxed line-clamp-3">{String(l.isi || '')}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">📋</span>
          <span className="text-[10px]">{interactive ? 'Belum ada langkah tersedia' : 'Tambah langkah di panel Konten → Petunjuk'}</span>
        </div>
      )}

      {/* Tips — collapsible, inside the layout flow */}
      {tips && (
        <div className="mt-2">
          <button
            onClick={() => setShowTips(!showTips)}
            className="flex items-center gap-1.5 text-[10px] font-bold mb-1"
            style={{ color: accent }}>
            <span className={`text-[8px] transition-transform ${showTips ? 'rotate-90' : ''}`}>▸</span>
            💡 Tips
          </button>
          {showTips && (
            <div className="p-2.5 rounded-lg" style={{ background: alpha(accent, 0.06), border: `1px solid ${alpha(accent, 0.15)}` }}>
              <div className="text-[9px] text-white/70 leading-relaxed">{tips}</div>
            </div>
          )}
        </div>
      )}

      {/* Navigation button — advance to next page in interactive mode */}
      {interactive && (
        <div className="flex justify-center mt-2">
          <TemplateNavButton action="next" accent={accent} size="md" />
        </div>
      )}
    </div>
  );
}
