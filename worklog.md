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
