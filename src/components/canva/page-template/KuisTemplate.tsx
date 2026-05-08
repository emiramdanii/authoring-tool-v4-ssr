'use client';

import { useCallback } from 'react';
import { getPaletteColor } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import QuizWidget from '../QuizWidget';
import { useInteractiveStore } from '@/store/interactive-store';

// ── Kuis Template ─────────────────────────────────────────────

export function KuisTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f5c842');
  const kuisData = (td.kuis as Array<Record<string, unknown>>) || [];
  const reportScore = useInteractiveStore((s) => s.reportScore);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);

  const handleComplete = useCallback((score: number, maxScore: number) => {
    reportScore({ elementId: 'kuis-template', pageIndex: interactivePageIdx, score, maxScore, completed: true });
  }, [reportScore, interactivePageIdx]);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2"
        style={{ background: `linear-gradient(90deg, ${accent}15, transparent)` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${accent}20` }}>❓</div>
        <div>
          <EditableText
            value={String(td.kuisTitle || 'Kuis Interaktif')}
            fieldKey="kuisTitle"
            isSelected={isSelected}
            onEdit={onEditField}
            interactive={interactive}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Kuis"
          />
          <div className="text-[9px] text-white/40">{kuisData.length} soal</div>
        </div>
      </div>

      {/* Quiz Widget — full-size in interactive mode */}
      <div className="flex-1 min-h-0 px-3 pb-3">
        {kuisData.length > 0 ? (
          <QuizWidget
            compact={!interactive}
            interactive={interactive}
            kuisIds={kuisData.map(k => k._id).filter((id): id is string => typeof id === 'string' && id.length > 0)}
            onComplete={interactive ? handleComplete : undefined}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/30">
            <span className="text-3xl mb-2">❓</span>
            <span className="text-[10px]">{interactive ? 'Belum ada soal tersedia' : 'Tambah soal di panel Konten → Evaluasi'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
