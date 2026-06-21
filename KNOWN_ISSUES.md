# KNOWN ISSUES

> Sprint 8.2S-1 — Known Issues Ledger
>
> Daftar jujur semua issue teknis yang diketahui. Setiap item harus
> punya: ID, severity, area, reproduksi, workaround, owner, target
> sprint, dan closure evidence.
>
> Severity:
> - `P0` — blocker, harus selesai sebelum sprint berikutnya
> - `P1` — penting, harus selesai sebelum release
> - `P2` — hygiene, boleh ditunda sampai cleanup sprint
> - `P3` — cosmetic / minor

## Format

```text
ID:           <AREA>-<NNN>
Title:        <judul singkat>
Severity:     P0|P1|P2|P3
Area:         <page|block|theme|persistence|build|ci|security|a11y|...>
Reproduction: <langkah reproduksi atau referensi file:line>
Workaround:   <cara menghindari atau "none">
Owner:        <unassigned | Sprint X.Y>
Target:       <Sprint X.Y | Release>
Closure:      <commit SHA + tanggal | OPEN>
```

---

## CI / Build

### CI-001 — Tidak ada CI workflow (CLOSED)
- **Severity**: P1
- **Area**: ci
- **Reproduction**: `.github/workflows/ci.yml` now exists in remote with 3 jobs (test, types, build).
- **Workaround**: Tidak ada (CI active).
- **Owner**: Sprint 8.2S-2-Patch-4
- **Target**: Sprint 8.2S-2-Patch-4
- **Closure**: CLOSED — CI workflow active in remote. Exact-SHA CI run `27736541608` on SHA `fe7eee27572a030cbf3335fbe03c790ae1a9519c` — all 3 jobs `success`. Workflow uses `npm ci` (reproducible install), `normalize-ts-errors.js --check` (single source of truth TypeScript gate), and `npm run build` (exit code 0 + `.next/BUILD_ID` verification).

### CI-002 — `package-lock.json` di-gitignore (CLOSED)
- **Severity**: P2
- **Area**: ci
- **Reproduction**: `.gitignore` no longer ignores `package-lock.json`. Lockfile is committed (15162 lines). CI uses `npm ci --legacy-peer-deps` for reproducible install.
- **Workaround**: Tidak ada (lockfile tracked).
- **Owner**: Sprint 8.2S-2-Patch-4
- **Target**: Sprint 8.2S-2-Patch-4
- **Closure**: CLOSED — `package-lock.json` committed in remote. `.gitignore` updated to un-ignore lockfile + `.github/workflows/`. CI `npm ci` succeeds on all 3 jobs.

### BUILD-001 — `cp: cannot create directory '.next/standalone/.next/static'` (CLOSED)
- **Severity**: P2
- **Area**: build
- **Reproduction**: Build script previously included `shx cp -r .next/static .next/standalone/.next/static` which failed because `output: 'standalone'` is disabled in `next.config.ts`.
- **Workaround**: Tidak ada (build script fixed).
- **Owner**: Sprint 8.2S-2-Patch-5
- **Target**: Sprint 8.2S-2-Patch-5
- **Closure**: CLOSED — Build script split: `build:app` (vite build + next build, no cp steps), `build` delegates to `build:app`. Standalone cp steps removed. CI build gate uses `npm run build` (exit code 0 required) + `.next/BUILD_ID` verification. No grep tolerance. CI run `27736541608` confirms build success.

