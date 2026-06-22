# OFFICIAL-ROUTE-PROPOSAL.md

## EDITOR-RESET-V2-PHASE-1 — Official Route Proposal

### Route Target

```
Buat Paket MPI (Dashboard → TemplateWizard)
→ Generate halaman (applyTemplateToStore → createPageFromPreset → createDefaultSchemaForTemplateType)
→ Mode Guru / MPI Studio (MpiEditorShell)
→ Unified Stage (MpiCanvasPanel → PageRenderer mode=canvas)
→ Preview (setAppMode('preview') → PreviewMode → PageRenderer mode=preview)
→ Export HTML (exportHtml → /api/export → Vite SSR ExportApp → PageRenderer mode=export)
```

### Route Status

| Route | Status | Alasan |
|---|---|---|
| Dashboard → TemplateWizard → applyTemplateToStore | OFFICIAL_FIRST | Single creation path, schema-native pages, themeId synced |
| MPI Studio (MpiEditorShell) | OFFICIAL_FIRST | Teacher-friendly, 3-panel clean layout, no technical chrome |
| MpiCanvasPanel → PageRenderer mode=canvas | OFFICIAL_FIRST | Uses existing engine, ResizeObserver fit, no zoom/pan confusion |
| MpiSceneRail → goPage() | OFFICIAL_FIRST | Simple page list, friendly labels |
| MpiStyleControl → applyStyleGlobal() | OFFICIAL_FIRST | Global style (all pages), 6 presets |
| Preview → PreviewMode → PageRenderer mode=preview | OFFICIAL_FIRST | Existing preview engine, same PageRenderer |
| Export → /api/export → Vite SSR → PageRenderer mode=export | OFFICIAL_FIRST | Same PageRenderer engine, themeId-aware |
| MpiAddContentBar → addTemplatePage() | OFFICIAL_FIRST | Schema-native page creation via PresetRegistry |
| MpiAddContentBar → addSchemaBlock() | OFFICIAL_FIRST | Block addition to current page |
| MpiInspector (edit konten) | **NEEDS_DECISION** | Placeholder only — no real edit wired. Must wire to GuidedFormEditor. |
| Old 3-panel editor (CanvaBuilder) | QUARANTINE | Keep for Advanced mode, don't improve. Reconnect later. |
| Stage (zoom/pan) | QUARANTINE | Old editor only. Don't use in MPI Studio. |
| StylePresetPicker (per-page) | QUARANTINE | Old editor only. MpiStyleControl (global) replaces. |
| setSchemaThemeId() (per-page) | QUARANTINE | Old editor only. applyStyleGlobal() replaces. |
| renderPageHtml() (static HTML export) | **NEEDS_DECISION** | Different renderer from PageRenderer. Visual mismatch risk. Should unify or deprecate. |
| TOKEN_COLORS (hardcoded dark) | DELETE_CANDIDATE | Export HTML always dark. Should read themeId. |
| DEFAULT_PRESET_ID = 'academic-clean' (dark) | **NEEDS_DECISION** | Fallback to dark when themeId undefined. Should change to 'modern-interactive'. |
| getTemplateThemeId() returns 'default' | **NEEDS_DECISION** | Returns dark for all templates. Should return 'modern-interactive'. |
| Import/Export panel | RECONNECT_LATER | Needed but not MPI Studio route. |
| Projects panel (load from DB) | RECONNECT_LATER | Needed but not MPI Studio route. |

### Key Decisions Needed

1. **MpiInspector**: Wire to GuidedFormEditor (existing) or build new inline editor?
2. **renderPageHtml()**: Unify with PageRenderer mode=export, or keep as separate static HTML path?
3. **DEFAULT_PRESET_ID**: Change from 'academic-clean' (dark) to 'modern-interactive' (light)?
4. **getTemplateThemeId()**: Change from 'default' to 'modern-interactive'?
5. **TOKEN_COLORS**: Make theme-aware, or deprecate in favor of PageRenderer mode=export?
