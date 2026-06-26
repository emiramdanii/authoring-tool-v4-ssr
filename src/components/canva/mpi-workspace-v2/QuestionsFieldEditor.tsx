'use client';

// ═══════════════════════════════════════════════════════════════
// BATCH-07 — QuestionsFieldEditor
// ═══════════════════════════════════════════════════════════════
// Inline editor for the `questions` field of a kuis block.
// Renders a list of questions, each with:
//   - Question text (textarea)
//   - 4 options A/B/C/D (text inputs)
//   - Answer selector (radio: pick which option is correct)
//   - Explanation (textarea)
//   - Delete button (with confirm)
//
// Add Question button appends a new blank question with 4 empty
// options and answer index 0.
//
// All edits go through the parent's onChange callback, which is
// expected to call updateSchemaBlock({ questions: [...] }).
//
// Why not use the legacy KuisTab?
//   - KuisTab is a flat-list editor that aggregates ALL kuis blocks
//     across ALL pages. It's a power-user tool.
//   - This QuestionsFieldEditor is contextual: it edits ONLY the
//     currently selected kuis block on the current page. That's the
//     mental model teachers expect when they click a block in the
//     V5 editor.
//   - Both can coexist — KuisTab is disconnected from V5 runtime
//     (legacy), QuestionsFieldEditor is the V5-native path.
// ═══════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';

export interface KuisQuestion {
  q: string;
  opts: string[];
  ans: number;
  ex: string;
}

export interface QuestionsFieldEditorProps {
  /** Current questions array (from block.questions) */
  value: unknown;
  /** Called with the new questions array on every edit */
  onChange: (questions: KuisQuestion[]) => void;
}

const LETTERS = ['A', 'B', 'C', 'D'] as const;
const OPTION_COUNT = 4;

function normalizeQuestions(value: unknown): KuisQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.map((q) => {
    const obj = (q ?? {}) as Record<string, unknown>;
    const optsRaw = (Array.isArray(obj.opts) ? obj.opts : []) as unknown[];
    return {
      q: typeof obj.q === 'string' ? obj.q : '',
      opts: Array.from({ length: OPTION_COUNT }, (_, i) =>
        typeof optsRaw[i] === 'string' ? (optsRaw[i] as string) : ''
      ),
      ans: typeof obj.ans === 'number' && obj.ans >= 0 && obj.ans < OPTION_COUNT
        ? obj.ans
        : 0,
      ex: typeof obj.ex === 'string' ? obj.ex : '',
    };
  });
}

function makeBlankQuestion(): KuisQuestion {
  return {
    q: '',
    opts: ['', '', '', ''],
    ans: 0,
    ex: '',
  };
}

