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
- **Reproduction**: `ls .github/workflows/` returns "No such file or directory" di remote. Workflow file `ci.yml` sudah dibuat lokal di Sprint 8.2S-2 tetapi **TIDAK BISA di-push** karena PAT yang tersedia tidak punya `workflow` scope (GitHub menolak: "refusing to allow a Personal Access Token to create or update workflow without `workflow` scope").
- **Workaround**: Verifikasi lokal manual sebelum push (`npx vitest run src/core && npx tsc --noEmit && npm run build`). File `ci.yml` tersimpan di stash lokal (`git stash list`).
- **Owner**: User (perlu push manual dengan PAT yang punya `workflow` scope, atau push via GitHub Web UI)
- **Target**: Immediate — user action required
- **Closure**: OPEN — blocked on PAT workflow scope

### CI-002 — `package-lock.json` di-gitignore
- **Severity**: P2
- **Area**: ci
- **Reproduction**: `.gitignore` baris `package-lock.json`. Lockfile lokal tidak pernah ter-commit.
- **Workaround**: Konfigurasi `.gitignore` sengaja (maintainer choice untuk flexible patch versions). CI yang akan datang harus pakai `npm install` (bukan `npm ci`) atau un-ignore lockfile.
- **Owner**: Sprint 8.2S-2
- **Target**: Sprint 8.2S-2 (decision: un-ignore atau tetap ignored + dokumentasi)
- **Closure**: OPEN

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

### M-001 — `setAppMode` tidak reset interactive store scores
- **Severity**: P1
- **Area**: mode-lifecycle
- **Reproduction**: Buka project → main kuis → `interactive-store.scores` terisi → switch ke preview → balik ke edit → buka kuis lagi. Scores lama mungkin masih terlihat sesaat sebelum `openPlay` mereset.
- **Workaround**: `interactive-store.openPlay` selalu reset `scores: []`. Tapi state "design mode" setelah closePlay tidak membersihkan scores — bisa terlihat di tab "Skor" bila ada.
- **Owner**: Sprint 8.2S-2 (mode lifecycle smoke)
- **Target**: Sprint 8.2S-2
- **Closure**: OPEN

### M-002 — `setAppMode` tidak reset `learning-media-store.learnSubMode`
- **Severity**: P2
- **Area**: mode-lifecycle
- **Reproduction**: Masuk learn → set sub-mode 'edit' → balik ke edit mode → masuk learn lagi. Sub-mode mungkin masih 'edit' (bukan 'play' default).
- **Workaround**: Tidak ada efek fatal. User bisa toggle manual.
- **Owner**: Sprint 8.2S-2
- **Target**: Sprint 8.2S-2
- **Closure**: OPEN

### M-003 — Keyboard listener & timer cleanup belum diaudit
- **Severity**: P2
- **Area**: mode-lifecycle
- **Reproduction**: Belum ada audit apakah semua `useEffect` yang nge-register `window.addEventListener('keydown', ...)` di PreviewMode/PresentMode/LearningMediaShell dibersihkan saat unmount. Kebocoran listener dapat menyebabkan double-trigger setelah mode switch cepat.
- **Workaround**: Tidak ada. Perlu audit manual + integration test.
- **Owner**: Sprint 8.2S-2
- **Target**: Sprint 8.2S-2
- **Closure**: OPEN (smoke test placeholder; full audit deferred to 8.2B)

### M-004 — `setAppMode('learn')` tidak clearAllSelections (DITEMUKAN 8.2S-2)
- **Severity**: P1
- **Area**: mode-lifecycle
- **Reproduction**: Edit mode → select block → `setAppMode('learn')`. Selection (`selectedBlockId`, `editingBlockId`) LEAKS into Learn mode. Implementasi `setAppMode` di `src/store/canva/session-slice.ts` line 209 hanya `clearAllSelections()` untuk `preview`/`present`, TIDAK untuk `learn`/`export`.
- **Workaround**: Tidak ada. Bug dikonfirmasi via smoke test `mode-lifecycle-smoke.test.ts`.
- **Owner**: Sprint 8.2B (saat wiring Present, perbaiki juga Learn)
- **Target**: Sprint 8.2B
- **Closure**: OPEN — smoke test documents current buggy behavior

### M-005 — `setAppMode('export')` tidak clearAllSelections (DITEMUKAN 8.2S-2)
- **Severity**: P1
- **Area**: mode-lifecycle
- **Reproduction**: Edit mode → select block → `setAppMode('export')`. Selection LEAKS into Export mode. Sama dengan M-004 — `setAppMode` hanya clear untuk preview/present.
- **Workaround**: Tidak ada. Bug dikonfirmasi via smoke test.
- **Owner**: Sprint 8.2C (saat wiring Export, perbaiki juga)
- **Target**: Sprint 8.2C
- **Closure**: OPEN — smoke test documents current buggy behavior

### M-006 — `clearAllSelections()` tidak clear `hoveredBlockId` (DITEMUKAN 8.2S-2)
- **Severity**: P3
- **Area**: mode-lifecycle
- **Reproduction**: Edit mode → hover block → `setAppMode('preview')`. `hoveredBlockId` masih terisi setelah mode switch. Implementasi `clearAllSelections()` di `src/store/canva/session-slice.ts` line 59-69 tidak include `hoveredBlockId` di returned object.
- **Workaround**: Tidak ada efek fatal. Hanya visual hint yang bocor.
- **Owner**: unassigned
- **Target**: Sprint 8.2B (saat touch session-slice untuk M-004/M-005)
- **Closure**: OPEN — smoke test documents current behavior

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
