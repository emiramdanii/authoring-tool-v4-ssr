# Fixture Corpus

> Sprint 8.2S-1 — Golden fixtures untuk test save/load, migration,
> Canvas, Preview, Present, Export, screenshot, performance, recovery.
>
> Setiap file di direktori ini adalah project document lengkap yang
> bisa di-load oleh `loadProjectFromDocument()`. Jangan ubah fixture
> yang sudah ada — tambah fixture baru bila butuh skenario baru.

## Daftar Fixture

| File | Skenario | schemaVersion | pageMode | themeId | contractId |
|---|---|---|---|---|---|
| `golden-pertemuan.json` | Project lengkap dengan 14 page pertemuan, contract explicit | 3 (planned) | schema | (legacy golden-presentation) | `golden-pertemuan` |
| `macam-norma-legacy.json` | Legacy project dengan schemaThemeId='macam-norma' (PPKn domain) | 1 | elements | macam-norma | (none) |
| `fresh-mission-adventure.json` | Project baru, preset mission-adventure, no legacy | 3 | schema | mission-adventure | (none) |
| `mixed-elements-schema.json` | Project campuran: page 1 elements, page 2 schema | 2 | mixed | academic-clean | (none) |
| `image-background-large.json` | Page dengan bg image base64 (~500KB) + overlay 40 | 3 | schema | academic-clean | (none) |
| `malformed-project.json` | JSON invalid (untuk test fail-closed) | n/a | n/a | n/a | n/a |

## Cara Pakai

```ts
import goldenPertemuan from '@/fixtures/projects/golden-pertemuan.json'

it('load golden-pertemuan', () => {
  const result = loadProjectFromDocument(goldenPertemuan)
  expect(result.ok).toBe(true)
})
```

## Aturan

1. **Jangan edit fixture yang sudah ada** — itu akan membatalkan
   semua test yang bergantung padanya. Buat fixture baru dengan nama
   berbeda bila butuh skenario variasi.
2. **Fixture harus representatif** — bukan data buatan yang terlalu
   ideal. Sertakan edge case yang realistis (field kosong, data
   legacy, gambar besar, dll).
3. **Setiap fixture harus punya `schemaVersion` field** (setelah
   implementasi 8.2S-3). Sampai itu, fixture v1-v3 ditandai via
   shape data.
4. **Jangan sertakan data sensitif** (token, password, email asli).
5. **Gambar base64 boleh** tetapi batasi <100KB per fixture (kecuali
   `image-background-large.json` yang sengaja ~500KB).

## Fixture yang Belum Ada (target Sprint 8.2S-3+)

- `interactive-quiz.json` — kuis kompleks dengan 10+ soal
- `fifty-page-project.json` — project besar untuk performance test
- `previous-version-project.json` — document dengan `schemaVersion: 1` (untuk test migrasi)
- `future-version-project.json` — document dengan `schemaVersion: 99` (untuk test fail-closed)
- `v1-legacy-elements.json` — pure v1 (no schema, only elements)
- `v2-schema-pages.json` — pure v2 (schema, no StyleContract preset)
- `v3-style-contract.json` — pure v3 (schema + StylePresetId)

## Status Implementasi

```text
Sprint 8.2S-1: 6 fixture awal (commit ini)
Sprint 8.2S-3: migration test fixtures (v1/v2/v3/future)
Sprint 8.4:    performance fixture (fifty-page-project)
Sprint 8.5:    security & a11y fixtures
```

## Referensi

- `docs/SCHEMA_VERSIONING_DESIGN.md` — schemaVersion field
- `docs/EXPORT_CONTRACT_DESIGN.md` — export test fixtures
- `docs/MODE_LIFECYCLE_CONTRACT.md` — mode lifecycle test fixtures
- `SYSTEM_CLOSURE_MATRIX.md` — area yang belum teruji
- `KNOWN_ISSUES.md` — issue yang perlu fixture untuk reproduksi
