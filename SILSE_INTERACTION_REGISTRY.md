# SILSE_INTERACTION_REGISTRY

**Status**: CONTRACT v1.0
**Date**: 2026-06-25
**HEAD**: `25f8602`

---

## 1. Principle

Interactions in SILSE are **schema-driven**, not code-driven. Each interactive block type declares its interaction pattern via the `PageRuntimeContract`. The renderer implements the pattern; the schema only provides data and hints.

**Forbidden**: Inline JavaScript, event handlers in JSON, dynamic code evaluation, `eval()`, `new Function()`.

**Allowed**: Block type declaration (determines interaction), `semantic.interactionType` hint, `compression.strategy` hint.

---

## 2. Completion Types

Every page has a `PageRuntimeContract` that defines how completion is determined:

| CompletionType | Description | Trigger | Block Types |
|---|---|---|---|
| `view` | Visiting = complete | Page rendered | cover, petunjuk, tujuan, motivasi |
| `scroll` | Viewing all content = complete | All blocks visible | materi, rangkuman, hasil |
| `answer` | Answering at least one question = complete | User submits answer | kuis |
| `game` | Completing the game activity = complete | Game reports completion | sortir-game, roda-game, memory-game, etc. |
| `reflection` | Submitting a reflection answer = complete | User types + submits | refleksi, diskusi |

**Navigation lock**: In export (student) mode, pages with `completionType` ≠ 'view'/'scroll' may lock next-page navigation until completed. In preview (teacher) mode, `hideCompletionBadge=true` — no lock, no badge.

---

## 3. Interaction Patterns

### 3.1 Answer Pattern (Kuis)

```json
{
  "type": "kuis",
  "questions": [{
    "q": "Norma yang sanksinya berupa dosa disebut norma...",
    "opts": ["Norma Agama", "Norma Kesusilaan", "Norma Kesopanan", "Norma Hukum"],
    "ans": 0,
    "ex": "Norma agama berasal dari Tuhan YME dan sanksinya berupa dosa."
  }]
}
```

**Interaction flow**:
1. User reads question + options
2. User clicks an option
3. Renderer highlights correct (green) / incorrect (red)
4. Score reported to interactive store: `reportScore({ score: correct ? 1 : 0, maxScore: 1, completed: true })`
5. Page marked complete
6. Navigation unlocked (export mode)

**State**: Per-question answer state is in component state (not persisted in schema). Score is in `interactiveStore.scores[]`.

---

### 3.2 Game Pattern (Sortir, Memory, Matching, etc.)

```json
{
  "type": "sortir-game",
  "categories": [{ "id": "agama", "label": "Norma Agama", "color": "y" }],
  "items": [{ "id": "i1", "text": "Beribadah", "category": "agama" }]
}
```

**Interaction flow**:
1. User drags items to categories (or clicks to assign)
2. Renderer validates placement
3. On completion: `reportScore({ score: correct, maxScore: total, completed: true })`
4. Page marked complete

**State**: Game progress is in component state. Score is in `interactiveStore`.

---

### 3.3 Reflection Pattern (Refleksi, Diskusi)

```json
{
  "type": "refleksi",
  "questions": [{
    "teks": "Hal baru apa yang kamu pelajari?",
    "petunjuk": "Tuliskan minimal 2 hal baru.",
    "warna": "c",
    "icon": "🪞"
  }],
  "penugasan": {
    "judul": "Komitmen Pribadi",
    "isi": "Tulis satu komitmen nyata..."
  }
}
```

**Interaction flow**:
1. User reads question
2. User types response in textarea
3. User clicks "Kirim Refleksi"
4. Renderer shows completion screen (checkmarks, thank you)
5. `reportScore({ score: 0, maxScore: 0, completed: true })` — completion without score
6. Page marked complete

**State**: Responses are in component state (not persisted in schema). Completion is in `interactiveStore`.

---

### 3.4 Skenario Pattern (Choose-your-own-adventure)

```json
{
  "type": "skenario",
  "chapters": [{
    "id": "ch1",
    "charEmoji": "🏫",
    "title": "Situasi di Sekolah",
    "setup": [{ "speaker": "Rizki", "text": "..." }],
    "choicePrompt": "Bagaimana sikapmu?",
    "choices": [{
      "icon": "✅",
      "label": "Mengingatkan dengan sopan",
      "detail": "Itu contoh penerapan norma kesopanan!",
      "good": true,
      "pts": 10,
      "norma": "Kesopanan",
      "nextChapter": 1
    }]
  }]
}
```

**Interaction flow**:
1. User reads scenario setup
2. User chooses an option
3. Renderer shows result + feedback
4. Score reported: `reportScore({ score: choice.pts, maxScore: 10, completed: true })`
5. If `nextChapter` is set, advance to next chapter
6. Page marked complete when all chapters resolved

---

### 3.5 View/Scroll Pattern (Non-interactive)