### BUILD-002 — 46 pre-existing TypeScript errors
- **Severity**: P2
- **Area**: types
- **Reproduction**: `npx tsc --noEmit` menghasilkan 46 error di file-file berikut:
  - `src/components/ui/*.tsx` (14 file shadcn/ui components, kebanyakan TS1117 duplicate property)
  - `src/components/canva/right-panel/block-properties/{KuisImportPanel,RodaImportPanel,SortirImportPanel}.tsx` (3 file)
  - `src/core/schema/{guided-patch,primary-edit-target}.ts` (6 errors)
  - `src/core/template/{CourseTemplateRegistry,health-check/auto-repair,visual-audit/visual-parity-check}.ts` (7 errors)
  - `src/features/canvas/components/SortableCanvas.tsx` (3 errors — missing `@dnd-kit/*` deps)
  - `src/lib/db.ts` (3 errors — Prisma null vs undefined)
  - `src/presets/ppkn/pancasila-golden-schema.ts` (2 errors — enum mismatch)
  - `src/store/{authoring/index,canva/persistence-slice,canva/schema-crud-slice}.ts` (4 errors)
  - `src/core/schema/__tests__/primary-edit-target.test.ts` (2 errors)
- **Workaround**: `npm run build` skip type-check (`next build` tidak validate types). Tests via vitest berjalan normal karena vitest pakai transformasi esbuild.
- **Owner**: Sprint 8.6B
- **Target**: Sprint 8.6B
- **Closure**: CLOSED — Sprint 8.6B. `npx tsc --noEmit` now returns **0 errors** (was 63 occurrences / 48 signatures). All errors fixed via:
  - Dead-code removal: 14 unused shadcn/ui components + SortableCanvas.tsx + OverflowDialog.deprecated.tsx + 2 dead generate-quiz scripts deleted (20 errors eliminated)
  - Type guards + adapters: `?? null` coalescing, `as unknown` casts, `extends Record<string, unknown>` for ImportPatch types
  - Enum alignment: added `'evaluasi'` to `learningPhase` union; aligned `UpdateSchemaBlockOptions.source` with PatchSource union
  - Generic migration helper: `migrateAllSchemas<T>` preserves CanvaPage[] (closes PERSIST-001)
  - Missing fields: added `logger.info()` method, `openAIAssistant` stub, `games: []` initial state, `defaultValue?: string` to GuidedFieldDef
  - Duplicate property: removed duplicate `'materi-blok'` key in guided-patch.ts
  - Script typing: early-continue guard for `screen.nav`, partial→full CanvaPage cast, `?? ''` coalescing for `page.textContent()`
  - Baseline reset: `scripts/ts-baseline.txt` now 0 signatures / 0 occurrences. Any new TS error will be flagged immediately by the gate.
  - CI run `27841199162` on SHA `f01a7143` — 3/3 jobs success (Test, TypeScript gate, Build).

### BUILD-003 — `@dnd-kit/*` dependency hilang
- **Severity**: P2
- **Area**: deps
- **Reproduction**: `src/features/canvas/components/SortableCanvas.tsx` meng-import `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` tetapi package tidak ada di `package.json`.
- **Workaround**: `SortableCanvas` tidak di-import di mana pun (dead code) — tidak ada efek runtime. Bisa dihapus atau dependencies ditambahkan.
- **Owner**: Sprint 8.6B
- **Target**: Sprint 8.6B
- **Closure**: CLOSED — Sprint 8.6B. `SortableCanvas.tsx` deleted (was 0 imports, dead code). No @dnd-kit dependency needed.

---

## Persistence

### PERSIST-001 — `persistence-slice.ts` line 243 & 456 TS errors
- **Severity**: P2
- **Area**: persistence
- **Reproduction**: `npx tsc --noEmit src/store/canva/persistence-slice.ts` error "Type '{ schema?: ScreenSchema | null | undefined; }[]' is not assignable to parameter of type 'CanvaPage[]'" — partial type hydration menghasilkan tipe yang tidak kompatibel dengan `CanvaPage`.
- **Workaround**: Vitest transformasi esbuild mengabaikan type error; runtime aman karena validasi `ensurePageSchema` menangani field hilang.
- **Owner**: Sprint 8.6B
- **Target**: Sprint 8.6B
- **Closure**: CLOSED — Sprint 8.6B. `migrateAllSchemas` in `src/core/schema/schema-migration.ts` is now generic `<T extends { schema?: ScreenSchema | null }>` so it preserves `CanvaPage[]` through the migration chain instead of widening to `Array<{ schema?: ScreenSchema | null }>`. No cast needed at the hydration boundary in `persistence-slice.ts`. Both line 243 + 458 errors eliminated.

