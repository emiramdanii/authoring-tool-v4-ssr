# RECONNECT-ORDER.md

## EDITOR-RESET-V2-PHASE-1 — Reconnect Order

### Urutan Sambung Ulang

#### 1. Mode Guru (MPI Studio)
- **File**: mpi-editor/*.tsx (sudah ada)
- **Risiko**: MpiInspector placeholder (no edit). Style global vs per-page conflict.
- **Acceptance gate**: Guru bisa buat project, tambah halaman, pilih style, preview, export — tanpa switch ke Advanced.
- **Test wajib**: e2e/mpi-studio-ui-click.spec.ts, e2e/visual-gate-01.spec.ts
- **Status**: OFFICIAL_FIRST (sebagian besar sudah berfungsi, inspector perlu wire)

#### 2. Preview
- **File**: PreviewMode.tsx, PageRenderer.tsx mode=preview
- **Risiko**: Preview menggunakan PageRenderer (React) — aman, same engine.
- **Acceptance gate**: Preview menampilkan halaman dengan style yang sama dengan editor.
- **Test wajib**: e2e/visual-gate-01.spec.ts (preview screenshot test sudah ada)
- **Status**: OFFICIAL_FIRST (sudah berfungsi)

#### 3. Export HTML
- **File**: app/api/export/route.ts, export/ExportApp.tsx, lib/use-vite-export.ts
- **Risiko**: DUA export path (Vite SSR vs static HTML). Visual mismatch. TOKEN_COLORS hardcoded dark.
- **Acceptance gate**: Export HTML terlihat sama dengan preview (style, theme, layout).
- **Test wajib**: e2e test yang compare export HTML dengan preview screenshot.
- **Status**: NEEDS_DECISION (unify renderPageHtml dengan PageRenderer mode=export, atau fix TOKEN_COLORS)

#### 4. Advanced (Old Editor)
- **File**: CanvaBuilder.tsx, Stage, LeftPanel, RightPanel, SceneTabBar, BottomPageStrip
- **Risiko**: 15+ tombol, zoom/pan, per-page style. Bisa confusing untuk guru.
- **Acceptance gate**: Advanced bisa diakses via "Mode Lanjutan" di MPI Studio. Old editor berfungsi tanpa crash.
- **Test wajib**: e2e test Mode Lanjutan → old editor visible → back to MPI Studio.
- **Status**: QUARANTINE (keep, don't improve, reconnect later)

#### 5. Import / Project Lama
- **File**: import-export-component.tsx, Projects.tsx, migrateProjectDocument()
- **Risiko**: Project lama bisa bawa themeId undefined atau 'default' (dark). Migration needed.
- **Acceptance gate**: Import project lama → themeId otomatis di-migrate ke 'modern-interactive'.
- **Test wajib**: Import fixture dengan themeId='default' → verify schema.themeId='modern-interactive' after load.
- **Status**: RECONNECT_LATER

#### 6. Style Variants
- **File**: MpiStyleControl.tsx, style/preset-registry.ts
- **Risiko**: 6 presets tapi export HTML (static) tidak mengikuti themeId. Preview/export mismatch.
- **Acceptance gate**: Setiap style preset terlihat sama di editor, preview, dan export.
- **Test wajib**: Visual regression test per preset di editor + preview + export.
- **Status**: NEEDS_DECISION (fix export HTML theme awareness dulu)

#### 7. Blok Tambahan
- **File**: schema-crud-slice.ts addSchemaBlock(), BlockDefinitionRegistry
- **Risiko**: Block types di luar TEMPLATE_BLOCK_MAP (tp, alur, def-box, nc-grid, dll) bisa muncul dari import/manual add.
- **Acceptance gate**: Setiap block type yang ada di LAZY_RENDERER_MAP bisa di-add dan di-render tanpa crash.
- **Test wajib**: e2e test add setiap block type → render → no crash.
- **Status**: RECONNECT_LATER
