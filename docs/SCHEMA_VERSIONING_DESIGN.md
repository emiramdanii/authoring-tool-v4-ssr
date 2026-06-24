# SCHEMA VERSIONING DESIGN

> Sprint 8.2S-1 — Design Doc (IMPLEMENTATION: Sprint 8.2S-3)
>
> Status: DESIGN — belum diimplementasi
>
> Tujuan: setiap project document mempunyai `schemaVersion` field
> eksplisit. Migrasi idempotent, fail-closed, dan backup sebelum
> destruktif.

## Latar Belakang

Saat ini banyak field lama dan baru hidup berdampingan:

```text
schemaThemeId      (legacy, di templateData)
themeId            (baru, di schema)
contractId         (persistent page field)
templateVariant    (page-level, A/B/C)
background legacy  (page.bgColor + page.bgDataUrl + page.overlay)
background schema  (page.schema.background)
elements[]         (legacy page content)
schema.blocks[]    (canonical page content)
```

Tanpa versioning, sulit membedakan data lama, data baru, dan data
setengah termigrasi. `migrateAllPages()` mendeteksi kondisi yang
perlu migrasi berdasarkan shape data, tetapi ini rapuh bila ada
shape yang ambigu.

## Proposal

### Field baru

```ts
interface ProjectDocument {
  // ... existing fields ...
  schemaVersion: number;
}
```

### Versi

```text
v1 → legacy elements only (pageMode='elements', no page.schema)
v2 → schema pages (pageMode='schema', page.schema populated)
v3 → style contract (StylePresetId di schema.themeId, page.contractId optional)
v4 → future teacher flow (Sprint 9+)
```

Project document baru mulai di `schemaVersion: 3` (versi terbaru saat ini).

### API

```ts
// Pure, deterministic, idempotent
function migrateProjectDocument(doc: ProjectDocument): ProjectDocument

// Fail-closed: returns Issue[] instead of throwing
function validateProjectDocument(doc: unknown): { ok: boolean; issues: Issue[] }
```

### Acceptance Gate

- ✅ Proyek lama (v1) dapat dibuka
- ✅ Migrasi idempotent: `migrate(migrate(doc)) === migrate(doc)`
- ✅ Migrasi dua kali tidak mengubah hasil
- ✅ Dokumen versi lebih baru tidak dirusak
- ✅ Data invalid fail-closed (returns issues, bukan throw)
- ✅ Backup dibuat sebelum migrasi destruktif
  - Simpan `document._backup = { previousVersion, snapshotAt, snapshot }`
  - Backup dihapus setelah 7 hari atau setelah user konfirmasi

## Strategi Migrasi

### v1 → v2 (legacy elements → schema pages)

Sudah diimplementasi sebagai `migrateAllPages()` di `persistence-slice.ts`.
Akan dipindahkan ke `migrateProjectDocument()` dan ditandai dengan
`schemaVersion: 2` di document.

### v2 → v3 (schema pages → style contract)

Tidak ada perubahan data destruktif. Hanya menandai bahwa style contract
system aktif (StylePresetId di `schema.themeId`).

### v3 → v4 (Sprint 9: teacher flow)

Belum dirancang. Akan ditambahkan saat Sprint 9.

## Test Plan

```text
fixtures/projects/
├── v1-legacy-elements.json      (schemaVersion: 1 atau absent)
├── v2-schema-pages.json         (schemaVersion: 2)
├── v3-style-contract.json       (schemaVersion: 3)
├── malformed-project.json       (invalid JSON shape)
└── future-version-project.json  (schemaVersion: 99 — must fail-closed)
```

Test:
```ts
describe('migrateProjectDocument', () => {
  it('v1 → v3: legacy elements promoted to schema', () => {})
  it('v2 → v3: no destructive change', () => {})
  it('v3 → v3: idempotent (no change)', () => {})
  it('v99 (future): fail-closed with issues, not throw', () => {})
  it('malformed: fail-closed with issues', () => {})
  it('backup created before destructive migration', () => {})
  it('migrate(migrate(doc)) === migrate(doc)', () => {})
})
```

## Batasan

- Migrasi tidak boleh menyentuh database langsung — pure function.
- Migrasi tidak boleh baca Zustand store.
- Migrasi tidak boleh akses DOM.
- Backup disimpan di document itself (`_backup` field), bukan di
  database terpisah. Field `_backup` di-strip saat save normal,
  tetapi dipertahankan saat save setelah migrasi.

## Status Implementasi

```text
Sprint 8.2S-1: DESIGN doc (ini)
Sprint 8.2S-3: implementasi + test + fixture corpus v1/v2/v3
Sprint 8.5:    audit semua saved document punya schemaVersion
```

## Referensi

- `KNOWN_ISSUES.md` SCHEMA-001
- `STYLE_AND_DATA_AUTHORITY.md` "Schema Versioning"
- `src/store/canva/persistence-slice.ts` `migrateAllPages` (existing impl)
- `src/core/schema/ensure-schema.ts` `ensurePageSchema` (per-page lazy migration)
