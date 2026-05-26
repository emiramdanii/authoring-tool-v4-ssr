---
Task ID: 1
Agent: Main
Task: Phase 1 — Dead System Purge

Work Log:
- Re-audited codebase with accurate file paths (previous audit had wrong paths)
- Verified actual import counts for all files under src/core/
- Deleted 7 dead files (1,511 lines): ENGINE_PRINCIPLES.ts, scene/index.ts, RendererLazy.tsx, DebugOverlay.tsx, debug-config.ts, blocks/index.ts, EduComponentShell.tsx
- Cleaned edu/index.ts barrel to remove EduComponentShell exports
- Verified zero broken imports after purge
- Build passes with no new errors

Stage Summary:
- 7 files deleted, ~1,511 lines removed
- No functional breakage — all deleted files had zero active consumers
- Key correction: SceneLayoutEngine.ts (core/scene/) and EduRenderingContext.ts (core/edu/) are ACTIVE, not dead

---
Task ID: 2
Agent: Main
Task: Phase 2 — Source of Truth Lockdown (marketplace side)

Work Log:
- Extended CourseTemplate interface with optional marketplace fields: coverGradient, previewBlocks, bsnpCompliant
- Added BLOCK_ICONS map + getBlockIcon() function to CTR (moved from marketplace-templates)
- Added PreviewBlockInfo + PreviewScreenInfo interfaces to CTR
- Added 6 marketplace template entries as CourseTemplate objects in CTR
- Added schema factory bridge: registerSchemaFactory() + getSchemaFactory() + auto-initialization from marketplace-templates
- Added helper functions: getSubjectLabel(), getSubjectListDetailed(), getTemplateBlockTypes()
- Updated SUBJECTS config with proper display labels and missing subjects (IPS, Informatika)
- Migrated TemplatePreviewThumbnail: import from CTR, null-safe access for optional fields
- Migrated TemplateMarketplace: full migration from MarketplaceTemplate → CourseTemplate, getSchemaFactory() for apply, getSubjectListDetailed() for filters, getTemplateBlockTypes() for block icons
- Fixed grade filter type mismatch (string vs number)
- Build passes with zero new errors in migrated files

Stage Summary:
- 2 consumers migrated (TemplatePreviewThumbnail, TemplateMarketplace)
- CTR now exports: CourseTemplate, PreviewBlockInfo, PreviewScreenInfo, getBlockIcon, getSchemaFactory, getSubjectLabel, getSubjectListDetailed, getTemplateBlockTypes
- Schema factories still bridge from marketplace-templates.ts (Phase 3 TODO: convert to presets)
- 3 gallery consumers remain on template-gallery.ts (Phase 3)
