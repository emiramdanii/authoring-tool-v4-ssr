# SILSE_SOURCE_OF_TRUTH — Authority Map

**Generated**: 2026-06-25
**HEAD**: `b2927b5`

---

## Principle

Each piece of data has exactly ONE source of truth. All other locations are READ-ONLY projections or caches. Writes go to the source, projections follow.

---

## 1. Page Content (blocks, title, badges, meta)

```
SOURCE OF TRUTH:
  canvaStore.pages[N].schema.blocks[]

READ-ONLY PROJECTIONS:
  authoringStore.meta (judulPertemuan, mapel, kelas, durasi, ikon, namaBab)
    ← deriveProjectionFromPages() via projection sync (debounced)
    ← Merge: { ...existingMeta, ...projection.meta } (preserves metadata-only fields)

WRITE PATHS:
  updateSchemaBlock(blockId, patch) → canvaStore.pages[currentPageIndex].schema.blocks
  applyMetadataToCoverBlocks(meta) → canvaStore.pages (ALL pages, immutable patch)
  addSchemaBlock(type) → canvaStore.pages[currentPageIndex].schema.blocks
  deleteBlock(blockId) → canvaStore.pages[currentPageIndex].schema.blocks
```

**Authority**: `canvaStore.pages[].schema.blocks` is the single source. `authoringStore.meta` is a derived projection for schema-backed fields. Metadata-only fields (namaGuru, namaSekolah, semester, tahunAjaran, kurikulum) are stored in `authoringStore.meta` as the source (they have no schema representation).

---

## 2. Page Theme / Style

```
SOURCE OF TRUTH:
  page.schema.themeId (canonical)
  page.templateData.schemaThemeId (legacy bridge, kept in sync)

WRITE PATHS:
  applyStyleGlobal(presetId) → sets BOTH schema.themeId AND templateData.schemaThemeId
  applyTemplateToStore() → sets both fields to finalThemeId

READ PATHS:
  resolvePageStyleTokens(page) → reads schema.themeId || templateData.schemaThemeId
  TokenResolver (bridged from ResolvedStyleTokens)
  Block renderers read via TokenResolver API

CONTRACT OVERRIDE:
  page.contractId (if set) → resolveContractStyle() OVERRIDES token values
  Priority: contractStyle > styleTokens > block defaults
```

**Authority**: `page.schema.themeId` is canonical. `templateData.schemaThemeId` is a legacy bridge kept in sync. Contract (`page.contractId`) overrides visual enforcement.

---

## 3. Metadata (namaGuru, namaSekolah, semester, tahunAjaran, kurikulum)

```
SOURCE OF TRUTH:
  authoringStore.meta (for metadata-only fields not in schema)

COVER PROJECTION:
  cover.title ← judulPertemuan (via applyMetadataToCoverBlocks)
  cover.subtitle ← mapel (via applyMetadataToCoverBlocks)
  cover.meta.kelas ← kelas (via applyMetadataToCoverBlocks)
  cover.badges ← namaGuru, namaSekolah, judulPertemuan (upsert/remove)

WRITE PATH:
  MetadataFormV5 → applyMetadataToCoverBlocks(meta)
    1. updateMeta(key, value) → authoringStore.meta + notifyMutation()
    2. Patch cover blocks in canvaStore.pages (ALL pages, immutable)
    3. _pushHistory() + useCanvaStore.setState({ pages: newPages })

SAVE PATH:
  executeDurableSave → authoringStore.saveToStorage() → localStorage
  buildSyncPayload → meta: { title, subject, grade, semester, teacherName, schoolName }

LOAD PATH:
  StoreInit → authoringStore.loadFromStorage()
    → hasOwnProperty-based pick() (preserves empty strings)
  loadFromDB → authoringData.meta → restore metadata-only fields

PROJECTION SYNC:
  deriveCoverToProjection reads cover.title/subtitle/meta.kelas
    → projection.meta.judulPertemuan/mapel/kelas
  Merge: { ...existingMeta, ...projection.meta } (metadata-only fields preserved)
```

**Authority**: `authoringStore.meta` is the source for metadata-only fields. `cover.title/subtitle/meta.kelas/badges` are projections (also in schema). Both are saved. On load, metadata-only fields come from `authoringStore.meta`, schema-backed fields come from projection sync.

---

## 4. Navigation State (currentPageIndex, appMode)

```
SOURCE OF TRUTH:
  canvaStore.currentPageIndex (which page is active)
  ProductShell view state (dashboard/template/editor/preview/export) — NOT in store

WRITE PATHS:
  goPage(index) → canvaStore.currentPageIndex
  ProductShell setView() → local React state (not persisted)

NOTE: ProductShell view is NOT persisted. On reload, always starts at 'dashboard'.
  DashboardV5 "Lanjut Edit" button → setView('editor') if pages.length > 0.
```

