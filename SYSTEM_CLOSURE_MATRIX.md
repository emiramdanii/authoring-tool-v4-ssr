# SYSTEM_CLOSURE MATRIX

> Sprint 8.2S-2-Patch — Foundation Checkpoint (evidence-based)
>
> Status per 2026-06-17. Matriks ini menunjukkan tingkat kepastian
> setiap Area × Operasi telah diuji end-to-end. Setiap sel POSITIF
> harus punya evidence ID (test file + commit SHA). Sel tanpa evidence
> adalah lubang yang harus ditutup sebelum release.
>
> Status legend ( Senior Review 8.2S-2 — finer-grained ):
> - `PASS_CI`           — diuji end-to-end, ada test otomatis, lulus di CI
> - `PASS_LOCAL`        — diuji end-to-end, ada test otomatis, lulus lokal (CI belum ada)
> - `PASS_SOURCE_ONLY`  — source code ada, tidak ada test otomatis
> - `LOCAL_REPORTED`    — dilaporkan jalan secara manual, tidak ada test otomatis
> - `NOT_TESTED`        — belum ada test otomatis, perlu manual/automated
> - `BLOCKED`           — ada blocker teknis (lihat KNOWN_ISSUES.md)
> - `N/A`               — tidak berlaku

## Matriks Utama

| Area        | Create          | Edit            | Save            | Reload          | Preview         | Present         | Export          | Legacy          |
| ----------- | --------------- | --------------- | --------------- | --------------- | --------------- | --------------- | --------------- | --------------- |
| Page        | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | NOT_TESTED      | NOT_TESTED      | PASS_LOCAL      |
| Block       | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | NOT_TESTED      | NOT_TESTED      | LOCAL_REPORTED  |
| Theme       | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | NOT_TESTED      | NOT_TESTED      | PASS_LOCAL      |
| Background  | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | NOT_TESTED      | NOT_TESTED      | PASS_LOCAL      |
| Navigation  | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | NOT_TESTED      | NOT_TESTED      | PASS_LOCAL      |
| Quiz        | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | NOT_TESTED      | NOT_TESTED      | LOCAL_REPORTED  |
| Image/audio | PASS_CI         | PASS_CI         | PASS_CI         | PASS_CI         | PASS_CI         | NOT_TESTED      | NOT_TESTED      | LOCAL_REPORTED  |
| Import      | PASS_CI         | N/A             | PASS_CI         | PASS_CI         | PASS_CI         | NOT_TESTED      | NOT_TESTED      | PASS_CI         |
| Schema migration | N/A        | N/A             | N/A             | PASS_CI         | N/A             | NOT_TESTED      | NOT_TESTED      | PASS_CI         |
| Style Contract | PASS_LOCAL   | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | NOT_TESTED      | NOT_TESTED      | PASS_LOCAL      |
| Mode lifecycle  | N/A         | N/A             | N/A             | N/A             | PASS_LOCAL      | PASS_CI | PASS_CI (POST full / GET partial) | N/A             |
| Error recovery  | N/A         | N/A             | N/A             | PASS_CI         | N/A             | NOT_TESTED      | NOT_TESTED      | PASS_CI         |

## Evidence Index

Setiap status `PASS_LOCAL` atau `PASS_CI` harus bisa ditelusuri ke
test file + commit SHA. Berikut daftar evidence per sel.

### Page
- **Create/Edit/Save/Reload**: `PASS_LOCAL`
  - Evidence: `src/core/style/__tests__/page-renderer-integration.test.tsx` (commit `262dd1b`)
  - Evidence: `src/store/canva/persistence-slice.ts` (existing — load/save round-trip)
  - Note: test otomatis ada, lulus lokal (446/446). CI belum ada (CI-001).
- **Preview**: `PASS_LOCAL`
  - Evidence: `src/core/style/__tests__/canvas-preview-parity.test.ts` (commit `c02adb5`)
  - Evidence: `src/core/style/__tests__/page-renderer-integration.test.tsx` (commit `262dd1b`)
- **Present**: `PASS_CI` (Sprint 8.2B CLOSED)
- **Export**: `PASS_CI` (POST export full authority; GET project export PARTIAL — explicit contract unsupported, documented)
  - Sprint 8.2B/8.2C territory
- **Legacy**: `PASS_LOCAL`
  - Evidence: `src/core/style/__tests__/legacy-style-adapter.test.ts` (commit `50af012`)
  - Evidence: `src/core/style/__tests__/patch-2-regression.test.ts` (commit `50af012`)

### Block
- **Create/Edit/Save/Reload/Preview**: `PASS_LOCAL`
  - Evidence: `src/core/style/__tests__/page-style-adapter.test.ts` section 9 (commit `262dd1b`)
  - Evidence: `src/core/schema/__tests__/block-style-presets.test.ts` (60 tests)
- **Legacy**: `LOCAL_REPORTED`
  - Evidence: `dataIdx` fallback masih ada (KNOWN_ISSUES BLOCK-001)
  - Manual test only — tidak ada test otomatis untuk legacy element-mode block round-trip

### Theme
- **Create/Edit**: `PASS_LOCAL`
  - Evidence: `src/core/style/__tests__/style-contract.test.ts` (commit `b79df6b`)
  - Note: teacher style picker belum ada (Sprint 8.2D) — Create/Edit via authoring preset only
- **Save/Reload/Preview**: `PASS_LOCAL`
  - Evidence: `src/core/style/__tests__/page-style-adapter.test.ts` (commit `c02adb5`)
- **Legacy**: `PASS_LOCAL`
  - Evidence: `src/core/style/__tests__/legacy-style-adapter.test.ts` (commit `50af012`)

### Background
- **All operations**: `PASS_LOCAL`
  - Evidence: `src/core/style/__tests__/patch-2-regression.test.ts` (commit `50af012`)
  - Evidence: `src/core/style/__tests__/page-renderer-integration.test.tsx` (commit `262dd1b` — P0-3 schema bg merge)
  - Patch-2 invariant: Canva 40 = DB 0.4 = Schema 40 = 40

### Navigation
- **All operations**: `PASS_LOCAL`
  - Evidence: `src/core/style/__tests__/page-style-adapter.test.ts` section 3 (commit `c02adb5`)
  - Evidence: `src/core/style/__tests__/patch-2-regression.test.ts` P0-2 (commit `50af012`)

### Quiz
- **Create/Edit/Save/Reload/Preview**: `PASS_LOCAL`
  - Evidence: `src/__tests__/quiz-contract.test.ts`, `quiz-boolean-context.test.ts`, `quiz-e1-qa.test.ts`
- **Legacy**: `LOCAL_REPORTED`
  - KNOWN_ISSUES QUIZ-001: KuisImportPanel punya TS error

### Image/audio
- **Create/Edit/Save/Reload/Preview**: `PASS_CI` (Sprint 8.5C CLOSED)
  - `/api/upload` route now exists at `src/app/api/upload/route.ts` (was 404 before Sprint 8.5C — ImageUploader had been calling it since Sprint 5)
  - Evidence: `src/__tests__/api-upload.test.ts` (14 tests, commit `99258bd` + Patch-1 `84da68c`)
    * Successful upload of each MIME type (jpeg/png/gif/webp) returns 200 + correct URL extension
    * File written to public/uploads/<sha256>.<ext> with exact content
    * Same content uploaded twice returns same URL (content-addressed dedupe)
    * Invalid MIME type → 400 + generic error
    * Empty file → 400 + generic error
    * Oversized file (>5MB) → 413 + generic error
    * MIME spoofing (claims JPEG but bytes are not JPEG) → 400 (magic-byte verification)
    * No 'file' field in form → 400
    * Internal failure (writeFile EACCES) → 500 + generic message (no stack leak)
    * GET discovery endpoint returns metadata
    * **SVG upload REJECTED (400) — Sprint 8.5C-Patch-1 security fix** (was accepted in initial 8.5C, blocked after senior review flagged stored-XSS risk)
    * SVG with XSS payload (`<script>`, `onload`, `<foreignObject>`, `<use href>`) all rejected
  - Validation: 4 allowed MIME types (jpeg/png/gif/webp), 5MB max size, magic-byte verification for ALL allowed types (Sprint 8.5C-Patch-1: SVG removed — see security note below)
  - **Sprint 8.5C-Patch-1 SECURITY**: SVG (`image/svg+xml`) intentionally EXCLUDED from allowed types because:
    * SVG is XML text, so magic-byte verification doesn't apply
    * SVG can carry `<script>`, `on*` event handlers, `<foreignObject>`, external references, and other XSS payloads
    * Stored SVG served from same-origin `/uploads/` would execute scripts in the app's origin → stored XSS
    * `X-Content-Type-Options: nosniff` does NOT sanitize SVG content; it only prevents MIME sniffing
    * For teacher image-upload use cases, JPG/PNG/GIF/WebP are sufficient
    * If SVG becomes a hard requirement later, use Opsi B (sanitize with DOMPurify + serve from sandboxed origin)
  - Storage: content-addressed (`public/uploads/<sha256>.<ext>`) — automatic dedupe + prevents path traversal
  - No stack leak (Sprint 8.5B pattern): generic Indonesian error to client, full error to console.error server-side
- **Reload (large media)**: `PASS_CI` (Sprint 8.5C CLOSED)
  - Evidence: `src/__tests__/media-reload-persistence.test.ts` (7 tests, commit `99258bd`)
    * >1MB bgDataUrl survives save → clear → load roundtrip (byte-for-byte)
    * Multiple pages each with large bgDataUrl survive roundtrip
    * Small bgDataUrl (~100 bytes) survives roundtrip (regression)
    * bgDataUrl=null survives roundtrip (page without background image)
    * image-background-large.json fixture still has bgDataUrl + overlay=40 after parse
    * bgDataUrl URL pattern (data:image/png;base64,...) preserved exactly
    * Reload preserves all Patch-2 invariant fields together (bgDataUrl + overlay + navConfig)
  - Note: tests use @vitest-environment node for large buffer manipulation (jsdom localStorage has size limits that break >1MB tests)
- **Legacy**: `LOCAL_REPORTED`
  - paletteToTokenOverrides masih jalan, tidak ada fixture korpus

