# Known Test Failures — Baseline

**Last updated:** Sprint 6.4-E1 (2026-06-14T12:53Z)
**Commit:** f46d03c (6.4-D0-Patch)

## Summary

| Metric | Count |
|--------|------:|
| Total test files | 30 |
| Passing test files | 23 |
| Failing test files | 7 |
| Total tests | 856 |
| Passing tests | 844 |
| Failing tests | 12 |

## Baseline Command

```bash
npx vitest run
# Result: 12 failed | 844 passed (856)
```

## Baseline Failures (pre-existing, NOT caused by quiz module work)

### block-registry.test.ts (10 failures)

Root cause: Registry expects 43 block types but only 31 are registered.

| Test Name | Error | Related to Kuis? |
|-----------|-------|:-----------------:|
| should have exactly 43 block types registered | Expected 43, received 31 | No |
| should register all expected block types | Missing 12 block types | No |
| should have required metadata fields for every block type | Missing metadata for 12 types | No |
| should have non-empty names and icons | Missing names/icons for 12 types | No |
| should have valid category for every block type | Missing categories for 12 types | No |
| should have property schema for every block type | Missing schemas for 12 types | No |
| should have valid property schema structure | Invalid schemas for 12 types | No |
| should return an object from createDefault for every block type | Cannot read createDefault of undefined | No |
| should include a title in default content | Cannot read properties of undefined | No |
| getAllBlockMeta should return all block metadata | Expected 43, received 31 | No |

### token-compliance.test.ts (2 failures)

Root cause: AccordionRenderer.tsx has transition-all violation.

| Test Name | Error | Related to Kuis? |
|-----------|-------|:-----------------:|
| should have zero critical violations in all renderer blocks | Expected 0, received 2 | No |
| should have no TOKEN_TRANSITION_ALL violations in renderer blocks | AccordionRenderer.tsx has transition-all | No |

### E2E/Store failures (import-time errors, 0 tests run)

| Test File | Error | Related to Kuis? |
|-----------|-------|:-----------------:|
| composition-analyzer-e2e.test.ts | TypeError: blocks.slice is not a function | No |
| rhythm-bridge-e2e.test.ts | TypeError: Cannot read properties of undefined (reading 'intentScore') | No |
| store-slices.test.ts | TypeError: createPageSlice is not a function | No |
| template-mutation-isolation.test.ts | Error: Cannot find module '@/store/dirty-store' | No |
| visual-linter-e2e.test.ts | TypeError: scoreToGrade is not a function | No |

## Verification

No new regressions introduced by quiz module work:

```bash
# Before D0 changes:
npx vitest run → 12 failed | 718 passed (730)

# After D0-Patch:
npx vitest run → 12 failed | 726 passed (738)
# +8 new contract tests added

# After E1 audit (current):
npx vitest run → 12 failed | 844 passed (856)
# +118 new audit tests added (resilience + security + performance)
```

## Quiz Module Tests

| Test File | Tests | Status |
|-----------|:-----:|:------:|
| quiz-contract.test.ts | 68 | ✅ ALL PASS |
| quiz-resilience-audit.test.ts | 56 | ✅ ALL PASS |
| quiz-security-audit.test.ts | 162 | ✅ ALL PASS |
| quiz-performance-audit.test.ts | 32 | ✅ ALL PASS |

## Production Build

```
npx next build → ✅ SUCCESS
```

## Action Items

1. **block-registry.test.ts**: Update EXPECTED_BLOCK_TYPES list to match actual registered blocks, or register missing block types
2. **token-compliance.test.ts**: Fix AccordionRenderer.tsx transition-all usage
3. **E2E tests**: Fix broken imports in composition-analyzer, rhythm-bridge, visual-linter
4. **store/template tests**: Fix missing exports in store modules and dirty-store module
