# QUIZ_GAME_GOLDEN_REFERENCE.md

**Status**: SPEC DOCUMENT (Batch 13A — QUIZ-GAME-GOLDEN-REFERENCE-AUDIT-01)
**Date**: 2026-06-26
**HEAD**: `8c41744`
**Purpose**: Document legacy quiz/game behavior that must be preserved in V5.

---

## 1. Core Principle

> "SILSE jangan jadi PowerPoint web. Quiz/Game harus punya internal state.
> Default: banyak soal/misi dalam 1 halaman, bukan 1 soal = 1 page."
> — Senior instruction

---

## 2. Legacy Quiz Behavior (Golden Reference)

### 2.1 Block Structure

```
KuisBlock {
  type: 'kuis',
  title: string,
  questions: Array<{
    q: string,       // question text
    opts: string[],  // 4 options (A-D)
    ans: number,     // correct option index (0-3)
    ex: string,      // explanation shown after answering
  }>
}
```

A single `kuis` block contains **ALL questions** for that quiz — not 1 question per block.

### 2.2 Runtime Behavior (Legacy quiz-renderers.ts)

**Step-reveal flow** — ALL questions in 1 block, navigated internally:

1. **Question display**: Shows 1 question at a time with 4 options (A/B/C/D)
2. **Answer selection**: User clicks an option → immediate visual feedback:
   - Correct: green highlight + explanation text
   - Incorrect: red highlight + correct answer shown + explanation
3. **Auto-advance**: After feedback, automatically advances to next question (1.5s delay)
4. **Progress bar**: Shows "Soal 1 dari 5" with visual progress fill
5. **Completion screen**: After last question, shows:
   - Score: "Skor: 4/5"
   - Percentage + level (Sangat Baik / Baik / Perlu Latihan)
   - Replay button: "🔄 Ulangi" — resets all state, starts from Q1
6. **Accessibility**: `role="progressbar"`, `aria-valuenow`, `aria-valuetext`, `aria-live="polite"`

### 2.3 Variants

Legacy supports 3 visual variants (via `block.variant`):
- **A (Klasik)**: Standard card layout
- **B (Kartu)**: Card-based with larger touch targets
- **C (Ringkas)**: Compact layout for dense content

All variants share the same step-reveal flow + completion behavior.

### 2.4 Defensive Normalization (Legacy)

Legacy renderer normalizes data at export boundary:
- `normalizeAnswerIndex()`: accepts numeric (0-3), letter ("A"-"D"), numeric string ("0"-"3")
- `normalizeBoolean()`: for true-false questions, accepts true/false/"true"/"false"/1/0/"1"/"0"
- `asText()`, `asArray()`: coerce null/undefined to safe defaults
- Invalid answers → marked as "non-scorable" (ans=-1, class `non-scorable`)
- Empty questions array → shows "Belum ada soal" empty state

---

## 3. Legacy Game Behavior (Golden Reference)

### 3.1 Sortir Game (sortir-game)

```
SortirGameBlock {
  type: 'sortir-game',
  title: string,
  pool: Array<{ id, text, category }>,    // items to sort
  kolom: Array<{ id, label, color }>,      // category columns
}
```

**Runtime behavior**:
1. All items shown in a "pool" area at top
2. All category columns shown below as drop zones
3. User **drags** items to categories (HTML5 draggable)
4. "✅ Periksa Jawaban" button validates all placements at once
5. Score = correct placements / total items
6. **Single screen** — no page navigation, no multi-step

### 3.2 Roda Game (roda-game)

```
RodaGameBlock {
  type: 'roda-game',
  title: string,
  stepMode: 'single' | 'all',    // 1 question at a time OR all at once
  questions: Array<{
    q: string,
    opts: Array<{ text, correct }>,
    feedbackCorrect?: string,
    feedbackWrong?: string,
  }>
}
```

**Runtime behavior**:
- `stepMode: 'single'` — shows 1 question at a time (like kuis step-reveal)
- `stepMode: 'all'` — shows ALL questions at once on same screen
- Each question has its own options + answer checking
- Feedback per question: correct/wrong + optional custom feedback messages

