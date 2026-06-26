# SILSE_SOURCE_MAP — Route & Dependency Map

**Generated**: 2026-06-25
**HEAD**: `b2927b5` (V5 Metadata FINAL, all P1/P2/P3 closed)
**Audit mode**: READ-ONLY

---

## 1. Runtime Entry Point

```
src/app/page.tsx
  ├─ BootLoadingFallback (8s timeout → recovery screen)
  ├─ AppBootErrorBoundary (catches runtime/chunk errors)
  └─ dynamic import → ProductShell (ssr: false)
       │
       ├─ ProjectProvider (wraps children, provides useProjectManager)
       ├─ CanvaAutoSaveSync (wires useAutoSave → canva + authoring + dirty store)
       │
       ├─ view='dashboard'  → DashboardV5
       ├─ view='template'   → TemplatePickerV5
       ├─ view='editor'     → CleanEditorV5
       ├─ view='preview'    → PreviewV5
       └─ view='export'     → ExportPanelV5
```

**Guard**: `npm run guard:no-legacy-runtime` — 328 files in runtime graph, 0 legacy symbols.

---

## 2. Editor Route (Canvas Mode)

```
CleanEditorV5
  ├─ Top bar: Back + Info (MetadataFormV5) + Style (WorkspaceStyleMenu) + Preview + Export
  ├─ WorkspaceSceneList (page list, nav, empty state)
  ├─ WorkspaceCanvasStage
  │    └─ PageRenderer mode="canvas"
  │         ├─ resolvePageStyleTokens(page) → ResolvedStyleTokens
  │         ├─ TokenResolver (bridged from ResolvedStyleTokens)
  │         ├─ SchemaScreenRenderer (scene-driven layout)
  │         │    └─ SchemaBlockRenderer per block
  │         │         └─ Block renderers (DefBoxRenderer, RefleksiRenderer, etc.)
  │         └─ ScreenAdapter (canvas mode: NOT used — raw SchemaScreenRenderer only)
  ├─ WorkspaceInspector (schema-driven fields via inspector-field-registry)
  └─ WorkspaceContentPalette (Tambah Halaman + Tambah Blok via portal menus)
```

**Key files**:
- `src/components/product-v5/CleanEditorV5.tsx`
- `src/components/canva/mpi-workspace-v2/WorkspaceCanvasStage.tsx`
- `src/components/canva/page-renderer/PageRenderer.tsx`
- `src/core/renderer/SchemaRenderer.tsx`
- `src/core/scene/SceneLayoutEngine.ts`

---

## 3. Preview Route

```
PreviewV5
  ├─ Top bar: Back to editor + page nav + Export
  ├─ Page nav strip (1. Cover, 2. Petunjuk, ...)
  └─ PageRenderer mode="preview"
       ├─ resolvePageStyleTokens(page) → same as canvas
       ├─ ScreenAdapter system (wraps SchemaScreenRenderer with ScreenShell)
       │    └─ ScreenShell (chrome: progress, section label, nav hint)
       │         └─ hideCompletionBadge={mode === 'preview'} (no "Selesaikan dulu")
       └─ SchemaScreenRenderer (same renderer as canvas)
```

**Key difference from canvas**: ScreenAdapter + ScreenShell active. No editing overlays. Kuis interaktif.

---

## 4. Export Route

```
ExportPanelV5
  └─ useExportActions().exportHtml()
       └─ useViteExport().exportHTML()
            ├─ Reads: useCanvaStore.getState().pages + useAuthoringStore.getState().meta
            ├─ POST /api/export
            │    ├─ Zod validation (exportRequestSchema)
            │    ├─ ensureDevTemplate() (freshness check → rebuild if stale)
            │    ├─ serializeForHtmlScript(exportData) → OWASP-safe JSON
            │    ├─ Inject: <script>window.__EXPORT_DATA__=...</script>
            │    ├─ Title: meta.judulPertemuan | meta.mapel meta.kelas
            │    └─ Return: HTML file (Content-Disposition: attachment)
            └─ Browser downloads .html file

Exported HTML file:
  ├─ <div id="root"></div>
  ├─ <script type="module"> (Vite-built bundle, 1.9MB)
  ├─ <script>window.__EXPORT_DATA__=...</script> (injected data)
  └─ entry-client.tsx
       ├─ Reads window.__EXPORT_DATA__
       ├─ Pre-populates: useCanvaStore, useAuthoringStore, useInteractiveStore
       ├─ createRoot(#root).render(<ExportErrorBoundary><ExportApp /></ExportErrorBoundary>)
       └─ ExportApp
            ├─ ExportTopNavbar (title, progress, score)
            ├─ PageRenderer mode="export"
            │    └─ ScreenAdapter + ScreenShell (with completion badges for student)
            └─ ExportBottomNav (prev/next, lock, page dots)
```

