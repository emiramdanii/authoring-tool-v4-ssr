# EDITOR-ROUTE-MAP.md

## EDITOR-RESET-V2-PHASE-1 — Route Map

### Tombol/Aksi → Kode Path

| Tombol/Aksi | Lokasi UI | File komponen | Handler/function | Store action | Output data | Renderer akhir | Status |
|---|---|---|---|---|---|---|---|
| Buat Paket MPI (Proyek Baru) | Dashboard sidebar | Dashboard.tsx → setWizardOpen(true) → TemplateWizard.tsx | handleCreate() | applyTemplateToStore() → useCanvaStore.setState({pages}) | pages[] dengan schema per page | PageRenderer (MPI atau Advanced) | OFFICIAL |
| Pilih template | Dashboard gallery | Dashboard.tsx | handleUseTemplate() → _applyTemplate() | applyTemplateToStore() | pages[] dari createProjectFromTemplate | PageRenderer | OFFICIAL |
| Gunakan Template | TemplateWizard dialog | TemplateWizard.tsx | handleCreate() | applyTemplateToStore() | pages[] | PageRenderer | OFFICIAL |
| Tambah Halaman (Kosong) | MPI Studio footer | MpiAddContentBar.tsx | handleAddPage('custom') | addPage() | blank page, no schema | PageRenderer | OFFICIAL |
| Tambah Cover | MPI Studio footer menu | MpiAddContentBar.tsx | handleAddPage('cover') | addTemplatePage('cover') | page dengan schema.blocks[0]=cover | CoverScreen → SchemaScreenRenderer | OFFICIAL |
| Tambah Petunjuk | MPI Studio footer menu | MpiAddContentBar.tsx | handleAddPage('petunjuk') | addTemplatePage('petunjuk') | page dengan schema.blocks[0]=petunjuk | PetunjukScreen | OFFICIAL |
| Tambah Tujuan | MPI Studio footer menu | MpiAddContentBar.tsx | handleAddPage('tujuan') | addTemplatePage('tujuan') | page dengan schema.blocks[0]=tujuan-display | TujuanScreen | OFFICIAL |
| Tambah Materi | MPI Studio footer menu | MpiAddContentBar.tsx | handleAddPage('materi') | addTemplatePage('materi') | page dengan schema.blocks[0]=materi-section | MateriScreen | OFFICIAL |
| Tambah Kuis | MPI Studio footer menu | MpiAddContentBar.tsx | handleAddPage('kuis') | addTemplatePage('kuis') | page dengan schema.blocks[0]=kuis | QuizScreen | OFFICIAL |
| Tambah Game | MPI Studio footer | MpiAddContentBar.tsx | handleAddGame() | addTemplatePage('game') | page dengan schema.blocks[0]=sortir-game | GameScreen | OFFICIAL |
| Tambah Blok | MPI Studio footer | MpiAddContentBar.tsx | handleAddBlock() | addSchemaBlock('materi-section') | block added to current page schema | MateriSectionRenderer | OFFICIAL |
| Style | MPI Studio toolbar | MpiStyleControl.tsx | applyStyleGlobal() | useCanvaStore.setState({pages: all with themeId}) | themeId di schema + templateData semua page | TokenResolver → PageRenderer | OFFICIAL |
| Preview | MPI Studio toolbar | MpiTopBar.tsx | handlePreview() | setAppMode('preview') | mode change | PreviewMode → PageRenderer mode=preview | OFFICIAL |
| Export HTML | MPI Studio toolbar | MpiTopBar.tsx | handleExport() | exportHtml() → useViteExport | POST /api/export → HTML string | renderPageHtml (STATIC, bukan React) | OFFICIAL |
| Mode Guru | Old sidebar | TeacherModeToggle.tsx | toggleTeacherMode() | setTeacherMode(true/false) | teacherMode flag | CanvaBuilder routes ke MpiEditorShell atau old editor | OFFICIAL |
| Mode Lanjutan | MPI Studio toolbar | MpiTopBar.tsx | handleAdvancedMode() | setTeacherMode(false) | teacherMode=false | CanvaBuilder → old 3-panel editor | OFFICIAL |
| Klik halaman di daftar kiri | MPI Studio left rail | MpiSceneRail.tsx | goPage(index) | useCanvaStore.setState({currentPageIndex}) | currentPageIndex change | PageRenderer re-renders | OFFICIAL |
| Klik block di canvas | MPI Studio canvas | PageRenderer (internal) | selectBlock(blockId) | useCanvaStore.setState({selectedBlockId}) | selectedBlockId | MpiInspector shows block info | OFFICIAL |
| Edit konten di inspector | MPI Studio right panel | MpiInspector.tsx | (PLACEHOLDER — no real edit) | none | none | none | **BROKEN** (placeholder only, no edit wired) |
| Import project | Import/Export panel | import-export-component.tsx | handleImportJSON() | migrateProjectDocument → useCanvaStore.setState | pages[] from imported JSON | PageRenderer | LEGACY |
| Load project lama | Projects panel | Projects.tsx | loadProject(id) | DB load → useCanvaStore.setState | pages[] from DB | PageRenderer | LEGACY |
| Klik halaman di BottomPageStrip | Old editor bottom | BottomPageStrip.tsx | goPage(index) | same as MpiSceneRail | same | PageRenderer | LEGACY (old editor only) |
| Klik tab di SceneTabBar | Old editor top | SceneTabBar.tsx | setActiveTabId() | useCanvaStore.setState({activeTabId}) | tab change | LeftPanel shows tab content | LEGACY (old editor only) |

### Konflik Jalur Ganda

| Fungsi | Jalur 1 (MPI Studio) | Jalur 2 (Old Editor) | Konflik? |
|---|---|---|---|
| Tambah halaman | addTemplatePage() via MpiAddContentBar | addPage() via LeftPanel | TIDAK — addTemplatePage dipatch juga addPage + schema |
| Navigasi halaman | goPage() via MpiSceneRail | goPage() via BottomPageStrip + SceneTabBar | TIDAK — same store action |
| Style | applyStyleGlobal() via MpiStyleControl (ALL pages) | setSchemaThemeId() via StylePresetPicker (CURRENT page only) | **YA** — MPI global vs old per-page |
| Export | exportHtml() via MpiTopBar | exportHtml() via ToolbarExport | TIDAK — same useExportActions |
| Canvas render | PageRenderer mode=canvas via MpiCanvasPanel | PageRenderer mode=canvas via Stage | TIDAK — same PageRenderer, different wrapper |
| Block edit | MpiInspector (PLACEHOLDER, no edit) | RightPanel → BlockProperties (full edit) | **YA** — MPI belum punya editor, old editor punya |
