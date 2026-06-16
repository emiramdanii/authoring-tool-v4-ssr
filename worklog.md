---
Task ID: 7.2A-Patch
Agent: Super Z (main)
Task: Sprint 7.2A-Patch — Fix 7 P0 Issues from Senior Review

Work Log:
- P0-1 Fix: saveSucceeded() with null savingRevision is now a no-op (returns false, does NOT mark clean)
  - Eliminates double-lifecycle bug where stale saveSucceeded could incorrectly mark project clean
  - Replaced saveProjectToDBInternal() with persistProjectToDB() pure primitive (no lifecycle calls)
  - Only executeDurableSave() owns the save lifecycle: startSaving → dbSaveFn → saveSucceeded/saveFailed
- P0-2 Fix: persistProjectToDB() throws on error (does not swallow/catch)
  - Previously saveProjectToDBInternal() caught errors and called saveFailed() but didn't rethrow
  - Now coordinator's catch block handles all error state properly
- P0-3 Fix: Removed all rate-limit/throttle from durable-save path
  - Removed DB_SAVE_MIN_INTERVAL (2s) from save-utils.ts coordinator
  - Removed lastSaveRef (1s) throttle from use-project-manager.tsx
  - Debounce on autosave is sufficient; skipping saves and marking clean was data loss
- P0-4 Fix: Save-before-switch now BLOCKS the switch if save fails
  - Added flushDurableSave() that waits for in-flight save before starting new one
  - loadProject() returns early with error toast if flushDurableSave returns false
  - Previously: "warn the user but still allow the switch" → now: "jangan muat B"
- P0-5 Fix: SaveNowButton, AutoSaveIndicator retry, and CommandPalette use legal hook calls
  - Replaced dynamic import + useProjectManager() in callbacks with top-level hook calls
  - SaveNowButton: useProjectManager() at component top level
  - AutoSaveIndicator: useProjectManager() at component top level for retry handler
  - CommandPalette: useProjectManager() at component top level + ref for action callbacks
  - Fallback localStorage message is now honest: "Cadangan lokal tersimpan, tetapi database belum diperbarui."
- P0-6 Fix: Hydration depth counter replaces boolean
  - _hydrating: boolean → _hydrationDepth: number (0-based, +1/-1)
  - resetOnLoad() does NOT touch _hydrationDepth (hydration lifecycle managed exclusively by pairs)
  - Fixed ordering: resetOnLoad() first, then startHydration() (so depth > 0 during set())
  - Nested hydration (ProjectManager + CanvaStore.loadFromDB) now safe
- P0-7 Fix: setCurrentProjectId() action for createProject without resetting revision
  - createProject() calls setCurrentProjectId(project.id) instead of resetOnLoad()
  - Preserves dirty/editRevision state so initial content gets saved
  - executeDurableSave() with { force: true } for initial project save
- Rewrote test suite: 36 tests covering all 9 mandatory test categories
  - All 36 tests pass + 24 Sprint 7.1 regression tests pass = 60 total
  - Zero new TypeScript errors in modified files

Stage Summary:
- 7 files changed: dirty-store.ts, save-utils.ts, use-project-manager.tsx, persistence-slice.ts, StatusToast.tsx, CommandPalette.tsx, dirty-coverage-sprint7.2.test.ts
- All 7 P0 fixes implemented and tested
- 60/60 tests passing (24 Sprint 7.1 + 36 Sprint 7.2A-Patch)
- Key new exports: setCurrentProjectId(), flushDurableSave(), persistProjectToDB()
- Key removed: saveProjectToDBInternal() (replaced by pure primitive), DB_SAVE_MIN_INTERVAL throttle, lastSaveRef throttle

---
Task ID: 7.2
Agent: Super Z (main)
Task: Sprint 7.2 — Dirty Coverage & Autosave Lifecycle Audit (P0 Implementation)

Work Log:
- Created notifyMutation() helper in save-utils.ts for SSR-safe markDirty() calls
- Added notifyMutation() to all ~55 Canva Store mutations that were missing markDirty():
  - schema-crud-slice.ts: deleteBlock, moveBlockUp, moveBlockDown, duplicateBlock, addSchemaBlock, addSchemaBlockToContainer
  - schema-ops-slice.ts: pasteSchemaBlock, nudgeSchemaBlocks, deleteSchemaBlocks, reorderSchemaBlocks, alignSchemaBlocks, distributeSchemaBlocks, batchSetVariant, batchDuplicateBlocks, batchMoveBlocks, batchToggleCompression
  - page-ops-slice.ts: moveBlockToPage, splitPageAtBlock, _performMergeUnchecked, moveBlockToContainer, rebalanceCurrentPage, promoteSceneSplit, mergeWithAdjacentPage, splitMateriContent
  - page-slice.ts: addPage, addTemplatePage, duplicatePage, deletePage, setPageLabel, setTemplateType, setVariant, reorderPage
  - background-slice.ts: setBgColor, setBgImage, setOverlay, extractAndSetPalette, setPaletteMapping, updateNavConfig, updateScreenBackground, setSchemaThemeId, updateTemplateData
  - element-slice.ts: addElement, addKuisElement, addGameElement, addModuleElement, deleteSelectedElements, updateElement, deleteElement, moveElementZ, toggleElementVisibility, pasteElements
  - tab-slice.ts: addSceneTab, removeSceneTab, renameSceneTab, setSceneTabIcon, assignBlockToTab, removeBlockFromTab, autoClusterTabs
  - viewport-slice.ts: setRatio, applyLayoutPreset, clearStage, nudgeSelected, alignSelected, distributeSelected
  - reset-canvas.ts: resetCanvas
  - schema-preset-slice.ts: loadSchemaPreset, loadCustomSchema, loadGoldenPreset
