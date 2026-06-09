// ═══════════════════════════════════════════════════════════════════
// RODA IMPORT — JSON import validator & mapper for wheel game
// ═══════════════════════════════════════════════════════════════════
// Sprint 2G — Import JSON for Roda (Wheel) Game
//
// PURPOSE:
//   Teachers can paste/import JSON from external AI tools
//   to populate a wheel game with questions at once.
//
// DUAL FORMAT SUPPORT:
//   AI tools often output quiz-style JSON with opts as string[]
//   and ans as index. The roda-game renderer needs opts as
//   { text, correct } objects. This module accepts BOTH formats:
//
//   Format A (native roda):
//     opts: [{ text: "A", correct: true }, { text: "B", correct: false }]
//
//   Format B (AI-friendly, like kuis):
//     opts: ["A", "B", "C", "D"]
//     ans: 0
//
//   The mapper converts Format B → Format A automatically.
//
// DESIGN:
//   - JSON valid → parse → validate → map → applyGuidedSchemaPatch
//   - Strict validation with clear error messages
//   - Warnings are non-blocking (shown but allowed)
//   - Errors block the apply action
//
// FORMAT:
//   {
//     "title": "Roda Pengetahuan",       // optional
//     "questions": [
//       {
//         "q": "Pertanyaan?",
//         "opts": [{ "text": "A", "correct": true }, ...],  // Format A
//         // OR: "opts": ["A", "B", "C"], "ans": 0,         // Format B
//         "feedbackCorrect": "Tepat!",      // optional
//         "feedbackWrong": "Kurang tepat.", // optional
//         "diskusiHint": "Mengapa?"         // optional
//       }
//     ]
//   }
// ═══════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────

import { stripJsonFence } from './strip-json-fence';

/** Format A: native roda opts */
export interface RodaImportOptNative {
  text: string;
  correct: boolean;
}

/** Format B: AI-friendly string opts (requires ans field) */
export type RodaImportOptString = string;

/** Question in native format (opts are objects) */
export interface RodaImportQuestionNative {
  q: string;
  opts: RodaImportOptNative[];
  feedbackCorrect?: string;
  feedbackWrong?: string;
  diskusiHint?: string;
}

/** Question in AI-friendly format (opts are strings + ans index) */
export interface RodaImportQuestionAI {
  q: string;
  opts: RodaImportOptString[];
  ans: number;
  feedbackCorrect?: string;
  feedbackWrong?: string;
  diskusiHint?: string;
}

/** Union: either format per question */
export type RodaImportQuestion = RodaImportQuestionNative | RodaImportQuestionAI;

export interface RodaImportPayload {
  title?: string;
  questions: RodaImportQuestion[];
}

export interface RodaImportValidation {
  /** Whether the payload is valid (no errors, warnings are OK) */
  valid: boolean;
  /** Fatal errors — block the apply action */
  errors: string[];
  /** Non-fatal warnings — shown but do not block */
  warnings: string[];
  /** Number of questions in the payload */
  questionCount: number;
}

// ── Constants ──────────────────────────────────────────────────

const MAX_QUESTIONS = 6;
const MIN_OPTS = 2;
const MAX_OPTS = 4;

// ── Helpers ────────────────────────────────────────────────────

/**
 * Detects whether a question's opts are in Format A (native) or Format B (AI-friendly).
 * Returns 'native' if opts are objects with text+correct, 'ai' if opts are strings.
 * Returns 'unknown' if the format cannot be determined.
 */
function detectOptsFormat(opts: unknown[]): 'native' | 'ai' | 'unknown' {
  if (opts.length === 0) return 'unknown';
  const first = opts[0];
  if (typeof first === 'string') return 'ai';
  if (typeof first === 'object' && first !== null && !Array.isArray(first)) return 'native';
  return 'unknown';
}

// ── Validator ──────────────────────────────────────────────────

/**
 * Validates a parsed RodaImportPayload object.
 * Returns validation result with errors (blocking) and warnings (non-blocking).
 *
 * Key validations:
 *   - questions: 1–6 items
 *   - opts: 2–4 items per question
 *   - Format A (native): each opt needs text + correct, at least 1 correct
 *   - Format B (AI-friendly): opts are strings, ans is valid index
 *   - Auto-detects format per question
 */
