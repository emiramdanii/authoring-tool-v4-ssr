# SILSE_IMPORT_JSON_CONTRACT

**Status**: CONTRACT v1.0
**Date**: 2026-06-25
**HEAD**: `402f385`

---

## 1. Principle

SILSE is a **schema-based interactive learning media builder**. Content enters the system as structured JSON (not HTML/CSS/JS). The renderer (PageRenderer + SchemaScreenRenderer) interprets the schema and applies style tokens. AI/guru produces JSON; the app renders it.

**Forbidden in JSON**:
- Raw HTML strings (except limited inline formatting: `<strong>`, `<em>`, `<br/>` in RichText fields)
- CSS rules or style attributes
- JavaScript code or event handlers
- `<script>`, `<iframe>`, `<object>`, `<embed>` tags
- `on*` attributes (onclick, onload, etc.)
- `javascript:` or `vbscript:` URLs

**Allowed in JSON**:
- Structured block data (text fields, arrays, objects)
- Emoji and Unicode characters (as display text)
- Token color keys ('y', 'c', 'g', 'p', 'r', 'o') — NOT raw hex colors
- Block type identifiers (from registered block types)
- Variant identifiers ('A', 'B', 'C')
- Compression hints (`compression: { priority, strategy }`)
- Semantic hints (`semantic: { learningPhase, interactionType, importance }`)

---

## 2. Top-Level Structure

```json
{
  "version": 2,
  "templateType": "cover",
  "themeId": "modern-interactive",
  "contractId": "golden-pertemuan",
  "sceneType": "intro",
  "sectionLabel": "Cover",
  "sectionColor": "y",
  "background": {
    "type": "gradient",
    "color1": "#...",
    "color2": "#...",
    "imageUrl": null,
    "overlay": 20,
    "overlayType": "dark",
    "imageFit": "cover",
    "imageOpacity": 100,
    "imageBlur": 0
  },
  "blocks": [ ... ]
}
```

### Field Rules

| Field | Type | Required | Description |
|---|---|---|---|
| `version` | number | Yes | Schema version. Current: 2. Migration v0→v1→v2 is automatic. |
| `templateType` | string | Yes | Page type from PageTemplateType enum. Determines scene layout + contract. |
| `themeId` | string | Yes | Style preset ID. Maps to StylePresetDefinition. |
| `contractId` | string | No | Optional visual contract override. If set, overrides token values. |
| `sceneType` | string | No | Educational scene type. Inferred from templateType if absent. |
| `sectionLabel` | string | No | Display label for page section badge. |
| `sectionColor` | string | No | Token color key for section badge. |
| `background` | object | No | Page background config. If absent, uses theme default. |
| `blocks` | array | Yes | Array of block objects. Min 1 block. |

---

## 3. Block Structure (Common Fields)

Every block has these base fields:

```json
{
  "id": "block-unique-id",
  "type": "block-type",
  "variant": "A",
  "compression": {
    "priority": "high",
    "strategy": "none"
  },
  "semantic": {
    "learningPhase": "pendahuluan",
    "interactionType": "read",
    "importance": 0.9
  },
  "layout": {
    "position": "flow",
    "x": null,
    "y": null,
    "width": "auto",
    "height": "auto"
  }
}
```

### Base Field Rules

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique block ID within the schema. Used for selection, editing, history. |
| `type` | string | Yes | Block type from registered types (see Block Type Registry below). |
| `variant` | string | No | Visual variant: 'A' (default), 'B', 'C'. Controls renderer layout. |
| `compression` | object | No | Compression hint for SceneLayoutEngine. `priority`: 'high'\|'medium'\|'low'. `strategy`: 'none'\|'accordion'\|'reveal-set'\|'collapsible'\|'scroll'. |
| `semantic` | object | No | Educational metadata for scene-aware rendering. |
| `layout` | object | No | Spatial layout override. `position`: 'flow'\|'absolute'. If 'absolute', x/y/width/height are percentages (0-100). |

---

## 4. Block Type Registry

### Content Blocks

