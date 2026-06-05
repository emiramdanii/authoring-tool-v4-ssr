// ═══════════════════════════════════════════════════════════════════
// KUIS IMPORT — JSON import validator & mapper for quiz blocks
// ═══════════════════════════════════════════════════════════════════
// Sprint 2E — Multi-Question Import for Kuis
//
// PURPOSE:
//   Teachers can paste/import JSON from external AI tools
//   to populate a quiz block with multiple questions at once,
//   instead of filling each question one-by-one.
//
// DESIGN:
//   - JSON valid → parse → validate → map → applyGuidedSchemaPatch
//   - Strict validation with clear error messages
//   - Warnings are non-blocking (shown but allowed)
//   - Errors block the apply action
//
// FORMAT:
//   {
//     "title": "Kuis ...",        // optional
//     "questions": [
//       {
//         "q": "Pertanyaan?",
//         "opts": ["A", "B", "C", "D"],
//         "ans": 0,               // 0-based index
//         "ex": "Penjelasan"      // optional
//       }
//     ]
//   }
// ═══════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────

export interface KuisImportQuestion {
  q: string;
  opts: string[];
  ans: number;
  ex?: string;
}

export interface KuisImportPayload {
  title?: string;
  questions: KuisImportQuestion[];
}

export interface KuisImportValidation {
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

const MAX_QUESTIONS = 10;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;
const IDEAL_OPTIONS = 4;

// ── Validator ──────────────────────────────────────────────────

/**
 * Validates a parsed KuisImportPayload object.
 * Returns validation result with errors (blocking) and warnings (non-blocking).
 */
export function validateKuisImportPayload(data: unknown): KuisImportValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Must be an object
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { valid: false, errors: ['Format tidak valid: harus berupa objek JSON dengan field "questions".'], warnings: [], questionCount: 0 };
  }

  const obj = data as Record<string, unknown>;

  // 2. Check `questions` field
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

  // 3. Check question count limit
  if (questions.length > MAX_QUESTIONS) {
    errors.push(`Jumlah soal ${questions.length} melebihi batas maksimal ${MAX_QUESTIONS}. Kurangi jumlah soal atau bagi menjadi beberapa sesi kuis.`);
  }

  // 4. Check `title` if present
  if ('title' in obj && obj.title !== undefined && obj.title !== null) {
    if (typeof obj.title !== 'string') {
      errors.push('Field "title" harus berupa string jika ada.');
    }
  }

  // 5. Validate each question
  questions.forEach((q, i) => {
    const prefix = `Soal ${i + 1}`;

    if (typeof q !== 'object' || q === null || Array.isArray(q)) {
      errors.push(`${prefix}: harus berupa objek dengan field q, opts, ans.`);
      return;
    }

    const item = q as Record<string, unknown>;

    // q — required, non-empty string
    if (!('q' in item) || typeof item.q !== 'string' || item.q.trim() === '') {
      errors.push(`${prefix}: field "q" wajib diisi (pertanyaan tidak boleh kosong).`);
    }

    // opts — required, array of strings, min 2, max 6
    if (!('opts' in item) || !Array.isArray(item.opts)) {
      errors.push(`${prefix}: field "opts" wajib berupa array pilihan jawaban.`);
    } else {
      const opts = item.opts as unknown[];

      if (opts.length < MIN_OPTIONS) {
        errors.push(`${prefix}: minimal ${MIN_OPTIONS} pilihan jawaban, ditemukan ${opts.length}.`);
      }

      if (opts.length > MAX_OPTIONS) {
        errors.push(`${prefix}: maksimal ${MAX_OPTIONS} pilihan jawaban, ditemukan ${opts.length}.`);
      }

      if (opts.length > 0 && opts.length < IDEAL_OPTIONS) {
        warnings.push(`${prefix}: hanya ${opts.length} pilihan, idealnya ${IDEAL_OPTIONS} (A–D).`);
      }

      // Check each opt is a string
      opts.forEach((opt, j) => {
        if (typeof opt !== 'string' || opt.trim() === '') {
          errors.push(`${prefix}: pilihan ${String.fromCharCode(65 + j)} kosong atau bukan string.`);
        }
      });
    }

    // ans — required, number or numeric string, valid index
    if (!('ans' in item)) {
      errors.push(`${prefix}: field "ans" wajib diisi (index jawaban benar, 0-based).`);
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
      } else if (Array.isArray(item.opts) && ansNum >= item.opts.length) {
        errors.push(`${prefix}: jawaban benar (ans: ${ansNum}) di luar jumlah pilihan (${item.opts.length}).`);
      }
    }

    // ex — optional, string if present
    if ('ex' in item && item.ex !== undefined && item.ex !== null && typeof item.ex !== 'string') {
      errors.push(`${prefix}: field "ex" harus berupa string jika ada.`);
    }

    // Warning: no explanation
    if (!('ex' in item) || !item.ex || (typeof item.ex === 'string' && item.ex.trim() === '')) {
      warnings.push(`${prefix}: tidak ada penjelasan (ex). Disarankan untuk menambahkan feedback.`);
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
 * Parses raw JSON string into a KuisImportPayload.
 * Returns { data, error } — error is set if JSON is invalid.
 */
export function parseKuisImportJSON(raw: string): { data: KuisImportPayload | null; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { data: null, error: 'JSON kosong. Paste JSON kuis di kolom di atas.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { data: null, error: `JSON tidak valid: ${msg}` };
  }

  return { data: parsed as KuisImportPayload, error: null };
}

// ── Mapper ─────────────────────────────────────────────────────

export interface KuisImportPatch {
  title?: string;
  questions: Array<{
    q: string;
    opts: string[];
    ans: number;
    ex: string;
  }>;
}

/**
 * Maps a validated KuisImportPayload to a patch object
 * that can be applied via applyGuidedSchemaPatch().
 *
 * - Trims all strings
 * - Normalizes ans to number
 * - Ensures ex defaults to empty string
 * - Only includes title if provided and non-empty
 */
export function mapKuisImportToPatch(data: KuisImportPayload): KuisImportPatch {
  const patch: KuisImportPatch = {
    questions: data.questions.map(q => ({
      q: q.q.trim(),
      opts: q.opts.map(o => (typeof o === 'string' ? o.trim() : String(o))),
      ans: typeof q.ans === 'number' ? q.ans : parseInt(String(q.ans), 10),
      ex: typeof q.ex === 'string' ? q.ex.trim() : '',
    })),
  };

  if (data.title?.trim()) {
    patch.title = data.title.trim();
  }

  return patch;
}

// ── Sample JSON for "Salin Contoh Format" ──────────────────────

export const KUIS_IMPORT_SAMPLE: string = JSON.stringify({
  title: 'Kuis Macam-Macam Norma',
  questions: [
    {
      q: 'Norma yang bersumber dari Tuhan disebut ...',
      opts: ['Norma agama', 'Norma hukum', 'Norma adat', 'Norma kesopanan'],
      ans: 0,
      ex: 'Norma agama bersumber dari ajaran Tuhan.',
    },
    {
      q: 'Contoh norma hukum adalah ...',
      opts: ['Berdoa sebelum makan', 'Memakai helm saat berkendara', 'Mengucapkan salam', 'Menolong teman'],
      ans: 1,
      ex: 'Memakai helm di jalan raya diatur dalam hukum.',
    },
  ],
}, null, 2);