**Key files**:
- `src/components/product-v5/ExportPanelV5.tsx`
- `src/lib/use-vite-export.ts`
- `src/app/api/export/route.ts`
- `src/export/entry-client.tsx`
- `src/export/ExportApp.tsx`
- `vite.export.config.ts`

---

## 5. Template Apply Route

```
TemplatePickerV5
  └─ applyTemplateToStore(templateId, { metadata, persist: 'localstorage' })
       ├─ createProjectFromTemplate(templateId, metadata)
       │    ├─ Golden template fast path (PPKn → createPpknNormaGoldenProject)
       │    └─ Preset-backed path (createDefaultSchemaForTemplateType)
       ├─ Apply theme: finalThemeId → schema.themeId + templateData.schemaThemeId
       ├─ useCanvaStore.setState({ pages, currentPageIndex: 0 })
       ├─ useAuthoringStore.updateMeta('judulPertemuan', metadata.title)
       ├─ useDirtyStore.markDirty()
       └─ useCanvaStore.saveToStorage() + useAuthoringStore.saveToStorage()
```

**Key files**:
- `src/components/product-v5/TemplatePickerV5.tsx`
- `src/core/template/apply-template-to-store.ts`
- `src/core/template/CourseTemplateRegistry.ts`
- `src/core/schema/schema-factory.ts`
- `src/presets/ppkn/norma-golden-schema.ts`

---

## 6. Style Resolution Route

```
WorkspaceStyleMenu
  └─ applyStyleGlobal(presetId)
       └─ useCanvaStore.setState({ pages: pages.map(p → { schema.themeId: presetId, templateData.schemaThemeId: presetId }) })

PageRenderer (every render):
  ├─ resolvePageStyleTokens(page)
  │    ├─ Read: page.schema.themeId || page.templateData.schemaThemeId
  │    ├→ resolvePresetTokens(themeId) → DesignTokens
  │    ├→ If contractId: resolveContractStyle(contractId, templateType, variant)
  │    └→ Return: ResolvedStyleTokens (colors, typography, shape, spacing, navigation, background, block)
  ├─ TokenResolver (bridged from ResolvedStyleTokens via applyResolvedStyleTokensToTokenResolver)
  └─ Block renderers read tokens via TokenResolver API

Projection sync (debounced, canva store change → authoring store):
  ├─ deriveProjectionFromPages(pages)
  │    └─ deriveCoverToProjection: reads cover.title/subtitle/meta.kelas → projection.meta
  └─ Merge: { ...existingMeta, ...projection.meta } (preserves metadata-only fields)
```

**Key files**:
- `src/components/canva/mpi-workspace-v2/WorkspaceStyleMenu.tsx`
- `src/core/style/consumer.ts` (resolvePageStyleTokens)
- `src/core/style/defaults.ts` (DEFAULT_PRESET_ID)
- `src/core/style/resolve-style-contract.ts`
- `src/core/template/contract.ts` (resolveContractStyle)
- `src/core/schema/schema-projection.ts` (deriveProjectionFromPages)

---

## 7. Save / Load Route

```
Auto-save chain:
  useAutoSave (CanvaAutoSaveSync)
    ├─ Subscribe: canvaStore (pages, currentPageIndex)
    ├─ Subscribe: authoringStore (meta) — V5 metadata-only changes
    └─ Subscribe: dirtyStore (editRevision)
         └─ scheduleAutoSave (2s debounce)
              └─ executeDurableSave
                   ├─ dirtyStore.startSaving()
                   ├─ canvaStore.saveToStorage() → localStorage
                   ├─ authoringStore.saveToStorage() → localStorage
                   ├─ If projectId + dbSaveFn: await dbSaveFn() → POST /api/projects/[id]/save
                   └─ dirtyStore.saveSucceeded() → canvaStore._saveStatus = 'saved'

Boot load:
  StoreInit
    ├─ canvaStore.loadFromStorage() → localStorage → pages, ratioId, themeId
    ├─ authoringStore.loadFromStorage() → localStorage → meta (merged with projection)
    └─ initCanvaStoreSubscriptions() → projection sync, auto-save, etc.

DB load:
  canvaStore.loadFromDB(data)
    ├─ Parse + migrate pages (schema migration v0→v1→v2)
    ├─ Parse authoringData
    ├─ canvaStore.setState({ pages, currentPageIndex: 0 })
    └─ authoringStore.setState({ meta: restoredMeta, cp, atp, ... })
```

