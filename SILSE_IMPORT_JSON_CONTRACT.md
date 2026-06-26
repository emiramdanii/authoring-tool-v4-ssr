# SILSE_IMPORT_JSON_CONTRACT

**Status**: CONTRACT v1.0 (BATCH-08)
**Date**: 2026-06-25
**HEAD**: `27ab0ce` (BATCH-07B)
**Validator**: `src/lib/silse-import-validator.ts` → `validateSilseImport()`

---

## 1. Purpose

Defines the JSON shape that the SILSE authoring tool accepts as an import
document. The validator (`validateSilseImport`) is the GATE between
untrusted JSON (user upload, AI-generated, third-party) and the runtime
store. Any rejection here prevents the document from reaching the store.

**Fail-safe principle**: when in doubt, REJECT. A false negative (rejecting
a valid file) is recoverable (user fixes + retries). A false positive
(accepting a malicious file) is a security incident.

---

## 2. Typed Shape — SilseImportJson

```typescript
interface SilseImportJson {
  schemaVersion: number;              // must be ≤ CURRENT_PROJECT_SCHEMA_VERSION (=1)
  meta: {
    judulPertemuan: string;           // required, non-empty
    mapel: string;                    // required, non-empty
    kelas: string;                    // required, non-empty
    namaGuru?: string;
    namaSekolah?: string;
    semester?: string | number;
    tahunAjaran?: string;
  };
  canva: {
    pages: SilseImportPage[];         // required, non-empty array
    ratioId?: string;
    currentPageIndex?: number;
  };
  // Optional authoring data
  kuis?: unknown[];
  modules?: unknown[];
  games?: unknown[];
  skenario?: unknown[];
  materi?: unknown;
  cp?: unknown;
  tp?: unknown[];
  atp?: unknown;
  alur?: unknown[];
  petunjuk?: unknown;
  diskusi?: unknown;
  refleksi?: unknown;
  penutup?: unknown;
  suara?: unknown;
}

interface SilseImportPage {
  id: string;                         // required, non-empty
  templateType: string;
  schema: {
    blocks: SilseImportBlock[];       // required, array (may be empty)
  };
}

interface SilseImportBlock {
  id: string;                         // required, non-empty
  type: string;                       // required, must be in REGISTERED_BLOCK_TYPES
  [key: string]: unknown;
}
```

---

## 3. Validation Layers (6 checks)

The validator runs 6 layers in order. The first failing layer determines
the reject reason. All errors are collected in `result.errors[]` for
debugging, but `result.reason` is the first (most fundamental) reason.

### Layer 1: schemaVersion

| Condition | Result |
|---|---|
| Missing / null | Accept (legacy document, will be migrated to CURRENT) |
| 0 | Accept (legacy) |
| 1..CURRENT | Accept as-is |
| > CURRENT (e.g., 99) | **REJECT** — `future-schemaversion` |
| Non-number (string, NaN, negative) | **REJECT** — `invalid-schemaversion` |

### Layer 2: metadata (meta)

| Condition | Result |
|---|---|
| `meta` missing or not object | **REJECT** — `missing-meta` |
| `meta.judulPertemuan` missing/empty/whitespace | **REJECT** — `missing-meta-judul` |
| `meta.mapel` missing/empty/whitespace | **REJECT** — `missing-meta-mapel` |
| `meta.kelas` missing/empty/whitespace | **REJECT** — `missing-meta-kelas` |

### Layer 3: canva + pages

| Condition | Result |
|---|---|
| `canva` missing or not object | **REJECT** — `missing-canva` |
| `canva.pages` not array | **REJECT** — `missing-pages` |
| `canva.pages` empty array | **REJECT** — `empty-pages` |
| Page not plain object | **REJECT** — `invalid-page-shape` |
| Page missing `schema` | **REJECT** — `page-missing-schema` |
| Page `schema.blocks` not array | **REJECT** — `page-missing-blocks` |

### Layer 4: registered block types

Every `block.type` must be in `REGISTERED_BLOCK_TYPES` (from
`src/core/schema/validation.ts`). The set includes 40+ block types:
`cover`, `hero`, `petunjuk`, `kuis`, `sortir-game`, `refleksi`,
`materi-section`, `def-box`, `diskusi`, `penutup`, etc.