### 3.3 Other Game Types

| Game Type | Content | Internal State | Multi-item in 1 block? |
|---|---|---|---|
| `memory-game` | pairs: Array<{left, right}> | card flip state, match tracking | ✅ Yes — all pairs in 1 block |
| `matching-game` | items + categories | drag-drop, match tracking | ✅ Yes |
| `word-search-game` | words + grid | found words tracking | ✅ Yes |
| `drag-drop-game` | items + targets | placement tracking | ✅ Yes |
| `crossword-game` | clues + grid | cell input tracking | ✅ Yes |
| `team-buzzer-game` | teams + questions | turn tracking, score | ✅ Yes |
| `true-false-game` | questions Array<{q, ans}> | step-reveal like kuis | ✅ Yes |
| `fill-blank-game` | sentences with blanks | input tracking | ✅ Yes |

**Key pattern**: ALL game types support **multiple items/questions within a single block**. None require splitting across pages.

---

## 4. Current V5 Behavior Audit

### 4.1 V5 QuizWidget (src/components/canva/QuizWidget.tsx)

**ALREADY supports multi-question blocks** ✅

| Feature | Status | Evidence |
|---|---|---|
| Multiple questions per block | ✅ | `allQuestions` array, `currentQ` state |
| Step-reveal (1 at a time) | ✅ | `currentQ` increments on answer |
| Auto-advance after feedback | ✅ | `setTimeout(() => { setCurrentQ(q => q + 1) }, 1500)` |
| Progress indicator | ✅ | `currentQ + 1` / `total` shown in UI |
| Result screen | ✅ | `phase === 'result'` shows score + level |
| Replay | ✅ | `handleReplay` resets `currentQ`, `score`, `phase` |
| Score reporting | ✅ | `onComplete(score, total)` to interactive store |
| Sound effects | ✅ | `playSound('correct')`, `playSound('incorrect')`, `playSound('complete')` |

**Gap**: QuizWidget is ready, but **template** creates 5 separate pages (1 question each).

### 4.2 V5 GameWidget (src/components/canva/GameWidget.tsx)

**ALREADY supports multi-item games** ✅

| Feature | Status | Evidence |
|---|---|---|
| Routes to specific game component | ✅ | `gameType === 'sorting'` → `<SortingGame>` |
| All game types as React components | ✅ | 12+ game components in `src/components/canva/games/` |
| Internal state per game | ✅ | Each game component manages its own state |
| Score reporting | ✅ | `onComplete(score, maxScore)` |
| Interactive mode (export) | ✅ | `interactive={true}` in export mode |

### 4.3 V5 SortingGame (src/components/canva/games/SortingGame.tsx)

**ALREADY supports full sortir game in 1 block** ✅

| Feature | Status | Evidence |
|---|---|---|
| All items in pool | ✅ | `validItems` array |
| All categories as drop zones | ✅ | `kategori` array |
| Drag-drop interaction | ✅ | `sorted` state tracking |
| "Periksa Jawaban" validation | ✅ | `phase === 'done'` after check |
| Efficiency-based scoring | ✅ | `max(ceil(items*0.5), items - wrongAttempts)` |
| Replay | ✅ | State reset on data change |

### 4.4 PPKn Template (src/presets/ppkn/norma-golden-schema.ts)

**PROBLEM**: Template creates 5 separate kuis pages (1 question per page)

```typescript
// STANDAR: Quiz = 1 question per page
function createKuisPages(): SchemaCanvaPage[] {
  return QUIZ_QUESTIONS.map((q, i) => {
    return makeSchemaPage(
      `Kuis ${i + 1}`,
      'kuis',
      [{
        type: 'kuis',
        title: `Kuis: Macam-Macam Norma (${i + 1}/${QUIZ_QUESTIONS.length})`,
        questions: [q], // STANDAR: 1 question per page  ← PROBLEM
        // ...
      }],
      // ...
    );
  });
}
```

This creates **5 pages** (Kuis 1-5) instead of **1 page** with 5 questions.