**Key files**:
- `src/hooks/use-auto-save.ts`
- `src/lib/save-utils.ts` (executeDurableSave, buildSyncPayload)
- `src/store/canva/persistence-slice.ts` (saveToStorage, loadFromStorage, loadFromDB)
- `src/store/authoring/system-slice.ts` (saveToStorage, loadFromStorage)
- `src/components/providers/StoreInit.tsx`

---

## 8. Metadata Route (V5)

```
MetadataFormV5 (portal modal)
  └─ handleSave()
       └─ applyMetadataToCoverBlocks({ all 7 fields })
            ├─ Step 1: updateMeta(key, value) for each field
            │    └─ notifyMutation() (per field if changed + explicit call after loop)
            ├─ Step 2: Patch ALL cover blocks across ALL pages
            │    ├─ judulPertemuan → cover.title (clear if empty)
            │    ├─ mapel → cover.subtitle (clear if empty)
            │    ├─ kelas → cover.meta.kelas (clear if empty)
            │    ├─ namaGuru → badge upsert/remove
            │    ├─ namaSekolah → badge upsert/remove
            │    └─ judulPertemuan → badge upsert/remove (📚)
            ├─ _pushHistory() (for undo/redo)
            └─ useCanvaStore.setState({ pages: newPages })
```

**Key files**:
- `src/components/product-v5/MetadataFormV5.tsx`
- `src/components/product-v5/apply-metadata.ts`
- `src/store/authoring/meta-slice.ts` (updateMeta + notifyMutation + equality guard)

---

## 9. Dead Code Candidates (NOT in runtime import graph)

These files exist in repo but are NOT imported by `src/app/page.tsx` → `ProductShell` → V5 components. The guard confirms 0 legacy symbols in the runtime graph.

| Category | Path | Files | Status |
|---|---|---|---|
| Old editor | `src/components/canva/CanvaBuilder.tsx` | 1 (354 lines) | QUARANTINE — only imported by AuthoringTool (legacy) |
| Legacy entry | `src/components/authoring/AuthoringTool.tsx` | 1 (697 lines) | NOT imported by page.tsx (replaced by ProductShell) |
| Old MPI editor | `src/components/canva/mpi-editor/` | 8 files | Only imported by CanvaBuilder (quarantined) |
| Old right panel | `src/components/canva/right-panel/` | 18 files | Only imported by CanvaBuilder (quarantined) |
| Old stage | `src/components/canva/stage/` | 7 files | Only imported by CanvaBuilder (quarantined) |
| Old toolbar | `src/components/canva/toolbar/` (non-use-export-actions) | ~15 files | use-export-actions.ts IS used by V5. Others are legacy. |
| Recovery dialogs | `src/components/shared/AutoSaveRecovery.tsx` | 1 (155 lines) | Returns null (disabled in V5) |
| Recovery dialogs | `src/components/shared/CrashRecoveryDialog.tsx` | 1 (293 lines) | NOT imported by runtime |
| Recovery dialogs | `src/components/shared/RecoveryDialog.tsx` | 1 (710 lines) | Only imported by AuthoringTool (legacy) |
| Legacy export | `src/lib/export/html-templates.ts` | 1 | Only imported by tests |
| Legacy export | `src/lib/export/utils.ts` | 1 | Only imported by html-templates |
| Legacy export | `src/lib/client-export.ts` | 1 | NOT imported by runtime |
| Legacy shortcuts | `src/core/shortcuts/` | ~5 files | Only imported by AuthoringTool (legacy) |
| Legacy hooks | `src/hooks/use-teacher-mode.ts` etc. | ~10 files | Only imported by AuthoringTool (legacy) |

**Total dead code estimate**: ~80-100 files, ~10,000+ lines. All safe to move to `src/legacy-disabled/` in a future cleanup batch.

---

## 10. API Routes (Runtime)

| Route | Method | Purpose | Used by |
|---|---|---|---|
| `/api/export` | POST | Generate standalone HTML | ExportPanelV5 → useViteExport |
| `/api/projects` | GET | List projects | (legacy, not in V5 flow) |
| `/api/projects/[id]` | GET | Load project from DB | (legacy, not in V5 flow) |
| `/api/projects/[id]/save` | POST | Save project to DB | executeDurableSave (if projectId) |
| `/api/projects/[id]/export` | GET | Export project from DB | (legacy, not in V5 flow) |
| `/api/templates` | GET | List templates | (legacy, not in V5 flow) |
| `/api/upload` | POST | Upload image | (legacy, not in V5 flow) |
| `/api/ai/lesson` | POST | AI lesson generation | (legacy, not in V5 flow) |
| `/api/ai/refine` | POST | AI content refinement | (legacy, not in V5 flow) |

**V5 runtime only uses**: `/api/export` (POST) + `/api/projects/[id]/save` (POST, if project loaded from DB).