### PERSIST-002 — Idempotensi migrasi belum teruji menyeluruh
- **Severity**: P1
- **Area**: persistence
- **Reproduction**: `migrateAllPages()` dipanggil saat load. Tidak ada test yang memverifikasi migrate(docs) === migrate(migrate(docs)) untuk semua skenario migrasi (`_migrationVersion < 1` overlay merge, `templateData.schemaScreen → page.schema` promotion, dll).
- **Workaround**: Manual test saja. Tidak ada bug yang terlihat, tetapi tidak ada guarantee.
- **Owner**: Sprint 9.0A
- **Target**: Sprint 9.0A
- **Closure**: CLOSED — Sprint 9.0A. 34 idempotency tests in `src/__tests__/migration-idempotency.test.ts` verify: migrate(migrate(doc)) === migrate(doc) for legacy/current/hotspot/extra-fields docs, real fixtures (5), per-page schema migration (migrateSchema), migrateAllSchemas, triple migration stability, invalid/minimal doc handling. No bugs found — migration is idempotent. CI run on SHA to be verified after push.

---

## Block / Schema

### BLOCK-001 — `dataIdx` fallback masih ada
- **Severity**: P3
- **Area**: block
- **Reproduction**: `CanvaElement.dataIdx` (deprecated, lihat `src/components/canva/types.ts` line 42) masih dipakai oleh `module-resolver.ts`, `sync-slice.ts`, `element-slice.ts`, `GameWidget`, `QuizWidget`, `BlockRenderer`, `ElementProperties`, `canva-constants.ts`.
- **Workaround**: `moduleId`/`kuisId` UUID lebih disukai; `dataIdx` hanya fallback. Safe to keep, tidak ada incorrect behavior.
- **Owner**: unassigned (long-term cleanup)
- **Target**: Post-9.0
- **Closure**: OPEN

### QUIZ-001 — KuisImportPanel / RodaImportPanel / SortirImportPanel TS errors
- **Severity**: P3
- **Area**: quiz
- **Reproduction**: 3 file di `src/components/canva/right-panel/block-properties/` punya TS errors di sekitar baris 73-75. Kemungkinan signature mismatch dengan import shape dari Excel parser.
- **Workaround**: Vitest berjalan. UI berfungsi manual.
- **Owner**: Sprint 8.6B
- **Target**: Sprint 8.6B
- **Closure**: CLOSED — Sprint 8.6B. The 3 ImportPatch types (KuisImportPatch, RodaImportPatch, SortirImportPatch) now extend `Record<string, unknown>`, satisfying `applyGuidedSchemaPatch`'s `patch` param type. `npx tsc --noEmit` returns 0 errors for these files.

---

## Mode Lifecycle

### M-001 — `setAppMode` tidak reset interactive store scores (FIXED)
- **Severity**: P1
- **Area**: mode-lifecycle
- **Reproduction**: Buka project → main kuis → `interactive-store.scores` terisi → switch ke preview → balik ke edit → buka kuis lagi. Scores lama mungkin masih terlihat sesaat sebelum `openPlay` mereset.
- **Workaround**: Tidak ada (pre-fix).
- **Owner**: Sprint 8.2S-2-Patch
- **Target**: Sprint 8.2S-2-Patch
- **Closure**: FIXED in 8.2S-2-Patch — `resetCrossStoreStateForMode()` in `src/store/canva/mode-orchestrator.ts` calls `useInteractiveStore.resetAllScores()` on Edit/Export/Present entry. Verified by `src/__tests__/mode-lifecycle-smoke.test.ts` M-001 (FIXED) tests.