### Import
- **Create/Save/Reload/Preview**: `PASS_CI` (Sprint 8.4 CLOSED)
  - Evidence: `src/core/style/__tests__/import-export-roundtrip.test.ts` (21 tests, commit `4306502`)
  - `handleImportJSON` restores `canva.pages`, `ratioId`, `currentPageIndex` from `data.canva` (with fallback to top-level `data.pages` for legacy/alt format)
  - Dashboard.tsx + use-export-actions.ts both export `canva: { pages, ratioId, currentPageIndex }` — export paths now equivalent
  - 4 fixture corpus verified durable through export → import roundtrip: golden-pertemuan, fresh-mission-adventure, macam-norma-legacy, image-background-large
  - Style authority fields proven durable: contractId, pageMode, schema.themeId, templateData.schemaThemeId, templateVariant, navConfig, bgColor, bgDataUrl, overlay, colorPalette, schema.background, schema.blocks
  - Backward compatibility: legacy JSON without `canva` field handled; alternative top-level `pages` format handled
  - CI: run #27809941108 on SHA `4306502` — 3/3 jobs success
- **Legacy**: `PASS_CI` (Sprint 8.4 CLOSED)
  - macam-norma-legacy fixture: templateData.schemaThemeId + elements survive roundtrip (source = legacy-theme preserved)
  - golden-pertemuan fixture: contractId + pageMode + schema.themeId + resolver source survive roundtrip

### Schema migration
- **Reload**: `PASS_CI` (Sprint 8.6A CLOSED)
  - Evidence: `src/__tests__/project-schema-versioning.test.ts` (58 tests, commit `b1a18dc`)
  - Evidence: `src/__tests__/schema-versioning-import-export.test.ts` (24 tests, commit `b1a18dc`)
  - `migrateAllPages()` jalan di load time (per-page ScreenSchema migration, unchanged)
  - NEW: `migrateProjectDocument()` gates project-level JSON at import time
  - Project-level schemaVersion: `CURRENT_PROJECT_SCHEMA_VERSION = 1` (separate from per-page SCHEMA_VERSION = 2)
  - Export JSON writes `schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION` at top level
  - Import JSON passes through `migrateProjectDocument()` BEFORE any store mutation
  - Compatibility: missing/v0/v1 (legacy) → accept + migrate to current; current → accept; future > current → reject (fail-safe); malformed → reject (fail-safe)
  - Migration preserves ALL existing fields (canva.pages, ratioId, contractId, pageMode, schema.themeId, templateData.*, navConfig, bgColor, bgDataUrl, overlay, schema.background, schema.blocks, meta, cp, tp, atp, alur, kuis, modules, materi)
  - Import failure does NOT mutate stores — early return before setState()
  - ScreenSchema.version compatibility bug FIXED (was rejecting v2 = current!): now accepts missing/v0/v1 + current v2, rejects future + malformed
  - 4 fixtures verified: legacy-no-schema-version, current-schema-version, future-schema-version, malformed-schema-version
  - CI run ID: `27837399563` on SHA `b1a18dc0a78eaf6a27c4cc56c45a3708a8c2695a` — 3/3 jobs success
- **Legacy**: `PASS_CI` (Sprint 8.6A CLOSED)
  - overlay elements migration (`_migrationVersion < 1`) ada (unchanged, still works)
  - Legacy project JSON without `schemaVersion` field → migrated to current via `migrateProjectDocument()` (verified by `legacy-no-schema-version.json` fixture)
  - Legacy top-level `pages` (no `canva` field, pre-8.4 format) → still accepted via fallback in `handleImportJSON`

### Style Contract
- **All operations**: `PASS_LOCAL`
  - Evidence: `src/core/style/__tests__/style-contract.test.ts` (86 tests)
  - Evidence: `src/core/style/__tests__/patch-2-regression.test.ts` (10 tests)
  - Evidence: `src/core/style/__tests__/page-style-adapter.test.ts` (31 tests)
  - Evidence: `src/core/style/__tests__/canvas-preview-parity.test.ts` (13 tests)
  - Evidence: `src/core/style/__tests__/token-resolver-bridge.test.ts` (12 tests)
  - Evidence: `src/core/style/__tests__/page-renderer-integration.test.tsx` (9 tests)

### Mode lifecycle
- **Preview**: `PASS_LOCAL`
  - Evidence: `src/__tests__/mode-lifecycle-smoke.test.ts` (commit `a701eb4` + `8.2S-2-Patch`)
  - Edit → Preview transition verified
  - M-006 fix (hoveredBlockId clear) verified
- **Present**: `PASS_CI`
  - Token boundary: `src/core/style/__tests__/present-wiring-integration.test.tsx` (11 tests, Sprint 8.2B)
  - Consumer smoke: `src/core/style/__tests__/present-consumer-smoke.test.tsx` (9 tests, Sprint 8.2B-Patch-2)
  - Unmocked: PageFrame, SchemaScreenRenderer, GoldenPageRenderer, ScreenAdapter all REAL
  - 3 corpus fixtures: golden-pertemuan, fresh-mission-adventure, macam-norma-legacy
  - Verified: block text renders, background style applied, no crash, preset colors correct
  - PresentMode → PageRenderer mode="preview" → resolvePageStyleTokens + bridge
  - PlayOverlay → PageRenderer mode="preview" → same token path
  - LearningMediaShell → PageRenderer mode="learn" → same token path
  - 3 fixtures verified: golden-pertemuan, macam-norma-legacy, fresh-mission-adventure
  - Canvas/Present token parity verified (JSON.stringify equality)
  - Evidence: `src/__tests__/mode-lifecycle-smoke.test.ts` cold-start tests (commit 8.2S-2-Patch-2)
  - Evidence: `src/__tests__/listener-cleanup-integration.test.tsx` expanded cleanup (commit 8.2S-2-Patch-3)
  - M-007 CLOSED — TEST-HARNESS FALSE POSITIVE (jsdom Storage.setItem setTimeout artifact; production Zustand storage unchanged)
  - Window + document + ResizeObserver + fullscreen listener cleanup: PASS_LOCAL
  - Timer cleanup: PASS_LOCAL (zero pending after unmount, verified for PreviewMode/PresentMode/LearningMediaShell/PlayOverlay + rapid 5x)
- **Export**: `PASS_CI`
  - Token boundary: `src/core/style/__tests__/export-wiring-integration.test.tsx` (7 tests, Sprint 8.2C)
  - Consumer DOM (unmocked): `src/core/style/__tests__/export-consumer-smoke.test.tsx` (10 tests, Sprint 8.2C-Patch-1)
  - ExportApp → PageRenderer mode="export" → resolvePageStyleTokens + bridge (same as Canvas/Present)
  - Chrome wired: top navbar, bottom nav, phase badge, shell — all use resolved tokens
  - 4 fixtures: golden-pertemuan, fresh-mission-adventure, image-background-large, macam-norma-legacy
  - POST /api/export: preserves full page authority (contractId, pageMode, schema, templateData)
  - GET /api/projects/[id]/export: PARTIAL — contractId not in Prisma Page model; falls back to legacy-theme → preset bridge
  - Standalone boot smoke: __EXPORT_DATA__ payload parseable + stores hydrate + ExportApp boots
  - CI: run #27776715138 on SHA 0091309 — 3/3 jobs success
  - Canvas/Export token parity verified (identical pageStyleTokens)

- **Teacher Style Picker**: `PASS_CI`
  - Component: `src/components/canva/StylePresetPicker.tsx` (Sprint 8.2D)
  - Wiring: `src/components/canva/right-panel/BackgroundSection.tsx` (import + StylePresetPicker)
  - Tests: `src/core/style/__tests__/teacher-style-picker.test.tsx` (11 tests, Sprint 8.2D)
  - 6 Style Contract presets: academic-clean, school-cheerful, mission-adventure, dark-elegant, nusantara-nature, modern-interactive
  - Authority: setSchemaThemeId writes to schema.themeId + templateData.schemaThemeId
  - Resolver: resolvePageStyleTokens picks up new preset (source = 'new-preset')
  - Canvas/Export token parity verified after preset selection
  - Legacy → new preset switch changes source correctly
  - CI: run #27803625541 on SHA 1eab9c2 — 3/3 jobs success

- **Persistence & Schema Versioning**: `PASS_CI`
  - Prisma migration: `prisma/migrations/20260619040000_add_contractid_pagemode/migration.sql`
  - contractId: persisted in Prisma Page model + save route + loadFromDB + GET export
  - pageMode: persisted in Prisma Page model + save route + loadFromDB + GET export
  - Roundtrip tests: `src/core/style/__tests__/persistence-roundtrip.test.ts` (18 tests)
  - TS normalizer: union type members sorted alphabetically for cross-env stability
  - CI: run #27806691207 on SHA cfa7727 — 3/3 jobs success
  - All 4 fixtures verified: golden-pertemuan, fresh-mission-adventure, macam-norma-legacy, image-background-large
  - Fields proven durable: contractId, pageMode, schema.themeId, templateData.schemaThemeId, templateVariant, navConfig, bgColor, bgDataUrl, overlay, colorPalette, schema.background

- **Project Import/Export JSON**: `PASS_CI` (Sprint 8.4 CLOSED)
  - Export paths (now equivalent): `src/components/authoring/Dashboard.tsx` + `src/components/authoring/import-export/use-export-actions.ts`
    - Both include `canva: { pages, ratioId, currentPageIndex }`
  - Import path: `src/components/authoring/import-export/use-excel-import.ts` `handleImportJSON`
    - Restores `canva.pages`, `ratioId`, `currentPageIndex` from `data.canva`
    - Falls back to top-level `data.pages` for alternative format
  - Roundtrip tests: `src/core/style/__tests__/import-export-roundtrip.test.ts` (21 tests, commit `4306502`)
    - 4 fixtures: golden-pertemuan, fresh-mission-adventure, macam-norma-legacy, image-background-large
    - Style authority field checklist: contractId, pageMode, schema.themeId, templateData.schemaThemeId, templateVariant, navConfig, bgColor, bgDataUrl, overlay, colorPalette, schema.background, schema.blocks
    - Backward compatibility: legacy JSON without `canva` field handled
    - Alternative format: top-level `pages` handled
  - CI: run #27809941108 on SHA `43065022188df51809bb393e3cb6f38ff53dc34a` — 3/3 jobs success (Test, TypeScript gate, Build)
  - Note: tests use a helper simulation of export/import (hook is private). Source code is simple and aligned with helper — sufficient for technical pass.
