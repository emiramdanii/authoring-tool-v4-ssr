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

### Batch 12-03 (LEGACY-QUARANTINE-03)
- `src/components/authoring/AuthoringTool.tsx` → `src/legacy-disabled/components/authoring/`
  - Reason: not imported by page.tsx (only in comments), legacy editor
- `src/core/shortcuts/` (9 files) → `src/legacy-disabled/core/shortcuts/`
  - Reason: only imported by AuthoringTool + use-keyboard-shortcuts (both legacy)
- `src/hooks/use-keyboard-shortcuts.ts` → `src/legacy-disabled/hooks/`
  - Reason: only imported by AuthoringTool (legacy)
- `src/hooks/use-health-monitor.ts` → `src/legacy-disabled/hooks/`
  - Reason: 0 importers (dead code)
- `src/components/shared/ShortcutHelpOverlay.tsx` → `src/legacy-disabled/components/shared/`
  - Reason: imported by layout.tsx but depends on quarantined shortcuts/. V5 doesn't use keyboard shortcuts.

**Cross-boundary contract**: After this batch, ZERO active src/ files import from src/legacy-disabled/. Previous batch had AuthoringTool importing from legacy-disabled — now AuthoringTool itself is quarantined.

**Fixups**: layout.tsx removed ShortcutHelpOverlay import + render. All moved files got @ts-nocheck.

### Batch 12-04 (LEGACY-QUARANTINE-04)
- `src/components/shared/AutoSaveRecovery.tsx` → `src/legacy-disabled/components/shared/`
  - Reason: only imported by layout.tsx, returns null in V5. V5 uses DashboardV5 resume card.
- `src/components/shared/RecoveryDialog.tsx` → `src/legacy-disabled/components/shared/`
  - Reason: 0 active runtime importers. Only imported by tests (all testing legacy recovery).
- 4 RecoveryDialog-specific test files → `src/legacy-disabled/__tests__/`
  - recovery-safe-boot, recovery-clean-boot-regression, recovery-dialog-a11y, recovery-boot-bridge
  - Removed from CI (test legacy RecoveryDialog, not V5 runtime)
- a11y-smoke.test.tsx: removed 4 RecoveryDialog test cases (8 tests remain)
- a11y-9.0d-audit.test.tsx: removed 2 RecoveryDialog test cases (28 tests remain)
- layout.tsx: removed AutoSaveRecovery import + render

### Batch 12-05 (LEGACY-QUARANTINE-05)
- `src/lib/export/html-templates.ts` → `src/legacy-disabled/lib/export/`
  - Reason: 0 runtime importers. Legacy export renderer (pre-Vite). V5 uses Vite export pipeline.
- `src/lib/client-export.ts` → `src/legacy-disabled/lib/export/`
  - Reason: 0 importers at all (fully dead code)
- `src/core/editor/boot-recovery.ts` → `src/legacy-disabled/core/editor/`
  - Reason: 0 runtime importers. RecoveryDialog (sole consumer) already quarantined in 12-04.
- performance-baseline-9.0e.test.ts → moved to legacy-disabled (tests legacy html-templates.ts)
- export-pipeline.test.ts → moved to legacy-disabled (also tests html-templates.ts)
- a11y-9.0d-audit.test.tsx: removed BootReport type import + makeBootReport helper
- commands/index.ts: commented out boot-recovery re-exports
- CI: commented out performance-baseline-9.0e entry

**Important**: Batch 12-05 removed the old export gate (performance-baseline-9.0e.test.ts)
from CI. Batch 12-06 restores it with a NEW test (batch12-06-v5-export-gate.test.ts)
that verifies the ACTIVE V5 Vite export pipeline instead of the legacy html-templates renderer.

### Batch 12-06 (V5-EXPORT-GATE-RESTORE-01)
This batch is NOT a quarantine batch. It restores the export gate that was
removed in Batch 12-05 by creating a new test that verifies the V5 Vite export
pipeline (not the legacy html-templates renderer).

New test: `src/__tests__/batch12-06-v5-export-gate.test.ts` (55 tests)
- Source audit: use-vite-export, API route, entry-client, ExportApp, vite config
- XSS safety: serializeForHtmlScript (script tag escaping, U+2028/2029, quotes)
- Template structure: export-output/index.html (root div, module script, size)
- Zod validation: API route schema, 400/413 responses, Content-Disposition
- No legacy imports: 6 V5 export files checked for legacy-disabled/html-templates/client-export
- Structural budget: no onerror/onload on scripts, no javascript: in href
- ExportPanelV5 integration: useExportActions wraps useViteExport, try/catch honesty
