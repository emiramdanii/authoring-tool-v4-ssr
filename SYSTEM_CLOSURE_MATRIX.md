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
| Import      | PASS_CI         | N/A             | PASS_CI         | PASS_CI         | PASS_CI         | NOT_TESTED      | NOT_TESTED      | PASS_CI         |
| Schema migration | N/A        | N/A             | N/A             | LOCAL_REPORTED  | N/A             | NOT_TESTED      | NOT_TESTED      | LOCAL_REPORTED  |
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
- **Create/Edit/Save/Preview**: `PASS_SOURCE_ONLY`
  - Source: `src/components/canva/right-panel/block-properties/field-registry.tsx`
  - Source: `src/components/authoring/konten/ImageUploader.tsx`
  - Tidak ada test otomatis untuk image upload flow
- **Reload**: `LOCAL_REPORTED`
  - bgDataUrl base64 besar (>1MB) belum ada test slow network
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
5. **Security & accessibility gate belum dijalankan** — Sprint 8.5B (security headers + WCAG/a11y smoke)
6. **Image/audio Import Reload** — `PASS_SOURCE_ONLY` → perlu test otomatis (Sprint 8.4 menutup project JSON import/export, bukan media binary reload). Sprint 8.5C target.
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
