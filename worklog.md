---
Task ID: 1
Agent: Main
Task: Wire golden template into app + Create LearningUnit types + Fix contract enforcement

Work Log:
- Analyzed full codebase: TemplateThemeContract, TokenResolver, CoverRenderer, SceneLayoutEngine, SchemaRenderer, PageRenderer, template-gallery
- Found ROOT CAUSE: golden template exists (norma-golden-schema.ts) but was NOT connected to the app
- Found secondary ROOT CAUSE: EduRenderingContext.hero() etc. ignore contract typography minimums
- Added GOLDEN_PRESET_MAP + loadGoldenPreset() to SchemaEngine.utils.ts
- Added loadGoldenPreset method to canva store (schema-preset-slice.ts)
- Updated template-gallery.ts: ppkn-norma presetId → 'norma-golden', 17 pages
- Updated TemplateGalleryPanel.tsx: golden preset loading path
- Updated canva types.ts: added loadGoldenPreset to CanvaState
- Created LearningUnit type system (src/core/template/compiler/LearningUnit.ts)
- Created PageSplitCompiler (src/core/template/compiler/PageSplitCompiler.ts)
- Created barrel export (src/core/template/compiler/index.ts)
- Fixed EduRenderingContext to enforce contract typography minimums via applyContractMinimum()
- Build passes successfully

Stage Summary:
- Golden template now loads via 'norma-golden' presetId
- Contract typography minimums enforced: body ≥ 20px, hero ≥ 48px, etc.
- LearningUnit types + PageSplitCompiler created for future AI-generated content
- Build succeeds with no new errors