**Fix needed**: Replace `createKuisPages()` with `createKuisPage()` that creates 1 page with all 5 questions in 1 block.

---

## 5. V5 Spec — Required Default Behavior

### 5.1 Quiz Default

```
1 halaman kuis = 1 block kuis = SEMUA soal (5-10 questions)

Block:
{
  type: 'kuis',
  title: 'Kuis: Macam-Macam Norma',
  questions: [
    { q: 'Q1?', opts: ['A','B','C','D'], ans: 0, ex: '...' },
    { q: 'Q2?', opts: ['A','B','C','D'], ans: 1, ex: '...' },
    // ... 3-8 more
  ]
}

Runtime (QuizWidget already handles this):
- Q1 shown → user answers → feedback → auto-advance to Q2
- Progress: "Soal 2/5"
- After Q5 → result screen with total score + replay
```

### 5.2 Game Default

```
1 halaman game = 1 block game = SEMUA misi/items

Block (sortir example):
{
  type: 'sortir-game',
  title: 'Sortir Norma',
  pool: [ ... 6-10 items ... ],
  kolom: [ ... 2-4 categories ... ]
}

Runtime (SortingGame already handles this):
- All items in pool, all categories as drop zones
- User sorts all items → "Periksa Jawaban" → score
- Single screen, no page navigation
```

### 5.3 What Changes

| Component | Change Needed? | What |
|---|---|---|
| QuizWidget | ❌ None | Already supports multi-question |
| GameWidget | ❌ None | Already supports multi-item |
| SortingGame | ❌ None | Already supports full game in 1 block |
| QuestionsFieldEditor (Batch 07A) | ❌ None | Already edits questions[] array |
| SortItemsFieldEditor (Batch 07B) | ❌ None | Already edits pool + kolom |
| PPKn template | ✅ **YES** | Replace 5 kuis pages with 1 kuis page |
| Other templates | ✅ Audit | Check if they also split quiz across pages |
| Export pipeline | ❌ None | React components already handle multi-question |

---

## 6. Export HTML Standalone — Must Still Work

V5 export pipeline renders quiz/game via React components:
- `entry-client.tsx` → `ExportApp` → `PageRenderer mode="export"` → `BlockRenderer`
- `BlockRenderer` renders `QuizWidget` / `GameWidget` with `interactive=true`
- `QuizWidget` already handles multiple questions with internal navigation
- `GameWidget` already handles all game types with internal state

**No export pipeline changes needed.** The fix is at template/schema level only.

---

## 7. Golden Reference Files (Quarantined — Read Only)

These files are quarantined in `src/legacy-disabled/` but document the behavior
that V5 must preserve:

| File | Location | Reference Value |
|---|---|---|
| `game-renderers.ts` | `src/legacy-disabled/lib/export/` | Legacy game HTML rendering patterns (sortir, roda, memory, etc.) |
| `html-templates.ts` | `src/legacy-disabled/lib/export/` | Legacy export renderer (quiz + game step-reveal flow) |
| `quiz-e1-qa.test.ts` | `src/__tests__/` (NOT in CI) | Documents legacy quiz behavior expectations |

**Rule**: Read for behavior reference. Do NOT restore to active code. V5 uses
React components (QuizWidget, GameWidget) for rendering, not legacy HTML renderers.

---

## 8. Constraints for Implementation (Batch 13B+)

- ❌ Jangan hidupkan editor legacy (CanvaBuilder, AuthoringTool — quarantined)
- ❌ Jangan import dari `src/legacy-disabled/` ke runtime aktif
- ❌ Jangan ubah export pipeline (use-vite-export, API route, entry-client)
- ❌ Jangan ubah save/load/persistence
- ❌ Jangan ubah ProductShell / CleanEditorV5
- ✅ Boleh ubah template presets (PPKn, materi-kuis, pertemuan-lengkap)
- ✅ Boleh audit + adjust QuizWidget/GameWidget if needed
- ✅ Export HTML standalone tetap wajib jalan
- ✅ Legacy quiz/game = acuan perilaku, bukan runtime utama
