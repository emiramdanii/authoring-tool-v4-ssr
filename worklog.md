---
Task ID: 1
Agent: Main Agent
Task: Implement STANDAR UTAMA SILSE UI — Fix "Engine Canggih Tapi Output Hollow"

Work Log:
- Explored full codebase structure: types, renderers, template engine, layout engine, contract system
- Identified key issues: golden template not wired, duplicate LearningUnit types, require() crash, font size violations
- Wired up createPpknNormaGoldenProject() in CourseTemplateRegistry.createProjectFromTemplate() for 'modul-ppkn-vii' template
- Consolidated duplicate LearningUnit types: added `variant` field to canonical learning-unit.ts, updated PageSplitCompiler to import from canonical
- Fixed require() crash in getTemplateIntensityCurve() — replaced with static import
- Verified PageRenderer properly uses contract system (resolveContractStyle, GoldenPageRenderer, TokenResolver.applyContract)
- Verified SceneLayoutEngine cover isolation already fixed (zIndex:0 for cover-only pages)
- Audited 8 block renderers for STANDAR font size compliance
- Fixed 3 critical font size violations: CoverRenderer 12px→14px, NcGridRenderer 15px→16px, 14px→16px
- Verified 1280×720 fixed canvas system (computeSceneScale + scaleTransform) already working
- Build verified: npx next build compiled successfully

Stage Summary:
- **KEY FIX**: createPpknNormaGoldenProject() now used when 'modul-ppkn-vii' template selected — produces 17 STANDAR-compliant pages with real PPKn content instead of placeholder
- **Contract enforcement pipeline confirmed working**: TemplateThemeContract → resolveContractStyle() → TokenResolver.applyContract() → all accent tokens patched → typography scale enforced
- **GoldenPageRenderer** adds progress bar, phase badge, nav dots for all non-cover pages
- **Font minimums enforced**: body ≥20px, caption ≥16px, micro ≥14px
- **Cover isolation**: Cover pages use absolute positioning (full bleed), no other blocks allowed
- **5/8 renderers fully token-based** (Tp, Kuis, DefBox, Refleksi, Cover content text)
- **All builds pass** — no type errors in changed files

---
Task ID: 2
Agent: Main Agent
Task: Phase 1 — Schema Editing Foundation (applyGuidedSchemaPatch + helpers + deprecation)

Work Log:
- Audited full codebase: read authoring-store.ts, sync-projection.ts, schema-apply.ts, schema-crud-slice.ts, Konten.tsx, BlockPropertiesPanel, SchemaDrivenEditor
- Confirmed build passes (npx next build — 0 errors)
- Created STATUS.md as living tracking document with parking lot for discovered issues
- Created src/core/schema/guided-patch.ts with:
  - applyGuidedSchemaPatch() — single authoritative write path to schema
  - applyGuidedSchemaPatchBatch() — atomic multi-patch
  - applyGuidedSchemaPatchWithProjection() — patch + derive projection
  - getEditableSchemaBlocks() / getEditableSchemaBlocksByPageId() — list editable blocks
  - getSchemaBlockById() — find block by ID (including nested)
  - getGuidedEditorSchema() / hasGuidedEditor() — guided editor registry
  - GUIDED_EDITOR_REGISTRY — 12 block types with content-focused field definitions
  - OverflowPolicy: 'none' | 'warn' | 'auto-split' | 'reject'
- Exported all guided-patch types and functions from schema/index.ts barrel
- Added @deprecated JSDoc + runtime console.warn to sync-projection.ts functions:
  - syncKuisToSchema, syncDiskusiToSchema, syncRefleksiToSchema, syncMateriToSchema
- Build verified: npx next build compiled successfully

Stage Summary:
- **applyGuidedSchemaPatch()** is the new single write path — works on ANY page by pageId, deep merge, undo support, edit bus audit trail
- **Guided Editor Registry** covers 12 block types: cover, kuis, diskusi, refleksi, materi-section, def-box, nc-grid, tujuan-display, rangkuman, motivasi, petunjuk, penutup
- **sync-projection.ts functions are now deprecated** with @deprecated JSDoc + dev-mode console.warn
- **Phase 1 foundation complete** — ready for Phase 2 (Guided Form UI) and Phase 3 (Konten → Schema Navigator)
