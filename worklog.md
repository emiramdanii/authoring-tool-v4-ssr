---
Task ID: 6
Agent: Main
Task: FASE 6 — Reliability + Recovery Layer implementation

Work Log:
- Scanned full codebase: understood existing recovery infrastructure (crash checkpoint, safe boot, patch history, etc.)
- Identified critical gaps: TransactionRollbackManager not integrated, periodic integrity not scheduled, crash checkpoints not called before dangerous ops, safe mode was only a banner
- Enhanced `src/core/recovery/index.ts` with:
  - `withCrashCheckpoint()` — wraps dangerous ops with automatic save/clear
  - `validateAndRepairPages()` — proactive validation + auto-repair
  - `computePagesHash()` — hash of all page schemas for integrity
  - `isFeatureAllowed()` / `SAFE_MODE_DISABLED_FEATURES` — feature gate system
  - `getTransactionState()` — store integration helper
- Created `src/store/canva/recovery-slice.ts` with:
  - `safeMode` state (reactive, synced with sessionStorage)
  - `enterSafeMode()` / `exitSafeMode()` — with toast notifications
  - `beginTransaction()` / `commitTransaction()` / `rollbackTransaction()` — wired to TransactionRollbackManager
  - `runIntegrityCheckNow()` — validate + repair all pages
  - `_pagesHashAtSave` — hash tracking for corruption detection
- Added RecoverySlice types to `src/store/canva/types.ts` (CanvaState interface)
- Wired recovery-slice into `src/store/canva/store.ts`
- Integrated `withCrashCheckpoint` into `src/core/schema/schema-apply/transaction-ops.ts`:
  - `commitSceneTransaction()` — wrapped with crash checkpoint
  - `promoteSceneSplitToPage()` — wrapped with crash checkpoint
  - `mergePagesTransaction()` — wrapped with crash checkpoint
- Enhanced `src/store/canva/persistence-slice.ts`:
  - Added `_schemaHash` to saved data for integrity verification
  - Added proactive `validateAndRepairPages()` on loadFromStorage
  - Added hash mismatch detection on load
  - Set `_pagesHashAtSave` in store after save
- Created `src/hooks/use-safe-mode.ts` — convenience hook for safe mode + feature gates
- Created `src/hooks/use-periodic-integrity-check.ts` — scheduled integrity check (5 min interval)
- Wired periodic check into `src/components/canva/CanvaAutoSaveSync.tsx`
- Created `SafeModeBlockGate` in `src/core/renderer/BlockErrorBoundary.tsx`:
  - Gates game blocks and other complex features in safe mode
  - Shows placeholder for disabled blocks
- Integrated `SafeModeBlockGate` into `SchemaBlockRenderer` in `SchemaRenderer.tsx`
- Updated `src/components/shared/SafeModeBanner.tsx` — reactive from store, exit confirmation dialog
- TypeScript: 0 errors after all changes

Stage Summary:
- FASE 6 fully implemented: Crash Recovery, Transaction Rollback, Schema Corruption Recovery, Snapshot Integrity Verification, Safe Mode Boot
- All 5 features integrated end-to-end: core modules → store slice → UI components → hooks
- Crash checkpoints now protect ALL dangerous multi-step operations (split, merge, commit)
- Proactive validation runs on every loadFromStorage + periodically every 5 minutes
- Hash-based integrity verification on save/load detects in-transit corruption
- Safe mode disables game blocks and complex features, with reactive banner + exit confirmation
- TypeScript compiles cleanly with 0 errors