```json
{
  "type": "def-box",
  "content": "Norma adalah peraturan..."
}
```

**Interaction flow**:
1. User views the content
2. Page auto-completes on visit (`completionType: 'view'` or `'scroll'`)
3. No user input required
4. No score reported

---

## 4. Score System

### Score Entry Structure

```typescript
interface ScoreEntry {
  pageId: string;       // Block ID that reported the score
  screenIndex: number;  // Page index
  score: number;        // Points earned
  maxScore: number;     // Maximum possible points
  completed: boolean;   // Is this page complete?
  timestamp: number;    // When scored
}
```

### Score Tiers

| Percentage | Label | Color Token |
|---|---|---|
| ≥ 90% | Luar Biasa | `y` (gold) |
| ≥ 75% | Hebat | `g` (green) |
| ≥ 50% | Cukup Baik | `c` (cyan) |
| < 50% | Terus Berlatih | `o` (orange) |

### Score Flow

```
Block renderer (KuisRenderer, GameRenderer, etc.)
  → useInteractiveStore.reportScore({ elementId, pageIndex, score, maxScore, completed })
  → interactiveStore.scores[] updated
  → learningMediaStore.syncScores() called
  → PageRuntimeContract.completionType checked
  → If completed: learningMediaStore.markPageAnswered/Completed/Reflected()
  → Navigation lock released (if applicable)
  → ScoreDisplay updates in navbar
```

**Authority**: `interactiveStore.scores[]` is the runtime score source. Exported HTML starts with empty scores (fresh session).

---

## 5. Sound System

Sounds are triggered by interaction events:

| Event | Sound | Trigger |
|---|---|---|
| `click` | Soft click | Any button click |
| `correct` | Success chime | Correct answer in kuis/game |
| `wrong` | Error buzz | Incorrect answer in kuis/game |
| `complete` | Completion fanfare | Page completed |
| `navigate` | Whoosh | Page navigation |

**Control**: `authoringStore.suara` object controls which sounds are enabled:
```json
{ "navigasi": true, "benar": true, "salah": true, "selesai": true, "klik": true, "skor": true }
```

**Export**: Sounds are bundled in the exported HTML (base64 audio). No external dependencies.

---

## 6. Interaction Block Registry

| Block Type | CompletionType | Interactive | Score | Pattern |
|---|---|---|---|---|
| `cover` | view | No | — | — |
| `petunjuk` | view | No | — | — |
| `tujuan-display` | view | No | — | — |
| `motivasi` | view | No | — | — |
| `skenario` | answer | Yes | Yes (pts) | Skenario |
| `materi-section` | scroll | No | — | — |
| `def-box` | scroll | No | — | — |
| `materi-blok` | scroll | No | — | — |
| `nc-grid` | scroll | No | — | — |
| `diskusi` | reflection | Yes (text) | No (completion only) | Reflection |
| `kuis` | answer | Yes | Yes (1 per Q) | Answer |
| `sortir-game` | game | Yes | Yes | Game |
| `roda-game` | game | Yes | Yes | Game |
| `memory-game` | game | Yes | Yes | Game |
| `matching-game` | game | Yes | Yes | Game |
| `fill-blank-game` | game | Yes | Yes | Game |
| `word-search-game` | game | Yes | Yes | Game |
| `true-false-game` | game | Yes | Yes | Game |
| `drag-drop-game` | game | Yes | Yes | Game |
| `crossword-game` | game | Yes | Yes | Game |
| `team-buzzer-game` | game | Yes | Yes | Game |
| `refleksi` | reflection | Yes (text) | No (completion only) | Reflection |
| `rangkuman` | scroll | No | — | — |
| `penutup` | view | No | — | — |
| `tabel-accord` | scroll | Yes (expand) | No | View + expand |
| `hasil` | view | No | — | Score display |

---

## 7. Future: Interaction Registry API (Target)

Current state: Interaction patterns are hardcoded in block renderers + PageRuntimeContract.

Target state: A formal **Interaction Registry** where each pattern is registered:

```typescript
registerInteraction({
  blockType: 'kuis',
  completionType: 'answer',
  scoreType: 'per-question',
  renderer: KuisRenderer,
  validator: validateKuisBlock,
  skinDefaults: { cardStyle: 'accent-stripe', feedbackStyle: 'inline' },
});
```

This would allow:
- Adding new interaction types without modifying core renderer
- Swapping interaction skins via style contract
- Validating interaction data at import time
- Generating interaction-aware UI (navigation lock, score display) automatically

This is a **future batch** — not implemented yet. The current registry documents the existing patterns.

## Runtime Status (BATCH-03)

| Component | Document Status | Runtime Status |
|---|---|---|
| Import JSON Contract | COMPLETE | Validator not yet implemented (Batch 08) |
| Style Contract | FOUNDATION | Global layout/interaction style = future (Batch 09) |
| Interaction Registry | DOCUMENTED | Formal registerInteraction() API = future |
