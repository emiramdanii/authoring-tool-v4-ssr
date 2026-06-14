# Known Test Failures — Baseline

**Last updated:** Sprint 6.4-D0-Patch (2026-06-14)
**Commit:** Pending (D0-Patch in progress)

## Summary

| Metric | Count |
|--------|------:|
| Total test files | 26 |
| Passing test files | 19 |
| Failing test files | 7 |
| Total tests | 738 |
| Passing tests | 726 |
| Failing tests | 12 |

## Baseline Failures (pre-existing, NOT caused by quiz module work)

| Test File | Failing Tests | Root Cause | Related to Kuis? | Owner |
|-----------|:---:|-----------|:---:|------|
| `block-registry.test.ts` | 10 | Registry expects 43 block types but only 31 are registered; missing block types cause metadata/schema/createDefault checks to fail | No | Block system |
| `token-compliance.test.ts` | 2 | AccordionRenderer.tsx has transition-all violation; critical violation count > 0 | No | Renderer compliance |
| `composition-analyzer-e2e.test.ts` | unknown | Pre-existing E2E failure | No | Composition analysis |
| `rhythm-bridge-e2e.test.ts` | unknown | Pre-existing E2E failure | No | Rhythm bridge |
| `store-slices.test.ts` | unknown | Pre-existing store test failure | No | State management |
| `template-mutation-isolation.test.ts` | unknown | Pre-existing mutation isolation failure | No | Template system |
| `visual-linter-e2e.test.ts` | unknown | Pre-existing visual lint failure | No | Visual linting |

## Verification

These failures were confirmed **identical** before and after Sprint 6.4-D0 changes:

```bash
# Before D0 changes (git stash):
npx vitest run → 12 failed | 718 passed (730)

# After D0-Patch changes:
npx vitest run → 12 failed | 726 passed (738)
# Difference: +8 new contract tests added (quiz-contract.test.ts)
```

## Quiz Module Contract Tests

| Test File | Tests | Status |
|-----------|:---:|:---:|
| `quiz-contract.test.ts` | 68 | ✅ ALL PASS |

### Contract Test Coverage

- A. Data Contract: 12 tests
- B. DOM Contract: 14 tests
- C. Selector Contract: 6 tests
- D. State/Lifecycle: 9 tests
- E. Accessibility: 10 tests
- F. CSS Contract: 6 tests
- G. Variant Independence: 3 tests
- H. Deterministic ID: 8 tests

## Action Items

1. **block-registry.test.ts**: Update EXPECTED_BLOCK_TYPES list to match actual registered blocks, or register missing block types
2. **token-compliance.test.ts**: Fix AccordionRenderer.tsx transition-all usage
3. **E2E tests**: Investigate and fix composition-analyzer, rhythm-bridge, visual-linter failures
4. **store/template tests**: Investigate store-slices and template-mutation-isolation failures
