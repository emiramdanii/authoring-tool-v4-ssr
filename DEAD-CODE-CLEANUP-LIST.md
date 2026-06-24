# DEAD-CODE-CLEANUP-LIST.md

## EDITOR-RESET-V2-PHASE-1 — Dead Code Cleanup List

| File/Fungsi | Kategori | Dipakai oleh | Risiko | Rekomendasi |
|---|---|---|---|---|
| mpi-editor/MpiEditorShell.tsx | OFFICIAL | Mode Guru (teacherMode=true, appMode=edit) | None — active route | KEEP_OFFICIAL |
| mpi-editor/MpiTopBar.tsx | OFFICIAL | MpiEditorShell | None | KEEP_OFFICIAL |
| mpi-editor/MpiSceneRail.tsx | OFFICIAL | MpiEditorShell | None | KEEP_OFFICIAL |
| mpi-editor/MpiCanvasPanel.tsx | OFFICIAL | MpiEditorShell | ResizeObserver sizing bisa clip | KEEP_OFFICIAL |
| mpi-editor/MpiInspector.tsx | BROKEN | MpiEditorShell | Placeholder only — no real edit wired. Guru tidak bisa edit konten. | REWRITE (sprint berikutnya: wire to GuidedFormEditor) |
| mpi-editor/MpiAddContentBar.tsx | OFFICIAL | MpiEditorShell | None | KEEP_OFFICIAL |
| mpi-editor/MpiStyleControl.tsx | OFFICIAL | MpiTopBar | applyStyleGlobal menulis ke semua pages — konflik dengan setSchemaThemeId (per-page) | MERGE_INTO_OFFICIAL_ROUTE (unify with setSchemaThemeId) |
| CanvaBuilder.tsx (old 3-panel) | LEGACY | Mode Lanjutan (teacherMode=false) | 15+ tombol confusing, IconRail, BottomPageStrip, SceneTabBar | QUARANTINE (keep but don't improve) |
| stage/index.tsx (Stage) | LEGACY | CanvaBuilder old editor | zoom/pan confusing, complex | QUARANTINE |
| toolbar/SceneTabBar.tsx | LEGACY | CanvaBuilder old editor | redundant with MpiSceneRail | QUARANTINE |
| BottomPageStrip.tsx | LEGACY | CanvaBuilder old editor | redundant with MpiSceneRail | QUARANTINE |
| LeftPanel.tsx | LEGACY | CanvaBuilder old editor | 4 tabs (templates/add-block/pages/settings) — too complex for guru | QUARANTINE |
| RightPanel.tsx | LEGACY | CanvaBuilder old editor | Block properties — needed for Advanced but not MPI | QUARANTINE |
| style/defaults.ts DEFAULT_PRESET_ID = 'academic-clean' | DANGEROUS FALLBACK | resolvePageStyleTokens, TokenResolver | Dark navy #0f172a fallback ketika themeId undefined. Cover hitam. | REWRITE (change default to 'modern-interactive') |
| CourseTemplateRegistry.ts getTemplateThemeId() returns 'default' | DANGEROUS FALLBACK | apply-template-to-store | Returns 'default' (dark) untuk semua template. apply-template-to-store override ke modern-interactive, tapi jika override gagal → dark. | REWRITE (change to 'modern-interactive') |
| lib/export/utils.ts TOKEN_COLORS (hardcoded dark) | DANGEROUS FALLBACK | renderPageHtml, renderBlockHtml (export HTML static) | Export HTML selalu dark terlepas dari themeId. Visual mismatch dengan editor/preview. | REWRITE (read themeId, use preset colors) |
| lib/export/html-templates.ts renderPageHtml() | OFFICIAL (but separate) | Export API route | Different renderer from PageRenderer (React). Visual mismatch risk. | MERGE_INTO_OFFICIAL_ROUTE (unify with PageRenderer mode=export) |
| export/ExportApp.tsx | OFFICIAL | Vite SSR export | Uses PageRenderer mode=export — correct path | KEEP_OFFICIAL |
| lib/use-vite-export.ts | OFFICIAL | useExportActions | Triggers /api/export or fallback | KEEP_OFFICIAL |
| core/style/page-style-adapter.ts resolvePageStyleTokens() | OFFICIAL | PageRenderer | Complex legacy + new preset resolution. Fallback to DEFAULT_PRESET_ID (dark) jika no themeId. | KEEP_OFFICIAL (but fix DEFAULT_PRESET_ID) |
| core/renderer/SchemaRenderer.tsx TokenResolver | OFFICIAL | PageFrame, all block renderers | Reads themeId, falls back to... unknown (need audit constructor) | KEEP_OFFICIAL (audit constructor default) |
| core/schema/schema-factory.ts createDefaultSchemaForTemplateType() | OFFICIAL | createPageFromPreset, all page creation | Sets themeId='modern-interactive' (PATCH-2D) — correct | KEEP_OFFICIAL |
| core/template/apply-template-to-store.ts | OFFICIAL | Dashboard, TemplateWizard | Syncs finalThemeId to both schema + templateData (PATCH-2E) — correct | KEEP_OFFICIAL |
| core/preset/PagePresetRegistry.ts createPageFromPreset() | OFFICIAL | addTemplatePage, reset-canvas | Calls createDefaultSchemaForTemplateType — correct | KEEP_OFFICIAL |
| store/canva/page-slice.ts addTemplatePage() | OFFICIAL | MpiAddContentBar | Calls createPageFromPreset — correct | KEEP_OFFICIAL |
| store/canva/page-slice.ts addPage() | LEGACY | MpiAddContentBar ('custom' only) | Creates blank page without schema — OK for "Halaman Kosong" | KEEP_OFFICIAL |
| store/canva/schema-crud-slice.ts addSchemaBlock() | OFFICIAL | MpiAddContentBar (Tambah Blok) | Adds block to current page schema — correct | KEEP_OFFICIAL |
| store/canva/background-slice.ts setSchemaThemeId() | LEGACY | StylePresetPicker (old editor) | Per-page theme set. Konflik dengan MpiStyleControl (global). | MERGE_INTO_OFFICIAL_ROUTE (unify global vs per-page) |
| components/canva/StylePresetPicker.tsx | LEGACY | RightPanel (old editor) | Per-page style. MpiStyleControl is global. | QUARANTINE |
| TeacherModeToggle.tsx | OFFICIAL | Old editor sidebar | Toggle teacherMode — correct | KEEP_OFFICIAL |
| import-export/import-export-component.tsx | LEGACY | AuthoringTool (Import/Export panel) | Import JSON — needed but not MPI Studio route | QUARANTINE (reconnect later) |
| Projects.tsx loadProject() | LEGACY | AuthoringTool (Projects panel) | Load from DB — needed but not MPI Studio route | QUARANTINE (reconnect later) |
| Dashboard.tsx | OFFICIAL | App entry | Template gallery + project creation — correct | KEEP_OFFICIAL |
| TemplateWizard.tsx | OFFICIAL | Dashboard | 4-step wizard — correct | KEEP_OFFICIAL |
| AuthoringTool.tsx | OFFICIAL | App shell | Routes to Dashboard/CanvaBuilder — correct | KEEP_OFFICIAL |