| Condition | Result |
|---|---|
| Block missing `type` field | **REJECT** — `block-missing-type` |
| Block `type` not in registry | **REJECT** — `unregistered-block-type` |
| Block missing `id` field | **REJECT** — `block-missing-id` |

### Layer 5: no raw HTML/CSS/JS injection

The validator scans ALL string fields in the entire document tree
(meta fields, block content, navConfig labels, nested objects, array
elements) for dangerous patterns:

| Pattern | Reject Reason |
|---|---|
| `<script>` (any case) | `dangerous-html-script` |
| `</script>` (close tag) | `dangerous-html-script` |
| `<style>` (any case) | `dangerous-html-style` |
| `on*=` event handlers (`onclick=`, `onerror=`, etc.) | `dangerous-event-handler` |
| `javascript:` URL scheme | `dangerous-javascript-url` |

**Rationale**: even though React escapes HTML by default, exported HTML
uses `dangerouslySetInnerHTML` in some renderers (RichText, def-box
content). A malicious string like `<script>alert(1)</script>` in a
`block.content` field could execute when exported HTML is opened by a
teacher or student.

**False positive trade-off**: a legitimate lesson about HTML would have
its `<script>` examples rejected. This is acceptable — teachers should
use code blocks (which escape content) not raw HTML fields.

### Layer 6: no eval / Function constructor

| Pattern | Reject Reason |
|---|---|
| `eval(...)` | `dangerous-eval` |
| `new Function(...)` | `dangerous-function-constructor` |
| `setTimeout("string", ...)` | `dangerous-settimeout-string` |
| `setInterval("string", ...)` | `dangerous-settimeout-string` |

---

## 4. Validation Result Shape

```typescript
interface SilseImportValidationResult {
  valid: boolean;
  reason?: SilseImportRejectReason;    // first failing reason (when valid=false)
  message: string;                     // Indonesian, user-facing
  path?: string;                       // e.g., "canva.pages[2].schema.blocks[0].type"
  document?: SilseImportJson;          // only when valid=true
  errors?: Array<{                     // all errors (when valid=false)
    path: string;
    reason: SilseImportRejectReason;
    message: string;
  }>;
}
```

---

## 5. Usage

```typescript
import { validateSilseImport, validateSilseImportJsonString } from '@/lib/silse-import-validator';

// From parsed JSON object
const result = validateSilseImport(parsedJson);
if (result.valid) {
  // Safe to load: result.document
} else {
  // Show error: result.message (Indonesian, user-facing)
  // Debug: result.errors (all errors found)
}

// From raw JSON string (parses + validates)
const result = validateSilseImportJsonString('{"schemaVersion":1,...}');
```

---

## 6. Sample Fixtures

Located in `fixtures/silse-import/`:

**Valid** (should PASS):
- `valid-minimal.json` — single cover page, minimal meta
- `valid-multi-page.json` — 3 pages (cover + kuis + refleksi)

**Invalid** (should FAIL with specific reason):
- `invalid-future-version.json` → `future-schemaversion`
- `invalid-missing-meta.json` → `missing-meta`
- `invalid-empty-pages.json` → `empty-pages`
- `invalid-unregistered-block-type.json` → `unregistered-block-type`
- `invalid-script-tag.json` → `dangerous-html-script`
- `invalid-event-handler.json` → `dangerous-event-handler`
- `invalid-javascript-url.json` → `dangerous-javascript-url`
- `invalid-eval.json` → `dangerous-eval`
- `invalid-block-missing-type.json` → `block-missing-type`

---

## 7. Runtime Status

| Component | Status |
|---|---|
| SilseImportJson type | COMPLETE |
| 6-layer validator | COMPLETE |
| Sample fixtures (2 valid + 9 invalid) | COMPLETE |
| Unit tests (70 tests) | COMPLETE |
| Import UI | NOT IMPLEMENTED (future batch) |
| Full block adapter (per-type content validation) | NOT IMPLEMENTED (future batch) |

---

## 8. Future Work

- **Import UI**: file picker + drag-drop + validation result display
- **Per-type block content validation**: deep-validate kuis questions
  shape, sortir pool/kolom, refleksi questions, etc. (currently only
  `block.type` is checked against registry, not the block's content)
- **Migration on import**: upgrade legacy v0 documents to v1
  (already handled by `migrateProjectDocument` in
  `src/core/schema/project-schema-versioning.ts`)
- **AI-generated JSON validation**: when AI APIs produce project JSON,
  route through `validateSilseImport` before loading