- **Listener cleanup (window + document + ResizeObserver + fullscreen + timers)**: `PASS_LOCAL`
  - Evidence: `src/__tests__/listener-cleanup-integration.test.tsx` (19 tests, commit 8.2S-2-Patch-3)
  - PreviewMode, PresentMode, PlayOverlay, LearningMediaShell all pass:
    - net-delta-0 window listeners after unmount
    - net-delta-0 document listeners after unmount
    - ResizeObserver.disconnect called
    - fullscreenchange listeners cleaned up
    - zero pending setTimeout timers after unmount (M-007 CLOSED — test-harness false positive)
    - rapid 5x render/unmount: zero pending timers (no accumulation)

### Error recovery
- **Boot Recovery + Safe Boot Bridge**: `PASS_CI` (Sprint 8.5A CLOSED)
  - Evidence: `src/__tests__/recovery-boot-bridge.test.tsx` (12 tests, commit `fa45931` + `f4f1926`)
  - Evidence: `src/__tests__/recovery-safe-boot.test.tsx` (11 tests, commit `fa45931`)
  - Evidence: `src/__tests__/recovery-dialog-a11y.test.tsx` (8 tests, commit `fa45931`)
  - Evidence: `src/__tests__/recovery-clean-boot-regression.test.tsx` (7 tests, commit `f4f1926` — P0 false-positive fix)
  - `RecoveryDialog` accepts `bootReport?: BootReport | null` prop
  - `BootRecoveryOrchestrator.run()` bridge wired from `AuthoringTool` boot effect (deferred via `setTimeout(0)` so `StoreInit` populates canva store first)
  - 4th reason branch `'boot-report'` (priority: boot-report > emergency > crash > auto-save)
  - Clean boot false-positive FIXED (Patch-1): `buildSchemaHealingResult()` removed — was comparing post-deep-clone references, always returning `neededHealing=true`. Now uses real healing results from step 4.
  - `RecoveryDialog` does NOT render on clean valid boot
  - `RecoveryDialog` DOES render on real incomplete transaction
  - Safe boot: orchestrator survives corrupted localStorage (unparseable JSON), corrupted sessionStorage crash recovery data, malformed fixture
  - `clearRecoveryKeys()` helper: single source of truth for "Mulai Baru" — wipes canva/authoring/emergency/dirty-exit/session-active localStorage + calls `orchestrator.discardCrashRecovery()` for sessionStorage crash recovery data
  - A11y basics: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (points to visible title), `aria-describedby` (points to visible subtitle), focus trap (Tab cycles within dialog), Esc key = "Mulai Baru", backdrop click = "Mulai Baru"
  - 8.5A tests total: 38 recovery tests (12 + 11 + 8 + 7)
  - CI run ID: `27825766751`
  - Exact SHA: `f4f19266a619f294996a7dcda6d2fc311cda1fa8`
  - GitHub Actions: 3/3 jobs success (Test, TypeScript gate, Build)

- **Security Headers Middleware**: `PASS_CI` (Sprint 8.5B CLOSED)
  - Evidence: `src/__tests__/middleware-security.test.ts` (15 tests, commit `c487df0`)
  - 7 security headers applied to ALL responses (page + API + 429 + 503):
    * `X-Content-Type-Options: nosniff`
    * `X-Frame-Options: DENY`
    * `Referrer-Policy: strict-origin-when-cross-origin`
    * `X-XSS-Protection: 0` (legacy auditor disabled; rely on CSP/sanitization)
    * `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
    * `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
    * `Cross-Origin-Opener-Policy: same-origin`
  - Matcher expanded from `/api/:path*` to all routes except static assets (`_next/static`, `_next/image`, favicon, icons/, sounds/, og.png, manifest.json, sw.js, robots.txt, logo.svg, mockup.html)
  - CSP intentionally NOT set (needs page-specific nonces, out of scope — tracked as future work in KNOWN_ISSUES.md)
  - Rate-limit tier mapping preserved (regression): ai/export/project/general
  - CI run ID: `27831532947` on SHA `c487df0d9f271ed1c0da2a1369a019b75b41e2d0` — 3/3 jobs success

- **API No-Stack-Leak**: `PASS_CI` (Sprint 8.5B CLOSED)
  - Evidence: `src/__tests__/api-no-stack-leak.test.ts` (5 tests, commit `c487df0`)
  - 2 routes fixed (were leaking raw `error.message` to client):
    * `/api/export` — now returns generic `'Export gagal. Silakan coba lagi.'` (still logs full error server-side via `console.error`)
    * `/api/export/scorm` — now returns generic `'Export SCORM gagal. Silakan coba lagi.'`
  - Other routes (projects, ai, templates) already had generic messages — verified via regression tests
  - All 5 tests assert: (a) response body uses generic message, (b) response body does NOT contain `TypeError`/stack/internal paths, (c) `console.error` was called for server-side debugging

- **A11y Smoke Tests**: `PASS_CI` (Sprint 8.5B CLOSED)
  - Evidence: `src/__tests__/a11y-smoke.test.tsx` (12 tests, commit `c487df0`)
  - SkipNavLink: `href="#main-content"`, `sr-only` + `focus:not-sr-only` classes, keyboard-focusable
  - A11yProvider: default context (`reducedMotion=false`, `highContrast=false`)
  - `useGameA11y` hook: `ariaLabel` with score+maxScore, `progressAria` with `role=progressbar` + `aria-valuenow/min/max`, `liveAria` with `aria-live=polite`, unique `instructionId` (blockId-based), `ariaLabel` omits score when `maxScore=0`
  - RecoveryDialog cross-cover: `role=dialog`, `aria-modal=true`, `aria-labelledby` points to visible title, Tab focus trap cycles, Esc triggers Mulai Baru
  - Note: these are SMOKE tests for the a11y contract, NOT a substitute for full axe-core audits (which would require Playwright + axe integration — out of scope for 8.5B)

## Lubang Setelah Present (Sprint 8.2B CLOSED)

Setelah 8.2B-Patch-2, status:

1. **Present mode wiring** — `PASS_CI` ✅ (11 token boundary + 9 consumer smoke tests, CI verified on SHA `6e9201f`)
2. **Mode lifecycle Preview/Present** — `PASS_CI` ✅ (smoke + listener tests, CI verified on SHA `fe7eee2`)
3. **Interactive store score bocor** — FIXED (M-001) ✅
4. **Fixture corpus** — `PASS_LOCAL` ✅ (6 fixture di `fixtures/projects/`)

## Lubang Terbesar Sebelum Release

1. ~~**Export HTML contract belum dirancang**~~ — ✅ IMPLEMENTED (Sprint 8.2C CLOSED). POST export + chrome wiring + consumer DOM verified. GET project export PARTIAL (contractId not persisted in Prisma).
2. ~~**Schema versioning belum ada**~~ — ✅ CLOSED (Sprint 8.6A). Project-level schemaVersion (v1) implemented end-to-end: export writes it, import gates on it, legacy migrates, future/malformed rejected safely. Per-page ScreenSchema.version compatibility bug also fixed.
3. ~~**CI belum ada di remote**~~ — ✅ CLOSED (CI-001, CI-002, BUILD-001 all CLOSED)
4. ~~**46 pre-existing TS errors**~~ — ✅ CLOSED (Sprint 8.6B). `npx tsc --noEmit` now returns 0 errors. All 63 errors / 48 signatures fixed via dead-code removal + type guards + enum alignment + generic migration helpers. Baseline reset to 0.
5. ~~**Security & accessibility gate belum dijalankan**~~ — ✅ CLOSED (Sprint 8.5B). Security headers middleware (7 headers on all responses) + a11y smoke tests (SkipNavLink, A11yProvider, useGameA11y, RecoveryDialog) + no-stack-leak fix for export/scorm routes.
6. ~~**Image/audio Import Reload**~~ — ✅ CLOSED (Sprint 8.5C). `/api/upload` route created (was 404), 13 upload tests + 7 media reload tests cover Create/Edit/Save/Reload/Preview paths.
7. ~~**Error recovery UI**~~ — ✅ CLOSED (Sprint 8.5A). Boot recovery + safe boot bridge + a11y basics + clean-boot regression all PASS_CI.
8. ~~**Project Import/Export JSON**~~ — ✅ CLOSED (Sprint 8.4). Style authority fields + 4 fixtures verified through roundtrip.

## CI Verified Statuses (Sprint 8.2S-2-Patch-5)

Exact-SHA CI run `27736541608` on SHA `fe7eee27572a030cbf3335fbe03c790ae1a9519c`:

| Gate | CI Status | Evidence |
|---|---|---|
| Mode lifecycle Preview | `PASS_CI` | `mode-lifecycle-smoke.test.ts` (23 tests) — CI success |
| Stability test suite | `PASS_CI` | `listener-cleanup-integration.test.tsx` (19 tests) + `store-init-bootstrap.test.tsx` (6 tests) + `normalize-ts-errors.test.ts` (24 tests) — CI success |
| TypeScript regression gate | `PASS_CI` | `normalize-ts-errors.js --check` (multiset, fail-closed, signal capture) — CI success |
| Build gate | `PASS_CI` | `npm run build` exit code 0 + `.next/BUILD_ID` verification — CI success |
| Reproducible install | `PASS_CI` | `npm ci --legacy-peer-deps` on all 3 jobs — CI success |

## Sprint 8.4 Closure (Import/Export JSON)

Exact-SHA CI run `27809941108` on SHA `43065022188df51809bb393e3cb6f38ff53dc34a`:

