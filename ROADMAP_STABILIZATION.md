# ROADMAP STABILISASI SILSE

## Status: FASE 1 COMPLETED | FASE 2-3 PENDING

---

## ARSITEKTUR SINGLE SOURCE OF TRUTH

```
page.schema.blocks[]  ← THE single source of truth
       │
       ├─→ Renderer (SchemaScreenRenderer)
       │     └─→ resolveSceneLayout() → ResolvedBlockPosition[]
       │           └─→ MeasuredBlock → SchemaBlockRenderer → SceneRegistry[block.type]
       │
       ├─→ EditorProjectionStore (DERIVED — write-through from schema)
       │     └─→ Konten panel reads/writes via immutable schema ops
       │
       ├─→ Export pipeline (Vite SSR)
       │     └─→ Reads schema.background, schema.nav, schema.blocks
       │
       └─→ Persistence (localStorage + DB)
             └─→ Saves schema as JSON, derives on load via migrateAllPages()
```

## STATE CATEGORIZATION

| Category | Location | Persisted | Undoable | Example |
|----------|----------|-----------|----------|---------|
| Document | page.schema | YES | YES | blocks, background, nav |
| Document (legacy) | page.bgColor, page.navConfig | YES | YES | kept for backward compat |
| UI | store: leftTab, zoom, tool | NO | NO | panel state, tool selection |
| Session | store: selectedBlockId, hoveredBlockId | NO | NO | selection, hover, editing |
| Runtime | compressedHeightCache | NO | NO | measurement results |
| Transient | dragState, entranceBlockIds | NO | NO | drag preview, animations |

---

## DUALISM AUDIT RESULTS (FASE 1)

### RESOLVED DUALISM (FIXED)

| ID | Dualism | Fix | Status |
|----|---------|-----|--------|
| D1 | bgColor vs schema.background | setBgColor/setBgImage/setOverlay sync both | DONE |
| D2 | schemaThemeId vs schema.background.themeId | setSchemaThemeId writes to schema only | DONE |
| D3 | page.navConfig vs schema.nav | updateNavConfig syncs both | DONE |
| D5 | page.templateVariant vs block.variant | block.variant is canonical, page.templateVariant is derived | DONE |
| D6 | page.templateType vs schema.templateType | setTemplateType syncs both | DONE |
| D7 | isSchemaPage() defined in 2 places with divergent logic | Consolidated to single source in ensure-schema.ts | DONE |
| D8 | loadFromDB bgColor default '#ffffff' (white canvas) | Changed to PRIMITIVES.color.canvasBg (dark) | DONE |
| — | Canvas putih bug | Dark default + dark fallback in SchemaRenderer + TokenResolver light-mode detection | DONE |
| — | Cover overflow to top | isPureCoverPage discriminator + relative positioning for mixed layouts | DONE |
| — | Immer patches error | enablePatches() at store creation | DONE |
| — | deepFreeze crash | deepClone-before-freeze pattern | DONE |
| — | Blocks not appearing | Fixed via enablePatches + schema-first mutation path | DONE |

### TOLERATED DUALISM (Documented, Will Remove in Future Phase)

| ID | Dualism | Why Tolerated | Removal Path |
|----|---------|---------------|--------------|
| D9 | page.bgColor / bgDataUrl / overlay | Backward compat — migration reads these fields | After all users re-save, these become redundant |
| D10 | page.navConfig | Same as D9 — kept for compat during transition | Same — after schema is canonical for all users |
| D11 | page.templateData | Legacy field — ensurePageSchema Path 2 still reads it | Remove after TemplateAdapter Path 3 is dead |
| D12 | page.templateVariant | Derived cache — block.variant is canonical | Remove after all consumers read from block.variant |
| D13 | EditorProjectionStore | Documented as PROJECTION — one-way flow from schema | Gradual migration, already correct direction |

---

## FASE 2: STABILIZE RENDER PIPELINE

### Goal
Make each render layer DETERMINISTIC — same schema input always produces same visual output.

### Debug Mode Flags
```typescript
// src/core/renderer/debug-config.ts
SHOW_LAYOUT_BOXES: boolean    // Show resolved block bounding boxes
SHOW_BLOCK_BOUNDS: boolean    // Show measured vs estimated height comparison
SHOW_MEASUREMENTS: boolean    // Show measurement commit queue activity
SHOW_SCENE_FLOW: boolean      // Show scene plan distribution
```

### Deterministic Pipeline
```
Schema mutation → commitSchemaUpdate() → version bump
  → PageRenderer detects schema change
    → SchemaScreenRenderer resolves layout
      → resolveSceneLayout() — PURE, deterministic
      → MeasuredBlock — reports actual DOM height
        → commitQueue — batches measurements
          → measurementVersion++ triggers re-resolution
            → Final layout is stable
```

### Validation
```typescript
validatePageInvariant() — runs at:
  - Store set() middleware (dev mode)
  - PageRenderer render (dev mode)
  - saveToStorage (both modes)
  - loadFromStorage (both modes)
  - loadFromDB (both modes)
  - Export pipeline (before generating HTML)
```

---

## FASE 3: SIMPLIFY UI STATE

### Goal
Formalize the document/ui/session/transient separation so no UI state leaks into document.

### State Layers
```
DocumentState  =  page.schema + page.bgColor (legacy compat)
                   Persisted, undoable, shareable

UIState        =  zoom, leftTab, tool, showGrid, panelOpen
                   NOT persisted (or minimally persisted)

SessionState   =  selectedBlockId, hoveredBlockId, editingBlockId,
                   selectedBlockIds, sceneIndex, canvasPreview, appMode
                   NOT persisted, per-session, cleared on reload

TransientState =  dragState, entranceBlockIds, measurementVersion
                   Component-local, not in store at all
```

### Cleanup Tasks
1. Audit all store fields — categorize each as document/ui/session/transient
2. Move session state fields from top-level store to session-slice (ALREADY DONE)
3. Ensure persistence-slice only saves document state (ALREADY DONE — only pages + ratioId)
4. Add session reset on page change (ALREADY DONE in goPage)
5. Remove UI state from undo/redo snapshots (Snapshot only has pages + currentPageIndex + ratioId)

---

## FILES MODIFIED (FASE 1)

| File | Change |
|------|--------|
| `src/core/schema/ensure-schema.ts` | Consolidated isSchemaPage() with dual-check (pageMode OR schema) |
| `src/store/canva/element-slice.ts` | Removed local isSchemaPage(), import from ensure-schema |
| `src/store/canva/persistence-slice.ts` | Fixed loadFromDB bgColor default to dark (PRIMITIVES.color.canvasBg) |

## KEY ARCHITECTURAL DECISIONS

1. **page.schema.blocks[] IS the single source of truth** — all else is derived/runtime/legacy
2. **pageMode discriminator** — 'schema' pages must have elements=[], 'elements' pages must have schema=undefined
3. **Schema mutation path** — ALL block changes go through updateSchemaBlock() → Immer produceWithPatches → commitSchemaUpdate
4. **Document purity** — assertDocumentPurity() ensures no runtime state leaks into schema
5. **Scene engine is layout authority** — resolveSceneLayout() is the ONLY source of block positions
6. **EditorProjectionStore is read-only projection** — writes go to schema first, projection derives from it