**Authority**: `canvaStore.currentPageIndex` is persisted. `ProductShell.view` is transient (React state, not persisted).

---

## 5. Save Status (dirty, saving, saved, error)

```
SOURCE OF TRUTH:
  dirtyStore.dirty (boolean)
  dirtyStore.editRevision (number, increments on every mutation)
  canvaStore._saveStatus ('saved' | 'saving' | 'unsaved' | 'error')
  canvaStore._lastSavedAt (timestamp)

WRITE PATHS:
  notifyMutation() → dirtyStore.markDirty() → editRevision++ + dirty=true
  executeDurableSave() → _saveStatus = 'saving' → 'saved' (or 'error')
  HIDE_SAVED_MS (3s) → _saveStatus auto-reverts to 'unsaved'

UI DISPLAY:
  CleanEditorV5 reads _saveStatus + _lastSavedAt
  If _saveStatus='unsaved' but _lastSavedAt > 0 → shows "Tersimpan" (green)
  If _saveStatus='unsaved' and _lastSavedAt = 0 → shows "Belum simpan" (gray)
```

**Authority**: `dirtyStore` owns the dirty/clean state machine. `canvaStore._saveStatus` is the UI-facing display state. `authoringStore.dirty` is a legacy flag (not the primary driver).

---

## 6. Export Data

```
SOURCE OF TRUTH (at export time):
  useCanvaStore.getState().pages (full page schemas)
  useAuthoringStore.getState().meta (metadata)
  useAuthoringStore.getState() (kuis, modules, games, cp, tp, atp, etc.)

EXPORT PIPELINE:
  useViteExport.exportHTML()
    → POST /api/export { pages, ratioId, meta, allKuis, ... }
    → /api/export injects into Vite template
    → Returns standalone HTML file

EXPORTED HTML RUNTIME:
  window.__EXPORT_DATA__ (injected by API)
  → entry-client.tsx pre-populates stores
  → ExportApp renders PageRenderer mode="export"
  → NO save/load — read-only student experience
```

**Authority**: At export time, `canvaStore.pages` + `authoringStore` are the source. The exported HTML is a frozen snapshot — no writes, no save, no load.

---

## 7. Undo / Redo (History)

```
SOURCE OF TRUTH:
  canvaStore._history (array of page snapshots)
  canvaStore._historyIndex (current position)

WRITE PATHS:
  _pushHistory() → saves current pages snapshot before mutation
  updateSchemaBlock() → calls _pushHistory() internally
  applyMetadataToCoverBlocks() → calls _pushHistory() before setState()

NOTE: Direct useCanvaStore.setState() WITHOUT _pushHistory() bypasses undo.
  Only applyMetadataToCoverBlocks does this (fixed in P3-1 to call _pushHistory).
```

**Authority**: `canvaStore._history` is the undo stack. All mutations MUST call `_pushHistory()` before changing pages.

---

## 8. Schema Migration

```
SOURCE OF TRUTH:
  SCHEMA_VERSION = 2 (in src/core/schema/validation.ts)
  MIGRATION_CHAIN: v0→v1 (block IDs + hints), v1→v2 (cover/hero layout)

MIGRATION PATH:
  migrateSchema(schema) → applies migrations sequentially
  Warnings deduplicated via WARNED_SCHEMA_IDS Set (V5-P3-FIX)

NOTE: Template schemas are stored as v0. Migration runs on every render
  but is pure (returns new schema). Warnings only logged once per schema ID.
```

**Authority**: `SCHEMA_VERSION` + `MIGRATION_CHAIN` are the migration authority. Templates store v0 schemas; runtime migrates to v2 on read.

---

## Summary: Authority Matrix

| Data | Source of Truth | Projections | Write Path |
|---|---|---|---|
| Page blocks | `canvaStore.pages[].schema.blocks` | `authoringStore` (via projection sync) | `updateSchemaBlock`, `addSchemaBlock`, `applyMetadataToCoverBlocks` |
| Theme/style | `page.schema.themeId` | `TokenResolver`, `ResolvedStyleTokens` | `applyStyleGlobal`, `applyTemplateToStore` |
| Contract | `page.contractId` | `ContractResolvedStyle` (overrides tokens) | Template apply (auto) |
| Metadata-only | `authoringStore.meta` | `cover.title/subtitle/badges/meta.kelas` | `updateMeta` (via `applyMetadataToCoverBlocks`) |
| Navigation | `canvaStore.currentPageIndex` | — | `goPage()` |
| View state | `ProductShell.view` (React state) | — | `setView()` (not persisted) |
| Save status | `dirtyStore` + `canvaStore._saveStatus` | UI label in CleanEditorV5 | `notifyMutation`, `executeDurableSave` |
| Undo history | `canvaStore._history` | — | `_pushHistory()` before mutation |
| Schema version | `SCHEMA_VERSION` (constant) | — | `migrateSchema()` (pure, read-only) |
