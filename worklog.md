---
Task ID: 1
Agent: Main Agent (Senior Dev)
Task: Fix SILSE v2.1 "ENGINE CANGGIH TAPI OUTPUT HOLLOW" — Hierarchy-based roadmap execution

Work Log:
- Re-evaluated roadmap after git pull — found many items already fixed from previous sessions
- Discovered CRITICAL BUG: Dual BlockDefinitionRegistry (legacy monolith .ts file overriding modular directory)
  - Webpack with moduleResolution:"bundler" resolves .ts file BEFORE directory/index.ts
  - Legacy file had only 28 block types (missing 9 new: gambar, timeline, compare, reveal, tabel, checklist, statistik, studi, materi-blok)
  - Legacy file also missing `hasTabs` capability field
  - Modular directory had all 37 block types with `hasTabs`
- Fixed by renaming legacy file to .legacy.bak → modular directory now resolves
- Fixed BlockSelectionOverlay.tsx hardcoded capabilities fallback → use DEFAULT_CAPABILITIES import
- Updated core/index.ts: added 22+ missing block type exports + PERSONALITY_CONFIG + BlockPersonality
- Fixed pre-existing LeftPanel.tsx error: added 'sisipkan' to LeftPanelTab union type
- Verified pipeline: addSchemaBlock() uses BLOCK_DEFINITIONS[blockType].createDefault() — works with all 37 types
- Verified renderers: all 40 renderer files exist, RENDERER_MAP has all 37 entries, SCENE_REGISTRY composes correctly
- Verified property schemas: all 9 new schemas exist in property-schemas.ts
- Final build: npx tsc --noEmit = ZERO ERRORS

Stage Summary:
- ROOT CAUSE FOUND & FIXED: Legacy BlockDefinitionRegistry.ts (28 types) was shadowing modular directory (37 types)
- All 6 layers verified: L0 ✅ L1 ✅ L2 ✅ L3 ✅ L4 ✅ L5 (deprioritized)
- Build: ZERO TypeScript errors
- Files changed:
  1. RENAMED: BlockDefinitionRegistry.ts → BlockDefinitionRegistry.legacy.bak
  2. EDITED: BlockSelectionOverlay.tsx (use DEFAULT_CAPABILITIES import)
  3. EDITED: core/index.ts (22+ type exports + PERSONALITY_CONFIG + BlockPersonality)
  4. EDITED: IconRail.tsx (added 'sisipkan' to LeftPanelTab)