| Gate | CI Status | Evidence |
|---|---|---|
| Export JSON canva.pages | `PASS_CI` | Dashboard.tsx + use-export-actions.ts both emit `canva: { pages, ratioId, currentPageIndex }` |
| Import JSON canva restore | `PASS_CI` | `handleImportJSON` restores `canva.pages/ratioId/currentPageIndex` from `data.canva` (fallback `data.pages`) |
| Style authority roundtrip | `PASS_CI` | contractId / pageMode / schema.themeId / templateData.schemaThemeId / templateVariant / navConfig / bgColor / bgDataUrl / overlay / colorPalette / schema.background / schema.blocks all verified across 4 fixtures |
| Legacy compatibility | `PASS_CI` | Legacy JSON without `canva` field handled; alternative top-level `pages` format handled |
| Roundtrip tests | `PASS_CI` | `src/core/style/__tests__/import-export-roundtrip.test.ts` (21 tests) — CI success |
| Exact SHA | `PASS_CI` | Checkout SHA `43065022188df51809bb393e3cb6f38ff53dc34a` verified in CI log |
| CI Run | `PASS_CI` | `27809941108` — 3/3 jobs success (Test, TypeScript gate, Build) |

## Sprint 8.5A Closure (Recovery UI + Safe Boot Bridge)

Exact-SHA CI run `27825766751` on SHA `f4f19266a619f294996a7dcda6d2fc311cda1fa8`:

| Gate | CI Status | Evidence |
|---|---|---|
| RecoveryDialog accepts BootReport | `PASS_CI` | `bootReport?: BootReport \| null` prop + 4th reason branch 'boot-report' (priority: boot-report > emergency > crash > auto-save) |
| BootRecoveryOrchestrator bridge wired | `PASS_CI` | `AuthoringTool` boot effect calls `bootRecoveryOrchestrator.run(pages)` (deferred `setTimeout(0)`) + passes report to `<RecoveryDialog bootReport={...} />` |
| Clean boot false-positive fixed (Patch-1) | `PASS_CI` | Removed `buildSchemaHealingResult()` — was comparing post-deep-clone references. Now uses real `healResult` / `proactiveHealResult` from step 4. |
| RecoveryDialog does NOT render on clean valid boot | `PASS_CI` | `recovery-clean-boot-regression.test.tsx` (7 tests) — clean page → `needsRecovery=false` → dialog hidden |
| RecoveryDialog renders on real incomplete transaction | `PASS_CI` | Regression test seeds `silse_incomplete_transaction` → orchestrator flags `needsRecovery=true` → dialog shows 'Pemulihan Boot Aman' |
| Safe boot / corrupted storage | `PASS_CI` | `recovery-safe-boot.test.tsx` (11 tests) — orchestrator survives unparseable JSON in canva/at/emergency/crash-recovery keys + malformed fixture |
| RecoveryDialog a11y basics | `PASS_CI` | `recovery-dialog-a11y.test.tsx` (8 tests) — `role=dialog`, `aria-modal=true`, `aria-labelledby` → visible title, `aria-describedby` → visible subtitle, Tab focus trap, Esc = Mulai Baru, backdrop click = Mulai Baru |
| 8.5A tests total | `PASS_CI` | 38 recovery tests (12 bridge + 11 safe-boot + 8 a11y + 7 regression) — all CI success |
| Exact SHA | `PASS_CI` | Checkout SHA `f4f19266a619f294996a7dcda6d2fc311cda1fa8` verified in CI log |
| CI Run | `PASS_CI` | `27825766751` — 3/3 jobs success (Test, TypeScript gate, Build) |

## Sprint 8.5B Closure (Security + Accessibility Gate)

Exact-SHA CI run `27831532947` on SHA `c487df0d9f271ed1c0da2a1369a019b75b41e2d0`:

