# SYSTEM_CLOSURE MATRIX

> Sprint 8.2S-1 — Foundation Checkpoint
>
> Status per 2026-06-17. Matriks ini menunjukkan tingkat kepastian
> setiap Area × Operasi telah diuji end-to-end. Sel kosong atau
> `NOT TESTED` adalah lubang yang harus ditutup sebelum release.
>
> Status legend:
> - `PASS`        — diuji end-to-end, ada test otomatis, lulus
> - `PARTIAL`     — diuji sebagian, ada celah yang diketahui
> - `NOT TESTED`  — belum ada test otomatis, perlu manual/automated
> - `BLOCKED`     — ada blocker teknis
> - `N/A`         — tidak berlaku

## Matriks Utama

| Area        | Create | Edit | Save | Reload | Preview | Present | Export | Legacy |
| ----------- | -----: | ---: | ---: | -----: | ------: | ------: | -----: | -----: |
| Page        | PASS   | PASS | PASS | PASS   | PASS    | NOT TESTED | NOT TESTED | PARTIAL |
| Block       | PASS   | PASS | PASS | PASS   | PASS    | NOT TESTED | NOT TESTED | PARTIAL |
| Theme       | PARTIAL| PARTIAL| PASS | PASS | PASS    | NOT TESTED | NOT TESTED | PARTIAL |
| Background  | PASS   | PASS | PASS | PASS   | PASS    | NOT TESTED | NOT TESTED | PASS    |
| Navigation  | PASS   | PASS | PASS | PASS   | PASS    | NOT TESTED | NOT TESTED | PASS    |
| Quiz        | PASS   | PASS | PASS | PASS   | PASS    | NOT TESTED | NOT TESTED | PARTIAL |
| Image/audio | PASS   | PASS | PASS | PARTIAL| PASS    | NOT TESTED | NOT TESTED | PARTIAL |
| Import      | PARTIAL| N/A  | PARTIAL| PARTIAL| PARTIAL| NOT TESTED | NOT TESTED | NOT TESTED |
| Schema migration | N/A | N/A | N/A | PARTIAL | N/A | NOT TESTED | NOT TESTED | PARTIAL |
| Style Contract | PASS | PASS | PASS | PASS | PASS    | NOT TESTED | NOT TESTED | PASS    |
| Mode lifecycle  | N/A | N/A | N/A | N/A | PARTIAL | NOT TESTED | NOT TESTED | N/A    |
| Error recovery  | N/A | N/A | N/A | N/A | N/A     | NOT TESTED | NOT TESTED | N/A    |

## Penjelasan per Area

### Page
- **Create/Edit/Save/Reload/Preview**: ✅ PASS — covered by persistence-slice tests + integration test suite
- **Present/Export**: NOT TESTED — Sprint 8.2B/8.2C territory
- **Legacy**: PARTIAL — legacy element-mode pages (`pageMode='elements'`) bekerja untuk render, tetapi belum ada fixture korpus yang memverifikasi round-trip penuh

### Block
- Sama dengan Page untuk operasi inti
- **Legacy**: PARTIAL — `dataIdx` fallback masih ada (lihat `KNOWN_ISSUES.md` BLOCK-001)

### Theme
- **Create/Edit**: PARTIAL — teacher style picker belum ada (Sprint 8.2D), teacher hanya bisa pilih theme via preset authoring
- **Save/Reload/Preview**: PASS — `schemaThemeId` + Style Contract resolveStyleContract teruji
- **Legacy**: PARTIAL — 17 legacy themes ter-mapping, tetapi `unrecognizedThemeId` path baru saja di-hardening (8.2A-Patch P1-hardening)

### Background
- **Legacy**: PASS — Patch-2 invariant (Canva 40 = DB 0.4 = Schema 40 = 40) teruji
- Operasi inti: PASS

### Navigation
- Operasi inti: PASS — `navbarStyle` ('colorful'|'minimal'|'glass') carry-through teruji

### Quiz
- **Legacy**: PARTIAL — `KuisImportPanel` punya 1 TS error (KNOWN_ISSUES QUIZ-001)

### Image/audio
- **Reload**: PARTIAL — belum ada test untuk `bgDataUrl` base64 besar (>1MB) di environment slow network
- **Legacy**: PARTIAL — palette extraction dari bg image masih jalan via `paletteToTokenOverrides` tetapi belum ada fixture korpus

### Import
- **Create**: PARTIAL — import Excel ada, tetapi import project JSON belum lengkap
- **Save/Reload**: PARTIAL — `persistence-slice.ts` punya 2 TS errors (KNOWN_ISSUES PERSIST-001, PERSIST-002)
- **Preview**: PARTIAL — tidak ada integration test import → preview

### Schema migration
- **Reload**: PARTIAL — `migrateAllPages()` jalan di load time, tetapi belum ada versioning field (lihat `docs/SCHEMA_VERSIONING_DESIGN.md`)
- **Legacy**: PARTIAL — overlay elements migration (`_migrationVersion < 1`) ada, tetapi tidak idempotent-tested secara menyeluruh

### Style Contract
- Operasi inti: PASS — 303/303 style tests + 427/427 core tests lulus
- **Present/Export**: NOT TESTED — Sprint 8.2B/8.2C territory

### Mode lifecycle
- **Preview**: PARTIAL — `setAppMode('preview')` clearAllSelections, tetapi tidak reset interactive store scores (lihat `docs/MODE_LIFECYCLE_CONTRACT.md`)
- **Present/Export**: NOT TESTED

### Error recovery
- Semua: NOT TESTED — belum ada UI recovery flow (lihat `KNOWN_ISSUES.md` RECOV-001)

## Lubang Terbesar Sebelum Present (Sprint 8.2B)

Prioritas wajib sebelum 8.2B dimulai:

1. **Present mode wiring belum diuji** — semua kolom Present `NOT TESTED`
2. **Mode lifecycle Preview → Present belum ada contract** — perlu design doc
3. **Interactive store score bocor** antar mode — perlu audit (lihat `MODE_LIFECYCLE_CONTRACT.md` issue M-002)
4. **Tidak ada fixture korpus** untuk Present test — perlu `fixtures/projects/` (lihat commit ini)

## Lubang Terbesar Sebelum Release

1. **Export HTML contract belum dirancang** — lihat `docs/EXPORT_CONTRACT_DESIGN.md`
2. **Schema versioning belum ada** — lihat `docs/SCHEMA_VERSIONING_DESIGN.md`
3. **CI belum ada** — Sprint 8.2S-2 akan tutup
4. **46 pre-existing TS errors** — lihat `KNOWN_ISSUES.md`
5. **Security & accessibility gate belum dijalankan** — Sprint 8.5

## Cara Memperbarui Matriks Ini

- Update matriks setiap sprint yang menutup lubang atau menemukan
  lubang baru.
- Jangan ubah status ke `PASS` tanpa test otomatis yang lulus.
- Jika status `PARTIAL`, sebutkan celah yang diketahui di bagian
  Penjelasan per Area.
- Jika status `BLOCKED`, tambahkan link ke `KNOWN_ISSUES.md` entry
  yang menjelaskan blocker.

Matriks ini adalah source of truth untuk "apa yang sudah benar-benar
teruji" — bukan "apa yang seharusnya jalan menurut kode".
