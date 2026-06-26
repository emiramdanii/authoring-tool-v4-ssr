'use client';

// ═══════════════════════════════════════════════════════════════
// BATCH-07B — ReflectionQuestionsFieldEditor
// ═══════════════════════════════════════════════════════════════
// Inline editor for diskusi/refleksi block questions.
//
// Two modes (driven by `mode` prop):
//   - 'discussion': questions have { label, icon, teks, petunjuk, color? }
//   - 'reflection': questions have { teks, petunjuk, warna?, icon? }
//
// Both modes share the same UI: list of questions with text + hint
// + icon + color, plus add/remove buttons. The shape difference is:
//   - discussion uses `label` (A/B/C) and `color` field names
//   - reflection uses `warna` field name (no label)
//
// All writes go through onChange callback. No direct store mutation.
// ═══════════════════════════════════════════════════════════════

import React, { useCallback, useMemo } from 'react';

export type ReflectionMode = 'discussion' | 'reflection';

export interface DiscussionQuestion {
  label: string;
  icon: string;
  teks: string;
  petunjuk: string;
  color?: string;
}

export interface ReflectionQuestion {
  teks: string;
  petunjuk: string;
  warna?: string;
  icon?: string;
}

export interface ReflectionQuestionsFieldEditorProps {
  /** Current questions array (from block.questions) */
  value: unknown;
  /** Called with new questions array on every edit */
  onChange: (questions: unknown[]) => void;
  /** Editor mode: 'discussion' (diskusi) or 'reflection' (refleksi) */
  mode: ReflectionMode;
}

const COLOR_OPTIONS = [
  { value: 'y', label: 'Kuning' },
  { value: 'c', label: 'Cyan' },
  { value: 'g', label: 'Hijau' },
  { value: 'p', label: 'Ungu' },
  { value: 'o', label: 'Oranye' },
  { value: 'r', label: 'Merah' },
] as const;

const DEFAULT_ICON = '💡';

function normalizeDiscussionQuestions(value: unknown): DiscussionQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.map((q) => {
    const obj = (q ?? {}) as Record<string, unknown>;
    return {
      label: typeof obj.label === 'string' ? obj.label : '',
      icon: typeof obj.icon === 'string' ? obj.icon : DEFAULT_ICON,
      teks: typeof obj.teks === 'string' ? obj.teks : '',
      petunjuk: typeof obj.petunjuk === 'string' ? obj.petunjuk : '',
      ...(typeof obj.color === 'string' && obj.color ? { color: obj.color } : {}),
    };
  });
}

function normalizeReflectionQuestions(value: unknown): ReflectionQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.map((q) => {
    const obj = (q ?? {}) as Record<string, unknown>;
    return {
      teks: typeof obj.teks === 'string' ? obj.teks : '',
      petunjuk: typeof obj.petunjuk === 'string' ? obj.petunjuk : '',
      ...(typeof obj.warna === 'string' && obj.warna ? { warna: obj.warna } : {}),
      ...(typeof obj.icon === 'string' && obj.icon ? { icon: obj.icon } : {}),
    };
  });
}

function makeBlankQuestion(mode: ReflectionMode): unknown {
  if (mode === 'discussion') {
    return { label: '', icon: DEFAULT_ICON, teks: '', petunjuk: '', color: 'c' };
  }
  return { teks: '', petunjuk: '', warna: 'c', icon: DEFAULT_ICON };
}

