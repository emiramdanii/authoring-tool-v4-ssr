# STYLE AND DATA AUTHORITY

> Sprint 8.2S-1 — Foundation Checkpoint
>
> Dokumen ini mendefinisikan SINGLE source of truth untuk setiap
> field data di aplikasi. Tujuannya: developer berikutnya tidak
> kembali membaca field lama secara langsung dan menciptakan dual
> authority.
>
> Aturan: bila field diakses untuk operasi yang BUKAN migrasi, harus
> lewat sumber yang didokumentasikan di sini. Akses langsung ke field
> legacy hanya boleh di adapter migrasi.

## Page Content

```text
Authority: page.schema (ScreenSchema)
Legacy:    page.elements[]  (only when page.schema is undefined)
Adapter:   ensurePageSchema(page)  (lazy migration at load time)
```

**Aturan**:
- Bila `page.schema` ada → baca content dari `page.schema.blocks[]`.
- Bila `page.schema` undefined → baca dari `page.elements[]` (legacy mode).
- JANGAN pernah baca keduanya secara paralel — akan menyebabkan dual-render bug.
- `pageMode: 'schema' | 'elements'` adalah discriminator resmi (lihat `validateCanvaPageInvariant`).

## Theme Identity

```text
Authority: page.schema.themeId  (canonical, post-FASE 1)
Legacy:    page.templateData.schemaThemeId  (kept in sync by setSchemaThemeId)
Style Contract: pageStyleTokens.legacyThemeId  (KNOWN legacy id only)
                pageStyleTokens.unrecognizedThemeId  (diagnostic only)
                pageStyleTokens.presetId  (resolved StylePresetId)
```

**Aturan**:
- Untuk TokenResolver construction: pakai `page.schema.themeId` dulu, fallback `page.templateData.schemaThemeId`.
- Untuk Style Contract resolution: pakai `pageStyleTokens.presetId` (hasil adapter `createStyleContractFromPage`).
- Untuk identitas legacy (Sprint 8.2B branch): pakai `pageStyleTokens.legacyThemeId` (KNOWN) atau `pageStyleTokens.unrecognizedThemeId` (diagnostic).
- JANGAN baca `page.templateData.schemaThemeId` langsung di consumer baru — selalu lewat `resolvePageStyleTokens()`.

## Explicit Contract

```text
Authority: page.contractId  (string, optional, persistent field)
Bridge:    preset._legacyContractId  (preset metadata, NOT a replacement)
```

**Aturan**:
- `page.contractId` adalah authority tertinggi untuk visual enforcement.
- `preset._legacyContractId` HANYA metadata — tidak boleh mensintesis `page.contractId` palsu.
- Saat `page.contractId` kosong, auto-golden fallback boleh aktif hanya bila `pageStyleTokens.source === 'legacy-theme'` DAN `shouldUseGoldenLegacyFallback(legacyThemeId)` true.
- Lihat `PageRenderer.tsx` `contractStyle` useMemo.

## Background

```text
Authority (schema page):  page.schema.background  (ScreenSchema.background)
Authority (legacy page):  page.bgColor + page.bgDataUrl + page.overlay
Adapter:                  pageStyleTokens.tokens.page.background  (ResolvedBackground)
Rendered by:              PageFrame (legacy path) | SchemaScreenRenderer (schema path)
```

**Aturan**:
- Schema page: `PageRenderer` meng-merge `pageStyleTokens.tokens.page.background` ke `adaptedSchema.background` (shallow clone, tidak mutasi `page.schema`). SchemaScreenRenderer membaca dari `adaptedSchema.background`.
- Legacy page: `PageFrame` membaca langsung dari `pageStyleTokens.tokens.page.background` (single authority, bukan `page.bgColor` langsung).
- Overlay range: 0-80 (schema scale). Canva 0-100 / DB 0-1 / Schema 0-80 — konversi via `resolveCanvaOverlay` / `resolveDbOverlay` / `resolveSchemaOverlay` di `legacy-style-adapter.ts`.
- Invariant Patch-2: `Canva 40 === DB 0.4 === Schema 40 === 40` (clamp to 80, NOT rescale).

## Navigation

```text
Authority: page.navConfig  (NavConfig)
Fields:    showNavbar, showPrevNext, showScore, showProgress, navbarStyle
navbarStyle: 'colorful' | 'minimal' | 'glass'
Style Contract: pageStyleTokens.tokens.navigation.style  (fallback when navConfig.navbarStyle invalid)
```

**Aturan**:
- Baca `page.navConfig.navbarStyle` dulu.
- Bila invalid (bukan 'colorful'|'minimal'|'glass'), fallback ke `pageStyleTokens.tokens.navigation.style`.
- Bila itu juga invalid, fallback ke `'colorful'` (terminal default).
- Lihat `PageFrame.tsx` `validNavbarStyle` fallback chain.

## Block Style