### M-002 — `setAppMode` tidak reset `learning-media-store.learnSubMode` (FIXED)
- **Severity**: P2
- **Area**: mode-lifecycle
- **Reproduction**: Masuk learn → set sub-mode 'edit' → balik ke edit mode → masuk learn lagi. Sub-mode mungkin masih 'edit' (bukan 'play' default).
- **Workaround**: Tidak ada (pre-fix).
- **Owner**: Sprint 8.2S-2-Patch
- **Target**: Sprint 8.2S-2-Patch
- **Closure**: FIXED in 8.2S-2-Patch — `resetCrossStoreStateForMode()` calls `useLearningMediaStore.setLearnSubMode('play')` on Learn entry. Verified by `src/__tests__/mode-lifecycle-smoke.test.ts` M-002 (FIXED) test.

### M-003 — Keyboard listener & timer cleanup (CLOSED — Sprint 8.2S-2-Patch-3)
- **Severity**: P2
- **Area**: mode-lifecycle
- **Reproduction**: Listener cleanup audit per komponen.
- **Workaround**: Tidak ada (pre-fix).
- **Owner**: Sprint 8.2S-2-Patch-3
- **Target**: Sprint 8.2S-2-Patch-3
- **Closure**: CLOSED in 8.2S-2-Patch-3 — all sub-areas now PASS_LOCAL:
  - Window listeners: PASS_LOCAL (4 komponen)
  - Document listeners: PASS_LOCAL (4 komponen)
  - ResizeObserver.disconnect: PASS_LOCAL (PreviewMode, PresentMode)
  - fullscreenchange: PASS_LOCAL (PreviewMode)
  - setTimeout cleanup: PASS_LOCAL (M-007 FIXED — zero pending after unmount)
  - setInterval cleanup: PASS_LOCAL (no intervals used)
  - LearningMediaShell: PASS_LOCAL (added in Patch-2)
  Evidence: `src/__tests__/listener-cleanup-integration.test.tsx` (19 tests, commit 8.2S-2-Patch-3)

### M-007 — setTimeout timer leak on unmount (FIXED — Sprint 8.2S-2-Patch-3)
- **Severity**: P1
- **Area**: mode-lifecycle
- **Reproduction**: Render PreviewMode/PresentMode/LearningMediaShell, then unmount. Pending setTimeout timers remain.
- **Root cause** (identified in Patch-3): jsdom's `Storage.setItem` calls `setTimeout(... 0)` internally to dispatch storage events. Zustand persist middleware triggered this via `replayAll` → `set()` → persist → `localStorage.setItem`. In production (real browser), `localStorage.setItem` is synchronous and doesn't use setTimeout — so this leak was test-environment only.
- **Fix**: Replace jsdom's localStorage with a synchronous Map-based mock in listener-cleanup tests. Also switched interactive-store's persist storage to synchronous custom storage (no zustand debounce).
- **Workaround**: Tidak ada (pre-fix).
- **Owner**: Sprint 8.2S-2-Patch-3
- **Target**: Sprint 8.2S-2-Patch-3
- **Closure**: FIXED in 8.2S-2-Patch-3 — zero pending timers after unmount for PreviewMode, PresentMode, LearningMediaShell, PlayOverlay. Rapid 5x render/unmount also zero (no accumulation). Verified by `src/__tests__/listener-cleanup-integration.test.tsx` M-007 (FIXED) tests.

### M-004 — `setAppMode('learn')` tidak clearAllSelections (FIXED)
- **Severity**: P1
- **Area**: mode-lifecycle
- **Reproduction**: Edit mode → select block → `setAppMode('learn')`. Selection (`selectedBlockId`, `editingBlockId`) LEAKS into Learn mode.
- **Workaround**: Tidak ada (pre-fix).
- **Owner**: Sprint 8.2S-2-Patch
- **Target**: Sprint 8.2S-2-Patch
- **Closure**: FIXED in 8.2S-2-Patch — `setAppMode` in `src/store/canva/session-slice.ts` now calls `clearAllSelections()` for ALL non-edit modes (preview/present/learn/export). Verified by `src/__tests__/mode-lifecycle-smoke.test.ts` M-004 (FIXED) test.

