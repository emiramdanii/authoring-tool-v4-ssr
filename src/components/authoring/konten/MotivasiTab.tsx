'use client';

import { Sparkles, Lightbulb, Link2, Activity } from 'lucide-react';
import { useAuthoringStore } from '@/store/authoring-store';
import type { MotivasiData } from '@/store/authoring/types';
import { INPUT_CLS, TEXTAREA_CLS, FieldLabel, MAX_TITLE, MAX_BODY, MAX_SHORT_TEXT } from './shared';

// ── Emoji options for visual picker ──
const VISUAL_OPTIONS = ['🤔', '💡', '🔥', '🎯', '🔄', '💪', '✨', '🌟'];

// ── Motivasi Tab — Edit apersepsi/motivasi section ──
export function MotivasiTab() {
  const motivasi = useAuthoringStore((s) => s.motivasi);
  const updateMotivasi = useAuthoringStore((s) => s.updateMotivasi);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-app-muted">Bagian Apersepsi & Motivasi</span>
      </div>

      {/* Title & Intro */}
      <div className="space-y-3 bg-app-surface border border-app-border rounded-xl p-4">
        <div>
          <FieldLabel>Judul Motivasi</FieldLabel>
          <input
            className={INPUT_CLS}
            maxLength={MAX_TITLE}
            placeholder="Motivasi"
            value={motivasi.title}
            onChange={(e) => updateMotivasi({ title: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel>Pengantar</FieldLabel>
          <textarea
            className={TEXTAREA_CLS}
            rows={2}
            maxLength={MAX_BODY}
            placeholder="Pengantar untuk memotivasi siswa..."
            value={motivasi.intro}
            onChange={(e) => updateMotivasi({ intro: e.target.value })}
          />
        </div>
      </div>

      {/* Pertanyaan Pemicu — Hook Question */}
      <div className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Sparkles size={16} className="text-amber-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-app-primary">Pertanyaan Pemicu</h4>
            <p className="text-xs text-app-muted">Pertanyaan pemantik rasa ingin tahu siswa</p>
          </div>
        </div>
        <textarea
          className={TEXTAREA_CLS}
          rows={3}
          maxLength={MAX_BODY}
          placeholder="Tulis pertanyaan yang memicu rasa ingin tahu siswa..."
          value={motivasi.pertanyaanPemicu}
          onChange={(e) => updateMotivasi({ pertanyaanPemicu: e.target.value })}
        />
      </div>

      {/* Koneksi — Connection to Prior Knowledge */}
      <div className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Link2 size={16} className="text-cyan-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-app-primary">Koneksi</h4>
            <p className="text-xs text-app-muted">Hubungan dengan pengetahuan sebelumnya</p>
          </div>
        </div>
        <textarea
          className={TEXTAREA_CLS}
          rows={3}
          maxLength={MAX_BODY}
          placeholder="Jelaskan koneksi ke pengetahuan atau pengalaman sebelumnya..."
          value={motivasi.koneksi}
          onChange={(e) => updateMotivasi({ koneksi: e.target.value })}
        />
      </div>

      {/* Aktivitas — Short Activity Suggestion */}
      <div className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Activity size={16} className="text-green-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-app-primary">Aktivitas</h4>
            <p className="text-xs text-app-muted">Saran aktivitas singkat untuk siswa</p>
          </div>
        </div>
        <textarea
          className={TEXTAREA_CLS}
          rows={3}
          maxLength={MAX_BODY}
          placeholder="Saran aktivitas singkat yang bisa dilakukan siswa..."
          value={motivasi.aktivitas}
          onChange={(e) => updateMotivasi({ aktivitas: e.target.value })}
        />
      </div>

      {/* Visual — Emoji Picker */}
      <div className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Lightbulb size={16} className="text-purple-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-app-primary">Visual / Ikon</h4>
            <p className="text-xs text-app-muted">Pilih ikon untuk memperkuat motivasi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {VISUAL_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => updateMotivasi({ visual: emoji })}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                motivasi.visual === emoji
                  ? 'bg-app-accent/15 border-2 border-app-accent/50'
                  : 'bg-app-elevated/50 border border-app-border/50 hover:border-app-border'
              }`}
            >
              {emoji}
            </button>
          ))}
          {/* Custom input fallback */}
          <input
            className={`${INPUT_CLS} w-16 text-center text-lg px-1 py-1`}
            maxLength={MAX_SHORT_TEXT}
            placeholder="..."
            value={motivasi.visual && !VISUAL_OPTIONS.includes(motivasi.visual) ? motivasi.visual : ''}
            onChange={(e) => updateMotivasi({ visual: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