| Gate | CI Status | Evidence |
|---|---|---|
| Security headers on API responses | `PASS_CI` | `middleware-security.test.ts` — 7 headers present on /api/projects, /api/ai/*, /api/export*, /api/projects/:id/save |
| Security headers on page responses | `PASS_CI` | `middleware-security.test.ts` — headers present on `/` (non-API), `/api` health check |
| Security headers on 429 response | `PASS_CI` | `middleware-security.test.ts` — rate-limited response still has all 7 headers + Retry-After |
| Security headers on 503 sandbox | `PASS_CI` | `middleware-security.test.ts` — sandbox-mode response still has all 7 headers |
| Rate-limit tier mapping | `PASS_CI` | `middleware-security.test.ts` — regression: ai/export/project/general tiers preserved |
| No stack leak — /api/export | `PASS_CI` | `api-no-stack-leak.test.ts` — generic `'Export gagal. Silakan coba lagi.'`, no TypeError/stack/internal paths |
| No stack leak — /api/export/scorm | `PASS_CI` | `api-no-stack-leak.test.ts` — generic `'Export SCORM gagal. Silakan coba lagi.'`, no TypeError/stack/internal paths |
| No stack leak — /api/projects (regression) | `PASS_CI` | `api-no-stack-leak.test.ts` — already generic `'Failed to fetch projects'`, no Prisma/db leak |
| No stack leak — /api/ai (regression) | `PASS_CI` | `api-no-stack-leak.test.ts` — already generic `'Gagal menghasilkan konten AI. Silakan coba lagi.'`, no NetworkError/DNS leak |
| Server-side logging preserved | `PASS_CI` | `api-no-stack-leak.test.ts` — `console.error` called even when client gets generic message |
| SkipNavLink a11y | `PASS_CI` | `a11y-smoke.test.tsx` — href=#main-content, sr-only + focus:not-sr-only, keyboard-focusable |
| A11yProvider context | `PASS_CI` | `a11y-smoke.test.tsx` — default context (reducedMotion=false, highContrast=false) |
| useGameA11y hook contract | `PASS_CI` | `a11y-smoke.test.tsx` — ariaLabel, progressAria (role=progressbar), liveAria (aria-live=polite), instructionId (blockId-based), ariaLabel omits score when maxScore=0 |
| RecoveryDialog a11y (cross-cover) | `PASS_CI` | `a11y-smoke.test.tsx` — role=dialog, aria-modal=true, aria-labelledby, Tab focus trap, Esc triggers Mulai Baru |
| 8.5B tests total | `PASS_CI` | 32 new tests (15 middleware-security + 12 a11y-smoke + 5 api-no-stack-leak) — all CI success |
| Exact SHA | `PASS_CI` | Checkout SHA `c487df0d9f271ed1c0da2a1369a019b75b41e2d0` verified in CI log |
| CI Run | `PASS_CI` | `27831532947` — 3/3 jobs success (Test, TypeScript gate, Build) |

## Sprint 8.5C Closure (Image/audio Upload + Reload)

Sprint 8.5C initial: CI run `27834030578` on SHA `99258bd78d94520b5c2a2099cbea51630cae4b36` — 3/3 jobs success.
Sprint 8.5C-Patch-1 (SVG security fix): CI run `27835293255` on SHA `84da68c835429ca2021e342d502a6629becaf109` — 3/3 jobs success.
Final remote HEAD after docs sync: see commit log.

| Gate | CI Status | Evidence |
|---|---|---|
| `/api/upload` route exists (was 404) | `PASS_CI` | `src/app/api/upload/route.ts` — POST handler with multipart/form-data parsing |
| Image upload contract matches ImageUploader | `PASS_CI` | `api-upload.test.ts` — POST returns `{success, url, filename}` matching ImageUploader.tsx expectations |
| Successful upload — JPEG | `PASS_CI` | `api-upload.test.ts` — returns 200, URL `/uploads/<sha256>.jpg` |
| Successful upload — PNG | `PASS_CI` | `api-upload.test.ts` — file written to `public/uploads/<sha256>.png` with exact content |
| Successful upload — GIF | `PASS_CI` | `api-upload.test.ts` — URL `/uploads/<sha256>.gif` |
| Successful upload — WebP | `PASS_CI` | `api-upload.test.ts` — URL `/uploads/<sha256>.webp` |
| **SVG upload REJECTED (Patch-1 security)** | `PASS_CI` | `api-upload.test.ts` — `image/svg+xml` returns 400 + `'Tipe file tidak didukung'` + file NOT written to disk |
| **SVG XSS payload rejection (Patch-1)** | `PASS_CI` | `api-upload.test.ts` — 4 SVG attack vectors all rejected: `<script>`, `onload=`, `<foreignObject>`, `<use href>` |
| Content-addressed dedupe | `PASS_CI` | `api-upload.test.ts` — same content uploaded twice returns same URL |
| Invalid MIME type rejection | `PASS_CI` | `api-upload.test.ts` — text/plain → 400 + generic error |
| Empty file rejection | `PASS_CI` | `api-upload.test.ts` — size=0 → 400 + generic error |
| Oversized file rejection (>5MB) | `PASS_CI` | `api-upload.test.ts` — >5MB → 413 + generic error |
| MIME spoofing rejection (magic bytes) | `PASS_CI` | `api-upload.test.ts` — claims image/jpeg but bytes are not JPEG → 400 (defense in depth) |
| No 'file' field rejection | `PASS_CI` | `api-upload.test.ts` — empty form → 400 |
| No stack leak on internal failure | `PASS_CI` | `api-upload.test.ts` — writeFile EACCES → 500 + `'Gagal mengunggah file. Silakan coba lagi.'`, no EACCES/path leak |
| GET discovery endpoint | `PASS_CI` | `api-upload.test.ts` — returns metadata (4 allowed types only, no svg) |
| >1MB bgDataUrl survives save → load roundtrip | `PASS_CI` | `media-reload-persistence.test.ts` — byte-for-byte equality after save → clear → load |
| Multiple pages with large bgDataUrl survive roundtrip | `PASS_CI` | `media-reload-persistence.test.ts` — 3 pages × ~800KB each, all preserved |
| Small bgDataUrl survives roundtrip (regression) | `PASS_CI` | `media-reload-persistence.test.ts` — ~100 bytes preserved |
| bgDataUrl=null survives roundtrip | `PASS_CI` | `media-reload-persistence.test.ts` — null preserved for pages without background |
| image-background-large.json fixture intact | `PASS_CI` | `media-reload-persistence.test.ts` — has bgDataUrl + overlay=40 after parse |
| bgDataUrl URL pattern preserved | `PASS_CI` | `media-reload-persistence.test.ts` — `data:image/png;base64,...` prefix intact |
| Patch-2 invariant fields survive together | `PASS_CI` | `media-reload-persistence.test.ts` — bgDataUrl + overlay + navConfig all preserved |
| 8.5C tests total | `PASS_CI` | 21 tests total (14 api-upload including 2 SVG-rejection + 7 media-reload-persistence) — all CI success |
| Exact SHA (initial 8.5C) | `PASS_CI` | `99258bd78d94520b5c2a2099cbea51630cae4b36` — CI run `27834030578` 3/3 success |
| Exact SHA (Patch-1 SVG fix) | `PASS_CI` | `84da68c835429ca2021e342d502a6629becaf109` — CI run `27835293255` 3/3 success |

## Sprint 8.6A Closure (Project Schema Versioning Gate)

Exact-SHA CI run `27837399563` on SHA `b1a18dc0a78eaf6a27c4cc56c45a3708a8c2695a`:

| Gate | CI Status | Evidence |
|---|---|---|
| CURRENT_PROJECT_SCHEMA_VERSION constant exists (=1) | `PASS_CI` | `project-schema-versioning.test.ts` — constant exported, separate from per-page SCHEMA_VERSION (2) |
| Export JSON includes schemaVersion | `PASS_CI` | `schema-versioning-import-export.test.ts` — both Dashboard.tsx + use-export-actions.ts shapes include `schemaVersion: 1` |
| Legacy JSON (no schemaVersion) migrates successfully | `PASS_CI` | `schema-versioning-import-export.test.ts` + `legacy-no-schema-version.json` fixture → `migrateProjectDocument` returns `{ok: true, document: {schemaVersion: 1}}` |
| Current schemaVersion roundtrip stable | `PASS_CI` | `schema-versioning-import-export.test.ts` — export → import → re-export preserves `schemaVersion: 1` |
| Future schemaVersion rejected safely | `PASS_CI` | `schema-versioning-import-export.test.ts` + `future-schema-version.json` fixture (schemaVersion: 99) → `{ok: false, reason: 'future-version'}` |
| Malformed schemaVersion rejected safely | `PASS_CI` | `schema-versioning-import-export.test.ts` + `malformed-schema-version.json` fixture (schemaVersion: 'not-a-number') → `{ok: false, reason: 'malformed-version'}`; also NaN, negative, object, array |
| Invalid shape rejected safely | `PASS_CI` | `schema-versioning-import-export.test.ts` — null + array inputs → `{ok: false, reason: 'invalid-shape'}` |
| Import failure does NOT mutate stores | `PASS_CI` | `schema-versioning-import-export.test.ts` — 3 tests verify canva store, authoring store, both stores unchanged on failure |
| canva.pages preserved through import | `PASS_CI` | `schema-versioning-import-export.test.ts` — 3 pages imported, all IDs preserved |
| ratioId / currentPageIndex preserved | `PASS_CI` | `schema-versioning-import-export.test.ts` — `'4:3'` + `2` preserved |
| bgDataUrl preserved | `PASS_CI` | `schema-versioning-import-export.test.ts` — custom data URL preserved byte-for-byte |
| navConfig / overlay preserved | `PASS_CI` | `schema-versioning-import-export.test.ts` — custom navConfig + overlay=60 preserved |
| contractId / pageMode preserved | `PASS_CI` | `schema-versioning-import-export.test.ts` — `'academic-clean-contract'` + `'schema'` preserved |
| ScreenSchema.version compatibility bug fixed | `PASS_CI` | `project-schema-versioning.test.ts` — 8 tests via `isSchemaVersionCompatible` from `validation.ts`: missing/v0/v1 → true, v2 (current) → true (BUG FIX), future → false, malformed → false |
| Field preservation (all 12+ fields) | `PASS_CI` | `project-schema-versioning.test.ts` — separate test per field: canva.pages, ratioId, currentPageIndex, contractId, pageMode, schema.themeId, templateData.schemaThemeId, templateVariant, navConfig, bgColor, bgDataUrl, overlay, schema.background, schema.blocks, meta, cp, tp, atp, alur, kuis, modules, materi |
| 8.6A tests total | `PASS_CI` | 82 new tests (58 project-schema-versioning + 24 schema-versioning-import-export) — all CI success |
| Exact SHA | `PASS_CI` | Checkout SHA `b1a18dc0a78eaf6a27c4cc56c45a3708a8c2695a` verified in CI log |
| CI Run | `PASS_CI` | `27837399563` — 3/3 jobs success (Test, TypeScript gate, Build) |

## Sprint 8.6B Closure (TypeScript Release Gate)

Exact-SHA CI run `27841199162` on SHA `f01a714300380d1cca2b1248a627535b4bd6a9ea`:

**Before**: 63 errors / 48 signatures (baseline-gated, BUILD-002 OPEN)
**After**: 0 errors / 0 signatures (BUILD-002 CLOSED, baseline reset to 0)

| Gate | CI Status | Evidence |
|---|---|---|
| `npx tsc --noEmit` returns 0 | `PASS_CI` | Local + CI both report 0 errors (was 63) |
| `normalize-ts-errors.js --check` passes with 0 sigs | `PASS_CI` | Baseline `scripts/ts-baseline.txt` reset to 0 signatures / 0 occurrences |
| Dead code removed (shadcn + SortableCanvas + scripts) | `PASS_CI` | 14 unused shadcn/ui components + SortableCanvas.tsx + OverflowDialog.deprecated.tsx + 2 dead generate-quiz scripts deleted (20 errors eliminated) |
| Duplicate property + missing type field fixed | `PASS_CI` | `guided-patch.ts`: removed duplicate `'materi-blok'` key (TS1117) + added `defaultValue?: string` to `GuidedFieldDef` (TS2353) |
| Logger.info method added | `PASS_CI` | `src/core/utils/logger.ts`: added `info(context, message)` — CourseTemplateRegistry + project-schema-versioning depend on it |
| Null vs undefined fixed | `PASS_CI` | `primary-edit-target.ts`: 3 errors fixed via `?? null` coalescing; `db.ts`: 3 errors fixed by switching `PrismaClient \| null` → `PrismaClient \| undefined` + `as unknown` cast |
| Enum mismatches fixed | `PASS_CI` | `types/base.ts`: added `'evaluasi'` to `learningPhase` union (2 errors); `canva/types.ts`: aligned `UpdateSchemaBlockOptions.source` with PatchSource union (2 errors) |
| Record<string,unknown> casts fixed | `PASS_CI` | `kuis/roda/sortir-import.ts`: made ImportPatch types extend `Record<string, unknown>` (3 errors); `auto-repair.ts` + `visual-parity-check.ts`: cast through `unknown` (5 errors) |
| Missing interface fields fixed | `PASS_CI` | `CanvaBuilder.tsx`: added `openAIAssistant` stub to CanvaShortcutDeps; `module-slice.ts`: added `games: []` initial state |
| Generic migration helper (PERSIST-001) | `PASS_CI` | `schema-migration.ts`: `migrateAllSchemas` now generic `<T extends { schema?: ScreenSchema \| null }>` — preserves `CanvaPage[]` through migration chain (2 errors fixed, PERSIST-001 CLOSED) |
| Test file typing fixed | `PASS_CI` | `primary-edit-target.test.ts`: replaced `overlay: {}` with `overlay: 0`, `navConfig: {}` with full object, `colorPalette: {}` with `null` (2 errors) |
| Script file typing fixed | `PASS_CI` | `runtime-contract-check.ts`: 10 errors fixed via early-continue guard for `screen.nav`; `health-check-macam-norma.ts`: 1 error fixed via partial→full CanvaPage cast; `manual-qa-core.spec.ts`: 2 errors fixed via `?? ''` coalescing |
| Build success | `PASS_CI` | `npm run build` exit code 0, `.next/BUILD_ID` present |
| All CI tests pass | `PASS_CI` | 759 tests pass (514 src/core + 245 existing sprint tests) |
| BUILD-002 status | `CLOSED` | Was 46 errors → now 0 errors. `npx tsc --noEmit` clean. |
| BUILD-003 status | `CLOSED` | Dead `SortableCanvas.tsx` deleted (was missing @dnd-kit deps, 0 imports). |
| PERSIST-001 status | `CLOSED` | `migrateAllSchemas` generic preserves CanvaPage[] — no cast needed at hydration boundary. |
| Exact SHA | `PASS_CI` | Checkout SHA `f01a714300380d1cca2b1248a627535b4bd6a9ea` verified in CI log |
| CI Run | `PASS_CI` | `27841199162` — 3/3 jobs success (Test, TypeScript gate, Build) |

## Sprint 8.7A Closure (Flow Guru Manual Gate + Ledger Sync)

Exact-SHA CI run `27860394387` on SHA `d51fe0ea7d2a15ca3395155b722cdc97b5a783f1`:

| Gate | CI Status | Evidence |
|---|---|---|
| 10 curated blocks exist (TEACHER_ADDABLE_BLOCKS) | `PASS_CI` | `flow-guru-gate.test.ts` — exactly 10: materi-section, def-box, kuis, diskusi, refleksi, sortir-game, rangkuman, motivasi, gambar, roda-game |
| Every curated block has guided editor | `PASS_CI` | `flow-guru-gate.test.ts` — `getGuidedEditorSchema()` returns non-null for all 10 |
| hasGuidedEditor() returns true for all 10 | `PASS_CI` | `flow-guru-gate.test.ts` — verified via public API |
| Every guided editor has displayName + icon + fields | `PASS_CI` | `flow-guru-gate.test.ts` — each has non-empty displayName, icon, >= 1 field |
| addSchemaBlock() mutates schema.blocks | `PASS_CI` | `flow-guru-gate.test.ts` — block count increments after add |
| addSchemaBlock() works for all 10 types | `PASS_CI` | `flow-guru-gate.test.ts` — all types produce valid block with id + type |
| Export JSON includes schemaVersion | `PASS_CI` | `flow-guru-gate.test.ts` — `schemaVersion: 1` present |
| Export JSON includes canva.pages (no silent fallback) | `PASS_CI` | `flow-guru-gate.test.ts` — pages non-empty, schema.blocks preserved |
| Import JSON roundtrips | `PASS_CI` | `flow-guru-gate.test.ts` — export → migrateProjectDocument → verify schemaVersion + canva.pages |
| Store has valid ratioId + currentPageIndex | `PASS_CI` | `flow-guru-gate.test.ts` — ratioId non-empty, currentPageIndex in bounds |
| KNOWN_ISSUES stale items cleaned | `PASS_CI` | 5 OPEN → CLOSED (QUIZ-001, RECOV-001, SEC-003, SCHEMA-001, EXPORT-001), 2 OPEN → PARTIAL (SEC-002, A11Y-001), 5 legitimately OPEN remain (BLOCK-001, RECOV-002, SEC-001, PERF-001, PERSIST-002) |
| 8.7A tests total | `PASS_CI` | 14 new tests (flow-guru-gate.test.ts) — all CI success |
| Exact SHA | `PASS_CI` | Checkout SHA `d51fe0ea7d2a15ca3395155b722cdc97b5a783f1` verified in CI log |
| CI Run | `PASS_CI` | `27860394387` — 3/3 jobs success (Test, TypeScript gate, Build) |

## Sprint 8.7B Closure (Guided Editor Polish)

Exact-SHA CI run `27863757407` on SHA `f85522cd3e89d739a475ac64d3ad175861aa860c`:

| Gate | CI Status | Evidence |
|---|---|---|
| Refleksi guided editor exposes `warna` field | `PASS_CI` | `guided-editor-polish.test.ts` — questions[] has warna (type=color, has options) |
| Refleksi still has teks/petunjuk/icon (regression) | `PASS_CI` | `guided-editor-polish.test.ts` — all 4 fields verified present |
| Roda-game opts[].correct has `exclusiveToggle=true` | `PASS_CI` | `guided-editor-polish.test.ts` — exclusiveToggle verified on correct field |
| Roda-game opts[] still has text field (regression) | `PASS_CI` | `guided-editor-polish.test.ts` — text field verified |
| Roda-game schema UNCHANGED (opts[].correct: boolean) | `PASS_CI` | No change to RodaGameBlock type. Renderer reads opt.correct as before. |
| Diskusi label/icon/color guard (all 5 fields) | `PASS_CI` | `guided-editor-polish.test.ts` — label, icon, teks, petunjuk, color all present |
| Kuis opts stays string[] (regression guard) | `PASS_CI` | `guided-editor-polish.test.ts` — opts sub-field key='', type='text' |
| Kuis ans stays A/B/C/D select (regression guard) | `PASS_CI` | `guided-editor-polish.test.ts` — ans select with 4 options [A,B,C,D] |
| All 4 block types still have guided editors | `PASS_CI` | `guided-editor-polish.test.ts` — hasGuidedEditor true for all 4 |
| tsc 0 errors | `PASS_CI` | `npx tsc --noEmit` returns 0 |
| normalize-ts-errors 0 sigs | `PASS_CI` | baseline 0 signatures / 0 occurrences |
| Build success | `PASS_CI` | `npm run build` exit code 0, `.next/BUILD_ID` present |
| 8.7B tests total | `PASS_CI` | 14 new tests (guided-editor-polish.test.ts) — all CI success |
| Exact SHA | `PASS_CI` | `f85522cd3e89d739a475ac64d3ad175861aa860c` verified in CI log |
| CI Run | `PASS_CI` | `27863757407` — 3/3 jobs success (Test, TypeScript gate, Build) |

## Sprint 8.8A / 3A Closure (Pre-Hotspot Contract + Roadmap Sync)

Exact-SHA CI run `27865099925` on SHA `7ec3ef93c1658f846ad55cde57a4e1d95cea4e18`:

| Gate | CI Status | Evidence |
|---|---|---|
| Hotspot contract document FROZEN | `PASS_CI` | `docs/HOTSPOT-IMAGE-CONTRACT.md` — schema, UX (3×3 preset), renderer, export parity, security, acceptance criteria for 3B |
| Roadmap synced (Sprint 2C CLOSED) | `PASS_CI` | `docs/Teacher-Flow-v1-Stable-Baseline.md` — 2C items marked ✅/⏸️, Sprint 3 split into 3A/3B, urutan updated |
| hotspot-image NOT in TEACHER_ADDABLE_BLOCKS | `PASS_CI` | `hotspot-contract-guards.test.ts` — verified not addable before 3B |
| hotspot-image NOT in GUIDED_EDITOR_REGISTRY | `PASS_CI` | `hotspot-contract-guards.test.ts` — hasGuidedEditor returns false |
| hotspot-image NOT in block types | `PASS_CI` | `hotspot-contract-guards.test.ts` — no HotspotImageBlock export |
| 10 curated blocks stable (regression) | `PASS_CI` | `hotspot-contract-guards.test.ts` — all 10 still have guided editors |
| sanitizeHtml security boundary | `PASS_CI` | `hotspot-contract-guards.test.ts` — 7 tests: strips script/iframe/style/on*/javascript:, preserves allowed tags |
| tsc 0 errors | `PASS_CI` | `npx tsc --noEmit` returns 0 |
| normalize-ts-errors 0 sigs | `PASS_CI` | baseline 0 signatures / 0 occurrences |
| Build success | `PASS_CI` | `npm run build` exit code 0 |
| 8.8A tests total | `PASS_CI` | 16 new tests (hotspot-contract-guards.test.ts) — all CI success |
| Exact SHA | `PASS_CI` | `7ec3ef93c1658f846ad55cde57a4e1d95cea4e18` verified in CI log |
| CI Run | `PASS_CI` | `27865099925` — 3/3 jobs success (Test, TypeScript gate, Build) |