### M-005 — `setAppMode('export')` tidak clearAllSelections (FIXED)
- **Severity**: P1
- **Area**: mode-lifecycle
- **Reproduction**: Edit mode → select block → `setAppMode('export')`. Selection LEAKS into Export mode.
- **Workaround**: Tidak ada (pre-fix).
- **Owner**: Sprint 8.2S-2-Patch
- **Target**: Sprint 8.2S-2-Patch
- **Closure**: FIXED in 8.2S-2-Patch — same fix as M-004 (clearAllSelections for all non-edit modes). Verified by `src/__tests__/mode-lifecycle-smoke.test.ts` M-005 (FIXED) test.

### M-006 — `clearAllSelections()` tidak clear `hoveredBlockId` (FIXED)
- **Severity**: P3
- **Area**: mode-lifecycle
- **Reproduction**: Edit mode → hover block → `setAppMode('preview')`. `hoveredBlockId` masih terisi setelah mode switch.
- **Workaround**: Tidak ada (pre-fix).
- **Owner**: Sprint 8.2S-2-Patch
- **Target**: Sprint 8.2S-2-Patch
- **Closure**: FIXED in 8.2S-2-Patch — `clearAllSelections()` in `src/store/canva/session-slice.ts` now includes `hoveredBlockId: null` in returned object. Verified by `src/__tests__/mode-lifecycle-smoke.test.ts` "selection is cleared when entering Preview (including hoveredBlockId)" test.

---

## Error Recovery

### RECOV-001 — Tidak ada UI recovery flow
- **Severity**: P1
- **Area**: error-recovery
- **Reproduction**: Saat save gagal, project load gagal, atau schema invalid, aplikasi hanya menampilkan console error. Tidak ada UI untuk retry / restore last successful save / download backup JSON.
- **Workaround**: User bisa manual export JSON lewat Import/Export dialog bila masih bisa buka project. Bila tidak, data hilang.
- **Owner**: Sprint 8.5A
- **Target**: Sprint 8.5A
- **Closure**: CLOSED — Sprint 8.5A. `BootRecoveryOrchestrator.run()` wired to `RecoveryDialog` via `AuthoringTool` boot effect. Dialog has 4 reason branches (boot-report > emergency > crash > auto-save), a11y basics (role=dialog, aria-modal, focus trap, Esc/backdrop handling). `clearRecoveryKeys()` helper is single source of truth for "Mulai Baru". 38 recovery tests (12 bridge + 11 safe-boot + 8 a11y + 7 regression). CI run `27825766751` — 3/3 jobs success.

### RECOV-002 — Autosave failure tidak ada telemetry
- **Severity**: P2
- **Area**: error-recovery
- **Reproduction**: `flushDurableSave` retry sampai clean, tetapi bila semua retry gagal, error hanya di-log. Tidak ada notification UI yang persisten.
- **Workaround**: User harus cek console atau indikator dirty.
- **Owner**: Sprint 9.0B
- **Target**: Sprint 9.0B
- **Closure**: CLOSED — Sprint 9.0B (final: 9.0B-Patch-1). Created `src/lib/autosave-telemetry.ts` with `recordAutosaveFailure(reason, error)`, `getAutosaveTelemetry()`, `clearAutosaveTelemetry()`. Wired into `saveToStorage()` in `persistence-slice.ts`: failures record telemetry with reason classification (quota-exceeded, serialization-error, stack-overflow, storage-unavailable, unknown); successes clear telemetry.
  - **9.0B (initial)**: 18 tests in `src/__tests__/autosave-telemetry.test.ts` verify telemetry helper contract: recording, read-only snapshot, clear after success, multiple failures increment, no crash on null/undefined/circular, integration pattern (fail → retry → success). Senior review 9.0B: TECHNICAL IMPLEMENTATION PASS / CI VERIFIED / TEST GAP — RC1 (tests mocked canva-store entirely, never exercised real `saveToStorage()` failure path) + RC2 (dirty-store `saveFailed()` never tested against real store).
  - **9.0B-Patch-1 (closes RC1+RC2)**: 12 new tests in `src/__tests__/autosave-persistence-real.test.ts` exercise the REAL `useCanvaStore.saveToStorage()` end-to-end: (a) `localStorage.setItem` throws `DOMException('QuotaExceededError')` → telemetry records `quota-exceeded` + `_saveStatus='error'`; (b) `TypeError` → `serialization-error`; (c) `RangeError` → `stack-overflow` AND corrupted localStorage entry cleared; (d) generic `Error` → `unknown`; (e) after failure, successful `saveToStorage()` clears telemetry + writes localStorage; (f) multiple consecutive failures increment `errorCount`; (g) mixed failure reasons classified correctly across calls; (h) successful save with no prior failure leaves telemetry clean. Plus 4 tests against the REAL `useDirtyStore` (loaded via `vi.importActual` to bypass the canva-store mock): `saveFailed('msg')` keeps `dirty=true`, `saveStatus='error'`, `lastError='msg'`, `savingRevision=null`, `editRevision` unchanged; `saveSucceeded()` matching revision clears dirty (proves failure path is NOT a false-clean); `clearError()` on still-dirty store keeps `dirty=true`.

