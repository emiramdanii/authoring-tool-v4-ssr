---
Task ID: 11A.4+11A.5
Agent: Main Agent
Task: FASE 11A.4 — Layout Integration + FASE 11A.5 — Visual Linter

Work Log:
- Verified VCS engine files exist on disk (TransitionRhythmEngine, CompositionAnalyzer, resolver, index.ts)
- Build clean, 444 tests passing at start
- Wired computePerBlockGaps into SchemaRenderer.tsx (main renderer pipeline):
  - Added import of computePerBlockGaps from VCS
  - Computed vcsPerBlockGaps via useMemo
  - Passed perBlockGaps to both computeScenePlan and resolveSceneLayout
- Wired computePerBlockGaps into scene-bridge.ts (rebalance pipeline)
- Wired computePerBlockGaps into page-ops-slice.ts (promote scene split pipeline)
- Fixed critical bug in SceneLayoutEngine.ts: perBlockGaps was being added AFTER block instead of BEFORE
  - Changed from `currentY += effectiveHeight + blockGap` to `currentY += gapBeforeThisBlock; ... currentY += effectiveHeight`
  - This correctly implements perBlockGaps[i] = gap BEFORE block i (0 for first block)
- Added 7 E2E integration tests for layout pipeline with VCS perBlockGaps
- Created VisualLinter.ts (FASE 11A.5):
  - lintVisual() — main entry point
  - lintFromResolvedVCS() — lint from pre-computed VCS
  - lintCategory() — filter warnings by category
  - getSmartSuggestion() — registry of smart suggestions per warning code
  - Cross-cutting synthesis: LINTER_DUAL_ISSUE, LINTER_SEQUENCE_ABNORMAL
  - Deduplication by code + targetId (keep highest severity)
  - Composite score: 40% composition + 35% rhythm + 25% preset fit
  - Letter grades: A (90+) B (75+) C (60+) D (40+) F (<40)
- Added Visual Linter types to types.ts (LinterCategory, LinterGrade, SmartSuggestion, etc.)
- Updated index.ts barrel exports for Visual Linter
- Added 11 Visual Linter tests
- Build: clean (0 errors)
- Tests: 462 passed (12 test files, excluding pre-existing store-slices bug)

Stage Summary:
- FASE 11A.4 COMPLETE: Rhythm engine fully wired into renderer pipeline (SchemaRenderer, scene-bridge, page-ops-slice)
- FASE 11A.5 COMPLETE: Visual Linter provides passive quality indicator + smart suggestions
- PerBlockGaps bug fixed: gaps now correctly placed BEFORE blocks (not after)
- Backward compatible: if perBlockGaps not provided, falls back to uniform BLOCK_GAP
- FASE 11A DONE (11A.6 was dropped by user)