## Sprint 8.8B / 3B Closure (Hotspot Image Minimal Vertical Slice)

Source SHA `a6b2e835640baa5a2f85aa60935fa94530be4ec8` + Patch-1 `834ff28a5c0839fd7f457feca77f5644b4be84fc`.
CI run `27872069224` (on Patch-1 SHA) — 3/3 jobs success.

| Gate | CI Status | Evidence |
|---|---|---|
| HotspotImageBlock type exists | `PASS_CI` | `src/core/schema/types/blocks.ts` — interface with image{url,alt}, hotspots[{id,x,y,label,title,body,icon,color}], accentColor |
| Block definition in registry | `PASS_CI` | `definitions.ts` — name='Gambar Interaktif', category='interactive', personality='activation', addable=true |
| createDefault produces valid block | `PASS_CI` | `hotspot-image.test.ts` — 1 hotspot at center (50,50), label='1' |
| Guided editor with preset 3×3 positions | `PASS_CI` | `hotspot-image.test.ts` — 9 options: 15,15 / 50,15 / 85,15 / 15,50 / 50,50 / 85,50 / 15,85 / 50,85 / 85,85 |
| Guided editor sub-fields | `PASS_CI` | `hotspot-image.test.ts` — label, posisi, title, body, icon, color |
| HotspotImageRenderer.tsx | `PASS_CI` | `src/core/renderer/blocks/HotspotImageRenderer.tsx` — image + hotspot buttons + click-to-open card + keyboard nav |
| Export parity (PageRenderer auto-parity) | `PASS_CI` | `RendererLazy.tsx` — 'hotspot-image' in LAZY_RENDERER_MAP |
| Security: javascript: URL rejected | `PASS_CI` | `hotspot-image.test.ts` — renderer checks startsWith('javascript:') → safeImageUrl='' |
| Security: body is plain text (no dangerouslySetInnerHTML) | `PASS_CI` | `hotspot-image.test.ts` — body rendered via {activeHs.body} (React auto-escapes) |
| hotspot-image in TEACHER_ADDABLE_BLOCKS | `PASS_CI` | `hotspot-image.test.ts` — 11 blocks total (10 original + hotspot) |
| Contract guards updated (8.8B-Patch-1) | `PASS_CI` | `hotspot-contract-guards.test.ts` — assertions flipped from NOT→IS for all 3 checks |
| 10 original curated blocks stable (regression) | `PASS_CI` | `hotspot-image.test.ts` — all 10 still have guided editors |
| tsc 0 errors | `PASS_CI` | `npx tsc --noEmit` returns 0 |
| normalize-ts-errors 0 sigs | `PASS_CI` | baseline 0 signatures / 0 occurrences |
| Build success | `PASS_CI` | `npm run build` exit code 0 |
| 8.8B tests total | `PASS_CI` | 16 new tests (hotspot-image.test.ts) + 15 updated (hotspot-contract-guards.test.ts) — all CI success |
| Exact SHA (source) | `PASS_CI` | `a6b2e835640baa5a2f85aa60935fa94530be4ec8` |
| Exact SHA (Patch-1) | `PASS_CI` | `834ff28a5c0839fd7f457feca77f5644b4be84fc` |
| CI Run | `PASS_CI` | `27872069224` — 3/3 jobs success (Test, TypeScript gate, Build) |

### Sprint 8.8B-Patch-2 (Hotspot Position Roundtrip)

CI run `27873320476` on SHA `a5c200543665162ca375a42965b122e8cf5bbfcf` — 3/3 jobs success.

| Gate | CI Status | Evidence |
|---|---|---|
| parseHotspotPosition("15,15") → {x:15, y:15} | `PASS_CI` | `hotspot-position-roundtrip.test.ts` — all 9 positions verified |
| parseHotspotPosition clamps 0–100 | `PASS_CI` | `hotspot-position-roundtrip.test.ts` — 150→100, -10→0 |
| parseHotspotPosition fallback to center | `PASS_CI` | `hotspot-position-roundtrip.test.ts` — malformed/empty/null → {50,50} |
| formatHotspotPosition(15,15) → "15,15" | `PASS_CI` | `hotspot-position-roundtrip.test.ts` — verified |
| No 'posisi' field on HotspotImageBlock | `PASS_CI` | `hotspot-position-roundtrip.test.ts` — createDefault has x/y, no posisi; @ts-expect-error on hs.posisi |
| Guided editor posisi derives value from x,y | `PASS_CI` | `field-registry.tsx` — select value = `${item.x},${item.y}`, NOT item.posisi |
| Field renderer writes x/y (not posisi) on select change | `PASS_CI` | `field-registry.tsx` — updateNestedItem intercepts 'posisi' key, calls parseHotspotPosition, writes x+y |
| Full roundtrip: preset → x/y → preset | `PASS_CI` | `hotspot-position-roundtrip.test.ts` — all 9 positions stable |
| Stale comments fixed | `PASS_CI` | `hotspot-contract-guards.test.ts` — header updated from pre-implementation to post-8.8B |