---

## Security

### SEC-001 — PAT pernah ter-expose di chat
- **Severity**: P0 (resolusi pengingat)
- **Area**: security
- **Reproduction**: Token `ghp_u0MBD...2xmU` ditempel di pesan user awal. Tidak ada cara verifikasi apakah sudah di-revoke.
- **Workaround**: User harus revoke di https://github.com/settings/tokens. Tidak boleh pakai token ter-expose lagi.
- **Owner**: User (action required)
- **Target**: Immediate
- **Closure**: PENDING USER ACTION — token revoke tidak bisa diverifikasi dari sisi repo

### SEC-002 — Sanitization rich content belum diaudit
- **Severity**: P1
- **Area**: security
- **Reproduction**: Authoring tool menerima text dari guru yang akhirnya dirender ke HTML. Belum ada audit apakah ada XSS vector via:
  - inline editable text
  - rich content (jika ada)
  - URL gambar eksternal (`javascript:` URL)
  - SVG upload
  - iframe/embed (bila ada module yang pakai)
- **Workaround**: React secara default escape text content. Tapi `dangerouslySetInnerHTML` bila dipakai perlu audit.
- **Owner**: Sprint 8.5B / 8.5C → 9.0C (final)
- **Target**: Sprint 9.0C
- **Closure**: CLOSED — Sprint 9.0C (Export Security & dangerouslySetInnerHTML Audit).
  - **Sprint 8.5B/8.5C (initial)**: Security headers middleware (7 headers on all responses) + no-stack-leak fix for export/scorm routes (8.5B) + `/api/upload` route with MIME validation + magic-byte verification + SVG upload blocked for stored-XSS prevention (8.5C-Patch-1). React default escaping handles inline text.
  - **Sprint 9.0C (final)**: Full audit of all `dangerouslySetInnerHTML` (8 file mentions → 2 real sinks: `DefBoxRenderer.tsx:114` + `InlineTextEditor.tsx:155`; 6 mentions are comments/tests/static-trusted) + all `innerHTML =` (4 in export scripts.ts, all either clearing or pre-sanitized server-side) + all unescaped `${...}` template-literal interpolations in `src/lib/export/{block,navigation}-renderers.ts` (18 user-controlled icon/emoji fields found).
  - **Sink inventory** (full table in worklog 9.0C): All user-controlled raw HTML sinks now sanitized. Trusted/internal sinks (JSON-LD in `app/layout.tsx`, shadcn chart `<style>`, `serializeForHtmlScript` frozen boundary) explicitly documented as trusted.
  - **New single-source sanitizer**: `src/lib/sanitize.ts` exports `sanitizeHtmlForRender()`, `sanitizeIconOrEmoji()`, `sanitizeUrl()`, `escapeHtml()`. No new dependencies (no DOMPurify, no sanitize-html — per sprint scope). Hardened over previous `RichText.tsx#sanitizeHtml` which had gaps around `src=javascript:`, `<object>/<embed>/<svg>`, the `style` attribute, and whitespace-prefixed `java\tscript:` tricks. `RichText.tsx#sanitizeHtml` now re-exports `sanitizeHtmlForRender` for backward compatibility.
  - **Wiring**: 18 icon/emoji interpolations across `block-renderers.ts` (cover, petunjuk, nc-grid, nk-card, ftab, materi-section ×3 variants, tujuan-display, motivasi, rangkuman, penutup, tabel-accord, timeline, compare ×2, checklist ×2, statistik, studi ×2, hero, materi-blok) and `navigation-renderers.ts` (skenario charEmoji + choice icon) now route through `sanitizeIconOrEmoji()`.
  - **Tests**: 86 new tests in `src/__tests__/export-security-9.0c.test.ts`: (A) `sanitizeIconOrEmoji` helper contract (14 tests); (B) `sanitizeHtmlForRender` client-side sink hardening (16 tests, including `<script>` strip, `<img onerror>` strip, `<a javascript:>` strip, `<strong onclick>` attr strip, `<span style>` attr strip, `<iframe>/<object>/<embed>/<svg>` strip, comment strip, math `<` preservation, backward-compat re-export); (C) `sanitizeUrl` URL-scheme sanitization (19 tests, including `java\tscript:` and `Java\nScript:` tricks); (D) export block-renderers end-to-end XSS prevention (24 tests — one per block-type/sink combination, covering `<script>`, `<img onerror>`, `javascript:` URL payloads); (E) normal content still renders correctly (7 tests). Plus updated `hotspot-contract-guards.test.ts` (1 test adjusted: `<br/>` → `<br>` HTML5 normalization).
  - **Acceptance**: All 12 acceptance criteria met. tsc 0 errors, normalize 0 sigs, build OK, CI 3/3.

