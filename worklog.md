---
Task ID: 6.4-F
Agent: Main
Task: Sprint 6.4-F — Freeze / Legacy Export Removal Readiness Audit

Work Log:
- Audited all callers of exportClientSide/previewClientSide: ZERO production callers found
  - exportClientSide defined in use-vite-export.ts but never destructured by any component
  - previewClientSide same — zero callers
  - generateClientExportHtml only called inside deprecated functions and test/script files
- Removed legacy path from production code:
  - use-vite-export.ts: removed exportClientSide, previewClientSide, buildPayload, legacy imports
  - export/index.ts: gutted to single re-export of serializeForHtmlScript
  - Deleted src/lib/client-export.ts (dead code, 0 imports)
- Deleted 8 legacy renderer files in src/lib/export/:
  - html-templates.ts, styles.ts, scripts.ts, quiz-renderers.ts,
    block-renderers.ts, game-renderers.ts, navigation-renderers.ts, utils.ts
- Deleted 8 legacy test files:
  - quiz-contract.test.ts, rc-stabilization.test.ts, quiz-resilience-audit.test.ts,
    quiz-performance-audit.test.ts, quiz-boolean-context.test.ts,
    export-pipeline.test.ts, quiz-security-audit.test.ts, quiz-e1-qa.test.ts
- Deleted 2 legacy QA scripts:
  - generate-quiz-variant-qa.ts, generate-quiz-qa-html.ts
- Updated export-serialization-boundary.test.ts:
  - Removed generateClientExportHtml import and Section 7 (legacy path test)
  - Removed serializeForScriptLegacy helper and legacy comparison tests
  - Updated Section 7 (now production API simulation) to use serializeForHtmlScript
  - Added Section 10: serializer freeze guard (7 tests verifying each escape rule)
  - Total: 75 tests PASS
- Verified only one production export path remains: POST /api/export (Vite SSR)
  - All 3 API routes use serializeForHtmlScript (not JSON.stringify)
- Ran export build: PASS (1.9 MB template)
- Ran browser smoke test: security + round-trip PASS
- Added 5 freeze invariant rules to serialize-html-script.ts header
- Net deletion: -9659 lines across 22 files

Stage Summary:
- Commits: 90752c2 (legacy removal), afa3930 (freeze invariants)
- src/lib/export/ now contains only 2 files: index.ts (re-export) + serialize-html-script.ts (implementation)
- Single production export pipeline confirmed
- Serializer API frozen with documented invariants and regression guard tests