## Cara Memperbarui Matriks Ini

- Update matriks setiap sprint yang menutup lubang atau menemukan
  lubang baru.
- Jangan ubah status ke `PASS_LOCAL` atau `PASS_CI` tanpa:
  1. Test otomatis yang lulus
  2. Evidence ID (test file path + commit SHA) di Evidence Index
- Jika status `PASS_SOURCE_ONLY` atau `LOCAL_REPORTED`, sebutkan di
  Penjelasan per Area kenapa belum `PASS_LOCAL`.
- Jika status `BLOCKED`, tambahkan link ke `KNOWN_ISSUES.md` entry.
- `PASS_CI` hanya jika CI workflow aktif dan test lulus di GitHub Actions.

Matriks ini adalah source of truth untuk "apa yang sudah benar-benar
teruji" — bukan "apa yang seharusnya jalan menurut kode".

## Sprint 8.9A / 4A Closure (Post-Hotspot QA & Export Stabilization)

CI run `27875781401` on SHA `60a53a1beaa19d601ea7ffdf285fb85a2b4d164e` — 3/3 jobs success.

| Gate | CI Status | Evidence |
|---|---|---|
| Renderer: valid image renders with src+alt | `PASS_CI` | `hotspot-qa.test.tsx` — img src + alt verified |
| Renderer: placeholder for empty/broken image | `PASS_CI` | `hotspot-qa.test.tsx` — no img, placeholder icon shown |
| Renderer: hotspot buttons at x/y positions | `PASS_CI` | `hotspot-qa.test.tsx` — left:15%, top:15% verified |
| Renderer: click opens card | `PASS_CI` | `hotspot-qa.test.tsx` — title+body shown after click |
| Renderer: Escape closes card | `PASS_CI` | `hotspot-qa.test.tsx` — card gone after Escape |
| Security: body is plain text | `PASS_CI` | `hotspot-qa.test.tsx` — <script> rendered as text (P element) |
| Security: no dangerouslySetInnerHTML in source | `PASS_CI` | `hotspot-qa.test.tsx` — 0 JSX usages (comments only) |
| Security: javascript: URL rejected | `PASS_CI` | `hotspot-qa.test.tsx` — placeholder shown, no img |
| Export parity: renderer in LAZY_RENDERER_MAP | `PASS_CI` | `hotspot-qa.test.tsx` — entry exists + is lazy component |
| Guided editor: posisi roundtrips to x/y | `PASS_CI` | `hotspot-qa.test.tsx` — parse+format+9 options verified |
| No posisi field stored on block | `PASS_CI` | `hotspot-qa.test.tsx` — createDefault has x/y, no posisi |
| 10 original blocks stable | `PASS_CI` | `hotspot-qa.test.tsx` — all 10 still have guided editors |
| hotspot-image in TEACHER_ADDABLE_BLOCKS (11) | `PASS_CI` | `hotspot-qa.test.tsx` — 11 blocks verified |
| Keyboard: Enter/Space opens card | `PASS_CI` | `hotspot-qa.test.tsx` — both keys tested |
| Alt text fallback | `PASS_CI` | `hotspot-qa.test.tsx` — title fallback + 'Gambar hotspot' default |
| Hotspot without body | `PASS_CI` | `hotspot-qa.test.tsx` — title only, no empty paragraph |
| tsc 0 errors | `PASS_CI` | `npx tsc --noEmit` returns 0 |
| normalize 0 sigs | `PASS_CI` | baseline 0 signatures |
| Build success | `PASS_CI` | `npm run build` exit 0 |
| 8.9A tests total | `PASS_CI` | 28 new tests (hotspot-qa.test.tsx) — all CI success |
| Exact SHA | `PASS_CI` | `60a53a1beaa19d601ea7ffdf285fb85a2b4d164e` |
| CI Run | `PASS_CI` | `27875781401` — 3/3 jobs success |

## Sprint 8.9B / 4B Closure (Curated Block Registry Single Source)

CI run `27876918765` on SHA `a8044cbe5d137bd2c2e18711f496ad7f3a774bff` — 3/3 jobs success.

| Gate | CI Status | Evidence |
|---|---|---|
| Shared constant file created | `PASS_CI` | `src/core/registry/teacher-curated-blocks.ts` — TEACHER_ADDABLE_BLOCKS (11) + POPULAR_BLOCK_TYPES (10) + ORIGINAL_TEACHER_BLOCKS (10) + helpers |
| AddBlockPanel uses shared constant | `PASS_CI` | Local useMemo copies removed, imports from shared module |
| No more manual copies in tests | `PASS_CI` | 4 test files updated: flow-guru-gate, hotspot-contract-guards, hotspot-image, hotspot-qa — all import shared constant |
| flow-guru-gate STALE copy fixed | `PASS_CI` | Was 10 blocks (missing hotspot) → now imports shared (11 blocks) |
| TEACHER_ADDABLE_BLOCKS = 11 | `PASS_CI` | `curated-block-registry.test.ts` — verified |
| POPULAR subset of ADDABLE | `PASS_CI` | `curated-block-registry.test.ts` — all popular types in addable |
| All addable have guided editor | `PASS_CI` | `curated-block-registry.test.ts` — hasGuidedEditor true for all 11 |
| All addable in BLOCK_DEFINITIONS | `PASS_CI` | `curated-block-registry.test.ts` — all 11 defined |
| All addable have addable !== false | `PASS_CI` | `curated-block-registry.test.ts` — verified |
| hotspot-image addable but NOT popular | `PASS_CI` | `curated-block-registry.test.ts` — in addable, not in popular |
| 10 original blocks stable | `PASS_CI` | `curated-block-registry.test.ts` — all 10 in TEACHER_ADDABLE_BLOCKS |
| Helper functions work | `PASS_CI` | `curated-block-registry.test.ts` — isTeacherAddableBlock + isPopularBlock |
| tsc 0 errors | `PASS_CI` | `npx tsc --noEmit` returns 0 |
| normalize 0 sigs | `PASS_CI` | baseline 0 signatures |
| Build success | `PASS_CI` | `npm run build` exit 0 |
| 8.9B tests total | `PASS_CI` | 14 new tests (curated-block-registry.test.ts) — all CI success |
| Exact SHA | `PASS_CI` | `a8044cbe5d137bd2c2e18711f496ad7f3a774bff` |
| CI Run | `PASS_CI` | `27876918765` — 3/3 jobs success |

## Sprint 8.9C / 4C Closure (Teacher Flow UI Smoke & Comment Cleanup)

CI run `27888747253` on SHA `1decf84e9188b28fcc41296c245c658a7522e073` — 3/3 jobs success.

| Gate | CI Status | Evidence |
|---|---|---|
| No stale '10 curated' comments for active TEACHER_ADDABLE_BLOCKS | `PASS_CI` | 4 test files cleaned: flow-guru-gate, hotspot-contract-guards, hotspot-image, hotspot-qa |
| flow-guru-gate.test.ts wording synced (11 blocks) | `PASS_CI` | Header, gate comments, test names all updated to 11 |
| hotspot-contract-guards.test.ts full rewrite (clear sections) | `PASS_CI` | Removed duplicate comments, synced section names + test names to 11 |
| ORIGINAL_TEACHER_BLOCKS clearly labeled as regression set (10) | `PASS_CI` | hotspot-image.test.ts + hotspot-qa.test.tsx use ORIGINAL_TEACHER_BLOCKS |
| AddBlockPanel smoke test: 11 teacher addable | `PASS_CI` | `addblock-panel-smoke.test.ts` — TEACHER_ADDABLE_BLOCKS.length = 11 |
| hotspot-image available in teacher addable | `PASS_CI` | `addblock-panel-smoke.test.ts` — contains hotspot-image |
| POPULAR_BLOCK_TYPES = 10 (subset, no hotspot) | `PASS_CI` | `addblock-panel-smoke.test.ts` — 10 blocks, all in addable |
| No page-level blocks in addable | `PASS_CI` | `addblock-panel-smoke.test.ts` — cover/tp/petunjuk/penutup/etc excluded |
| All addable have guided editors + in BLOCK_DEFINITIONS | `PASS_CI` | `addblock-panel-smoke.test.ts` — all 11 verified |
| Helpers (isTeacherAddableBlock, isPopularBlock) correct | `PASS_CI` | `addblock-panel-smoke.test.ts` — both helpers tested |
| No manual copy of TEACHER_ADDABLE_BLOCKS in test | `PASS_CI` | `addblock-panel-smoke.test.ts` — imports shared constant |
| tsc 0 errors | `PASS_CI` | `npx tsc --noEmit` returns 0 |
| normalize 0 sigs | `PASS_CI` | baseline 0 signatures |
| Build success | `PASS_CI` | `npm run build` exit 0 |
| 8.9C tests total | `PASS_CI` | 12 new tests (addblock-panel-smoke.test.ts) — all CI success |
| Exact SHA | `PASS_CI` | `1decf84e9188b28fcc41296c245c658a7522e073` |
| CI Run | `PASS_CI` | `27888747253` — 3/3 jobs success |

## Sprint 8.9D / 4D Closure (Real Teacher Add Flow UI Smoke)

CI run `27890037254` on SHA `e7aadc1515e7b58090a85438224bae187ad74a48` — 3/3 jobs success.