| Type | Display Name | Key Fields | Interactive |
|---|---|---|---|
| `cover` | Cover | icon, title, subtitle, badges[], meta{}, cta{} | No |
| `petunjuk` | Petunjuk | icon, title, items[], tips, tipsColor | No |
| `tujuan-display` | Tujuan | title, objectives[], profil, profilColor | No |
| `motivasi` | Motivasi | title, hookQuestion, visual{}, connections[], transition | No |
| `skenario` | Skenario | title, chapters[] (charEmoji, title, setup[], choices[]) | Yes (choose) |
| `materi-section` | Bagian Materi | icon, title, subtitle | No |
| `def-box` | Definisi | title, content, borderColor | No |
| `materi-blok` | Materi | icon, title, subtitle, body | No |
| `nc-grid` | Kartu Info | cards[] (icon, title, body, color) | No |
| `diskusi` | Diskusi | title, intro, questions[] (label, icon, teks, petunjuk, color) | Yes (discuss) |
| `refleksi` | Refleksi | title, intro, questions[] (teks, petunjuk, warna, icon), penugasan{} | Yes (reflect) |
| `rangkuman` | Rangkuman | title, concepts[] (icon, title, body, color), closingStatement, accentColor | No |
| `penutup` | Penutup | title, subtitle, preview[] (icon, judul, isi, warna), nextPertemuan{} | No |
| `tabel-accord` | Tabel Akordion | title, rows[] (header, content, icon, color) | Yes (expand) |
| `hasil` | Hasil | title, subtitle, scores[], tier | No |

### Game Blocks

| Type | Display Name | Key Fields | Interactive |
|---|---|---|---|
| `kuis` | Kuis | title, intro, questions[] (q, opts[], ans, ex) | Yes (answer) |
| `sortir-game` | Game Sortir | title, categories[], items[] | Yes (drag-drop) |
| `roda-game` | Roda Berputar | title, segments[], questions[] | Yes (spin) |
| `memory-game` | Memory | title, pairs[] | Yes (match) |
| `matching-game` | Matching | title, leftItems[], rightItems[] | Yes (match) |
| `fillblank-game` | Isian Kosong | title, sentences[], answers[] | Yes (type) |
| `wordsearch-game` | Cari Kata | title, grid[][], words[] | Yes (find) |
| `truefalse-game` | Benar/Salah | title, statements[] | Yes (answer) |
| `dragdrop-game` | Drag & Drop | title, zones[], items[] | Yes (drag) |
| `crossword-game` | Teka Silang | title, grid[][], clues[] | Yes (fill) |
| `teambuzzer-game` | Buzzer Tim | title, teams[], questions[] | Yes (buzzer) |

### Advanced Blocks

| Type | Display Name | Key Fields |
|---|---|---|
| `ftab` | Tab Interaktif | tabs[] (icon, label, content[]) |
| `flashcard-set` | Flashcard | title, cards[] (front, back, color) |
| `norma-kartu` | Norma Kartu | title, items[] (icon, judul, isi, poin[], refleksi, warna) |
| `tp-display` | Tujuan Pembelajaran | title, items[] (num, verb, desc, color) |

---

## 5. RichText Fields

Fields marked as "RichText" may contain limited HTML:

**Allowed tags**: `<strong>`, `<em>`, `<b>`, `<i>`, `<u>`, `<br/>`, `<span>`, `<sub>`, `<sup>`, `<mark>`, `<small>`

**Forbidden**: `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<svg>`, `<img>` (use block-level image fields instead), any `on*` attributes, `style` attribute, `class` attribute

**Sanitization**: All RichText fields pass through `sanitizeHtmlForRender()` before rendering. The sanitizer strips forbidden tags and attributes. This is a security boundary, not optional.

---

## 6. Color System

Colors in block data use **token keys**, not hex values:

| Token | Meaning | Example Usage |
|---|---|---|
| `y` | Yellow/Gold (primary accent) | badge color, section color |
| `c` | Cyan/Blue (secondary accent) | badge color, section color |
| `g` | Green (success/correct) | badge color, section color |
| `p` | Purple (tertiary accent) | badge color, section color |
| `r` | Red (error/danger) | warning, incorrect answer |
| `o` | Orange (warning) | attention, incomplete |
| `bg` | Background | page background reference |

**Rule**: Block data MUST NOT contain hex color values. The style preset resolves token keys to actual colors at render time. This allows style swapping without changing content.

**Exception**: `background.color1` and `background.color2` in ScreenSchema may contain hex values (page-level background is style-dependent, not content-dependent).

---

## 7. Validation

All JSON imported into SILSE MUST pass:

1. **Zod schema validation** (`exportRequestSchema` for export, `saveProjectSchema` for save)
2. **Schema purity check** (`assertDocumentPurity`) — no functions, no prototypes, no circular refs
3. **Block type check** — type must be in registered block types
4. **RichText sanitization** — all HTML content fields pass through sanitizer

**Invalid JSON is rejected**. The app shows a clear error message. No partial import.

---

## 8. AI Integration Boundary

AI (external LLM) produces JSON conforming to this contract. The app:

1. Provides a **prompt template** to the AI (not direct API integration in V5)
2. Receives JSON from AI output
3. Validates against this contract
4. If valid: imports as pages into canvaStore
5. If invalid: shows error, does NOT import

**AI does NOT**:
- Generate HTML, CSS, or JavaScript
- Access the renderer directly
- Modify style tokens or theme
- Create new block types
- Bypass validation