export function QuestionsFieldEditor({ value, onChange }: QuestionsFieldEditorProps) {
  const questions = normalizeQuestions(value);

  const handleAdd = useCallback(() => {
    onChange([...questions, makeBlankQuestion()]);
  }, [questions, onChange]);

  const handleDelete = useCallback(
    (index: number) => {
      if (questions.length <= 1) {
        // Keep at least 1 question — empty kuis block is confusing.
        // Replace with blank instead of deleting.
        onChange([makeBlankQuestion()]);
        return;
      }
      const next = questions.filter((_, i) => i !== index);
      onChange(next);
    },
    [questions, onChange]
  );

  const handleQuestionChange = useCallback(
    (index: number, patch: Partial<KuisQuestion>) => {
      const next = questions.map((q, i) => (i === index ? { ...q, ...patch } : q));
      onChange(next);
    },
    [questions, onChange]
  );

  const handleOptionChange = useCallback(
    (qIndex: number, optIndex: number, optValue: string) => {
      const next = questions.map((q, i) => {
        if (i !== qIndex) return q;
        const opts = [...q.opts];
        opts[optIndex] = optValue;
        return { ...q, opts };
      });
      onChange(next);
    },
    [questions, onChange]
  );

  if (questions.length === 0) {
    return (
      <div className="space-y-3" data-testid="questions-field-editor">
        <div className="text-center py-4 px-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
          <span className="material-symbols-outlined text-slate-300" aria-hidden="true" style={{ fontSize: '28px' }}>quiz</span>
          <p className="text-xs text-slate-500 mt-1.5">Belum ada pertanyaan.</p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 flex items-center justify-center gap-1.5"
          aria-label="Tambah pertanyaan kuis"
          data-testid="questions-add-btn"
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>add</span>
          Tambah Pertanyaan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="questions-field-editor">
      {questions.map((q, qIdx) => (
        <div
          key={qIdx}
          className="border border-slate-200 rounded-lg p-3 bg-slate-50/50"
          data-testid={`question-card-${qIdx}`}
        >
          {/* Question header: number + delete */}
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-semibold text-slate-600 uppercase tracking-wider"
              data-testid={`question-number-${qIdx}`}
            >
              Pertanyaan {qIdx + 1}
            </span>
            <button
              type="button"
              onClick={() => handleDelete(qIdx)}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
              aria-label={`Hapus pertanyaan ${qIdx + 1}`}
              data-testid={`question-delete-${qIdx}`}
            >
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '16px' }}>delete</span>
            </button>
          </div>

          {/* Question text */}
          <div className="mb-2">
            <label
              className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1"
              htmlFor={`q-${qIdx}-text`}
            >
              Pertanyaan
            </label>
            <textarea
              id={`q-${qIdx}-text`}
              value={q.q}
              onChange={(e) => handleQuestionChange(qIdx, { q: e.target.value })}
              placeholder="Tulis pertanyaan di sini..."
              rows={2}
              className="w-full px-2.5 py-1.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors resize-none"
              data-testid={`question-text-${qIdx}`}
            />
          </div>

          {/* Options A-D */}
          <div className="space-y-1.5 mb-2">
            <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              Opsi (pilih yang benar)
            </label>
            {LETTERS.map((letter, optIdx) => (
              <div key={optIdx} className="flex items-center gap-2">
                <label
                  className="flex items-center gap-2 cursor-pointer flex-1"
                  htmlFor={`q-${qIdx}-opt-${optIdx}`}
                >
                  <input
                    type="radio"
                    name={`q-${qIdx}-ans`}
                    checked={q.ans === optIdx}
                    onChange={() => handleQuestionChange(qIdx, { ans: optIdx })}
                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500/30"
                    aria-label={`Pertanyaan ${qIdx + 1} opsi ${letter} adalah jawaban benar`}
                    data-testid={`question-${qIdx}-ans-${optIdx}`}
                  />
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                      q.ans === optIdx
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                    aria-hidden="true"
                  >
                    {letter}
                  </span>
                  <input
                    id={`q-${qIdx}-opt-${optIdx}`}
                    type="text"
                    value={q.opts[optIdx] ?? ''}
                    onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                    placeholder={`Opsi ${letter}`}
                    className="flex-1 px-2 py-1 text-xs text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                    data-testid={`question-${qIdx}-opt-${optIdx}`}
                  />
                </label>
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div>
            <label
              className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1"
              htmlFor={`q-${qIdx}-ex`}
            >
              Penjelasan
            </label>
            <textarea
              id={`q-${qIdx}-ex`}
              value={q.ex}
              onChange={(e) => handleQuestionChange(qIdx, { ex: e.target.value })}
              placeholder="Jelaskan kenapa jawaban ini benar..."
              rows={2}
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors resize-none"
              data-testid={`question-explanation-${qIdx}`}
            />
          </div>
        </div>
      ))}

      {/* Add question button */}
      <button
        type="button"
        onClick={handleAdd}
        className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 flex items-center justify-center gap-1.5"
        aria-label="Tambah pertanyaan kuis"
        data-testid="questions-add-btn"
      >
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>add</span>
        Tambah Pertanyaan
      </button>

      {/* Summary */}
      <div className="text-[10px] text-slate-400 text-center" data-testid="questions-summary">
        {questions.length} pertanyaan · {questions.filter((q) => q.q.trim()).length} terisi
      </div>
    </div>
  );
}