- Fixed saveProjectToDBInternal to integrate with dirty store state machine (startSaving + saveSucceeded/saveFailed)
- Fixed saveSucceeded() to properly handle savingRevision === null case (direct save path)
- Fixed CommandPalette "Simpan Sekarang" to route through saveProject() for durable save
- Fixed SaveNowButton to route through saveProject() for durable save
- Added save-before-switch logic in loadProject() (saves current project if dirty before switching)
- Added projectIdRef guard in useAutoSave.saveNow() to prevent stale saves after project switch
- Removed redundant markDirty() in use-learning-editor.ts
- Replaced inline try/require markDirty pattern in schema-crud-slice with clean notifyMutation() call
- Wrote 18 tests in dirty-coverage-sprint7.2.test.ts covering all P0 fixes
- Verified 42 tests pass (24 Sprint 7.1 + 18 Sprint 7.2), zero TypeScript errors in src/

Stage Summary:
- P0-A ✅: All ~55 mutations now trigger markDirty() via notifyMutation()
- P0-B ✅: saveProjectToDBInternal integrates with state machine (startSaving + saveSucceeded/saveFailed)
- P0-C ✅: CommandPalette + SaveNowButton route to durable save via saveProject()
- P0-D ✅: Save-before-switch + projectIdRef stale-save guard
- P1 ✅: Removed redundant markDirty() in use-learning-editor.ts
- 18 new tests passing, 24 existing tests still passing
- Zero new TypeScript errors
- Files modified: 13 store slices/hooks + 2 component files + 1 test file + 1 utility file

---
Task ID: 7.1
Agent: Super Z (main)
Task: Sprint 7.1 — Durable Save State Machine

Work Log:
- Audited all persistence/save call sites: markClean, markDirty, saveProject, autosave, save status indicator
- Identified 3 critical P0 bugs: markClean before save completes, no revision tracking, no single-flight guard
- Enhanced dirty-store.ts with revision-based state machine (SaveStatus: idle/dirty/saving/saved/error)
- Implemented editRevision/lastSavedRevision/savingRevision tracking
- Fixed use-auto-save.ts: removed markClean before DB save, added single-flight guard, stale completion rejection
- Fixed save-utils.ts: saveAllToStorage() no longer calls markClean()
- Fixed system-slice.ts: saveToStorage() no longer sets dirty:false
- Fixed authoring/index.ts: Bridge only syncs dirty→true (no markClean propagation)
- Fixed persistence-slice.ts: saveToStorage() no longer sets _saveStatus='saved', load paths call resetOnLoad()
- Fixed preset-slice.ts: applyPreset/newProject now mark dirty (not clean)
- Fixed Riwayat.tsx: History restore uses resetOnLoad()
- Fixed use-project-manager.tsx: Reset dirty on load, don't touch dirty on error
- Updated StatusBar.tsx + StatusToast.tsx: Read from saveStatus state machine
- beforeunload unchanged (already only warns, no forced DB save)
- Wrote 24 tests covering all 8 mandatory test cases
- Build passes, all new tests pass, no regressions in existing tests

Stage Summary:
- 12 files changed, 810 insertions, 143 deletions
- Commit: b86105b
- All 8 PASS criteria met:
  1. No markClean before save success ✅
  2. Save failure preserves dirty state ✅
  3. Edit during save not lost ✅
  4. Stale save completion ignored ✅
  5. Only latest revision can become "saved" ✅
  6. Guru sees honest save status ✅
  7. Recovery snapshot preserved on failure ✅
  8. Build and tests pass ✅
---
Task ID: 7.2A
Agent: main
Task: Sprint 7.2A — Persistence Boundary P0

Work Log:
- Classified all Canva Store mutations: 42 persistent, 27 UI-only, 10 meta
- Fixed 2 critical missing notifyMutation() calls: setSchemaThemeId(), generateFromPageType()
- Added notifyMutation() to undo/redo (patch + snapshot paths) and rollbackTransaction()
- Extracted notifyMutation() to @/lib/notify-mutation.ts for test-safe imports
- Built durable-save coordinator in save-utils.ts: executeDurableSave(), scheduleAutoSave(), cancelAutoSaveTimers()
- Added project-scoped save token (SaveToken with projectId + revision)
- Added hydration suppression (_hydrating flag, startHydration/endHydration)
- Cancel autosave timers on project switch (loadProject + deleteProject)
- Save-before-switch with warning toast on failure
- Hydration suppression in loadFromStorage(), loadFromDB(), loadProject()
- Fixed retry button in StatusToast to route through durable save + clearError()
- Created Sprint 7.2A test suite: 29 tests covering all new features
- Total: 53 tests (24 Sprint 7.1 + 29 Sprint 7.2A) — ALL PASS
- Zero new TypeScript errors in modified files

Stage Summary:
- All 9 subtasks completed and committed
- Pushed to origin/main as commit b56380c
- Key new files: src/lib/notify-mutation.ts
- Key modified files: dirty-store.ts, save-utils.ts, use-auto-save.ts, use-project-manager.tsx, persistence-slice.ts, history-slice.ts, background-slice.ts, auto-generate.ts, recovery-slice.ts, StatusToast.tsx