### SEC-003 — File upload size/type belum dibatasi
- **Severity**: P2
- **Area**: security
- **Reproduction**: Image uploader (`src/components/authoring/konten/ImageUploader.tsx`) belum diperiksa apakah ada limit size dan whitelist type.
- **Workaround**: Browser memory akan jadi bottleneck natural, tetapi tidak ada proteksi aktif.
- **Owner**: Sprint 8.5C
- **Target**: Sprint 8.5C
- **Closure**: CLOSED — Sprint 8.5C. `/api/upload` route created with: 4 allowed MIME types (jpeg/png/gif/webp), 5MB max size, magic-byte verification for all allowed types, SVG upload blocked (8.5C-Patch-1 — stored-XSS prevention). Content-addressed storage (SHA-256 filename) prevents path traversal. 14 upload tests + 7 media reload tests. CI run `27835293255` — 3/3 jobs success.

---

## Accessibility

### A11Y-001 — Audit accessibility belum pernah dilakukan
- **Severity**: P1
- **Area**: a11y
- **Reproduction**: Belum ada test atau audit untuk:
  - keyboard navigation semua fungsi
  - focus visible
  - modal focus trap
  - Escape bekerja di semua modal
  - tombol label (aria-label)
 - kontras cukup (WCAG AA)
  - reduced motion support
  - screen reader labels untuk navigation dan quiz
- **Workaround**: Tidak ada. A11Y yang ditunda sampai akhir biasanya mahal karena menyentuh seluruh komponen.
- **Owner**: Sprint 8.5A / 8.5B
- **Target**: Sprint 8.5A / 8.5B
- **Closure**: PARTIAL — Sprint 8.5A/8.5B. A11y smoke tests added: SkipNavLink (href, sr-only, keyboard-focusable), A11yProvider (reducedMotion/highContrast context), useGameA11y hook (ariaLabel, progressAria, liveAria, instructionId), RecoveryDialog (role=dialog, aria-modal, aria-labelledby, aria-describedby, Tab focus trap, Esc/backdrop handling). 12 a11y-smoke tests + 8 recovery-dialog-a11y tests. Full axe-core audit (Playwright + axe integration) still needed — deferred to Sprint 4 (final QA).

