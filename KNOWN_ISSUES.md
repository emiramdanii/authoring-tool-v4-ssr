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

### CI-001 — Tidak ada CI workflow
- **Severity**: P1
- **Area**: ci
- **Reproduction**: `ls .github/workflows/` returns "No such file or directory" di remote. Workflow file `ci.yml` sudah dibuat dan direvisi (Patch-4: single source of truth `normalize-ts-errors.js --check`), tetapi **TIDAK BISA di-push** karena PAT yang tersedia tidak punya `workflow` scope.
- **Workaround**: Verifikasi lokal: `npx vitest run` + `node scripts/normalize-ts-errors.js --check` + `npm run build`. File `ci.yml` + `package-lock.json` + `.gitignore` update tersimpan di stash lokal.
- **Owner**: User (perlu push manual dengan PAT workflow scope, atau via GitHub Web UI)
- **Target**: Immediate — user action required
- **Closure**: OPEN — blocked on PAT workflow scope
- **User action**:
  1. Buat PAT baru di https://github.com/settings/tokens dengan scope `repo` + `workflow`.
  2. `git stash pop`
  3. `git add .gitignore .github/workflows/ci.yml package-lock.json`
  4. `git commit -m "ci: add reproducible exact-sha quality gates"`
  5. `git push origin main`
  6. Atau: push via GitHub Web UI.
- **CI workflow design (Patch-4 final)**:
  - 3 jobs: test (vitest run), types (node scripts/normalize-ts-errors.js --check), build (npm run build + artifact verify)
  - `npm ci` (reproducible install)
  - TypeScript gate: SINGLE source of truth = `normalize-ts-errors.js --check` (no inline shell logic)
  - Normalizer: spawnSync + signal capture + process.execPath + multiset + fail-closed baseline
  - Build: exit code 0 + .next/standalone artifact verification

### CI-002 — `package-lock.json` di-gitignore (POLICY REVERSED — pending push)
- **Severity**: P2
- **Area**: ci
- **Reproduction**: `.gitignore` baris `package-lock.json`. Lockfile lokal tidak pernah ter-commit. Sprint 8.2S-2-Patch membalik kebijakan ini: lockfile WAJIB di-commit untuk `npm ci` reproducible install. Update `.gitignore` (hapus `package-lock.json`) + `package-lock.json` itself sudah di-stash lokal, menunggu push bersama CI workflow (CI-001).
- **Workaround**: Konfigurasi `.gitignore` lama (lockfile ignored) masih aktif di remote sampai stash di-push. CI yang akan datang harus pakai `npm install` (bukan `npm ci`) sampai lockfile ter-commit.
- **Owner**: User (push stash dengan PAT workflow scope)
- **Target**: Immediate — bersama CI-001
- **Closure**: OPEN — stash siap push, blocked on PAT workflow scope

### BUILD-001 — `cp: cannot create directory '.next/standalone/.next/static'`
- **Severity**: P2
- **Area**: build
- **Reproduction**: `npm run build` berakhir dengan error `cp: cannot create directory '.next/standalone/.next/static': No such file or directory` karena `next build` tidak menghasilkan `.next/standalone/` (output config issue di `next.config`).
- **Workaround**: Build inti sukses; hanya langkah `cp` standalone yang gagal. Untuk dev/test, abaikan.
- **Owner**: unassigned
- **Target**: Sprint 8.5 (release prep)
- **Closure**: OPEN

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
- **Owner**: unassigned (per kategori)
- **Target**: Sprint 8.5 (release prep)
- **Closure**: OPEN

### BUILD-003 — `@dnd-kit/*` dependency hilang
- **Severity**: P2
- **Area**: deps
- **Reproduction**: `src/features/canvas/components/SortableCanvas.tsx` meng-import `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` tetapi package tidak ada di `package.json`.
- **Workaround**: `SortableCanvas` tidak di-import di mana pun (dead code) — tidak ada efek runtime. Bisa dihapus atau dependencies ditambahkan.
- **Owner**: unassigned
- **Target**: Sprint 8.5
- **Closure**: OPEN

---

## Persistence

### PERSIST-001 — `persistence-slice.ts` line 243 & 456 TS errors
- **Severity**: P2
- **Area**: persistence
- **Reproduction**: `npx tsc --noEmit src/store/canva/persistence-slice.ts` error "Type '{ schema?: ScreenSchema | null | undefined; }[]' is not assignable to parameter of type 'CanvaPage[]'" — partial type hydration menghasilkan tipe yang tidak kompatibel dengan `CanvaPage`.
- **Workaround**: Vitest transformasi esbuild mengabaikan type error; runtime aman karena validasi `ensurePageSchema` menangani field hilang.
- **Owner**: unassigned
- **Target**: Sprint 8.5
- **Closure**: OPEN

### PERSIST-002 — Idempotensi migrasi belum teruji menyeluruh
- **Severity**: P1
- **Area**: persistence
- **Reproduction**: `migrateAllPages()` dipanggil saat load. Tidak ada test yang memverifikasi migrate(docs) === migrate(migrate(docs)) untuk semua skenario migrasi (`_migrationVersion < 1` overlay merge, `templateData.schemaScreen → page.schema` promotion, dll).
- **Workaround**: Manual test saja. Tidak ada bug yang terlihat, tetapi tidak ada guarantee.
- **Owner**: Sprint 8.2S-3 (schema versioning)
- **Target**: Sprint 8.2S-3
- **Closure**: OPEN

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
- **Owner**: unassigned
- **Target**: Sprint 8.5
- **Closure**: OPEN

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
- **Owner**: Sprint 8.5 (release prep)
- **Target**: Sprint 8.5
- **Closure**: OPEN

### RECOV-002 — Autosave failure tidak ada telemetry
- **Severity**: P2
- **Area**: error-recovery
- **Reproduction**: `flushDurableSave` retry sampai clean, tetapi bila semua retry gagal, error hanya di-log. Tidak ada notification UI yang persisten.
- **Workaround**: User harus cek console atau indikator dirty.
- **Owner**: Sprint 8.5
- **Target**: Sprint 8.5
- **Closure**: OPEN

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
- **Owner**: Sprint 8.5 (security gate)
- **Target**: Sprint 8.5
- **Closure**: OPEN

### SEC-003 — File upload size/type belum dibatasi
- **Severity**: P2
- **Area**: security
- **Reproduction**: Image uploader (`src/components/authoring/konten/ImageUploader.tsx`) belum diperiksa apakah ada limit size dan whitelist type.
- **Workaround**: Browser memory akan jadi bottleneck natural, tetapi tidak ada proteksi aktif.
- **Owner**: Sprint 8.5
- **Target**: Sprint 8.5
- **Closure**: OPEN

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
- **Owner**: Sprint 8.5
- **Target**: Sprint 8.5
- **Closure**: OPEN

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
- **Owner**: Sprint 8.2S-3
- **Target**: Sprint 8.2S-3
- **Closure**: OPEN — design doc di `docs/SCHEMA_VERSIONING_DESIGN.md`

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
- **Closure**: OPEN — design doc di `docs/EXPORT_CONTRACT_DESIGN.md`

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