```text
Authority: schema block fields  (per-block)
  - stylePreset?: string
  - variant?: 'A' | 'B' | 'C'
  - accentColor?: string  (token key or hex)
  - borderColor?: string  (accent hint bila accentColor absent)
  - emphasis?: 'normal' | 'highlight' | 'strong'
Adapter: pageStyleTokens.tokens.block  (ResolvedBlockTokens — page-level hint)
Block preset system: src/core/schema/block-style-presets.ts  (separate, frozen)
```

**Aturan**:
- Page-level `pageStyleTokens.tokens.block` adalah HINT untuk resolver (bukan per-block authority).
- Per-block style baca langsung dari `schema.blocks[i]` (sudah ada system terpisah).
- Adapter `extractBlockStyleFromSchema` mengambil first non-empty value per field dari semua blocks.
- Sprint 8.2A-Patch P0-4: tidak ada early break — field berbeda bisa dari block berbeda.

## Runtime Score

```text
Authority: useInteractiveStore  (Zustand store, ephemeral)
NOT persisted: scores[]  (cleared on closePlay, openPlay, replayAll)
```

**Aturan**:
- Score adalah state runtime, bukan data authoring.
- Jangan simpan score ke `page` atau `schema`.
- Reset score saat: `closePlay`, `openPlay`, mode switch ke preview/present (lihat `MODE_LIFECYCLE_CONTRACT.md` M-001 untuk bug yang diketahui).

## Persistence State

```text
Authority: useDirtyStore  (dirty flag)
Authority: useCanvaStore.persistence  (lastSavedAt, lastSaveError)
Authority: useCanvaStore.pages  (current page state, ephemeral until save)
```

**Aturan**:
- `useDirtyStore.dirty` adalah indikator tunggal "ada perubahan belum tersimpan".
- `useCanvaStore.pages` adalah state kerja (bisa berubah sebelum save).
- Saat save: state `pages` → API → database.
- Saat load: database → API → state `pages` + `migrateAllPages()`.
- Jangan baca `localStorage` langsung — selalu lewat persistence-slice.

## Display Mode (EDU)

```text
Authority: useCanvaStore.displayMode  ('classroom' | 'projector' | 'print' | 'student')
Affects:   TokenResolver construction, font sizes, canvas background
```

**Aturan**:
- Display mode adalah preferensi user, bukan data authoring.
- Tidak dipersist ke page/document — disimpan di session/local storage.
- TokenResolver menerima displayMode di constructor; mengubah output color/size.

## App Mode

```text
Authority: useCanvaStore.appMode  ('edit' | 'preview' | 'present' | 'export' | 'learn')
Setter:    useCanvaStore.setAppMode(mode)
```

**Aturan**:
- App mode adalah state session, bukan data authoring.
- `setAppMode` membersihkan selections saat switch ke preview/present.
- Bug diketahui: tidak reset interactive scores / learnSubMode (lihat `KNOWN_ISSUES.md` M-001, M-002).

## Schema Versioning (DESIGN — belum diimplementasi)

```text
Authority (planned): projectDocument.schemaVersion  (number)
Migration (planned): migrateProjectDocument(document)  (pure, idempotent)
Validation (planned): validateProjectDocument(document)  (fail-closed)
```

**Status**: design doc di `docs/SCHEMA_VERSIONING_DESIGN.md`. Implementasi target Sprint 8.2S-3.

## Export Output (DESIGN — belum diimplementasi)

```text
Authority (planned): ExportContract  (see docs/EXPORT_CONTRACT_DESIGN.md)
Format (planned):    single HTML file | zip | SCORM package
```

**Status**: design doc di `docs/EXPORT_CONTRACT_DESIGN.md`. Implementasi target Sprint 8.2C.

## Aturan Umum

1. **Baca via adapter bila ada**: `resolvePageStyleTokens(page)` lebih baik dari akses langsung `page.templateData.schemaThemeId`.
2. **Jangan tulis ke field legacy**: `page.templateData.schemaThemeId` masih bisa ditulis oleh `setSchemaThemeId` untuk backward compat, tetapi kode baru harus tulis ke `page.schema.themeId`.
3. **Bug dual-authority**: bila dua sumber memberi nilai berbeda, authority yang lebih tinggi menang. Lihat tabel authority di atas.
4. **Migrasi tidak mengubah authority**: adapter `ensurePageSchema` membaca legacy fields untuk migrasi, tetapi hasil migrasi menulis ke authority baru (`page.schema`).
5. **Test authority**: bila ragu, lihat test di `src/core/style/__tests__/page-style-adapter.test.ts` — itu menunjukkan cara baca yang benar.

## Cara Memperbarui Dokumen Ini

- Tambah entry baru saat menambah field baru.
- Update authority saat ada perubahan arsitektur.
- Bila field di-deprecate: tandai dengan `[DEPRECATED]` dan sebutkan penggantinya.
- Jangan hapus entry — tetap sebagai history arsitektur.

Dokumen ini adalah source of truth untuk "di mana field X harus dibaca/ditulis". Bukan "bagaimana cara kerja field X".