export function ReflectionQuestionsFieldEditor({
  value,
  onChange,
  mode,
}: ReflectionQuestionsFieldEditorProps) {
  const questions = useMemo(() => {
    return mode === 'discussion'
      ? normalizeDiscussionQuestions(value)
      : normalizeReflectionQuestions(value);
  }, [value, mode]);

  const handleAdd = useCallback(() => {
    onChange([...questions, makeBlankQuestion(mode)]);
  }, [questions, onChange, mode]);

  const handleDelete = useCallback(
    (index: number) => {
      if (questions.length <= 1) {
        // Keep at least 1 question
        onChange([makeBlankQuestion(mode)]);
        return;
      }
      const next = questions.filter((_, i) => i !== index);
      onChange(next);
    },
    [questions, onChange, mode]
  );

  const handleFieldChange = useCallback(
    (index: number, patch: Record<string, unknown>) => {
      const next = questions.map((q, i) =>
        i === index ? { ...(q as object), ...patch } : q
      );
      onChange(next);
    },
    [questions, onChange]
  );

  const label = mode === 'discussion' ? 'Pertanyaan Diskusi' : 'Pertanyaan Refleksi';
  const editorTestId = mode === 'discussion' ? 'discussion-questions-editor' : 'reflection-questions-editor';

  return (
    <div className="space-y-3" data-testid={editorTestId}>
      {questions.length === 0 ? (
        <div className="text-center py-4 px-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
          <span className="material-symbols-outlined text-slate-300" aria-hidden="true" style={{ fontSize: '28px' }}>
            {mode === 'discussion' ? 'forum' : 'psychology'}
          </span>
          <p className="text-xs text-slate-500 mt-1.5">Belum ada {label.toLowerCase()}.</p>
        </div>
      ) : (
        questions.map((q, qIdx) => {
          const qObj = q as unknown as Record<string, unknown>;
          const teks = String(qObj.teks ?? '');
          const petunjuk = String(qObj.petunjuk ?? '');
          const icon = String(qObj.icon ?? DEFAULT_ICON);
          const color = String(qObj.color ?? qObj.warna ?? 'c');
          const labelVal = mode === 'discussion' ? String(qObj.label ?? '') : '';

          return (
            <div
              key={qIdx}
              className="border border-slate-200 rounded-lg p-3 bg-slate-50/50"
              data-testid={`reflection-question-card-${qIdx}`}
            >
              {/* Header: number + delete */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  data-testid={`reflection-question-number-${qIdx}`}
                >
                  {mode === 'discussion' ? `Pertanyaan ${labelVal || qIdx + 1}` : `Pertanyaan ${qIdx + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(qIdx)}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  aria-label={`Hapus pertanyaan ${qIdx + 1}`}
                  data-testid={`reflection-question-delete-${qIdx}`}
                >
                  <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '16px' }}>delete</span>
                </button>
              </div>

              {/* Discussion mode: label + icon row */}
              {mode === 'discussion' && (
                <div className="flex gap-2 mb-2">
                  <div className="w-20">
                    <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Label</label>
                    <input
                      type="text"
                      value={labelVal}
                      onChange={(e) => handleFieldChange(qIdx, { label: e.target.value })}
                      placeholder="A"
                      maxLength={2}
                      className="w-full px-2 py-1 text-xs text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      data-testid={`reflection-question-label-${qIdx}`}
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Ikon</label>
                    <input
                      type="text"
                      value={icon}
                      onChange={(e) => handleFieldChange(qIdx, { icon: e.target.value })}
                      placeholder="💡"
                      maxLength={4}
                      className="w-full px-2 py-1 text-xs text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      data-testid={`reflection-question-icon-${qIdx}`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Warna</label>
                    <select
                      value={color}
                      onChange={(e) => {
                        const patch = mode === 'discussion' ? { color: e.target.value } : { warna: e.target.value };
                        handleFieldChange(qIdx, patch);
                      }}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      data-testid={`reflection-question-color-${qIdx}`}
                    >
                      {COLOR_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Reflection mode: icon + color row (no label) */}
              {mode === 'reflection' && (
                <div className="flex gap-2 mb-2">
                  <div className="w-20">
                    <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Ikon</label>
                    <input
                      type="text"
                      value={icon}
                      onChange={(e) => handleFieldChange(qIdx, { icon: e.target.value })}
                      placeholder="💡"
                      maxLength={4}
                      className="w-full px-2 py-1 text-xs text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      data-testid={`reflection-question-icon-${qIdx}`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Warna</label>
                    <select
                      value={color}
                      onChange={(e) => handleFieldChange(qIdx, { warna: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      data-testid={`reflection-question-color-${qIdx}`}
                    >
                      {COLOR_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Question text */}
              <div className="mb-2">
                <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Teks</label>
                <textarea
                  value={teks}
                  onChange={(e) => handleFieldChange(qIdx, { teks: e.target.value })}
                  placeholder="Tulis pertanyaan di sini..."
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors resize-none"
                  data-testid={`reflection-question-text-${qIdx}`}
                />
              </div>

              {/* Hint */}
              <div>
                <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Petunjuk</label>
                <textarea
                  value={petunjuk}
                  onChange={(e) => handleFieldChange(qIdx, { petunjuk: e.target.value })}
                  placeholder="Petunjuk untuk siswa..."
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors resize-none"
                  data-testid={`reflection-question-hint-${qIdx}`}
                />
              </div>
            </div>
          );
        })
      )}

      {/* Add button */}
      <button
        type="button"
        onClick={handleAdd}
        className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 flex items-center justify-center gap-1.5"
        aria-label={`Tambah ${label.toLowerCase()}`}
        data-testid="reflection-questions-add-btn"
      >
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>add</span>
        Tambah {label}
      </button>

      {/* Summary */}
      <div className="text-[10px] text-slate-400 text-center" data-testid="reflection-questions-summary">
        {questions.length} pertanyaan · {questions.filter((q) => String((q as unknown as Record<string, unknown>)?.teks ?? '').trim()).length} terisi
      </div>
    </div>
  );
}