export function validateRodaImportPayload(data: unknown): RodaImportValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Must be an object
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { valid: false, errors: ['Format tidak valid: harus berupa objek JSON dengan field "questions".'], warnings: [], questionCount: 0 };
  }

  const obj = data as Record<string, unknown>;

  // 2. Check `title` if present
  if ('title' in obj && obj.title !== undefined && obj.title !== null) {
    if (typeof obj.title !== 'string') {
      errors.push('Field "title" harus berupa string jika ada.');
    }
  }

  // 3. Check `questions` field
  if (!('questions' in obj)) {
    return { valid: false, errors: ['Field "questions" wajib ada.'], warnings: [], questionCount: 0 };
  }

  if (!Array.isArray(obj.questions)) {
    return { valid: false, errors: ['Field "questions" harus berupa array.'], warnings: [], questionCount: 0 };
  }

  const questions = obj.questions as unknown[];

  if (questions.length === 0) {
    return { valid: false, errors: ['Field "questions" tidak boleh kosong — minimal 1 soal.'], warnings: [], questionCount: 0 };
  }

  // 4. Check question count limit
  if (questions.length > MAX_QUESTIONS) {
    errors.push(`Jumlah soal ${questions.length} melebihi batas maksimal ${MAX_QUESTIONS}. Kurangi jumlah soal atau bagi menjadi beberapa game roda.`);
  }

  // 5. Validate each question
  questions.forEach((q, i) => {
    const prefix = `Soal ${i + 1}`;

    if (typeof q !== 'object' || q === null || Array.isArray(q)) {
      errors.push(`${prefix}: harus berupa objek dengan field q dan opts.`);
      return;
    }

    const item = q as Record<string, unknown>;

    // q — required, non-empty string
    if (!('q' in item) || typeof item.q !== 'string' || item.q.trim() === '') {
      errors.push(`${prefix}: field "q" wajib diisi (pertanyaan tidak boleh kosong).`);
    }

    // opts — required, array
    if (!('opts' in item) || !Array.isArray(item.opts)) {
      errors.push(`${prefix}: field "opts" wajib berupa array pilihan jawaban.`);
      return; // Can't validate further without opts
    }

    const opts = item.opts as unknown[];

    if (opts.length < MIN_OPTS) {
      errors.push(`${prefix}: minimal ${MIN_OPTS} pilihan jawaban, ditemukan ${opts.length}.`);
    }

    if (opts.length > MAX_OPTS) {
      errors.push(`${prefix}: maksimal ${MAX_OPTS} pilihan jawaban, ditemukan ${opts.length}.`);
    }

    // Detect format
    const format = detectOptsFormat(opts);

    if (format === 'native') {
      // Format A: opts are { text, correct } objects
      let correctCount = 0;
      opts.forEach((opt, j) => {
        const optPrefix = `${prefix} Pilihan ${j + 1}`;
        if (typeof opt !== 'object' || opt === null || Array.isArray(opt)) {
          errors.push(`${optPrefix}: harus berupa objek dengan field "text" dan "correct".`);
          return;
        }
        const o = opt as Record<string, unknown>;

        // text — required, non-empty string
        if (!('text' in o) || typeof o.text !== 'string' || o.text.trim() === '') {
          errors.push(`${optPrefix}: field "text" wajib diisi (teks pilihan tidak boleh kosong).`);
        }

        // correct — required, boolean
        if (!('correct' in o) || typeof o.correct !== 'boolean') {
          errors.push(`${optPrefix}: field "correct" wajib berupa boolean (true/false).`);
        } else if (o.correct === true) {
          correctCount++;
        }
      });

      // At least 1 correct answer
      if (correctCount === 0 && opts.length > 0) {
        errors.push(`${prefix}: minimal 1 pilihan harus bertanda "correct": true.`);
      }

      // Warning: more than 1 correct
      if (correctCount > 1) {
        warnings.push(`${prefix}: ${correctCount} pilihan ditandai correct. Idealnya hanya 1 jawaban benar per soal.`);
      }

    } else if (format === 'ai') {
      // Format B: opts are strings, ans is required
      opts.forEach((opt, j) => {
        if (typeof opt !== 'string' || opt.trim() === '') {
          errors.push(`${prefix}: pilihan ${String.fromCharCode(65 + j)} kosong atau bukan string.`);
        }
      });

      // ans — required for AI format
      if (!('ans' in item)) {
        errors.push(`${prefix}: format opts string[] membutuhkan field "ans" (index jawaban benar, 0-based).`);
      } else {
        const ans = item.ans;
        let ansNum: number;

        if (typeof ans === 'number') {
          ansNum = ans;
        } else if (typeof ans === 'string' && /^-?\d+$/.test(ans.trim())) {
          ansNum = parseInt(ans, 10);
        } else {
          errors.push(`${prefix}: field "ans" harus berupa angka (0 = A, 1 = B, dst).`);
          return; // Skip further ans checks
        }

        if (!Number.isInteger(ansNum)) {
          errors.push(`${prefix}: field "ans" harus berupa integer, bukan desimal.`);
        } else if (ansNum < 0) {
          errors.push(`${prefix}: field "ans" tidak boleh negatif.`);
        } else if (ansNum >= opts.length) {
          errors.push(`${prefix}: jawaban benar (ans: ${ansNum}) di luar jumlah pilihan (${opts.length}).`);
        }
      }

    } else {
      // Unknown format
      if (opts.length > 0) {
        errors.push(`${prefix}: format opts tidak dikenali. Gunakan opts: [{ text, correct }] atau opts: ["A", "B", "C"].`);
      }
    }

    // feedbackCorrect — optional, string if present
    if ('feedbackCorrect' in item && item.feedbackCorrect !== undefined && item.feedbackCorrect !== null && typeof item.feedbackCorrect !== 'string') {
      errors.push(`${prefix}: field "feedbackCorrect" harus berupa string jika ada.`);
    }

    // feedbackWrong — optional, string if present
    if ('feedbackWrong' in item && item.feedbackWrong !== undefined && item.feedbackWrong !== null && typeof item.feedbackWrong !== 'string') {
      errors.push(`${prefix}: field "feedbackWrong" harus berupa string jika ada.`);
    }

    // diskusiHint — optional, string if present
    if ('diskusiHint' in item && item.diskusiHint !== undefined && item.diskusiHint !== null && typeof item.diskusiHint !== 'string') {
      errors.push(`${prefix}: field "diskusiHint" harus berupa string jika ada.`);
    }

    // Warnings: no feedback
    if (!('feedbackCorrect' in item) || !item.feedbackCorrect || (typeof item.feedbackCorrect === 'string' && item.feedbackCorrect.trim() === '')) {
      warnings.push(`${prefix}: tidak ada feedback benar (feedbackCorrect). Disarankan untuk menambahkan feedback.`);
    }
    if (!('feedbackWrong' in item) || !item.feedbackWrong || (typeof item.feedbackWrong === 'string' && item.feedbackWrong.trim() === '')) {
      warnings.push(`${prefix}: tidak ada feedback salah (feedbackWrong). Disarankan untuk menambahkan feedback.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    questionCount: questions.length,
  };
}

// ── Parser ─────────────────────────────────────────────────────

/**
 * Parses raw JSON string into a RodaImportPayload.
 * Returns { data, error } — error is set if JSON is invalid.
 */
export function parseRodaImportJSON(raw: string): { data: RodaImportPayload | null; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { data: null, error: 'JSON kosong. Paste JSON roda di kolom di atas.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(trimmed));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { data: null, error: `Format tidak valid. Pastikan Anda menyalin seluruh hasil dari AI, lalu coba lagi. Detail: ${msg}` };
  }

  return { data: parsed as RodaImportPayload, error: null };
}

// ── Mapper ─────────────────────────────────────────────────────

export interface RodaImportPatch {
  title?: string;
  questions: Array<{
    q: string;
    opts: Array<{
      text: string;
      correct: boolean;
    }>;
    feedbackCorrect: string;
    feedbackWrong: string;
    diskusiHint: string;
  }>;
}

/**
 * Maps a validated RodaImportPayload to a patch object
 * that can be applied via applyGuidedSchemaPatch().
 *
 * KEY OPERATION: dual format conversion
 *   - Format A (native): opts already { text, correct } — trim text
 *   - Format B (AI-friendly): opts are strings + ans → convert to { text, correct }
 *
 * All strings are trimmed. Feedback defaults to empty string.
 * Only includes title if provided and non-empty.
 */
export function mapRodaImportToPatch(data: RodaImportPayload): RodaImportPatch {
  const patch: RodaImportPatch = {
    questions: data.questions.map(q => {
      const opts = q.opts;
      let mappedOpts: Array<{ text: string; correct: boolean }>;

      if (opts.length > 0 && typeof opts[0] === 'string') {
        // Format B: AI-friendly — convert ans index → correct boolean
        const ansIndex = typeof (q as RodaImportQuestionAI).ans === 'number'
          ? (q as RodaImportQuestionAI).ans
          : parseInt(String((q as RodaImportQuestionAI).ans), 10);
        mappedOpts = (opts as string[]).map((text, i) => ({
          text: text.trim(),
          correct: i === ansIndex,
        }));
      } else {
        // Format A: native — trim text, keep correct
        mappedOpts = (opts as RodaImportOptNative[]).map(o => ({
          text: o.text.trim(),
          correct: o.correct,
        }));
      }

      return {
        q: q.q.trim(),
        opts: mappedOpts,
        feedbackCorrect: typeof q.feedbackCorrect === 'string' ? q.feedbackCorrect.trim() : '',
        feedbackWrong: typeof q.feedbackWrong === 'string' ? q.feedbackWrong.trim() : '',
        diskusiHint: typeof q.diskusiHint === 'string' ? q.diskusiHint.trim() : '',
      };
    }),
  };

  if (data.title?.trim()) {
    patch.title = data.title.trim();
  }

  return patch;
}

// ── Sample JSON for "Salin Contoh Format" ──────────────────────

// ── AI Prompt Template for "Salin Prompt AI" ──────────────────

export const RODA_AI_PROMPT = `Buatkan 5 soal permainan roda (wheel game) untuk mata pelajaran [TOPIK] kelas [KELAS] dalam format JSON berikut:

{
  "title": "Roda [Judul]",
  "questions": [
    {
      "q": "Pertanyaan?",
      "opts": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      "ans": 0,
      "feedbackCorrect": "Feedback jika benar",
      "feedbackWrong": "Feedback jika salah",
      "diskusiHint": "Pertanyaan diskusi lanjutan"
    }
  ]
}

Aturan:
- "q" = pertanyaan (wajib, string)
- "opts" = array 2-4 pilihan jawaban (wajib, string)
- "ans" = index jawaban benar, dimulai dari 0 (wajib, angka)
- "feedbackCorrect" = pesan jika jawaban benar (disarankan, string)
- "feedbackWrong" = pesan jika jawaban salah (disarankan, string)
- "diskusiHint" = pertanyaan diskusi lanjutan (opsional, string)
- "title" = judul game (opsional, string)
- Maksimal 6 soal
- Jangan tulis teks di luar JSON
- Langsung berikan JSON saja tanpa penjelasan tambahan`;

// ── Sample JSON for "Salin Contoh Format" ──────────────────────

export const RODA_IMPORT_SAMPLE: string = JSON.stringify({
  title: 'Roda Pengetahuan Norma',
  questions: [
    {
      q: 'Norma yang bersumber dari Tuhan disebut?',
      opts: ['Norma Agama', 'Norma Hukum', 'Norma Adat', 'Norma Kesopanan'],
      ans: 0,
      feedbackCorrect: 'Tepat! Norma agama bersumber dari ajaran Tuhan.',
      feedbackWrong: 'Kurang tepat. Norma agama bersumber dari Tuhan.',
      diskusiHint: 'Mengapa norma agama disebut norma tertinggi?',
    },
    {
      q: 'Sanksi pelanggaran norma hukum bersifat?',
      opts: [
        { text: 'Formal dan tegas', correct: true },
        { text: 'Tidak ada sanksi', correct: false },
        { text: 'Hanya dosa', correct: false },
        { text: 'Dicerca masyarakat', correct: false },
      ],
      feedbackCorrect: 'Benar! Sanksi hukum bersifat formal dan tegas.',
      feedbackWrong: 'Kurang tepat. Norma hukum punya sanksi formal.',
    },
  ],
}, null, 2);