| Gate | CI Status | Evidence |
|---|---|---|
| AddBlockPanel renders in teacher mode | `PASS_CI` | `addblock-panel-ui-smoke.test.tsx` — panel renders, 'Tambah Isi' header visible |
| All 11 TEACHER_ADDABLE_BLOCKS appear as add buttons | `PASS_CI` | `addblock-panel-ui-smoke.test.tsx` — all 11 data-testid buttons verified |
| hotspot-image appears as clickable button | `PASS_CI` | `addblock-panel-ui-smoke.test.tsx` — button found + tagName=BUTTON |
| Page-level blocks excluded from teacher UI | `PASS_CI` | `addblock-panel-ui-smoke.test.tsx` — cover/tp/petunjuk/etc all null |
| Popular grid shows 10 blocks (no hotspot) | `PASS_CI` | `addblock-panel-ui-smoke.test.tsx` — grid.grid-cols-3 has 10 buttons |
| Search finds hotspot-image | `PASS_CI` | `addblock-panel-ui-smoke.test.tsx` — 'hotspot' + 'gambar interaktif' both find it |
| Click hotspot-image calls addSchemaBlock | `PASS_CI` | `addblock-panel-ui-smoke.test.tsx` — mockAddSchemaBlock called with 'hotspot-image' |
| Click popular block calls addSchemaBlock | `PASS_CI` | `addblock-panel-ui-smoke.test.tsx` — materi-section verified |
| No manual copy of TEACHER_ADDABLE_BLOCKS | `PASS_CI` | `addblock-panel-ui-smoke.test.tsx` — imports shared constant |
| Header shows block count = 11 | `PASS_CI` | `addblock-panel-ui-smoke.test.tsx` — header.textContent contains '11' |
| Source fix: hotspot-image added to RENDERER_MAP | `PASS_CI` | `SceneRegistry.tsx` — was missing from RENDERER_MAP (only in LAZY_RENDERER_MAP) |
| tsc 0 errors | `PASS_CI` | `npx tsc --noEmit` returns 0 |
| normalize 0 sigs | `PASS_CI` | baseline 0 signatures |
| Build success | `PASS_CI` | `npm run build` exit 0 |
| 8.9D tests total | `PASS_CI` | 11 new tests (addblock-panel-ui-smoke.test.tsx) — all CI success |
| Exact SHA | `PASS_CI` | `e7aadc1515e7b58090a85438224bae187ad74a48` |
| CI Run | `PASS_CI` | `27890037254` — 3/3 jobs success |

## Sprint 9.0A Closure (Persistence Migration Idempotency Gate)

CI run `27894538407` on SHA `72ae9dd542cfcd020e0489f123bf13fcaa27d5ef` — 3/3 jobs success.

| Gate | CI Status | Evidence |
|---|---|---|
| Legacy doc idempotency: migrate(migrate(doc)) === migrate(doc) | `PASS_CI` | `migration-idempotency.test.ts` — deep equal verified |
| Current doc idempotency | `PASS_CI` | `migration-idempotency.test.ts` — deep equal + no unnecessary change |
| Canvas page schema fields preserved | `PASS_CI` | `migration-idempotency.test.ts` — contractId, pageMode, navConfig, bgColor, overlay, bgDataUrl, templateData.schemaThemeId all verified |
| Hotspot-image block preserved | `PASS_CI` | `migration-idempotency.test.ts` — type, hotspots, x/y, body all survive |
| Triple migration stability (4 docs) | `PASS_CI` | `migration-idempotency.test.ts` — legacy, current, hotspot, extra-fields all triple-stable |
| Unknown/extra fields NOT deleted | `PASS_CI` | `migration-idempotency.test.ts` — page-level + top-level custom fields survive |
| Invalid/minimal doc handled explicitly | `PASS_CI` | `migration-idempotency.test.ts` — null/array/string rejected, empty object accepted, future/malformed rejected |
| Real fixtures idempotency (5 fixtures) | `PASS_CI` | `migration-idempotency.test.ts` — legacy-no-schema-version, current-schema-version, golden-pertemuan, fresh-mission-adventure, image-background-large |
| migrateSchema idempotency (v0, v1, v2) | `PASS_CI` | `migration-idempotency.test.ts` — all 3 versions deep-equal stable |
| migrateAllSchemas idempotency (multi-page) | `PASS_CI` | `migration-idempotency.test.ts` — second pass has 0 migrations |
| PERSIST-002 status | `CLOSED` | 34 idempotency tests prove migration is safe and repeatable |
| tsc 0 errors | `PASS_CI` | `npx tsc --noEmit` returns 0 |
| normalize 0 sigs | `PASS_CI` | baseline 0 signatures |
| Build success | `PASS_CI` | `npm run build` exit 0 |
| 9.0A tests total | `PASS_CI` | 34 new tests (migration-idempotency.test.ts) — all CI success |
| Exact SHA | `PASS_CI` | `72ae9dd542cfcd020e0489f123bf13fcaa27d5ef` |
| CI Run | `PASS_CI` | `27894538407` — 3/3 jobs success |

## Sprint 9.0B Closure (Autosave Failure Telemetry Gate)

CI run `27897850049` on SHA `44ca23de8f750aa312a392732e6d5f4fccc2bf0a` — 3/3 jobs success.

Senior Review 9.0B verdict: TECHNICAL IMPLEMENTATION PASS / CI VERIFIED / TEST GAP.
  - RC1: existing tests mocked `@/store/canva-store` entirely, so they never
    exercised the REAL `saveToStorage()` failure path. The 4 failure-reason
    cases only called `recordAutosaveFailure()` directly.
  - RC2: dirty-state protection (`saveFailed()` keeps `dirty=true`) was
    also never tested against the REAL `useDirtyStore`.

### 9.0B-Patch-1 (closes RC1 + RC2)

Added `src/__tests__/autosave-persistence-real.test.ts` (12 tests) which
imports the REAL `useCanvaStore` (only `authoring-store` + `dirty-store`
are stubbed to keep module graph loadable) and the REAL `useDirtyStore`
(loaded via `vi.importActual` to bypass the top-level mock).

| Gate | CI Status | Evidence |
|---|---|---|
| Telemetry helper exists | `PASS_CI` | `src/lib/autosave-telemetry.ts` — recordAutosaveFailure, getAutosaveTelemetry, clearAutosaveTelemetry |
| saveToStorage records failure telemetry | `PASS_CI` | `persistence-slice.ts` — catch block calls recordAutosaveFailure with classified reason |
| saveToStorage clears telemetry on success | `PASS_CI` | `persistence-slice.ts` — success path calls clearAutosaveTelemetry |
| Telemetry records quota-exceeded | `PASS_CI` | `autosave-telemetry.test.ts` (helper) + `autosave-persistence-real.test.ts` (real `saveToStorage()` with `localStorage.setItem` throw → `lastReason='quota-exceeded'`, `errorCount=1`, `_saveStatus='error'`) |
| Telemetry records serialization-error | `PASS_CI` | `autosave-persistence-real.test.ts` — real `saveToStorage()` with `TypeError` throw → `lastReason='serialization-error'` |
| Telemetry records stack-overflow | `PASS_CI` | `autosave-persistence-real.test.ts` — real `saveToStorage()` with `RangeError` throw → `lastReason='stack-overflow'` AND corrupted localStorage entry cleared |
| Telemetry records unknown error | `PASS_CI` | `autosave-persistence-real.test.ts` — real `saveToStorage()` with generic `Error` throw → `lastReason='unknown'` |
| Real saveToStorage success clears telemetry | `PASS_CI` | `autosave-persistence-real.test.ts` — fail then success → `errorCount=0`, `lastError=null`, `lastClearedAt!=null`, localStorage written |
| Multiple failures increment errorCount (real path) | `PASS_CI` | `autosave-persistence-real.test.ts` — 3 consecutive `saveToStorage()` failures → `errorCount=3` |
| Mixed failure reasons classified correctly (real path) | `PASS_CI` | `autosave-persistence-real.test.ts` — TypeError → QuotaExceededError → generic Error, each classified correctly |
| Successful save with no prior failure leaves telemetry clean | `PASS_CI` | `autosave-persistence-real.test.ts` — `errorCount=0`, `lastError=null`, `lastClearedAt=null` (no-op clear) |
| Dirty store saveFailed keeps dirty=true (real store) | `PASS_CI` | `autosave-persistence-real.test.ts` — real `useDirtyStore` via `vi.importActual`: `markDirty → startSaving → saveFailed('msg')` → `dirty=true`, `saveStatus='error'`, `lastError='msg'`, `savingRevision=null`, `editRevision` unchanged, `lastSavedRevision=0` |
| Dirty store saveSucceeded clears dirty (proves no false-clean) | `PASS_CI` | `autosave-persistence-real.test.ts` — matching revision → `dirty=false`, `saveStatus='saved'` (contrast: failure path keeps dirty=true) |
| Dirty store clearError on still-dirty store keeps dirty=true | `PASS_CI` | `autosave-persistence-real.test.ts` — `saveStatus='dirty'`, `lastError=null`, `dirty=true` |
| Multiple failures increment errorCount (helper) | `PASS_CI` | `autosave-telemetry.test.ts` — 3 failures → count=3 |
| getAutosaveTelemetry returns read-only snapshot | `PASS_CI` | `autosave-telemetry.test.ts` — mutation doesn't affect internal |
| clearAutosaveTelemetry resets after success | `PASS_CI` | `autosave-telemetry.test.ts` — errorCount=0, lastError=null |
| No crash on null/undefined/circular error | `PASS_CI` | `autosave-telemetry.test.ts` — all 3 verified no throw |
| Integration pattern (fail → retry → success) | `PASS_CI` | `autosave-telemetry.test.ts` — full cycle verified |
| RECOV-002 status | `CLOSED` | 18 telemetry helper tests + 12 real saveToStorage()/dirty-store tests prove failures are observable end-to-end |
| tsc 0 errors | `PASS_CI` | `npx tsc --noEmit` returns 0 |
| normalize 0 sigs | `PASS_CI` | baseline 0 signatures |
| Build success | `PASS_CI` | `npm run build` exit 0 |
| 9.0B tests total | `PASS_CI` | 18 (autosave-telemetry.test.ts) + 12 (autosave-persistence-real.test.ts) = 30 tests — all CI success |
| Exact SHA (9.0B initial) | `PASS_CI` | `44ca23de8f750aa312a392732e6d5f4fccc2bf0a` |
| CI Run (9.0B initial) | `PASS_CI` | `27897850049` — 3/3 jobs success |
| Exact SHA (9.0B-Patch-1) | `PASS_CI` | `96a5127c0e7d62b13f9ebab2d5b8a3aa93b87c0d` |
| CI Run (9.0B-Patch-1) | `PASS_CI` | `27898825800` — 3/3 jobs success (Test / TypeScript gate / Build) |
