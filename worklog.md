# SILSE v2.1 — Worklog

---
Task ID: L0-L2
Agent: Main (Senior Dev)
Task: Fix "ENGINE CANGGIH TAPI OUTPUT HOLLOW" — hierarchy-based roadmap execution

Work Log:
- Re-verified codebase state after git pull — discovered L0 and L1 were already completed (9 block types in SchemaBlock union, BlockDefinitionRegistry, and RENDERER_MAP)
- Found ROOT CAUSE: createProjectFromTemplate() → createPageFromPreset() → ensurePageSchema() → TemplateAdapter.convertToSchema() → reads templateData: {} → HOLLOW OUTPUT
- Created schema-factory.ts: createDefaultSchemaForTemplateType() uses BLOCK_DEFINITIONS.createDefault() to produce populated schemas
- Rewrote createProjectFromTemplate() to use schema factory directly, bypassing TemplateAdapter
- Fixed SceneRegistry fallback: () => null → UnregisteredRenderer (dev-visible warning, silent in production)
- TypeScript check: PASSED (zero errors)
- Verified marketplace-templates.ts is FROZEN with its own schemaFactory — not affected

Stage Summary:
- L0 ✅: SchemaBlock union already has all 9 types; SceneRegistry fallback fixed
- L1 ✅: BlockDefinitionRegistry and RENDERER_MAP already complete
- L2 ✅: Pipeline FIXED — schema factory bridge created and integrated
- L3 ✅: TypeScript compiles cleanly
- L4 ✅: Property schemas exist in BlockDefinitionRegistry for all 33 types
- L5: DEPRIORITIZED per user directive

Key files changed:
- /home/z/my-project/src/core/schema/schema-factory.ts (NEW)
- /home/z/my-project/src/core/template/CourseTemplateRegistry.ts (MODIFIED)
- /home/z/my-project/src/core/registry/SceneRegistry.tsx (MODIFIED)
