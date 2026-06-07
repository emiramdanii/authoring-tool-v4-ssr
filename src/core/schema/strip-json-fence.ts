// ═══════════════════════════════════════════════════════════════════
// STRIP JSON FENCE — Pre-parser cleanup for AI-generated JSON
// ═══════════════════════════════════════════════════════════════════
// Sprint 2H.2 — Robust AI JSON Parser
//
// PROBLEM:
//   ChatGPT and other AI tools frequently wrap JSON output in:
//   - Markdown code fences: ```json { ... } ```
//   - Leading text: "Berikut JSON yang Anda minta:"
//   - Trailing text: "Semoga membantu!"
//   - Any combination of the above
//
//   The raw clipboard paste from AI often looks like:
//     "Berikut JSON yang Anda minta:\n```json\n{...}\n```\nSemoga membantu!"
//
//   JSON.parse() fails on this because it only accepts pure JSON.
//
// SOLUTION:
//   stripJsonFence() extracts the JSON object from AI output by:
//   1. Extracting content from the first markdown code block that
//      looks like a JSON object (starts with '{')
//   2. If no code block found, finding the outermost JSON object
//      by matching the first '{' to the last '}'
//   3. Returning the cleaned string for JSON.parse()
//
// SAFETY:
//   - If the input is already valid JSON, it passes through unchanged
//   - If no JSON-like content is found, returns the trimmed input
//     so JSON.parse() gives a clear error message
//   - Never modifies the JSON content itself — only strips
//     surrounding non-JSON text
// ═══════════════════════════════════════════════════════════════════

/**
 * Strips markdown code fences and surrounding text from AI-generated JSON.
 *
 * Handles these common AI output patterns:
 *   1. Pure JSON:                        `{"title":"Kuis",...}`
 *   2. Markdown code fence:              ` ```json\n{...}\n``` `
 *   3. Code fence without language tag:  ` ```\n{...}\n``` `
 *   4. Leading text + code fence:        `Berikut JSON:\n```json\n{...}\n````
 *   5. Leading text + raw JSON:          `Berikut JSON:\n{...}`
 *   6. Raw JSON + trailing text:         `{...}\nSemoga membantu!`
 *   7. Multiple code blocks:             picks first block containing a JSON object
 *
 * @param raw - The raw clipboard text pasted by the teacher
 * @returns Cleaned string ready for JSON.parse()
 */
export function stripJsonFence(raw: string): string {
  const s = raw.trim();

  // ── Fast path: already looks like valid JSON ──
  if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
    return s;
  }

  // ── Strategy 1: Extract from markdown code block ──
  const codeBlockContent = extractCodeBlock(s);
  if (codeBlockContent !== null) {
    return codeBlockContent;
  }

  // ── Strategy 2: Find JSON object by brace matching ──
  const extracted = extractByBraces(s);
  if (extracted !== null) {
    return extracted;
  }

  // ── Fallback: return trimmed input for clear JSON.parse error ──
  return s;
}

// ── Code Block Extraction ──────────────────────────────────────

/**
 * Regex to match markdown code blocks.
 * Captures the optional language tag and the block content.
 * Handles:
 *   ```json\n{...}\n```
 *   ```\n{...}\n```
 *   ```json\r\n{...}\r\n```
 */
const CODE_BLOCK_RE = /```(?:[a-zA-Z+-]*)\s*\r?\n([\s\S]*?)\r?\n```/g;

/**
 * Extracts JSON content from the first markdown code block
 * that contains a JSON object (starts with '{').
 *
 * Returns null if no suitable code block is found.
 */
function extractCodeBlock(text: string): string | null {
  let match: RegExpExecArray | null;

  // Reset regex state
  CODE_BLOCK_RE.lastIndex = 0;

  while ((match = CODE_BLOCK_RE.exec(text)) !== null) {
    const content = match[1].trim();
    // Check if this code block contains a JSON object
    if (content.startsWith('{')) {
      return content;
    }
  }

  return null;
}

// ── Brace Matching Extraction ──────────────────────────────────

/**
 * Extracts the outermost JSON object from text by finding
 * the first '{' and matching it to the last '}'.
 *
 * This handles:
 *   "Berikut JSON:\n{...}\nSemoga membantu!"
 *   "{...}\nPenjelasan tambahan"
 *
 * Returns null if no '{' is found.
 */
function extractByBraces(text: string): string | null {
  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) {
    return null;
  }

  const lastBrace = text.lastIndexOf('}');
  if (lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return text.slice(firstBrace, lastBrace + 1);
}
