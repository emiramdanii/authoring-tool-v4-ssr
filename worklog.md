---
Task ID: fix1-5
Agent: Main Agent
Task: Implement 5 critical fixes for "Engine Canggih Tapi Output Hollow" problem

Work Log:
- Analyzed full codebase: SceneLayoutEngine.ts, CoverRenderer.tsx, schema-factory.ts, TemplateThemeContract.ts, education-typography.ts, EduRenderingContext.ts, SchemaRenderer.tsx, PageRenderer.tsx, TemplateValidator.ts, TokenResolver (types.ts)
- Identified root causes: Cover invisible (zIndex:0 behind flow blocks), font too small (double-scaling: compact 0.85x × CSS viewport scale), multi-accent chaos (block.accentColor overrides contract), no structural chrome (progress bar, phase badge missing)
- Fix 1: Cover Page Isolation — Added coverIsolation logic in resolveSceneLayout() that filters out non-cover blocks when a full-page block exists. Updated isPureCoverPage detection in SchemaRenderer.
- Fix 2: Disable Compact Typography — Removed 0.85x compact factor from resolveEduTypographyCompact() and resolveEduTypographySceneCompact(). Also removed compactFactor=0.8 from estimateBlockHeight(). Compact mode now ONLY affects spacing, not font sizes.
- Fix 3: Golden Page Renderer — Created GoldenPageRenderer.tsx with progress bar, phase badge, nav dots, and page counter. Integrated into PageRenderer.tsx when golden contract is active.
- Fix 4: Stop Multi-Accent — Added tokens.resolveAccent() method that enforces contract's primaryAccentToken when contract is active. Applied to CoverRenderer, HeroRenderer, and DefBoxRenderer.
- Fix 5: Enhanced Validator — Added 4 new rules: cover-multi-block (elevated to ERROR), tp-overflow-risk, empty-materi-section (ERROR), multi-accent warning.

Stage Summary:
- All 5 fixes implemented and verified with successful Next.js build
- Key files modified: SceneLayoutEngine.ts, SchemaRenderer.tsx, education-typography.ts, CoverRenderer.tsx, HeroRenderer.tsx, DefBoxRenderer.tsx, TemplateValidator.ts, PageRenderer.tsx, types.ts (TokenResolver)
- Key file created: GoldenPageRenderer.tsx
- Build: PASS (no TypeScript errors in modified files)