---

## Performance

### PERF-001 — Belum ada performance baseline
- **Severity**: P2
- **Area**: performance
- **Reproduction**: Tidak ada test untuk project besar (50 halaman, 10-20 block per halaman, 50 gambar). Belum ada ukuran untuk:
  - waktu membuka proyek
  - waktu pindah halaman
  - waktu save
  - waktu reload
  - konsumsi memori
  - jumlah render
  - waktu export
  - ukuran HTML hasil export
- **Workaround**: Tidak ada. Perlu fixture `fixtures/projects/fifty-page-project.json`.
- **Owner**: Sprint 8.4
- **Target**: Sprint 8.4
- **Closure**: OPEN

---

## Schema Versioning

### SCHEMA-001 — Tidak ada `schemaVersion` field di project document
- **Severity**: P1
- **Area**: schema
- **Reproduction**: Project document di database tidak punya field versi. Migrasi saat ini pakai flag per-page (`_migrationVersion`) tetapi tidak ada versi document-level.
- **Workaround**: `migrateAllPages()` mendeteksi kondisi yang perlu migrasi berdasarkan shape data, bukan versi. Ini rapuh bila ada shape yang ambigu.
- **Owner**: Sprint 8.6A
- **Target**: Sprint 8.6A
- **Closure**: CLOSED — Sprint 8.6A. `CURRENT_PROJECT_SCHEMA_VERSION = 1` implemented in `src/core/schema/project-schema-versioning.ts`. Export JSON writes `schemaVersion: 1` at top level (both Dashboard.tsx + use-export-actions.ts paths). Import JSON gates through `migrateProjectDocument()` BEFORE any store mutation — legacy (no schemaVersion) migrates to current, future version rejected safely, malformed rejected safely. ScreenSchema.version compatibility bug also fixed (`isSchemaVersionCompatible` now accepts v2=current). 82 tests (58 project-schema-versioning + 24 schema-versioning-import-export). CI run `27837399563` — 3/3 jobs success.

---

## Export

### EXPORT-001 — Export HTML contract belum dirancang
- **Severity**: P1
- **Area**: export
- **Reproduction**: Tidak ada keputusan tentang:
  - HTML standalone atau tidak?
  - font embedded atau fallback?
  - gambar data URL atau file terpisah?
  - boleh external CDN atau harus offline?
  - audio/video bagaimana?
  - ukuran maksimum?
  - browser target?
  - service worker boleh atau tidak?
- **Workaround**: Tidak ada. Keputusan terlambat dapat merombak renderer dan asset pipeline.
- **Owner**: Sprint 8.2C (design frozen sebelum implementasi)
- **Target**: Sprint 8.2C
- **Closure**: CLOSED — Sprint 8.2C. Export HTML contract implemented: POST `/api/export` generates standalone HTML via Vite SSR template, `ExportApp.tsx` chrome wired to resolved style tokens, consumer smoke tests (10 tests) verify ExportApp → PageRenderer mode="export" → resolvePageStyleTokens + bridge. GET `/api/projects/[id]/export` PARTIAL (contractId not in Prisma Page model — falls back to legacy-theme → preset bridge). 7 token boundary tests + 10 consumer smoke tests. CI run `27776715138` — 3/3 jobs success.

---

## Cara Memperbarui Ledger Ini

- Setiap sprint WAJIB menambahkan issue baru yang ditemukan.
- Issue yang ditutup: isi `Closure` dengan commit SHA + tanggal.
- Jangan hapus issue yang ditutup — tetap sebagai history.
- Jangan ubah severity setelah issue ditutup (kecuali retro).
- Pindahkan issue yang sudah lama `OPEN` ke sprint berikutnya bila
  masih relevan.

Ledger ini adalah source of truth untuk "apa yang kita TAHU belum
selesai". Bukan "apa yang kita RENCANAKAN selesai".
