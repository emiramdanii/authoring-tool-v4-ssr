# Legacy-Disabled Directory

**Purpose**: Quarantine zone for legacy code that is NOT in the V5 runtime
import graph. Files here are preserved (not deleted) for reference and
potential future restoration, but are excluded from the active codebase.

## Quarantine Contract

1. **Files here are NOT imported by any V5 runtime code.**
   - Verified via `guard:no-legacy-runtime` (runtime import graph audit)
   - Verified via grep: no `src/` file outside `legacy-disabled/` imports these

2. **Files here are NOT deleted.**
   - `git mv` preserves history
   - Can be restored if needed (e.g., feature regression requires rollback)

3. **Files here may be imported by OTHER legacy files** (also in this dir).
   - Internal legacy-to-legacy imports are OK
   - Legacy-to-V5 imports are FORBIDDEN (would re-enter runtime graph)

4. **Tests for quarantined files are also moved here.**
   - If a test imports a quarantined file, the test is moved too
   - Quarantined tests are NOT run in CI

5. **Each quarantine batch is small (1-3 files/dirs).**
   - CI must pass 4/4 (test + types + build + e2e-smoke) after each batch
   - If CI fails, rollback immediately

## Quarantine Log

### Batch 12-01 (RC-FIXPACK-02 / Batch 12 — LEGACY-QUARANTINE-01)
- `src/hooks/use-unsaved-guard.ts` → `src/legacy-disabled/hooks/use-unsaved-guard.ts`
  - Reason: 0 importers in src/ (truly dead code)
- `src/components/shared/CrashRecoveryDialog.tsx` → `src/legacy-disabled/components/shared/CrashRecoveryDialog.tsx`
  - Reason: 0 importers (only mentioned in comment in RecoveryDialog.tsx)
- `src/components/canva/stage/` → `src/legacy-disabled/components/canva/stage/`
  - Reason: 7 files, only imported by CanvaBuilder (legacy, not in V5 runtime)

### Batch 12-02 (RC-FIXPACK-02 / Batch 12 — LEGACY-QUARANTINE-02)
- `src/components/canva/CanvaBuilder.tsx` → `src/legacy-disabled/components/canva/CanvaBuilder.tsx`
  - Reason: only imported by AuthoringTool (legacy, not in V5 runtime)
- `src/components/canva/mpi-editor/` (8 files) → `src/legacy-disabled/components/canva/mpi-editor/`
  - Reason: only imported by CanvaBuilder (now quarantined)
- `src/components/canva/right-panel/` (18+ files) → `src/legacy-disabled/components/canva/right-panel/`
  - Reason: only imported by CanvaBuilder (now quarantined)

**Fixups required**:
- `AuthoringTool.tsx`: updated 2 dynamic imports to point to new location
- All 50+ quarantined files: added `// @ts-nocheck` pragma (prevents tsc from
  checking files with broken relative imports — they're not in V5 runtime)
- `dataidx-9.0f-cleanup.test.ts`: updated grep to exclude `src/legacy-disabled/`
- `phase-1b-route-lock.test.ts`: updated path to new location (not in CI)

**Verification**: guard:no-legacy-runtime PASS, guard:contract-sync PASS,
TypeScript 0 errors, all 537 tests PASS (500 batch + 37 dataidx), CI 4/4 success.
