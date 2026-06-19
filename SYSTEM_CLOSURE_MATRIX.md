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
| Image/audio | PASS_SOURCE_ONLY| PASS_SOURCE_ONLY| PASS_SOURCE_ONLY| LOCAL_REPORTED  | PASS_SOURCE_ONLY| NOT_TESTED      | NOT_TESTED      | LOCAL_REPORTED  |
| Import      | LOCAL_REPORTED  | N/A             | LOCAL_REPORTED  | LOCAL_REPORTED  | LOCAL_REPORTED  | NOT_TESTED      | NOT_TESTED      | NOT_TESTED      |
| Schema migration | N/A        | N/A             | N/A             | LOCAL_REPORTED  | N/A             | NOT_TESTED      | NOT_TESTED      | LOCAL_REPORTED  |
| Style Contract | PASS_LOCAL   | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | PASS_LOCAL      | NOT_TESTED      | NOT_TESTED      | PASS_LOCAL      |
| Mode lifecycle  | N/A         | N/A             | N/A             | N/A             | PASS_LOCAL      | PASS_CI | PASS_CI (POST full / GET partial) | N/A             |
| Error recovery  | N/A         | N/A             | N/A             | N/A             | N/A             | NOT_TESTED      | NOT_TESTED      | N/A             |

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
- **Create/Edit/Save/Preview**: `PASS_SOURCE_ONLY`
  - Source: `src/components/canva/right-panel/block-properties/field-registry.tsx`
  - Source: `src/components/authoring/konten/ImageUploader.tsx`
  - Tidak ada test otomatis untuk image upload flow
- **Reload**: `LOCAL_REPORTED`
  - bgDataUrl base64 besar (>1MB) belum ada test slow network
- **Legacy**: `LOCAL_REPORTED`
  - paletteToTokenOverrides masih jalan, tidak ada fixture korpus

### Import
- **Create**: `LOCAL_REPORTED`
  - Import Excel ada (`src/components/authoring/import-export/`)
  - Import project JSON belum lengkap
- **Save/Reload/Preview**: `LOCAL_REPORTED`
  - KNOWN_ISSUES PERSIST-001: persistence-slice.ts punya 2 TS errors
- **Legacy**: `NOT_TESTED`

### Schema migration
- **Reload**: `LOCAL_REPORTED`
  - `migrateAllPages()` jalan di load time
  - KNOWN_ISSUES PERSIST-002: idempotensi belum teruji menyeluruh
- **Legacy**: `LOCAL_REPORTED`
  - overlay elements migration (`_migrationVersion < 1`) ada

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
- **All**: `NOT_TESTED`
  - KNOWN_ISSUES RECOV-001: Tidak ada UI recovery flow
  - Sprint 8.5 target

## Lubang Setelah Present (Sprint 8.2B CLOSED)

Setelah 8.2B-Patch-2, status:

1. **Present mode wiring** — `PASS_CI` ✅ (11 token boundary + 9 consumer smoke tests, CI verified on SHA `6e9201f`)
2. **Mode lifecycle Preview/Present** — `PASS_CI` ✅ (smoke + listener tests, CI verified on SHA `fe7eee2`)
3. **Interactive store score bocor** — FIXED (M-001) ✅
4. **Fixture corpus** — `PASS_LOCAL` ✅ (6 fixture di `fixtures/projects/`)

## Lubang Terbesar Sebelum Release

1. ~~**Export HTML contract belum dirancang**~~ — ✅ IMPLEMENTED (Sprint 8.2C CLOSED). POST export + chrome wiring + consumer DOM verified. GET project export PARTIAL (contractId not persisted in Prisma).
2. **Schema versioning belum ada** — `docs/SCHEMA_VERSIONING_DESIGN.md` (design only)
3. ~~**CI belum ada di remote**~~ — ✅ CLOSED (CI-001, CI-002, BUILD-001 all CLOSED)
4. **46 pre-existing TS errors** — `KNOWN_ISSUES.md` BUILD-002 (baseline-gated, CI green)
5. **Security & accessibility gate belum dijalankan** — Sprint 8.5
6. **Image/audio Import Reload** — `PASS_SOURCE_ONLY` → perlu test otomatis
7. **Error recovery UI** — `NOT_TESTED` → Sprint 8.5

## CI Verified Statuses (Sprint 8.2S-2-Patch-5)

Exact-SHA CI run `27736541608` on SHA `fe7eee27572a030cbf3335fbe03c790ae1a9519c`:

| Gate | CI Status | Evidence |
|---|---|---|
| Mode lifecycle Preview | `PASS_CI` | `mode-lifecycle-smoke.test.ts` (23 tests) — CI success |
| Stability test suite | `PASS_CI` | `listener-cleanup-integration.test.tsx` (19 tests) + `store-init-bootstrap.test.tsx` (6 tests) + `normalize-ts-errors.test.ts` (24 tests) — CI success |
| TypeScript regression gate | `PASS_CI` | `normalize-ts-errors.js --check` (multiset, fail-closed, signal capture) — CI success |
| Build gate | `PASS_CI` | `npm run build` exit code 0 + `.next/BUILD_ID` verification — CI success |
| Reproducible install | `PASS_CI` | `npm ci --legacy-peer-deps` on all 3 jobs — CI success |

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
